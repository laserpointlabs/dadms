"""
ServiceOrchestrator extension for Consul integration

This module provides a Consul-enabled version of the ServiceOrchestrator class.
It can be used as a drop-in replacement for the original ServiceOrchestrator.
"""
import os
import logging
from src.service_orchestrator import ServiceOrchestrator as BaseServiceOrchestrator

# Configure logging
logger = logging.getLogger(__name__)

class ConsulServiceOrchestrator(BaseServiceOrchestrator):
    """
    Extended ServiceOrchestrator with Consul integration
    """
    
    def __init__(self, service_registry=None, debug=False):
        """
        Initialize the ConsulServiceOrchestrator
        
        Args:
            service_registry: Dictionary mapping service types and names to endpoints
                             If None, will attempt to build from Consul
            debug: Enable debug logging (default: False)
        """
        # Try to import ConsulDiscovery
        try:
            from src.consul_discovery import ConsulDiscovery
            
            # If no registry provided, try to build one from Consul
            if service_registry is None:
                try:
                    # Initialize Consul discovery client
                    consul_discovery = ConsulDiscovery()
                    
                    # Check if Consul is available
                    if consul_discovery.is_consul_available():
                        # Get registry from Consul
                        consul_registry = consul_discovery.build_service_registry()
                        if consul_registry:
                            logger.info(f"Built service registry from Consul with {sum(len(svc) for svc in consul_registry.values())} services")
                            service_registry = consul_registry
                except Exception as e:
                    logger.warning(f"Error building service registry from Consul: {e}")
        except ImportError:
            logger.warning("ConsulDiscovery not available. Using default service registry.")
            
        # Call the parent class initializer with the registry
        super().__init__(service_registry=service_registry, debug=debug)
        
    def get_service_url(self, service_type, service_name=None):
        """
        Get the URL for a service by type and name
        
        Args:
            service_type: Type of service (e.g., 'assistant')
            service_name: Name of service (e.g., 'openai'), if None will return the first service of the specified type
            
        Returns:
            str: URL for the service, or None if not found
        """
        # First check the registry
        try:
            # If service name is provided, use it
            if service_name:
                if service_type in self.service_registry and service_name in self.service_registry[service_type]:
                    return self.service_registry[service_type][service_name].get("endpoint")
                
            # Otherwise, return the first service of the specified type
            if service_type in self.service_registry:
                for name, config in self.service_registry[service_type].items():
                    return config.get("endpoint")
        except Exception as e:
            logger.warning(f"Error getting service URL from registry: {e}")
        
        # If not found in registry, try to discover from Consul directly
        try:
            from src.consul_discovery import ConsulDiscovery
            
            # Initialize Consul discovery client
            consul_discovery = ConsulDiscovery()
            
            # Try to get service by type with specified name
            if service_name:
                service_url = consul_discovery.get_service_url(f"{service_name}", "")
                if service_url:
                    return service_url
            
            # Try by type if no name or not found with name
            return consul_discovery.get_service_url_by_type(service_type, "")
            
        except ImportError:
            logger.warning("ConsulDiscovery not available.")
        
        return None
    
    def update_registry_from_consul(self):
        """
        Update the service registry from Consul
        
        Returns:
            bool: True if updated successfully, False otherwise
        """
        try:
            # Try to import ConsulDiscovery
            from src.consul_discovery import ConsulDiscovery
            
            # Initialize Consul discovery client
            consul_discovery = ConsulDiscovery()
            
            # Check if Consul is available
            if not consul_discovery.is_consul_available():
                logger.warning("Consul not available. Using current service registry.")
                return False
                
            # Get registry from Consul
            consul_registry = consul_discovery.build_service_registry()
            if not consul_registry:
                logger.warning("No services found in Consul. Using current service registry.")
                return False
                
            # Update the registry
            logger.info(f"Updating service registry from Consul with {sum(len(svc) for svc in consul_registry.values())} services")
            for service_type, services in consul_registry.items():
                if service_type not in self.service_registry:
                    self.service_registry[service_type] = {}
                    
                for service_name, service_config in services.items():
                    self.service_registry[service_type][service_name] = service_config
                    
            return True
                
        except ImportError:
            logger.warning("ConsulDiscovery not available. Using current service registry.")
            return False
        except Exception as e:
            logger.error(f"Error updating registry from Consul: {e}")
            return False
