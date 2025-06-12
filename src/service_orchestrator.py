"""
Service Orchestrator

This module provides an optimized ServiceOrchestrator with advanced performance features:
- Efficient XML parsing using ElementTree
- Time-based cache expiration
- Prefetching for predictable workflows
- Performance metrics collection
- Batch task processing
- MCP (Model Context Protocol) service support with tool discovery
"""
import json
import logging
import os
import re
import time
import xml.etree.ElementTree as ET
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from functools import lru_cache
from threading import Lock
from typing import Dict, List, Optional, Set, Tuple, Union
from urllib.parse import urljoin

import requests

# Try to import ConsulDiscovery if available
try:
    from src.consul_discovery import ConsulDiscovery
    CONSUL_AVAILABLE = True
except ImportError:
    CONSUL_AVAILABLE = False
    logger.warning("ConsulDiscovery not available. Using dynamic service discovery.")

# Import the new dynamic service registry
try:
    from config.service_registry import get_service_registry
    DYNAMIC_REGISTRY_AVAILABLE = True
except ImportError:
    DYNAMIC_REGISTRY_AVAILABLE = False

# Import the new analysis service integration
try:
    from src.analysis_service_integration import get_analysis_service
    ANALYSIS_SERVICE_AVAILABLE = True
except ImportError:
    ANALYSIS_SERVICE_AVAILABLE = False
    logger.warning("Analysis service integration not available. Data persistence disabled.")

# Register the namespace for BPMN XML
ET.register_namespace('bpmn', 'http://www.omg.org/spec/BPMN/20100524/MODEL')
ET.register_namespace('camunda', 'http://camunda.org/schema/1.0/bpmn')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class CacheEntry:
    """Cache entry with expiration time."""
    value: any
    expiry: float = None  # None means no expiration
    last_accessed: float = field(default_factory=time.time)
    access_count: int = 0

    def is_expired(self) -> bool:
        """Check if the cache entry has expired."""
        if self.expiry is None:
            return False
        return time.time() > self.expiry

    def access(self) -> None:
        """Update access time and count."""
        self.last_accessed = time.time()
        self.access_count += 1


@dataclass
class OrchestratorMetrics:
    """Performance metrics for the ServiceOrchestrator."""
    cache_hits: Dict[str, int] = field(default_factory=lambda: defaultdict(int))
    cache_misses: Dict[str, int] = field(default_factory=lambda: defaultdict(int))
    operation_times: Dict[str, List[float]] = field(default_factory=lambda: defaultdict(list))
    api_calls: Dict[str, int] = field(default_factory=lambda: defaultdict(int))
    total_tasks_processed: int = 0
    workflows_processed: Set[str] = field(default_factory=set)
    
    def record_cache_hit(self, cache_name: str) -> None:
        """Record a cache hit."""
        self.cache_hits[cache_name] += 1
    
    def record_cache_miss(self, cache_name: str) -> None:
        """Record a cache miss."""
        self.cache_misses[cache_name] += 1
    
    def record_operation_time(self, operation_name: str, duration: float) -> None:
        """Record an operation duration."""
        self.operation_times[operation_name].append(duration)
    
    def record_api_call(self, endpoint: str) -> None:
        """Record an API call."""
        self.api_calls[endpoint] += 1
    
    def get_hit_rate(self, cache_name: str) -> float:
        """Get cache hit rate."""
        hits = self.cache_hits.get(cache_name, 0)
        misses = self.cache_misses.get(cache_name, 0)
        total = hits + misses
        return hits / total if total > 0 else 0
    
    def get_avg_operation_time(self, operation_name: str) -> float:
        """Get average time for an operation."""
        times = self.operation_times.get(operation_name, [])
        return sum(times) / len(times) if times else 0
    
    def get_summary(self) -> Dict:
        """Get a summary of metrics."""
        hit_rates = {name: self.get_hit_rate(name) for name in self.cache_hits.keys()}
        avg_times = {name: self.get_avg_operation_time(name) for name in self.operation_times.keys()}
        
        return {
            "cache_hit_rates": hit_rates,
            "avg_operation_times": avg_times,
            "api_calls": dict(self.api_calls),
            "total_tasks_processed": self.total_tasks_processed,
            "total_workflows_processed": len(self.workflows_processed)
        }


