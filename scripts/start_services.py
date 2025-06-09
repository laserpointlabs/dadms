"""
Service Starter

This script helps start and verify the DADM services.
It attempts to start services that are not running and checks their status.
"""
import os
import sys
import subprocess
import time
import argparse
import logging
from pathlib import Path
from datetime import datetime

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Set up log directory
logs_dir = os.path.join(project_root, "logs", "services")
Path(logs_dir).mkdir(parents=True, exist_ok=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(logs_dir, "service_starter.log")),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("service_starter")

def start_service(service_type, service_name):
    """Start a specific service based on type and name"""
    logger.info(f"Starting {service_type}/{service_name} service...")
    
    if service_type == "assistant" and service_name == "openai":
        # OpenAI service needs to be in its own directory
        service_dir = os.path.join(project_root, "services", "openai_service")
        if not os.path.exists(service_dir):
            logger.warning(f"Service directory not found: {service_dir}")
            return False
            
        try:            # Check if we have a Docker Compose file for this service
            docker_compose_file = os.path.join(project_root, "docker", "docker-compose.yml")
            if os.path.exists(docker_compose_file):
                # Start via Docker Compose
                logger.info("Starting via Docker Compose...")                
                subprocess.run(
                    ["docker-compose", "-f", "docker/docker-compose.yml", "up", "-d", "openai-service"],
                    cwd=project_root,
                    check=True
                )
            else:
                # Start directly
                logger.info("Starting directly...")
                subprocess.Popen(
                    ["python", "service.py"],
                    cwd=service_dir,
                    env={**os.environ, "PORT": "5000"}
                )
                # Give it a moment to start
                time.sleep(2)
                
            logger.info("Service start command sent")
            return True
            
        except Exception as e:
            logger.error(f"Error starting service: {e}")
            return False
            
    elif service_type == "test" and service_name == "echo":
        try:            # Check if we have a Docker Compose file for this service
            docker_compose_file = os.path.join(project_root, "docker", "docker-compose.yml")
            if os.path.exists(docker_compose_file):
                # Start via Docker Compose
                print("  Starting via Docker Compose...")
                subprocess.run(
                    ["docker-compose", "-f", "docker/docker-compose.yml", "up", "-d", "echo-service"],
                    cwd=project_root,
                    check=True
                )
                print("  ✓ Service start command sent")
                return True
            else:
                service_dir = os.path.join(project_root, "services", "echo_service")
                if not os.path.exists(service_dir):
                    print(f"  ⚠ Service directory not found: {service_dir}")
                    return False
                    
                # Start directly
                print("  Starting directly...")
                subprocess.Popen(
                    ["python", "service.py"],
                    cwd=service_dir,
                    env={**os.environ, "PORT": "5100"}
                )
                # Give it a moment to start
                time.sleep(2)
                
                print("  ✓ Service start command sent")
                return True
                
        except Exception as e:
            print(f"  ✗ Error starting service: {e}")
            return False
    else:
        print(f"  ⚠ No start method defined for {service_type}/{service_name}")
        return False

def check_service_status(service_type, service_name, endpoint):
    """Check if a service is healthy"""
    try:
        # Import the check function from check_service_status.py
        from scripts.check_service_status import check_service_status as check_status
        status = check_status(service_type, service_name, endpoint)
        return status["status"] == "healthy"
    except Exception as e:
        print(f"  ⚠ Error checking service status: {e}")
        return False

def ensure_services_running(services_to_start=None, max_attempts=3):
    """Ensure that required services are running"""
    # Load service registry
    from config import service_registry
    
    all_services_healthy = True
    services_started = []
    
    print("Checking and starting required services...")
    
    # Process each service in the registry
    for service_type, services in service_registry.SERVICE_REGISTRY.items():
        for service_name, service_config in services.items():
            # Skip if not active
            if not service_config.get("active", False):
                print(f"  - Skipping inactive service: {service_type}/{service_name}")
                continue
                
            # Skip if not in the requested services list (if provided)
            if services_to_start and f"{service_type}/{service_name}" not in services_to_start:
                print(f"  - Skipping service not in requested list: {service_type}/{service_name}")
                continue
            
            endpoint = service_config.get("endpoint")
            if not endpoint:
                print(f"  - Skipping service with no endpoint: {service_type}/{service_name}")
                continue
            
            print(f"\nChecking {service_type}/{service_name} at {endpoint}...")
            
            # Check if it's already running
            is_healthy = check_service_status(service_type, service_name, endpoint)
            
            if is_healthy:
                print(f"  ✓ Service is already running and healthy")
                continue
                
            # Service is not healthy, try to start it
            print(f"  - Service is not healthy, attempting to start...")
            
            attempts = 0
            while attempts < max_attempts and not is_healthy:
                attempts += 1
                
                if attempts > 1:
                    print(f"  - Retry attempt {attempts}/{max_attempts}...")
                
                # Try to start the service
                start_success = start_service(service_type, service_name)
                
                if not start_success:
                    print(f"  ✗ Failed to start service")
                    all_services_healthy = False
                    break
                
                # Wait a moment then check if it's healthy
                print(f"  - Waiting for service to become healthy...")
                time.sleep(5)  # Allow service time to start
                
                is_healthy = check_service_status(service_type, service_name, endpoint)
                
                if is_healthy:
                    print(f"  ✓ Service is now running and healthy")
                    services_started.append(f"{service_type}/{service_name}")
                    break
                else:
                    print(f"  ⚠ Service started but is not healthy")
            
            if not is_healthy:
                print(f"  ✗ Failed to get service healthy after {max_attempts} attempts")
                all_services_healthy = False
    
    # Summary
    print("\n===== Service Start Summary =====")
    if services_started:
        print(f"Services started: {len(services_started)}")
        for service in services_started:
            print(f"  - {service}")
    else:
        print("No services needed to be started")
        
    if all_services_healthy:
        print("\n✓ All services are running and healthy")
    else:
        print("\n⚠ Some services could not be started or are unhealthy")
        print("  Run 'python scripts/check_service_status.py' for details")
    
    return all_services_healthy

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Start and ensure DADM services are running")
    parser.add_argument("--services", "-s", nargs="+", help="Specific services to start (format: type/name)")
    parser.add_argument("--attempts", "-a", type=int, default=3, help="Maximum start attempts per service")
    parser.add_argument("--check-only", "-c", action="store_true", help="Only check status, don't try to start services")
    args = parser.parse_args()
    
    if args.check_only:
        # Just run the service status checker
        from scripts.check_service_status import main as check_main
        return check_main()
    
    # Start services
    success = ensure_services_running(args.services, args.attempts)
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())