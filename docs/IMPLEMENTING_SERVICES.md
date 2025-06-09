# Creating and Integrating New Services with DADM

This guide provides detailed instructions on how to create, implement, and integrate new services with the DADM system, using the Echo Test Service as an example.

## Overview

DADM uses a microservices architecture where various services can be registered and then accessed by the service orchestrator. The service orchestrator routes tasks from the Camunda process engine to the appropriate service based on task properties.

## Service Implementation Steps

Follow these steps to create and integrate a new service:

1. **Create the service directory structure**
2. **Implement the service with required endpoints**
3. **Create Dockerfile and requirements**
4. **Register the service in the service registry**
5. **Update Camunda BPMN model to use the service**
6. **Test the service integration**

## Example: Echo Test Service

The Echo Test Service provides a simple example of how to implement and integrate a new service with DADM.

### 1. Directory Structure

Create a directory for your service in the `services` folder:

```
services/
└── echo_service/
    ├── service.py        # Main service implementation
    ├── Dockerfile        # Container definition
    ├── requirements.txt  # Python dependencies
    ├── test_service.py   # Test script
    └── README.md         # Service documentation
```

### 2. Service Implementation

Create a `service.py` file with the following key components:

#### Required Endpoints

Every DADM-compatible service should implement these endpoints:

- **Health Check** - `/health` (GET) - Provides service health status
- **Service Info** - `/info` (GET) - Provides service metadata and capabilities
- **Main Processing** - `/process` (POST) - Processes task requests

#### Input and Output Format

The main processing endpoint should accept POST requests with this structure:

```json
{
  "task_name": "string",  // Name of the task being processed
  "variables": {},        // Variables for processing
  "options": {}           // Optional processing options
}
```

And return responses with this structure:

```json
{
  "result": {
    "processed_by": "string",   // Service identifier
    "processed_at": "string",   // ISO timestamp
    "processing_time_ms": 0,    // Processing time in milliseconds
    
    // Service-specific result data
    "message": "string",
    "other_fields": "any"
  }
}
```

#### Example Implementation

See the [service.py](../services/echo_service/service.py) file for a complete example.

### 3. Dockerfile and Requirements

#### Dockerfile

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Copy requirements first for better caching
COPY services/echo_service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the service code
COPY services/echo_service/service.py .

# Expose the port
EXPOSE 5100

# Command to run the service
CMD ["python", "service.py"]
```

#### requirements.txt

List the necessary dependencies with specific versions to avoid compatibility issues:

```
flask==2.2.3
werkzeug==2.2.3  # Explicitly pin the Werkzeug version to be compatible with Flask
gunicorn==20.1.0
requests==2.28.2
```

> **Important**: When using Flask, always pin both Flask and Werkzeug to compatible versions. 
> Flask 2.2.3 requires Werkzeug 2.2.3 specifically.

### 4. Register the Service

Update the service registry in `config/service_registry.py`:

```python
SERVICE_REGISTRY = {
    # Existing services...
    
    # Add your new service
    "test": {
        "echo": {
            "endpoint": "http://localhost:5100",
            "description": "Echo test service for demonstration",
            "active": True
        }
    }
}
```

The service is identified by its type and name:
- `test` is the service type
- `echo` is the service name

### 5. Update BPMN Model

In your Camunda BPMN model, add service tasks that will use your new service:

1. Create a new Service Task in your BPMN process
2. Set the implementation type to "External" and specify a topic:
   ```xml
   <bpmn:serviceTask id="EchoTask" name="Echo Task" camunda:type="external" camunda:topic="echo_task">
   ```
3. Add the following extension properties to the task:
   ```xml
   <bpmn:extensionElements>
     <camunda:properties>
       <camunda:property name="service.type" value="test" />
       <camunda:property name="service.name" value="echo" />
     </camunda:properties>
   </bpmn:extensionElements>
   ```

This tells the service orchestrator to route this task to your echo service.

Example:
```xml
<bpmn:serviceTask id="EchoTask" name="Echo Task" camunda:type="external" camunda:topic="echo_task">
  <bpmn:extensionElements>
    <camunda:properties>
      <camunda:property name="service.type" value="test" />
      <camunda:property name="service.name" value="echo" />
    </camunda:properties>
  </bpmn:extensionElements>
</bpmn:serviceTask>
```

> **Important**: The `camunda:type="external"` and `camunda:topic="{topic_name}"` attributes are mandatory for service tasks in Camunda. Without these, the BPMN file will fail to deploy.

### 6. Run and Test the Service

#### Start the Service

Using docker-compose:

```bash
docker-compose -f docker/docker-compose.yml up -d
```

Or run it directly:

```bash
cd services/echo_service
pip install -r requirements.txt
python service.py
```

#### Test the Service

Use the provided test script:

```bash
python services/echo_service/test_service.py
```

Or use curl:

```bash
# Health check
curl http://localhost:5100/health

# Service info
curl http://localhost:5100/info

# Process a task
curl -X POST \
  http://localhost:5100/process \
  -H "Content-Type: application/json" \
  -d '{"task_name":"TestTask","variables":{"key":"value"}}'
```

## Service Orchestrator Integration

The DADM Service Orchestrator automatically handles:

1. Finding the right service for a task based on the task's properties
2. Sending the task data to the service
3. Handling timeouts and retries
4. Processing and returning results

No changes to the Service Orchestrator are needed when adding a new service - you only need to:

1. Implement the service with the standard endpoint structure
2. Register it in the service registry
3. Add the appropriate service properties to your BPMN tasks

## Advanced Topics

### Service Properties in BPMN

You can add additional properties to your BPMN tasks to control service behavior:

```
service.type: test               # Service type
service.name: echo               # Service name
service.version: 1.0             # Service version (optional)
service.timeout: 30              # Timeout in seconds (optional)
service.retries: 3               # Number of retries (optional)
```

### Adding Service Authentication

To add authentication to your service:

1. Update your service to check for authentication headers
2. Add authentication details to the service registry:

```python
"echo": {
    "endpoint": "http://localhost:5100",
    "description": "Echo test service",
    "active": True,
    "auth": {
        "type": "bearer",
        "token": "your-auth-token"
    }
}
```

The Service Orchestrator will automatically add these authentication details when calling your service.

### Service Discovery

For advanced deployments, implement a service discovery mechanism:

1. Create a central service registry service
2. Have services register themselves on startup
3. Update the Service Orchestrator to query the registry for service endpoints

## Conclusion

By following this guide and using the Echo Test Service as an example, you can create and integrate additional services with the DADM system to extend its capabilities beyond the core OpenAI functionality.

## Troubleshooting

For help with common service issues, see the [Service Troubleshooting Guide](SERVICE_TROUBLESHOOTING.md).