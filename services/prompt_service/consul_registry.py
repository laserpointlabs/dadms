"""
Consul Service Registry Client for Prompt Service

This module provides functionality to register the Prompt service with Consul.
"""
import os
import json
import logging
import requests
import socket
from typing import Optional, Dict, Any, List

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ConsulServiceRegistry:
    """Service registry client using Consul"""
    
    def __init__(self, consul_url: Optional[str] = None):
        """
        Initialize the ConsulServiceRegistry
        
        Args:
            consul_url: URL to the Consul API (default: uses CONSUL_HTTP_ADDR env var or localhost:8500)
        """
        # Get Consul URL from environment or use default
        if not consul_url:
            consul_url = os.environ.get("CONSUL_HTTP_ADDR", "http://localhost:8500")
            # If no http prefix, add it
            if consul_url and not consul_url.startswith("http"):
                consul_url = f"http://{consul_url}"
        
        self.consul_url = consul_url.rstrip('/')
        self.api_url = f"{self.consul_url}/v1"
        logger.info(f"Initializing Consul service registry with URL: {self.consul_url}")
    
    def _verify_connection(self) -> bool:
        """Verify connection to Consul"""
        try:
            response = requests.get(f"{self.api_url}/status/leader", timeout=2)
            if response.status_code == 200:
                logger.info("✅ Connected to Consul service registry")
                return True
            else:
                logger.warning(f"❌ Failed to connect to Consul: {response.status_code}")
                return False
        except Exception as e:
            logger.warning(f"❌ Failed to connect to Consul: {e}")
            return False
    
    def register_service(self, 
                        name: str, 
                        service_type: Optional[str] = None,
                        host: Optional[str] = None, 
                        port: Optional[int] = None,
                        tags: Optional[List[str]] = None,
                        meta: Optional[Dict[str, str]] = None,
                        health_check_path: str = "/health",
                        health_check_interval: str = "30s") -> bool:
        """
        Register a service with Consul
        
        Args:
            name: Service name
            service_type: Type of service (e.g., 'prompt', 'assistant')
            host: Service host (default: auto-detected)
            port: Service port (default: from PORT env var or 5300)
            tags: List of tags for the service
            meta: Additional metadata key-value pairs
            health_check_path: Path for HTTP health check
            health_check_interval: Interval for health checks
            
        Returns:
            bool: True if registration successful
        """
        try:
            # Auto-detect host if not provided
            if not host:
                # Check if running in Docker
                in_docker = os.environ.get("DOCKER_CONTAINER", "false").lower() == "true"
                
                # Get host from environment
                host = os.environ.get("SERVICE_HOST")
                
                if not host:
                    # Try to get the container hostname
                    try:
                        host = socket.gethostname()
                    except:
                        host = "localhost"
                        
                # For local development but accessed from Consul in Docker, 
                # use special Docker host address
                if not in_docker and host == "localhost":
                    logger.info("Running locally with Docker Consul - using host.docker.internal")
                    host = "host.docker.internal"
            
            # Get port from environment if not provided
            if not port:
                port_str = os.environ.get("PORT", "5300")
                try:
                    port = int(port_str)
                except ValueError:
                    port = 5300
            
            # Prepare service registration data
            service_data = {
                "Name": name,
                "Address": host,
                "Port": port,
                "Tags": tags or [],
                "Meta": meta or {}
            }
            
            # Add service type to tags and meta
            if service_type:
                if "Tags" not in service_data or service_data["Tags"] is None:
                    service_data["Tags"] = []
                service_data["Tags"].append(f"type-{service_type}")
                if "Meta" not in service_data or service_data["Meta"] is None:
                    service_data["Meta"] = {}
                service_data["Meta"]["type"] = service_type
            
            # Add default HTTP health check
            # Determine if we're running in Docker
            in_docker = os.environ.get("DOCKER_CONTAINER", "false").lower() == "true"
            
            # If we're running locally but Consul is in Docker, it needs host.docker.internal
            # to access services on the host machine
            health_check_host = host
            if not in_docker and "localhost" in host:
                health_check_host = "host.docker.internal"
                logger.info(f"Using host.docker.internal for health checks (Docker compatibility)")
            
            check = {
                "HTTP": f"http://{health_check_host}:{port}{health_check_path}",
                "Interval": health_check_interval,
                "Timeout": "5s"
            }
            service_data["Check"] = check
            
            # Skip registration if Consul is not available
            if not self._verify_connection():
                logger.warning("⚠️ Skipping service registration - Consul not available")
                return False
            
            # Register the service
            response = requests.put(
                f"{self.api_url}/agent/service/register",
                json=service_data,
                timeout=5
            )
            
            if response.status_code == 200:
                logger.info(f"✅ Registered service: {name} ({host}:{port})")
                return True
            else:
                logger.error(f"❌ Failed to register service: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error registering service {name}: {e}")
            return False
    
    def deregister_service(self, service_id: str) -> bool:
        """Deregister a service from Consul"""
        try:
            response = requests.put(
                f"{self.api_url}/agent/service/deregister/{service_id}",
                timeout=5
            )
            
            if response.status_code == 200:
                logger.info(f"✅ Deregistered service: {service_id}")
                return True
            else:
                logger.error(f"❌ Failed to deregister service: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error deregistering service {service_id}: {e}")
            return False
