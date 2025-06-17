# {{cookiecutter.project_name}}

{{cookiecutter.description}}

## Overview
This microservice is part of the DADM (Decision Analysis and Decision Management) platform, providing {{cookiecutter.service_name}} capabilities.

## Features
- RESTful API endpoints
- Health monitoring integration
- Consul service discovery
- Docker containerization
- BPMN service task integration

## Quick Start

### Development Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
python -m src.{{cookiecutter.service_name}}.main
```

### Docker Deployment
```bash
# Build the image
docker build -t {{cookiecutter.project_name}}:{{cookiecutter.version}} .

# Run the container
docker run -p 8000:8000 {{cookiecutter.project_name}}:{{cookiecutter.version}}
```

### Service Registration
This service automatically registers with Consul service discovery when started.

## API Endpoints

### Health Check
- **GET** `/health` - Service health status
- **GET** `/{{cookiecutter.service_name}}/status` - Detailed service status

### Service Operations
- **POST** `/{{cookiecutter.service_name}}/execute` - Execute service task (BPMN integration)
- **GET** `/{{cookiecutter.service_name}}/info` - Service information

## Configuration

Service configuration is managed through environment variables and the `config/` directory.

### Environment Variables
- `SERVICE_NAME`: Name of the service (default: {{cookiecutter.service_name}})
- `SERVICE_PORT`: Port to run the service on (default: 8000)
- `CONSUL_HOST`: Consul server host for service discovery
- `LOG_LEVEL`: Logging level (default: INFO)

## Integration with DADM

### BPMN Service Tasks
This service can be called from Camunda BPMN processes using service tasks with the following extension properties:

```xml
<camunda:properties>
  <camunda:property name="service.name" value="{{cookiecutter.service_name}}" />
  <camunda:property name="service.type" value="api" />
  <camunda:property name="service.operation" value="execute" />
</camunda:properties>
```

### Service Orchestrator
The DADM Service Orchestrator will automatically route requests to this service based on the BPMN extension properties.

## Development

### Project Structure
```
{{cookiecutter.project_name}}/
├── src/{{cookiecutter.service_name}}/     # Service implementation
├── config/                               # Configuration files
├── tests/                               # Unit and integration tests
├── scripts/                             # Deployment and utility scripts
└── docker/                              # Docker configuration
```

### Testing
```bash
# Run unit tests
pytest tests/

# Run integration tests
pytest tests/integration/
```

### Deployment
```bash
# Deploy to development
./scripts/deploy.sh dev

# Deploy to production
./scripts/deploy.sh prod
```

## Author
**{{cookiecutter.author_name}}** <{{cookiecutter.author_email}}>

## License
{{cookiecutter.license}}

## Version
{{cookiecutter.version}}

## Repository
{{cookiecutter.url}}
