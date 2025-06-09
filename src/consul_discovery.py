"""
Consul Service Discovery Client

This module provides functionality to discover services registered with Consul.
"""
import os
import logging
import requests
from typing import Dict, Any, List, Optional, Tuple

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ConsulDiscovery:
    """
    Simple client for discovering services with Consul
    """
    
    def __init__(self, consul_url=None):
        """
        Initialize the Consul discovery client
        
        Args:
            consul_url: URL to the Consul server (default: from environment or localhost:8500)
        """
        # Get Consul URL from environment or use default
        self.consul_url = consul_url or os.environ.get("CONSUL_HTTP_ADDR", "http://localhost:8500")
        if self.consul_url and not self.consul_url.startswith("http"):
            if ":" in self.consul_url:
                self.consul_url = f"http://{self.consul_url}"
            else:
                self.consul_url = f"http://{self.consul_url}:8500"
                
        # Initialize HTTP session for connection pooling
        self._session = requests.Session()
        
        logger.info(f"Initialized Consul discovery client with URL: {self.consul_url}")
    
    def is_consul_available(self) -> bool:
        """
        Check if Consul is available
        
        Returns:
            bool: True if Consul is available, False otherwise
        """
        try:
            response = self._session.get(f"{self.consul_url}/v1/status/leader", timeout=2)
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"Consul not available: {e}")
            return False
    
    def get_service(self, service_name: str) -> Optional[Dict[str, Any]]:
        """
        Get service details from Consul
        
        Args:
            service_name: Name of the service to discover
        
        Returns:
            Optional[Dict]: Service details if found, None otherwise
        """
        if not self.is_consul_available():
            logger.warning(f"Consul not available, cannot discover service: {service_name}")
            return None
            
        try:
            logger.info(f"Looking up service in Consul: {service_name}")
            response = self._session.get(
                f"{self.consul_url}/v1/catalog/service/{service_name}",
                timeout=5
            )
            
            if response.status_code == 200:
                services = response.json()
                if services:
                    logger.info(f"Found service {service_name} in Consul")
                    # Return the first healthy instance
                    return services[0]
                else:
                    logger.warning(f"Service {service_name} not found in Consul")
                    return None
            else:
                logger.warning(f"Error looking up service {service_name}: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"Error discovering service {service_name}: {e}")
            return None
    
    def get_service_url(self, service_name: str, default_url: Optional[str] = None) -> Optional[str]:
        """
        Get the URL for a service registered with Consul
        
        Args:
            service_name: Name of the service to find
            default_url: Default URL to return if service not found
            
        Returns:
            Optional[str]: URL for the service, or default if not found
        """
        service = self.get_service(service_name)
        
        if service:
            protocol = service.get("Meta", {}).get("protocol", "http")
            address = service.get("ServiceAddress") or service.get("Address")
            port = service.get("ServicePort")
            
            if address and port:
                return f"{protocol}://{address}:{port}"
        
        logger.warning(f"Service {service_name} not found, using default URL: {default_url}")
        return default_url
    
    def get_service_by_type(self, service_type: str) -> Optional[Dict[str, Any]]:
        """
        Get the first service of a specific type
        
        Args:
            service_type: Type of service to find (as defined in service tags)
            
        Returns:
            Optional[Dict]: Service details if found, None otherwise
        """
        if not self.is_consul_available():
            logger.warning(f"Consul not available, cannot discover services by type: {service_type}")
            return None
            
        try:
            # Get all services
            logger.info(f"Looking up services by type: {service_type}")
            response = self._session.get(
                f"{self.consul_url}/v1/catalog/services",
                timeout=5
            )
            
            if response.status_code == 200:
                services_data = response.json()
                
                # Look for a service with the specified type in tags
                for service_name, tags in services_data.items():
                    if f"type-{service_type}" in tags:
                        # Get details for this service
                        service_details = self.get_service(service_name)
                        if service_details:
                            logger.info(f"Found service {service_name} with type {service_type}")
                            return service_details
                
                logger.warning(f"No service found with type {service_type}")
                return None
            else:
                logger.warning(f"Error looking up services: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"Error discovering services by type {service_type}: {e}")
            return None
    
    def get_service_url_by_type(self, service_type: str, default_url: Optional[str] = None) -> Optional[str]:
        """
        Get the URL for a service of a specific type
        
        Args:
            service_type: Type of service to find
            default_url: Default URL to return if service not found
            
        Returns:
            Optional[str]: URL for the service, or default if not found
        """
        service = self.get_service_by_type(service_type)
        
        if service:
            protocol = service.get("Meta", {}).get("protocol", "http")
            address = service.get("ServiceAddress") or service.get("Address")
            port = service.get("ServicePort")
            
            if address and port:
                return f"{protocol}://{address}:{port}"
        
        logger.warning(f"No service found with type {service_type}, using default URL: {default_url}")
        return default_url
    
    def build_service_registry(self) -> Dict[str, Dict[str, Dict[str, Any]]]:
        """
        Build a service registry from Consul services
        
        Returns:
            Dict: Service registry in the format expected by ServiceOrchestrator
        """
        if not self.is_consul_available():
            logger.warning(f"Consul not available, returning empty registry")
            return {}
            
        try:
            registry = {}
            
            # Get all services
            logger.info(f"Building service registry from Consul")
            response = self._session.get(
                f"{self.consul_url}/v1/catalog/services",
                timeout=5
            )
            
            if response.status_code == 200:
                services_data = response.json()
                
                for service_name, tags in services_data.items():
                    # Extract type from tags
                    type_tag = next((tag for tag in tags if tag.startswith("type-")), None)
                    service_type = type_tag.split("-")[1] if type_tag else "unknown"
                    
                    # Get service details
                    service_details = self.get_service(service_name)
                    if service_details:
                        # Extract metadata
                        meta = service_details.get("Meta", {})
                        service_meta_name = meta.get("name", service_name)
                        
                        # Create registry entry
                        if service_type not in registry:
                            registry[service_type] = {}
                            
                        protocol = meta.get("protocol", "http")
                        address = service_details.get("ServiceAddress") or service_details.get("Address")
                        port = service_details.get("ServicePort")
                        
                        registry[service_type][service_meta_name] = {
                            "endpoint": f"{protocol}://{address}:{port}",
                            "version": meta.get("version", "1.0"),
                            "description": meta.get("description", ""),
                        }
                        
                        # Add any assistant-specific properties
                        if service_type == "assistant" and "assistant_id" in meta:
                            registry[service_type][service_meta_name]["assistant_id"] = meta["assistant_id"]
            
            logger.info(f"Built service registry with {sum(len(svc) for svc in registry.values())} services")
            return registry
        except Exception as e:
            logger.error(f"Error building service registry: {e}")
            return {}
    
    def close(self):
        """Close HTTP session and clean up resources"""
        if hasattr(self, '_session'):
            self._session.close()
