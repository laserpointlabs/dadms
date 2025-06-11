#!/usr/bin/env python3
"""
MCP Integration Test Suite
Comprehensive testing of all MCP services for DADM integration
"""

import json
import requests
import time
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mcp-integration-test")

class MCPIntegrationTester:
    """Test suite for MCP services integration"""
    
    def __init__(self):
        self.services = {
            "statistical": {"url": "http://localhost:5201", "name": "MCP Statistical Service"},
            "neo4j": {"url": "http://localhost:5202", "name": "MCP Neo4j Service"},
            "script_execution": {"url": "http://localhost:5203", "name": "MCP Script Execution Service"}
        }
        self.test_results = {}
    
    def test_service_health(self, service_name: str) -> bool:
        """Test service health endpoint"""
        service = self.services[service_name]
        try:
            response = requests.get(f"{service['url']}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                logger.info(f"✅ {service['name']} health check passed")
                logger.info(f"   Status: {data.get('status')}")
                logger.info(f"   Version: {data.get('version')}")
                return True
            else:
                logger.error(f"❌ {service['name']} health check failed: HTTP {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"❌ {service['name']} health check failed: {e}")
            return False
    
    def test_service_info(self, service_name: str) -> bool:
        """Test service info endpoint"""
        service = self.services[service_name]
        try:
            response = requests.get(f"{service['url']}/info", timeout=10)
            if response.status_code == 200:
                data = response.json()
                logger.info(f"✅ {service['name']} info endpoint working")
                logger.info(f"   Capabilities: {len(data.get('capabilities', []))}")
                return True
            else:
                logger.error(f"❌ {service['name']} info endpoint failed: HTTP {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"❌ {service['name']} info endpoint failed: {e}")
            return False
    
    def test_statistical_service(self) -> bool:
        """Test statistical analysis capabilities"""
        logger.info("🧮 Testing Statistical Service...")
        
        test_payload = {
            "task_name": "statistical_analysis_test",
            "task_description": "Test statistical analysis of sample data",
            "variables": {
                "data": [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
                "analysis_type": "descriptive"
            }
        }
        
        try:
            response = requests.post(
                f"{self.services['statistical']['url']}/process_task",
                json=test_payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "success":
                    logger.info("✅ Statistical analysis test passed")
                    logger.info(f"   Data points processed: {result['result'].get('data_points')}")
                    logger.info(f"   Processing time: {result['result'].get('processing_time_ms')}ms")
                    return True
                else:
                    logger.error(f"❌ Statistical analysis failed: {result.get('message')}")
                    return False
            else:
                logger.error(f"❌ Statistical service test failed: HTTP {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"❌ Statistical service test failed: {e}")
            return False
    
    def test_neo4j_service(self) -> bool:
        """Test Neo4j graph analytics capabilities"""
        logger.info("🕸️  Testing Neo4j Service...")
        
        test_payload = {
            "task_name": "graph_analysis_test",
            "task_description": "Test graph metrics calculation",
            "variables": {
                "analysis_type": "graph_metrics"
            }
        }
        
        try:
            response = requests.post(
                f"{self.services['neo4j']['url']}/process_task",
                json=test_payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "success":
                    logger.info("✅ Neo4j graph analysis test passed")
                    logger.info(f"   Processing time: {result['result'].get('processing_time_ms')}ms")
                    return True
                else:
                    logger.error(f"❌ Neo4j analysis failed: {result.get('message')}")
                    return False
            else:
                logger.error(f"❌ Neo4j service test failed: HTTP {response.status_code}")
                return False        
        except Exception as e:
            logger.error(f"❌ Neo4j service test failed: {e}")
            return False
    
    def test_script_execution_service(self) -> bool:
        """Test script execution capabilities"""
        logger.info("📝 Testing Script Execution Service...")
        
        test_payload = {
            "task_name": "script_execution_test",
            "task_description": "Test Python script execution",
            "variables": {
                "execution_type": "python",
                "script_content": "import math\nresult = math.sqrt(16)\nprint(f'Square root of 16 is: {result}')",
                "parameters": {"test_value": 16}
            }
        }
        
        try:
            response = requests.post(
                f"{self.services['script_execution']['url']}/process_task",
                json=test_payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "success":
                    logger.info("✅ Script execution test passed")
                    logger.info(f"   Processing time: {result['result'].get('processing_time_ms')}ms")
                    return True
                else:
                    logger.error(f"❌ Script execution failed: {result.get('message')}")
                    return False
            else:
                logger.error(f"❌ Script execution service test failed: HTTP {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"❌ Script execution service test failed: {e}")
            return False
    
    def test_mathematical_models(self) -> bool:
        """Test execution of mathematical models"""
        logger.info("🔢 Testing Mathematical Models...")
          # Test decision scoring model
        test_payload = {
            "task_name": "decision_scoring_test",
            "task_description": "Test multi-criteria decision analysis",
            "variables": {
                "execution_type": "python",
                "script_content": """
import sys
sys.path.append('/app/scripts')
from mathematical_models import example_decision_scoring
import json

result = example_decision_scoring()
print(json.dumps(result, indent=2))
""",
                "parameters": {"timeout": 45}
            }
        }
        
        try:
            response = requests.post(
                f"{self.services['script_execution']['url']}/process_task",
                json=test_payload,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "success":
                    logger.info("✅ Mathematical models test passed")
                    return True
                else:
                    logger.error(f"❌ Mathematical models test failed: {result.get('message')}")
                    return False
            else:
                logger.error(f"❌ Mathematical models test failed: HTTP {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"❌ Mathematical models test failed: {e}")
            return False
    
    def run_all_tests(self) -> bool:
        """Run complete integration test suite"""
        logger.info("🧪 Starting MCP Integration Test Suite")
        logger.info("=" * 60)
        
        all_tests_passed = True
        
        # Test 1: Health checks
        logger.info("📋 Phase 1: Health Checks")
        for service_name in self.services.keys():
            if not self.test_service_health(service_name):
                all_tests_passed = False
        
        # Test 2: Info endpoints
        logger.info("\n📋 Phase 2: Service Info")
        for service_name in self.services.keys():
            if not self.test_service_info(service_name):
                all_tests_passed = False
        
        # Test 3: Functional tests
        logger.info("\n📋 Phase 3: Functional Tests")
        
        if not self.test_statistical_service():
            all_tests_passed = False
        
        if not self.test_neo4j_service():
            all_tests_passed = False
            
        if not self.test_script_execution_service():
            all_tests_passed = False
        
        # Test 4: Mathematical models
        logger.info("\n📋 Phase 4: Mathematical Models")
        if not self.test_mathematical_models():
            all_tests_passed = False
        
        # Summary
        logger.info("\n" + "=" * 60)
        if all_tests_passed:
            logger.info("🎉 All integration tests PASSED!")
            logger.info("✅ MCP services are ready for DADM integration")
        else:
            logger.error("❌ Some integration tests FAILED!")
            logger.error("⚠️  Please check the errors above before proceeding")
        
        return all_tests_passed

def main():
    """Main test execution"""
    tester = MCPIntegrationTester()
    
    # Add a small delay to ensure services are fully initialized
    logger.info("⏳ Waiting for services to be fully ready...")
    time.sleep(3)
    
    success = tester.run_all_tests()
    
    if success:
        logger.info("\n🚀 Ready to integrate with DADM workflows!")
        logger.info("💡 Next steps:")
        logger.info("   1. Update BPMN workflows to use MCP services")
        logger.info("   2. Configure service registry for MCP services")
        logger.info("   3. Test with real decision analysis scenarios")
    else:
        logger.error("\n🛠️  Please fix the failing tests before integration")
        exit(1)

if __name__ == "__main__":
    main()
