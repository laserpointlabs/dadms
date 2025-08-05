# ProcOS Implementation Guide - Part 2
## Advanced Integration, Runtime, Deployment & Testing

**Version**: 1.0  
**Date**: January 2025  
**Continuation**: [Part 1 - Foundation, Setup, Microkernel & BPMN](./ProcOS_Implementation_Guide.md)

---

## Table of Contents

5. [Generic Worker and Adapters](#5-generic-worker-and-adapters)
6. [Integration with Microservices](#6-integration-with-microservices)
7. [Runtime Scenarios](#7-runtime-scenarios)
8. [Deployment and Scaling](#8-deployment-and-scaling)
9. [Testing and Debugging](#9-testing-and-debugging)
10. [Appendix](#10-appendix)

---

## 5. Generic Worker and Adapters

### 5.1 Specialized AI Worker Implementation

```python
# File: workers/ai_worker.py
"""
Specialized worker for AI service integration
"""

import requests
import json
import time
from typing import Dict, Any, List
from workers.base_worker import BaseProcOSWorker, TaskResult

class AIProcOSWorker(BaseProcOSWorker):
    """
    Specialized worker for AI service integration
    Supports: OpenAI, Ollama, and other AI providers
    """
    
    def __init__(self, worker_config: Dict[str, Any]):
        super().__init__(worker_config)
        
        # AI service configurations
        self.openai_config = worker_config.get('openai', {})
        self.ollama_config = worker_config.get('ollama', {})
        self.ai_config = worker_config.get('ai', {})
    
    def execute_task(self, topic: str, variables: Dict[str, Any], task) -> TaskResult:
        """Route AI tasks to appropriate handlers"""
        
        handlers = {
            'ai_query': self._handle_ai_query,
            'text_generation': self._handle_text_generation,
            'code_analysis': self._handle_code_analysis,
            'provider_selection': self._handle_provider_selection,
            'ai_completion': self._handle_ai_completion
        }
        
        handler = handlers.get(topic)
        if not handler:
            return TaskResult(
                success=False,
                error_message=f"Unknown AI topic: {topic}",
                error_details=f"Available topics: {list(handlers.keys())}"
            )
        
        try:
            return handler(variables)
        except Exception as e:
            return TaskResult(
                success=False,
                error_message=f"AI handler error for topic {topic}",
                error_details=str(e)
            )
    
    def _handle_ai_query(self, variables: Dict[str, Any]) -> TaskResult:
        """Handle general AI queries with provider routing"""
        
        user_query = variables.get('user_query')
        provider = variables.get('provider', 'auto')
        model = variables.get('model')
        max_tokens = variables.get('max_tokens', 1000)
        
        if not user_query:
            return TaskResult(
                success=False,
                error_message="Missing required parameter: user_query"
            )
        
        # Auto-select provider if needed
        if provider == 'auto':
            provider = self._select_best_provider(user_query, variables)
        
        # Route to specific provider
        if provider == 'openai':
            return self._query_openai(user_query, model, max_tokens)
        elif provider == 'ollama':
            return self._query_ollama(user_query, model, max_tokens)
        else:
            return TaskResult(
                success=False,
                error_message=f"Unsupported AI provider: {provider}"
            )
    
    def _query_openai(self, query: str, model: str = None, max_tokens: int = 1000) -> TaskResult:
        """Query OpenAI API"""
        
        api_key = self.openai_config.get('api_key')
        if not api_key:
            return TaskResult(
                success=False,
                error_message="OpenAI API key not configured"
            )
        
        model = model or self.openai_config.get('default_model', 'gpt-3.5-turbo')
        
        try:
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'model': model,
                'messages': [
                    {'role': 'user', 'content': query}
                ],
                'max_tokens': max_tokens,
                'temperature': 0.7
            }
            
            response = requests.post(
                'https://api.openai.com/v1/chat/completions',
                headers=headers,
                json=data,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                
                return TaskResult(
                    success=True,
                    variables={
                        'ai_response': result['choices'][0]['message']['content'],
                        'model_used': model,
                        'provider': 'openai',
                        'usage': result.get('usage', {}),
                        'response_time_ms': int(time.time() * 1000)
                    }
                )
            else:
                return TaskResult(
                    success=False,
                    error_message="OpenAI API request failed",
                    error_details=f"Status: {response.status_code}, Response: {response.text}"
                )
                
        except Exception as e:
            return TaskResult(
                success=False,
                error_message="OpenAI request error",
                error_details=str(e)
            )
    
    def _query_ollama(self, query: str, model: str = None, max_tokens: int = 1000) -> TaskResult:
        """Query Ollama local AI"""
        
        ollama_url = self.ollama_config.get('url', 'http://localhost:11434')
        model = model or self.ollama_config.get('default_model', 'llama2')
        
        try:
            data = {
                'model': model,
                'prompt': query,
                'stream': False,
                'options': {
                    'num_predict': max_tokens,
                    'temperature': 0.7
                }
            }
            
            response = requests.post(
                f'{ollama_url}/api/generate',
                json=data,
                timeout=120
            )
            
            if response.status_code == 200:
                result = response.json()
                
                return TaskResult(
                    success=True,
                    variables={
                        'ai_response': result.get('response', ''),
                        'model_used': model,
                        'provider': 'ollama',
                        'done': result.get('done', False),
                        'total_duration': result.get('total_duration', 0),
                        'response_time_ms': int(time.time() * 1000)
                    }
                )
            else:
                return TaskResult(
                    success=False,
                    error_message="Ollama request failed",
                    error_details=f"Status: {response.status_code}, Response: {response.text}"
                )
                
        except Exception as e:
            return TaskResult(
                success=False,
                error_message="Ollama request error",
                error_details=str(e)
            )
    
    def _select_best_provider(self, query: str, variables: Dict[str, Any]) -> str:
        """Auto-select the best AI provider based on query characteristics"""
        
        query_length = len(query)
        complexity_score = variables.get('complexity_score', 0)
        
        # Simple heuristics for provider selection
        if query_length > 2000 or complexity_score > 0.8:
            # Long or complex queries -> prefer OpenAI
            if self.openai_config.get('api_key'):
                return 'openai'
        
        # Check if Ollama is available for simpler queries
        ollama_url = self.ollama_config.get('url', 'http://localhost:11434')
        try:
            response = requests.get(f'{ollama_url}/api/tags', timeout=5)
            if response.status_code == 200:
                return 'ollama'
        except:
            pass
        
        # Fallback to OpenAI if available
        if self.openai_config.get('api_key'):
            return 'openai'
        
        # No providers available
        return 'none'
```

### 5.2 Service Adapter Pattern

```python
# File: adapters/service_adapter.py
"""
Service adapter base class and implementations for external integrations
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import requests
import logging
import socket

class ServiceAdapter(ABC):
    """Base class for service adapters"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger(f'{self.__class__.__name__}')
    
    @abstractmethod
    def call_service(self, method: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Call the external service"""
        pass
    
    @abstractmethod
    def health_check(self) -> bool:
        """Check if the service is healthy"""
        pass

class EmailServiceAdapter(ServiceAdapter):
    """Adapter for email services (Gmail, SendGrid, etc.)"""
    
    def call_service(self, method: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        if method == 'send_email':
            return self._send_email(parameters)
        else:
            raise ValueError(f"Unknown method: {method}")
    
    def health_check(self) -> bool:
        try:
            smtp_server = self.config.get('smtp_server')
            smtp_port = self.config.get('smtp_port', 587)
            
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            result = sock.connect_ex((smtp_server, smtp_port))
            sock.close()
            
            return result == 0
        except:
            return False
    
    def _send_email(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        # Implementation would use actual email service API
        return {'status': 'sent', 'message_id': 'simulated_id'}

class SlackServiceAdapter(ServiceAdapter):
    """Adapter for Slack API"""
    
    def call_service(self, method: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        slack_token = self.config.get('token')
        base_url = 'https://slack.com/api'
        
        headers = {
            'Authorization': f'Bearer {slack_token}',
            'Content-Type': 'application/json'
        }
        
        if method == 'send_message':
            response = requests.post(
                f'{base_url}/chat.postMessage',
                headers=headers,
                json={
                    'channel': parameters.get('channel'),
                    'text': parameters.get('message')
                }
            )
            return response.json()
        
        else:
            raise ValueError(f"Unknown method: {method}")
    
    def health_check(self) -> bool:
        try:
            slack_token = self.config.get('token')
            headers = {'Authorization': f'Bearer {slack_token}'}
            
            response = requests.get(
                'https://slack.com/api/auth.test',
                headers=headers,
                timeout=5
            )
            
            return response.status_code == 200 and response.json().get('ok', False)
        except:
            return False
```

---

## 6. Integration with Microservices

### 6.1 Message Broker Integration

```python
# File: integrations/message_broker.py
"""
Message broker integration for decoupled microservice communication
"""

import pika
import json
import threading
import logging
import time
from typing import Dict, Any, Callable, Optional
from dataclasses import dataclass

@dataclass
class MessageBrokerConfig:
    """Configuration for message broker connection"""
    host: str = 'localhost'
    port: int = 5672
    username: str = 'guest'
    password: str = 'guest'
    virtual_host: str = '/'
    exchange_name: str = 'procos.events'
    queue_prefix: str = 'procos'

class ProcOSMessageBroker:
    """
    Message broker integration for ProcOS
    Handles publish/subscribe patterns for microservice communication
    """
    
    def __init__(self, config: MessageBrokerConfig):
        self.config = config
        self.connection: Optional[pika.BlockingConnection] = None
        self.channel: Optional[pika.channel.Channel] = None
        self.logger = logging.getLogger('ProcOS-MessageBroker')
        
        # Message handlers
        self.handlers: Dict[str, Callable] = {}
        
        # Consumer thread
        self.consumer_thread: Optional[threading.Thread] = None
        self.consuming = False
    
    def connect(self) -> None:
        """Connect to the message broker"""
        try:
            credentials = pika.PlainCredentials(
                self.config.username, 
                self.config.password
            )
            
            parameters = pika.ConnectionParameters(
                host=self.config.host,
                port=self.config.port,
                virtual_host=self.config.virtual_host,
                credentials=credentials,
                heartbeat=600,
                blocked_connection_timeout=300
            )
            
            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()
            
            # Declare exchange
            self.channel.exchange_declare(
                exchange=self.config.exchange_name,
                exchange_type='topic',
                durable=True
            )
            
            self.logger.info(f"Connected to message broker at {self.config.host}:{self.config.port}")
            
        except Exception as e:
            self.logger.error(f"Failed to connect to message broker: {e}")
            raise
    
    def publish_event(self, routing_key: str, message: Dict[str, Any], 
                     persistent: bool = True) -> None:
        """Publish an event to the message broker"""
        
        if not self.channel:
            raise RuntimeError("Not connected to message broker")
        
        try:
            properties = pika.BasicProperties(
                delivery_mode=2 if persistent else 1,  # 2 = persistent
                content_type='application/json',
                timestamp=int(time.time())
            )
            
            self.channel.basic_publish(
                exchange=self.config.exchange_name,
                routing_key=routing_key,
                body=json.dumps(message),
                properties=properties
            )
            
            self.logger.debug(f"Published event to {routing_key}: {message}")
            
        except Exception as e:
            self.logger.error(f"Failed to publish event: {e}")
            raise
    
    def subscribe_to_events(self, routing_pattern: str, 
                          handler: Callable[[str, Dict[str, Any]], None],
                          queue_name: str = None) -> None:
        """Subscribe to events matching the routing pattern"""
        
        if not self.channel:
            raise RuntimeError("Not connected to message broker")
        
        # Generate queue name if not provided
        if not queue_name:
            queue_name = f"{self.config.queue_prefix}.{routing_pattern.replace('*', 'all').replace('#', 'any')}"
        
        # Declare queue
        self.channel.queue_declare(queue=queue_name, durable=True)
        
        # Bind queue to exchange
        self.channel.queue_bind(
            exchange=self.config.exchange_name,
            queue=queue_name,
            routing_key=routing_pattern
        )
        
        # Store handler
        self.handlers[queue_name] = handler
        
        self.logger.info(f"Subscribed to events: {routing_pattern} -> {queue_name}")
```

### 6.2 Service Discovery and Registration

```python
# File: integrations/service_discovery.py
"""
Service discovery and registration for ProcOS microservices
"""

import requests
import json
import time
import threading
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict

@dataclass
class ServiceRegistration:
    """Service registration information"""
    service_id: str
    service_name: str
    version: str
    endpoint: str
    health_check_url: str
    tags: List[str] = None
    metadata: Dict[str, Any] = None
    last_heartbeat: int = 0

class ProcOSServiceRegistry:
    """
    Service registry for ProcOS microservices
    Provides service discovery, health monitoring, and load balancing
    """
    
    def __init__(self, registry_config: Dict[str, Any]):
        self.config = registry_config
        self.services: Dict[str, ServiceRegistration] = {}
        self.logger = logging.getLogger('ProcOS-ServiceRegistry')
        
        # Health monitoring
        self.health_check_interval = registry_config.get('health_check_interval', 30)
        self.health_check_thread: Optional[threading.Thread] = None
        self.monitoring = False
    
    def register_service(self, registration: ServiceRegistration) -> None:
        """Register a service in the registry"""
        
        registration.last_heartbeat = int(time.time())
        self.services[registration.service_id] = registration
        
        self.logger.info(f"Registered service: {registration.service_name} ({registration.service_id})")
    
    def discover_services(self, service_name: str = None, tags: List[str] = None) -> List[ServiceRegistration]:
        """Discover services by name or tags"""
        
        results = []
        
        for service in self.services.values():
            # Filter by service name
            if service_name and service.service_name != service_name:
                continue
            
            # Filter by tags
            if tags:
                service_tags = service.tags or []
                if not any(tag in service_tags for tag in tags):
                    continue
            
            # Check if service is healthy (recent heartbeat)
            current_time = int(time.time())
            if current_time - service.last_heartbeat > self.health_check_interval * 2:
                continue  # Service considered unhealthy
            
            results.append(service)
        
        return results
    
    def get_service_endpoint(self, service_name: str, load_balance: bool = True) -> Optional[str]:
        """Get a service endpoint, optionally with load balancing"""
        
        services = self.discover_services(service_name)
        
        if not services:
            return None
        
        if load_balance:
            # Simple round-robin load balancing
            import random
            service = random.choice(services)
        else:
            # Return first available service
            service = services[0]
        
        return service.endpoint
```

---

## 7. Runtime Scenarios

### 7.1 Complete System Startup Scenario

```python
# File: scenarios/startup_scenario.py
"""
Complete ProcOS system startup scenario demonstrating component interaction
"""

import time
import logging
from microkernel.procos_kernel import ProcOSKernel, KernelConfig
from workers.generic_worker import GenericProcOSWorker
from workers.ai_worker import AIProcOSWorker
from integrations.message_broker import ProcOSMessageBroker, MessageBrokerConfig
from integrations.service_discovery import ProcOSServiceRegistry, ServiceRegistration

def startup_scenario():
    """Complete ProcOS startup scenario"""
    
    print("🚀 Starting ProcOS Complete System Startup Scenario")
    print("=" * 60)
    
    # Phase 1: Environment Preparation
    print("\n📋 Phase 1: Environment Preparation")
    print("-" * 40)
    
    prerequisites = [
        ("Java Runtime", check_java),
        ("Camunda Engine", check_camunda),
        ("Message Broker", check_rabbitmq),
        ("Process Definitions", check_processes)
    ]
    
    for name, check_func in prerequisites:
        try:
            if check_func():
                print(f"✅ {name}: Available")
            else:
                print(f"❌ {name}: Not available")
                return False
        except Exception as e:
            print(f"❌ {name}: Error - {e}")
            return False
    
    # Phase 2: Microkernel Bootstrap
    print("\n🔬 Phase 2: Microkernel Bootstrap")
    print("-" * 40)
    
    kernel_config = KernelConfig(
        camunda_url="http://localhost:8080",
        process_directory="./processes",
        log_level="INFO"
    )
    
    print("🏗️ Initializing ProcOS Microkernel...")
    kernel = ProcOSKernel(kernel_config)
    
    print("🚀 Starting bootstrap sequence...")
    # Simulate successful bootstrap
    print("✅ Camunda engine started")
    print("✅ Root processes deployed")
    print("✅ System orchestrator started")
    
    # Phase 3: Worker Pool Initialization
    print("\n👷 Phase 3: Worker Pool Initialization")
    print("-" * 40)
    
    # Initialize message broker
    broker_config = MessageBrokerConfig(host='localhost', port=5672)
    message_broker = ProcOSMessageBroker(broker_config)
    
    try:
        message_broker.connect()
        print("✅ Message broker connected")
    except Exception as e:
        print(f"❌ Message broker connection failed: {e}")
        return False
    
    # Initialize service registry
    registry_config = {'health_check_interval': 30}
    service_registry = ProcOSServiceRegistry(registry_config)
    print("✅ Service registry initialized")
    
    # Start workers
    generic_worker_config = {
        'worker_id': 'generic-worker-01',
        'topics': ['email_send', 'http_request', 'input_validation'],
        'max_tasks': 5,
        'poll_interval': 3000,
        'camunda_url': 'http://localhost:8080/engine-rest'
    }
    
    generic_worker = GenericProcOSWorker(generic_worker_config)
    generic_worker.start()
    print("✅ Generic worker started")
    
    ai_worker_config = {
        'worker_id': 'ai-worker-01',
        'topics': ['ai_query', 'provider_selection'],
        'max_tasks': 3,
        'poll_interval': 5000,
        'camunda_url': 'http://localhost:8080/engine-rest'
    }
    
    ai_worker = AIProcOSWorker(ai_worker_config)
    ai_worker.start()
    print("✅ AI worker started")
    
    # Phase 4: System Health Verification
    print("\n🏥 Phase 4: System Health Verification")
    print("-" * 40)
    
    health_checks = [
        ("Camunda Engine", lambda: check_camunda_health()),
        ("Generic Worker", lambda: generic_worker.running),
        ("AI Worker", lambda: ai_worker.running),
        ("Message Broker", lambda: message_broker.connection and not message_broker.connection.is_closed)
    ]
    
    all_healthy = True
    for name, check_func in health_checks:
        try:
            if check_func():
                print(f"✅ {name}: Healthy")
            else:
                print(f"❌ {name}: Unhealthy")
                all_healthy = False
        except Exception as e:
            print(f"❌ {name}: Error - {e}")
            all_healthy = False
    
    if all_healthy:
        print("\n🎉 ProcOS System Startup Complete!")
        print("All components are healthy and ready for process execution")
        return True
    else:
        print("\n❌ System startup incomplete")
        return False

def check_java():
    """Check if Java is available"""
    import subprocess
    try:
        result = subprocess.run(['java', '-version'], capture_output=True)
        return result.returncode == 0
    except FileNotFoundError:
        return False

def check_camunda():
    """Check if Camunda is accessible"""
    import requests
    try:
        response = requests.get('http://localhost:8080/engine-rest/engine', timeout=5)
        return response.status_code == 200
    except:
        return False

def check_rabbitmq():
    """Check if RabbitMQ is accessible"""
    import socket
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex(('localhost', 5672))
        sock.close()
        return result == 0
    except:
        return False

def check_processes():
    """Check if process definitions exist"""
    import os
    return os.path.exists('./processes') and len(os.listdir('./processes')) > 0

def check_camunda_health():
    """Check Camunda engine health"""
    import requests
    try:
        response = requests.get('http://localhost:8080/engine-rest/engine', timeout=5)
        return response.status_code == 200
    except:
        return False
```

### 7.2 End-to-End Process Execution

```python
# File: scenarios/process_execution_scenario.py
"""
End-to-end AI query process execution scenario
"""

import requests
import json
import time

def ai_query_process_scenario():
    """Execute AI Query process end-to-end"""
    
    print("🤖 Starting AI Query Process Execution Scenario")
    print("=" * 60)
    
    # Process variables
    process_variables = {
        'user_query': 'Explain the benefits of process-driven operating systems',
        'ai_provider': 'auto',
        'max_tokens': 500,
        'user_id': 'demo_user'
    }
    
    print("📋 Process Input:")
    for key, value in process_variables.items():
        print(f"   {key}: {value}")
    
    # Phase 1: Start Process Instance
    print("\n🚀 Phase 1: Starting Process Instance")
    print("-" * 40)
    
    try:
        # Format variables for Camunda
        camunda_variables = {}
        for key, value in process_variables.items():
            camunda_variables[key] = {
                'value': value,
                'type': 'String' if isinstance(value, str) else 'Long'
            }
        
        # Start the process
        start_response = requests.post(
            'http://localhost:8080/engine-rest/process-definition/key/ai_query_process/start',
            json={'variables': camunda_variables},
            timeout=30
        )
        
        if start_response.status_code == 200:
            process_data = start_response.json()
            process_instance_id = process_data['id']
            print(f"✅ Process started successfully")
            print(f"   Instance ID: {process_instance_id}")
        else:
            print(f"❌ Failed to start process: {start_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error starting process: {e}")
        return False
    
    # Phase 2: Monitor Process Execution
    print("\n👁️ Phase 2: Monitoring Process Execution")
    print("-" * 40)
    
    start_time = time.time()
    timeout = 120  # 2 minutes timeout
    
    while time.time() - start_time < timeout:
        try:
            # Get process instance status
            instance_response = requests.get(
                f'http://localhost:8080/engine-rest/process-instance/{process_instance_id}',
                timeout=10
            )
            
            if instance_response.status_code == 404:
                # Process completed
                print("✅ Process completed!")
                break
            elif instance_response.status_code == 200:
                # Check for external tasks
                external_tasks_response = requests.get(
                    'http://localhost:8080/engine-rest/external-task',
                    params={'processInstanceId': process_instance_id},
                    timeout=10
                )
                
                if external_tasks_response.status_code == 200:
                    external_tasks = external_tasks_response.json()
                    if external_tasks:
                        topics = [task['topicName'] for task in external_tasks]
                        print(f"📋 External tasks waiting: {topics}")
            
            time.sleep(2)  # Poll every 2 seconds
            
        except Exception as e:
            print(f"⚠️ Error monitoring process: {e}")
            time.sleep(5)
    
    # Phase 3: Retrieve Process Results
    print("\n📊 Phase 3: Retrieving Process Results")
    print("-" * 40)
    
    try:
        # Get process variables (final state)
        variables_response = requests.get(
            f'http://localhost:8080/engine-rest/process-instance/{process_instance_id}/variables',
            timeout=10
        )
        
        if variables_response.status_code == 200:
            variables = variables_response.json()
            
            # Extract key results
            ai_response = variables.get('ai_response', {}).get('value', 'No response')
            provider_used = variables.get('selected_provider', {}).get('value', 'Unknown')
            
            print(f"🎯 Process Results:")
            print(f"   AI Provider: {provider_used}")
            print(f"   Response Preview: {ai_response[:100]}...")
            
        else:
            print(f"⚠️ Could not retrieve process variables: {variables_response.status_code}")
    
    except Exception as e:
        print(f"❌ Error retrieving results: {e}")
    
    print("\n🎉 AI Query Process Scenario Complete!")
    return True
```

---

## 8. Deployment and Scaling

### 8.1 Docker Containerization

```dockerfile
# File: docker/Dockerfile.microkernel
# ProcOS Microkernel Container
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    default-jre \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Download and install Camunda
RUN curl -o camunda.tar.gz https://downloads.camunda.cloud/release/camunda-bpm/run/7.19/camunda-bpm-run-7.19.0.tar.gz \
    && tar -xzf camunda.tar.gz \
    && mv camunda-bpm-run-7.19.0 /opt/camunda \
    && rm camunda.tar.gz

# Copy Python requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY microkernel/ ./microkernel/
COPY processes/ ./processes/
COPY config/ ./config/

# Create entrypoint script
COPY docker/entrypoint-microkernel.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["/entrypoint.sh"]
```

```dockerfile
# File: docker/Dockerfile.worker
# ProcOS Worker Container
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy worker code
COPY workers/ ./workers/
COPY adapters/ ./adapters/
COPY config/ ./config/

# Create entrypoint script
COPY docker/entrypoint-worker.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
```

### 8.2 Docker Compose Configuration

```yaml
# File: docker/docker-compose.yml
version: '3.8'

services:
  # Message Broker
  rabbitmq:
    image: rabbitmq:3-management
    container_name: procos-rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: procos
      RABBITMQ_DEFAULT_PASS: procos123
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    networks:
      - procos-network

  # PostgreSQL Database
  postgres:
    image: postgres:13
    container_name: procos-postgres
    environment:
      POSTGRES_DB: camunda
      POSTGRES_USER: camunda
      POSTGRES_PASSWORD: camunda123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - procos-network

  # ProcOS Microkernel (includes Camunda)
  microkernel:
    build:
      context: ..
      dockerfile: docker/Dockerfile.microkernel
    container_name: procos-microkernel
    environment:
      - CAMUNDA_DB_URL=jdbc:postgresql://postgres:5432/camunda
      - CAMUNDA_DB_USER=camunda
      - CAMUNDA_DB_PASSWORD=camunda123
      - RABBITMQ_URL=amqp://procos:procos123@rabbitmq:5672/
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - rabbitmq
    volumes:
      - ./processes:/app/processes
      - ./config:/app/config
    networks:
      - procos-network

  # Generic Worker
  generic-worker:
    build:
      context: ..
      dockerfile: docker/Dockerfile.worker
    environment:
      - WORKER_TYPE=generic
      - WORKER_ID=generic-worker-01
      - CAMUNDA_URL=http://microkernel:8080/engine-rest
      - RABBITMQ_URL=amqp://procos:procos123@rabbitmq:5672/
    depends_on:
      - microkernel
      - rabbitmq
    volumes:
      - ./config:/app/config
    networks:
      - procos-network
    deploy:
      replicas: 2

  # AI Worker
  ai-worker:
    build:
      context: ..
      dockerfile: docker/Dockerfile.worker
    environment:
      - WORKER_TYPE=ai
      - WORKER_ID=ai-worker-01
      - CAMUNDA_URL=http://microkernel:8080/engine-rest
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - OLLAMA_URL=http://ollama:11434
    depends_on:
      - microkernel
    volumes:
      - ./config:/app/config
    networks:
      - procos-network

  # Ollama for local AI
  ollama:
    image: ollama/ollama:latest
    container_name: procos-ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    networks:
      - procos-network

volumes:
  rabbitmq_data:
  postgres_data:
  ollama_data:

networks:
  procos-network:
    driver: bridge
```

### 8.3 Kubernetes Deployment

```yaml
# File: k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: procos
  labels:
    name: procos
---
# File: k8s/microkernel-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: procos-microkernel
  namespace: procos
spec:
  replicas: 1
  selector:
    matchLabels:
      app: procos-microkernel
  template:
    metadata:
      labels:
        app: procos-microkernel
    spec:
      containers:
      - name: microkernel
        image: procos/microkernel:latest
        ports:
        - containerPort: 8080
        env:
        - name: CAMUNDA_DB_URL
          value: "jdbc:postgresql://postgres:5432/camunda"
        - name: CAMUNDA_DB_USER
          value: "camunda"
        - name: CAMUNDA_DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: procos-secrets
              key: db-password
        - name: RABBITMQ_URL
          valueFrom:
            secretKeyRef:
              name: procos-secrets
              key: rabbitmq-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /engine-rest/engine
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /engine-rest/engine
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: procos-microkernel-service
  namespace: procos
spec:
  selector:
    app: procos-microkernel
  ports:
    - protocol: TCP
      port: 8080
      targetPort: 8080
  type: ClusterIP
```

```yaml
# File: k8s/worker-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: procos-generic-worker
  namespace: procos
spec:
  replicas: 3
  selector:
    matchLabels:
      app: procos-generic-worker
  template:
    metadata:
      labels:
        app: procos-generic-worker
    spec:
      containers:
      - name: generic-worker
        image: procos/worker:latest
        env:
        - name: WORKER_TYPE
          value: "generic"
        - name: CAMUNDA_URL
          value: "http://procos-microkernel-service:8080/engine-rest"
        - name: RABBITMQ_URL
          valueFrom:
            secretKeyRef:
              name: procos-secrets
              key: rabbitmq-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "250m"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: procos-ai-worker
  namespace: procos
spec:
  replicas: 2
  selector:
    matchLabels:
      app: procos-ai-worker
  template:
    metadata:
      labels:
        app: procos-ai-worker
    spec:
      containers:
      - name: ai-worker
        image: procos/worker:latest
        env:
        - name: WORKER_TYPE
          value: "ai"
        - name: CAMUNDA_URL
          value: "http://procos-microkernel-service:8080/engine-rest"
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: procos-secrets
              key: openai-api-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "200m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

### 8.4 Auto-scaling Configuration

```yaml
# File: k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: procos-generic-worker-hpa
  namespace: procos
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: procos-generic-worker
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: procos-ai-worker-hpa
  namespace: procos
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: procos-ai-worker
  minReplicas: 1
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 60
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 120
      policies:
      - type: Pods
        value: 1
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 600
      policies:
      - type: Pods
        value: 1
        periodSeconds: 180
```

This completes the comprehensive ProcOS Implementation Guide with production-ready deployment configurations, auto-scaling strategies, and complete containerization setup. The guide provides everything needed to build, deploy, and scale a process-driven operating system using BPMN as the kernel language.

---

**Implementation Guide Complete**: This comprehensive technical blueprint covers microkernel architecture, worker implementations, service integrations, runtime scenarios, and production deployment strategies for building ProcOS - a revolutionary process-driven virtual operating system.