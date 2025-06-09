#!/usr/bin/env python3
"""
DADM Docker Service Manager
Simple management for DADM services running in Docker
"""

import subprocess
import time
import requests
import json
from datetime import datetime

class DockerServiceManager:
    def __init__(self):
        self.services = {
            'consul': {
                'container': 'dadm-consul',
                'port': 8500,
                'health_url': 'http://localhost:8500/v1/status/leader'
            },
            'camunda': {
                'container': 'dadm-camunda',
                'port': 8080,
                'health_url': 'http://localhost:8080/camunda'
            },
            'openai-service': {
                'container': 'openai-service',
                'port': 5000,
                'health_url': 'http://localhost:5000/health'
            },
            'echo-service': {
                'container': 'echo-service',
                'port': 5100,
                'health_url': 'http://localhost:5100/health'
            },
            'service-monitor': {
                'container': 'service-monitor',
                'port': None,
                'health_url': None
            }
        }

    def run_command(self, cmd):
        """Run a shell command and return the result"""
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            return result.returncode == 0, result.stdout.strip(), result.stderr.strip()
        except Exception as e:
            return False, "", str(e)

    def check_container_status(self, container_name):
        """Check if a container is running"""
        success, stdout, stderr = self.run_command(f'docker ps --filter "name={container_name}" --format "{{{{.Status}}}}"')
        if success and stdout:
            return "running" if "Up" in stdout else "stopped"
        return "not_found"

    def check_service_health(self, service_name):
        """Check service health via HTTP"""
        service = self.services.get(service_name)
        if not service or not service.get('health_url'):
            return "no_health_check"
        
        try:
            response = requests.get(service['health_url'], timeout=5)
            return "healthy" if response.status_code == 200 else f"unhealthy_{response.status_code}"
        except requests.exceptions.ConnectionError:
            return "unreachable"
        except requests.exceptions.Timeout:
            return "timeout"
        except Exception as e:
            return f"error_{str(e)}"

    def start_service(self, service_name):
        """Start a specific service"""
        if service_name not in self.services:
            return False, f"Unknown service: {service_name}"
        
        container = self.services[service_name]['container']
        print(f"🚀 Starting {service_name} ({container})...")
        
        success, stdout, stderr = self.run_command(f'docker start {container}')
        if success:
            print(f"   ✅ Started {service_name}")
            return True, "Started successfully"
        else:
            print(f"   ❌ Failed to start {service_name}: {stderr}")
            return False, stderr

    def stop_service(self, service_name):
        """Stop a specific service"""
        if service_name not in self.services:
            return False, f"Unknown service: {service_name}"
        
        container = self.services[service_name]['container']
        print(f"🛑 Stopping {service_name} ({container})...")
        
        success, stdout, stderr = self.run_command(f'docker stop {container}')
        if success:
            print(f"   ✅ Stopped {service_name}")
            return True, "Stopped successfully"
        else:
            print(f"   ❌ Failed to stop {service_name}: {stderr}")
            return False, stderr

    def restart_service(self, service_name):
        """Restart a specific service"""
        if service_name not in self.services:
            return False, f"Unknown service: {service_name}"
        
        container = self.services[service_name]['container']
        print(f"🔄 Restarting {service_name} ({container})...")
        
        success, stdout, stderr = self.run_command(f'docker restart {container}')
        if success:
            print(f"   ✅ Restarted {service_name}")
            return True, "Restarted successfully"
        else:
            print(f"   ❌ Failed to restart {service_name}: {stderr}")
            return False, stderr

    def check_all_services(self):
        """Check status of all services"""
        print("=== DADM Service Status ===")
        print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        all_healthy = True
        
        for service_name, service_info in self.services.items():
            container_status = self.check_container_status(service_info['container'])
            health_status = self.check_service_health(service_name)
            
            # Status icons
            if container_status == "running":
                container_icon = "🟢"
            elif container_status == "stopped":
                container_icon = "🔴"
            else:
                container_icon = "⚫"
            
            if health_status == "healthy":
                health_icon = "✅"
            elif health_status == "no_health_check":
                health_icon = "➖"
            else:
                health_icon = "❌"
                all_healthy = False
            
            print(f"{container_icon} {service_name:15} | Container: {container_status:10} | Health: {health_status:15} {health_icon}")
        
        print()
        if all_healthy:
            print("🎉 All services are running and healthy!")
        else:
            print("⚠️  Some services need attention")
        
        return all_healthy

    def start_all_services(self):
        """Start all services in dependency order"""
        print("🚀 Starting all DADM services...")
        
        # Start in dependency order
        order = ['consul', 'camunda', 'openai-service', 'echo-service', 'service-monitor']
        
        for service in order:
            if service in self.services:
                self.start_service(service)
                time.sleep(2)  # Brief pause between starts
        
        print("\n⏳ Waiting for services to initialize...")
        time.sleep(10)
        
        print("\n📊 Final status check:")
        return self.check_all_services()

    def stop_all_services(self):
        """Stop all services"""
        print("🛑 Stopping all DADM services...")
        
        # Stop in reverse dependency order
        order = ['service-monitor', 'echo-service', 'openai-service', 'camunda', 'consul']
        
        for service in order:
            if service in self.services:
                self.stop_service(service)
                time.sleep(1)
        
        print("\n📊 Final status check:")
        return self.check_all_services()

    def restart_all_services(self):
        """Restart all services"""
        print("🔄 Restarting all DADM services...")
        
        # Restart core services first
        core_services = ['consul', 'camunda']
        app_services = ['openai-service', 'echo-service', 'service-monitor']
        
        for service in core_services:
            if service in self.services:
                self.restart_service(service)
                time.sleep(3)
        
        for service in app_services:
            if service in self.services:
                self.restart_service(service)
                time.sleep(2)
        
        print("\n⏳ Waiting for services to initialize...")
        time.sleep(15)
        
        print("\n📊 Final status check:")
        return self.check_all_services()

def main():
    manager = DockerServiceManager()
    
    import sys
    if len(sys.argv) < 2:
        print("Usage: python docker_service_manager.py [command] [service]")
        print("\nCommands:")
        print("  check              - Check status of all services")
        print("  start [service]    - Start all services or specific service")
        print("  stop [service]     - Stop all services or specific service")
        print("  restart [service]  - Restart all services or specific service")
        print("\nServices:", ", ".join(manager.services.keys()))
        return
    
    command = sys.argv[1].lower()
    service = sys.argv[2] if len(sys.argv) > 2 else None
    
    if command == "check":
        manager.check_all_services()
    elif command == "start":
        if service:
            manager.start_service(service)
        else:
            manager.start_all_services()
    elif command == "stop":
        if service:
            manager.stop_service(service)
        else:
            manager.stop_all_services()
    elif command == "restart":
        if service:
            manager.restart_service(service)
        else:
            manager.restart_all_services()
    else:
        print(f"Unknown command: {command}")

if __name__ == "__main__":
    main()
