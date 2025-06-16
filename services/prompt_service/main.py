"""
DADM Prfrom datetime import datetime
from typing import Dict, List, Optional, Tuple
from pathlib import Patht Service

A FastAPI-based service for managing structured prompt templates.
Provides REST API endpoints to fetch, add, and update prompt templates.
"""
import os
import sys
import json
import logging
import atexit
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from pathlib import Path

from fastapi import FastAPI, HTTPException, status
from fastapi.responses import JSONResponse
import uvicorn

# Add project root to path for imports
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from models import (
    PromptTemplate, PromptTemplateCreate, PromptTemplateUpdate,
    PromptListResponse, PromptResponse, ErrorResponse, 
    HealthResponse, ServiceInfo, RAGSource,
    PromptCompileRequest, PromptCompileResponse, CompiledPrompt, TokenInfo
)
from consul_registry import ConsulServiceRegistry
from rag_manager import RAGResourceManager
from prompt_compiler import PromptCompiler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load service configuration
def load_service_config():
    """Load service configuration from service_config.json"""
    config_path = os.path.join(os.path.dirname(__file__), "service_config.json")
    try:
        with open(config_path, 'r') as f:
            config_data = json.load(f)
            return config_data.get('service', {})
    except Exception as e:
        logger.warning(f"Could not load service config from {config_path}: {e}")
        return {
            "name": "dadm-prompt-service",
            "type": "prompt",
            "port": 5300,
            "version": "1.0.0",
            "health_endpoint": "/health",
            "description": "DADM Prompt Template Service"
        }

# Load service configuration
SERVICE_CONFIG = load_service_config()
SERVICE_NAME = SERVICE_CONFIG.get('name', 'dadm-prompt-service')
SERVICE_TYPE = SERVICE_CONFIG.get('type', 'prompt')
SERVICE_VERSION = SERVICE_CONFIG.get('version', '1.0.0')
SERVICE_DESCRIPTION = SERVICE_CONFIG.get('description', 'DADM Prompt Template Service')
SERVICE_PORT = SERVICE_CONFIG.get('port', 5300)

