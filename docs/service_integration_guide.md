# DADM Service Integration Guide

This guide explains how to build a microservice, register it in the DADM system, and call it correctly from BPMN models.

## 1. Creating a New Service

### 1.1. Service Directory Structure

Create a new directory for your service under the `services` directory:

```
services/
  ├── your_service_name/
  │   ├── __init__.py
  │   ├── Dockerfile
  │   ├── requirements.txt
  │   └── service.py
```

### 1.2. Service Implementation

Your service should expose REST API endpoints that the service orchestrator can call. Here's a template for a Flask-based service:

```python
# services/your_service_name/service.py
import os
import logging
from flask import Flask, request, jsonify

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "your-service-name"})

@app.route('/process_task', methods=['POST'])
def process_task():
    """Process a task using your service"""
    try:
        data = request.json or {}
        
        # Extract required parameters
        task_name = data.get('task_name')
        if not task_name:
            return jsonify({"status": "error", "message": "task_name is required"}), 400
            
        # Extract optional parameters
        variables = data.get('variables', {})
        service_properties = data.get('service_properties', {})
        
        # Process the task (implement your service logic here)
        result = process_your_task(task_name, variables, service_properties)
        
        return jsonify({
            "status": "success",
            "result": result
        })
    except Exception as e:
        logger.error(f"Error processing task: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

def process_your_task(task_name, variables, service_properties):
    """Implement your service logic here"""
    # Your service implementation
    return "Result from your service"

if __name__ == '__main__':
    # Get port from environment or use default
    port = int(os.environ.get('PORT', 5000))
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=port)
```

### 1.3. Service Requirements

Create a `requirements.txt` file with the necessary dependencies:

```
# services/your_service_name/requirements.txt
flask==3.0.1
requests==2.31.0
python-dotenv==1.0.1
# Add other dependencies specific to your service
```

### 1.4. Dockerfile

Create a Dockerfile for your service:

```dockerfile
# services/your_service_name/Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Copy main requirements first
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy and install service-specific requirements
COPY services/your_service_name/requirements.txt ./service-requirements.txt
RUN pip install --no-cache-dir -r service-requirements.txt

# Copy configuration and source code
COPY config/ /app/config/
COPY src/ /app/src/
COPY scripts/ /app/scripts/
COPY services/your_service_name/ /app/services/your_service_name/
COPY data/ /app/data/

# Set environment variables
ENV PYTHONPATH=/app
ENV FLASK_APP=services/your_service_name/service.py
ENV FLASK_ENV=production

# Expose the port the service runs on
EXPOSE 5000

# Run the service
CMD ["python", "services/your_service_name/service.py"]
```

## 2. Registering the Service

### 2.1. Update Service Registry

Add your service to the service registry in `config/service_registry.py`:

```python
# config/service_registry.py

SERVICE_REGISTRY = {
    "assistant": {
        "openai": {
            "endpoint": "http://localhost:5000",
            "description": "OpenAI Assistant for processing decision tasks"
        }
    },
    "your-service-type": {
        "your-service-name": {
            "endpoint": "http://localhost:5001",  # Use a different port
            "description": "Description of your service"
        }
    }
}

# Also update the Docker service registry
DOCKER_SERVICE_REGISTRY = {
    "assistant": {
        "openai": {
            "endpoint": "http://openai-service:5000",
            "description": "OpenAI Assistant for processing decision tasks"
        }
    },
    "your-service-type": {
        "your-service-name": {
            "endpoint": "http://your-service-container:5000",
            "description": "Description of your service"
        }
    }
}
```

### 2.2. Add Service to Docker Compose

Update `docker-compose.yaml` to include your service:

```yaml
services:
  # Existing services...
  
  your-service:
    build:
      context: .
      dockerfile: services/your_service_name/Dockerfile
    container_name: your_service_name
    restart: unless-stopped
    ports:
      - "5001:5000"  # Map to a different host port
    environment:
      - YOUR_ENV_VAR=value
      - FLASK_APP=services/your_service_name/service.py
      - FLASK_ENV=production
      - PORT=5000
    volumes:
      - ./data:/app/data
      - ./config:/app/config
    networks:
      - dadm_network
    depends_on:
      - camunda
```

## 3. Calling the Service from BPMN

