#!/usr/bin/env python3
"""
MCP Services Integration Test
Comprehensive testing of DADM MCP services integration
"""

import asyncio
import json
import requests
import time
from typing import Dict, Any, List

class MCPIntegrationTester:
    """Test suite for MCP services integration with DADM"""
    def __init__(self):
        self.services = {
            "statistical": "http://localhost:5201",
            "neo4j": "http://localhost:5202", 
            "script_execution": "http://localhost:5203"
        }
        self.test_results = {}
    
    def test_service_health(self, service_name: str, service_url: str) -> Dict[str, Any]:
        """Test if a service is healthy and responding"""
        try:
            response = requests.get(f"{service_url}/health", timeout=10)
            if response.status_code == 200:
                health_data = response.json()
                return {
                    "status": "healthy",
                    "response_time_ms": response.elapsed.total_seconds() * 1000,
                    "health_data": health_data
                }
            else:
                return {
                    "status": "unhealthy", 
                    "status_code": response.status_code,
                    "error": response.text
                }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }
    
    def test_service_info(self, service_name: str, service_url: str) -> Dict[str, Any]:
        """Test service info endpoint"""
        try:
            response = requests.get(f"{service_url}/info", timeout=10)
            if response.status_code == 200:
                return {
                    "status": "success",
                    "info": response.json()
                }
            else:
                return {
                    "status": "error",
                    "status_code": response.status_code,
                    "error": response.text
                }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }
    
    def test_statistical_service(self, service_url: str) -> Dict[str, Any]:
        """Test statistical service with sample data"""
        test_data = {
            "task_name": "statistical_analysis_test",
            "task_description": "Test statistical analysis capabilities",
            "variables": {
                "data": [1.2, 2.3, 3.1, 2.8, 4.5, 3.9, 2.7, 3.8, 4.2, 3.5, 2.9, 4.1],
                "analysis_type": "descriptive"
            },
            "service_properties": {
                "service.type": "analytics",
                "service.name": "mcp-statistical-service"
            }
        }
        
        try:
            response = requests.post(
                f"{service_url}/process_task", 
                json=test_data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "status": "success",
                    "response_time_ms": response.elapsed.total_seconds() * 1000,
                    "result": result
                }
            else:
                return {
                    "status": "error",
                    "status_code": response.status_code,
                    "error": response.text
                }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }
    
    def test_neo4j_service(self, service_url: str) -> Dict[str, Any]:
        """Test Neo4j graph analytics service"""
        test_data = {
            "task_name": "graph_metrics_test",
            "task_description": "Test graph analytics capabilities",
            "variables": {
                "analysis_type": "graph_metrics"
            },
            "service_properties": {
                "service.type": "graph_analytics",
                "service.name": "mcp-neo4j-service"
            }
        }
        
        try:
            response = requests.post(
                f"{service_url}/process_task",
                json=test_data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "status": "success",
                    "response_time_ms": response.elapsed.total_seconds() * 1000,
                    "result": result
                }
            else:
                return {
                    "status": "error",
                    "status_code": response.status_code,
                    "error": response.text
                }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }
    
    def test_script_execution_service(self, service_url: str) -> Dict[str, Any]:
        """Test script execution service with Python script"""
        python_script = """
import numpy as np
import json

# Test decision scoring model
criteria_weights = [0.3, 0.4, 0.3]
alternatives = np.array([
    [0.8, 0.7, 0.9],  # Alternative A
    [0.9, 0.6, 0.8],  # Alternative B
    [0.7, 0.9, 0.7]   # Alternative C
])

scores = np.dot(alternatives, criteria_weights)
best_alternative = np.argmax(scores)

result = {
    "model": "decision_scoring_test",
    "alternatives": alternatives.tolist(),
    "criteria_weights": criteria_weights,
    "scores": scores.tolist(),
    "best_alternative": int(best_alternative),
    "best_score": float(scores[best_alternative])
}

print(json.dumps(result, indent=2))
"""
        test_data = {
            "task_name": "python_script_test",
            "task_description": "Test Python script execution",
            "variables": {
                "script_content": python_script,
                "execution_type": "python"
            },
            "service_properties": {
                "service.type": "computational",
                "service.name": "mcp-script-execution-service"
            }
        }
        
        try:
            response = requests.post(
                f"{service_url}/process_task",
                json=test_data,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "status": "success",
                    "response_time_ms": response.elapsed.total_seconds() * 1000,
                    "result": result
                }
            else:
                return {
                    "status": "error",
                    "status_code": response.status_code,
                    "error": response.text
                }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }
    
    def test_script_auto_generation(self, service_url: str) -> Dict[str, Any]:
        """Test script execution service auto-generation when no script_content provided"""
        
        # Test data for mathematical validation task (should auto-generate validation script)
        test_data = {
            "task_name": "mathematical_validation_task",
            "task_description": "Validate decision recommendation with statistical analysis",
            "variables": {
                "execution_type": "validation",
                "recommendation": '{"alternative": "Option A", "confidence_interval": "95% CI", "justification": "Best overall score"}',
                "analysis_results": {
                    "statistical_summary": {
                        "mean": 85.5,
                        "std": 12.3,
                        "sample_size": 50
                    }
                },
                "cost_estimates": [1000, 1500, 2000, 1200],
                "performance_scores": [85.5, 92.1, 78.9, 88.3],
                "reliability_ratings": [4.5, 4.2, 3.8, 4.7]
            },
            "service_properties": {
                "service.type": "computational",
                "service.name": "mcp-script-execution-service"
            }
        }
        
        try:
            response = requests.post(
                f"{service_url}/process_task",
                json=test_data,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "status": "success",
                    "response_time_ms": response.elapsed.total_seconds() * 1000,
                    "result": result,
                    "test_type": "auto_generation"
                }
            else:
                return {
                    "status": "error",
                    "status_code": response.status_code,
                    "error": response.text,
                    "test_type": "auto_generation"
                }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "test_type": "auto_generation"
            }
    
    def run_comprehensive_tests(self) -> Dict[str, Any]:
        """Run all tests and collect results"""
        print("Starting MCP Services Integration Tests...")
        start_time = time.time()
        
        for service_name, service_url in self.services.items():
            print(f"\n=== Testing {service_name.upper()} Service ===")
            service_results = {}
            
            # Health check
            print(f"Testing health endpoint...")
            health_result = self.test_service_health(service_name, service_url)
            service_results["health"] = health_result
            print(f"Health status: {health_result['status']}")
            
            # Info endpoint
            print(f"Testing info endpoint...")
            info_result = self.test_service_info(service_name, service_url)
            service_results["info"] = info_result
            print(f"Info status: {info_result['status']}")
            
            # Functional tests
            if health_result["status"] == "healthy":
                print(f"Testing functional capabilities...")
                
                if service_name == "statistical":
                    func_result = self.test_statistical_service(service_url)
                elif service_name == "neo4j":
                    func_result = self.test_neo4j_service(service_url)
                elif service_name == "script_execution":
                    func_result = self.test_script_execution_service(service_url)
                
                service_results["functional"] = func_result
                print(f"Functional test: {func_result['status']}")
            else:
                service_results["functional"] = {"status": "skipped", "reason": "service not healthy"}
                print("Functional test: skipped (service not healthy)")
            
            self.test_results[service_name] = service_results
        
        total_time = time.time() - start_time
        
        # Generate summary
        summary = {
            "total_services_tested": len(self.services),
            "healthy_services": sum(1 for r in self.test_results.values() if r["health"]["status"] == "healthy"),
            "functional_services": sum(1 for r in self.test_results.values() if r.get("functional", {}).get("status") == "success"),
            "total_test_time_seconds": total_time,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        return {
            "summary": summary,
            "detailed_results": self.test_results
        }
    
    def generate_test_report(self, results: Dict[str, Any]) -> str:
        """Generate a formatted test report"""
        report = []
        report.append("="*60)
        report.append("MCP SERVICES INTEGRATION TEST REPORT")
        report.append("="*60)
        report.append(f"Test completed at: {results['summary']['timestamp']}")
        report.append(f"Total test time: {results['summary']['total_test_time_seconds']:.2f} seconds")
        report.append("")
        
        # Summary
        summary = results['summary']
        report.append("SUMMARY:")
        report.append(f"  Services tested: {summary['total_services_tested']}")
        report.append(f"  Healthy services: {summary['healthy_services']}")
        report.append(f"  Functional services: {summary['functional_services']}")
        report.append("")
        
        # Detailed results
        for service_name, service_result in results['detailed_results'].items():
            report.append(f"{service_name.upper()} SERVICE:")
            
            # Health status
            health = service_result['health']
            report.append(f"  Health: {health['status']}")
            if health['status'] == 'healthy':
                report.append(f"    Response time: {health['response_time_ms']:.1f}ms")
            elif 'error' in health:
                report.append(f"    Error: {health['error']}")
            
            # Info status
            info = service_result['info']
            report.append(f"  Info: {info['status']}")
            if info['status'] == 'success' and 'info' in info:
                capabilities = info['info'].get('capabilities', [])
                report.append(f"    Capabilities: {len(capabilities)} listed")
            
            # Functional status
            functional = service_result.get('functional', {})
            report.append(f"  Functional: {functional.get('status', 'not tested')}")
            if functional.get('status') == 'success':
                report.append(f"    Response time: {functional['response_time_ms']:.1f}ms")
            elif 'error' in functional:
                report.append(f"    Error: {functional['error']}")
            
            report.append("")
        
        return "\n".join(report)

def main():
    """Main test execution"""
    tester = MCPIntegrationTester()
    
    print("MCP Services Integration Tester")
    print("This will test all MCP services for health, info, and functionality")
    print("Make sure all services are running before starting tests\n")
    
    # Run tests
    results = tester.run_comprehensive_tests()
    
    # Generate and display report
    report = tester.generate_test_report(results)
    print("\n" + report)
    
    # Save results to file
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    results_file = f"mcp_test_results_{timestamp}.json"
    report_file = f"mcp_test_report_{timestamp}.txt"
    
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    with open(report_file, 'w') as f:
        f.write(report)
    
    print(f"\nDetailed results saved to: {results_file}")
    print(f"Test report saved to: {report_file}")
    
    # Return exit code based on test success
    healthy_count = results['summary']['healthy_services']
    functional_count = results['summary']['functional_services']
    total_count = results['summary']['total_services_tested']
    
    if healthy_count == total_count and functional_count == total_count:
        print("\n✅ All tests passed!")
        return 0
    else:
        print(f"\n❌ Some tests failed. {functional_count}/{total_count} services fully functional.")
        return 1

if __name__ == "__main__":
    exit(main())
