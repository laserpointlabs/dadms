#!/usr/bin/env python3
"""
MCP Docker Services Manager
Manages MCP services running in Docker containers
"""

import subprocess
import time
import sys
import os
import logging
import requests
import json
from typing import Dict, List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MCPDockerManager:
    """Manager for MCP services running in Docker containers"""
    
    def __init__(self, base_path: str = None):
        self.base_path = base_path or os.path.dirname(os.path.dirname(__file__))
        self.docker_compose_file = os.path.join(self.base_path, "docker", "docker-compose-mcp-standalone.yml")
        
        self.services = {
            "mcp-statistical-service": {
                "port": 5201,
                "name": "MCP Statistical Service",
                "container_name": "dadm-mcp-statistical"
            },
            "mcp-neo4j-service": {
                "port": 5202,
                "name": "MCP Neo4j Service", 
                "container_name": "dadm-mcp-neo4j"
            },
            "mcp-script-execution-service": {
                "port": 5203,
                "name": "MCP Script Execution Service",
                "container_name": "dadm-mcp-script-execution"
            }
        }
    
    def build_services(self) -> bool:
        """Build Docker images for all MCP services"""
        logger.info("🏗️  Building MCP service Docker images...")
        try:
            cmd = [
                "docker-compose", 
                "-f", self.docker_compose_file,
                "build",
                "mcp-statistical-service",
                "mcp-neo4j-service", 
                "mcp-script-execution-service"
            ]
            
            result = subprocess.run(cmd, cwd=self.base_path, capture_output=True, text=True)
            
            if result.returncode == 0:
                logger.info("✅ All MCP service images built successfully")
                return True
            else:
                logger.error(f"❌ Failed to build images: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error building images: {str(e)}")
            return False
      
    def start_services(self) -> bool:
        """Start all MCP services in Docker containers"""
        logger.info("🚀 Starting MCP services in Docker containers...")
        
        try:
            # Start MCP services directly (no dependencies in standalone mode)
            cmd = [
                "docker-compose",
                "-f", self.docker_compose_file,
                "up", "-d",
                "mcp-statistical-service",
                "mcp-neo4j-service",
                "mcp-script-execution-service"
            ]
            
            result = subprocess.run(cmd, cwd=self.base_path, capture_output=True, text=True)
            
            if result.returncode == 0:
                logger.info("✅ MCP services started in containers")
                
                # Wait for services to be ready
                logger.info("⏳ Waiting for services to be ready...")
                time.sleep(15)
                
                # Check health of all services
                return self.check_all_services_health()
            else:
                logger.error(f"❌ Failed to start services: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error starting services: {str(e)}")
            return False
    
    def stop_services(self) -> bool:
        """Stop all MCP services"""
        logger.info("🛑 Stopping MCP services...")
        
        try:            
            cmd = [
                "docker-compose",
                "-f", self.docker_compose_file,
                "down",
                "mcp-statistical-service",
                "mcp-neo4j-service", 
                "mcp-script-execution-service"
            ]
            
            result = subprocess.run(cmd, cwd=self.base_path, capture_output=True, text=True)
            
            if result.returncode == 0:
                logger.info("✅ MCP services stopped")
                return True
            else:
                logger.error(f"❌ Failed to stop services: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error stopping services: {str(e)}")
            return False
    
    def check_service_health(self, service_key: str, max_retries: int = 20) -> bool:
        """Check if a service is healthy and responding"""
        service = self.services[service_key]
        url = f"http://localhost:{service['port']}/health"
        
        logger.info(f"🏥 Checking health of {service['name']}...")
        
        for attempt in range(max_retries):
            try:
                response = requests.get(url, timeout=5)
                if response.status_code == 200:
                    logger.info(f"💚 {service['name']} health check passed")
                    return True
            except requests.exceptions.RequestException:
                pass
            
            time.sleep(2)
            logger.info(f"⏳ Health check attempt {attempt + 1}/{max_retries} for {service['name']}")
        
        logger.error(f"❌ {service['name']} health check failed after {max_retries} attempts")
        return False
    
    def check_all_services_health(self) -> bool:
        """Check health of all services"""
        healthy_services = []
        
        for service_key in self.services.keys():
            if self.check_service_health(service_key):
                healthy_services.append(service_key)
        
        if len(healthy_services) == len(self.services):
            logger.info("🎉 All MCP services are healthy and ready!")
            return True
        else:
            logger.warning(f"⚠️  Only {len(healthy_services)}/{len(self.services)} services are healthy")
            return False
    
    def get_container_status(self) -> Dict:
        """Get status of all containers"""
        try:            
            cmd = [
                "docker-compose",
                "-f", self.docker_compose_file,
                "ps", "--format", "json"
            ]
            
            result = subprocess.run(cmd, cwd=self.base_path, capture_output=True, text=True)
            
            if result.returncode == 0:
                # Parse container status
                containers = []
                for line in result.stdout.strip().split('\n'):
                    if line:
                        try:
                            containers.append(json.loads(line))
                        except json.JSONDecodeError:
                            continue
                
                status = {}
                for service_key, service_info in self.services.items():
                    container_name = service_info['container_name']
                    container_status = next(
                        (c for c in containers if c.get('Name') == container_name), 
                        None
                    )
                    
                    if container_status:
                        status[service_key] = {
                            'container_running': container_status.get('State') == 'running',
                            'health': 'unknown'
                        }
                    else:
                        status[service_key] = {
                            'container_running': False,
                            'health': 'unknown'
                        }
                
                return status
            else:
                logger.error(f"Failed to get container status: {result.stderr}")
                return {}
                
        except Exception as e:
            logger.error(f"Error getting container status: {str(e)}")
            return {}
    
    def show_logs(self, service_key: Optional[str] = None, lines: int = 50):
        """Show logs for a specific service or all services"""
        try:
            if service_key and service_key in self.services:                cmd = [
                    "docker-compose",
                    "-f", self.docker_compose_file,
                    "logs", "--tail", str(lines), service_key
                ]
            else:
                cmd = [
                    "docker-compose", 
                    "-f", self.docker_compose_file,
                    "logs", "--tail", str(lines),
                    "mcp-statistical-service",
                    "mcp-neo4j-service",
                    "mcp-script-execution-service"
                ]
            
            subprocess.run(cmd, cwd=self.base_path)
            
        except Exception as e:
            logger.error(f"Error showing logs: {str(e)}")


