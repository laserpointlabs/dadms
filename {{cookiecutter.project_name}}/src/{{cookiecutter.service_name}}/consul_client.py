"""
Consul service discovery client for {{cookiecutter.service_name}}
"""

import consul
from .config import settings
import structlog

logger = structlog.get_logger(__name__)

def register_service():
    """Register this service with Consul"""
    try:
        # Create Consul client
        c = consul.Consul(
            host=settings.consul_host,
            port=settings.consul_port,
            timeout=settings.consul_timeout
        )
        
        # Register service
        c.agent.service.register(
            name=settings.service_name,
            service_id=f"{settings.service_name}-{settings.service_port}",
            address="localhost",  # Should be actual service address in production
            port=settings.service_port,
            tags=["dadm", "microservice", "{{cookiecutter.service_name}}"],
            meta={
                "version": "{{cookiecutter.version}}",
                "description": "{{cookiecutter.description}}",
                "author": "{{cookiecutter.author_name}}"
            },
            check=consul.Check.http(
                url=f"http://localhost:{settings.service_port}/health",
                interval="30s",
                timeout="10s"
            )
        )
        
        logger.info("Service registered with Consul", 
                   service_name=settings.service_name,
                   service_port=settings.service_port)
        
    except Exception as e:
        logger.error("Failed to register with Consul", error=str(e))
        raise

def deregister_service():
    """Deregister this service from Consul"""
    try:
        c = consul.Consul(
            host=settings.consul_host,
            port=settings.consul_port,
            timeout=settings.consul_timeout
        )
        
        service_id = f"{settings.service_name}-{settings.service_port}"
        c.agent.service.deregister(service_id)
        
        logger.info("Service deregistered from Consul", service_id=service_id)
        
    except Exception as e:
        logger.error("Failed to deregister from Consul", error=str(e))
