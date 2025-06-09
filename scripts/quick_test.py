#!/usr/bin/env python3
"""
DADM Quick Test Suite
Fast verification that all services are working correctly
"""

import requests
import time
import json
from datetime import datetime

def test_consul_integration():
    """Test Consul service discovery"""
    print("🔍 Testing Consul Integration...")
    
    try:
        # Check Consul is running
        response = requests.get('http://localhost:8500/v1/status/leader', timeout=5)
        if response.status_code != 200:
            print("   ❌ Consul not responding")
            return False
        
        # Check registered services
        response = requests.get('http://localhost:8500/v1/catalog/services', timeout=5)
        if response.status_code == 200:
            services = response.json()
            dadm_services = [name for name in services.keys() if 'dadm' in name or name in ['openai', 'echo-service']]
            print(f"   ✅ Consul running with {len(dadm_services)} DADM services: {dadm_services}")
            return True
        else:
            print("   ❌ Failed to get service list from Consul")
            return False
            
    except Exception as e:
        print(f"   ❌ Consul test failed: {e}")
        return False

def test_camunda_integration():
    """Test Camunda is accessible"""
    print("🏭 Testing Camunda Integration...")
    
    try:
        response = requests.get('http://localhost:8080/camunda/api/engine', timeout=10)
        if response.status_code == 200:
            engines = response.json()
            print(f"   ✅ Camunda running with {len(engines)} engine(s)")
            return True
        else:
            print(f"   ❌ Camunda returned status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ Camunda test failed: {e}")
        return False

def test_openai_service():
    """Test OpenAI service functionality"""
    print("🤖 Testing OpenAI Service...")
    
    try:
        # Health check
        response = requests.get('http://localhost:5000/health', timeout=5)
        if response.status_code != 200:
            print("   ❌ OpenAI service health check failed")
            return False
        
        health_data = response.json()
        print(f"   ✅ OpenAI service healthy: {health_data.get('status', 'unknown')}")
        
        # Note: We don't test process_task here since it requires valid OpenAI API key
        print("   ℹ️  Process task endpoint not tested (requires API key)")
        return True
        
    except Exception as e:
        print(f"   ❌ OpenAI service test failed: {e}")
        return False

def test_echo_service():
    """Test Echo service functionality"""
    print("📢 Testing Echo Service...")
    
    try:
        # Health check
        response = requests.get('http://localhost:5100/health', timeout=5)
        if response.status_code != 200:
            print("   ❌ Echo service health check failed")
            return False
        
        health_data = response.json()
        print(f"   ✅ Echo service healthy: {health_data.get('status', 'unknown')}")
        
        # Test process_task endpoint
        test_payload = {
            "task_name": "quick_test",
            "task_documentation": "Quick test of echo service",
            "variables": {"test_mode": True, "timestamp": datetime.now().isoformat()},
            "service_properties": {"service.type": "test", "service.name": "dadm-echo-service"}
        }
        
        response = requests.post('http://localhost:5100/process_task', 
                               json=test_payload, 
                               timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Echo service processing: {result.get('status', 'success')}")
            return True
        else:
            print(f"   ❌ Echo service processing failed: {response.status_code}")
            return False
        
    except Exception as e:
        print(f"   ❌ Echo service test failed: {e}")
        return False

def test_service_discovery():
    """Test dynamic service discovery"""
    print("🔎 Testing Dynamic Service Discovery...")
    
    try:
        # Import and test service discovery
        import sys
        import os
        sys.path.append(os.path.dirname(os.path.dirname(__file__)))
        
        from config.service_registry import discover_services, find_service_by_type, find_service_by_name
        
        # Test discovery
        services = discover_services()
        service_count = sum(len(svc) for svc in services.values())
        print(f"   ✅ Discovered {service_count} services across {len(services)} types")
        
        # Test lookup by type
        assistant_service = find_service_by_type('assistant')
        test_service = find_service_by_type('test')
        
        if assistant_service:
            print(f"   ✅ Found assistant service: {assistant_service['config']['name']}")
        else:
            print("   ❌ No assistant service found")
            return False
        
        if test_service:
            print(f"   ✅ Found test service: {test_service['config']['name']}")
        else:
            print("   ❌ No test service found")
            return False
        
        # Test lookup by name
        openai_found = find_service_by_name('dadm-openai-assistant')
        echo_found = find_service_by_name('dadm-echo-service')
        
        if openai_found and echo_found:
            print("   ✅ Service lookup by name working")
            return True
        else:
            print("   ❌ Service lookup by name failed")
            return False
        
    except Exception as e:
        print(f"   ❌ Service discovery test failed: {e}")
        return False

def test_service_orchestrator():
    """Test service orchestrator integration"""
    print("🎼 Testing Service Orchestrator...")
    
    try:
        import sys
        import os
        sys.path.append(os.path.dirname(os.path.dirname(__file__)))
        
        from src.service_orchestrator import ServiceOrchestrator
        from src.enhanced_service_orchestrator import EnhancedServiceOrchestrator
        
        # Test regular orchestrator
        regular_orch = ServiceOrchestrator()
        regular_default = regular_orch._get_default_service_name()
        print(f"   ✅ Regular orchestrator: default service = {regular_default}")
        
        # Test enhanced orchestrator
        enhanced_orch = EnhancedServiceOrchestrator()
        enhanced_default = enhanced_orch._get_default_service_name()
        print(f"   ✅ Enhanced orchestrator: default service = {enhanced_default}")
        
        if regular_default == enhanced_default == "dadm-openai-assistant":
            print("   ✅ Both orchestrators using correct service names")
            return True
        else:
            print("   ⚠️  Service name mismatch detected")
            return False
        
    except Exception as e:
        print(f"   ❌ Service orchestrator test failed: {e}")
        return False

def run_quick_tests():
    """Run all quick tests"""
    print("=== DADM Quick Test Suite ===")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    tests = [
        ("Consul Integration", test_consul_integration),
        ("Camunda Integration", test_camunda_integration),
        ("OpenAI Service", test_openai_service),
        ("Echo Service", test_echo_service),
        ("Service Discovery", test_service_discovery),
        ("Service Orchestrator", test_service_orchestrator),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
            print()  # Add spacing between tests
        except Exception as e:
            print(f"   ❌ {test_name} test crashed: {e}")
            print()
    
    # Summary
    print("=" * 50)
    print("📋 TEST SUMMARY")
    print(f"   Tests passed: {passed}/{total}")
    
    if passed == total:
        print("   🎉 ALL TESTS PASSED! DADM system is ready.")
        print("\n🚀 READY FOR PRODUCTION:")
        print("   1. Deploy BPMN processes")
        print("   2. Start Camunda workflows")
        print("   3. Monitor with service health scripts")
    else:
        print("   ⚠️  SOME TESTS FAILED. System needs attention.")
        print("\n🔧 TROUBLESHOOTING:")
        print("   1. Check failed service logs")
        print("   2. Verify Docker container status")
        print("   3. Check network connectivity")
        print("   4. Restart failed services")
    
    return passed == total

if __name__ == "__main__":
    success = run_quick_tests()
    exit(0 if success else 1)
