#!/usr/bin/env python3
"""
DADM Service Restart and Testing Script
This script will restart all services and run comprehensive tests
"""

import os
import sys
import time
import json
import signal
import subprocess
import threading
from pathlib import Path
from datetime import datetime

# Add the project root to the path so we can import our modules
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# ANSI color codes for cross-platform colored output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    CYAN = '\033[96m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

# Global variables to track running processes
running_processes = []

def cleanup_processes():
    """Clean up any running processes"""
    global running_processes
    for process in running_processes:
        if process.poll() is None:  # Process is still running
            try:
                process.terminate()
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
    running_processes.clear()

def signal_handler(signum, frame):
    """Handle Ctrl+C gracefully"""
    print(f"\n{Colors.YELLOW}Received interrupt signal. Cleaning up processes...{Colors.ENDC}")
    cleanup_processes()
    sys.exit(0)

# Register signal handler
signal.signal(signal.SIGINT, signal_handler)

def write_status(message, step=None):
    """Write a status message with optional step number"""
    if step:
        print(f"\n{Colors.YELLOW}{step}. {message}...{Colors.ENDC}")
    else:
        print(f"   {Colors.GREEN}✓{Colors.ENDC} {message}")

def kill_existing_python_processes():
    """Kill existing Python processes that might be running services"""
    try:
        if os.name == 'nt':  # Windows
            subprocess.run(['taskkill', '/f', '/im', 'python.exe'], 
                         capture_output=True, check=False)
        else:  # Unix-like
            subprocess.run(['pkill', '-f', 'python.*service.py'], 
                         capture_output=True, check=False)
        write_status("Stopped existing Python processes")
    except Exception as e:
        print(f"   {Colors.YELLOW}⚠{Colors.ENDC} Could not kill existing processes: {e}")

def start_service(service_name, service_path, port=None):
    """Start a service in the background"""
    try:
        service_dir = project_root / service_path
        if not service_dir.exists():
            print(f"   {Colors.RED}✗{Colors.ENDC} Service directory not found: {service_dir}")
            return None
        
        # Start the service
        process = subprocess.Popen(
            [sys.executable, 'service.py'],
            cwd=service_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )
        
        running_processes.append(process)
        write_status(f"{service_name} starting (PID: {process.pid})")
        return process
        
    except Exception as e:
        print(f"   {Colors.RED}✗{Colors.ENDC} Failed to start {service_name}: {e}")
        return None

def test_service_discovery():
    """Test service discovery functionality"""
    write_status("Testing service discovery", "5")
    
    try:
        from config.service_registry import discover_services, get_discovered_services
        
        print("=== SERVICE DISCOVERY TEST ===")
        services = discover_services()
        total_services = sum(len(svc) for svc in services.values())
        print(f"Discovered {total_services} services across {len(services)} types")
        
        registry = get_discovered_services()
        for service_type, type_services in registry.items():
            print(f"  {service_type}: {list(type_services.keys())}")
        write_status("Service discovery working")
        return True
        
    except Exception as e:
        print(f"   {Colors.RED}✗{Colors.ENDC} Service discovery test failed: {e}")
        return False

def test_service_orchestrator():
    """Test service orchestrator functionality"""
    write_status("Testing service orchestrators", "6")
    
    try:
        from src.service_orchestrator import ServiceOrchestrator
        
        print("=== ORCHESTRATOR TEST ===")
        orch = ServiceOrchestrator()
        default_service = orch._get_default_service_name()
        print(f"Orchestrator default service: {default_service}")
        write_status("Orchestrator initialized successfully")
        return True
        
    except Exception as e:
        print(f"   {Colors.RED}✗{Colors.ENDC} Orchestrator test failed: {e}")
        return False

def test_health_endpoints():
    """Test service health endpoints"""
    write_status("Testing service health endpoints", "7")
    
    try:
        import requests
        
        print("=== HEALTH CHECK TEST ===")
        services = [
            ('OpenAI Assistant', 'http://localhost:5000/health'),
            ('Echo Service', 'http://localhost:5100/health')
        ]
        
        all_healthy = True
        for name, url in services:
            try:
                response = requests.get(url, timeout=5)
                if response.status_code == 200:
                    print(f"   {Colors.GREEN}✓{Colors.ENDC} {name}: Healthy")
                else:
                    print(f"   {Colors.YELLOW}⚠{Colors.ENDC} {name}: Status {response.status_code}")
                    all_healthy = False
            except Exception as e:
                print(f"   {Colors.RED}✗{Colors.ENDC} {name}: Not responding - {e}")
                all_healthy = False
        
        return all_healthy
        
    except ImportError:
        print(f"   {Colors.YELLOW}⚠{Colors.ENDC} requests library not available, skipping health checks")
        return False