# Initialize FastAPI app
app = FastAPI(
    title="DADM Prompt Service",
    description="REST API for managing structured prompt templates",
    version=SERVICE_VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Data storage file path
PROMPTS_FILE = os.path.join(os.path.dirname(__file__), "prompts.json")

# In-memory cache for prompts
_prompts_cache: Optional[Dict[str, Dict]] = None
_last_modified: Optional[float] = None

def load_prompts() -> Dict[str, Dict]:
    """Load prompts from JSON file with caching"""
    global _prompts_cache, _last_modified
    
    try:
        # Check if file exists
        if not os.path.exists(PROMPTS_FILE):
            logger.warning(f"Prompts file not found: {PROMPTS_FILE}")
            return {}
        
        # Check if we need to reload
        current_modified = os.path.getmtime(PROMPTS_FILE)
        if _prompts_cache is None or _last_modified != current_modified:
            with open(PROMPTS_FILE, 'r') as f:
                _prompts_cache = json.load(f)
            _last_modified = current_modified
            if _prompts_cache:
                logger.info(f"Loaded {len(_prompts_cache)} prompts from {PROMPTS_FILE}")
        
        return _prompts_cache or {}
    except Exception as e:
        logger.error(f"Error loading prompts: {e}")
        return {}

def save_prompts(prompts: Dict[str, Dict]) -> bool:
    """Save prompts to JSON file"""
    global _prompts_cache, _last_modified
    
    try:
        # Create backup of existing file
        if os.path.exists(PROMPTS_FILE):
            backup_file = f"{PROMPTS_FILE}.bak"
            os.rename(PROMPTS_FILE, backup_file)
        
        # Write new data
        with open(PROMPTS_FILE, 'w') as f:
            json.dump(prompts, f, indent=2, default=str)
        
        # Update cache
        _prompts_cache = prompts
        _last_modified = os.path.getmtime(PROMPTS_FILE)
        
        logger.info(f"Saved {len(prompts)} prompts to {PROMPTS_FILE}")
        return True
    except Exception as e:
        logger.error(f"Error saving prompts: {e}")
        return False

# Initialize RAG resource manager and prompt compiler
rag_manager = RAGResourceManager()
prompt_compiler = PromptCompiler()

# Utility functions for prompt compilation

def estimate_tokens(text: str) -> int:
    """
    Estimate token count using approximate 4 characters per token rule
    
    Args:
        text: Text to estimate tokens for
        
    Returns:
        Estimated token count
    """
    if not text:
        return 0
    # More sophisticated estimation considering spaces and punctuation
    # Generally 3.5-4.5 chars per token for English text
    return max(1, len(text) // 4)

def format_rag_content(rag_contents: Dict[str, str], style: str = "documents") -> str:
    """
    Format RAG content for injection into prompts
    
    Args:
        rag_contents: Dictionary of URL -> content
        style: Formatting style ('documents', 'context', 'references')
        
    Returns:
        Formatted RAG content string
    """
    if not rag_contents:
        return ""
    
    # Filter out error content
    valid_contents = {url: content for url, content in rag_contents.items() 
                     if not content.startswith('Error:')}
    
    if not valid_contents:
        return ""
    
    if style == "documents":
        formatted_parts = []
        for i, (url, content) in enumerate(valid_contents.items(), 1):
            formatted_parts.append(f"## Reference Document {i}\n**Source:** {url}\n\n{content}")
        return "\n\n".join(formatted_parts)
    
    elif style == "context":
        # Simple concatenation with minimal formatting
        return "\n\n".join(valid_contents.values())
    
    elif style == "references":
        formatted_parts = []
        for url, content in valid_contents.items():
            formatted_parts.append(f"Reference from {url}:\n{content}")
        return "\n\n---\n\n".join(formatted_parts)
    
    else:
        # Default to documents style
        return format_rag_content(rag_contents, "documents")

def compile_prompt_template(
    template: str, 
    variables: Dict[str, Any], 
    rag_content: str = "", 
    rag_placeholder: str = "{rag_context}"
) -> Tuple[str, List[str]]:
    """
    Compile a prompt template with variables and RAG content
    
    Args:
        template: Prompt template string
        variables: Variables to substitute
        rag_content: Formatted RAG content
        rag_placeholder: Placeholder for RAG content in template
        
    Returns:
        Tuple of (compiled_prompt, warnings)
    """
    warnings = []
    compiled = template
    
    # Inject RAG content if placeholder exists
    if rag_placeholder in template:
        if rag_content:
            compiled = compiled.replace(rag_placeholder, rag_content)
        else:
            compiled = compiled.replace(rag_placeholder, "")
            warnings.append(f"No RAG content available for placeholder '{rag_placeholder}'")
    elif rag_content and rag_placeholder not in template:
        # Auto-inject RAG content at the beginning if no placeholder
        compiled = f"{rag_content}\n\n{compiled}"
        warnings.append("RAG content auto-injected at beginning of prompt (no placeholder found)")
    
    # Substitute variables
    try:
        # Find all placeholders in the template
        import re
        placeholders = re.findall(r'\{([^}]+)\}', compiled)
        
        # Check for missing variables
        for placeholder in placeholders:
            if placeholder not in variables:
                warnings.append(f"Variable '{placeholder}' not provided, placeholder will remain")
        
        # Apply variables with safe substitution
        for var_name, var_value in variables.items():
            placeholder = f"{{{var_name}}}"
            if placeholder in compiled:
                compiled = compiled.replace(placeholder, str(var_value))
        
    except Exception as e:
        warnings.append(f"Error during variable substitution: {str(e)}")
    
    return compiled, warnings

# API Endpoints

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        service=SERVICE_NAME,
        version=SERVICE_VERSION,
        timestamp=datetime.now()
    )

@app.get("/info", response_model=ServiceInfo)
async def service_info():
    """Service information endpoint"""
    return ServiceInfo(
        name=SERVICE_NAME,
        type=SERVICE_TYPE,
        version=SERVICE_VERSION,
        description=SERVICE_DESCRIPTION,
        endpoints=[
            {
                "path": "/health",
                "method": "GET",
                "description": "Health check endpoint"
            },
            {
                "path": "/info",
                "method": "GET",
                "description": "Service information endpoint"
            },
            {
                "path": "/prompts",
                "method": "GET",
                "description": "List all prompt templates"
            },
            {
                "path": "/prompt/{id}",
                "method": "GET",
                "description": "Get a specific prompt template by ID"
            },
            {
                "path": "/prompt",
                "method": "POST",
                "description": "Create a new prompt template"
            },
            {
                "path": "/prompt/{id}",
                "method": "PUT",
                "description": "Update an existing prompt template"
            },
            {
                "path": "/prompt/{id}/rag-content",
                "method": "GET",
                "description": "Get RAG content for a specific prompt"
            },
            {
                "path": "/prompt/{id}/compile",
                "method": "POST",
                "description": "Compile prompt with RAG content and variables injected"
            },
            {
                "path": "/prompt/{id}/compile",
                "method": "POST",
                "description": "Compile prompt with RAG content and variables into ready-to-use text"
            },
            {
                "path": "/rag/validate",
                "method": "POST",
                "description": "Validate RAG sources"
            },
            {
                "path": "/rag/cache/info",
                "method": "GET",
                "description": "Get RAG cache information"
            },
            {
                "path": "/rag/cache/clear",
                "method": "DELETE",
                "description": "Clear RAG cache"
            }
        ]
    )

@app.get("/prompts", response_model=PromptListResponse)
async def list_prompts(tags: Optional[str] = None):
    """
    List all prompt templates
    
    Args:
        tags: Optional comma-separated list of tags to filter by
    """
    try:
        prompts_data = load_prompts()
        prompts = []
        
        # Convert to PromptTemplate objects
        for prompt_id, prompt_data in prompts_data.items():
            try:
                prompt = PromptTemplate(**prompt_data)
                
                # Apply tag filter if specified
                if tags:
                    filter_tags = [tag.strip() for tag in tags.split(',')]
                    if not any(tag in prompt.tags for tag in filter_tags):
                        continue
                
                prompts.append(prompt)
            except Exception as e:
                logger.warning(f"Error parsing prompt {prompt_id}: {e}")
                continue
        
        return PromptListResponse(
            prompts=prompts,
            count=len(prompts),
            status="success"
        )
    except Exception as e:
        logger.error(f"Error listing prompts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error loading prompts: {str(e)}"
        )

@app.get("/prompt/{prompt_id}", response_model=PromptResponse)
async def get_prompt(prompt_id: str):
    """Get a specific prompt template by ID"""
    try:
        prompts_data = load_prompts()
        
        if prompt_id not in prompts_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Prompt with ID '{prompt_id}' not found"
            )
        
        prompt = PromptTemplate(**prompts_data[prompt_id])
        return PromptResponse(
            prompt=prompt,
            status="success",
            message=f"Retrieved prompt '{prompt_id}'"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting prompt {prompt_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving prompt: {str(e)}"
        )

@app.post("/prompt", response_model=PromptResponse)
async def create_prompt(prompt_data: PromptTemplateCreate):
    """Create a new prompt template"""
    try:
        prompts_data = load_prompts()
        
        # Check if prompt already exists
        if prompt_data.id in prompts_data:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Prompt with ID '{prompt_data.id}' already exists"
            )
        
        # Create new prompt with timestamps
        now = datetime.now()
        new_prompt = PromptTemplate(
            **prompt_data.dict(),
            created_at=now,
            updated_at=now
        )
        
        # Add to prompts data
        prompts_data[prompt_data.id] = new_prompt.dict()
        
        # Save to file
        if not save_prompts(prompts_data):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save prompt template"
            )
        
        logger.info(f"Created new prompt: {prompt_data.id}")
        return PromptResponse(
            prompt=new_prompt,
            status="success",
            message=f"Created prompt '{prompt_data.id}'"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating prompt: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating prompt: {str(e)}"
        )

