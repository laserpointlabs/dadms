"""
Pydantic models for the Prompt Service

Defines the data structures for prompt templates and API request/response models.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, HttpUrl, validator
import re


class RAGSource(BaseModel):
    """Model for RAG source references"""
    url: str = Field(..., description="URL or path to the RAG source")
    description: Optional[str] = Field(None, description="Description of the RAG source")
    type: Optional[str] = Field(None, description="Type of source (local, remote, github)")
    
    @validator('url')
    def validate_url(cls, v):
        """Validate URL format"""
        # Allow local paths (starting with /)
        if v.startswith('/'):
            return v
        
        # Allow HTTP/HTTPS URLs
        if v.startswith(('http://', 'https://')):
            return v
        
        # Allow GitHub raw URLs specifically
        if 'raw.githubusercontent.com' in v or 'github.com' in v:
            return v
            
        raise ValueError('URL must be a local path (starting with /) or a valid HTTP/HTTPS URL')
    
    @property
    def is_remote(self) -> bool:
        """Check if this is a remote source"""
        return self.url.startswith(('http://', 'https://'))
    
    @property
    def is_github(self) -> bool:
        """Check if this is a GitHub source"""
        return 'github.com' in self.url or 'raw.githubusercontent.com' in self.url


class PromptTemplate(BaseModel):
    """Main prompt template model"""
    id: str = Field(..., description="Unique identifier for the prompt template")
    description: str = Field(..., description="Human-readable description of the prompt's purpose")
    template: str = Field(..., description="The prompt template with placeholder variables")
    tags: List[str] = Field(default_factory=list, description="Tags for categorizing and filtering prompts")
    rag_sources: List[Union[str, RAGSource]] = Field(default_factory=list, description="RAG document sources (URLs or local paths)")
    version: str = Field(default="1.0", description="Version of the prompt template")
    created_at: datetime = Field(default_factory=datetime.now, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.now, description="Last update timestamp")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
    
    @validator('rag_sources', pre=True)
    def convert_rag_sources(cls, v):
        """Convert string RAG sources to RAGSource objects"""
        if not v:
            return []
        
        result = []
        for source in v:
            if isinstance(source, str):
                # Auto-detect type
                source_type = "local"
                if source.startswith(('http://', 'https://')):
                    source_type = "remote"
                    if 'github.com' in source or 'raw.githubusercontent.com' in source:
                        source_type = "github"
                
                result.append(RAGSource(
                    url=source,
                    type=source_type,
                    description=f"Auto-detected {source_type} source"
                ))
            else:
                result.append(source)
        return result


class PromptTemplateCreate(BaseModel):
    """Model for creating a new prompt template"""
    id: str = Field(..., description="Unique identifier for the prompt template")
    description: str = Field(..., description="Human-readable description of the prompt's purpose")
    template: str = Field(..., description="The prompt template with placeholder variables")
    tags: List[str] = Field(default_factory=list, description="Tags for categorizing and filtering prompts")
    rag_sources: List[Union[str, RAGSource]] = Field(default_factory=list, description="RAG document sources")
    version: str = Field(default="1.0", description="Version of the prompt template")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class PromptTemplateUpdate(BaseModel):
    """Model for updating an existing prompt template"""
    description: Optional[str] = Field(None, description="Human-readable description of the prompt's purpose")
    template: Optional[str] = Field(None, description="The prompt template with placeholder variables")
    tags: Optional[List[str]] = Field(None, description="Tags for categorizing and filtering prompts")
    rag_sources: Optional[List[Union[str, RAGSource]]] = Field(None, description="RAG document sources")
    version: Optional[str] = Field(None, description="Version of the prompt template")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")


class PromptListResponse(BaseModel):
    """Response model for listing prompts"""
    prompts: List[PromptTemplate]
    count: int = Field(..., description="Total number of prompts")
    status: str = Field(default="success")


class PromptResponse(BaseModel):
    """Response model for single prompt operations"""
    prompt: Optional[PromptTemplate] = None
    status: str = Field(default="success")
    message: str = Field(default="")


class ErrorResponse(BaseModel):
    """Error response model"""
    status: str = Field(default="error")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")


class HealthResponse(BaseModel):
    """Health check response model"""
    status: str = Field(default="healthy")
    service: str = Field(default="dadm-prompt-service")
    version: str = Field(default="1.0.0")
    timestamp: datetime = Field(default_factory=datetime.now)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ServiceInfo(BaseModel):
    """Service information model"""
    name: str = Field(default="dadm-prompt-service")
    type: str = Field(default="prompt")
    version: str = Field(default="1.0.0")
    description: str = Field(default="DADM Prompt Template Service")
    endpoints: List[Dict[str, str]] = Field(default_factory=list)


class PromptCompileRequest(BaseModel):
    """Request model for prompt compilation"""
    variables: Dict[str, Any] = Field(default_factory=dict, description="Variables to inject into the prompt template")
    include_rag: bool = Field(default=True, description="Whether to include RAG content")
    rag_injection_style: str = Field(default="documents", description="Style of RAG injection: 'documents', 'context', 'references'")
    max_tokens: Optional[int] = Field(None, description="Maximum token limit for compiled prompt")
    use_cache: bool = Field(default=True, description="Whether to use cached RAG content")


class TokenInfo(BaseModel):
    """Token information model"""
    estimated_tokens: int = Field(..., description="Estimated token count")
    character_count: int = Field(..., description="Character count")
    token_efficiency: float = Field(..., description="Characters per token ratio")


class CompiledPrompt(BaseModel):
    """Compiled prompt response model"""
    prompt_id: str = Field(..., description="ID of the source prompt template")
    compiled_prompt: str = Field(..., description="Final compiled prompt with RAG content and variables")
    template_used: str = Field(..., description="Original template that was used")
    variables_applied: Dict[str, Any] = Field(..., description="Variables that were applied")
    rag_content_included: bool = Field(..., description="Whether RAG content was included")
    rag_sources_used: List[Dict[str, Any]] = Field(default_factory=list, description="RAG sources that were used")
    token_info: TokenInfo = Field(..., description="Token usage information")
    compilation_metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional compilation metadata")


class PromptCompileResponse(BaseModel):
    """Response model for prompt compilation"""
    compiled_prompt: CompiledPrompt
    status: str = Field(default="success")
    message: str = Field(default="")
    warnings: List[str] = Field(default_factory=list, description="Any warnings during compilation")