class TimeExpiringCache:
    """Cache with time-based expiration."""
    
    def __init__(self, default_ttl: Optional[int] = None):
        """
        Initialize the cache.
        
        Args:
            default_ttl: Default time-to-live in seconds for cache entries.
                        If None, entries don't expire.
        """
        self._cache: Dict[str, CacheEntry] = {}
        self._default_ttl = default_ttl
        self._lock = Lock()
        self._metrics = {"hits": 0, "misses": 0}
    
    def get(self, key: str) -> Optional[any]:
        """
        Get a value from the cache.
        
        Args:
            key: Cache key
            
        Returns:
            The cached value or None if not found or expired
        """
        with self._lock:
            entry = self._cache.get(key)
            
            if entry is None:
                self._metrics["misses"] += 1
                return None
            
            if entry.is_expired():
                del self._cache[key]
                self._metrics["misses"] += 1
                return None
            
            entry.access()
            self._metrics["hits"] += 1
            return entry.value
    
    def set(self, key: str, value: any, ttl: Optional[int] = None) -> None:
        """
        Set a value in the cache.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time-to-live in seconds, or None for default
        """
        expiry = None
        if ttl is not None:
            expiry = time.time() + ttl
        elif self._default_ttl is not None:
            expiry = time.time() + self._default_ttl
        
        entry = CacheEntry(value=value, expiry=expiry)
        
        with self._lock:
            self._cache[key] = entry
    
    def delete(self, key: str) -> bool:
        """
        Delete an entry from the cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if the key was found and deleted, False otherwise
        """
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False
    
    def clear(self) -> None:
        """Clear all entries from the cache."""
        with self._lock:
            self._cache.clear()
    
    def get_metrics(self) -> Dict[str, int]:
        """Get cache metrics."""
        with self._lock:
            return self._metrics.copy()
    
    def cleanup_expired(self) -> int:
        """
        Remove expired entries from the cache.
        
        Returns:
            Number of entries removed
        """
        removed = 0
        with self._lock:
            expired_keys = [k for k, v in self._cache.items() if v.is_expired()]
            for key in expired_keys:
                del self._cache[key]
                removed += 1
        return removed


