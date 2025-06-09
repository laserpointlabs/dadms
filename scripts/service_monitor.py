"""
DADM Service Monitor

This script runs as a service to monitor and ensure other DADM services remain available.
It provides a health endpoint for Consul discovery and can restart failed services.
"""
import os
import sys
import time
import logging
import argparse
import requests
import subprocess
import threading
from datetime import datetime
from pathlib import Path
from flask import Flask, jsonify

# Set up log directory
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
logs_dir = os.path.join(project_root, "logs", "monitors")
Path(logs_dir).mkdir(parents=True, exist_ok=True)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(logs_dir, "service_monitor.log")),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("service_monitor")

# Add project root to path
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Flask app for health endpoint
app = Flask(__name__)

# Global monitoring state
monitoring_active = False
monitoring_stats = {
    "start_time": None,
    "checks_performed": 0,
    "services_monitored": [],
    "last_check": None,
    "failed_services": [],
    "restart_attempts": 0
}

@app.route('/health', methods=['GET'])
def health():
    """Health endpoint for Consul"""
    return jsonify({
        "status": "healthy",
        "service": "dadm-monitor",
        "version": "1.0.0",
        "monitoring_active": monitoring_active,
        "uptime": time.time() - monitoring_stats["start_time"] if monitoring_stats["start_time"] else 0,
        "checks_performed": monitoring_stats["checks_performed"],
        "services_monitored": len(monitoring_stats["services_monitored"])
    }), 200

@app.route('/status', methods=['GET'])
def status():
    """Detailed status endpoint"""
    return jsonify({
        "monitoring_stats": monitoring_stats,
        "environment": {
            "docker_container": os.environ.get("DOCKER_CONTAINER", "false").lower() == "true",
            "consul_addr": os.environ.get("CONSUL_HTTP_ADDR", "localhost:8500"),
            "log_level": logging.getLevelName(logger.level)
        }
    }), 200

def discover_services_via_consul():
    """Discover services to monitor via Consul"""
    consul_addr = os.environ.get("CONSUL_HTTP_ADDR", "localhost:8500")
    if consul_addr.startswith("consul:"):
        # In Docker, we're talking to the consul container
        consul_url = f"http://{consul_addr}"
    else:
        # Local development
        consul_url = f"http://{consul_addr}"
    
    try:
        # Get all services from Consul
        response = requests.get(f"{consul_url}/v1/catalog/services", timeout=5)
        if response.status_code == 200:
            services = response.json()
            monitored_services = []
            
            for service_name in services.keys():
                if service_name == 'consul' or service_name == 'dadm-monitor':
                    continue  # Skip consul itself and our own service
                
                # Get service details
                service_response = requests.get(f"{consul_url}/v1/catalog/service/{service_name}", timeout=5)
                if service_response.status_code == 200:
                    service_details = service_response.json()
                    if service_details:
                        service_info = service_details[0]
                        address = service_info.get('ServiceAddress', service_info.get('Address'))
                        port = service_info.get('ServicePort', 80)
                        
                        # Build endpoint URL
                        endpoint = f"http://{address}:{port}"
                        monitored_services.append((service_name, endpoint))
                        
            logger.info(f"Discovered {len(monitored_services)} services via Consul")
            return monitored_services
    except Exception as e:
        logger.warning(f"Failed to discover services via Consul: {e}")
    
    return []

def discover_services_via_registry():
    """Fallback: Discover services via service registry"""
    try:
        from config import service_registry
        
        services = []
        registry = service_registry.SERVICE_REGISTRY
        
        # Check if we're in Docker - use Docker registry
        if os.environ.get("DOCKER_CONTAINER", "false").lower() == "true":
            if hasattr(service_registry, 'DOCKER_SERVICE_REGISTRY'):
                registry = service_registry.DOCKER_SERVICE_REGISTRY
        
        for service_type, service_dict in registry.items():
            for service_name, service_config in service_dict.items():
                if service_config.get("endpoint"):
                    services.append((f"{service_type}-{service_name}", service_config["endpoint"]))
                    
        logger.info(f"Discovered {len(services)} services via service registry")
        return services
    except Exception as e:
        logger.error(f"Failed to discover services via registry: {e}")
        return []

def check_service(service_name, endpoint):
    """Check if a service is available at the given endpoint"""
    try:
        # Try the health endpoint first
        health_response = requests.get(f"{endpoint}/health", timeout=10)
        if health_response.status_code == 200:
            return True, "healthy"
        
        # If health endpoint fails, try the root endpoint
        root_response = requests.get(endpoint, timeout=10)
        return root_response.status_code < 400, f"status_{root_response.status_code}"
        
    except requests.exceptions.ConnectionError:
        return False, "connection_refused"
    except requests.exceptions.Timeout:
        return False, "timeout"
    except Exception as e:
        return False, f"error_{str(e)}"

