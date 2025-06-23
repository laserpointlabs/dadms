#!/usr/bin/env python3
"""
Test script for Enhanced Service Orchestrator and Workflow Composition Engine

This script tests:
1. Workflow Composition Engine functionality
2. Enhanced Service Orchestrator capabilities
3. Context-aware routing
4. Dynamic workflow generation
5. Workflow validation and optimization
"""

import os
import sys
import json
import time
import logging
from datetime import datetime
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_workflow_composition_engine():
    """Test the workflow composition engine"""
    print("\n🧪 Testing Workflow Composition Engine")
    print("=" * 50)
    
    try:
        from src.workflow_composition_engine import (
            WorkflowCompositionEngine, 
            ServiceTaskConfig,
            WorkflowComplexity
        )
        
        # Initialize engine
        engine = WorkflowCompositionEngine("config/workflow_templates")
        print("✅ Workflow Composition Engine initialized")
        
        # Test 1: Get available templates
        templates = engine.get_available_templates()
        print(f"✅ Found {len(templates)} workflow templates:")
        for template in templates:
            print(f"   - {template['name']}: {template['description']} ({template['complexity']})")
        
        # Test 2: Create workflow from description
        description = "Create a simple approval workflow for purchase requests"
        workflow_xml = engine.create_workflow_from_description(description, WorkflowComplexity.SIMPLE)
        print("✅ Generated workflow from description")
        print(f"   Generated XML length: {len(workflow_xml)} characters")
        
        # Test 3: Validate generated workflow
        validation_result = engine.validate_workflow_composition(workflow_xml)
        print(f"✅ Workflow validation: {'VALID' if validation_result.is_valid else 'INVALID'}")
        if validation_result.errors:
            print(f"   Errors: {validation_result.errors}")
        if validation_result.warnings:
            print(f"   Warnings: {validation_result.warnings}")
        if validation_result.suggestions:
            print(f"   Suggestions: {validation_result.suggestions}")
        
        # Test 4: Inject service task
        task_config = ServiceTaskConfig(
            task_id="CustomAnalysisTask",
            task_name="Custom Analysis",
            service_type="analytics",
            service_name="custom-analytics",
            documentation="Perform custom analysis on the data"
        )
        
        enhanced_xml = engine.inject_service_task(workflow_xml, task_config)
        print("✅ Injected service task into workflow")
        print(f"   Enhanced XML length: {len(enhanced_xml)} characters")
        
        # Test 5: Optimize workflow
        optimized_xml = engine.optimize_workflow(enhanced_xml)
        print("✅ Optimized workflow")
        print(f"   Optimized XML length: {len(optimized_xml)} characters")
        
        return True
        
    except Exception as e:
        print(f"❌ Workflow Composition Engine test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_enhanced_service_orchestrator():
    """Test the enhanced service orchestrator"""
    print("\n🧪 Testing Enhanced Service Orchestrator")
    print("=" * 50)
    
    try:
        from src.enhanced_service_orchestrator import (
            EnhancedServiceOrchestrator,
            WorkflowContext,
            RoutingDecision
        )
        from config.service_registry import get_service_registry
        
        # Initialize enhanced orchestrator
        registry = get_service_registry()
        orchestrator = EnhancedServiceOrchestrator(
            service_registry=registry,
            debug=True,
            enable_metrics=True
        )
        print("✅ Enhanced Service Orchestrator initialized")
        
        # Test 1: Get workflow templates
        templates = orchestrator.get_workflow_templates()
        print(f"✅ Available workflow templates: {len(templates)}")
        
        # Test 2: Create dynamic workflow
        description = "Analyze supplier options for emergency equipment procurement"
        workflow_xml = orchestrator.compose_dynamic_workflow(description)
        print("✅ Created dynamic workflow from description")
        
        # Test 3: Validate workflow
        validation = orchestrator.validate_workflow(workflow_xml)
        print(f"✅ Workflow validation: {'VALID' if validation.is_valid else 'INVALID'}")
        
        # Test 4: Test context-aware routing (mock task)
        class MockTask:
            def __init__(self, activity_id, process_instance_id):
                self.activity_id = activity_id
                self.process_instance_id = process_instance_id
            
            def get_activity_id(self):
                return self.activity_id
            
            def get_process_instance_id(self):
                return self.process_instance_id
            
            def get_task_id(self):
                return f"task_{self.activity_id}"
        
        # Create mock task
        mock_task = MockTask("TestAnalysis", "process_123")
        
        # Create workflow context
        context = WorkflowContext(
            process_instance_id="process_123",
            process_definition_id="TestProcess",
            business_context={"domain": "finance", "priority": "high"},
            performance_requirements={"high_throughput": True}
        )
        
        print("✅ Created workflow context and mock task")
        
        # Test 5: Get enhanced metrics  
        metrics = orchestrator.get_enhanced_metrics()
        print("✅ Retrieved enhanced metrics:")
        print(f"   Workflow composition templates: {metrics['workflow_composition']['available_templates']}")
        print(f"   Active contexts: {metrics['workflow_composition']['active_contexts']}")
        print(f"   Context routing enabled: {metrics['workflow_composition']['context_routing_enabled']}")
        
        # Test 6: Test workflow migration
        migrated_xml = orchestrator.migrate_workflow_version(workflow_xml, "2.0")
        print("✅ Migrated workflow to version 2.0")
        
        return True
        
    except Exception as e:
        print(f"❌ Enhanced Service Orchestrator test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_service_task_injection():
    """Test service task injection capabilities"""
    print("\n🧪 Testing Service Task Injection")
    print("=" * 50)
    
    try:
        from src.enhanced_service_orchestrator import EnhancedServiceOrchestrator
        from src.workflow_composition_engine import ServiceTaskConfig
        from config.service_registry import get_service_registry
        
        orchestrator = EnhancedServiceOrchestrator(
            service_registry=get_service_registry(),
            debug=True
        )
        
        # Create base workflow
        base_workflow = orchestrator.compose_dynamic_workflow(
            "Process customer feedback and generate insights"
        )
        
        # Define service tasks to inject
        service_tasks = [
            ServiceTaskConfig(
                task_id="SentimentAnalysis",
                task_name="Analyze Sentiment",
                service_type="analytics",
                service_name="sentiment-analyzer",
                documentation="Analyze the sentiment of customer feedback"
            ),
            ServiceTaskConfig(
                task_id="CategoryClassification",
                task_name="Classify Category",
                service_type="analytics", 
                service_name="category-classifier",
                documentation="Classify feedback into product categories"
            ),
            ServiceTaskConfig(
                task_id="InsightGeneration",
                task_name="Generate Insights",
                service_type="assistant",
                service_name="dadm-openai-assistant",
                documentation="Generate actionable insights from analyzed feedback"
            )
        ]
        
        # Inject service tasks
        enhanced_workflow = base_workflow
        for task_config in service_tasks:
            enhanced_workflow = orchestrator.inject_service_task_into_workflow(
                enhanced_workflow, task_config
            )
            print(f"✅ Injected service task: {task_config.task_name}")
        
        # Validate final workflow
        validation = orchestrator.validate_workflow(enhanced_workflow)
        print(f"✅ Final workflow validation: {'VALID' if validation.is_valid else 'INVALID'}")
        
        if validation.warnings:
            print(f"   Warnings: {len(validation.warnings)}")
        if validation.suggestions:
            print(f"   Suggestions: {len(validation.suggestions)}")
        
        # Optimize final workflow
        optimized_workflow = orchestrator.optimize_workflow(enhanced_workflow)
        print("✅ Optimized final workflow")
        print(f"   Final workflow size: {len(optimized_workflow)} characters")
        
        return True
        
    except Exception as e:
        print(f"❌ Service Task Injection test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_workflow_templates():
    """Test workflow template functionality"""
    print("\n🧪 Testing Workflow Templates")
    print("=" * 50)
    
    try:
        from src.workflow_composition_engine import WorkflowCompositionEngine
        
        engine = WorkflowCompositionEngine("config/workflow_templates")
        templates = engine.get_available_templates()
        
        print(f"✅ Loaded {len(templates)} templates:")
        
        for template in templates:
            print(f"\n📋 Template: {template['name']}")
            print(f"   Description: {template['description']}")
            print(f"   Complexity: {template['complexity']}")
            print(f"   Components: {template['component_count']}")
            
            # Test template composition
            if template['name'] in engine.templates:
                template_obj = engine.templates[template['name']]
                
                # Validate template XML
                validation = engine.validate_workflow_composition(template_obj.xml_template)
                print(f"   Validation: {'✅ VALID' if validation.is_valid else '❌ INVALID'}")
                
                if validation.errors:
                    print(f"   Errors: {validation.errors}")
                if validation.warnings:
                    print(f"   Warnings: {len(validation.warnings)} warnings")
        
        return True
        
    except Exception as e:
        print(f"❌ Workflow Templates test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def run_comprehensive_test():
    """Run all enhanced orchestrator tests"""
    print("🚀 DADM Enhanced Orchestrator Comprehensive Test")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    tests = [
        ("Workflow Composition Engine", test_workflow_composition_engine),
        ("Enhanced Service Orchestrator", test_enhanced_service_orchestrator),
        ("Service Task Injection", test_service_task_injection),
        ("Workflow Templates", test_workflow_templates)
    ]
    
    passed_tests = 0
    total_tests = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🧪 Running: {test_name}")
        try:
            if test_func():
                passed_tests += 1
                print(f"✅ {test_name}: PASSED")
            else:
                print(f"❌ {test_name}: FAILED")
        except Exception as e:
            print(f"❌ {test_name}: ERROR - {e}")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print(f"   Tests passed: {passed_tests}/{total_tests}")
    print(f"   Success rate: {(passed_tests/total_tests)*100:.1f}%")
    
    if passed_tests == total_tests:
        print("\n🎉 ALL TESTS PASSED!")
        print("✅ Enhanced Service Orchestrator is ready for production")
        print("\n🚀 NEXT STEPS:")
        print("   1. Deploy enhanced orchestrator in production")
        print("   2. Create custom workflow templates")
        print("   3. Implement context-aware routing rules")
        print("   4. Monitor enhanced performance metrics")
    else:
        print(f"\n⚠️  {total_tests - passed_tests} TESTS FAILED")
        print("🔧 TROUBLESHOOTING:")
        print("   1. Check workflow template directory")
        print("   2. Verify service registry configuration")
        print("   3. Review error logs for specific issues")
        print("   4. Ensure all dependencies are installed")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    success = run_comprehensive_test()
    sys.exit(0 if success else 1) 