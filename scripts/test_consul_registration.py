#!/usr/bin/env python
"""
Consul Registration Test Script

This script tests the registration of a service with Consul using the 
ConsulServiceRegistry class from consul_registry.py.
"""
import os
import sys
import time
import logging
import argparse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add the project root to the Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

def main():
    parser = argparse.ArgumentParser(description="Test Consul service registration")
    parser.add_argument("--name", default="test-service", help="Service name to register")
    parser.add_argument("--port", type=int, default=9999, help="Port to use for the test service")
    parser.add_argument("--type", default="test", help="Service type")
    parser.add_argument("--wait", type=int, default=10, help="Seconds to wait before deregistering")
    args = parser.parse_args()
    
    # Import the ConsulServiceRegistry
    try:
        from services.openai_service.consul_registry import ConsulServiceRegistry
        logger.info("Successfully imported ConsulServiceRegistry")
    except ImportError as e:
        logger.error(f"Failed to import ConsulServiceRegistry: {e}")
        logger.error("Make sure the services directory is in the Python path")
        sys.exit(1)
    
    # Create a registry client
    consul_registry = ConsulServiceRegistry()
    
    # Test registration 
    logger.info(f"Registering test service '{args.name}' on port {args.port}")
    
    metadata = {
        "test_id": "123",
        "version": "1.0-test",
        "description": "Test service for Consul registration"
    }
    
    success = consul_registry.register_service(
        name=args.name,
        service_type=args.type,
        port=args.port,
        meta=metadata
    )
    
    if success:
        logger.info(f"✅ Successfully registered service '{args.name}'")
        
        # Wait for a while to see if health checks pass
        logger.info(f"Waiting {args.wait} seconds (press Ctrl+C to exit earlier)")
        try:
            for i in range(args.wait):
                time.sleep(1)
                sys.stdout.write(".")
                sys.stdout.flush()
            print()
        except KeyboardInterrupt:
            print("\nInterrupted by user")
            
        # Check service status
        service_info = consul_registry.get_service(args.name)
        if service_info:
            logger.info(f"Service status: {service_info.get('Status', 'unknown')}")
        
        # Deregister the service
        if consul_registry.deregister_service(args.name):
            logger.info(f"✅ Successfully deregistered service '{args.name}'")
        else:
            logger.error(f"❌ Failed to deregister service '{args.name}'")
    else:
        logger.error(f"❌ Failed to register service '{args.name}'")
        sys.exit(1)
    
    logger.info("Test completed!")

if __name__ == "__main__":
    main()
