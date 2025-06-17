# DADM Cookiecutter Template Usage Guide

## Overview
This guide explains how to use the DADM cookiecutter template to quickly scaffold new microservices or complete DADM codebases that follow the established patterns and architecture.

## What is Cookiecutter?
Cookiecutter is a command-line utility that creates projects from templates. It allows you to:
- Quickly scaffold new projects with consistent structure
- Parameterize templates with variables (defined in `cookiecutter.json`)
- Maintain coding standards and architectural patterns
- Speed up development of new DADM microservices

## Current Template Configuration

The `cookiecutter.json` file defines the following variables:

```json
{
  "project_name": "dadm-microservice",      // Name of the new project
  "service_name": "api",                    // Name of the microservice
  "python_version": "3.10",                // Python version to use
  "docker_base": "python:3.10-alpine",     // Docker base image
  "description": "A microservice for the DADM project",
  "author_name": "Your Name",               // Author information
  "author_email": "your.email@example.com",
  "license": "MIT",                         // License type
  "version": "0.1.0",                       // Initial version
  "url": "https://github.com/yourusername/dadm-microservice"
}
```

## Installation and Setup

### 1. Install Cookiecutter
```bash
pip install cookiecutter
```

### 2. Use the Template
Once the template is complete, you can use it in several ways:

#### From Local Directory
```bash
cookiecutter /path/to/dadm/template
```

#### From Git Repository
```bash
cookiecutter https://github.com/yourusername/dadm-template.git
```

#### From GitLab (Internal)
```bash
cookiecutter https://gitlab.mgmt.internal/jdehart/dadm-template.git
```

## Usage Examples

### Creating a New DADM Microservice
```bash
cookiecutter /home/jdehart/dadm/

# You'll be prompted for values:
project_name [dadm-microservice]: my-analysis-service
service_name [api]: analysis
python_version [3.10]: 3.10
docker_base [python:3.10-alpine]: python:3.10-slim
description [A microservice for the DADM project]: Advanced decision analysis microservice
author_name [Your Name]: John DeHart
author_email [your.email@example.com]: jdehart@example.com
license [MIT]: MIT
version [0.1.0]: 0.1.0
url [https://github.com/yourusername/dadm-microservice]: https://gitlab.mgmt.internal/jdehart/my-analysis-service
```

### Creating Different Types of Services

#### OpenAI Integration Service
```bash
cookiecutter /home/jdehart/dadm/
# When prompted:
service_name: openai-assistant
description: OpenAI GPT-4 integration service for decision analysis
```

#### Data Analysis Service
```bash
cookiecutter /home/jdehart/dadm/
# When prompted:
service_name: data-processor
description: Data processing and analytics service
```

#### Monitoring Service
```bash
cookiecutter /home/jdehart/dadm/
# When prompted:
service_name: monitor
description: Health monitoring and service discovery
```

## Template Structure (Recommended)

To make this cookiecutter template functional, you should create the following structure:

```
dadm-template/
├── cookiecutter.json
├── {{cookiecutter.project_name}}/
│   ├── README.md
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── setup.py
│   ├── .gitignore
│   ├── .dockerignore
│   ├── src/
│   │   └── {{cookiecutter.service_name}}/
│   │       ├── __init__.py
│   │       ├── main.py
│   │       ├── config.py
│   │       └── routes.py
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_{{cookiecutter.service_name}}.py
│   ├── config/
│   │   ├── __init__.py
│   │   └── service_config.py
│   └── scripts/
│       ├── __init__.py
│       ├── setup.sh
│       └── deploy.sh
```

## Template File Examples

### README.md Template
```markdown
# {{cookiecutter.project_name}}

{{cookiecutter.description}}

## Author
{{cookiecutter.author_name}} <{{cookiecutter.author_email}}>

## Version
{{cookiecutter.version}}

## License
{{cookiecutter.license}}
```

### Dockerfile Template
```dockerfile
FROM {{cookiecutter.docker_base}}

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY src/ ./src/
COPY config/ ./config/

EXPOSE 8000

CMD ["python", "-m", "src.{{cookiecutter.service_name}}.main"]
```

### setup.py Template
```python
from setuptools import setup, find_packages

setup(
    name="{{cookiecutter.project_name}}",
    version="{{cookiecutter.version}}",
    description="{{cookiecutter.description}}",
    author="{{cookiecutter.author_name}}",
    author_email="{{cookiecutter.author_email}}",
    url="{{cookiecutter.url}}",
    packages=find_packages(),
    python_requires=">={{cookiecutter.python_version}}",
    install_requires=[
        # Add your dependencies here
    ],
)
```

## Advanced Usage

### Pre/Post Generation Hooks
You can add Python scripts to run before or after project generation:

```
hooks/
├── pre_gen_project.py
└── post_gen_project.py
```

### Conditional File Generation
Use Jinja2 conditionals in templates:
```
{% if cookiecutter.use_docker == "yes" %}
Dockerfile
docker-compose.yml
{% endif %}
```

### Multiple Choice Options
In cookiecutter.json:
```json
{
  "database_type": ["postgresql", "sqlite", "mysql"],
  "use_docker": ["yes", "no"],
  "service_type": ["api", "worker", "scheduler"]
}
```

## Integration with DADM Architecture

When using this template for DADM services, ensure they follow the established patterns:

### Service Registry Integration
```python
# In generated service
from config.service_registry import ServiceRegistry

registry = ServiceRegistry()
registry.register_service("{{cookiecutter.service_name}}")
```

### Consul Integration
```python
# Health check endpoint
@app.route('/health')
def health_check():
    return {"status": "healthy", "service": "{{cookiecutter.service_name}}"}
```

### Camunda Integration
```python
# Service task handler
@app.route('/{{cookiecutter.service_name}}/execute', methods=['POST'])
def execute_task():
    # Handle BPMN service task
    pass
```

## Best Practices

1. **Version Control**: Keep your template in version control
2. **Testing**: Test your template with different input combinations
3. **Documentation**: Document all template variables and their purposes
4. **Consistency**: Ensure generated projects follow DADM architectural patterns
5. **Updates**: Keep the template updated with the latest DADM patterns and dependencies

## Next Steps

1. Create the template directory structure
2. Add template files with proper Jinja2 templating
3. Test the template with various configurations
4. Publish to a Git repository for team access
5. Integrate with CI/CD for automated testing

This cookiecutter template will enable rapid development of new DADM microservices while maintaining consistency with the established architecture and coding standards.
