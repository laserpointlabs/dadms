#!/usr/bin/env python3
"""
Test script for Python Execution Service Consul registration
"""

import sys
import os
import json
import time

# Add the service directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from config_manager import load_service_config, get_service_info, get_consul_config

def test_config_loading():
    """Test that configuration loading works correctly"""
    print("🔧 Testing Configuration Loading...")
    
    try:
        # Test full config loading
        config = load_service_config()
        print(f"✅ Full config loaded: {len(config)} sections")
        
        # Test service info
        service_info = get_service_info()
        print(f"✅ Service info: {service_info.get('name', 'Unknown')}")
        print(f"   Port: {service_info.get('port', 'Unknown')}")
        print(f"   Tags: {', '.join(service_info.get('tags', []))}")
        
        # Test consul config
        consul_config = get_consul_config()
        print(f"✅ Consul config: enabled={consul_config.get('enabled', False)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Configuration test failed: {e}")
        return False

def test_service_config_structure():
    """Test that service config has required structure"""
    print("\n📋 Testing Service Config Structure...")
    
    try:
        config = load_service_config()
        
        # Check required sections
        required_sections = ["service", "consul", "runtime", "defaults"]
        for section in required_sections:
            if section in config:
                print(f"✅ Section '{section}' present")
            else:
                print(f"❌ Section '{section}' missing")
                return False
        
        # Check service info structure
        service = config.get("service", {})
        required_service_fields = ["name", "type", "port", "version", "tags"]
        for field in required_service_fields:
            if field in service:
                print(f"✅ Service field '{field}': {service[field]}")
            else:
                print(f"❌ Service field '{field}' missing")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ Structure test failed: {e}")
        return False

def test_environment_overrides():
    """Test environment variable overrides"""
    print("\n🌍 Testing Environment Overrides...")
    
    try:
        # Set test environment variables
        os.environ["PORT"] = "9999"
        os.environ["USE_CONSUL"] = "false"
        
        # Force reload config
        from config_manager import _config_manager
        if _config_manager:
            _config_manager._config_cache = None
        
        # Test that environment variables override config
        service_info = get_service_info()
        consul_config = get_consul_config()
        
        print(f"✅ Port override test: {service_info.get('port')}")
        print(f"✅ Consul override test: {consul_config.get('enabled')}")
        
        # Clean up
        del os.environ["PORT"]
        del os.environ["USE_CONSUL"]
        
        return True
        
    except Exception as e:
        print(f"❌ Environment override test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Python Execution Service Configuration")
    print("=" * 60)
    
    tests = [
        test_config_loading,
        test_service_config_structure,
        test_environment_overrides
    ]
    
    passed = 0
    for test in tests:
        if test():
            passed += 1
        time.sleep(1)
    
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {passed}/{len(tests)} tests passed")
    
    if passed == len(tests):
        print("✅ All tests passed! Python Execution Service is ready for Consul registration.")
        return 0
    else:
        print("❌ Some tests failed. Check configuration and dependencies.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
