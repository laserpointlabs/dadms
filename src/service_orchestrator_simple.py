"""
Simple Service Orchestrator

This module provides a simplified and refactored service orchestrator that uses
the new dynamic service discovery system.
"""
import json
import logging
import requests
from urllib.parse import urljoin
import os
import re
from time import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Try to import optional dependencies
try:
    from src.consul_discovery import ConsulDiscovery
    CONSUL_AVAILABLE = True
except ImportError:
    CONSUL_AVAILABLE = False

try:
    from config.service_registry import get_service_registry
    DYNAMIC_REGISTRY_AVAILABLE = True
except ImportError:
    DYNAMIC_REGISTRY_AVAILABLE = False

class SimpleServiceOrchestrator:
    """
    Simplified service orchestration layer that routes tasks to appropriate services
    using dynamic service discovery.
    """
    
    def __init__(self, service_registry=None, debug=False):
        """
        Initialize the SimpleServiceOrchestrator
        
        Args:
            service_registry: Dictionary mapping service types and names to endpoints
                             If None, will use dynamic discovery with fallbacks
            debug: Enable debug logging (default: False)
        """
        self.debug = debug
        self.service_registry = service_registry or self._discover_services()
        
        # Initialize caches for performance
        self._process_xml_cache = {}
        self._service_properties_cache = {}
        self._task_documentation_cache = {}
        
        # Initialize HTTP session for connection pooling
        self._session = requests.Session()
        
        logger.info(f"Initialized SimpleServiceOrchestrator with {self._count_services()} services")
    
    def _discover_services(self):
        """Discover services using the priority chain: dynamic -> consul -> fallback"""
        
        # Try dynamic discovery first
        if DYNAMIC_REGISTRY_AVAILABLE:
            try:
                registry = get_service_registry()
                if registry:
                    logger.info("Using dynamic service discovery")
                    return registry
            except Exception as e:
                logger.warning(f"Dynamic service discovery failed: {e}")
        
        # Try Consul discovery
        if CONSUL_AVAILABLE:
            try:
                consul_discovery = ConsulDiscovery()
                if consul_discovery.is_consul_available():
                    registry = consul_discovery.build_service_registry()
                    if registry:
                        logger.info("Using Consul service discovery")
                        return registry
            except Exception as e:
                logger.warning(f"Consul service discovery failed: {e}")
        
        # Fallback to hardcoded registry
        logger.info("Using fallback service registry")
        return {
            "assistant": {
                "dadm-openai-assistant": {
                    "endpoint": os.environ.get("OPENAI_SERVICE_URL", "http://localhost:5000"),
                    "description": "OpenAI Assistant Service"
                }
            },
            "test": {
                "dadm-echo-service": {
                    "endpoint": "http://localhost:5100",
                    "description": "Echo Test Service"
                }
            }
        }
    
    def _count_services(self):
        """Count total services in registry"""
        return sum(len(services) for services in self.service_registry.values())
    
    def extract_service_properties(self, task):
        """
        Extract service properties from a Camunda external task
        
        Args:
            task: Camunda external task object
            
        Returns:
            dict: Service properties (type, name, version)
        """
        activity_id = task.get_activity_id()
        if not activity_id:
            logger.warning("Task has no activity ID, using default service properties")
            return self._get_default_properties()

        # Check cache first
        if activity_id in self._service_properties_cache:
            if self.debug:
                logger.debug(f"Using cached service properties for activity ID: {activity_id}")
            return self._service_properties_cache[activity_id]

        # Get process XML and extract properties
        xml_data = self._get_process_xml_for_task(task)
        if not xml_data:
            logger.warning("Could not retrieve process XML, using default service properties")
            return self._get_default_properties()
        
        # Parse XML to extract properties
        properties = self._parse_service_properties_from_xml(xml_data, activity_id)
        
        # Cache the result
        self._service_properties_cache[activity_id] = properties
        
        return properties
    
    def _parse_service_properties_from_xml(self, xml_data, activity_id):
        """Parse service properties from BPMN XML"""
        try:
            # Look for service task properties
            pattern = f'id="{re.escape(activity_id)}"[^>]*>.*?<bpmn:extensionElements>(.*?)</bpmn:extensionElements>'
            extension_match = re.search(pattern, xml_data, re.DOTALL)
            
            if extension_match:
                extension_xml = extension_match.group(1)
                
                # Find camunda:properties
                props_pattern = r'<camunda:properties>(.*?)</camunda:properties>'
                props_match = re.search(props_pattern, extension_xml, re.DOTALL)
                
                if props_match:
                    properties_xml = props_match.group(1)
                    
                    # Extract individual properties
                    props = {}
                    prop_pattern = r'<camunda:property name="([^"]+)" value="([^"]+)"'
                    for prop_match in re.finditer(prop_pattern, properties_xml):
                        name, value = prop_match.groups()
                        props[name] = value
                    
                    if props:
                        logger.info(f"Found service properties: {props}")
                        return {
                            "service.type": props.get("service.type", "assistant"),
                            "service.name": props.get("service.name", "dadm-openai-assistant"),
                            "service.version": props.get("service.version", "1.0"),
                            **{k: v for k, v in props.items() if not k.startswith("service.")}
                        }
        except Exception as e:
            logger.error(f"Error parsing service properties from XML: {e}")
        
        logger.warning(f"No service properties found for activity ID: {activity_id}")
        return self._get_default_properties()
    
    def _get_default_properties(self):
        """Return default service properties"""
        return {
            "service.type": "assistant",
            "service.name": "dadm-openai-assistant", 
            "service.version": "1.0"
        }
    
    def _get_process_xml_for_task(self, task):
        """Get the process XML for a task"""
        try:
            process_instance_id = task.get_process_instance_id()
            process_definition_id = self._get_process_definition_id(process_instance_id)
            
            if not process_definition_id:
                return None
            
            # Check cache
            if process_definition_id in self._process_xml_cache:
                if self.debug:
                    logger.debug(f"Using cached process XML for definition ID: {process_definition_id}")
                return self._process_xml_cache[process_definition_id]
            
            # Get and cache XML
            xml_data = self._get_process_xml(process_definition_id)
            if xml_data:
                self._process_xml_cache[process_definition_id] = xml_data
                
            return xml_data
            
        except Exception as e:
            logger.error(f"Error getting process XML: {str(e)}")
            return None
    
    def _get_process_definition_id(self, process_instance_id):
        """Get process definition ID from process instance ID"""
        from config import camunda_config
        
        base_url = camunda_config.CAMUNDA_ENGINE_URL.rstrip('/')
        url = f"{base_url}/process-instance/{process_instance_id}"
        
        try:
            response = self._session.get(url)
            if response.status_code == 200:
                data = response.json()
                return data.get('definitionId')
        except Exception as e:
            logger.error(f"Error getting process definition ID: {str(e)}")
        
        return None
    
    def _get_process_xml(self, process_definition_id):
        """Get process XML from process definition ID"""
        from config import camunda_config
        
        base_url = camunda_config.CAMUNDA_ENGINE_URL.rstrip('/')
        url = f"{base_url}/process-definition/{process_definition_id}/xml"
        
        try:
            response = self._session.get(url)
            if response.status_code == 200:
                data = response.json()
                return data.get('bpmn20Xml')
        except Exception as e:
            logger.error(f"Error getting process XML: {str(e)}")
        
        return None
    
    def get_task_documentation(self, task):
        """
        Extract documentation for a task from the BPMN XML
        
        Args:
            task: Camunda external task object
            
        Returns:
            str: Task documentation, or None if not available
        """
        try:
            activity_id = task.get_activity_id()
            if not activity_id:
                return None
            
            # Check cache first
            if activity_id in self._task_documentation_cache:
                if self.debug:
                    logger.debug(f"Using cached documentation for activity ID: {activity_id}")
                return self._task_documentation_cache[activity_id]
            
            xml_data = self._get_process_xml_for_task(task)
            if not xml_data:
                return None
            
            # Look for documentation
            pattern = f'id="{re.escape(activity_id)}"[^>]*>\\s*<bpmn:documentation>(.*?)</bpmn:documentation>'
            matches = re.search(pattern, xml_data, re.DOTALL)
            
            documentation = None
            if matches:
                documentation = matches.group(1).strip()
                logger.info(f"Found documentation for activity ID {activity_id}")
            
            # Cache the result (even if None)
            self._task_documentation_cache[activity_id] = documentation
            return documentation
            
        except Exception as e:
            logger.error(f"Error retrieving task documentation: {str(e)}")
            return None
    
    def route_task(self, task, variables=None):
        """
        Route a task to the appropriate service based on its properties
        
        Args:
            task: Camunda external task object
            variables: Task variables
            
        Returns:
            dict: Result from the service
        """
        start_time = time() if self.debug else None
        
        # Extract service properties
        properties = self.extract_service_properties(task)
        service_type = properties.get("service.type", "assistant")
        service_name = properties.get("service.name", "dadm-openai-assistant")
        
        logger.info(f"Routing task to service: {service_type}/{service_name}")
        
        try:
            # Find the service in the registry
            service_config = self._find_service(service_type, service_name)
            if not service_config:
                raise ValueError(f"No service found for type='{service_type}', name='{service_name}'")
            
            endpoint = service_config.get("endpoint")
            if not endpoint:
                raise ValueError(f"No endpoint defined for service {service_type}/{service_name}")
            
            # Get task documentation
            task_documentation = self.get_task_documentation(task)
            
            # Prepare and send request
            result = self._send_service_request(
                endpoint, task, task_documentation, variables, properties
            )
            
            if self.debug and start_time:
                logger.debug(f"Service call took {time() - start_time:.2f} seconds")
            
            return result
                
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error routing task to service: {error_msg}")
            return {
                "error": error_msg,
                "service": f"{service_type}/{service_name}",
                "task": task.get_activity_id()
            }
    
    def _find_service(self, service_type, service_name):
        """Find a service in the registry"""
        if service_type in self.service_registry:
            services_of_type = self.service_registry[service_type]
            
            # Try exact name match first
            if service_name in services_of_type:
                return services_of_type[service_name]
            
            # Try partial name match
            for name, config in services_of_type.items():
                if service_name in name or name in service_name:
                    logger.info(f"Using partial match: {name} for requested {service_name}")
                    return config
            
            # Return first service of this type
            if services_of_type:
                first_service = list(services_of_type.keys())[0]
                logger.info(f"Using first available service: {first_service} for type {service_type}")
                return services_of_type[first_service]
        
        return None
    
    def _send_service_request(self, endpoint, task, task_documentation, variables, properties):
        """Send request to service"""
        url = urljoin(endpoint, '/process_task')
        payload = {
            "task_name": task.get_activity_id(),
            "task_documentation": task_documentation,
            "variables": variables or {},
            "service_properties": properties
        }
        
        logger.info(f"Sending request to {url}")
        if self.debug:
            logger.debug(f"Request payload: {payload}")
        
        response = self._session.post(url, json=payload, timeout=300)
        
        if response.status_code == 200:
            result = response.json().get("result", {})
            logger.info(f"Service request succeeded, received result with {len(result)} keys")
            return result
        else:
            error_msg = response.json().get("message", f"Unknown error, status code: {response.status_code}")
            logger.error(f"Service request failed: {error_msg}")
            raise Exception(f"Service request failed: {error_msg}")
    
    def refresh_service_registry(self):
        """Refresh the service registry by rediscovering services"""
        logger.info("Refreshing service registry")
        old_count = self._count_services()
        self.service_registry = self._discover_services()
        new_count = self._count_services()
        logger.info(f"Service registry refreshed: {old_count} -> {new_count} services")
    
    def clear_caches(self):
        """Clear all internal caches"""
        self._process_xml_cache.clear()
        self._service_properties_cache.clear()
        self._task_documentation_cache.clear()
        logger.info("All service orchestrator caches cleared")
    
    def close(self):
        """Close HTTP session and clean up resources"""
        if self._session:
            self._session.close()
            logger.info("Service orchestrator HTTP session closed")
    
    def get_service_info(self):
        """Get information about discovered services"""
        return {
            "total_services": self._count_services(),
            "service_types": list(self.service_registry.keys()),
            "services_by_type": {
                stype: list(services.keys()) 
                for stype, services in self.service_registry.items()
            }
        }
