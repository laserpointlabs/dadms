# Service Troubleshooting Guide

This document provides solutions for common issues you might encounter when working with DADM services.

## Docker Container Issues

### Flask Dependency Errors

**Error**: `ImportError: cannot import name 'url_quote' from 'werkzeug.urls'`

**Solution**: This is a Flask and Werkzeug compatibility issue. Flask 2.2.3 requires Werkzeug 2.2.3 specifically.

1. Update your `requirements.txt` to pin the Werkzeug version:
   ```
   flask==2.2.3
   werkzeug==2.2.3
   ```

2. Rebuild your Docker container:
   ```bash   docker-compose -f docker/docker-compose.yml build --no-cache
   docker-compose -f docker/docker-compose.yml up -d
   ```

### Environment Variable Issues

**Error**: `error: argument --interval/-i: invalid int value: '${CHECK_INTERVAL:-60}'`

**Solution**: Docker Compose isn't properly evaluating the environment variable in the command.

1. Use a shell to evaluate the variable properly in docker-compose.yml:
   ```yaml
   command: sh -c "python scripts/service_monitor.py --interval $${CHECK_INTERVAL:-60}"
   ```
   
   Note the double dollar sign (`$$`) which is needed because Docker Compose does variable substitution before the shell does.

2. Alternatively, provide a hardcoded value in the Dockerfile as a fallback:
   ```Dockerfile
   CMD ["python", "scripts/service_monitor.py", "--interval", "60"]
   ```

See [Docker Environment Variables](DOCKER_ENVIRONMENT_VARS.md) for more details.

### Service Not Accessible

**Error**: Cannot connect to the service at `http://localhost:5100`

**Solutions**:
1. Ensure the container is running:
   ```bash
   docker ps | grep echo-service
   ```

2. Check container logs for errors:
   ```bash
   docker logs echo-service
   ```

3. Verify port mapping:
   ```bash
   docker-compose -f docker/docker-compose.yml config
   ```

4. If running inside a virtual machine, ensure port forwarding is configured correctly.

## Service Orchestrator Integration Issues

### Service Not Found

**Error**: `Service of type 'test' and name 'echo' not found in registry`

**Solutions**:
1. Verify the service is registered in `config/service_registry.py`
2. Check that the service entry is properly formatted and has `"active": True`
3. Ensure the service type and name in the BPMN model match the registry

### Connection Refused

**Error**: `Connection refused when connecting to http://localhost:5100/process`

**Solutions**:
1. Check if the service is running
2. Verify the endpoint in the service registry matches the actual service location
3. If using Docker Compose, try using the service name instead of localhost:
   ```python
   "endpoint": "http://echo-service:5100"
   ```

## BPMN Integration Issues

### Service Task Implementation Attributes Missing

**Error**: `One of the attributes 'class', 'delegateExpression', 'type', or 'expression' is mandatory on serviceTask.`

**Solution**: Service tasks in Camunda BPMN models require an implementation type. For external services:

1. Add the required attributes to your service tasks:
   ```xml
   <bpmn:serviceTask id="TaskName" name="Task Name" camunda:type="external" camunda:topic="topic_name">
   ```

2. For DADM services, use a topic name that matches the service function, such as:
   - `echo_task` for the Echo service
   - `openai_task` for the OpenAI service

3. Re-deploy your BPMN model after making these changes.

### Task Properties Not Applied

**Problem**: Service tasks in BPMN model are not routing to the correct service

**Solutions**:
1. Verify the extension properties are correctly set:
   ```xml
   <camunda:properties>
     <camunda:property name="service.type" value="test" />
     <camunda:property name="service.name" value="echo" />
   </camunda:properties>
   ```
2. Ensure the BPMN model has been redeployed after making changes
3. Check the orchestrator logs to see how tasks are being routed

## Input/Output Format Issues

### Incorrect Request Format

**Problem**: Service returns an error about invalid input format

**Solution**: Ensure requests to the service follow the expected format:
```json
{
  "task_name": "string",
  "variables": {},
  "options": {}
}
```

### Incorrect Response Format

**Problem**: Service orchestrator cannot parse the service response

**Solution**: Verify your service returns responses in the expected format:
```json
{
  "result": {
    "processed_by": "string",
    "processed_at": "string",
    "processing_time_ms": 0,
    // Service-specific result data
  }
}
```

## Debugging Services

To debug a service, you can:

1. Add detailed logging to your service:
   ```python
   import logging
   logging.basicConfig(level=logging.DEBUG)
   ```

2. Run the service outside of Docker for easier debugging:
   ```bash
   cd services/echo_service
   python service.py
   ```

3. Use the test script to check specific endpoints:
   ```bash
   python services/echo_service/test_service.py --endpoint health
   ```

4. Check Docker logs:
   ```bash
   docker logs echo-service --follow
   ```

5. If needed, add a simple debug endpoint to your service:
   ```python
   @app.route('/debug', methods=['GET'])
   def debug():
       """Debug endpoint"""
       return jsonify({
           "environment": dict(os.environ),
           "python_version": sys.version,
           "dependencies": {
               "flask": flask.__version__,
               "werkzeug": werkzeug.__version__
           }
       })
   ```