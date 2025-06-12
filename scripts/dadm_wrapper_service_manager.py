#!/usr/bin/env python3
"""
DADM Wrapper Service Manager

This script manages the DADM Application Wrapper Service lifecycle:
- Start/stop the service
- Check service status
- Test service functionality
- Validate dependencies
"""

import sys
import json
import time
import requests
import subprocess
import logging
from pathlib import Path
from datetime import datetime

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from config.service_registry import get_service_registry

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DADMWrapperServiceManager:
    """Manager for DADM Wrapper Service operations"""
    
    def __init__(self):
        self.service_name = "dadm-application-wrapper"
        self.service_port = 5205
        self.service_url = f"http://localhost:{self.service_port}"
        self.service_dir = project_root / "services" / "dadm_wrapper_service"
        self.service_registry = get_service_registry()
        
    def validate_dependencies(self) -> bool:
        """Validate that all required services are available"""
        logger.info("Validating dependencies...")
        
        required_services = [
            ("llm-mcp-pipeline-service", 5204),
            ("openai-service", 5200),
            ("statistical-mcp-service", 5201),
            ("neo4j-mcp-service", 5202),
            ("script-execution-mcp-service", 5203)
        ]
        
        all_available = True
        for service_name, port in required_services:
            try:
                response = requests.get(f"http://localhost:{port}/health", timeout=5)
                if response.status_code == 200:
                    logger.info(f"✓ {service_name} is available on port {port}")
                else:
                    logger.error(f"✗ {service_name} returned status {response.status_code}")
                    all_available = False
            except requests.exceptions.RequestException as e:
                logger.error(f"✗ {service_name} is not available on port {port}: {e}")
                all_available = False
        
        return all_available
    
    def start_service(self) -> bool:
        """Start the DADM wrapper service"""
        logger.info(f"Starting {self.service_name}...")
        
        # Check if service is already running
        if self.is_service_running():
            logger.info(f"{self.service_name} is already running")
            return True
        
        # Validate dependencies first
        if not self.validate_dependencies():
            logger.error("Cannot start service - dependencies not available")
            return False
        
        try:
            # Start the service
            service_script = self.service_dir / "service.py"
            cmd = [sys.executable, str(service_script)]
            
            logger.info(f"Executing: {' '.join(cmd)}")
            subprocess.Popen(
                cmd,
                cwd=str(self.service_dir),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Wait for service to start
            max_attempts = 30
            for attempt in range(max_attempts):
                time.sleep(1)
                if self.is_service_running():
                    logger.info(f"✓ {self.service_name} started successfully")
                    
                    # Register service
                    self.register_service()
                    return True
                
                logger.info(f"Waiting for service to start... ({attempt + 1}/{max_attempts})")
            
            logger.error(f"Service failed to start within {max_attempts} seconds")
            return False
            
        except Exception as e:
            logger.error(f"Failed to start service: {e}")
            return False
    
    def stop_service(self) -> bool:
        """Stop the DADM wrapper service"""
        logger.info(f"Stopping {self.service_name}...")
        
        try:
            # Find and kill the service process
            result = subprocess.run(
                ["pkill", "-f", "dadm_wrapper_service"],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                logger.info(f"✓ {self.service_name} stopped successfully")
                
                # Unregister service
                self.unregister_service()
                return True
            else:
                logger.warning(f"No running {self.service_name} process found")
                return True
                
        except Exception as e:
            logger.error(f"Failed to stop service: {e}")
            return False
    
    def is_service_running(self) -> bool:
        """Check if the service is running"""
        try:
            response = requests.get(f"{self.service_url}/health", timeout=5)
            return response.status_code == 200
        except requests.exceptions.RequestException:
            return False
    
    def get_service_status(self) -> dict:
        """Get detailed service status"""
        if not self.is_service_running():
            return {
                "status": "stopped",
                "service": self.service_name,
                "url": self.service_url
            }
        
        try:
            response = requests.get(f"{self.service_url}/health", timeout=5)
            if response.status_code == 200:
                return response.json()
            else:
                return {
                    "status": "unhealthy",
                    "service": self.service_name,
                    "url": self.service_url,
                    "http_status": response.status_code
                }
        except Exception as e:
            return {
                "status": "error",
                "service": self.service_name,
                "url": self.service_url,
                "error": str(e)            
                }
    
    def register_service(self):
        """Register service with service registry"""
        try:
            # For now, we'll use a simple approach since the current service registry
            # is function-based rather than class-based
            logger.info(f"✓ Service {self.service_name} ready for registration")
            # In a future implementation, this could integrate with Consul or 
            # other service discovery mechanisms
        except Exception as e:
            logger.warning(f"Failed to register service: {e}")
    
    def unregister_service(self):
        """Unregister service from service registry"""
        try:
            logger.info(f"✓ Service {self.service_name} unregistered")
        except Exception as e:
            logger.warning(f"Failed to unregister service: {e}")
    
    def test_service(self) -> bool:
        """Test service functionality"""
        logger.info(f"Testing {self.service_name}...")
        
        if not self.is_service_running():
            logger.error("Service is not running")
            return False
        
        tests_passed = 0
        total_tests = 0
        
        # Test 1: Health check
        total_tests += 1
        try:
            response = requests.get(f"{self.service_url}/health", timeout=10)
            if response.status_code == 200:
                tests_passed += 1
                logger.info("✓ Health check passed")
            else:
                logger.error(f"✗ Health check failed: {response.status_code}")
        except Exception as e:
            logger.error(f"✗ Health check failed: {e}")
        
        # Test 2: Pipeline execution
        total_tests += 1
        try:
            test_data = {
                "pipeline_name": "decision_analysis",
                "variables": {
                    "decision_context": "Test decision for DADM wrapper service",
                    "criteria": ["feasibility", "impact"],
                    "alternatives": ["Option A", "Option B"]
                }
            }
            
            response = requests.post(
                f"{self.service_url}/execute/pipeline",
                json=test_data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "success":
                    tests_passed += 1
                    logger.info("✓ Pipeline execution test passed")
                else:
                    logger.error(f"✗ Pipeline execution test failed: {result.get('message')}")
            else:
                logger.error(f"✗ Pipeline execution test failed: {response.status_code}")
                
        except Exception as e:
            logger.error(f"✗ Pipeline execution test failed: {e}")
        
        # Test 3: Process task endpoint (Camunda integration)
        total_tests += 1
        try:
            test_data = {
                "task_name": "Test DADM Analysis",
                "task_description": "Test DADM wrapper service integration",
                "variables": {
                    "execution_type": "pipeline",
                    "pipeline_name": "decision_analysis",
                    "decision_context": "Test decision for Camunda integration"
                }
            }
            
            response = requests.post(
                f"{self.service_url}/process_task",
                json=test_data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "success":
                    tests_passed += 1
                    logger.info("✓ Process task endpoint test passed")
                else:
                    logger.error(f"✗ Process task endpoint test failed: {result.get('message')}")
            else:
                logger.error(f"✗ Process task endpoint test failed: {response.status_code}")
                
        except Exception as e:
            logger.error(f"✗ Process task endpoint test failed: {e}")
        
        # Test summary
        logger.info(f"Test Results: {tests_passed}/{total_tests} tests passed")
        
        if tests_passed == total_tests:
            logger.info("✓ All tests passed - DADM wrapper service is working correctly")
            return True
        else:
            logger.error(f"✗ {total_tests - tests_passed} tests failed")
            return False


def main():
    """Main function"""
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <command>")
        print("Commands:")
        print("  start     - Start the DADM wrapper service")
        print("  stop      - Stop the DADM wrapper service")
        print("  status    - Show service status")
        print("  test      - Test service functionality")
        print("  validate  - Validate dependencies")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    manager = DADMWrapperServiceManager()
    
    if command == "start":
        success = manager.start_service()
        sys.exit(0 if success else 1)
    elif command == "stop":
        success = manager.stop_service()
        sys.exit(0 if success else 1)
    elif command == "status":
        status = manager.get_service_status()
        print(json.dumps(status, indent=2))
        sys.exit(0)
    elif command == "test":
        success = manager.test_service()
        sys.exit(0 if success else 1)
    elif command == "validate":
        success = manager.validate_dependencies()
        sys.exit(0 if success else 1)
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)


if __name__ == "__main__":
    main()
