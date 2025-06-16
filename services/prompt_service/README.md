# DADM Prompt Service

A powerful FastAPI-based microservice for managing structured prompt templates with advanced RAG (Retrieval-Augmented Generation) integration and context compilation. This service provides comprehensive REST API endpoints for CRUD operations on prompt templates, intelligent RAG content fetching, and advanced prompt compilation with variable injection.

## 🚀 Features

- **FastAPI Backend**: Modern, fast web framework with automatic API documentation
- **REST API Endpoints**: Full CRUD operations for prompt templates
- **JSON Storage**: Simple file-based storage with in-memory caching
- **Structured Templates**: Well-defined schema with comprehensive validation
- **Version Control**: Automatic timestamping and version tracking
- **Tag Filtering**: Organize and filter prompts by multiple tags
- **Advanced RAG Integration**: 
  - Support for multiple file types: **Markdown (.md)**, **Text (.txt)**, and **CSV (.csv)**
  - Local files and remote sources (GitHub, web URLs)
  - Intelligent content processing based on file type
  - Smart CSV formatting with tabular display and row limits
  - Intelligent caching with configurable TTL
  - Automatic content validation and error handling
  - Mixed source types (local + remote) in single templates
- **Context Compilation**: 
  - Variable injection with template processing
  - RAG content integration with flexible injection styles
  - Token estimation and efficiency metrics
  - Comprehensive compilation metadata
- **Consul Registration**: Automatic service discovery integration
- **Swagger UI**: Interactive API documentation at `/docs`
- **Health Monitoring**: Comprehensive health checks and service info

## 📋 API Endpoints

| Method | Endpoint | Description | Purpose |
|--------|----------|-------------|---------|
| **Core Operations** | | | |
| GET | `/health` | Health check endpoint | Service monitoring |
| GET | `/info` | Service information | Version and config details |
| **Prompt Management** | | | |
| GET | `/prompts` | List all prompt templates | Browse available templates |
| GET | `/prompts?tags=engineering,review` | Filter prompts by tags | Find specific template types |
| GET | `/prompt/{id}` | Get specific prompt template | Retrieve template details |
| POST | `/prompt` | Create new prompt template | Add new templates |
| PUT | `/prompt/{id}` | Update existing prompt template | Modify existing templates |
| **RAG Operations** | | | |
| GET | `/prompt/{id}/rag-content` | Get RAG content for prompt | Preview RAG sources |
| POST | `/rag/validate` | Validate RAG sources | Check source accessibility |
| GET | `/rag/cache/info` | Get RAG cache information | Monitor cache usage |
| DELETE | `/rag/cache/clear` | Clear RAG cache | Maintenance operations |
| **Advanced Compilation** | | | |
| POST | `/prompt/{id}/compile` | Compile prompt with variables and RAG | Generate ready-to-use prompts |

## 📊 Prompt Template Structure

```json
{
  "id": "engineering_review",
  "description": "Enhanced template for engineering review with regulatory compliance",
  "template": "You are an expert engineer reviewing: {input}. Focus on {criteria}. Consider the following aspects: technical feasibility, scalability, maintainability, and security implications.",
  "tags": ["engineering", "review", "technical", "compliance"],
  "rag_sources": [
    "/docs/regulations/faa.md",
    "/docs/engineering_standards.md", 
    "https://raw.githubusercontent.com/laserpointlabs/scripts/refs/heads/main/disaster_response_requirements.md"
  ],
  "version": "1.0",
  "created_at": "2025-06-16T00:00:00",
  "updated_at": "2025-06-16T08:52:17.542522",
  "metadata": {
    "author": "DADM System",
    "category": "technical_review",
    "compliance_level": "enterprise"
  }
}
```

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8+
- pip package manager
- (Optional) Consul service for service discovery

### Quick Start

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Configure service (optional):**
Edit `service_config.json` to change port or Consul settings:
```json
{
  "service_name": "dadm-prompt-service",
  "port": 5301,
  "consul_url": "http://localhost:8500",
  "enable_consul": true
}
```

3. **Initialize prompts storage:**
The service will create `prompts.json` automatically, or you can pre-populate it with your templates.