### 3.1. Configure Service Task Properties

In your BPMN model, add extension properties to your service tasks to specify which service should handle them:

```xml
<bpmn:serviceTask id="YourTask" name="Your Task Name" camunda:type="external" camunda:topic="YourTaskTopic">
  <bpmn:documentation>
    Documentation for your task...
  </bpmn:documentation>
  <bpmn:extensionElements>
    <camunda:properties>
      <camunda:property name="service.type" value="your-service-type" />
      <camunda:property name="service.name" value="your-service-name" />
      <camunda:property name="service.version" value="1.0" />
      <!-- Add additional properties if needed -->
      <camunda:property name="custom.property" value="custom-value" />
    </camunda:properties>
  </bpmn:extensionElements>
  <!-- Other task elements... -->
</bpmn:serviceTask>
```

### 3.2. Service Properties

The required properties are:

- `service.type`: The type of service (e.g., "assistant", "nlp", "data-analysis")
- `service.name`: The specific service implementation name (e.g., "openai", "spacy")
- `service.version`: The version of the service to use (e.g., "1.0")

You can add additional custom properties that will be passed to the service.

### 3.3. Deploy the BPMN Model

Deploy your updated BPMN model to Camunda using the deployment script:

```
python scripts/deploy_bpmn.py camunda_models/your_model.bpmn
```

## 4. Testing

### 4.1. Start the Services

Start all services using Docker Compose:

```
docker-compose -f docker/docker-compose.yml up -d
```

### 4.2. Verify Service Health

Check if your service is running properly:

```
curl http://localhost:5001/health
```

### 4.3. Start a Process Instance

Start a process instance in Camunda that uses your service tasks.

## 5. Troubleshooting

- Check Docker logs: `docker logs your_service_name`
- Verify service registry configuration
- Check Camunda External Task Client logs for routing issues
- Ensure the service task properties in the BPMN model match the service registry

# 6. Best Practices for Service Task Processing

## 6.1. Error Handling and Retries

When processing service tasks, implement proper error handling:

- Return clear error messages to the Camunda workflow engine
- Configure appropriate retry behavior for transient errors
- Log detailed error information for troubleshooting

Example error handling in your service:

```python
@app.route('/process_task', methods=['POST'])
def process_task():
    try:
        # Process the task...
        result = process_your_task(...)
        return jsonify({"status": "success", "result": result})
    except TransientError as e:
        # For temporary errors that might resolve with a retry
        logger.warning(f"Transient error processing task: {str(e)}")
        return jsonify({
            "status": "error", 
            "message": str(e),
            "retry": True,  # Signal that the task should be retried
            "retry_delay": 5000  # Suggested retry delay in milliseconds
        }), 500
    except Exception as e:
        # For permanent errors that won't resolve with retries
        logger.error(f"Error processing task: {str(e)}")
        return jsonify({
            "status": "error", 
            "message": str(e),
            "retry": False  # Signal that the task should not be retried
        }), 500
```

## 6.2. Task Processing Acknowledgment

For long-running tasks, implement a clear acknowledgment protocol:

1. Return a task ID or reference immediately
2. Provide a status endpoint to check task progress
3. Use callbacks or polling to notify when the task is complete

This prevents duplicate processing and ensures proper task completion tracking.

## 6.3. Service Monitoring and Diagnostics

Implement monitoring endpoints in your service:

- `/health` - Basic health check
- `/metrics` - Service metrics for monitoring systems
- `/status` - Detailed status information including active tasks

Usage with the new monitoring tool:

```
python scripts/monitor_process_execution.py -p <process-instance-id> -i 3 -v
```

This will help track the execution flow and identify any issues in task processing.

## 6.4. Service Task Context Passing

When a service task depends on the output of previous tasks, make sure to:

1. Structure your input/output variables consistently
2. Use standard naming conventions for variables (e.g., `task_output`, `analysis_result`)
3. Include metadata in your task output (processing time, service version, etc.)

Example output structure:

```json
{
  "result": {
    "analysis": "...",
    "recommendation": "..."
  },
  "metadata": {
    "service_name": "your-service",
    "service_version": "1.0",
    "processing_time_ms": 1250,
    "processed_at": "2025-05-19T21:58:02.771Z"
  }
}
```
