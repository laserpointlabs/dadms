#!/usr/bin/env python3
"""
Consul Service Registration Script for DADM
This script automatically registers all DADM services with Consul
"""

import os
import sys
import json
import time
import requests
import subprocess
import webbrowser
from pathlib import Path
from typing import Dict, List, Optional, Any

def get_service_config(service_folder: str) -> Optional[Dict[str, Any]]:
    """Load service configuration from service folder"""
    config_path = os.path.join(service_folder, "service_config.json")
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
                return config.get("service")
        except Exception as e:
            print(f"⚠️ Failed to load config from {config_path}: {e}")
            return None
    return None

def get_service_definitions(services_dir: str) -> Dict[str, Dict[str, Any]]:
    """Get all service definitions from service folders"""
    service_definitions = {}
    
    if os.path.exists(services_dir):
        for folder in os.listdir(services_dir):
            folder_path = os.path.join(services_dir, folder)
            if os.path.isdir(folder_path):
                config = get_service_config(folder_path)
                if config:
                    service_definitions[folder] = {
                        "name": config["name"],
                        "port": config["port"],
                        "type": config["type"],
                        "healthEndpoint": config["health_endpoint"],
                        "metadata": {
                            "version": config.get("version", "1.0"),
                            "description": config.get("description", "DADM Service")
                        }
                    }
                    
                    # Add any additional metadata from config
                    if config.get("metadata"):
                        service_definitions[folder]["metadata"].update(config["metadata"])
                    
                    # Add environment-specific metadata
                    if os.environ.get("OPENAI_ASSISTANT_ID") and config["type"] == "assistant":
                        service_definitions[folder]["metadata"]["assistant_id"] = os.environ["OPENAI_ASSISTANT_ID"]
                    
                    print(f"✅ Loaded service config: {config['name']} from {folder}")
                else:
                    print(f"⚠️ No service_config.json found in {folder}")
    
    if not service_definitions:
        print("❌ No service configurations found in services/ directory")
        print("   Make sure each service has a service_config.json file")
    
    return service_definitions

def get_running_containers() -> Dict[str, Dict[str, Any]]:
    """Get running Docker containers and their network information"""
    containers = {}
    
    try:
        # Get all running containers with their network info
        result = subprocess.run(["docker", "ps", "--format", "json"], 
                              capture_output=True, text=True, check=True)
        
        for line in result.stdout.strip().split('\n'):
            if line:
                container = json.loads(line)
                container_name = container["Names"]
                  # Get detailed network information for each container
                network_result = subprocess.run([
                    "docker", "inspect", container_name, 
                    "--format", "{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}"
                ], capture_output=True, text=True)
                
                if network_result.returncode == 0 and network_result.stdout.strip():
                    # Get the first IP address (split by space and take first non-empty)
                    ip_addresses = network_result.stdout.strip().split()
                    ip_address = ip_addresses[0] if ip_addresses else ""
                    
                    if ip_address:
                        containers[container_name] = {
                            "id": container["ID"],
                            "image": container["Image"],
                            "status": container["Status"],
                            "ports": container["Ports"],
                            "ipAddress": ip_address
                        }
                        print(f"🐳 Found container: {container_name} at {ip_address}")
    except Exception as e:
        print(f"⚠️ Failed to get container information: {e}")
    
    return containers

