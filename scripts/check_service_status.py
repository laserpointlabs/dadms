"""
Service Status Checker

This script checks the status of all registered services in the DADM system
and provides a detailed report.
"""
import os
import sys
import json
import requests
import argparse
from datetime import datetime
from pathlib import Path

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

def check_service_status(service_type, service_name, endpoint):
    """Check the status of a specific service"""
    results = {
        "service_type": service_type,
        "service_name": service_name,
        "endpoint": endpoint,
        "status": "unknown",
        "response_time_ms": None,
        "details": {},
        "timestamp": datetime.now().isoformat()
    }
    
    # Try the health endpoint first
    health_url = f"{endpoint}/health"
    try:
        import time
        start_time = time.time()
        response = requests.get(health_url, timeout=5)
        response_time = int((time.time() - start_time) * 1000)
        results["response_time_ms"] = response_time
        
        if response.status_code == 200:
            results["status"] = "healthy"
            results["details"]["health"] = response.json()
        else:
            results["status"] = "unhealthy"
            results["details"]["status_code"] = response.status_code
            results["details"]["response"] = response.text[:200]  # Truncate long responses
    except requests.exceptions.ConnectionError:
        results["status"] = "unreachable"
        results["details"]["error"] = "Connection refused"
    except requests.exceptions.Timeout:
        results["status"] = "timeout"
        results["details"]["error"] = "Request timed out"
    except Exception as e:
        results["status"] = "error"
        results["details"]["error"] = str(e)
    
    # Try the info endpoint if health check failed
    if results["status"] not in ["healthy"]:
        info_url = f"{endpoint}/info"
        try:
            response = requests.get(info_url, timeout=5)
            if response.status_code == 200:
                results["details"]["info"] = response.json()
                # Update status if info endpoint worked but health didn't
                if results["status"] == "unknown":
                    results["status"] = "partial"
        except Exception:
            # Ignore errors from info endpoint
            pass
    
    return results

def check_all_services(verbose=False):
    """Check all services in the registry"""
    from config import service_registry
    
    results = []
    
    # Track overall system status
    system_status = {
        "total_services": 0,
        "healthy_services": 0,
        "unhealthy_services": 0,
        "unreachable_services": 0,
        "timestamp": datetime.now().isoformat()
    }
    
    print("Checking all registered services...")
    
    for service_type, services in service_registry.SERVICE_REGISTRY.items():
        for service_name, service_config in services.items():
            if not service_config.get("active", False):
                if verbose:
                    print(f"  - Skipping inactive service: {service_type}/{service_name}")
                continue
                
            endpoint = service_config.get("endpoint")
            if not endpoint:
                if verbose:
                    print(f"  - Skipping service with no endpoint: {service_type}/{service_name}")
                continue
            
            print(f"  - Checking {service_type}/{service_name} at {endpoint}...")
            system_status["total_services"] += 1
            
            service_status = check_service_status(service_type, service_name, endpoint)
            results.append(service_status)
            
            # Update system status counters
            if service_status["status"] == "healthy":
                system_status["healthy_services"] += 1
                print(f"    ✓ Healthy ({service_status.get('response_time_ms', '?')}ms)")
            elif service_status["status"] == "unreachable":
                system_status["unreachable_services"] += 1
                print(f"    ✗ Unreachable - {service_status['details'].get('error', 'Unknown error')}")
            else:
                system_status["unhealthy_services"] += 1
                print(f"    ⚠ Unhealthy - Status: {service_status['status']}")
    
    # Combine results
    full_results = {
        "system_status": system_status,
        "services": results
    }
    
    return full_results

def print_detailed_report(results):
    """Print a detailed report of service status"""
    system_status = results["system_status"]
    services = results["services"]
    
    print("\n===== DADM Service Status Report =====")
    print(f"Generated: {system_status['timestamp']}")
    print(f"Total Services: {system_status['total_services']}")
    print(f"Healthy: {system_status['healthy_services']}")
    print(f"Unhealthy: {system_status['unhealthy_services']}")
    print(f"Unreachable: {system_status['unreachable_services']}")
    print("=====================================\n")
    
    print("Service Details:")
    for service in services:
        status_symbol = "✓" if service["status"] == "healthy" else "⚠" if service["status"] in ["partial", "unhealthy"] else "✗"
        print(f"{status_symbol} {service['service_type']}/{service['service_name']}:")
        print(f"  Endpoint: {service['endpoint']}")
        print(f"  Status: {service['status']}")
        
        if service["response_time_ms"] is not None:
            print(f"  Response Time: {service['response_time_ms']}ms")
        
        if "error" in service["details"]:
            print(f"  Error: {service['details']['error']}")
        
        print("")

def save_report(results, output_file=None):
    """Save the service status report to a file"""
    if output_file is None:
        # Default to a timestamped file in the logs directory
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        logs_dir = os.path.join(project_root, "logs", "services")
        Path(logs_dir).mkdir(parents=True, exist_ok=True)
        output_file = os.path.join(logs_dir, f"service_status_{timestamp}.json")
    
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"Report saved to: {output_file}")
    return output_file

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Check status of DADM services")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show verbose output")
    parser.add_argument("--output", "-o", help="Output file for report (default: logs/service_status_TIMESTAMP.json)")
    parser.add_argument("--service", "-s", help="Check a specific service in format type/name (e.g., assistant/openai)")
    args = parser.parse_args()
    
    if args.service:
        try:
            service_parts = args.service.split('/')
            if len(service_parts) != 2:
                raise ValueError("Service format should be type/name (e.g., assistant/openai)")
            
            service_type, service_name = service_parts
            
            # Get service config
            from config import service_registry
            service_config = service_registry.SERVICE_REGISTRY.get(service_type, {}).get(service_name)
            
            if not service_config:
                print(f"Service not found: {args.service}")
                return 1
            
            endpoint = service_config.get("endpoint")
            if not endpoint:
                print(f"Service has no endpoint: {args.service}")
                return 1
            
            print(f"Checking service {service_type}/{service_name} at {endpoint}...")
            status = check_service_status(service_type, service_name, endpoint)
            
            print(f"Status: {status['status']}")
            print(f"Details: {json.dumps(status['details'], indent=2)}")
            
            if args.output:
                with open(args.output, 'w') as f:
                    json.dump(status, f, indent=2)
                print(f"Report saved to: {args.output}")
            
            return 0 if status["status"] == "healthy" else 1
            
        except Exception as e:
            print(f"Error checking service: {e}")
            return 1
    else:
        # Check all services
        results = check_all_services(args.verbose)
        print_detailed_report(results)
        
        if args.output:
            save_report(results, args.output)
        else:
            save_report(results)
        
        # Return success if all services are healthy
        system_status = results["system_status"]
        return 0 if system_status["healthy_services"] == system_status["total_services"] else 1

if __name__ == "__main__":
    sys.exit(main())