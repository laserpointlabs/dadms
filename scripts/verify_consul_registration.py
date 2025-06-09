"""
Quick Consul Service Registry Verifier

Run this script to verify that the OpenAI service can properly 
register itself with Consul.
"""
import os
import sys
import json
import logging
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

def main():
    """Verify OpenAI service registration with Consul"""
    print("\nConsul Service Registration Verification")
    print("=======================================\n")
    
    # Import ConsulServiceRegistry
    try:
        from services.openai_service.consul_registry import ConsulServiceRegistry
        print("✅ Successfully imported ConsulServiceRegistry")
    except ImportError as e:
        print(f"❌ Failed to import ConsulServiceRegistry: {e}")
        print("Make sure you're running this script from the project root")
        return False
        
    # Create registry client
    try:
        consul_registry = ConsulServiceRegistry()
        print("✅ Successfully created ConsulServiceRegistry client")
    except Exception as e:
        print(f"❌ Failed to create ConsulServiceRegistry client: {e}")
        print("Make sure Consul is running (http://localhost:8500)")
        return False
        
    # Check if Consul is available
    if not consul_registry._verify_connection():
        print("❌ Cannot connect to Consul server")
        print("Make sure Consul is running at http://localhost:8500")
        return False
    else:
        print("✅ Successfully connected to Consul server")
        
    # Try to register a test service
    test_service_name = "test-openai-assistant"
    test_port = 5000
    
    print(f"\nAttempting to register test service '{test_service_name}'...")
    
    metadata = {
        "test_id": "verification-test",
        "version": "1.0-test",
        "description": "Test OpenAI Assistant Service"
    }
    
    success = consul_registry.register_service(
        name=test_service_name,
        service_type="assistant",
        port=test_port,
        meta=metadata
    )
    
    if success:
        print(f"✅ Successfully registered test service '{test_service_name}'")
        
        # Wait briefly
        print("Waiting 3 seconds to check service status...")
        time.sleep(3)
        
        # Verify the service was registered
        service_info = consul_registry.get_service(test_service_name)
        if service_info:
            print(f"✅ Service is registered and accessible")
        else:
            print(f"❓ Service was registered but not found in query")
            
        # Clean up - deregister the service
        if consul_registry.deregister_service(test_service_name):
            print(f"✅ Successfully deregistered test service")
        else:
            print(f"❌ Failed to deregister test service")
            
        return True
    else:
        print(f"❌ Failed to register test service")
        print("Check logs for more details")
        return False

if __name__ == "__main__":
    if main():
        print("\n✅ Verification completed successfully!")
        print("Your system can register services with Consul.")
        print("If you're not seeing services in the Consul UI, check that:")
        print("1. Your OpenAI service is running")
        print("2. The USE_CONSUL environment variable is set to 'true'")
        print("3. The service has the correct permissions to connect to Consul")
        sys.exit(0)
    else:
        print("\n❌ Verification failed!")
        print("Check the above errors and fix the issues.")
        sys.exit(1)
