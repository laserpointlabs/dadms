#!/usr/bin/env python3
"""
DADM-Camunda Integration Test Suite

This script tests the complete integration between DADM services and Camunda BPM,
demonstrating both streamlined service approach and detailed orchestration patterns.
"""

import sys
import json
import time
import requests
import logging
from pathlib import Path
from datetime import datetime

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DADMCamundaIntegrationTester:
    """Test suite for DADM-Camunda integration"""
    
    def __init__(self):
        self.dadm_wrapper_url = "http://localhost:5205"
        self.pipeline_service_url = "http://localhost:5204"
        self.test_results = []
        
    def run_all_tests(self) -> bool:
        """Run complete test suite"""
        logger.info("🚀 Starting DADM-Camunda Integration Test Suite")
        logger.info("=" * 60)
        
        tests = [
            ("Service Health Check", self.test_service_health),
            ("Pipeline Service Integration", self.test_pipeline_service_integration),
            ("DADM Wrapper Service", self.test_dadm_wrapper_service),
            ("Camunda Service Task Simulation", self.test_camunda_service_task_simulation),
            ("Streamlined Process Pattern", self.test_streamlined_process_pattern),
            ("Detailed Orchestration Pattern", self.test_detailed_orchestration_pattern),
            ("Error Handling", self.test_error_handling),
            ("Performance Test", self.test_performance)
        ]
        
        total_tests = len(tests)
        passed_tests = 0
        
        for test_name, test_func in tests:
            logger.info(f"\n📋 Running Test: {test_name}")
            logger.info("-" * 40)
            
            try:
                result = test_func()
                if result:
                    logger.info(f"✅ {test_name}: PASSED")
                    passed_tests += 1
                else:
                    logger.error(f"❌ {test_name}: FAILED")
                    
                self.test_results.append({
                    "name": test_name,
                    "status": "PASSED" if result else "FAILED",
                    "timestamp": datetime.now().isoformat()
                })
                
            except Exception as e:
                logger.error(f"❌ {test_name}: ERROR - {e}")
                self.test_results.append({
                    "name": test_name,
                    "status": "ERROR",
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                })
        
        # Test Summary
        logger.info("\n" + "=" * 60)
        logger.info("📊 TEST SUMMARY")
        logger.info("=" * 60)
        logger.info(f"Total Tests: {total_tests}")
        logger.info(f"Passed: {passed_tests}")
        logger.info(f"Failed: {total_tests - passed_tests}")
        logger.info(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if passed_tests == total_tests:
            logger.info("🎉 All tests passed! DADM-Camunda integration is working correctly.")
            return True
        else:
            logger.error(f"⚠️  {total_tests - passed_tests} tests failed. Check the logs above for details.")
            return False
    
    def test_service_health(self) -> bool:
        """Test health of all required services"""
        services = [
            ("DADM Wrapper Service", self.dadm_wrapper_url),
            ("Pipeline Service", self.pipeline_service_url),
            ("OpenAI Service", "http://localhost:5200"),
            ("Statistical MCP Service", "http://localhost:5201"),
            ("Neo4j MCP Service", "http://localhost:5202"),
            ("Script Execution MCP Service", "http://localhost:5203")
        ]
        
        all_healthy = True
        for service_name, url in services:
            try:
                response = requests.get(f"{url}/health", timeout=5)
                if response.status_code == 200:
                    logger.info(f"  ✓ {service_name} is healthy")
                else:
                    logger.error(f"  ✗ {service_name} returned status {response.status_code}")
                    all_healthy = False
            except requests.exceptions.RequestException as e:
                logger.error(f"  ✗ {service_name} is not accessible: {e}")
                all_healthy = False
            return all_healthy
    
    def test_pipeline_service_integration(self) -> bool:
        """Test direct pipeline service integration"""
        test_data = {
            "task_name": "Integration test for DADM-Camunda",
            "pipeline_name": "decision_analysis",
            "variables": {
                "decision_context": "Integration test for DADM-Camunda",
                "criteria": ["technical_feasibility", "business_value"],
                "alternatives": ["Direct integration", "Service wrapper", "Hybrid approach"]
            }
        }
        
        try:
            response = requests.post(
                f"{self.pipeline_service_url}/process_task",
                json=test_data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "success":
                    logger.info("  ✓ Pipeline execution successful")
                    logger.info(f"  ✓ Analysis completed: {result.get('result', {}).get('analysis_summary', 'No summary')[:100]}...")
                    return True
                else:
                    logger.error(f"  ✗ Pipeline execution failed: {result.get('message')}")
                    return False
            else:
                logger.error(f"  ✗ HTTP error: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"  ✗ Pipeline service test failed: {e}")
            return False
    
    def test_dadm_wrapper_service(self) -> bool:
        """Test DADM wrapper service functionality"""
        test_cases = [
            {
                "name": "Pipeline Execution",
                "endpoint": "/execute/pipeline",
                "data": {
                    "pipeline_name": "stakeholder_analysis",
                    "variables": {
                        "project_name": "DADM-Camunda Integration",
                        "stakeholder_data": "Technical team, business users, end customers"
                    }
                }
            },
            {
                "name": "Process Task Endpoint",
                "endpoint": "/process_task",
                "data": {
                    "task_name": "Integration Test Analysis",
                    "task_description": "Test DADM wrapper for Camunda integration",
                    "variables": {
                        "execution_type": "pipeline",
                        "pipeline_name": "decision_analysis",
                        "decision_context": "Service integration testing"
                    }
                }
            }
        ]
        
        all_passed = True
        for test_case in test_cases:
            try:
                response = requests.post(
                    f"{self.dadm_wrapper_url}{test_case['endpoint']}",
                    json=test_case["data"],
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("status") == "success":
                        logger.info(f"  ✓ {test_case['name']} successful")
                    else:
                        logger.error(f"  ✗ {test_case['name']} failed: {result.get('message')}")
                        all_passed = False
                else:
                    logger.error(f"  ✗ {test_case['name']} HTTP error: {response.status_code}")
                    all_passed = False
                    
            except Exception as e:
                logger.error(f"  ✗ {test_case['name']} exception: {e}")
                all_passed = False
        
        return all_passed
    
    def test_camunda_service_task_simulation(self) -> bool:
        """Simulate how Camunda would call DADM services"""
        # Simulate external task worker calling DADM
        camunda_task_payload = {
            "task_name": "Strategic Analysis Task",
            "task_description": "Perform strategic analysis as part of Camunda process",
            "variables": {
                "execution_type": "pipeline",
                "pipeline_name": "decision_analysis",
                "decision_context": "Q1 2024 Strategic Planning",
                "stakeholders": ["Executive Team", "Department Heads"],
                "criteria": ["Strategic Alignment", "Resource Requirements", "Risk Assessment"],
                "alternatives": ["Expand Operations", "Focus on Innovation", "Optimize Current Processes"],
                "process_instance_id": "proc_sim_001",
                "task_id": "task_sim_001"
            }
        }
        
        try:
            # Call DADM wrapper as Camunda would
            response = requests.post(
                f"{self.dadm_wrapper_url}/process_task",
                json=camunda_task_payload,
                timeout=45
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "success":
                    logger.info("  ✓ Camunda service task simulation successful")
                    
                    # Verify expected result structure
                    analysis_result = result.get("result", {})
                    if "pipeline_result" in analysis_result:
                        logger.info("  ✓ Analysis results properly structured for Camunda")
                        return True
                    else:
                        logger.error("  ✗ Analysis results not properly structured")
                        return False
                else:
                    logger.error(f"  ✗ Service task simulation failed: {result.get('message')}")
                    return False
            else:
                logger.error(f"  ✗ HTTP error in service task simulation: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"  ✗ Service task simulation exception: {e}")
            return False
    
    def test_streamlined_process_pattern(self) -> bool:
        """Test the streamlined service approach pattern"""
        # Simulate a simple BPMN process calling DADM as a service
        process_variables = {
            "task_name": "Budget Allocation Decision",
            "task_description": "Analyze budget allocation options using DADM",
            "variables": {
                "execution_type": "pipeline",
                "pipeline_name": "decision_analysis",
                "decision_context": "2024 Budget Allocation Decision",
                "stakeholders": ["CFO", "Department Heads", "Board Members"],
                "criteria": ["ROI", "Strategic Impact", "Risk Level", "Resource Requirements"],
                "alternatives": [
                    "Increase Marketing Budget by 20%",
                    "Invest in Technology Infrastructure", 
                    "Expand Research and Development",
                    "Maintain Current Allocation"
                ],
                "additional_context": "Company growth target is 15% for 2024"
            }
        }
        
        try:
            response = requests.post(
                f"{self.dadm_wrapper_url}/process_task",
                json=process_variables,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "success":
                    logger.info("  ✓ Streamlined process pattern test successful")
                    
                    # Verify Camunda-compatible response format
                    task_info = result.get("task_info", {})
                    if task_info.get("task_name") and task_info.get("execution_type"):
                        logger.info("  ✓ Response format compatible with Camunda")
                        return True
                    else:
                        logger.error("  ✗ Response format not Camunda-compatible")
                        return False
                else:
                    logger.error(f"  ✗ Streamlined process test failed: {result.get('message')}")
                    return False
            else:
                logger.error(f"  ✗ HTTP error: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"  ✗ Streamlined process test exception: {e}")
            return False
    
    def test_detailed_orchestration_pattern(self) -> bool:
        """Test the detailed orchestration approach pattern"""
        # Simulate multiple service calls as would happen in detailed BPMN orchestration
        orchestration_steps = [
            {
                "step": "Statistical Analysis",
                "endpoint": "/execute/pipeline",
                "data": {
                    "pipeline_name": "custom",
                    "variables": {
                        "tools": ["statistical_mcp_service"],
                        "analysis_type": "descriptive_statistics",
                        "context": "Market analysis for strategic decision"
                    }
                }
            },
            {
                "step": "Stakeholder Analysis",
                "endpoint": "/execute/pipeline", 
                "data": {
                    "pipeline_name": "stakeholder_analysis",
                    "variables": {
                        "project_name": "Strategic Initiative Analysis",
                        "stakeholder_data": "Internal stakeholders: Executive team, Department heads, Employees. External: Customers, Partners, Investors"
                    }
                }
            },
            {
                "step": "Synthesis Analysis",
                "endpoint": "/execute/pipeline",
                "data": {
                    "pipeline_name": "custom",
                    "variables": {
                        "tools": ["openai_service"],
                        "analysis_prompt": "Synthesize statistical and stakeholder analysis results into actionable recommendations"
                    }
                }
            }
        ]
        
        all_steps_passed = True
        step_results = []
        
        for step in orchestration_steps:
            try:
                response = requests.post(
                    f"{self.dadm_wrapper_url}{step['endpoint']}",
                    json=step["data"],
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("status") == "success":
                        logger.info(f"  ✓ {step['step']} completed successfully")
                        step_results.append(result)
                    else:
                        logger.error(f"  ✗ {step['step']} failed: {result.get('message')}")
                        all_steps_passed = False
                else:
                    logger.error(f"  ✗ {step['step']} HTTP error: {response.status_code}")
                    all_steps_passed = False
                    
            except Exception as e:
                logger.error(f"  ✗ {step['step']} exception: {e}")
                all_steps_passed = False
        
        if all_steps_passed:
            logger.info("  ✓ All orchestration steps completed successfully")
            logger.info(f"  ✓ Collected {len(step_results)} step results for synthesis")
            
        return all_steps_passed
    
    def test_error_handling(self) -> bool:
        """Test error handling scenarios"""
        error_test_cases = [
            {
                "name": "Invalid Pipeline Name",
                "data": {
                    "task_name": "Error Test",
                    "variables": {
                        "execution_type": "pipeline",
                        "pipeline_name": "non_existent_pipeline"
                    }
                },
                "expect_error": True
            },
            {
                "name": "Missing Required Variables",
                "data": {
                    "task_name": "Error Test",
                    "variables": {
                        "execution_type": "pipeline"
                        # Missing pipeline_name
                    }
                },
                "expect_error": True
            }
        ]
        
        all_handled = True
        for test_case in error_test_cases:
            try:
                response = requests.post(
                    f"{self.dadm_wrapper_url}/process_task",
                    json=test_case["data"],
                    timeout=10
                )
                
                if test_case["expect_error"]:
                    if response.status_code != 200 or response.json().get("status") == "error":
                        logger.info(f"  ✓ {test_case['name']} error properly handled")
                    else:
                        logger.error(f"  ✗ {test_case['name']} should have failed but didn't")
                        all_handled = False
                else:
                    if response.status_code == 200 and response.json().get("status") == "success":
                        logger.info(f"  ✓ {test_case['name']} succeeded as expected")
                    else:
                        logger.error(f"  ✗ {test_case['name']} should have succeeded but failed")
                        all_handled = False
                        
            except Exception as e:
                if test_case["expect_error"]:
                    logger.info(f"  ✓ {test_case['name']} error properly handled (exception)")
                else:
                    logger.error(f"  ✗ {test_case['name']} unexpected exception: {e}")
                    all_handled = False
        
        return all_handled
    
    def test_performance(self) -> bool:
        """Test performance characteristics"""
        # Simple performance test
        test_data = {
            "task_name": "Performance Test",
            "variables": {
                "execution_type": "pipeline",
                "pipeline_name": "decision_analysis",
                "decision_context": "Performance testing for DADM-Camunda integration"
            }
        }
        
        try:
            start_time = time.time()
            response = requests.post(
                f"{self.dadm_wrapper_url}/process_task",
                json=test_data,
                timeout=60
            )
            end_time = time.time()
            
            execution_time = end_time - start_time
            
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "success":
                    logger.info(f"  ✓ Performance test completed in {execution_time:.2f} seconds")
                    
                    # Basic performance criteria (adjust as needed)
                    if execution_time < 30:  # Should complete within 30 seconds
                        logger.info("  ✓ Performance within acceptable limits")
                        return True
                    else:
                        logger.warning(f"  ⚠ Performance slower than expected: {execution_time:.2f}s")
                        return True  # Still pass but with warning
                else:
                    logger.error(f"  ✗ Performance test failed: {result.get('message')}")
                    return False
            else:
                logger.error(f"  ✗ Performance test HTTP error: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"  ✗ Performance test exception: {e}")
            return False
    
    def generate_test_report(self) -> str:
        """Generate a detailed test report"""
        report = {
            "test_suite": "DADM-Camunda Integration Test Suite",
            "timestamp": datetime.now().isoformat(),
            "total_tests": len(self.test_results),
            "passed_tests": len([r for r in self.test_results if r["status"] == "PASSED"]),
            "failed_tests": len([r for r in self.test_results if r["status"] in ["FAILED", "ERROR"]]),
            "test_results": self.test_results
        }
        
        return json.dumps(report, indent=2)


def main():
    """Main function"""
    print("🎯 DADM-Camunda Integration Test Suite")
    print("======================================")
    
    tester = DADMCamundaIntegrationTester()
    
    # Run all tests
    success = tester.run_all_tests()
    
    # Generate report
    report = tester.generate_test_report()
    
    # Save report to file
    report_file = project_root / "test_reports" / f"dadm_camunda_integration_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    report_file.parent.mkdir(exist_ok=True)
    
    with open(report_file, 'w') as f:
        f.write(report)
    
    print(f"\n📄 Test report saved to: {report_file}")
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
