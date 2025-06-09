#!/usr/bin/env python3
"""
DADM Service Health Monitor
Monitors the health and status of all DADM services
"""

import requests
import time
import json
from datetime import datetime
from config.service_registry import discover_services, get_discovered_services

def check_service_health(service_name, endpoint, health_path="/health"):
    """Check if a service is healthy"""
    try:
        url = f"{endpoint.rstrip('/')}{health_path}"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            try:
                health_data = response.json()
                return "healthy", health_data
            except:
                return "healthy", {"status": "ok"}
        else:
            return "unhealthy", {"status": response.status_code}
            
    except requests.exceptions.ConnectionError:
        return "offline", {"error": "Connection refused"}
    except requests.exceptions.Timeout:
        return "timeout", {"error": "Request timeout"}
    except Exception as e:
        return "error", {"error": str(e)}

def test_service_functionality(service_name, endpoint, service_type):
    """Test basic functionality of a service"""
    try:
        if service_type == "test":
            # Test echo service
            test_payload = {
                "task_name": "health_check_test",
                "task_documentation": "Health check test",
                "variables": {"test": True},
                "service_properties": {"service.type": "test"}
            }
            
            response = requests.post(f"{endpoint}/process_task", 
                                   json=test_payload, 
                                   timeout=10)
            
            if response.status_code == 200:
                return "functional", response.json()
            else:
                return "error", {"status": response.status_code}
                
        elif service_type == "assistant":
            # For OpenAI service, just check if it responds to health
            return "not_tested", {"reason": "OpenAI service requires API key for full test"}
            
    except Exception as e:
        return "error", {"error": str(e)}
    
    return "not_tested", {"reason": "Unknown service type"}

def monitor_services():
    """Monitor all discovered services"""
    print("=== DADM Service Health Monitor ===")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Discover services
    try:
        services = discover_services()
        if not services:
            print("❌ No services discovered!")
            return
            
        print(f"📊 Monitoring {sum(len(svc) for svc in services.values())} services across {len(services)} types")
        print()
        
        all_healthy = True
        
        for service_type, type_services in services.items():
            print(f"🔧 {service_type.upper()} SERVICES:")
            
            for service_name, service_info in type_services.items():
                endpoint = service_info.get("endpoint")
                config = service_info.get("config", {})
                health_endpoint = config.get("health_endpoint", "/health")
                
                print(f"  🔍 {service_name}")
                print(f"     Endpoint: {endpoint}")
                
                # Check health
                health_status, health_data = check_service_health(
                    service_name, endpoint, health_endpoint
                )
                
                if health_status == "healthy":
                    print(f"     ✅ Health: {health_status}")
                else:
                    print(f"     ❌ Health: {health_status} - {health_data}")
                    all_healthy = False
                
                # Test functionality
                func_status, func_data = test_service_functionality(
                    service_name, endpoint, service_type
                )
                
                if func_status == "functional":
                    print(f"     ✅ Function: Working")
                elif func_status == "not_tested":
                    print(f"     ⏭️  Function: {func_data.get('reason', 'Not tested')}")
                else:
                    print(f"     ❌ Function: {func_status} - {func_data}")
                    all_healthy = False
                
                print()
        
        # Overall status
        if all_healthy:
            print("🎉 All services are healthy and functional!")
        else:
            print("⚠️  Some services have issues - check details above")
            
    except Exception as e:
        print(f"❌ Error monitoring services: {e}")

def continuous_monitor(interval=30):
    """Continuously monitor services"""
    print("Starting continuous monitoring (Ctrl+C to stop)...")
    print(f"Check interval: {interval} seconds")
    print("=" * 50)
    
    try:
        while True:
            monitor_services()
            print("\n" + "=" * 50)
            print(f"Next check in {interval} seconds...")
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\n\nMonitoring stopped by user.")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--continuous":
        interval = int(sys.argv[2]) if len(sys.argv) > 2 else 30
        continuous_monitor(interval)
    else:
        monitor_services()
