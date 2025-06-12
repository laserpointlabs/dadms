#!/usr/bin/env python3
"""
LLM-MCP Pipeline Service Manager

This script provides easy management of the LLM-MCP Pipeline Service including:
- Starting and stopping the service
- Health checks and status monitoring  
- Integration testing
- Configuration validation
"""

import os
import sys
import subprocess
import time
import requests
import signal
import json
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

class PipelineServiceManager:
    """Manager for the LLM-MCP Pipeline Service"""
    
    def __init__(self):
        self.project_root = project_root
        self.service_path = self.project_root / "services" / "llm_mcp_pipeline_service"
        self.service_script = self.service_path / "service.py"
        self.service_url = "http://localhost:5204"
        self.process = None
        
    def start_service(self):
        """Start the pipeline service"""
        print("🚀 Starting LLM-MCP Pipeline Service...")
        
        if self.is_service_running():
            print("⚠️ Service is already running")
            return True
        
        try:
            # Start the service process
            env = os.environ.copy()
            env['PYTHONPATH'] = str(self.project_root)
            
            self.process = subprocess.Popen(
                [sys.executable, str(self.service_script)],
                cwd=str(self.project_root),
                env=env
            )
            
            # Wait for service to start
            print("⏳ Waiting for service to start...")
            for i in range(30):  # Wait up to 30 seconds
                if self.is_service_running():
                    print(f"✅ Service started successfully (PID: {self.process.pid})")
                    return True
                time.sleep(1)
                print(".", end="", flush=True)
            
            print("\n❌ Service failed to start within 30 seconds")
            self.stop_service()
            return False
            
        except Exception as e:
            print(f"❌ Error starting service: {e}")
            return False
    
    def stop_service(self):
        """Stop the pipeline service"""
        print("🛑 Stopping LLM-MCP Pipeline Service...")
        
        if self.process:
            try:
                self.process.terminate()
                self.process.wait(timeout=10)
                print("✅ Service stopped successfully")
                return True
            except subprocess.TimeoutExpired:
                print("⚠️ Service didn't stop gracefully, forcing termination...")
                self.process.kill()
                self.process.wait()
                print("✅ Service terminated")
                return True
            except Exception as e:
                print(f"❌ Error stopping service: {e}")
                return False
        else:
            print("⚠️ Service process not found")
            return True
    
    def is_service_running(self):
        """Check if the service is running and responding"""
        try:
            response = requests.get(f"{self.service_url}/health", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def get_service_status(self):
        """Get detailed service status"""
        print("📊 LLM-MCP Pipeline Service Status")
        print("=" * 50)
        
        if not self.is_service_running():
            print("❌ Service is not running")
            return False
        
        try:
            # Get health info
            health_response = requests.get(f"{self.service_url}/health", timeout=10)
            if health_response.status_code == 200:
                health_data = health_response.json()
                print(f"✅ Service: {health_data.get('service')}")
                print(f"✅ Version: {health_data.get('version')}")
                print(f"✅ Status: {health_data.get('status')}")
                print(f"✅ Available Pipelines: {health_data.get('available_pipelines')}")
            
            # Get service info
            info_response = requests.get(f"{self.service_url}/info", timeout=10)
            if info_response.status_code == 200:
                info_data = info_response.json()
                capabilities = info_data.get('capabilities', [])
                pipelines = info_data.get('available_pipelines', {})
                
                print(f"✅ Capabilities: {len(capabilities)}")
                for cap in capabilities:
                    print(f"   📋 {cap}")
                
                print(f"✅ Predefined Pipelines: {len(pipelines)}")
                for name, config in pipelines.items():
                    analysis_type = config.get('analysis_type', 'unknown')
                    llm_service = config.get('llm_service', 'unknown')
                    mcp_service = config.get('mcp_service', 'unknown')
                    print(f"   🔧 {name}: {analysis_type} ({llm_service} + {mcp_service})")
            
            return True
            
        except Exception as e:
            print(f"❌ Error getting service status: {e}")
            return False
    
    def test_service(self):
        """Run integration tests for the service"""
        print("🧪 Running Pipeline Service Tests...")
        
        if not self.is_service_running():
            print("❌ Service is not running. Starting service first...")
            if not self.start_service():
                return False
        
        try:
            # Import and run the test suite
            test_script = self.project_root / "scripts" / "test_pipeline_service.py"
            
            result = subprocess.run(
                [sys.executable, str(test_script)],
                cwd=str(self.project_root),
                capture_output=True,
                text=True
            )
            
            print(result.stdout)
            if result.stderr:
                print("Errors:", result.stderr)
            
            return result.returncode == 0
            
        except Exception as e:
            print(f"❌ Error running tests: {e}")
            return False
    
    def validate_dependencies(self):
        """Validate that required dependencies are available"""
        print("🔍 Validating Dependencies...")
        
        dependencies = {
            "OpenAI Service": "http://localhost:5000/health",
            "MCP Statistical Service": "http://localhost:5201/health", 
            "MCP Neo4j Service": "http://localhost:5202/health",
            "MCP Script Execution Service": "http://localhost:5203/health"
        }
        
        all_available = True
        
        for name, url in dependencies.items():
            try:
                response = requests.get(url, timeout=5)
                if response.status_code == 200:
                    print(f"✅ {name}: Available")
                else:
                    print(f"⚠️ {name}: Responding but unhealthy (status: {response.status_code})")
                    all_available = False
            except:
                print(f"❌ {name}: Not available")
                all_available = False
        
        if all_available:
            print("✅ All dependencies are available")
        else:
            print("⚠️ Some dependencies are not available. Pipeline functionality may be limited.")
        
        return all_available
    
    def show_usage(self):
        """Show usage information"""
        print("""
LLM-MCP Pipeline Service Manager

Usage: python pipeline_service_manager.py <command>

Commands:
    start       Start the pipeline service
    stop        Stop the pipeline service
    restart     Restart the pipeline service
    status      Show service status and information
    test        Run integration tests
    validate    Validate dependencies
    help        Show this help message

Examples:
    python pipeline_service_manager.py start
    python pipeline_service_manager.py status
    python pipeline_service_manager.py test
""")

def main():
    """Main entry point"""
    manager = PipelineServiceManager()
    
    if len(sys.argv) < 2:
        manager.show_usage()
        return 1
    
    command = sys.argv[1].lower()
    
    try:
        if command == "start":
            success = manager.start_service()
            return 0 if success else 1
            
        elif command == "stop":
            success = manager.stop_service()
            return 0 if success else 1
            
        elif command == "restart":
            print("🔄 Restarting LLM-MCP Pipeline Service...")
            manager.stop_service()
            time.sleep(2)
            success = manager.start_service()
            return 0 if success else 1
            
        elif command == "status":
            success = manager.get_service_status()
            return 0 if success else 1
            
        elif command == "test":
            success = manager.test_service()
            return 0 if success else 1
            
        elif command == "validate":
            success = manager.validate_dependencies()
            return 0 if success else 1
            
        elif command in ["help", "-h", "--help"]:
            manager.show_usage()
            return 0
            
        else:
            print(f"Unknown command: {command}")
            manager.show_usage()
            return 1
            
    except KeyboardInterrupt:
        print("\n🛑 Operation cancelled by user")
        manager.stop_service()
        return 1
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1

if __name__ == "__main__":
    exit(main())