@app.put("/prompt/{prompt_id}", response_model=PromptResponse)
async def update_prompt(prompt_id: str, update_data: PromptTemplateUpdate):
    """Update an existing prompt template"""
    try:
        prompts_data = load_prompts()
        
        if prompt_id not in prompts_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Prompt with ID '{prompt_id}' not found"
            )
        
        # Get existing prompt
        existing_prompt = PromptTemplate(**prompts_data[prompt_id])
        
        # Update fields that are provided
        update_dict = update_data.dict(exclude_unset=True)
        if update_dict:
            for field, value in update_dict.items():
                setattr(existing_prompt, field, value)
            
            # Update timestamp
            existing_prompt.updated_at = datetime.now()
            
            # Save updated prompt
            prompts_data[prompt_id] = existing_prompt.dict()
            
            if not save_prompts(prompts_data):
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to save updated prompt template"
                )
            
            logger.info(f"Updated prompt: {prompt_id}")
            return PromptResponse(
                prompt=existing_prompt,
                status="success",
                message=f"Updated prompt '{prompt_id}'"
            )
        else:
            return PromptResponse(
                prompt=existing_prompt,
                status="success",
                message=f"No changes made to prompt '{prompt_id}'"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating prompt {prompt_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating prompt: {str(e)}"
        )

@app.get("/prompt/{prompt_id}/rag-content")
async def get_prompt_rag_content(prompt_id: str, use_cache: bool = True):
    """Get RAG content for a specific prompt"""
    try:
        prompts_data = load_prompts()
        
        if prompt_id not in prompts_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Prompt with ID '{prompt_id}' not found"
            )
        
        prompt = PromptTemplate(**prompts_data[prompt_id])
        
        if not prompt.rag_sources:
            return {
                "prompt_id": prompt_id,
                "rag_contents": {},
                "message": "No RAG sources defined for this prompt"
            }
        
        # Convert string RAG sources to RAGSource objects if needed
        rag_sources_objects = []
        for source in prompt.rag_sources:
            if isinstance(source, str):
                # Auto-detect type
                source_type = "local"
                if source.startswith(('http://', 'https://')):
                    source_type = "remote"
                    if 'github.com' in source or 'raw.githubusercontent.com' in source:
                        source_type = "github"
                
                rag_sources_objects.append(RAGSource(
                    url=source,
                    type=source_type,
                    description=f"Auto-detected {source_type} source"
                ))
            else:
                rag_sources_objects.append(source)
        
        # Get RAG contents
        rag_contents = rag_manager.get_rag_contents_for_prompt(rag_sources_objects, use_cache)
        
        return {
            "prompt_id": prompt_id,
            "rag_sources": [source.dict() for source in rag_sources_objects],
            "rag_contents": rag_contents,
            "cache_used": use_cache
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting RAG content for prompt {prompt_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving RAG content: {str(e)}"
        )

@app.post("/prompt/{prompt_id}/compile", response_model=PromptCompileResponse)
async def compile_prompt(prompt_id: str, request: PromptCompileRequest):
    """
    Compile a prompt template with RAG content and variables injected
    
    This endpoint assembles a complete, ready-to-use prompt by:
    1. Loading the prompt template
    2. Fetching RAG content (if requested)
    3. Formatting RAG content according to specified style
    4. Injecting variables into the template
    5. Returning the compiled prompt with metadata
    """
    try:
        prompts_data = load_prompts()
        
        if prompt_id not in prompts_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Prompt with ID '{prompt_id}' not found"
            )
        
        prompt = PromptTemplate(**prompts_data[prompt_id])
        warnings = []
        
        # Fetch RAG content if requested
        rag_content = ""
        rag_sources_used = []
        if request.include_rag and prompt.rag_sources:
            # Convert string RAG sources to RAGSource objects
            rag_sources_objects = []
            for source in prompt.rag_sources:
                if isinstance(source, str):
                    source_type = "local"
                    if source.startswith(('http://', 'https://')):
                        source_type = "remote"
                        if 'github.com' in source or 'raw.githubusercontent.com' in source:
                            source_type = "github"
                    
                    rag_sources_objects.append(RAGSource(
                        url=source,
                        type=source_type,
                        description=f"Auto-detected {source_type} source"
                    ))
                else:
                    rag_sources_objects.append(source)
            
            # Fetch RAG contents
            rag_contents = rag_manager.get_rag_contents_for_prompt(rag_sources_objects, request.use_cache)
            
            # Check for failed fetches
            failed_sources = [url for url, content in rag_contents.items() if content.startswith('Error:')]
            if failed_sources:
                warnings.append(f"Failed to fetch {len(failed_sources)} RAG sources: {', '.join(failed_sources[:2])}{'...' if len(failed_sources) > 2 else ''}")
            
            # Format RAG content
            rag_content = format_rag_content(rag_contents, request.rag_injection_style)
            rag_sources_used = [source.dict() for source in rag_sources_objects]
        
        # Compile the prompt
        compiled_text, compile_warnings = compile_prompt_template(
            template=prompt.template,
            variables=request.variables,
            rag_content=rag_content
        )
        warnings.extend(compile_warnings)
        
        # Calculate token information
        char_count = len(compiled_text)
        token_count = estimate_tokens(compiled_text)
        token_efficiency = char_count / token_count if token_count > 0 else 0
        
        # Check token limits
        if request.max_tokens and token_count > request.max_tokens:
            warnings.append(f"Compiled prompt ({token_count} tokens) exceeds specified limit ({request.max_tokens} tokens)")
        
        # Create token info
        token_info = TokenInfo(
            estimated_tokens=token_count,
            character_count=char_count,
            token_efficiency=token_efficiency
        )
        
        # Create compiled prompt object
        compiled_prompt = CompiledPrompt(
            prompt_id=prompt_id,
            compiled_prompt=compiled_text,
            template_used=prompt.template,
            variables_applied=request.variables,
            rag_content_included=bool(rag_content),
            rag_sources_used=rag_sources_used,
            token_info=token_info,
            compilation_metadata={
                "rag_injection_style": request.rag_injection_style,
                "use_cache": request.use_cache,
                "rag_sources_count": len(rag_sources_used),
                "successful_rag_fetches": len(rag_sources_used) - len([w for w in warnings if "Failed to fetch" in w]),
                "compilation_timestamp": datetime.now().isoformat()
            }
        )
        
        logger.info(f"Compiled prompt '{prompt_id}' with {len(rag_sources_used)} RAG sources and {len(request.variables)} variables")
        
        return PromptCompileResponse(
            compiled_prompt=compiled_prompt,
            status="success",
            message=f"Successfully compiled prompt '{prompt_id}'",
            warnings=warnings
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error compiling prompt {prompt_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error compiling prompt: {str(e)}"
        )

# Service registration with Consul
consul_registry = None

def register_with_consul():
    """Register service with Consul"""
    global consul_registry
    
    try:
        consul_registry = ConsulServiceRegistry()
        
        # Register the service
        success = consul_registry.register_service(
            name=SERVICE_NAME,
            service_type=SERVICE_TYPE,
            port=SERVICE_PORT,
            tags=["api", "rest", "prompt", "template"],
            meta={
                "version": SERVICE_VERSION,
                "description": SERVICE_DESCRIPTION,
                "api": "REST"
            },
            health_check_path="/health",
            health_check_interval="30s"
        )
        
        if success:
            logger.info(f"✅ Successfully registered {SERVICE_NAME} with Consul")
        else:
            logger.warning(f"⚠️ Failed to register {SERVICE_NAME} with Consul")
            
    except Exception as e:
        logger.error(f"❌ Error during Consul registration: {e}")

def deregister_from_consul():
    """Deregister service from Consul on shutdown"""
    global consul_registry
    
    if consul_registry:
        try:
            consul_registry.deregister_service(SERVICE_NAME)
            logger.info(f"✅ Deregistered {SERVICE_NAME} from Consul")
        except Exception as e:
            logger.error(f"❌ Error deregistering from Consul: {e}")

# Register cleanup function
atexit.register(deregister_from_consul)

if __name__ == "__main__":
    # Register with Consul
    register_with_consul()
    
    # Get port from environment or config
    port = int(os.environ.get("PORT", SERVICE_PORT))
    
    logger.info(f"Starting {SERVICE_NAME} on port {port}")
    logger.info(f"FastAPI documentation available at http://localhost:{port}/docs")
    
    # Start the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info"
    )