def restart_service(service_name):
    """Attempt to restart a service (Docker environment)"""
    logger.info(f"Attempting to restart service: {service_name}")
    
    if os.environ.get("DOCKER_CONTAINER", "false").lower() == "true":
        # In Docker environment, we can try to restart containers
        try:
            # Extract container name from service name
            container_name = service_name.replace("dadm-", "").replace("-service", "-service")
            if container_name == "openai-assistant":
                container_name = "openai-service"
            
            # Try to restart the container
            result = subprocess.run(
                ["docker", "restart", container_name],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                logger.info(f"Successfully restarted container: {container_name}")
                return True
            else:
                logger.error(f"Failed to restart container {container_name}: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            logger.error(f"Timeout restarting container for service: {service_name}")
            return False
        except Exception as e:
            logger.error(f"Error restarting service {service_name}: {e}")
            return False
    else:
        # Local development - try using start_services.py if available
        try:
            start_script = os.path.join(project_root, "scripts", "start_services.py")
            if os.path.exists(start_script):
                result = subprocess.run(
                    [sys.executable, start_script, "--services", service_name],
                    capture_output=True,
                    text=True,
                    timeout=60
                )
                return result.returncode == 0
        except Exception as e:
            logger.error(f"Error using start_services.py for {service_name}: {e}")
    
    return False

def monitor_services_loop(check_interval=60, specific_services=None):
    """
    Main monitoring loop
    
    Args:
        check_interval: Time between checks in seconds
        specific_services: List of specific services to monitor [(name, endpoint)]
    """
    global monitoring_active, monitoring_stats
    
    monitoring_active = True
    monitoring_stats["start_time"] = time.time()
    
    # Discover services to monitor
    if specific_services:
        services = specific_services
    else:
        # Try Consul first, fall back to service registry
        services = discover_services_via_consul()
        if not services:
            services = discover_services_via_registry()
    
    if not services:
        logger.error("No services found to monitor!")
        monitoring_active = False
        return
    
    monitoring_stats["services_monitored"] = [name for name, _ in services]
    logger.info(f"Starting service monitor for {len(services)} services")
    for service_name, endpoint in services:
        logger.info(f"Monitoring {service_name} at {endpoint}")
    
    try:
        while monitoring_active:
            check_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            logger.info(f"Performing service check at {check_time}")
            
            monitoring_stats["checks_performed"] += 1
            monitoring_stats["last_check"] = check_time
            current_failed = []
            
            for service_name, endpoint in services:
                available, status = check_service(service_name, endpoint)
                
                if available:
                    logger.info(f"Service {service_name} is available (status: {status})")
                    # Remove from failed list if it was there
                    if service_name in monitoring_stats["failed_services"]:
                        monitoring_stats["failed_services"].remove(service_name)
                        logger.info(f"Service {service_name} has recovered")
                else:
                    logger.warning(f"Service {service_name} is unavailable (status: {status})")
                    current_failed.append(service_name)
                    
                    # Only attempt restart if this is a new failure or retry
                    if service_name not in monitoring_stats["failed_services"]:
                        monitoring_stats["failed_services"].append(service_name)
                        monitoring_stats["restart_attempts"] += 1
                        
                        logger.info(f"Attempting to restart failed service: {service_name}")
                        restart_success = restart_service(service_name)
                        
                        if restart_success:
                            logger.info(f"Service {service_name} restart initiated")
                            # Give it time to start up
                            time.sleep(10)
                            
                            # Check if it's now available
                            available_after, status_after = check_service(service_name, endpoint)
                            if available_after:
                                logger.info(f"Service {service_name} is now available after restart")
                                monitoring_stats["failed_services"].remove(service_name)
                            else:
                                logger.warning(f"Service {service_name} still unavailable after restart")
                        else:
                            logger.error(f"Failed to restart service {service_name}")
            
            # Wait for the next check
            logger.info(f"Next check in {check_interval} seconds")
            time.sleep(check_interval)
            
    except KeyboardInterrupt:
        logger.info("Service monitor stopped by user")
    except Exception as e:
        logger.error(f"Service monitor error: {e}")
        raise
    finally:
        monitoring_active = False

def start_web_server(port=5200):
    """Start the Flask web server for health endpoints"""
    try:
        logger.info(f"Starting monitor web server on port {port}")
        app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False, threaded=True)
    except Exception as e:
        logger.error(f"Failed to start web server: {e}")

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Monitor and ensure DADM services are running")
    parser.add_argument("--interval", "-i", type=int, default=60, help="Check interval in seconds")
    parser.add_argument("--services", "-s", nargs="+", help="Specific services to monitor (format: name or name:endpoint)")
    parser.add_argument("--port", "-p", type=int, default=5200, help="Port for health endpoint (default: 5200)")
    parser.add_argument("--no-web-server", action="store_true", help="Don't start the web server (monitoring only)")
    args = parser.parse_args()
    
    # Parse specific services if provided
    monitored_services = None
    if args.services:
        monitored_services = []
        for service_spec in args.services:
            if ':' in service_spec:
                name, endpoint = service_spec.split(':', 1)
                monitored_services.append((name, endpoint))
            else:
                # Try to find endpoint from service registry
                try:
                    from config import service_registry
                    registry = service_registry.SERVICE_REGISTRY
                    
                    if os.environ.get("DOCKER_CONTAINER", "false").lower() == "true":
                        if hasattr(service_registry, 'DOCKER_SERVICE_REGISTRY'):
                            registry = service_registry.DOCKER_SERVICE_REGISTRY
                    
                    # Look for the service in the registry
                    found = False
                    for service_type, service_dict in registry.items():
                        for service_name, service_config in service_dict.items():
                            if service_name == service_spec or f"{service_type}-{service_name}" == service_spec:
                                if service_config.get("endpoint"):
                                    monitored_services.append((service_spec, service_config["endpoint"]))
                                    found = True
                                    break
                        if found:
                            break
                    
                    if not found:
                        logger.error(f"Could not find endpoint for service '{service_spec}'")
                        return 1
                        
                except Exception as e:
                    logger.error(f"Error looking up service '{service_spec}': {e}")
                    return 1
    
    try:
        # Start web server in a separate thread if not disabled
        if not args.no_web_server:
            web_thread = threading.Thread(target=start_web_server, args=(args.port,), daemon=True)
            web_thread.start()
            time.sleep(2)  # Give web server time to start
        
        # Start monitoring
        monitor_services_loop(args.interval, monitored_services)
        return 0
    except Exception as e:
        logger.error(f"Error in service monitor: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