def test_echo_service():
    """Test echo service functionality"""
    write_status("Testing echo service functionality", "8")
    
    try:
        import requests
        
        print("=== ECHO SERVICE FUNCTIONAL TEST ===")
        test_payload = {
            'task_name': 'test_task',
            'task_documentation': 'Test documentation',
            'variables': {'test_var': 'test_value'},
            'service_properties': {
                'service.type': 'test', 
                'service.name': 'dadm-echo-service'
            }
        }
        
        response = requests.post(
            'http://localhost:5100/process_task',
            json=test_payload,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            status = result.get("status", "unknown")
            print(f"   {Colors.GREEN}✓{Colors.ENDC} Echo service responded: {status}")
            return True
        else:
            print(f"   {Colors.RED}✗{Colors.ENDC} Echo service error: Status {response.status_code}")
            return False
            
    except ImportError:
        print(f"   {Colors.YELLOW}⚠{Colors.ENDC} requests library not available, skipping echo test")
        return False
    except Exception as e:
        print(f"   {Colors.RED}✗{Colors.ENDC} Echo service test failed: {e}")
        return False

def check_process_status(process, name):
    """Check if a process is still running"""
    if process and process.poll() is None:
        return f"{Colors.GREEN}Running{Colors.ENDC}"
    else:
        return f"{Colors.RED}Stopped{Colors.ENDC}"

def main():
    print(f"{Colors.GREEN}=== DADM Service Restart and Testing Workflow ==={Colors.ENDC}")
    
    # Change to project directory
    os.chdir(project_root)
    
    # Step 1: Stop existing services
    write_status("Stopping any existing services", "1")
    kill_existing_python_processes()
    time.sleep(2)
    
    # Step 2: Start OpenAI service
    write_status("Starting OpenAI Assistant Service", "2")
    openai_process = start_service("OpenAI service", "services/openai_service")
    
    # Step 3: Start Echo service
    write_status("Starting Echo Test Service", "3")
    echo_process = start_service("Echo service", "services/echo_service")
    
    # Step 4: Wait for services to initialize
    write_status("Waiting for services to initialize", "4")
    time.sleep(5)
    
    # Run tests
    test_results = {
        'service_discovery': test_service_discovery(),
        'orchestrator': test_service_orchestrator(),
        'health_checks': test_health_endpoints(),
        'echo_functionality': test_echo_service()
    }
    
    # Step 9: Show service status
    write_status("Service status", "9")
    if openai_process:
        print(f"   OpenAI Service: {check_process_status(openai_process, 'OpenAI')}")
    if echo_process:
        print(f"   Echo Service: {check_process_status(echo_process, 'Echo')}")
    
    # Summary
    print(f"\n{Colors.GREEN}=== TEST RESULTS SUMMARY ==={Colors.ENDC}")
    total_tests = len(test_results)
    passed_tests = sum(test_results.values())
    
    for test_name, result in test_results.items():
        status = f"{Colors.GREEN}PASS{Colors.ENDC}" if result else f"{Colors.RED}FAIL{Colors.ENDC}"
        print(f"   {test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\n   Overall: {passed_tests}/{total_tests} tests passed")
    
    print(f"\n{Colors.GREEN}=== NEXT STEPS ==={Colors.ENDC}")
    print("1. Check service logs if any tests failed")
    print("2. Test with Camunda if all services are healthy")
    print("3. Deploy BPMN processes: python scripts/deploy_bpmn.py")
    print("4. Monitor services: python scripts/monitor_process_execution.py")
    
    print(f"\n{Colors.CYAN}Services are running in background.{Colors.ENDC}")
    print(f"{Colors.CYAN}To stop services, press Ctrl+C or close this terminal.{Colors.ENDC}")
    
    # Keep the script running to maintain the services
    try:
        print(f"\n{Colors.YELLOW}Press Ctrl+C to stop all services and exit...{Colors.ENDC}")
        while True:
            time.sleep(1)
            # Check if any processes have died
            active_processes = [p for p in running_processes if p.poll() is None]
            if len(active_processes) < len(running_processes):
                print(f"{Colors.YELLOW}⚠ One or more services have stopped unexpectedly{Colors.ENDC}")
                break
    except KeyboardInterrupt:
        pass
    finally:
        cleanup_processes()
        print(f"\n{Colors.GREEN}All services stopped. Goodbye!{Colors.ENDC}")

if __name__ == "__main__":
    main()
