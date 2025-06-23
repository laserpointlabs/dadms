#!/usr/bin/env python3
"""
Service Generator for DADM

This script helps create, copy, and manage services in the DADM ecosystem.
It provides templates and automation for service lifecycle management.
"""

import os
import sys
import json
import shutil
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import argparse

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

logger = logging.getLogger(__name__)

@dataclass
class ServiceTemplate:
    """Service template configuration"""
    name: str
    description: str
    type: str
    port: int
    dependencies: List[str]
    files: List[str]
    config_template: Dict[str, Any]

class ServiceGenerator:
    """Generate new services from templates"""
    
    def __init__(self, services_dir: Optional[str] = None):
        """Initialize the service generator"""
        if services_dir is None:
            services_dir = os.path.join(project_root, "services")
        
        self.services_dir = Path(services_dir)
        self.templates_dir = Path(__file__).parent / "templates" / "services"
        
        # Ensure templates directory exists
        self.templates_dir.mkdir(parents=True, exist_ok=True)
        
        # Load available templates
        self.templates = self._load_templates()
    
    def _load_templates(self) -> Dict[str, ServiceTemplate]:
        """Load available service templates"""
        templates = {}
        
        # Default templates
        default_templates = {
            "python-flask": ServiceTemplate(
                name="Python Flask Service",
                description="Basic Python Flask service with health checks",
                type="api",
                port=5000,
                dependencies=["flask", "flask-cors", "requests"],
                files=["service.py", "requirements.txt", "Dockerfile", "service_config.json"],
                config_template={
                    "service": {
                        "name": "{service_name}",
                        "type": "{service_type}",
                        "description": "{description}",
                        "port": "{port}",
                        "health_endpoint": "/health",
                        "version": "1.0.0"
                    }
                }
            ),
            "python-fastapi": ServiceTemplate(
                name="Python FastAPI Service",
                description="Modern Python FastAPI service with async support",
                type="api",
                port=5000,
                dependencies=["fastapi", "uvicorn", "pydantic"],
                files=["service.py", "requirements.txt", "Dockerfile", "service_config.json"],
                config_template={
                    "service": {
                        "name": "{service_name}",
                        "type": "{service_type}",
                        "description": "{description}",
                        "port": "{port}",
                        "health_endpoint": "/health",
                        "version": "1.0.0"
                    }
                }
            ),
            "node-express": ServiceTemplate(
                name="Node.js Express Service",
                description="Node.js Express service with TypeScript support",
                type="api",
                port=3000,
                dependencies=["express", "cors", "helmet"],
                files=["service.js", "package.json", "Dockerfile", "service_config.json"],
                config_template={
                    "service": {
                        "name": "{service_name}",
                        "type": "{service_type}",
                        "description": "{description}",
                        "port": "{port}",
                        "health_endpoint": "/health",
                        "version": "1.0.0"
                    }
                }
            )
        }
        
        # Load custom templates from templates directory
        for template_file in self.templates_dir.glob("*.json"):
            try:
                with open(template_file, 'r') as f:
                    template_data = json.load(f)
                    template = ServiceTemplate(**template_data)
                    templates[template_file.stem] = template
            except Exception as e:
                logger.warning(f"Failed to load template {template_file}: {e}")
        
        # Add default templates
        templates.update(default_templates)
        
        return templates
    
    def list_templates(self) -> None:
        """List available service templates"""
        print("\nAvailable Service Templates:")
        print("=" * 50)
        
        for template_id, template in self.templates.items():
            print(f"\n📦 {template.name} ({template_id})")
            print(f"   Description: {template.description}")
            print(f"   Type: {template.type}")
            print(f"   Port: {template.port}")
            print(f"   Dependencies: {', '.join(template.dependencies)}")
    
    def generate_service(self, service_name: str, service_type: str, template: str = "python-flask", 
                        description: Optional[str] = None, port: Optional[int] = None) -> str:
        """
        Generate a new service from template
        
        Args:
            service_name: Name of the new service
            service_type: Type of service (e.g., 'api', 'worker', 'assistant')
            template: Template to use
            description: Service description
            port: Service port (will use template default if not specified)
            
        Returns:
            Path to the generated service
        """
        if template not in self.templates:
            raise ValueError(f"Template '{template}' not found. Use --list-templates to see available templates.")
        
        template_config = self.templates[template]
        service_dir = self.services_dir / service_name
        
        if service_dir.exists():
            raise ValueError(f"Service directory '{service_name}' already exists.")
        
        # Create service directory
        service_dir.mkdir(parents=True, exist_ok=True)
        
        # Set default values
        if description is None:
            description = f"{service_name} service"
        if port is None:
            port = template_config.port
        
        # Generate service files
        self._generate_service_files(service_dir, template_config, service_name, service_type, description, port)
        
        # Create README
        self._create_readme(service_dir, service_name, description, template_config)
        
        # Create test file
        self._create_test_file(service_dir, service_name, template)
        
        logger.info(f"✅ Service '{service_name}' generated successfully at {service_dir}")
        return str(service_dir)
    
    def _generate_service_files(self, service_dir: Path, template: ServiceTemplate, 
                               service_name: str, service_type: str, description: str, port: int):
        """Generate service files from template"""
        
        # Generate service.py (Python Flask template)
        if template.name.startswith("Python Flask"):
            service_py_content = self._generate_flask_service(service_name, description)
            with open(service_dir / "service.py", 'w') as f:
                f.write(service_py_content)
        
        # Generate requirements.txt
        requirements_content = "\n".join(template.dependencies)
        with open(service_dir / "requirements.txt", 'w') as f:
            f.write(requirements_content)
        
        # Generate Dockerfile
        dockerfile_content = self._generate_dockerfile(template)
        with open(service_dir / "Dockerfile", 'w') as f:
            f.write(dockerfile_content)
        
        # Generate service_config.json
        config = template.config_template.copy()
        config["service"]["name"] = service_name
        config["service"]["type"] = service_type
        config["service"]["description"] = description
        config["service"]["port"] = port
        
        with open(service_dir / "service_config.json", 'w') as f:
            json.dump(config, f, indent=2)
    
    def _generate_flask_service(self, service_name: str, description: str) -> str:
        """Generate Flask service code"""
        return f'''#!/usr/bin/env python3
"""
{service_name} Service

{description}
"""

import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Service configuration
SERVICE_NAME = "{service_name}"
SERVICE_VERSION = "1.0.0"
SERVICE_PORT = int(os.environ.get('PORT', 5000))

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({{
        'status': 'healthy',
        'service': SERVICE_NAME,
        'version': SERVICE_VERSION,
        'port': SERVICE_PORT
    }})

@app.route('/info', methods=['GET'])
def service_info():
    """Service information endpoint"""
    return jsonify({{
        'name': SERVICE_NAME,
        'version': SERVICE_VERSION,
        'description': '{description}',
        'endpoints': [
            'GET /health - Health check',
            'GET /info - Service information',
            'POST /process - Process requests'
        ]
    }})

@app.route('/process', methods=['POST'])
def process_request():
    """Process incoming requests"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({{'error': 'No data provided'}}), 400
        
        # TODO: Implement your service logic here
        logger.info(f"Processing request: {{data}}")
        
        # Example response
        response = {{
            'status': 'success',
            'service': SERVICE_NAME,
            'input': data,
            'result': f"Processed by {{SERVICE_NAME}}"
        }}
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error processing request: {{e}}")
        return jsonify({{'error': str(e)}}), 500

if __name__ == '__main__':
    logger.info(f"Starting {{SERVICE_NAME}} service on port {{SERVICE_PORT}}")
    app.run(host='0.0.0.0', port=SERVICE_PORT, debug=True)
'''
    
    def _generate_dockerfile(self, template: ServiceTemplate) -> str:
        """Generate Dockerfile based on template"""
        if template.name.startswith("Python"):
            return f'''FROM python:3.10-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy service code
COPY . .

# Expose port
EXPOSE {template.port}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:{template.port}/health || exit 1

# Run the service
CMD ["python", "service.py"]
'''
        else:
            return f'''FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy service code
COPY . .

# Expose port
EXPOSE {template.port}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:{template.port}/health || exit 1

# Run the service
CMD ["node", "service.js"]
'''
    
    def _create_readme(self, service_dir: Path, service_name: str, description: str, template: ServiceTemplate):
        """Create README for the service"""
        readme_content = f'''# {service_name}

{description}

## Quick Start

### Using Docker Compose

Add this service to your `docker-compose.yml`:

```yaml
{service_name}:
  build: ./services/{service_name}
  container_name: dadm-{service_name}
  ports:
    - "{template.port}:{template.port}"
  environment:
    - PORT={template.port}
  networks:
    - dadm-network
  depends_on:
    - consul
```

### Manual Setup

1. Install dependencies:
   ```bash
   cd services/{service_name}
   pip install -r requirements.txt
   ```

2. Run the service:
   ```bash
   python service.py
   ```

3. Test the service:
   ```bash
   curl http://localhost:{template.port}/health
   ```

## API Endpoints

- `GET /health` - Health check
- `GET /info` - Service information
- `POST /process` - Process requests

## Configuration

Service configuration is stored in `service_config.json` and can be customized for your needs.

## Testing

Run the test suite:

```bash
python test_service.py
```
'''
        
        with open(service_dir / "README.md", 'w') as f:
            f.write(readme_content)
    
    def _create_test_file(self, service_dir: Path, service_name: str, template: str):
        """Create test file for the service"""
        if template.startswith("python"):
            test_content = f'''#!/usr/bin/env python3
"""
Tests for {service_name} service
"""

import unittest
import requests
import time

class Test{service_name.replace('-', '').replace('_', '').title()}Service(unittest.TestCase):
    """Test cases for {service_name} service"""
    
    def setUp(self):
        """Set up test environment"""
        self.base_url = "http://localhost:5000"
        self.service_name = "{service_name}"
    
    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = requests.get(f"{{self.base_url}}/health", timeout=5)
            self.assertEqual(response.status_code, 200)
            
            data = response.json()
            self.assertEqual(data['service'], self.service_name)
            self.assertEqual(data['status'], 'healthy')
        except requests.exceptions.ConnectionError:
            self.skipTest("Service not running")
    
    def test_service_info(self):
        """Test service info endpoint"""
        try:
            response = requests.get(f"{{self.base_url}}/info", timeout=5)
            self.assertEqual(response.status_code, 200)
            
            data = response.json()
            self.assertEqual(data['name'], self.service_name)
            self.assertIn('endpoints', data)
        except requests.exceptions.ConnectionError:
            self.skipTest("Service not running")
    
    def test_process_endpoint(self):
        """Test process endpoint"""
        try:
            test_data = {{"test": "data", "message": "Hello from test"}}
            response = requests.post(f"{{self.base_url}}/process", 
                                   json=test_data, timeout=5)
            self.assertEqual(response.status_code, 200)
            
            data = response.json()
            self.assertEqual(data['status'], 'success')
            self.assertEqual(data['service'], self.service_name)
        except requests.exceptions.ConnectionError:
            self.skipTest("Service not running")

if __name__ == '__main__':
    unittest.main()
'''
            
            with open(service_dir / "test_service.py", 'w') as f:
                f.write(test_content)
    
    def copy_service(self, source_service: str, new_service: str, 
                    modifications: Optional[Dict[str, Any]] = None) -> str:
        """
        Copy existing service with modifications
        
        Args:
            source_service: Name of source service
            new_service: Name of new service
            modifications: Dictionary of modifications to apply
            
        Returns:
            Path to the copied service
        """
        source_dir = self.services_dir / source_service
        new_dir = self.services_dir / new_service
        
        if not source_dir.exists():
            raise ValueError(f"Source service '{source_service}' not found.")
        
        if new_dir.exists():
            raise ValueError(f"Target service '{new_service}' already exists.")
        
        # Copy service directory
        shutil.copytree(source_dir, new_dir)
        
        # Apply modifications
        if modifications:
            self._apply_modifications(new_dir, modifications)
        
        # Update service configuration
        self._update_service_config(new_dir, new_service)
        
        logger.info(f"✅ Service '{source_service}' copied to '{new_service}' at {new_dir}")
        return str(new_dir)
    
    def _apply_modifications(self, service_dir: Path, modifications: Dict[str, Any]):
        """Apply modifications to copied service"""
        # Update service.py if it exists
        service_py = service_dir / "service.py"
        if service_py.exists():
            with open(service_py, 'r') as f:
                content = f.read()
            
            # Apply modifications
            for key, value in modifications.items():
                content = content.replace(f'"{key}"', f'"{value}"')
            
            with open(service_py, 'w') as f:
                f.write(content)
    
    def _update_service_config(self, service_dir: Path, service_name: str):
        """Update service configuration for new service"""
        config_file = service_dir / "service_config.json"
        if config_file.exists():
            with open(config_file, 'r') as f:
                config = json.load(f)
            
            config['service']['name'] = service_name
            
            with open(config_file, 'w') as f:
                json.dump(config, f, indent=2)

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="DADM Service Generator")
    parser.add_argument("command", choices=["generate", "copy", "list-templates"], 
                       help="Command to execute")
    parser.add_argument("--name", help="Service name")
    parser.add_argument("--type", help="Service type (api, worker, assistant, etc.)")
    parser.add_argument("--template", default="python-flask", help="Template to use")
    parser.add_argument("--description", help="Service description")
    parser.add_argument("--port", type=int, help="Service port")
    parser.add_argument("--source", help="Source service name (for copy command)")
    parser.add_argument("--modifications", help="JSON string of modifications to apply")
    
    args = parser.parse_args()
    
    generator = ServiceGenerator()
    
    if args.command == "list-templates":
        generator.list_templates()
    
    elif args.command == "generate":
        if not args.name:
            print("Error: --name is required for generate command")
            sys.exit(1)
        
        try:
            modifications = {}
            if args.modifications:
                modifications = json.loads(args.modifications)
            
            service_path = generator.generate_service(
                service_name=args.name,
                service_type=args.type or "api",
                template=args.template,
                description=args.description,
                port=args.port
            )
            print(f"Service generated at: {service_path}")
        except Exception as e:
            print(f"Error generating service: {e}")
            sys.exit(1)
    
    elif args.command == "copy":
        if not args.name or not args.source:
            print("Error: --name and --source are required for copy command")
            sys.exit(1)
        
        try:
            modifications = {}
            if args.modifications:
                modifications = json.loads(args.modifications)
            
            service_path = generator.copy_service(
                source_service=args.source,
                new_service=args.name,
                modifications=modifications
            )
            print(f"Service copied to: {service_path}")
        except Exception as e:
            print(f"Error copying service: {e}")
            sys.exit(1)

if __name__ == "__main__":
    main() 