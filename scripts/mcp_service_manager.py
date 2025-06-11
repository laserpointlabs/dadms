#!/usr/bin/env python3
"""
MCP Services Startup Script
Launches all MCP services for DADM integration testing
"""

import subprocess
import time
import sys
import os
import logging
from concurrent.futures import ThreadPoolExecutor
import requests

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MCPServiceManager:
    """Manager for MCP services startup and monitoring"""
    
    def __init__(self, base_path: str = None):
        self.base_path = base_path or os.path.dirname(os.path.dirname(__file__))
        self.services = {
            "statistical": {
                "path": os.path.join(self.base_path, "services", "mcp_statistical_service"),
                "script": "service.py",
                "port": 5201,
                "name": "MCP Statistical Service"
            },
            "neo4j": {
                "path": os.path.join(self.base_path, "services", "mcp_neo4j_service"),
                "script": "service.py", 
                "port": 5202,
                "name": "MCP Neo4j Service"
            },
            "script_execution": {
                "path": os.path.join(self.base_path, "services", "mcp_script_execution_service"),
                "script": "service.py",
                "port": 5203,
                "name": "MCP Script Execution Service"
            }
        }
        self.processes = {}
    
    def start_service(self, service_key: str) -> bool:
        """Start a single MCP service"""
        service = self.services[service_key]
        
        try:
            logger.info(f"🚀 Starting {service['name']} on port {service['port']}...")
            
            # Change to service directory
            service_script = os.path.join(service['path'], service['script'])
            
            if not os.path.exists(service_script):
                logger.error(f"❌ Service script not found: {service_script}")
                return False
            
            # Start the service process
            process = subprocess.Popen(
                [sys.executable, service_script],
                cwd=service['path'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            self.processes[service_key] = process
            logger.info(f"✅ {service['name']} started with PID {process.pid}")
            
            # Give service time to start
            time.sleep(2)
            
            # Check if process is still running
            if process.poll() is None:
                return True
            else:
                stdout, stderr = process.communicate()
                logger.error(f"❌ {service['name']} failed to start")
                logger.error(f"STDOUT: {stdout}")
                logger.error(f"STDERR: {stderr}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Failed to start {service['name']}: {str(e)}")
            return False
    
    def check_service_health(self, service_key: str, max_retries: int = 10) -> bool:
        """Check if service is healthy and responding"""
        service = self.services[service_key]
        url = f"http://localhost:{service['port']}/health"
        
        for attempt in range(max_retries):
            try:
                response = requests.get(url, timeout=5)
                if response.status_code == 200:
                    logger.info(f"💚 {service['name']} health check passed")
                    return True
            except requests.exceptions.RequestException:
                pass
            
            if attempt < max_retries - 1:
                logger.info(f"⏳ Waiting for {service['name']} to be ready... (attempt {attempt + 1}/{max_retries})")
                time.sleep(3)
        
        logger.error(f"❌ {service['name']} health check failed after {max_retries} attempts")
        return False
    
    def start_all_services(self) -> bool:
        """Start all MCP services"""
        logger.info("🌟 Starting MCP Services for DADM Integration")
        logger.info("=" * 60)
        
        # Start services in parallel
        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = {
                executor.submit(self.start_service, service_key): service_key 
                for service_key in self.services.keys()
            }
            
            results = {}
            for future in futures:
                service_key = futures[future]
                try:
                    results[service_key] = future.result()
                except Exception as e:
                    logger.error(f"❌ Exception starting {service_key}: {str(e)}")
                    results[service_key] = False
        
        # Wait for services to be ready
        logger.info("⏳ Waiting for services to initialize...")
        time.sleep(5)
        
        # Check health of all started services
        healthy_services = []
        for service_key, started in results.items():
            if started:
                if self.check_service_health(service_key):
                    healthy_services.append(service_key)
        
        logger.info("=" * 60)
        logger.info(f"📊 Status Summary:")
        for service_key in self.services.keys():
            service = self.services[service_key]
            if service_key in healthy_services:
                logger.info(f"   ✅ {service['name']} - Running on port {service['port']}")
            else:
                logger.info(f"   ❌ {service['name']} - Failed to start or unhealthy")
        
        if len(healthy_services) == len(self.services):
            logger.info("🎉 All MCP services started successfully!")
            logger.info("🔗 You can now run the integration tests or connect from DADM workflows")
            return True
        else:
            logger.warning(f"⚠️  Only {len(healthy_services)}/{len(self.services)} services started successfully")
            return False
    
    def stop_all_services(self):
        """Stop all running services"""
        logger.info("🛑 Stopping all MCP services...")
        
        for service_key, process in self.processes.items():
            if process and process.poll() is None:
                service = self.services[service_key]
                logger.info(f"⏹️  Stopping {service['name']}...")
                process.terminate()
                
                # Wait for graceful shutdown
                try:
                    process.wait(timeout=5)
                    logger.info(f"✅ {service['name']} stopped gracefully")
                except subprocess.TimeoutExpired:
                    logger.warning(f"⚠️  Force killing {service['name']}")
                    process.kill()
                    process.wait()
        
        self.processes.clear()
        logger.info("✅ All services stopped")
    
    def get_service_status(self) -> dict:
        """Get status of all services"""
        status = {}
        for service_key in self.services.keys():
            service = self.services[service_key]
            
            # Check if process is running
            process_running = (
                service_key in self.processes and 
                self.processes[service_key] and 
                self.processes[service_key].poll() is None
            )
            
            # Check health endpoint
            health_ok = False
            if process_running:
                try:
                    response = requests.get(f"http://localhost:{service['port']}/health", timeout=2)
                    health_ok = response.status_code == 200
                except:
                    health_ok = False
            
            status[service_key] = {
                "name": service['name'],
                "port": service['port'],
                "process_running": process_running,
                "health_ok": health_ok,
                "status": "healthy" if (process_running and health_ok) else "unhealthy"
            }
        
        return status

def print_usage():
    """Print usage information"""
    print("""
MCP Services Manager
===================

Usage: python mcp_service_manager.py [command]

Commands:
  start    - Start all MCP services
  stop     - Stop all MCP services  
  status   - Show status of all services
  test     - Start services and run integration tests
  help     - Show this help message

Examples:
  python mcp_service_manager.py start
  python mcp_service_manager.py status
  python mcp_service_manager.py test
""")

def main():
    """Main entry point"""
    command = sys.argv[1] if len(sys.argv) > 1 else "start"
    
    if command == "help":
        print_usage()
        return 0
    
    manager = MCPServiceManager()
    
    try:
        if command == "start":
            success = manager.start_all_services()
            if success:
                logger.info("🔄 Services are running. Press Ctrl+C to stop...")
                try:
                    while True:
                        time.sleep(10)
                        # Periodic health check
                        status = manager.get_service_status()
                        unhealthy = [s for s, info in status.items() if info['status'] != 'healthy']
                        if unhealthy:
                            logger.warning(f"⚠️  Unhealthy services detected: {unhealthy}")
                except KeyboardInterrupt:
                    logger.info("🛑 Shutdown requested...")
            return 0 if success else 1
            
        elif command == "stop":
            manager.stop_all_services()
            return 0
            
        elif command == "status":
            status = manager.get_service_status()
            logger.info("📊 MCP Services Status:")
            logger.info("=" * 40)
            for service_key, info in status.items():
                status_icon = "✅" if info['status'] == 'healthy' else "❌"
                logger.info(f"  {status_icon} {info['name']} (port {info['port']}) - {info['status']}")
            return 0
            
        elif command == "test":
            logger.info("🧪 Starting services and running integration tests...")
            success = manager.start_all_services()
            if success:
                logger.info("⏳ Running integration tests...")
                time.sleep(2)
                
                # Run the integration test
                test_script = os.path.join(os.path.dirname(__file__), "mcp_integration_test.py")
                if os.path.exists(test_script):
                    result = subprocess.run([sys.executable, test_script])
                    manager.stop_all_services()
                    return result.returncode
                else:
                    logger.error(f"❌ Test script not found: {test_script}")
                    manager.stop_all_services()
                    return 1
            else:
                logger.error("❌ Failed to start services for testing")
                return 1
        
        else:
            logger.error(f"❌ Unknown command: {command}")
            print_usage()
            return 1
            
    except KeyboardInterrupt:
        logger.info("🛑 Interrupted by user")
        manager.stop_all_services()
        return 0
    except Exception as e:
        logger.error(f"❌ Unexpected error: {str(e)}")
        manager.stop_all_services()
        return 1

if __name__ == "__main__":
    exit(main())