class ServiceOrchestrator:
    """
    Enhanced service orchestration layer with optimized performance features.
    """
    
    def __init__(
        self, 
        service_registry=None, 
        debug=False,
        enable_metrics=True,
        xml_cache_ttl=3600,  # 1 hour
        props_cache_ttl=3600,  # 1 hour
        docs_cache_ttl=3600,   # 1 hour
    ):
        """
        Initialize the ServiceOrchestrator
        
        Args:
            service_registry: Dictionary mapping service types and names to endpoints
                             If None, will use a default in-memory registry
            debug: Enable debug logging (default: False)
            enable_metrics: Enable performance metrics collection (default: True)
            xml_cache_ttl: Cache TTL in seconds for process XML (default: 1 hour)
            props_cache_ttl: Cache TTL in seconds for service properties (default: 1 hour)
            docs_cache_ttl: Cache TTL in seconds for task documentation (default: 1 hour)        
            """

        # Import MCP handler
        try:
            from src.mcp_service_handler import MCPServiceHandler
            self.mcp_handler = MCPServiceHandler()
            logger.info("MCP service handler initialized")
        except ImportError as e:
            self.mcp_handler = None
            logger.warning(f"MCP service handler not available: {e}")

        # Default service registry if none provided
        if service_registry:
            # Use provided registry (highest priority)
            self.service_registry = service_registry
            logger.info("Using provided service registry")
        else:
            # Initialize Consul discovery if available
            self.consul_discovery = None
            consul_registry = {}
            
            if CONSUL_AVAILABLE:
                try:
                    self.consul_discovery = ConsulDiscovery()
                    if self.consul_discovery.is_consul_available():
                        consul_registry = self.consul_discovery.build_service_registry()
                        logger.info(f"Built service registry from Consul with {sum(len(svc) for svc in consul_registry.values())} services")
                    else:
                        logger.warning("Consul not available.")
                except Exception as e:
                    logger.warning(f"Error initializing Consul discovery: {e}")
            
            # Try dynamic discovery first
            try:
                from config.service_registry import get_service_registry
                dynamic_registry = get_service_registry()
                if dynamic_registry:
                    logger.info(f"Using dynamic service discovery with {sum(len(svc) for svc in dynamic_registry.values())} services")
                    self.service_registry = dynamic_registry
                else:
                    # Fall back to Consul if available
                    if consul_registry:
                        logger.info("Using Consul service registry")
                        self.service_registry = consul_registry
                    else:
                        # Use fallback registry
                        logger.warning("Using fallback service registry")
                        self.service_registry = self._get_fallback_registry()
            except Exception as e:
                logger.warning(f"Error with dynamic service discovery: {e}")
                # Fall back to Consul or fallback registry
                if consul_registry:
                    logger.info("Using Consul service registry as fallback")
                    self.service_registry = consul_registry
                else:
                    logger.warning("Using fallback service registry")
                    self.service_registry = self._get_fallback_registry()
        
        # Set debug mode
        self.debug = debug
        
        # Initialize caches with TTL
        self._process_xml_cache = TimeExpiringCache(default_ttl=xml_cache_ttl)
        self._service_properties_cache = TimeExpiringCache(default_ttl=props_cache_ttl)
        self._task_documentation_cache = TimeExpiringCache(default_ttl=docs_cache_ttl)
        
        # Cache for parsed XML documents to avoid repeated parsing
        self._parsed_xml_cache = TimeExpiringCache(default_ttl=xml_cache_ttl)
        
        # Task type prediction for prefetching
        self._task_sequence_history = deque(maxlen=20)
        self._task_transition_counter = defaultdict(lambda: defaultdict(int))
          # Initialize HTTP session for connection pooling with robust configuration
        self._session = requests.Session()
        
        # Configure session with retry strategy and connection pooling
        from requests.adapters import HTTPAdapter
        from urllib3.util.retry import Retry
        
        # Define retry strategy for connection issues
        retry_strategy = Retry(
            total=3,  # Total number of retries
            backoff_factor=1,  # Wait 1, 2, 4 seconds between retries
            status_forcelist=[429, 500, 502, 503, 504],  # HTTP status codes to retry
            allowed_methods=["HEAD", "GET", "POST"],  # Methods to retry
            raise_on_status=False,  # Don't raise exception on retry-able status codes
        )
        
        # Create HTTP adapter with retry strategy
        adapter = HTTPAdapter(
            max_retries=retry_strategy,
            pool_connections=10,  # Number of connection pools
            pool_maxsize=20,      # Max connections per pool
            pool_block=False      # Don't block when pool is full
        )
          # Mount adapter for http and https
        self._session.mount("http://", adapter)
        self._session.mount("https://", adapter)
        
        # Set session-level headers (timeout will be set per request)
        self._session.headers.update({
            'Connection': 'keep-alive',
            'User-Agent': 'DADM-ServiceOrchestrator/1.0'
        })
          # Performance metrics
        self.enable_metrics = enable_metrics
        self._metrics = OrchestratorMetrics() if enable_metrics else None
          # Initialize analysis service integration
        self.analysis_service = None
        if ANALYSIS_SERVICE_AVAILABLE:
            try:
                self.analysis_service = get_analysis_service(
                    enable_vector_store=True,
                    enable_graph_db=True,
                    auto_process=True
                )
                logger.info("Analysis service integration initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize analysis service: {e}")
        else:
            logger.warning("Analysis service integration not available")
        
        # Initialize MCP service handler
        self.mcp_handler = None
        try:
            from src.mcp_service_handler import MCPServiceHandler
            self.mcp_handler = MCPServiceHandler()
            logger.info("MCP service handler initialized")
        except ImportError as e:
            logger.warning(f"MCP service handler not available: {e}")
        except Exception as e:
            logger.warning(f"Failed to initialize MCP service handler: {e}")
        
        logger.info(f"Initialized ServiceOrchestrator with registry: {self.service_registry}")

    def _get_fallback_registry(self):
        """Get the fallback service registry when other methods fail"""
        return {
            "assistant": {
                "dadm-openai-assistant": {
                    "endpoint": os.environ.get("OPENAI_SERVICE_URL", "http://localhost:5000"),
                    "description": "OpenAI Assistant for processing decision tasks"
                }
            },
            "test": {
                "dadm-echo-service": {
                    "endpoint": "http://localhost:5100",
                    "description": "Echo test service for demonstration"
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
        start_time = time.time()
        
        # Get activity ID from task
        activity_id = task.get_activity_id()
        if not activity_id:
            logger.warning("Task has no activity ID, using default service properties")
            return self._get_default_properties()

        # Check cache first
        cached_props = self._service_properties_cache.get(activity_id)
        if cached_props:
            if self.enable_metrics:
                self._metrics.record_cache_hit("service_properties")
            if self.debug:
                logger.debug(f"Using cached service properties for activity ID: {activity_id}")
            
            if self.enable_metrics:
                self._metrics.record_operation_time(
                    "extract_service_properties", time.time() - start_time
                )
            return cached_props

        if self.enable_metrics:
            self._metrics.record_cache_miss("service_properties")
        
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
        
        # Extract properties using ElementTree instead of regex
        try:
            # Get parsed XML from cache or parse it
            root = self._get_parsed_xml(xml_data)
            
            # Find the service task by ID
            # Use XPath-like expression with ElementTree find
            service_task = None
            for elem in root.iter():
                if elem.tag.endswith('}serviceTask') and elem.get('id') == activity_id:
                    service_task = elem
                    break
            
            if service_task is not None:
                # Find extension elements
                extension_elements = None
                for child in service_task:
                    if child.tag.endswith('}extensionElements'):
                        extension_elements = child
                        break
                
                if extension_elements is not None:
                    # Find properties
                    props = {}
                    for child in extension_elements.iter():
                        if child.tag.endswith('}property'):
                            name = child.get('name')
                            value = child.get('value')
                            if name and value:
                                props[name] = value
                    
                    if props:
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
                        self._service_properties_cache.set(activity_id, result)
                        
                        if self.enable_metrics:
                            self._metrics.record_operation_time(
                                "extract_service_properties", time.time() - start_time
                            )
                        
                        return result
        except Exception as e:
            logger.error(f"Error parsing XML with ElementTree: {str(e)}")
            logger.info("Falling back to regex parsing")
            
            # Fallback to regex parsing
            try:
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
                        self._service_properties_cache.set(activity_id, result)
                        
                        if self.enable_metrics:
                            self._metrics.record_operation_time(
                                "extract_service_properties", time.time() - start_time
                            )
                        
                        return result
            except Exception as e:
                logger.error(f"Error with regex fallback: {str(e)}")
        
        logger.warning(f"No service properties found for activity ID: {activity_id}")
        default_props = self._get_default_properties()
        # Cache the default properties for this activity ID
        self._service_properties_cache.set(activity_id, default_props)
        
        if self.enable_metrics:
            self._metrics.record_operation_time(
                "extract_service_properties", time.time() - start_time
            )
        
        return default_props
    
    def _get_parsed_xml(self, xml_data):
        """
        Get parsed XML from cache or parse the XML data
        
        Args:
            xml_data: XML string data
            
        Returns:
            ElementTree root element
        """
        # Generate cache key based on XML content
        cache_key = f"xml_{hash(xml_data)}"
        
        # Check cache first
        cached_root = self._parsed_xml_cache.get(cache_key)
        if cached_root:
            if self.enable_metrics:
                self._metrics.record_cache_hit("parsed_xml")
            return cached_root
        
        if self.enable_metrics:
            self._metrics.record_cache_miss("parsed_xml")
        
        # Parse XML
        root = ET.fromstring(xml_data.encode('utf-8'))
        
        # Cache parsed XML
        self._parsed_xml_cache.set(cache_key, root)
        
        return root
    
    def _get_default_service_name(self):
        """Get the default service name from discovered services"""
        try:
            # Try to get the first assistant service from dynamic discovery
            from config.service_registry import find_service_by_type
            assistant_service = find_service_by_type('assistant')
            if assistant_service:
                # Extract service name from config
                service_config = assistant_service.get('config', {})
                return service_config.get('name', 'dadm-openai-assistant')
        except Exception:
            pass
        
        # Fallback to checking the current registry
        if 'assistant' in self.service_registry:
            assistant_services = self.service_registry['assistant']
            if assistant_services:
                return list(assistant_services.keys())[0]
        
        return "dadm-openai-assistant"  # Final fallback
    
    def _get_default_properties(self):
        """Return default service properties"""
        return {
            "service.type": "assistant",
            "service.name": self._get_default_service_name(),
            "service.version": "1.0"
        }
    
    def _get_process_xml_for_task(self, task):
        """Get the process XML for a task"""
        start_time = time.time()
        
        try:
            # Get process instance ID
            process_instance_id = task.get_process_instance_id()
            
            # Get process definition ID
            process_definition_id = self._get_process_definition_id(process_instance_id)
            if not process_definition_id:
                return None
            
            # Check if XML is already in cache
            cached_xml = self._process_xml_cache.get(process_definition_id)
            if cached_xml:
                if self.enable_metrics:
                    self._metrics.record_cache_hit("process_xml")
                if self.debug:
                    logger.debug(f"Using cached process XML for definition ID: {process_definition_id}")
                
                if self.enable_metrics:
                    self._metrics.record_operation_time(
                        "get_process_xml", time.time() - start_time
                    )
                
                return cached_xml
            
            if self.enable_metrics:
                self._metrics.record_cache_miss("process_xml")
            
            # Get process XML
            xml_data = self._get_process_xml(process_definition_id)
            
            # Cache the XML data
            if xml_data:
                self._process_xml_cache.set(process_definition_id, xml_data)
            
            if self.enable_metrics:
                self._metrics.record_operation_time(
                    "get_process_xml", time.time() - start_time
                )
            
            return xml_data
            
        except Exception as e:
            logger.error(f"Error getting process XML: {str(e)}")
            
            if self.enable_metrics:
                self._metrics.record_operation_time(
                    "get_process_xml", time.time() - start_time
                )
            
            return None
    
    def _get_process_definition_id(self, process_instance_id):
        """Get process definition ID from process instance ID"""
        from config import camunda_config
        
        base_url = camunda_config.CAMUNDA_ENGINE_URL
        if not base_url.endswith('/'):
            base_url += '/'
        
        url = f"{base_url}process-instance/{process_instance_id}"
        
        try:
            if self.enable_metrics:
                self._metrics.record_api_call("get_process_definition_id")
            
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
            if self.enable_metrics:
                self._metrics.record_api_call("get_process_xml")
            
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
        start_time = time.time()
        
        try:
            # Get activity ID from task
            activity_id = task.get_activity_id()
            if not activity_id:
                return None
            
            # Check cache first
            cached_docs = self._task_documentation_cache.get(activity_id)
            if cached_docs is not None:  # Could be None for no docs
                if self.enable_metrics:
                    self._metrics.record_cache_hit("task_documentation")
                if self.debug:
                    logger.debug(f"Using cached documentation for activity ID: {activity_id}")
                
                if self.enable_metrics:
                    self._metrics.record_operation_time(
                        "get_task_documentation", time.time() - start_time
                    )
                
                return cached_docs
            
            if self.enable_metrics:
                self._metrics.record_cache_miss("task_documentation")
            
            # Get process XML
            xml_data = self._get_process_xml_for_task(task)
            if not xml_data:
                if self.enable_metrics:
                    self._metrics.record_operation_time(
                        "get_task_documentation", time.time() - start_time
                    )
                return None
            
            # Use ElementTree for more efficient parsing
            try:
                # Get parsed XML from cache or parse it
                root = self._get_parsed_xml(xml_data)
                
                # Find the service task by ID
                service_task = None
                for elem in root.iter():
                    if elem.get('id') == activity_id:
                        service_task = elem
                        break
                
                if service_task is not None:
                    # Find documentation element
                    documentation = None
                    for child in service_task:
                        if child.tag.endswith('}documentation'):
                            documentation = child.text.strip() if child.text else None
                            break
                    
                    # Cache the documentation (even if None)
                    self._task_documentation_cache.set(activity_id, documentation)
                    
                    if documentation:
                        logger.info(f"Found documentation for activity ID {activity_id}")
                    else:
                        logger.info(f"No documentation found for activity ID {activity_id}")
                    
                    if self.enable_metrics:
                        self._metrics.record_operation_time(
                            "get_task_documentation", time.time() - start_time
                        )
                    
                    return documentation
            except Exception as e:
                logger.error(f"Error parsing XML with ElementTree: {str(e)}")
                logger.info("Falling back to regex parsing")
            
            # Fallback to regex parsing
            pattern = f'id="{re.escape(activity_id)}"[^>]*>\\s*<bpmn:documentation>(.*?)</bpmn:documentation>'
            matches = re.search(pattern, xml_data, re.DOTALL)
            
            if matches:
                documentation = matches.group(1).strip()
                logger.info(f"Found documentation for activity ID {activity_id}")
                
                # Cache the documentation
                self._task_documentation_cache.set(activity_id, documentation)
                
                if self.enable_metrics:
                    self._metrics.record_operation_time(
                        "get_task_documentation", time.time() - start_time
                    )
                
                return documentation
            
            logger.info(f"No documentation found for activity ID {activity_id}")
            
            # Cache the negative result as None
            self._task_documentation_cache.set(activity_id, None)
            
            if self.enable_metrics:
                self._metrics.record_operation_time(
                    "get_task_documentation", time.time() - start_time
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Error retrieving task documentation: {str(e)}")
            
            if self.enable_metrics:
                self._metrics.record_operation_time(
                    "get_task_documentation", time.time() - start_time
                )
            
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
        # Start performance timer
        start_time = time.time()
        
        if self.enable_metrics:
            self._metrics.total_tasks_processed += 1
            process_id = task.get_process_instance_id()
            if process_id:
                self._metrics.workflows_processed.add(process_id)
        
        # Record task in sequence history for prediction
        activity_id = task.get_activity_id()
        if activity_id and self._task_sequence_history:
            # Record transition from previous task to this task
            prev_task = self._task_sequence_history[-1]
            self._task_transition_counter[prev_task][activity_id] += 1
        
        if activity_id:
            self._task_sequence_history.append(activity_id)
            
            # Predict and prefetch next likely tasks
            self._prefetch_likely_next_tasks(activity_id)
        
        # Extract service properties from task (uses cache if available)
        properties = self.extract_service_properties(task)
          # Get service endpoint from registry
        service_type = properties.get("service.type")
        service_name = properties.get("service.name")
        
        if not service_type or not service_name:
            service_type = "assistant"
            service_name = self._get_default_service_name()
        
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
            
            # Handle MCP services specially
            if service_type == "mcp":
                logger.info(f"Handling MCP service: {service_name}")
                return self._route_mcp_task(task, variables, service_config, properties)
            
            # Get task documentation (uses cache if available)
            task_documentation = self.get_task_documentation(task)
            
            # Prepare request
            url = urljoin(endpoint, '/process_task')
            
            # Combine task name and documentation into task_description for OpenAI service
            task_description = f"Task: {task.get_activity_id()}"
            if task_documentation:
                task_description += f"\n\nInstructions: {task_documentation}"
            if variables:
                task_description += f"\n\nContext Variables: {variables}"
            
            payload = {
                "task_description": task_description,
                "task_id": task.get_task_id(),
                "task_name": task.get_activity_id(),
                "task_documentation": task_documentation,
                "variables": variables or {},
                "service_properties": properties,
                "process_instance_id": task.get_process_instance_id()  # Add process instance ID for thread persistence
            }
            
            logger.info(f"Sending request to {url}")
            if self.debug:
                logger.debug(f"Request payload: {payload}")
            
            if self.enable_metrics:
                self._metrics.record_api_call("service_request")
            
            # Make the request to the service using session for connection pooling
            response = self._session.post(url, json=payload, timeout=300)  # 5-minute timeout
            
            # Log performance metrics
            operation_time = time.time() - start_time
            if self.enable_metrics:
                self._metrics.record_operation_time("route_task", operation_time)
            
            if self.debug:
                logger.debug(f"Service call took {operation_time:.2f} seconds")

            if response.status_code == 200:
                result = response.json().get("result", {})
                logger.info(f"Service request succeeded, received result with {len(result)} keys")
                
                # Store analysis data after successful task routing
                if self.analysis_service and result and not result.get("error"):
                    try:
                        # Extract task information
                        task_id = task.get_activity_id()
                        process_instance_id = task.get_process_instance_id()
                        
                        # Store the analysis
                        analysis_id = self.analysis_service.store_task_analysis(
                            task_description=task_description,
                            task_id=task_id,
                            task_name=task_id,
                            variables=variables or {},
                            response_data=result,
                            thread_id=f"process_{process_instance_id}" if process_instance_id else f"task_{task_id}",
                            process_instance_id=process_instance_id,
                            service_name=f"{service_type}/{service_name}",
                            tags=["task_routing", "orchestration", service_type]
                        )
                        
                        # Add analysis ID to result for tracking
                        result["analysis_id"] = analysis_id
                        logger.info(f"Stored task analysis: {analysis_id}")
                        
                    except Exception as e:
                        logger.warning(f"Failed to store task analysis: {e}")
                        # Don't fail the task routing if analysis storage fails
                
                return result
            else:
                error_msg = response.json().get("message", f"Unknown error, status code: {response.status_code}")
                logger.error(f"Service request failed: {error_msg}")
                raise Exception(f"Service request failed: {error_msg}")
                
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error routing task to service: {error_msg}")
            
            if self.enable_metrics:
                self._metrics.record_operation_time("route_task", time.time() - start_time)
            
            return {
                "error": error_msg,
                "service": f"{service_type}/{service_name}",
                "task": task.get_activity_id()
            }
    
    def _route_mcp_task(self, task, variables, service_config, properties):
        """
        Route a task to an MCP service with enhanced handling.
        
        Args:
            task: Camunda external task object
            variables: Task variables dict
            service_config: Service configuration from registry
            properties: Service properties from BPMN
            
        Returns:
            dict: Result from the MCP service
        """
        if not self.mcp_handler:
            logger.error("MCP service handler not available")
            return {
                "error": "MCP service handler not available",
                "service": properties.get("service.name", "unknown"),
                "task": task.get_activity_id() if hasattr(task, 'get_activity_id') else "unknown"
            }
        
        try:
            # Use the MCP handler to route the task
            return self.mcp_handler.route_mcp_task(task, variables, service_config, properties)
        except Exception as e:
            error_msg = f"MCP routing error: {str(e)}"
            logger.error(error_msg)
            return {
                "error": error_msg,
                "service": properties.get("service.name", "unknown"),
                "task": task.get_activity_id() if hasattr(task, 'get_activity_id') else "unknown"
            }
    
    def discover_mcp_tools(self, service_name=None):
        """
        Discover available tools from MCP services.
        
        Args:
            service_name: Optional specific service name to discover tools for
            
        Returns:
            dict: Dictionary of service names to their available tools
        """
        if not self.mcp_handler:
            logger.warning("MCP service handler not available")
            return {}
        
        all_tools = {}
        
        # Get MCP services from registry
        mcp_services = self.service_registry.get("mcp", {})
        
        for svc_name, svc_config in mcp_services.items():
            if service_name and svc_name != service_name:
                continue
                
            try:
                service_info = self.mcp_handler.discover_tools(svc_config)
                all_tools[svc_name] = list(service_info.tools.keys())
                logger.info(f"Discovered {len(service_info.tools)} tools for MCP service: {svc_name}")
            except Exception as e:
                logger.warning(f"Failed to discover tools for MCP service {svc_name}: {e}")
                all_tools[svc_name] = []
        
        return all_tools
    
    def get_mcp_tool_info(self, service_name, tool_name):
        """
        Get detailed information about a specific MCP tool.
        
        Args:
            service_name: Name of the MCP service
            tool_name: Name of the tool
            
        Returns:
            dict: Tool information or None if not found
        """
        if not self.mcp_handler:
            return None
        
        tool_info = self.mcp_handler.get_tool_info(service_name, tool_name)
        if tool_info:
            return {
                "name": tool_info.name,
                "description": tool_info.description,
                "parameters": tool_info.parameters,
                "server": tool_info.server,
                "service_endpoint": tool_info.service_endpoint
            }
        return None

    def close(self):
        """Close HTTP session and clean up resources"""
        if self._session:
            self._session.close()
            logger.info("Service orchestrator HTTP session closed")
    
    def get_metrics(self):
        """
        Get performance metrics
        
        Returns:
            dict: Performance metrics
        """
        if not self.enable_metrics:
            return {"metrics_disabled": True}
        
        # Get cache metrics
        cache_metrics = {
            'process_xml': self._process_xml_cache.get_metrics(),
            'service_properties': self._service_properties_cache.get_metrics(),
            'task_documentation': self._task_documentation_cache.get_metrics(),
            'parsed_xml': self._parsed_xml_cache.get_metrics()
        }
        
        # Get orchestrator metrics
        orchestrator_metrics = self._metrics.get_summary() if self._metrics else {}
        
        return {
            'cache_metrics': cache_metrics,
            'orchestrator_metrics': orchestrator_metrics,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        }

# Backwards compatibility
EnhancedServiceOrchestrator = ServiceOrchestrator

@dataclass
class MCPToolInfo:
    """Information about an available MCP tool."""
    name: str
    description: str
    parameters: Dict[str, any] = field(default_factory=dict)
    server: str = ""
    service_endpoint: str = ""


@dataclass
class MCPServiceInfo:
    """Information about an MCP service and its available tools."""
    name: str
    endpoint: str
    description: str = ""
    tools: Dict[str, MCPToolInfo] = field(default_factory=dict)
    server_type: str = ""
    last_discovery: float = 0

