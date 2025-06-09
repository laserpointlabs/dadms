"""
Service Orchestrator

This module provides functionality to route tasks to the appropriate service
based on properties defined in BPMN service tasks.
"""
import json
import logging
import requests
from urllib.parse import urljoin
import os
import re
from functools import lru_cache
from time import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Try to import ConsulDiscovery if available
try:
    from src.consul_discovery import ConsulDiscovery
    CONSUL_AVAILABLE = True
except ImportError:
    CONSUL_AVAILABLE = False
    logger.warning("ConsulDiscovery not available. Using default service registry.")

# Import the new dynamic service registry
try:
    from config.service_registry import get_service_registry
    DYNAMIC_REGISTRY_AVAILABLE = True
except ImportError:
    DYNAMIC_REGISTRY_AVAILABLE = False
    logger.warning("Dynamic service registry not available. Using fallback methods.")

class ServiceOrchestrator:
    """
    Service orchestration layer that routes tasks to appropriate services
    based on properties defined in the BPMN model.
    """
    
    def __init__(self, service_registry=None, debug=False, use_consul=True):
        """
        Initialize the ServiceOrchestrator
        
        Args:
            service_registry: Dictionary mapping service types and names to endpoints
                             If None, will use Consul discovery or a default in-memory registry
            debug: Enable debug logging (default: False)
            use_consul: Whether to use Consul for service discovery (default: True)
        """
        # Try to initialize from Consul if requested and available
        self.consul_discovery = None
        consul_registry = {}
        
        if use_consul and CONSUL_AVAILABLE:
            try:
                self.consul_discovery = ConsulDiscovery()
                if self.consul_discovery.is_consul_available():
                    consul_registry = self.consul_discovery.build_service_registry()
                    logger.info(f"Built service registry from Consul with {sum(len(svc) for svc in consul_registry.values())} services")
                else:
                    logger.warning("Consul not available. Using default service registry.")
            except Exception as e:
                logger.warning(f"Error initializing Consul discovery: {e}")
          # Determine service registry to use (prioritized order)
        if service_registry:
            # Use provided registry (highest priority)
            self.service_registry = service_registry
            logger.info("Using provided service registry")
        elif DYNAMIC_REGISTRY_AVAILABLE:
            # Try dynamic discovery from service configs
            try:
                dynamic_registry = get_service_registry()
                if dynamic_registry:
                    self.service_registry = dynamic_registry
                    logger.info("Using dynamic service registry from service configurations")
                else:
                    self.service_registry = self._get_fallback_registry()
            except Exception as e:
                logger.warning(f"Error getting dynamic service registry: {e}")
                self.service_registry = self._get_fallback_registry()
        elif consul_registry:
            # Use registry from Consul
            self.service_registry = consul_registry
            logger.info("Using service registry from Consul")
        else:
            # Use default fallback registry
            self.service_registry = self._get_fallback_registry()
            logger.info("Using fallback service registry")
        
        # Set debug mode
        self.debug = debug
        
        # Initialize caches
        self._process_xml_cache = {}  # process_definition_id -> xml_data
        self._service_properties_cache = {}  # activity_id -> properties
        self._task_documentation_cache = {}  # activity_id -> documentation
        
        # Initialize HTTP session for connection pooling
        self._session = requests.Session()
        
        logger.info(f"Initialized ServiceOrchestrator with registry: {self.service_registry}")
    
    def _get_fallback_registry(self):
        """Get the fallback service registry when other methods fail"""
        return {
            "assistant": {
                "openai": {
                    "endpoint": os.environ.get("OPENAI_SERVICE_URL", "http://localhost:5000")
                }
            }
        }
    
    def extract_service_properties(self, task):
        """
        Extract service properties from a Camunda external task
        
        Args:
            task: Camunda external task object
            
        Returns:
            dict: Service properties (type, name, version)
        """
        # Get activity ID from task
        activity_id = task.get_activity_id()
        if not activity_id:
            logger.warning("Task has no activity ID, using default service properties")
            return self._get_default_properties()

        # Check cache first
        if activity_id in self._service_properties_cache:
            if self.debug:
                logger.debug(f"Using cached service properties for activity ID: {activity_id}")
            return self._service_properties_cache[activity_id]

        # Get process instance ID
        process_instance_id = task.get_process_instance_id()
        if not process_instance_id:
            logger.warning("Task has no process instance ID, using default service properties")
            return self._get_default_properties()
        
        # Get process XML
        xml_data = self._get_process_xml_for_task(task)
        if not xml_data:
            logger.warning("Could not retrieve process XML, using default service properties")
            return self._get_default_properties()
        
        # Parse XML to extract properties
        logger.info(f"Extracting service properties for activity ID: {activity_id}")
        
        # Look for service task properties
        # Pattern to find extension elements for this activity ID
        pattern = f'id="{re.escape(activity_id)}"[^>]*>.*?<bpmn:extensionElements>(.*?)</bpmn:extensionElements>'
        extension_match = re.search(pattern, xml_data, re.DOTALL)
        
        if extension_match:
            extension_xml = extension_match.group(1)
            
            # Pattern to find camunda:properties within extension elements
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
                
                logger.info(f"Found service properties: {props}")
                
                # Create the result with defaults for missing values
                result = {
                    "service.type": props.get("service.type", "assistant"),
                    "service.name": props.get("service.name", "openai"),
                    "service.version": props.get("service.version", "1.0"),
                    # Extra properties are preserved for more specific service configuration
                    **{k: v for k, v in props.items() if not k.startswith("service.")}
                }
                
                # Cache the result
                self._service_properties_cache[activity_id] = result
                
                return result
        
        logger.warning(f"No service properties found for activity ID: {activity_id}")
        default_props = self._get_default_properties()
        # Cache the default properties for this activity ID
        self._service_properties_cache[activity_id] = default_props
        return default_props
    
    def _get_default_properties(self):
        """Return default service properties"""
        return {
            "service.type": "assistant",
            "service.name": "openai",
            "service.version": "1.0"
        }
    
    def _get_process_xml_for_task(self, task):
        """Get the process XML for a task"""
        try:
            # Get process instance ID
            process_instance_id = task.get_process_instance_id()
            
            # Get process definition ID
            process_definition_id = self._get_process_definition_id(process_instance_id)
            if not process_definition_id:
                return None
            
            # Check if XML is already in cache
            if process_definition_id in self._process_xml_cache:
                if self.debug:
                    logger.debug(f"Using cached process XML for definition ID: {process_definition_id}")
                return self._process_xml_cache[process_definition_id]
            
            # Get process XML
            xml_data = self._get_process_xml(process_definition_id)
            
            # Cache the XML data
            if xml_data:
                self._process_xml_cache[process_definition_id] = xml_data
                
            return xml_data
            
        except Exception as e:
            logger.error(f"Error getting process XML: {str(e)}")
            return None
    
    def _get_process_definition_id(self, process_instance_id):
        """Get process definition ID from process instance ID"""
        from config import camunda_config
        
        base_url = camunda_config.CAMUNDA_ENGINE_URL
        if not base_url.endswith('/'):
            base_url += '/'
        
        url = f"{base_url}process-instance/{process_instance_id}"
        
        try:
            # Use session for connection pooling
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
        
        base_url = camunda_config.CAMUNDA_ENGINE_URL
        if not base_url.endswith('/'):
            base_url += '/'
        
        url = f"{base_url}process-definition/{process_definition_id}/xml"
        
        try:
            # Use session for connection pooling
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
            # Get activity ID from task
            activity_id = task.get_activity_id()
            if not activity_id:
                return None
            
            # Check cache first
            if activity_id in self._task_documentation_cache:
                if self.debug:
                    logger.debug(f"Using cached documentation for activity ID: {activity_id}")
                return self._task_documentation_cache[activity_id]
            
            # Get process XML
            xml_data = self._get_process_xml_for_task(task)
            if not xml_data:
                return None
            
            # Look for activity documentation in XML
            pattern = f'id="{re.escape(activity_id)}"[^>]*>\\s*<bpmn:documentation>(.*?)</bpmn:documentation>'
            matches = re.search(pattern, xml_data, re.DOTALL)
            
            if matches:
                documentation = matches.group(1).strip()
                logger.info(f"Found documentation for activity ID {activity_id}")
                
                # Cache the documentation
                self._task_documentation_cache[activity_id] = documentation
                
                return documentation
            
            logger.info(f"No documentation found for activity ID {activity_id}")
            
            # Cache the negative result as None
            self._task_documentation_cache[activity_id] = None
            
            return None
            
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
        # Start performance timer if in debug mode
        start_time = time() if self.debug else None
        
        # Extract service properties from task (uses cache if available)
        properties = self.extract_service_properties(task)
        
        # Get service endpoint from registry
        service_type = properties.get("service.type")
        service_name = properties.get("service.name")
        
        if not service_type or not service_name:
            service_type = "assistant"
            service_name = "openai"
        
        logger.info(f"Routing task to service: {service_type}/{service_name}")
        
        try:
            # Find the service in the registry
            if service_type in self.service_registry and service_name in self.service_registry[service_type]:
                service_config = self.service_registry[service_type][service_name]
            else:
                error_msg = f"No service found for type='{service_type}', name='{service_name}'"
                logger.error(error_msg)
                raise ValueError(error_msg)
            
            endpoint = service_config.get("endpoint")
            if not endpoint:
                raise ValueError(f"No endpoint defined for service {service_type}/{service_name}")
            
            # Get task documentation (uses cache if available)
            task_documentation = self.get_task_documentation(task)
            
            # Prepare request
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
            
            # Make the request to the service using session for connection pooling
            response = self._session.post(url, json=payload, timeout=300)  # 5-minute timeout
            
            # Log performance metrics in debug mode
            if self.debug and start_time:
                logger.debug(f"Service call took {time() - start_time:.2f} seconds")
            
            if response.status_code == 200:
                result = response.json().get("result", {})
                logger.info(f"Service request succeeded, received result with {len(result)} keys")
                return result
            else:
                error_msg = response.json().get("message", f"Unknown error, status code: {response.status_code}")
                logger.error(f"Service request failed: {error_msg}")
                raise Exception(f"Service request failed: {error_msg}")
                
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error routing task to service: {error_msg}")
            return {
                "error": error_msg,
                "service": f"{service_type}/{service_name}",
                "task": task.get_activity_id()
            }
    
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