4. **Start the service:**
```bash
python main.py
```

### Running Options

#### Standalone Mode
```bash
python main.py
```

#### Custom Port
```bash
PORT=5301 python main.py
```

#### Development Mode (with auto-reload)
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 5301
```

#### Production Mode (with multiple workers)
```bash
uvicorn main:app --host 0.0.0.0 --port 5301 --workers 4
```

#### Docker Mode
```bash
docker build -t dadm-prompt-service .
docker run -p 5301:5301 -v $(pwd)/prompts.json:/app/prompts.json dadm-prompt-service
```

#### Docker Compose (DADM Stack)
To run as part of the complete DADM stack:

```bash
# From the DADM root directory
cd docker
docker-compose up -d prompt-service

# Or start the entire stack including prompt service
docker-compose up -d
```

The service will be available at `http://localhost:5301` and automatically registers with Consul.

**Stack Integration Features:**
- Automatic service discovery via Consul
- Persistent data volume for prompts.json
- Cached RAG content storage
- Integrated logging with the DADM stack
- Health monitoring and automatic restart

### Verification

Once running, verify the service is working:

1. **Health Check:**
```bash
curl http://localhost:5301/health
```

2. **API Documentation:**
Visit `http://localhost:5301/docs` for interactive Swagger UI

3. **Service Info:**
```bash
curl http://localhost:5301/info
```

## 🔧 Configuration

