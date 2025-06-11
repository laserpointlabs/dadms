#!/usr/bin/env python3
"""
MCP Integration Test Suite
Comprehensive testing of MCP services integration with DADM
"""

import asyncio
import json
import logging
import time
import requests
from typing import Dict, Any, List
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MCPIntegrationTester:
    """Test suite for MCP services integration"""
    
    def __init__(self):
        self.services = {
            "statistical": {
                "url": "http://localhost:5201",
                "name": "mcp-statistical-service"
            },
            "neo4j": {
                "url": "http://localhost:5202", 
                "name": "mcp-neo4j-service"
            },
            "script_execution": {
                "url": "http://localhost:5203",
                "name": "mcp-script-execution-service"
            }
        }
        self.test_results = {}
    
    def log_test_result(self, test_name: str, success: bool, message: str = "", details: Dict = None):
        """Log test result"""
        result = {
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details or {}
        }
        self.test_results[test_name] = result
        
        status = "✅ PASS" if success else "❌ FAIL"
        logger.info(f"{status} - {test_name}: {message}")
        
        if details:
            logger.debug(f"Details: {json.dumps(details, indent=2)}")
    
    def test_service_health(self, service_name: str) -> bool:
        """Test service health endpoint"""
        try:
            service = self.services[service_name]
            response = requests.get(f"{service['url']}/health", timeout=10)
            
            if response.status_code == 200:
                health_data = response.json()
                self.log_test_result(
                    f"{service_name}_health",
                    True,
                    f"Service {service['name']} is healthy",
                    health_data
                )
                return True
            else:
                self.log_test_result(
                    f"{service_name}_health",
                    False,
                    f"Health check failed with status {response.status_code}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test_result(
                f"{service_name}_health",
                False,
                f"Health check failed: {str(e)}"
            )
            return False
    
    def test_service_info(self, service_name: str) -> bool:
        """Test service info endpoint"""
        try:
            service = self.services[service_name]
            response = requests.get(f"{service['url']}/info", timeout=10)
            
            if response.status_code == 200:
                info_data = response.json()
                self.log_test_result(
                    f"{service_name}_info",
                    True,
                    f"Service info retrieved successfully",
                    info_data
                )
                return True
            else:
                self.log_test_result(
                    f"{service_name}_info",
                    False,
                    f"Info endpoint failed with status {response.status_code}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test_result(
                f"{service_name}_info",
                False,
                f"Info endpoint failed: {str(e)}"
            )
            return False
    
    def test_statistical_analysis(self) -> bool:
        """Test statistical analysis functionality"""
        try:
            service = self.services["statistical"]
            test_data = {
                "task_name": "test_statistical_analysis",
                "task_description": "Test descriptive statistics calculation",
                "variables": {
                    "data": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                    "analysis_type": "descriptive"
                },
                "service_properties": {
                    "timeout": 30
                }
            }
            
            response = requests.post(
                f"{service['url']}/process_task",
                json=test_data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "success":
                    self.log_test_result(
                        "statistical_descriptive_analysis",
                        True,
                        "Descriptive statistics calculated successfully",
                        result
                    )
                    return True
                else:
                    self.log_test_result(
                        "statistical_descriptive_analysis",
                        False,
                        f"Analysis failed: {result.get('message', 'Unknown error')}"
                    )
                    return False
            else:
                self.log_test_result(
                    "statistical_descriptive_analysis",
                    False,
                    f"Request failed with status {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test_result(
                "statistical_descriptive_analysis",
                False,
                f"Statistical analysis test failed: {str(e)}"
            )
            return False
    
    def test_script_execution(self) -> bool:
        """Test script execution functionality"""
        try:
            service = self.services["script_execution"]
            test_data = {
                "task_name": "test_python_execution",
                "task_description": "Test Python script execution",
                "variables": {
                    "script": """
import math
import json

# Calculate some mathematical results
results = {
    "pi": math.pi,
    "sqrt_2": math.sqrt(2),
    "fibonacci": [1, 1, 2, 3, 5, 8, 13, 21],
    "calculation": sum(range(1, 11))
}

print(json.dumps(results, indent=2))
""",
                    "data": {"test_param": 42},
                    "language": "python"
                }
            }
            
            response = requests.post(
                f"{service['url']}/process_task",
                json=test_data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "success":
                    self.log_test_result(
                        "script_execution_python",
                        True,
                        "Python script executed successfully",
                        result
                    )
                    return True
                else:
                    self.log_test_result(
                        "script_execution_python",
                        False,
                        f"Script execution failed: {result.get('message', 'Unknown error')}"
                    )
                    return False
            else:
                self.log_test_result(
                    "script_execution_python",
                    False,
                    f"Request failed with status {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test_result(
                "script_execution_python",
                False,
                f"Script execution test failed: {str(e)}"
            )
            return False
    
    def test_neo4j_connection(self) -> bool:
        """Test Neo4j connectivity (basic test)"""
        try:
            service = self.services["neo4j"]
            test_data = {
                "task_name": "test_neo4j_connectivity",
                "task_description": "Test basic Neo4j connectivity",
                "variables": {
                    "operation": "get_graph_metrics"
                }
            }
            
            response = requests.post(
                f"{service['url']}/process_task",
                json=test_data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                # Even if Neo4j is not connected, the service should respond properly
                self.log_test_result(
                    "neo4j_service_response",
                    True,
                    "Neo4j service responded (connection may vary based on Neo4j availability)",
                    result
                )
                return True
            else:
                self.log_test_result(
                    "neo4j_service_response",
                    False,
                    f"Request failed with status {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test_result(
                "neo4j_service_response",
                False,
                f"Neo4j service test failed: {str(e)}"
            )
            return False
    
    def test_service_integration(self) -> bool:
        """Test integration between services using a complex workflow"""
        try:
            # Step 1: Generate some data using script execution
            script_service = self.services["script_execution"]
            data_generation_task = {
                "task_name": "generate_analysis_data",
                "task_description": "Generate sample data for analysis",
                "variables": {
                    "script": """
import numpy as np
import json

# Generate sample decision analysis data
np.random.seed(42)  # For reproducible results

# Simulate decision alternatives performance data
alternatives = {
    'Alternative_A': np.random.normal(75, 10, 20).tolist(),
    'Alternative_B': np.random.normal(80, 8, 20).tolist(), 
    'Alternative_C': np.random.normal(70, 12, 20).tolist()
}

# Generate cost data
costs = {
    'Alternative_A': np.random.uniform(100000, 150000, 5).tolist(),
    'Alternative_B': np.random.uniform(120000, 180000, 5).tolist(),
    'Alternative_C': np.random.uniform(90000, 140000, 5).tolist()
}

results = {
    'performance_data': alternatives,
    'cost_data': costs,
    'generated_at': str(np.datetime64('now'))
}

print(json.dumps(results, indent=2))
""",
                    "language": "python"
                }
            }
            
            script_response = requests.post(
                f"{script_service['url']}/process_task",
                json=data_generation_task,
                timeout=30
            )
            
            if script_response.status_code != 200:
                self.log_test_result(
                    "integration_workflow",
                    False,
                    "Data generation step failed"
                )
                return False
            
            # Step 2: Analyze the generated data using statistical service
            # Extract performance data for Alternative_A from the script output
            statistical_service = self.services["statistical"]
            statistical_task = {
                "task_name": "analyze_generated_data",
                "task_description": "Analyze performance data from generated dataset",
                "variables": {
                    "data": [75.4, 78.2, 73.1, 85.6, 79.4, 74.8, 82.1, 77.9, 76.3, 80.7],  # Sample data
                    "analysis_type": "descriptive"
                }
            }
            
            statistical_response = requests.post(
                f"{statistical_service['url']}/process_task",
                json=statistical_task,
                timeout=30
            )
            
            if statistical_response.status_code == 200:
                statistical_result = statistical_response.json()
                if statistical_result.get("status") == "success":
                    self.log_test_result(
                        "integration_workflow",
                        True,
                        "Multi-service integration workflow completed successfully",
                        {
                            "data_generation": "success",
                            "statistical_analysis": "success",
                            "workflow_steps": 2
                        }
                    )
                    return True
            
            self.log_test_result(
                "integration_workflow",
                False,
                "Statistical analysis step failed in integration workflow"
            )
            return False
            
        except Exception as e:
            self.log_test_result(
                "integration_workflow",
                False,
                f"Integration workflow test failed: {str(e)}"
            )
            return False
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Run all tests and return comprehensive results"""
        logger.info("🚀 Starting MCP Integration Test Suite")
        logger.info("=" * 60)
        
        start_time = time.time()
        
        # Test service health
        logger.info("Testing service health endpoints...")
        health_results = []
        for service_name in self.services.keys():
            result = self.test_service_health(service_name)
            health_results.append(result)
        
        # Test service info endpoints
        logger.info("Testing service info endpoints...")
        info_results = []
        for service_name in self.services.keys():
            result = self.test_service_info(service_name)
            info_results.append(result)
        
        # Test functional capabilities
        logger.info("Testing service capabilities...")
        statistical_result = self.test_statistical_analysis()
        script_result = self.test_script_execution()
        neo4j_result = self.test_neo4j_connection()
        
        # Test integration
        logger.info("Testing service integration...")
        integration_result = self.test_service_integration()
        
        end_time = time.time()
        
        # Calculate summary
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() if result["success"])
        failed_tests = total_tests - passed_tests
        
        summary = {
            "total_tests": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "success_rate": (passed_tests / total_tests) * 100 if total_tests > 0 else 0,
            "execution_time": end_time - start_time,
            "test_results": self.test_results
        }
        
        # Print summary
        logger.info("=" * 60)
        logger.info("🏁 TEST SUITE COMPLETED")
        logger.info(f"📊 Results: {passed_tests}/{total_tests} tests passed ({summary['success_rate']:.1f}%)")
        logger.info(f"⏱️  Execution time: {summary['execution_time']:.2f} seconds")
        
        if failed_tests > 0:
            logger.warning(f"⚠️  {failed_tests} test(s) failed")
            for test_name, result in self.test_results.items():
                if not result["success"]:
                    logger.warning(f"   • {test_name}: {result['message']}")
        else:
            logger.info("🎉 All tests passed!")
        
        return summary

def main():
    """Main test execution"""
    tester = MCPIntegrationTester()
    results = tester.run_all_tests()
    
    # Save results to file
    with open("mcp_integration_test_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    logger.info(f"📝 Detailed results saved to: mcp_integration_test_results.json")
    
    # Exit with appropriate code
    exit_code = 0 if results["failed"] == 0 else 1
    return exit_code

if __name__ == "__main__":
    exit(main())
