"""
App module for service discovery with Consul

This module should be imported by app.py to add service discovery functionality.
"""
import os
import logging

# Configure logging
logger = logging.getLogger(__name__)

def get_openai_service_url():
    """
    Get the OpenAI service URL using Consul discovery if available
    
    Returns:
        str: URL of the OpenAI service
    """
    # Default URL from environment or hardcoded fallback
    default_url = os.environ.get("OPENAI_SERVICE_URL", "http://localhost:5000")
    
    try:
        # Try to import ConsulDiscovery
        from src.consul_discovery import ConsulDiscovery
        
        # Initialize Consul discovery client
        consul_discovery = ConsulDiscovery()
        
        # Check if Consul is available
        if not consul_discovery.is_consul_available():
            logger.warning("Consul not available. Using default OpenAI service URL.")
            return default_url
        
        # Try to get service by name first
        service_url = consul_discovery.get_service_url("openai-assistant", default_url)
        if service_url != default_url:
            logger.info(f"Found OpenAI service at: {service_url}")
            return service_url
            
        # If not found by name, try by type
        service_url = consul_discovery.get_service_url_by_type("assistant", default_url)
        if service_url != default_url:
            logger.info(f"Found OpenAI service by type at: {service_url}")
            return service_url
            
        logger.warning("OpenAI service not found in Consul. Using default URL.")
        return default_url
    except ImportError:
        logger.warning("ConsulDiscovery not available. Using default OpenAI service URL.")
        return default_url
    except Exception as e:
        logger.error(f"Error finding OpenAI service: {e}")
        return default_url
