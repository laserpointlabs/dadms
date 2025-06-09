#!/usr/bin/env python
"""
Test script to verify Consul service registry integration

This script checks if Consul is running and if the OpenAI Assistant service
is registered correctly.
"""
import os
import sys
import json
import requests
import time

# Add the project root to the Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

def check_consul_status():
    """Check if Consul is available and running"""
    print("\nChecking Consul status...")
    
    # Get Consul URL from environment or use default
    consul_url = os.environ.get("CONSUL_HTTP_ADDR", "http://localhost:8500")
    if not consul_url.startswith("http"):
        if ":" in consul_url:
            consul_url = f"http://{consul_url}"
        else:
            consul_url = f"http://{consul_url}:8500"
    
    try:
        response = requests.get(f"{consul_url}/v1/status/leader", timeout=2)
        if response.status_code == 200:
            print(f"✅ Consul is available at {consul_url}")
            leader = response.text.strip().replace('"', '')
            print(f"   Leader: {leader}")
            return consul_url
        else:
            print(f"❌ Consul is not responding properly (status {response.status_code})")
            return None
    except Exception as e:
        print(f"❌ Cannot connect to Consul: {e}")
        return None

def list_consul_services(consul_url):
    """List all services registered with Consul"""
    if not consul_url:
        return
        
    print("\nListing services registered with Consul...")
    
    try:
        response = requests.get(f"{consul_url}/v1/catalog/services", timeout=5)
        if response.status_code == 200:
            services = response.json()
            
            if not services:
                print("No services registered with Consul.")
                return
                
            print(f"Found {len(services)} registered services:")
            
            for service_name, tags in services.items():
                print(f"- {service_name}")
                if tags:
                    print(f"  Tags: {', '.join(tags)}")
                
                # Get service details
                try:
                    details_response = requests.get(f"{consul_url}/v1/catalog/service/{service_name}", timeout=5)
                    if details_response.status_code == 200:
                        details = details_response.json()
                        if details:
                            service = details[0]
                            print(f"  Address: {service.get('ServiceAddress') or service.get('Address')}:{service.get('ServicePort')}")
                            
                            # Print metadata if available
                            meta = service.get("ServiceMeta") or service.get("Meta", {})
                            if meta:
                                print("  Metadata:")
                                for key, value in meta.items():
                                    print(f"    {key}: {value}")
                except Exception as e:
                    print(f"  Error getting service details: {e}")
        else:
            print(f"Error listing services: {response.status_code}")
    except Exception as e:
        print(f"Error querying Consul: {e}")

def check_openai_service_discovery():
    """Try to discover the OpenAI service using our discovery modules"""
    print("\nTesting OpenAI service discovery...")
    
    try:
        # Try to import the discovery function
        from src.consul_app import get_openai_service_url
        
        # Try to get the URL
        url = get_openai_service_url()
        print(f"OpenAI service URL from discovery: {url}")
        
        # Try to access the service
        try:
            response = requests.get(f"{url}/health", timeout=5)
            if response.status_code == 200:
                print(f"✅ Successfully connected to the OpenAI service")
                print(f"   Health check response: {response.json()}")
                return url
            else:
                print(f"❌ OpenAI service returned error: {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ Error connecting to OpenAI service: {e}")
            return None
            
    except ImportError:
        print("❌ Could not import discovery module (src.consul_app)")
        return None
    except Exception as e:
        print(f"❌ Error during service discovery: {e}")
        return None

def test_service_orchestrator():
    """Test the ConsulServiceOrchestrator"""
    print("\nTesting ConsulServiceOrchestrator...")
    
    try:
        # Try to import the orchestrator
        try:
            from src.consul_service_orchestrator import ConsulServiceOrchestrator
            orchestrator_class = ConsulServiceOrchestrator
            print("✅ Successfully imported ConsulServiceOrchestrator")
        except ImportError:
            print("❌ Could not import ConsulServiceOrchestrator, falling back to base ServiceOrchestrator")
            from src.service_orchestrator import ServiceOrchestrator
            orchestrator_class = ServiceOrchestrator
        
        # Initialize the orchestrator
        orchestrator = orchestrator_class()
        print(f"✅ Successfully initialized {orchestrator_class.__name__}")
        
        # Print the registry
        print("\nService registry contents:")
        for service_type, services in orchestrator.service_registry.items():
            print(f"- {service_type}:")
            for service_name, config in services.items():
                print(f"  - {service_name}: {config}")
                
        # Try to get OpenAI service URL
        url = orchestrator.get_service_url("assistant", "openai")
        if url:
            print(f"\n✅ Found OpenAI service URL: {url}")
        else:
            print("\n❌ Could not find OpenAI service URL")
            
    except Exception as e:
        print(f"❌ Error testing service orchestrator: {e}")

def main():
    """Main function to test Consul integration"""
    print("\n=== DADM Consul Service Registry Test ===\n")
    
    # Check if Consul is running
    consul_url = check_consul_status()
    
    # List services in Consul
    if consul_url:
        list_consul_services(consul_url)
    
    # Test OpenAI service discovery
    openai_url = check_openai_service_discovery()
    
    # Test ServiceOrchestrator with Consul
    test_service_orchestrator()
    
    print("\n=== Test Complete ===")
    
    if consul_url and openai_url:
        print("\n✅ Consul integration is working correctly!\n")
        return 0
    elif consul_url:
        print("\n⚠️ Consul is available but the OpenAI service was not discovered.\n")
        return 1
    else:
        print("\n❌ Consul integration test failed. Make sure Consul is running.\n")
        return 2

if __name__ == "__main__":
    sys.exit(main())
