"""
Consul Service Registry Client for OpenAI Service

This module provides a simple client to register the OpenAI service with Consul.
"""
import os
import json
import socket
import atexit
import logging
import requests
from typing import Dict, Any, Optional

# Configure logging
logger = logging.getLogger(__name__)

def register_openai_service(port: int) -> bool:
    """
    Register the OpenAI service with Consul
    
    Args:
        port: The port the service is running on
        
    Returns:
        bool: True if registration was successful, False otherwise
    """
    try:
        # Get Consul URL from environment or use default
        consul_url = os.environ.get("CONSUL_HTTP_ADDR", "http://localhost:8500")
        if consul_url and not consul_url.startswith("http"):
            if ":" in consul_url:
                consul_url = f"http://{consul_url}"
            else:
                consul_url = f"http://{consul_url}:8500"
        
        # Get service information from environment variables
        service_name = "openai-assistant"
        service_type = os.environ.get("SERVICE_TYPE", "assistant")
        
        # Determine host (container name in Docker, hostname otherwise)
        host = os.environ.get("SERVICE_HOST")
        if not host:
            try:
                host = socket.gethostname()
            except:
                host = "localhost"
        
        # Prepare service registration data            # Get assistant_id from environment or file
            assistant_id = os.environ.get("OPENAI_ASSISTANT_ID", None)
            if not assistant_id:
                # Try to load from file
                try:
                    logs_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "logs")
                    assistant_id_file = os.path.join(logs_dir, "assistant_id.json")
                    if os.path.exists(assistant_id_file):
                        with open(assistant_id_file, 'r') as f:
                            data = json.load(f)
                            assistant_id = data.get("assistant_id")
                except Exception as e:
                    logger.warning(f"Could not load assistant_id from file: {e}")
            
            # Prepare metadata
            metadata = {
                "type": service_type,
                "version": "1.0",
                "description": "OpenAI Assistant Service",
                "api": "REST"
            }
            
            # Add assistant_id if available
            if assistant_id:
                metadata["assistant_id"] = assistant_id
            
            service_data = {
                "Name": service_name,
                "ID": service_name,
                "Address": host,
                "Port": port,
                "Tags": [f"type-{service_type}"],
                "Meta": metadata,
            "Check": {
                "HTTP": f"http://{host}:{port}/health",
                "Interval": "30s",
                "Timeout": "5s"
            }
        }
        
        # Try to verify Consul connection
        logger.info(f"Verifying connection to Consul at {consul_url}")
        try:
            response = requests.get(f"{consul_url}/v1/status/leader", timeout=2)
            if response.status_code != 200:
                logger.warning(f"⚠️ Consul not available (status {response.status_code})")
                return False
        except Exception as e:
            logger.warning(f"⚠️ Consul not available: {e}")
            return False
        
        # Register the service
        logger.info(f"Registering service with Consul: {service_name}")
        response = requests.put(
            f"{consul_url}/v1/agent/service/register",
            json=service_data,
            timeout=5
        )
        
        if response.status_code == 200:
            logger.info(f"✅ Successfully registered service: {service_name}")
            
            # Register deregistration function for clean shutdown
            def deregister_service():
                try:
                    logger.info(f"Deregistering service: {service_name}")
                    requests.put(
                        f"{consul_url}/v1/agent/service/deregister/{service_name}",
                        timeout=5
                    )
                    logger.info(f"✅ Service deregistered: {service_name}")
                except Exception as e:
                    logger.warning(f"⚠️ Failed to deregister service: {e}")
            
            # Register the deregister function to run on exit
            atexit.register(deregister_service)
            
            return True
        else:
            logger.warning(f"⚠️ Failed to register service: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        logger.warning(f"⚠️ Error registering service with Consul: {e}")
        return False
