#!/usr/bin/env python3
"""
DADM Docker Compose Deployment Script

This script helps deploy and manage the DADM system using Docker Compose.
It includes validation, deployment, and testing capabilities.
"""

import subprocess
import sys
import time
import requests
import json
import os
import threading
from datetime import datetime
from typing import Dict, List, Optional

class DADMDeployment:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(__file__))
        self.docker_dir = os.path.join(self.base_dir, "docker")
        self.compose_file = os.path.join(self.docker_dir, "docker-compose.yml")
        
        # Service health check endpoints
        self.services = {
            "consul": {"port": 8500, "path": "/v1/status/leader"},
            "postgres": {"port": 5432, "path": None},  # Database, use connection test
            "camunda": {"port": 8080, "path": "/engine-rest/engine"},
            "qdrant": {"port": 6333, "path": "/collections"},
            "neo4j": {"port": 7474, "path": "/"},
            "openai-service": {"port": 5000, "path": "/health"},
            "echo-service": {"port": 5100, "path": "/health"},
            "service-monitor": {"port": 5200, "path": "/health"},
            "mcp-statistical-service": {"port": 5201, "path": "/health"},
            "mcp-neo4j-service": {"port": 5202, "path": "/health"},
            "mcp-script-execution-service": {"port": 5203, "path": "/health"},
            "llm-mcp-pipeline-service": {"port": 5204, "path": "/health"},            
            "dadm-wrapper-service": {"port": 5205, "path": "/health"}
        }

    def run_command(self, command: List[str], cwd: Optional[str] = None) -> subprocess.CompletedProcess:
        """Run a command and return the result."""
        print(f"Running: {' '.join(command)}")
        return subprocess.run(command, cwd=cwd or self.docker_dir, capture_output=True, text=True)    
    
    def run_command_with_output(self, command: List[str], cwd: Optional[str] = None) -> bool:
        """Run a command with real-time output streaming."""
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Running: {' '.join(command)}")
        
        process = subprocess.Popen(
            command,
            cwd=cwd or self.docker_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True,
            encoding='utf-8',
            errors='replace'
        )
        
        # Stream output in real-time
        if process.stdout:
            while True:
                output = process.stdout.readline()
                if output == '' and process.poll() is not None:
                    break
                if output:
                    # Clean up the output and add timestamp
                    line = output.strip()
                    if line:
                        print(f"[{datetime.now().strftime('%H:%M:%S')}] {line}")
                        sys.stdout.flush()
        
        return_code = process.poll()
        if return_code == 0:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] ✓ Command completed successfully")
        else:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] ✗ Command failed with return code {return_code}")
        
        return return_code == 0

    def check_prerequisites(self) -> bool:
        """Check if Docker and Docker Compose are available."""
        print("Checking prerequisites...")
        
        # Check Docker
        result = subprocess.run(["docker", "--version"], capture_output=True, text=True)
        if result.returncode != 0:
            print("ERROR: Docker is not installed or not in PATH")
            return False
        print(f"✓ {result.stdout.strip()}")
        
        # Check Docker Compose
        result = subprocess.run(["docker", "compose", "version"], capture_output=True, text=True)
        if result.returncode != 0:
            print("ERROR: Docker Compose is not installed or not in PATH")
            return False
        print(f"✓ {result.stdout.strip()}")
        
        # Check if .env file exists
        env_file = os.path.join(self.base_dir, ".env")
        if not os.path.exists(env_file):
            print("WARNING: .env file not found. Using default values.")
        else:
            print("✓ .env file found")
        
        return True

    def build_services(self) -> bool:
        """Build all Docker services with real-time output."""
        print("\nBuilding Docker services...")
        print("This may take several minutes depending on your system and network speed...")
        print("-" * 60)
        
        # Use the new method that streams output in real-time
        success = self.run_command_with_output(["docker", "compose", "build", "--no-cache"])
        
        if success:
            print("-" * 60)
            print("✓ All services built successfully")
            return True
        else:
            print("-" * 60)
            print("✗ Failed to build services")
            return False    
        
    def deploy_services(self, detached: bool = True) -> bool:
        """Deploy all services using Docker Compose."""
        print("\nDeploying services...")
        print("-" * 60)
        
        cmd = ["docker", "compose", "up"]
        if detached:
            cmd.append("-d")
        
        # Use real-time output for deployment
        success = self.run_command_with_output(cmd)
        
        if success:
            print("-" * 60)
            print("✓ All services deployed successfully")
            return True
        else:
            print("-" * 60)
            print("✗ Failed to deploy services")
            return False

    def check_service_health(self, service_name: str, max_retries: int = 30) -> bool:
        """Check if a specific service is healthy."""
        if service_name not in self.services:
            print(f"Unknown service: {service_name}")
            return False
        
        service_config = self.services[service_name]
        port = service_config["port"]
        path = service_config["path"]
        
        if path is None:
            # Special case for database services
            return True
        
        url = f"http://localhost:{port}{path}"
        
        for attempt in range(max_retries):
            try:
                response = requests.get(url, timeout=5)
                if response.status_code == 200:
                    return True
            except Exception as e:
                pass
            
            if attempt < max_retries - 1:
                time.sleep(2)
        
        return False

    def wait_for_services(self) -> bool:
        """Wait for all services to become healthy."""
        print("\nWaiting for services to become healthy...")
        
        # Services to check in order (dependencies first)
        check_order = [
            "consul", "postgres", "qdrant", "neo4j", "camunda",
            "openai-service", "echo-service", 
            "mcp-statistical-service", "mcp-neo4j-service", "mcp-script-execution-service",
            "llm-mcp-pipeline-service", "dadm-wrapper-service", "service-monitor"
        ]
        
        for service_name in check_order:
            print(f"Checking {service_name}...")
            if self.check_service_health(service_name):
                print(f"✓ {service_name} is healthy")
            else:
                print(f"✗ {service_name} is not responding")
                return False
        
        print("✓ All services are healthy")
        return True

    def run_integration_tests(self) -> bool:
        """Run integration tests against the deployed services."""
        print("\nRunning integration tests...")
        
        # Test service discovery
        try:
            response = requests.get("http://localhost:8500/v1/catalog/services")
            if response.status_code == 200:
                services = response.json()
                print(f"✓ Service discovery working: {len(services)} services registered")
            else:
                print("✗ Service discovery test failed")
                return False
        except Exception as e:
            print(f"✗ Service discovery test failed: {e}")
            return False
        
        # Test LLM-MCP Pipeline Service
        try:
            response = requests.get("http://localhost:5204/health")
            if response.status_code == 200:
                print("✓ LLM-MCP Pipeline Service health check passed")
                
                # Test pipeline list
                response = requests.get("http://localhost:5204/pipelines")
                if response.status_code == 200:
                    pipelines = response.json()
                    print(f"✓ Pipeline service: {len(pipelines.get('pipelines', []))} pipelines available")
                else:
                    print("✗ Pipeline list test failed")
                    return False
            else:
                print("✗ LLM-MCP Pipeline Service health check failed")
                return False
        except Exception as e:
            print(f"✗ LLM-MCP Pipeline Service test failed: {e}")
            return False
        
        # Test DADM Wrapper Service
        try:
            response = requests.get("http://localhost:5205/health")
            if response.status_code == 200:
                print("✓ DADM Wrapper Service health check passed")
                
                # Test service info
                response = requests.get("http://localhost:5205/info")
                if response.status_code == 200:
                    info = response.json()
                    print(f"✓ DADM Wrapper Service info: {info.get('service_name', 'unknown')}")
                else:
                    print("✗ DADM Wrapper Service info test failed")
                    return False
            else:
                print("✗ DADM Wrapper Service health check failed")
                return False
        except Exception as e:
            print(f"✗ DADM Wrapper Service test failed: {e}")
            return False
        
        print("✓ All integration tests passed")
        return True

    def show_service_status(self):
        """Show the status of all services."""
        print("\nService Status:")
        print("-" * 60)
        
        for service_name, config in self.services.items():
            port = config["port"]
            path = config.get("path", "/")
            
            if path:
                url = f"http://localhost:{port}{path}"
                try:
                    response = requests.get(url, timeout=3)
                    status = "✓ Running" if response.status_code == 200 else "✗ Error"
                except Exception:
                    status = "✗ Not responding"
            else:
                status = "? Database (check logs)"
            
            print(f"{service_name:<30} {port:<6} {status}")

    def stop_services(self):
        """Stop all services."""
        print("\nStopping services...")
        result = self.run_command(["docker", "compose", "down"])
        
        if result.returncode == 0:
            print("✓ All services stopped")
        else:
            print("✗ Error stopping services")
            print(f"STDERR: {result.stderr}")

    def show_logs(self, service_name: Optional[str] = None):
        """Show logs for a specific service or all services."""
        cmd = ["docker", "compose", "logs"]
        if service_name:
            cmd.append(service_name)
        cmd.extend(["-f", "--tail=50"])
        
        subprocess.run(cmd, cwd=self.docker_dir)

    def get_services_from_compose(self) -> List[str]:
        """Get list of services from docker-compose.yml file."""
        try:
            result = subprocess.run(
                ["docker", "compose", "config", "--services"],
                cwd=self.docker_dir,
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                return [service.strip() for service in result.stdout.split('\n') if service.strip()]
            else:
                return []
        except Exception:
            return []

def main():
    deployment = DADMDeployment()
    
    if len(sys.argv) < 2:
        print("Usage: python deploy_dadm.py <command>")
        print("Commands:")
        print("  check     - Check prerequisites")
        print("  build     - Build all services")
        print("  deploy    - Deploy all services")
        print("  full      - Full deployment (build + deploy + test)")
        print("  test      - Run integration tests")
        print("  status    - Show service status")
        print("  stop      - Stop all services")
        print("  logs      - Show logs for all services")
        print("  logs <service> - Show logs for specific service")
        return 1
    
    command = sys.argv[1].lower()
    
    if command == "check":
        if deployment.check_prerequisites():
            print("✓ All prerequisites met")
            return 0
        else:
            print("✗ Prerequisites not met")
            return 1
    
    elif command == "build":
        if not deployment.check_prerequisites():
            return 1
        if deployment.build_services():
            return 0
        else:
            return 1
    
    elif command == "deploy":
        if not deployment.check_prerequisites():
            return 1
        if deployment.deploy_services():
            if deployment.wait_for_services():
                deployment.show_service_status()
                return 0
        return 1
    
    elif command == "full":
        if not deployment.check_prerequisites():
            return 1
        if deployment.build_services():
            if deployment.deploy_services():
                if deployment.wait_for_services():
                    if deployment.run_integration_tests():
                        deployment.show_service_status()
                        print("\n🎉 Full deployment completed successfully!")
                        return 0
        return 1
    
    elif command == "test":
        if deployment.run_integration_tests():
            return 0
        else:
            return 1
    
    elif command == "status":
        deployment.show_service_status()
        return 0
    
    elif command == "stop":
        deployment.stop_services()
        return 0
    
    elif command == "logs":
        service_name = sys.argv[2] if len(sys.argv) > 2 else None
        deployment.show_logs(service_name)
        return 0
    
    else:
        print(f"Unknown command: {command}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
