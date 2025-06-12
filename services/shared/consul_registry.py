"""
Shared Consul Service Registry Client for MCP Services

This module provides a shared ConsulServiceRegistry that MCP services can use
to register themselves with Consul, reusing the implementation from the OpenAI service.
"""

import os
import sys
import json
import logging
from typing import Optional, Dict, Any, List

# Add the project root to the path so we can import from services
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Import the existing ConsulServiceRegistry from OpenAI service
try:
    from services.openai_service.consul_registry import ConsulServiceRegistry
except ImportError as e:
    logging.error(f"Failed to import ConsulServiceRegistry: {e}")
    ConsulServiceRegistry = None

logger = logging.getLogger(__name__)

def register_mcp_service_with_consul(service_config_path: str, port: Optional[int] = None) -> bool:
    """
    Register an MCP service with Consul using its service_config.json
    
    Args:
        service_config_path: Path to the service_config.json file
        port: Optional port override
        
    Returns:
        bool: True if registration successful, False otherwise
    """
    if not ConsulServiceRegistry:
        logger.warning("ConsulServiceRegistry not available - skipping registration")
        return False
        
    try:
        # Load service configuration
        with open(service_config_path, 'r') as f:
            config = json.load(f)
        
        service_info = config.get("service", {})
        consul_config = service_info.get("consul", {})
        
        # Skip registration if not enabled
        if not consul_config.get("register", False):
            logger.info(f"Consul registration disabled for {service_info.get('name', 'unknown')}")
            return True
            
        # Get service details
        service_name = service_info.get("name")
        service_type = service_info.get("type", "mcp")
        service_port = port or service_info.get("port")
        service_description = service_info.get("description", "MCP Service")
        service_version = service_info.get("version", "1.0")
        service_tags = service_info.get("tags", [])
        
        if not service_name or not service_port:
            logger.error(f"Missing required service name or port in config: {service_config_path}")
            return False
            
        # Create registry client
        registry = ConsulServiceRegistry()
        
        # Prepare metadata
        metadata = {
            "type": service_type,
            "version": service_version,
            "description": service_description,
            "api": "REST",
            "mcp": "true"
        }
        
        # Add any additional metadata from config
        if "metadata" in service_info:
            metadata.update({k: str(v) for k, v in service_info["metadata"].items()})
            
        # Get health check configuration
        health_check = service_info.get("health_check", {})
        health_path = service_info.get("health_endpoint", "/health")
        health_interval = health_check.get("interval", "10s")
        
        # Register the service
        success = registry.register_service(
            name=service_name,
            service_type=service_type,
            port=service_port,
            tags=service_tags,
            meta=metadata,
            health_check_path=health_path,
            health_check_interval=health_interval
        )
        
        if success:
            logger.info(f"✅ Successfully registered MCP service '{service_name}' with Consul")
        else:
            logger.error(f"❌ Failed to register MCP service '{service_name}' with Consul")
            
        return success
        
    except Exception as e:
        logger.error(f"Error registering MCP service with Consul: {e}")
        return False

def deregister_mcp_service_from_consul(service_name: str) -> bool:
    """
    Deregister an MCP service from Consul
    
    Args:
        service_name: Name of the service to deregister
        
    Returns:
        bool: True if deregistration successful, False otherwise
    """
    if not ConsulServiceRegistry:
        logger.warning("ConsulServiceRegistry not available - skipping deregistration")
        return False
        
    try:
        registry = ConsulServiceRegistry()
        success = registry.deregister_service(service_name)
        
        if success:
            logger.info(f"✅ Successfully deregistered MCP service '{service_name}' from Consul")
        else:
            logger.error(f"❌ Failed to deregister MCP service '{service_name}' from Consul")
            
        return success
        
    except Exception as e:
        logger.error(f"Error deregistering MCP service from Consul: {e}")
        return False
