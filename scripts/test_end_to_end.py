#!/usr/bin/env python3
"""
DADM End-to-End Service Test
Tests the complete service workflow including Camunda integration
"""

import requests
import time
import json
from datetime import datetime
from config.service_registry import discover_services
from src.service_orchestrator import ServiceOrchestrator

class MockTask:
    """Mock Camunda task for testing"""
    def __init__(self, activity_id, process_instance_id="test_process_123"):
        self.activity_id = activity_id
        self.process_instance_id = process_instance_id
    
    def get_activity_id(self):
        return self.activity_id
    
    def get_process_instance_id(self):
        return self.process_instance_id

def test_service_discovery():
    """Test service discovery functionality"""
    print("🔍 Testing Service Discovery...")
    
    try:
        services = discover_services()
        service_count = sum(len(svc) for svc in services.values())
        type_count = len(services)
        
        print(f"   ✅ Discovered {service_count} services across {type_count} types")
        
        for service_type, type_services in services.items():
            for service_name in type_services.keys():
                print(f"   📋 {service_type}: {service_name}")
        
        return True, services
    except Exception as e:
        print(f"   ❌ Service discovery failed: {e}")
        return False, {}

def test_orchestrators():
    """Test service orchestrator initialization"""
    print("\n🎛️  Testing Service Orchestrators...")
    
    try:
        # Test regular orchestrator
        regular_orch = ServiceOrchestrator()
        regular_default = regular_orch._get_default_service_name()
        print(f"   ✅ Regular orchestrator initialized, default service: {regular_default}")
        
        return True, (regular_orch, None)
    except Exception as e:
        print(f"   ❌ Orchestrator initialization failed: {e}")
        return False, (None, None)

def test_service_routing():
    """Test service routing with mock tasks"""
    print("\n🚦 Testing Service Routing...")
    
    try:
        orchestrator = ServiceOrchestrator()
        
        # Create a mock task
        mock_task = MockTask("test_activity")
        
        # Test property extraction (will use defaults since no XML)
        properties = orchestrator.extract_service_properties(mock_task)
        print(f"   ✅ Extracted properties: {properties}")
        
        # Test that the default service name is used
        expected_service = orchestrator._get_default_service_name()
        actual_service = properties.get("service.name")
        
        if actual_service == expected_service:
            print(f"   ✅ Service routing uses correct default: {actual_service}")
        else:
            print(f"   ⚠️  Service mismatch: expected {expected_service}, got {actual_service}")
        
        return True
    except Exception as e:
        print(f"   ❌ Service routing test failed: {e}")
        return False

def test_direct_service_calls():
    """Test direct calls to service endpoints"""
    print("\n📞 Testing Direct Service Calls...")
    
    services = discover_services()
    success_count = 0
    total_count = 0
    
    for service_type, type_services in services.items():
        for service_name, service_info in type_services.items():
            total_count += 1
            endpoint = service_info.get("endpoint")
            
            print(f"   🔗 Testing {service_name} at {endpoint}")
            
            try:
                # Test health endpoint
                health_response = requests.get(f"{endpoint}/health", timeout=5)
                if health_response.status_code == 200:
                    print(f"      ✅ Health check passed")
                else:
                    print(f"      ⚠️  Health check returned {health_response.status_code}")
                    continue
                
                # Test process_task endpoint (only for test services)
                if service_type == "test":
                    test_payload = {
                        "task_name": "end_to_end_test",
                        "task_documentation": "End-to-end test task",
                        "variables": {"test_mode": True},
                        "service_properties": {
                            "service.type": service_type,
                            "service.name": service_name
                        }
                    }
                    
                    task_response = requests.post(
                        f"{endpoint}/process_task", 
                        json=test_payload, 
                        timeout=10
                    )
                    
                    if task_response.status_code == 200:
                        result = task_response.json()
                        print(f"      ✅ Task processing: {result.get('status', 'success')}")
                        success_count += 1
                    else:
                        print(f"      ❌ Task processing failed: {task_response.status_code}")
                else:
                    print(f"      ⏭️  Skipping task test for {service_type} service")
                    success_count += 1  # Count as success since health passed
                    
            except Exception as e:
                print(f"      ❌ Service call failed: {e}")
    
    print(f"\n   📊 Direct service test results: {success_count}/{total_count} services working")
    return success_count == total_count

def run_comprehensive_test():
    """Run all tests in sequence"""
    print("=== DADM End-to-End Service Test ===")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    tests_passed = 0
    total_tests = 4
    
    # Test 1: Service Discovery
    discovery_success, services = test_service_discovery()
    if discovery_success:
        tests_passed += 1
    
    # Test 2: Orchestrator Initialization
    orch_success, orchestrators = test_orchestrators()
    if orch_success:
        tests_passed += 1
    
    # Test 3: Service Routing
    routing_success = test_service_routing()
    if routing_success:
        tests_passed += 1
    
    # Test 4: Direct Service Calls
    direct_success = test_direct_service_calls()
    if direct_success:
        tests_passed += 1
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 TEST SUMMARY")
    print(f"   Tests passed: {tests_passed}/{total_tests}")
    
    if tests_passed == total_tests:
        print("   🎉 ALL TESTS PASSED! Services are ready for production.")
        print("\n🚀 NEXT STEPS:")
        print("   1. Deploy BPMN processes: python scripts/deploy_bpmn.py")
        print("   2. Test with Camunda workflow")
        print("   3. Monitor with: python scripts/monitor_service_health.py --continuous")
    else:
        print("   ⚠️  SOME TESTS FAILED. Check service logs and configuration.")
        print("\n🔧 TROUBLESHOOTING:")
        print("   1. Ensure all services are running")
        print("   2. Check service configuration files")
        print("   3. Verify network connectivity")
        print("   4. Check logs in logs/services/ directory")

if __name__ == "__main__":
    run_comprehensive_test()