def find_service_container(service_folder_name: str, service_name: str, running_containers: Dict[str, Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Find matching container for a service"""
    # Try multiple matching strategies
    possible_names = [
        service_name,                                    # Exact service name
        service_folder_name,                            # Service folder name
        f"{service_folder_name}-service",               # Folder name + "-service"
        service_name.replace("dadm-", ""),              # Remove "dadm-" prefix
        service_name.replace("-", "_"),                 # Replace dashes with underscores
        service_name.replace("_", "-"),                 # Replace underscores with dashes
        service_folder_name.replace("_", "-"),          # Folder name with dashes
        f"{service_folder_name.replace('_', '-')}-service",  # Folder name with dashes + "-service"
        service_folder_name.replace("_service", ""),    # Remove "_service" suffix
        f"{service_folder_name.replace('_service', '')}-service"  # Replace "_service" with "-service"
    ]
    
    for name in possible_names:
        if name in running_containers:
            print(f"✅ Matched service '{service_name}' to container '{name}'")
            return {
                "containerName": name,
                "containerInfo": running_containers[name]
            }
    
    # If no exact match, try partial matching
    for container_name in running_containers.keys():
        service_part = service_name.replace('dadm-', '')
        folder_part = service_folder_name.replace('_service', '').replace('_', '-')
        
        if (service_part in container_name or 
            folder_part in container_name or
            service_folder_name in container_name):
            print(f"✅ Partially matched service '{service_name}' to container '{container_name}'")
            return {
                "containerName": container_name,
                "containerInfo": running_containers[container_name]
            }
    
    print(f"❌ No matching container found for service '{service_name}' (folder: {service_folder_name})")
    print(f"   Available containers: {', '.join(running_containers.keys())}")
    return None

def test_consul_running() -> bool:
    """Test if Consul is running"""
    try:
        response = requests.get('http://localhost:8500/v1/status/leader', timeout=2)
        return response.status_code == 200
    except:
        return False

def start_consul_container() -> bool:
    """Start Consul container with Docker"""
    try:
        # Check if consul container exists
        result = subprocess.run(["docker", "ps", "-a", "--filter", "name=^consul$", "--format", "{{.Names}}"], 
                              capture_output=True, text=True)
        
        if result.stdout.strip() == 'consul':
            # Container exists, start it
            subprocess.run(["docker", "start", "consul"], check=True)
        else:
            # Container doesn't exist, create and start it
            subprocess.run(["docker", "run", "-d", "--name", "consul", "-p", "8500:8500", "consul:1.15"], check=True)
        
        time.sleep(3)
        return test_consul_running()
    except Exception as e:
        print(f"❌ Failed to start Consul with Docker: {e}")
        return False

def register_service(service_dir: str, service_def: Dict[str, Any], running_containers: Dict[str, Dict[str, Any]]) -> bool:
    """Register a service with Consul"""
    # Find the matching container for this service
    container_match = find_service_container(service_dir, service_def["name"], running_containers)
    
    if not container_match:
        print(f"❌ Cannot register {service_def['name']} - no running container found")
        return False
    
    container_name = container_match["containerName"]
    container_ip = container_match["containerInfo"]["ipAddress"]
    
    # Use container IP for address since Consul needs to reach it from within Docker network
    service_address = container_ip
    health_check_url = f"http://{container_ip}:{service_def['port']}{service_def['healthEndpoint']}"
    
    print(f"Registering {service_def['name']}...")
    print(f"  Container: {container_name}")
    print(f"  Address: {service_address}")
    print(f"  Health Check: {health_check_url}")
    
    # Create service registration data
    service_data = {
        "Name": service_def["name"],
        "Address": service_address,
        "Port": int(service_def["port"]),
        "Tags": [f"type-{service_def['type']}", f"container-{container_name}"],
        "Meta": {},
        "Check": {
            "HTTP": health_check_url,
            "Interval": "10s",
            "Timeout": "3s"
        }
    }
    
    # Add metadata as strings (Consul requires string values)
    for key, value in service_def["metadata"].items():
        if value is not None:
            service_data["Meta"][key] = str(value)
    
    # Register with Consul
    try:
        response = requests.put(
            'http://localhost:8500/v1/agent/service/register',
            json=service_data,
            headers={'Content-Type': 'application/json'}
        )
        response.raise_for_status()
        
        print(f"✅ Successfully registered {service_def['name']}")
        return True
    except Exception as e:
        print(f"❌ Failed to register {service_def['name']}: {e}")
        return False

def main(consul_url: str = "http://localhost:8500", list_only: bool = False, no_browser: bool = False):
    """Main function to deploy services to Consul"""
    # Update consul_url if provided
    global CONSUL_URL
    CONSUL_URL = consul_url.rstrip('/')
    
    # Get project root directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    services_path = os.path.join(project_root, "services")
    
    print("="*80)
    print("DADM CONSUL SERVICE DEPLOYMENT")
    print("="*80)
    
    # 1. Check/Start Consul
    print("\nChecking if Consul is running...")
    if not test_consul_running():
        print("❌ Consul is not running locally.")
        print("Starting Consul with Docker...")
        
        if not start_consul_container():
            print("Cannot proceed without Consul running. Please start Consul first with:")
            print("   docker run -d --name consul -p 8500:8500 consul:1.15")
            return 1
    
    print("✅ Consul is running!")
    
    # 2. Load service definitions
    print("\nLoading service definitions...")
    service_definitions = get_service_definitions(services_path)
    
    if not service_definitions:
        print("❌ No service definitions found. Exiting.")
        return 1
    
    # 3. Get running containers
    print("\nDiscovering running containers...")
    running_containers = get_running_containers()
    
    if not running_containers:
        print("❌ No running containers found. Please start your services first.")
        return 1
    
    # 4. List services if requested
    if list_only:
        print("\nAvailable services:")
        for service_dir, service_def in service_definitions.items():
            print(f"  - {service_def['name']} (folder: {service_dir})")
            container_match = find_service_container(service_dir, service_def["name"], running_containers)
            if container_match:
                print(f"    ✅ Container: {container_match['containerName']}")
            else:
                print(f"    ❌ No matching container found")
        return 0
    
    # 5. Open Consul UI
    if not no_browser:
        print("\nOpening Consul UI in your default browser...")
        try:
            webbrowser.open(f"{CONSUL_URL}/ui/dc1/services")
        except Exception as e:
            print(f"⚠️ Could not open browser: {e}")
    
    # 6. Register services
    print("\nRegistering discovered services...")
    registered = []
    
    for service_dir, service_def in service_definitions.items():
        if register_service(service_dir, service_def, running_containers):
            registered.append(service_dir)
    
    # 7. Final status check
    print("\nFinal service status:")
    print("⏳ Waiting a few seconds for services to start...")
    time.sleep(10)
    
    try:
        services_response = requests.get(f'{CONSUL_URL}/v1/catalog/services')
        services = services_response.json()
        
        for service_name in services.keys():
            if service_name != 'consul':
                health_response = requests.get(f'{CONSUL_URL}/v1/health/service/{service_name}')
                health_data = health_response.json()
                
                if health_data:
                    status = None
                    for check in health_data[0].get('Checks', []):
                        if check.get('ServiceName') == service_name:
                            status = check.get('Status')
                            break
                    
                    color_map = {
                        'passing': '\033[92m',  # Green
                        'warning': '\033[93m',  # Yellow
                        'critical': '\033[91m',  # Red
                    }
                    color = color_map.get(status, '\033[90m')  # Gray for unknown
                    reset = '\033[0m'
                    
                    print(f"  {service_name}: {color}{status}{reset}")
                else:
                    print(f"  {service_name}: \033[91mNot found\033[0m")
    except Exception as e:
        print(f"⚠️ Could not check service status: {e}")
    
    print(f"\nDone! Services registered: {', '.join(registered)}")
    print("Check the Consul UI for service details.")
    return 0

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Deploy DADM services to Consul")
    parser.add_argument('--consul-url', default='http://localhost:8500',
                       help='Consul server URL (default: http://localhost:8500)')
    parser.add_argument('--list-only', action='store_true',
                       help='Only list available services without registering them')
    parser.add_argument('--no-browser', action='store_true',
                       help='Do not open Consul UI in browser')
    
    args = parser.parse_args()
    sys.exit(main(args.consul_url, args.list_only, args.no_browser))