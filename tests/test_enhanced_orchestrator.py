"""
Performance comparison test for the EnhancedServiceOrchestrator vs. ServiceOrchestrator.

This script compares the performance of the enhanced orchestrator with the
current optimized implementation to quantify additional improvements.
"""
import os
import sys
import time
import json
import unittest
from unittest.mock import MagicMock, patch
import logging

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='enhanced_orchestrator_test.log'
)
logger = logging.getLogger(__name__)

from src.service_orchestrator import ServiceOrchestrator

# Backwards compatibility alias
EnhancedServiceOrchestrator = ServiceOrchestrator


# Mock task for testing
class MockTask:
    """Mock Camunda task for testing."""
    
    def __init__(self, activity_id, process_instance_id):
        self.activity_id = activity_id
        self.process_instance_id = process_instance_id
    
    def get_activity_id(self):
        return self.activity_id
    
    def get_process_instance_id(self):
        return self.process_instance_id


class TestEnhancedOrchestrator(unittest.TestCase):
    """Tests for EnhancedServiceOrchestrator vs ServiceOrchestrator."""
    
    def setUp(self):
        """Setup test environment."""
        # Create a test service registry
        self.test_registry = {
            "assistant": {
                "openai": {
                    "endpoint": "http://test-openai-service:5000"
                }
            }
        }
        
        # Setup HTTP session patch
        self.session_patcher = patch('requests.Session')
        self.mock_session_class = self.session_patcher.start()
        self.mock_session = MagicMock()
        self.mock_session_class.return_value = self.mock_session
        
        # Configure HTTP session responses
        self.configure_mock_session()
        
        # Create orchestrator instances
        self.original = ServiceOrchestrator(service_registry=self.test_registry, debug=True)
        self.enhanced = EnhancedServiceOrchestrator(service_registry=self.test_registry, debug=True)
    
    def tearDown(self):
        """Clean up after tests."""
        self.session_patcher.stop()
        if hasattr(self, 'original') and self.original:
            self.original.close()
        if hasattr(self, 'enhanced') and self.enhanced:
            self.enhanced.close()
    
    def configure_mock_session(self):
        """Configure mock HTTP session responses."""
        
        def mock_get_response(url, **kwargs):
            mock_response = MagicMock()
            mock_response.status_code = 200
            
            if "process-instance" in url:
                # Mock response for process instance lookup
                process_id = url.split('/')[-1]
                definition_id = f"test_process:{process_id.split(':')[0] if ':' in process_id else '1'}:123"
                mock_response.json.return_value = {"definitionId": definition_id}
            
            elif "process-definition" in url:
                # Mock response for process XML
                mock_response.json.return_value = {
                    "bpmn20Xml": """
                    <bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                                     xmlns:camunda="http://camunda.org/schema/1.0/bpmn">
                      <bpmn:process id="test_process">
                        <bpmn:serviceTask id="FrameTask">
                          <bpmn:documentation>Frame the problem</bpmn:documentation>
                          <bpmn:extensionElements>
                            <camunda:properties>
                              <camunda:property name="service.type" value="assistant" />
                              <camunda:property name="service.name" value="openai" />
                              <camunda:property name="model" value="gpt-4" />
                            </camunda:properties>
                          </bpmn:extensionElements>
                        </bpmn:serviceTask>
                        <bpmn:serviceTask id="AnalyzeTask">
                          <bpmn:documentation>Analyze the data</bpmn:documentation>
                          <bpmn:extensionElements>
                            <camunda:properties>
                              <camunda:property name="service.type" value="assistant" />
                              <camunda:property name="service.name" value="openai" />
                              <camunda:property name="model" value="gpt-4" />
                            </camunda:properties>
                          </bpmn:extensionElements>
                        </bpmn:serviceTask>
                        <bpmn:serviceTask id="DecideTask">
                          <bpmn:documentation>Make a decision</bpmn:documentation>
                          <bpmn:extensionElements>
                            <camunda:properties>
                              <camunda:property name="service.type" value="assistant" />
                              <camunda:property name="service.name" value="openai" />
                              <camunda:property name="model" value="gpt-4" />
                            </camunda:properties>
                          </bpmn:extensionElements>
                        </bpmn:serviceTask>
                        <bpmn:serviceTask id="RecommendTask">
                          <bpmn:documentation>Make recommendations</bpmn:documentation>
                          <bpmn:extensionElements>
                            <camunda:properties>
                              <camunda:property name="service.type" value="assistant" />
                              <camunda:property name="service.name" value="openai" />
                              <camunda:property name="model" value="gpt-4" />
                            </camunda:properties>
                          </bpmn:extensionElements>
                        </bpmn:serviceTask>
                      </bpmn:process>
                    </bpmn:definitions>
                    """
                }
            
            return mock_response
        
        # Configure mock GET
        self.mock_session.get.side_effect = mock_get_response
        
        # Configure mock POST
        mock_post_response = MagicMock()
        mock_post_response.status_code = 200
        mock_post_response.json.return_value = {
            "status": "success",
            "result": {
                "analysis": "Test analysis result",
                "recommendation": "Test recommendation",
                "processed_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "processed_by": "Mock Service",
                "task_name": "TestTask"
            }
        }
        self.mock_session.post.return_value = mock_post_response
    
    def test_single_task_performance(self):
        """Test performance for processing a single task."""
        task = MockTask("FrameTask", "process1")
        variables = {"input": "test"}
        
        # Warm up the caches
        self.original.route_task(task, variables)
        self.enhanced.route_task(task, variables)
        
        # Clear caches to start fresh
        self.original.clear_caches()
        self.enhanced.clear_caches()
        
        # Time the original implementation
        start = time.time()
        self.original.route_task(task, variables)
        original_time = time.time() - start
        
        # Time the enhanced implementation
        start = time.time()
        self.enhanced.route_task(task, variables)
        enhanced_time = time.time() - start
        
        print(f"\nSingle task performance:")
        print(f"Original: {original_time:.6f} seconds")
        print(f"Enhanced: {enhanced_time:.6f} seconds")
        print(f"Improvement: {(original_time - enhanced_time) / original_time * 100:.2f}%")
        
        return original_time, enhanced_time
    
    def test_workflow_sequence_performance(self):
        """Test performance for processing a sequence of tasks in a workflow."""
        task_sequence = [
            ("FrameTask", "process1"),
            ("AnalyzeTask", "process1"),
            ("DecideTask", "process1"),
            ("RecommendTask", "process1")
        ]
        
        tasks = [MockTask(activity_id, process_id) for activity_id, process_id in task_sequence]
        variables = {"input": "test"}
        
        # Clear caches to start fresh
        self.original.clear_caches()
        self.enhanced.clear_caches()
        
        # Time the original implementation
        start = time.time()
        for task in tasks:
            self.original.route_task(task, variables)
        original_time = time.time() - start
        
        # Clear caches for fair comparison
        self.original.clear_caches()
        self.enhanced.clear_caches()
        
        # Time the enhanced implementation
        start = time.time()
        for task in tasks:
            self.enhanced.route_task(task, variables)
        enhanced_time = time.time() - start
        
        print(f"\nWorkflow sequence performance (4 tasks):")
        print(f"Original: {original_time:.6f} seconds")
        print(f"Enhanced: {enhanced_time:.6f} seconds")
        print(f"Improvement: {(original_time - enhanced_time) / original_time * 100:.2f}%")
        
        return original_time, enhanced_time
    
    def test_repeated_workflow_performance(self):
        """Test performance when processing multiple instances of the same workflow."""
        # Create 5 workflows with the same structure
        workflows = []
        for i in range(5):
            workflow = [
                MockTask("FrameTask", f"process{i}"),
                MockTask("AnalyzeTask", f"process{i}"),
                MockTask("DecideTask", f"process{i}"),
                MockTask("RecommendTask", f"process{i}")
            ]
            workflows.append(workflow)
        
        variables = {"input": "test"}
        
        # Clear caches to start fresh
        self.original.clear_caches()
        self.enhanced.clear_caches()
        
        # Time the original implementation
        start = time.time()
        for workflow in workflows:
            for task in workflow:
                self.original.route_task(task, variables)
        original_time = time.time() - start
        
        # Clear caches for fair comparison
        self.original.clear_caches()
        self.enhanced.clear_caches()
        
        # Time the enhanced implementation
        start = time.time()
        for workflow in workflows:
            for task in workflow:
                self.enhanced.route_task(task, variables)
        enhanced_time = time.time() - start
        
        print(f"\nRepeated workflow performance (5 workflows, 20 tasks total):")
        print(f"Original: {original_time:.6f} seconds")
        print(f"Enhanced: {enhanced_time:.6f} seconds")
        print(f"Improvement: {(original_time - enhanced_time) / original_time * 100:.2f}%")
        
        return original_time, enhanced_time
    
    def test_batch_processing_performance(self):
        """Test performance of batch processing vs. individual task processing."""
        # Create 20 tasks (mix of task types)
        tasks = []
        for i in range(20):
            task_type = ["FrameTask", "AnalyzeTask", "DecideTask", "RecommendTask"][i % 4]
            tasks.append(MockTask(task_type, f"process{i // 4}"))
        
        variables = [{"input": f"test{i}"} for i in range(20)]
        
        # Clear caches
        self.original.clear_caches()
        self.enhanced.clear_caches()
        
        # Time processing tasks individually with original orchestrator
        start = time.time()
        for i, task in enumerate(tasks):
            self.original.route_task(task, variables[i])
        individual_time = time.time() - start
        
        # Clear caches
        self.original.clear_caches()
        self.enhanced.clear_caches()
        
        # Time batch processing with enhanced orchestrator
        start = time.time()
        self.enhanced.route_batch_tasks(tasks, variables)
        batch_time = time.time() - start
        
        print(f"\nBatch processing performance (20 tasks):")
        print(f"Individual processing: {individual_time:.6f} seconds")
        print(f"Batch processing: {batch_time:.6f} seconds")
        print(f"Improvement: {(individual_time - batch_time) / individual_time * 100:.2f}%")
        
        return individual_time, batch_time
    
    def test_xml_parsing_performance(self):
        """Test XML parsing performance between regex and ElementTree."""
        # Create tasks with different process IDs to force XML parsing
        tasks = [
            MockTask("FrameTask", f"process{i}") 
            for i in range(10)
        ]
        
        variables = {"input": "test"}
        
        # Clear caches
        self.original.clear_caches()
        self.enhanced.clear_caches()
        
        # Time the original implementation (regex parsing)
        start = time.time()
        for task in tasks:
            self.original.route_task(task, variables)
        original_time = time.time() - start
        
        # Clear caches
        self.original.clear_caches()
        self.enhanced.clear_caches()
        
        # Time the enhanced implementation (ElementTree parsing)
        start = time.time()
        for task in tasks:
            self.enhanced.route_task(task, variables)
        enhanced_time = time.time() - start
        
        print(f"\nXML parsing performance (10 different process XMLs):")
        print(f"Original (regex): {original_time:.6f} seconds")
        print(f"Enhanced (ElementTree): {enhanced_time:.6f} seconds")
        print(f"Improvement: {(original_time - enhanced_time) / original_time * 100:.2f}%")
        
        return original_time, enhanced_time
    
    def run_all_performance_tests(self):
        """Run all performance tests and generate a comprehensive report."""
        tests = [
            ("single_task", self.test_single_task_performance()),
            ("workflow_sequence", self.test_workflow_sequence_performance()),
            ("repeated_workflow", self.test_repeated_workflow_performance()),
            ("batch_processing", self.test_batch_processing_performance()),
            ("xml_parsing", self.test_xml_parsing_performance())
        ]
        
        # Calculate overall improvements
        total_original = sum(original for _, (original, _) in tests)
        total_enhanced = sum(enhanced for _, (_, enhanced) in tests)
        overall_improvement = (total_original - total_enhanced) / total_original * 100
        
        # Generate detailed report
        report = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "tests": {
                name: {
                    "original_time": original,
                    "enhanced_time": enhanced,
                    "improvement_percentage": (original - enhanced) / original * 100 if original > 0 else 0
                }
                for name, (original, enhanced) in tests
            },
            "overall": {
                "total_original_time": total_original,
                "total_enhanced_time": total_enhanced,
                "total_improvement_percentage": overall_improvement
            },
            "metrics": self.enhanced.get_metrics() if hasattr(self.enhanced, "get_metrics") else {}
        }
        
        # Save report to file
        with open("enhanced_orchestrator_report.json", "w") as f:
            json.dump(report, f, indent=2)
        
        print("\n" + "="*80)
        print("PERFORMANCE COMPARISON SUMMARY")
        print("="*80)
        print(f"Total original time: {total_original:.6f} seconds")
        print(f"Total enhanced time: {total_enhanced:.6f} seconds")
        print(f"Overall improvement: {overall_improvement:.2f}%")
        print("Detailed report saved to enhanced_orchestrator_report.json")
        
        return report


if __name__ == "__main__":
    # Run all tests and generate report
    test = TestEnhancedOrchestrator()
    test.setUp()
    try:
        report = test.run_all_performance_tests()
    finally:
        test.tearDown()
