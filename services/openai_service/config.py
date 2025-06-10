"""
OpenAI Service Configuration

This module contains all configuration settings for the OpenAI service,
making it fully decoupled from the main application.
"""
import os

# OpenAI API settings
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')

# Assistant configuration
ASSISTANT_NAME = os.environ.get('ASSISTANT_NAME', "DADM Decision Analysis Assistant")
ASSISTANT_MODEL = os.environ.get('ASSISTANT_MODEL', "gpt-4o")

# Use environment variable for assistant ID if available
# This ensures consistent ID usage across the application
ASSISTANT_ID = os.environ.get("OPENAI_ASSISTANT_ID")

ASSISTANT_INSTRUCTIONS = """
You are a Decision Analysis Assistant specialized in helping analyze complex decisions.

Follow these guidelines when processing tasks:
1. Carefully read and understand the context and task instructions
2. Break down complex decisions into clear components
3. Consider all stakeholders mentioned in the context
4. Think about both immediate and long-term implications
5. Consider different alternatives and their trade-offs
6. When evaluating options, explicitly state the criteria used
7. Provide structured and organized responses
8. Format your responses based on the specific instructions given for each task
9. Always provide reasoning for your recommendations
10. Be clear, concise, and objective in your analysis

Work through the decision process step-by-step, maintaining context from previous tasks
in the workflow.
"""

# Timeout settings (in seconds)
REQUEST_TIMEOUT = int(os.environ.get('REQUEST_TIMEOUT', '60'))
POLLING_INTERVAL = int(os.environ.get('POLLING_INTERVAL', '2'))
MAX_POLLING_ATTEMPTS = int(os.environ.get('MAX_POLLING_ATTEMPTS', '300'))  # 10 minutes max wait time with 2-second polling

# Thread retention settings
THREAD_TTL_DAYS = int(os.environ.get('THREAD_TTL_DAYS', '1'))  # Days to keep threads before deletion

# Database configuration for data persistence
QDRANT_HOST = os.environ.get('QDRANT_HOST', 'localhost')
QDRANT_PORT = int(os.environ.get('QDRANT_PORT', '6333'))
QDRANT_API_KEY = os.environ.get('QDRANT_API_KEY')

NEO4J_URI = os.environ.get('NEO4J_URI', 'bolt://localhost:7687')
NEO4J_USER = os.environ.get('NEO4J_USER', 'neo4j')
NEO4J_PASSWORD = os.environ.get('NEO4J_PASSWORD', 'password')

EMBEDDING_MODEL = os.environ.get('EMBEDDING_MODEL', 'all-MiniLM-L6-v2')

# Service configuration
SERVICE_HOST = os.environ.get('SERVICE_HOST', 'localhost')
SERVICE_PORT = int(os.environ.get('SERVICE_PORT', '5000'))

# Consul configuration
CONSUL_HTTP_ADDR = os.environ.get('CONSUL_HTTP_ADDR', 'http://localhost:8500')
USE_CONSUL = os.environ.get('USE_CONSUL', 'true').lower() == 'true'

# Data directory for local file storage within the service
DATA_DIR = os.environ.get('DATA_DIR', '/app/data')
LOGS_DIR = os.environ.get('LOGS_DIR', '/app/logs')

# Service metadata storage
METADATA_FILE = os.path.join(LOGS_DIR, 'service_metadata.json')
ASSISTANT_ID_FILE = os.path.join(LOGS_DIR, 'assistant_id.json')
