# How to Use the DADM Cookiecutter Template

## Quick Start Guide

### 1. Install Cookiecutter
```bash
pip install cookiecutter
```

### 2. Create a New DADM Microservice

#### From Local Template
```bash
# Navigate to where you want to create the new project
cd /path/to/your/projects

# Use the DADM cookiecutter template
cookiecutter /home/jdehart/dadm/
```

#### Interactive Prompts
When you run cookiecutter, you'll be prompted for the following values:

```
project_name [dadm-microservice]: my-new-service
service_name [api]: my-service
python_version [3.10]: 3.10
docker_base [python:3.10-alpine]: python:3.10-alpine
description [A microservice for the DADM project]: My custom DADM microservice
author_name [Your Name]: John Doe
author_email [your.email@example.com]: john.doe@company.com
license [MIT]: MIT
version [0.1.0]: 0.1.0
url [https://github.com/yourusername/dadm-microservice]: https://github.com/mycompany/my-new-service
```

### 3. What Gets Created

After running cookiecutter, you'll have a complete project structure:

```
my-new-service/
├── README.md                    # Complete documentation
├── Dockerfile                   # Docker configuration
├── requirements.txt             # Python dependencies
├── src/
│   └── my-service/
│       ├── __init__.py
│       ├── main.py             # FastAPI application
│       ├── config.py           # Configuration settings
│       ├── routes.py           # API endpoints
│       └── consul_client.py    # Service discovery
```

## Real-World Examples

### Example 1: Creating an Analysis Service
```bash
cookiecutter /home/jdehart/dadm/

# Input values:
project_name: dadm-analysis-service
service_name: analysis
description: Advanced data analysis and decision support service
author_name: Jane Smith
author_email: jane.smith@company.com
```

**Result:** Creates a service at `/analysis` endpoints that can be called from BPMN workflows.

### Example 2: Creating a Notification Service
```bash
cookiecutter /home/jdehart/dadm/

# Input values:
project_name: dadm-notification-service
service_name: notifications
description: Email and SMS notification service for decision workflows
author_name: Bob Johnson
author_email: bob.johnson@company.com
```

**Result:** Creates a notification service for sending alerts during decision processes.

### Example 3: Creating a Data Connector Service
```bash
cookiecutter /home/jdehart/dadm/

# Input values:
project_name: dadm-database-connector
service_name: database
description: Database connector service for external data sources
author_name: Alice Chen
author_email: alice.chen@company.com
```

**Result:** Creates a service for connecting to external databases and APIs.

## Generated Service Features

### 1. FastAPI Web Service
- **Health endpoints**: `/health` and `/service-name/status`
- **Service info**: `/service-name/info` with metadata
- **BPMN integration**: `/service-name/execute` for workflow tasks
- **Structured logging**: JSON logging with structlog
- **Configuration**: Environment-based configuration

### 2. Docker Ready
- **Multi-stage build**: Optimized for production
- **Security**: Non-root user, minimal base image
- **Health checks**: Built-in container health monitoring
- **Development**: Volume mounts for live code reloading

### 3. DADM Integration
- **Service discovery**: Automatic Consul registration
- **BPMN compatibility**: Ready for Camunda service tasks
- **Service orchestrator**: Compatible with DADM routing
- **Monitoring**: Health checks and status endpoints

### 4. Development Workflow
- **Testing**: pytest configuration and test structure
- **Linting**: black, isort, flake8 configuration
- **CI/CD ready**: Standard Python project structure

## Using the Generated Service

### 1. Development Setup
```bash
cd my-new-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Run the service
python -m src.my-service.main
```

### 2. Docker Development
```bash
# Build the image
docker build -t my-new-service:0.1.0 .

# Run with development settings
docker run -p 8000:8000 -e DEBUG=true my-new-service:0.1.0
```

### 3. Integration with DADM

#### Add to BPMN Workflow
```xml
<bpmn:serviceTask id="my-task" name="My Custom Task">
  <bpmn:extensionElements>
    <camunda:properties>
      <camunda:property name="service.name" value="my-service" />
      <camunda:property name="service.type" value="api" />
      <camunda:property name="service.operation" value="process" />
    </camunda:properties>
  </bpmn:extensionElements>
</bpmn:serviceTask>
```

#### Service Orchestrator Configuration
The service will automatically register with Consul and be discoverable by the DADM Service Orchestrator.

## Customizing the Generated Service

### 1. Add Business Logic
Edit `src/your-service/routes.py`:
```python
async def process_operation(parameters: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """Implement your custom business logic here"""
    # Your code here
    return {"result": "success"}
```

### 2. Add Database Integration
Update `requirements.txt`:
```
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
```

Update `config.py`:
```python
database_url: str = "postgresql://user:pass@localhost/db"
```

### 3. Add External API Calls
```python
import httpx

async def call_external_api(data):
    async with httpx.AsyncClient() as client:
        response = await client.post("https://api.example.com", json=data)
        return response.json()
```

## Advanced Usage

### 1. Multiple Services
Create multiple related services:
```bash
# Create main API service
cookiecutter /home/jdehart/dadm/
# project_name: order-management-api

# Create worker service
cookiecutter /home/jdehart/dadm/
# project_name: order-management-worker

# Create scheduler service
cookiecutter /home/jdehart/dadm/
# project_name: order-management-scheduler
```

### 2. Service Communication
Services can communicate through:
- **HTTP API calls**: Direct service-to-service communication
- **Service Orchestrator**: Route through DADM orchestrator
- **Message queues**: Add Redis/RabbitMQ for async communication

### 3. Production Deployment
```bash
# Build for production
docker build -t my-service:1.0.0 .

# Deploy with docker-compose
version: '3.8'
services:
  my-service:
    image: my-service:1.0.0
    ports:
      - "8000:8000"
    environment:
      - CONSUL_HOST=consul
      - DATABASE_URL=postgresql://...
    depends_on:
      - consul
      - database
```

## Best Practices

### 1. Service Design
- **Single responsibility**: Each service should have one clear purpose
- **API versioning**: Include version in API paths
- **Error handling**: Use structured error responses
- **Documentation**: Keep README.md updated

### 2. Configuration
- **Environment variables**: Use for all configuration
- **Secrets management**: Don't commit secrets to code
- **Configuration validation**: Use Pydantic for type checking

### 3. Testing
- **Unit tests**: Test business logic in isolation
- **Integration tests**: Test API endpoints
- **Health checks**: Ensure service monitoring works

### 4. Deployment
- **Container security**: Use non-root users, scan for vulnerabilities
- **Service discovery**: Always register with Consul
- **Monitoring**: Include logging and metrics
- **Graceful shutdown**: Handle SIGTERM properly

## Troubleshooting

### Common Issues

1. **Import errors in template files**: Normal - dependencies aren't installed in template
2. **Consul connection fails**: Check Consul is running and accessible
3. **Port conflicts**: Use different ports for multiple services
4. **Docker build fails**: Check base image and dependency versions

### Getting Help

1. **Check the generated README.md**: Contains service-specific documentation
2. **Review DADM architecture docs**: Understand how services fit together
3. **Check service logs**: Use structured logging for debugging
4. **Test health endpoints**: Verify service is running correctly

This cookiecutter template provides a complete foundation for building DADM-compatible microservices with all the necessary integration points and best practices built in.