### Environment Variables
- `PORT`: Service port (default: 5301)
- `CONSUL_URL`: Consul service URL (default: http://localhost:8500)
- `PROMPTS_FILE`: Path to prompts JSON file (default: prompts.json)
- `RAG_CACHE_DIR`: RAG cache directory (default: rag_cache)
- `LOG_LEVEL`: Logging level (default: INFO)

### Service Configuration File
Edit `service_config.json`:
```json
{
  "service_name": "dadm-prompt-service",
  "port": 5301,
  "consul_url": "http://localhost:8500",
  "enable_consul": true,
  "rag_cache_ttl": 3600,
  "max_rag_content_size": 1048576,
  "enable_cors": true,
  "cors_origins": ["*"]
}
```

## Validation

Use the included validation script to check prompt template format:

```bash
# Validate default prompts.json
python validate_prompts.py

# Validate specific file
python validate_prompts.py /path/to/prompts.json

# Verbose output
python validate_prompts.py --verbose
```

## Configuration

### Service Configuration
Edit `service_config.json`:
```json
{
  "service": {
    "name": "dadm-prompt-service",
    "type": "prompt",
    "port": 5301,
    "version": "1.0.0",
    "health_endpoint": "/health",
    "description": "DADM Prompt Template Service"
  }
}
```

### Environment Variables
- `PORT`: Service port (default: 5301)
- `CONSUL_HTTP_ADDR`: Consul server address for service registration
- `SERVICE_HOST`: Service hostname for registration
- `DOCKER_CONTAINER`: Set to "true" when running in Docker

## API Examples

### List all prompts
```bash
curl -X GET "http://localhost:5301/prompts"
```

### Get specific prompt
```bash
curl -X GET "http://localhost:5301/prompt/engineering_review"
```

### Filter prompts by tags
```bash
curl -X GET "http://localhost:5301/prompts?tags=engineering,review"
```

### Create new prompt
```bash
curl -X POST "http://localhost:5301/prompt" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "code_review",
    "description": "Template for code review analysis",
    "template": "Review the following code: {code}. Check for: {criteria}",
    "tags": ["code", "review", "development"],
    "version": "1.0"
  }'
```

### Update existing prompt
```bash
curl -X PUT "http://localhost:5301/prompt/code_review" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Enhanced template for comprehensive code review",
    "tags": ["code", "review", "development", "quality"]
  }'
```

### Get RAG content for a prompt
```bash
curl -X GET "http://localhost:5301/prompt/disaster_response/rag-content"
```

### Validate RAG sources
```bash
curl -X POST "http://localhost:5301/rag/validate" \
  -H "Content-Type: application/json" \
  -d '[{
    "url": "https://raw.githubusercontent.com/owner/repo/main/file.md",
    "type": "github",
    "description": "Example GitHub source"
  }]'
```

### Get RAG cache information
```bash
curl -X GET "http://localhost:5301/rag/cache/info"
```

### Clear RAG cache
```bash
# Clear all cache
curl -X DELETE "http://localhost:5301/rag/cache/clear"

# Clear specific URL
curl -X DELETE "http://localhost:5301/rag/cache/clear?url=https://example.com/file.md"
```

## Enhanced RAG Support

The service now supports **remote RAG resources** from version-controlled sources like GitHub, providing powerful capabilities for dynamic content integration:

### Remote RAG Sources
- **GitHub Integration**: Direct access to files in public GitHub repositories
- **Version Control**: RAG sources are tracked in git with proper versioning  
- **Dynamic Updates**: Resources can be updated without service restart
- **Centralized Management**: All RAG resources in a single repository
- **Caching**: Intelligent caching system to improve performance and reduce API calls

### RAG Source Types
```json
{
  "rag_sources": [
    "/docs/local_file.md",  // Local file path
    "https://raw.githubusercontent.com/owner/repo/branch/file.md",  // Public GitHub file
    "https://example.com/document.md"  // Any public HTTP/HTTPS URL
  ]
}
```

### RAG Source Object Format
```json
{
  "url": "https://raw.githubusercontent.com/owner/repo/branch/file.md",
  "description": "Optional description of the source",
  "type": "github"  // auto-detected: local, remote, github
}
```

## Integration with DADM

The prompt service automatically registers with Consul for service discovery. Other DADM services can discover and use the prompt service through the service registry.

### Service Discovery
```python
from config.service_registry import find_service_by_type

prompt_service = find_service_by_type('prompt')
if prompt_service:
    endpoint = prompt_service['endpoint']
    # Use the endpoint to make API calls
```

## Development

### Project Structure
```
prompt_service/
├── main.py                 # FastAPI application
├── models.py              # Pydantic models
├── consul_registry.py     # Consul registration
├── validate_prompts.py    # Validation script
├── service_config.json    # Service configuration
├── requirements.txt       # Dependencies
├── prompts.json          # Prompt templates storage
└── README.md             # This file
```

### Adding New Features
1. Update models in `models.py` for new data structures
2. Add new endpoints in `main.py`
3. Update validation logic in `validate_prompts.py` if needed
4. Run validation to ensure data integrity

## Monitoring

- Health check: `GET /health`
- Service info: `GET /info`
- Logs are written to stdout with structured format
- Consul health checks monitor service availability

## Security Considerations

- Currently no authentication (as per specification)
- File system access for JSON storage
- Consider adding authentication for production use
- Validate input data to prevent injection attacks

## Future Enhancements

- Authentication and authorization
- Database backend for better scalability
- Git-based versioning integration
- Prompt variant management (v1, v2, etc.)
- Advanced search and filtering
- Prompt template inheritance
- Execution history and analytics

## 📚 Detailed Usage Examples

### Basic Operations

#### 1. Health Check
Check if the service is running and healthy:

```bash
curl http://localhost:5301/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "dadm-prompt-service",
  "version": "1.0.0",
  "timestamp": "2025-06-16T09:34:13.935896"
}
```

#### 2. List All Prompts
Get all available prompt templates:

```bash
curl http://localhost:5301/prompts
```

**Response:**
```json
{
  "prompts": [
    {
      "id": "engineering_review",
      "description": "Enhanced template for engineering review",
      "template": "You are an expert engineer reviewing: {input}. Focus on {criteria}...",
      "tags": ["engineering", "review", "technical"],
      "rag_sources": ["/docs/regulations/faa.md", "https://raw.githubusercontent.com/..."],
      "version": "1.0",
      "created_at": "2025-06-16T00:00:00",
      "updated_at": "2025-06-16T08:52:17.542522",
      "metadata": {"author": "DADM System", "category": "technical_review"}
    }
  ],
  "count": 5,
  "status": "success"
}
```

#### 3. Filter Prompts by Tags
Find specific types of prompts using tag filtering:

```bash
curl "http://localhost:5301/prompts?tags=engineering,technical"
```

This returns only prompts that have both "engineering" AND "technical" tags.

#### 4. Get Specific Prompt
Retrieve details for a specific prompt template:

```bash
curl http://localhost:5301/prompt/engineering_review
```

### Creating and Updating Prompts

#### 5. Create a New Prompt
Add a new prompt template to the service:

```bash
curl -X POST http://localhost:5301/prompt \
  -H "Content-Type: application/json" \
  -d '{
    "id": "code_review",
    "description": "Template for reviewing code quality and best practices",
    "template": "You are a senior software engineer reviewing the following code: {code}. Focus on: {review_criteria}. Provide specific recommendations for: {improvement_areas}.",
    "tags": ["code", "review", "quality", "engineering"],
    "rag_sources": [
      "/docs/coding_standards.md",
      "https://raw.githubusercontent.com/company/standards/main/code_quality_guide.md"
    ],
    "metadata": {
      "author": "Development Team",
      "category": "code_quality",
      "skill_level": "intermediate"
    }
  }'
```

**Response:**
```json
{
  "id": "code_review",
  "message": "Prompt template created successfully",
  "status": "success"
}
```

#### 6. Update Existing Prompt
Modify an existing prompt template:

```bash
curl -X PUT http://localhost:5301/prompt/code_review \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Enhanced template for comprehensive code review",
    "template": "You are a senior software engineer and security expert reviewing: {code}. Focus on: {review_criteria}. Additionally, evaluate: security vulnerabilities, performance implications, and maintainability. Provide specific recommendations for: {improvement_areas}.",
    "tags": ["code", "review", "security", "performance", "engineering"],
    "rag_sources": [
      "/docs/coding_standards.md",
      "/docs/security_guidelines.md",
      "https://raw.githubusercontent.com/company/standards/main/code_quality_guide.md"
    ],
    "metadata": {
      "author": "Security Team",
      "category": "code_quality_security",
      "skill_level": "advanced",
      "last_reviewed": "2025-06-16"
    }
  }'
```

### RAG Content Operations

#### 7. Preview RAG Content
See what content will be included from RAG sources:

```bash
curl http://localhost:5301/prompt/engineering_review/rag-content
```

**Response:**
```json
{
  "prompt_id": "engineering_review",
  "rag_contents": [
    {
      "source": "/docs/regulations/faa.md",
      "status": "error",
      "error": "Local file not found: /docs/regulations/faa.md"
    },
    {
      "source": "https://raw.githubusercontent.com/laserpointlabs/scripts/refs/heads/main/disaster_response_requirements.md",
      "status": "success",
      "content": "# Disaster Response UAS Requirements\n\n## Operational Requirements...",
      "size_chars": 3842,
      "estimated_tokens": 960
    }
  ],
  "total_sources": 3,
  "successful_fetches": 1,
  "total_characters": 3842,
  "estimated_total_tokens": 960
}
```

#### 8. Validate RAG Sources
Check if RAG sources are accessible before using them:

```bash
curl -X POST http://localhost:5301/rag/validate \
  -H "Content-Type: application/json" \
  -d '{
    "sources": [
      "/docs/local_file.md",
      "https://raw.githubusercontent.com/user/repo/main/document.md",
      "https://invalid-url.com/missing.md"
    ]
  }'
```

**Response:**
```json
{
  "validation_results": [
    {
      "source": "/docs/local_file.md",
      "status": "error",
      "accessible": false,
      "error": "Local file not found"
    },
    {
      "source": "https://raw.githubusercontent.com/user/repo/main/document.md",
      "status": "success", 
      "accessible": true,
      "size_chars": 1500,
      "estimated_tokens": 375
    },
    {
      "source": "https://invalid-url.com/missing.md",
      "status": "error",
      "accessible": false,
      "error": "HTTP 404 Not Found"
    }
  ],
  "summary": {
    "total_sources": 3,
    "accessible": 1,
    "inaccessible": 2,
    "validation_time": "2025-06-16T09:45:00"
  }
}
```

### Testing Remote File Support

The prompt service includes comprehensive support for remote files from GitHub and other web sources. Here are examples using the test data uploaded to GitHub:

#### Test Remote .txt and .csv Files
The service includes a special test prompt that demonstrates both local and remote file integration:

```bash
# Get the remote files test prompt
curl http://localhost:5301/prompt/remote_files_test
```

#### Fetch RAG Content from Mixed Sources
This demonstrates fetching content from both local and remote sources:

```bash
curl http://localhost:5301/prompt/remote_files_test/rag-content
```

**Expected Response Structure:**
```json
{
  "prompt_id": "remote_files_test",
  "rag_sources": [
    {
      "url": "https://raw.githubusercontent.com/laserpointlabs/scripts/refs/heads/main/project_requirements.txt",
      "description": "Remote project requirements from GitHub",
      "type": "github"
    },
    {
      "url": "https://raw.githubusercontent.com/laserpointlabs/scripts/refs/heads/main/sample_data.csv", 
      "description": "Remote sample data from GitHub",
      "type": "github"
    },
    {
      "url": "/app/services/prompt_service/test_data/project_requirements.txt",
      "description": "Local project requirements", 
      "type": "local"
    },
    {
      "url": "/app/services/prompt_service/test_data/sample_data.csv",
      "description": "Local sample data",
      "type": "local"
    }
  ],
  "rag_contents": {
    "https://raw.githubusercontent.com/laserpointlabs/scripts/refs/heads/main/project_requirements.txt": "Project Requirements Document\n============================\n...",
    "https://raw.githubusercontent.com/laserpointlabs/scripts/refs/heads/main/sample_data.csv": "## CSV Data\n\n### Headers:\nname | age | department | salary | location\n--- | --- | --- | --- | ---\n...",
    "/app/services/prompt_service/test_data/project_requirements.txt": "Project Requirements Document\n============================\n...",
    "/app/services/prompt_service/test_data/sample_data.csv": "## CSV Data\n\n### Headers:\nname | age | department | salary | location\n--- | --- | --- | --- | ---\n..."
  },
  "cache_used": true
}
```

#### Compile Prompt with Mixed Sources
Test the complete workflow with both local and remote RAG sources:

```bash
curl -X POST http://localhost:5301/prompt/remote_files_test/compile \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "project_scope": "AI Customer Service System",
      "analysis_type": "resource allocation and technical requirements"
    },
    "inject_rag": true,
    "rag_injection_style": "context"
  }'
```

**Key Features Demonstrated:**
- ✅ **Remote .txt files** from GitHub with full content processing
- ✅ **Remote .csv files** converted to markdown tables 
- ✅ **Mixed local and remote sources** in the same prompt
- ✅ **Intelligent caching** for performance optimization
- ✅ **Error handling** for inaccessible remote sources
- ✅ **Content validation** and size limits

### Advanced Compilation Examples

#### 9. Basic Prompt Compilation
Compile a prompt with variable injection and RAG content:

```bash
curl -X POST http://localhost:5301/prompt/engineering_review/compile \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "input": "AI-powered recommendation system for e-commerce",
      "criteria": "scalability, real-time performance, and user privacy"
    },
    "include_rag": true,
    "rag_injection_style": "context",
    "max_tokens": 4000
  }'
```

**Response:**
```json
{
  "compiled_prompt": {
    "prompt_id": "engineering_review",
    "compiled_prompt": "You are an expert engineer reviewing: AI-powered recommendation system for e-commerce. Focus on scalability, real-time performance, and user privacy. Consider the following aspects: technical feasibility, scalability, maintainability, and security implications.\n\n## Context Documents\n\n### Disaster Response UAS Requirements\n[RAG content included here...]",
    "template_used": "You are an expert engineer reviewing: {input}. Focus on {criteria}...",
    "variables_applied": {
      "input": "AI-powered recommendation system for e-commerce",
      "criteria": "scalability, real-time performance, and user privacy"
    },
    "rag_content_included": true,
    "rag_sources_used": [
      {
        "url": "https://raw.githubusercontent.com/laserpointlabs/scripts/refs/heads/main/disaster_response_requirements.md",
        "description": "Auto-detected github source",
        "type": "github"
      }
    ],
    "token_info": {
      "estimated_tokens": 1141,
      "character_count": 4565,
      "token_efficiency": 4.000876424189308
    },
    "compilation_metadata": {
      "compilation_time_seconds": 0.125,
      "rag_injection_style": "context",
      "include_metadata": true,
      "total_tokens": 1141,
      "prompt_tokens": 45,
      "rag_tokens": 960,
      "variable_tokens": 136,
      "warnings": ["Failed to fetch 2 RAG sources"],
      "missing_variables": [],
      "total_rag_sources": 3,
      "successful_rag_sources": 1,
      "compiled_at": "2025-06-16T09:37:17.026290"
    }
  },
  "status": "success",
  "message": "Successfully compiled prompt 'engineering_review'",
  "warnings": [
    "Failed to fetch 2 RAG sources: /docs/regulations/faa.md, /docs/engineering_standards.md",
    "RAG content auto-injected at beginning of prompt (no placeholder found)"
  ]
}
```

#### 10. Compilation with Inline RAG Style
Use "inline" style to inject RAG content directly into the template:

```bash
curl -X POST http://localhost:5301/prompt/disaster_response/compile \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "scenario": "Wildfire evacuation in residential area",
      "focus_areas": "evacuation routes, resource allocation, communication protocols"
    },
    "include_rag": true,
    "rag_injection_style": "inline",
    "max_tokens": 6000,
    "include_metadata": true
  }'
```

#### 11. Compilation without RAG Content
Sometimes you want just variable injection without RAG content:

```bash
curl -X POST http://localhost:5301/prompt/system_design/compile \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "requirements": "High-throughput data processing pipeline",
      "constraints": "cloud-native, cost-effective, handles 1M records/hour"
    },
    "include_rag": false,
    "max_tokens": 2000
  }'
```

### Edge Cases and Error Handling

#### 12. Missing Required Variables
What happens when you don't provide all required template variables:

```bash
curl -X POST http://localhost:5301/prompt/engineering_review/compile \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "input": "Machine learning model"
    },
    "include_rag": true
  }'
```

**Response includes warnings:**
```json
{
  "compiled_prompt": {
    "compiled_prompt": "You are an expert engineer reviewing: Machine learning model. Focus on {criteria}. Consider...",
    "compilation_metadata": {
      "missing_variables": ["criteria"],
      "warnings": ["Missing template variables: criteria"]
    }
  },
  "warnings": ["Template contains unresolved variables: {criteria}"]
}
```

#### 13. Non-existent Prompt ID
Attempting to compile a prompt that doesn't exist:

```bash
curl -X POST http://localhost:5301/prompt/nonexistent_prompt/compile \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {"test": "value"}
  }'
```

**Response:**
```json
{
  "detail": "Prompt template with ID 'nonexistent_prompt' not found"
}
```

#### 14. Token Limit Warnings
Compilation with token limit exceeded:

```bash
curl -X POST http://localhost:5301/prompt/engineering_review/compile \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "input": "Complex distributed system with microservices architecture",
      "criteria": "performance, scalability, reliability, security, maintainability"
    },
    "include_rag": true,
    "max_tokens": 500
  }'
```

**Response includes warnings:**
```json
{
  "warnings": [
    "Compiled prompt (1141 tokens) exceeds max_tokens limit (500)",
    "Consider reducing RAG content or simplifying variables"
  ]
}
```

#### 15. All RAG Sources Failed
When all RAG sources are inaccessible:

```bash
curl -X POST http://localhost:5301/prompt/system_design/compile \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "requirements": "Blockchain integration system",
      "constraints": "high security, regulatory compliance"
    },
    "include_rag": true
  }'
```

**Response:**
```json
{
  "compiled_prompt": {
    "rag_content_included": false,
    "rag_sources_used": [],
    "compilation_metadata": {
      "warnings": ["No RAG sources could be fetched"]
    }
  },
  "warnings": ["All RAG sources failed to load, proceeding without RAG content"]
}
```

### Cache Management

#### 16. Check RAG Cache Status
Monitor what's currently cached:

```bash
curl http://localhost:5301/rag/cache/info
```

#### 17. Clear Specific Cache Entry
Remove a specific URL from cache:

```bash
curl -X DELETE "http://localhost:5301/rag/cache/clear?url=https://raw.githubusercontent.com/user/repo/main/doc.md"
```

#### 18. Clear All Cache
Clear the entire RAG cache:

```bash
curl -X DELETE http://localhost:5301/rag/cache/clear
```

### Real-World Integration Examples

#### 19. LLM Integration Pattern
Typical usage in an LLM application:

```python
import requests

# 1. Compile prompt with context
response = requests.post('http://localhost:5301/prompt/engineering_review/compile', json={
    'variables': {
        'input': user_submitted_design,
        'criteria': 'security and performance'
    },
    'include_rag': True,
    'max_tokens': 4000
})

compiled_data = response.json()
final_prompt = compiled_data['compiled_prompt']['compiled_prompt']

# 2. Send to LLM
llm_response = your_llm_client.generate(
    prompt=final_prompt,
    max_tokens=compiled_data['compiled_prompt']['token_info']['estimated_tokens']
)
```

#### 20. Batch Processing Pattern
Process multiple prompts efficiently:

```python
import asyncio
import aiohttp

async def compile_prompt(session, prompt_id, variables):
    async with session.post(f'http://localhost:5301/prompt/{prompt_id}/compile', 
                           json={'variables': variables, 'include_rag': True}) as response:
        return await response.json()

async def batch_compile():
    async with aiohttp.ClientSession() as session:
        tasks = [
            compile_prompt(session, 'engineering_review', {'input': 'System A', 'criteria': 'performance'}),
            compile_prompt(session, 'system_design', {'requirements': 'API Gateway', 'constraints': 'cloud-native'}),
            compile_prompt(session, 'decision_analysis', {'scenario': 'Tech stack choice', 'criteria': 'cost'})
        ]
        results = await asyncio.gather(*tasks)
        return results
```

## 🧪 Testing

### Run Test Suite
Execute the comprehensive test suite:
```bash
python test_service.py
```

### Individual Tests
Test specific functionality:

```bash
# Test health endpoint
curl http://localhost:5301/health

# Test prompt listing
curl http://localhost:5301/prompts

# Test compilation
curl -X POST http://localhost:5301/prompt/engineering_review/compile \
  -H "Content-Type: application/json" \
  -d '{"variables": {"input": "test", "criteria": "test"}, "include_rag": true}'
```

### Validate Prompts
Validate prompt templates syntax:
```bash
python validate_prompts.py
```

## 🔍 Troubleshooting

### Common Issues

#### Service Won't Start
1. **Port Already in Use:**
```bash
# Check what's using the port
lsof -i :5301
# Use different port
PORT=5301 python main.py
```

2. **Missing Dependencies:**
```bash
pip install -r requirements.txt --upgrade
```

3. **Consul Connection Failed:**
```bash
# Check Consul is running
curl http://localhost:8500/v1/status/leader
# Disable Consul in service_config.json if not needed
```

#### RAG Sources Not Loading
1. **Local Files Not Found:**
- Ensure file paths are absolute or relative to service directory
- Check file permissions

2. **Remote URLs Failing:**
- Verify URLs are accessible
- Check network connectivity
- For GitHub: ensure raw URLs are used

3. **Cache Issues:**
```bash
# Clear RAG cache
curl -X DELETE http://localhost:5301/rag/cache/clear
# Check cache status  
curl http://localhost:5301/rag/cache/info
```

#### Compilation Errors
1. **Template Variables Not Resolved:**
- Ensure all `{variable}` placeholders have corresponding values in request
- Check variable names match exactly (case-sensitive)

2. **Token Limit Exceeded:**
- Reduce RAG content by limiting sources
- Use more concise variable values
- Increase max_tokens parameter

### Debug Mode
Enable detailed logging:
```bash
LOG_LEVEL=DEBUG python main.py
```

### Log Files
Check service logs for detailed error information:
```bash
tail -f logs/prompt_service.log  # If logging to file is configured
```

## 🔌 Integration Patterns

### With DADM Service Architecture
The prompt service integrates seamlessly with the DADM microservice ecosystem:

1. **Service Discovery:** Automatically registers with Consul
2. **Load Balancing:** Use Consul for service discovery by other DADM services
3. **Health Monitoring:** Provides health endpoints for monitoring systems

### Example Integration in Python
```python
import requests
import consul

class PromptClient:
    def __init__(self, consul_url="http://localhost:8500"):
        self.consul = consul.Consul(host=consul_url.split("://")[1].split(":")[0])
        self.service_url = self._discover_service()
    
    def _discover_service(self):
        services = self.consul.health.service('dadm-prompt-service', passing=True)[1]
        if services:
            service = services[0]['Service']
            return f"http://{service['Address']}:{service['Port']}"
        raise Exception("Prompt service not found in Consul")
    
    def compile_prompt(self, prompt_id, variables, include_rag=True):
        response = requests.post(
            f"{self.service_url}/prompt/{prompt_id}/compile",
            json={
                'variables': variables,
                'include_rag': include_rag,
                'rag_injection_style': 'context'
            }
        )
        return response.json()

# Usage
client = PromptClient()
result = client.compile_prompt('engineering_review', {
    'input': 'New API design',
    'criteria': 'security and performance'
})
```

### With LLM Services
```python
# Integration with OpenAI
import openai

def generate_with_compiled_prompt(prompt_id, variables, llm_variables):
    # Compile prompt with RAG
    compile_response = requests.post(f'{PROMPT_SERVICE}/prompt/{prompt_id}/compile', 
                                   json={'variables': variables, 'include_rag': True})
    
    compiled_prompt = compile_response.json()['compiled_prompt']['compiled_prompt']
    
    # Send to LLM
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": compiled_prompt}],
        **llm_variables
    )
    
    return response
```

## 📊 Performance Considerations

### RAG Caching
- RAG content is cached locally to improve performance
- Cache TTL is configurable (default: 1 hour)
- Cache size is monitored and managed automatically

### Memory Usage
- In-memory prompt storage for fast access
- RAG cache is memory-mapped for efficiency
- Service typically uses 50-100MB RAM under normal load

### Scaling
- Service is stateless and can be horizontally scaled
- Use load balancer with multiple instances
- Share RAG cache directory across instances if needed

### Optimization Tips
1. **Pre-populate RAG cache** for frequently used sources
2. **Use specific tags** for faster prompt filtering
3. **Batch compile requests** when processing multiple prompts
4. **Monitor token usage** to optimize prompt templates

## 🔒 Security Considerations

### RAG Sources
- **Local files:** Ensure proper file permissions and access controls
- **Remote URLs:** Validate and sanitize URLs to prevent SSRF attacks
- **GitHub sources:** Use read-only tokens when accessing private repositories

### Input Validation
- All inputs are validated using Pydantic models
- Template variables are sanitized to prevent injection attacks
- File paths are validated to prevent directory traversal

### Network Security
- Consider running behind a reverse proxy (nginx, Apache)
- Use HTTPS in production environments
- Implement rate limiting for public-facing deployments

## 📝 API Versioning

Current API version: `v1`

The service supports API versioning through:
- URL path versioning: `/v1/prompts`
- Header versioning: `API-Version: v1`
- Query parameter: `?version=v1`

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create virtual environment: `python -m venv venv`
3. Install dev dependencies: `pip install -r requirements-dev.txt`
4. Run tests: `python test_service.py`
5. Submit pull request

### Code Style
- Follow PEP 8 standards
- Use type hints
- Include docstrings for public methods
- Add tests for new features

## 📄 License

This service is part of the DADM (Decision Architecture and Data Management) system and follows the project's licensing terms.

## 🆘 Support

For issues and questions:
1. Check this README and troubleshooting section
2. Review service logs for detailed error information
3. Test endpoints using the provided examples
4. Submit issues with detailed reproduction steps

---

**Service Status:** ✅ Production Ready  
**Last Updated:** June 16, 2025  
**Version:** 1.0.0  
**Maintainer:** DADM Development Team
