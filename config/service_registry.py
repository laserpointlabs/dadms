"""
Service Registry Configuration

This module provides dynamic service discovery by reading service configurations
from service folders. Each service should have a service_config.json file that
defines its configuration.
"""

import os
import json
import glob
from typing import Dict, Any, Optional

def load_service_config(service_path: str) -> Optional[Dict[str, Any]]:
    """
    Load service configuration from a service folder.
    
    Args:
        service_path: Path to the service folder
        
    Returns:
        Service configuration dictionary or None if not found
    """
    config_file = os.path.join(service_path, "service_config.json")
    if os.path.exists(config_file):
        try:
            with open(config_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading service config from {config_file}: {e}")
    return None

def discover_services() -> Dict[str, Dict[str, Any]]:
    """
    Discover all services by scanning service folders for service_config.json files.
    
    Returns:
        Dictionary organized by service type, then service name
    """
    services = {}
    
    # Get the base directory (parent of config)
    base_dir = os.path.dirname(os.path.dirname(__file__))
    services_dir = os.path.join(base_dir, "services")
    
    if not os.path.exists(services_dir):
        print(f"Services directory not found: {services_dir}")
        return services
    
    # Scan each service folder
    for service_folder in os.listdir(services_dir):
        service_path = os.path.join(services_dir, service_folder)
        if os.path.isdir(service_path):
            config = load_service_config(service_path)
            if config and 'service' in config:
                service_config = config['service']
                service_type = service_config.get('type', 'unknown')
                service_name = service_config.get('name', service_folder)
                
                # Initialize service type if not exists
                if service_type not in services:
                    services[service_type] = {}
                
                # Add service configuration
                endpoint_port = service_config.get('port', 5000)
                services[service_type][service_name] = {
                    'endpoint': f"http://localhost:{endpoint_port}",
                    'description': service_config.get('description', f'{service_name} service'),
                    'health_endpoint': service_config.get('health_endpoint', '/health'),
                    'folder': service_folder,
                    'config': service_config
                }
    
    return services

# Dynamic service registry - populated from service configs
_discovered_services = None

def get_discovered_services() -> Dict[str, Dict[str, Any]]:
    """Get discovered services, caching the result."""
    global _discovered_services
    if _discovered_services is None:
        _discovered_services = discover_services()
        print(f"Discovered {sum(len(svc) for svc in _discovered_services.values())} services across {len(_discovered_services)} types")
    return _discovered_services

def refresh_service_discovery():
    """Force refresh of service discovery."""
    global _discovered_services
    _discovered_services = None
    return get_discovered_services()

def find_service_by_type(service_type: str) -> Optional[Dict[str, Any]]:
    """
    Find the first available service of a given type.
    
    Args:
        service_type: The type of service to find (e.g., 'assistant', 'test')
        
    Returns:
        Service configuration dictionary or None if not found
    """
    services = get_discovered_services()
    if service_type in services and services[service_type]:
        # Return the first service of this type
        service_name = list(services[service_type].keys())[0]
        return services[service_type][service_name]
    return None

def find_service_by_name(service_name: str) -> Optional[Dict[str, Any]]:
    """
    Find a service by its exact name across all types.
    
    Args:
        service_name: The exact name of the service
        
    Returns:
        Service configuration dictionary or None if not found
    """
    services = get_discovered_services()
    for service_type in services:
        if service_name in services[service_type]:
            return services[service_type][service_name]
    return None

def get_service_registry():
    """
    Get the service registry, trying dynamic discovery first,
    falling back to Consul, then to legacy registry.
    
    Returns:
        dict: Service registry configuration
    """
    # Try dynamic discovery first
    discovered = get_discovered_services()
    if discovered:
        return discovered
    
    # Check if we should use Consul for service discovery
    use_consul = os.environ.get("USE_CONSUL", "true").lower() == "true"
    if use_consul:
        try:
            from src.consul_discovery import ConsulDiscovery
            consul_discovery = ConsulDiscovery()
            if consul_discovery.is_consul_available():
                consul_registry = consul_discovery.build_service_registry()
                if consul_registry:
                    print(f"Using service registry from Consul with {sum(len(svc) for svc in consul_registry.values())} services")
                    return consul_registry
        except ImportError:
            print("Consul discovery module not available")
        except Exception as e:
            print(f"Error getting service registry from Consul: {e}")
    
    # Fall back to legacy registry
    print("Using fallback service registry")
    return FALLBACK_SERVICE_REGISTRY

# Legacy fallback registry for backward compatibility
FALLBACK_SERVICE_REGISTRY = {
    "assistant": {
        "openai": {
            "endpoint": "http://localhost:5000",
            "description": "OpenAI Assistant for processing decision tasks",
            "assistant_id": None
        }
    },    "mcp": {
        "statistical": {
            "endpoint": "http://localhost:5201",
            "description": "MCP Statistical Analysis Service",
            "tools": ["enhanced_statistical_analysis", "calculate_statistics", "run_statistical_test"]
        },
        "script": {
            "endpoint": "http://localhost:5202", 
            "description": "MCP Script Execution Service"
        },
        "neo4j": {
            "endpoint": "http://localhost:5203",
            "description": "MCP Neo4j Database Service"
        }
    },
    "test": {
        "echo": {
            "endpoint": "http://localhost:5100",
            "description": "Echo test service for demonstration",
        }
    }
}

def update_assistant_id(assistant_id: str, service_name: Optional[str] = None) -> bool:
    """
    Update the assistant ID for a service.
    
    Args:
        assistant_id: The new assistant ID to use
        service_name: Specific service name, or None to update the first assistant service
        
    Returns:
        bool: True if successful, False otherwise
    """
    if not assistant_id:
        return False
        
    try:
        # If no specific service name, find the first assistant service
        if not service_name:
            assistant_service = find_service_by_type('assistant')
            if not assistant_service:
                print("No assistant service found")
                return False
        else:
            assistant_service = find_service_by_name(service_name)
            if not assistant_service:
                print(f"Service {service_name} not found")
                return False
        
        # Update environment variable for consistency
        os.environ["OPENAI_ASSISTANT_ID"] = assistant_id
        
        # Try to update the service metadata in Consul if available
        use_consul = os.environ.get("USE_CONSUL", "true").lower() == "true"
        if use_consul:
            try:
                import requests
                consul_url = os.environ.get("CONSUL_HTTP_ADDR", "http://localhost:8500")
                if not consul_url.startswith("http"):
                    if ":" in consul_url:
                        consul_url = f"http://{consul_url}"
                    else:
                        consul_url = f"http://{consul_url}:8500"
                
                # Use the actual service name from discovery
                actual_service_name = assistant_service.get('config', {}).get('name', 'unknown')
                
                # Get current service definition
                response = requests.get(f"{consul_url}/v1/agent/service/{actual_service_name}", timeout=5)
                if response.status_code == 200:
                    service_def = response.json()
                    
                    # Update the metadata
                    if "Meta" in service_def:
                        service_def["Meta"]["assistant_id"] = assistant_id
                        
                        # Re-register the service with updated metadata
                        deregister_response = requests.put(
                            f"{consul_url}/v1/agent/service/deregister/{actual_service_name}",
                            timeout=5
                        )
                        
                        register_response = requests.put(
                            f"{consul_url}/v1/agent/service/register",
                            json=service_def,
                            timeout=5
                        )
                        
                        if register_response.status_code == 200:
                            print(f"Updated assistant_id in Consul metadata for service: {actual_service_name}")
                            
            except ImportError:
                print("Requests module not available for updating Consul metadata")
            except Exception as e:
                print(f"Error updating assistant ID in Consul: {e}")
            
        return True
    except Exception as e:
        print(f"Error updating assistant ID: {e}")
        return False

# Load assistant ID from file if available
def load_assistant_id():
    """Load assistant ID from the assistant_id.json file."""
    base_dir = os.path.dirname(os.path.dirname(__file__))
    assistant_id_file = os.path.join(base_dir, "data", "assistant_id.json")
    if os.path.exists(assistant_id_file):
        try:
            with open(assistant_id_file, 'r') as f:
                data = json.load(f)
                if data and "assistant_id" in data and data["assistant_id"]:
                    os.environ["OPENAI_ASSISTANT_ID"] = data["assistant_id"]
                    print(f"Loaded assistant ID from file: {data['assistant_id']}")
                    return data["assistant_id"]
        except Exception as e:
            print(f"Error loading assistant ID from file: {e}")
    return None

# Initialize by loading assistant ID
load_assistant_id()

# Default service configuration
DEFAULT_SERVICE_TYPE = "assistant"
CONNECTION_TIMEOUT = 10
MAX_RETRIES = 3
RETRY_DELAY = 2