def main():
    """Main CLI interface"""
    manager = MCPDockerManager()
    
    if len(sys.argv) < 2:
        print("Usage: python mcp_docker_manager.py <command>")
        print("Commands:")
        print("  build     - Build Docker images")
        print("  start     - Start services")
        print("  stop      - Stop services")
        print("  status    - Show service status")
        print("  health    - Check service health")
        print("  logs      - Show service logs")
        print("  logs <service> - Show logs for specific service")
        return
    
    command = sys.argv[1]
    
    if command == "build":
        success = manager.build_services()
        sys.exit(0 if success else 1)
        
    elif command == "start":
        success = manager.start_services()
        if success:
            logger.info("🔗 MCP services are ready for integration!")
            logger.info("🧪 You can now run integration tests or connect from DADM workflows")
        sys.exit(0 if success else 1)
        
    elif command == "stop":
        success = manager.stop_services()
        sys.exit(0 if success else 1)
        
    elif command == "status":
        status = manager.get_container_status()
        print("\n📊 MCP Services Status:")
        print("=" * 50)
        for service_key, info in status.items():
            service_name = manager.services[service_key]['name']
            running_status = "🟢 Running" if info['container_running'] else "🔴 Stopped"
            print(f"{service_name}: {running_status}")
        
    elif command == "health":
        success = manager.check_all_services_health()
        sys.exit(0 if success else 1)
        
    elif command == "logs":
        service_key = sys.argv[2] if len(sys.argv) > 2 else None
        manager.show_logs(service_key)
        
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)


if __name__ == "__main__":
    main()
