"""
Echo Test Service for DADM

This is a simple test service that demonstrates how to create and integrate a new service
with the DADM architecture. The service implements a basic echo functionality - it receives
input data and returns it back with some additional information.
"""
import os
import sys
import json
import logging
import time
from datetime import datetime
from flask import Flask, request, jsonify

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load service configuration from service_config.json
def load_service_config():
    """Load service configuration from service_config.json"""
    config_file = os.path.join(os.path.dirname(__file__), "service_config.json")
    try:
        with open(config_file, 'r') as f:
            config = json.load(f)
            return config.get('service', {})
    except Exception as e:
        logger.error(f"Error loading service config: {e}")
        return {}

# Load configuration
SERVICE_CONFIG = load_service_config()

# Service metadata from config
SERVICE_NAME = SERVICE_CONFIG.get('name', 'echo')
SERVICE_TYPE = SERVICE_CONFIG.get('type', 'test')
SERVICE_VERSION = SERVICE_CONFIG.get('version', '1.0')
SERVICE_DESCRIPTION = SERVICE_CONFIG.get('description', 'A simple echo service for testing DADM service integration')
SERVICE_PORT = SERVICE_CONFIG.get('port', 5100)

# Initialize Flask app
app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": SERVICE_NAME,
        "type": SERVICE_TYPE,
        "version": SERVICE_VERSION,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/info', methods=['GET'])
def service_info():
    """Service information endpoint"""
    return jsonify({
        "name": SERVICE_NAME,
        "type": SERVICE_TYPE,
        "version": SERVICE_VERSION,
        "description": SERVICE_DESCRIPTION,
        "endpoints": [
            {
                "path": "/health",
                "method": "GET",
                "description": "Health check endpoint"
            },
            {
                "path": "/info",
                "method": "GET",
                "description": "Service information endpoint"
            },
            {
                "path": "/process",
                "method": "POST",
                "description": "Main processing endpoint"
            }
        ]
    })

@app.route('/process', methods=['POST'])
def process_request():
    """
    Main processing endpoint - receives task data and echoes it back
    with additional information
    
    Expected input format:
    {
        "task_name": "string",  // Name of the task being processed
        "variables": {},        // Variables for processing
        "options": {}           // Optional processing options
    }
    """
    start_time = time.time()
    
    try:
        # Get the request data
        data = request.get_json() or {}
        logger.info(f"Received request: {data}")
        
        # Extract task information
        task_name = data.get("task_name", "unknown_task")
        variables = data.get("variables", {})
        options = data.get("options", {})
        
        # Create basic response structure
        response = {
            "result": {
                "processed_by": f"{SERVICE_TYPE}/{SERVICE_NAME} (v{SERVICE_VERSION})",
                "processed_at": datetime.now().isoformat(),
                "processing_time_ms": int((time.time() - start_time) * 1000),
                "task_name": task_name,
                "echo": {
                    "input_variables": variables,
                    "input_options": options
                }
            }
        }
        
        # Add custom message based on the task name
        if task_name:
            response["result"]["message"] = f"Successfully processed task: {task_name}"
        
        # Simulate some processing time (configurable via options)
        delay = options.get("delay", 0)
        if delay > 0:
            logger.info(f"Simulating processing delay of {delay} seconds")
            time.sleep(delay)
            response["result"]["simulated_delay_seconds"] = delay
        
        # Update processing time after any delay
        response["result"]["processing_time_ms"] = int((time.time() - start_time) * 1000)
        
        logger.info(f"Returning response for task {task_name}")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        return jsonify({
            "error": str(e),
            "status": "error",
            "service": f"{SERVICE_TYPE}/{SERVICE_NAME}",
            "timestamp": datetime.now().isoformat()
        }), 500

if __name__ == "__main__":
    # Get port from environment variable, service config, or use default
    port = int(os.environ.get("PORT", SERVICE_PORT))
    
    logger.info(f"Starting {SERVICE_TYPE}/{SERVICE_NAME} service on port {port}")
    app.run(host="0.0.0.0", port=port)