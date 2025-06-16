"""
Analysis Service Models
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
from enum import Enum

class AnalysisFormat(str, Enum):
    JSON = "json"
    STRUCTURED_TEXT = "structured_text"
    MARKDOWN = "markdown"
    XML = "xml"

class AnalysisComplexity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EXPERT = "expert"

class AnalysisCategory(str, Enum):
    DECISION_SUPPORT = "decision_support"
    RISK_MANAGEMENT = "risk_management"
    BUSINESS_STRATEGY = "business_strategy"
    TECHNICAL_ANALYSIS = "technical_analysis"
    FINANCIAL_ANALYSIS = "financial_analysis"
    PROCESS_ANALYSIS = "process_analysis"

class AnalysisTemplate(BaseModel):
    """Analysis template defining how LLM should structure its response"""
    id: str = Field(..., description="Unique identifier for the analysis template")
    name: str = Field(..., description="Human-readable name for the template")
    description: str = Field(..., description="Description of what this analysis accomplishes")
    version: str = Field(default="1.0", description="Version of the template")
    category: AnalysisCategory = Field(..., description="Category of analysis")
    output_format: AnalysisFormat = Field(default=AnalysisFormat.JSON, description="Expected output format")
    
    # Schema definition for structured output
    schema: Dict[str, Any] = Field(..., description="JSON schema defining the expected output structure")
    
    # Instructions for the LLM
    instructions: Dict[str, Any] = Field(..., description="Detailed instructions for performing the analysis")
    
    # Optional example output
    example_output: Optional[Dict[str, Any]] = Field(None, description="Example of properly formatted output")
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

class AnalysisRequest(BaseModel):
    """Request for analysis processing"""
    prompt_id: str = Field(..., description="ID of the prompt template to use")
    analysis_template_id: str = Field(..., description="ID of the analysis template to inject")
    variables: Dict[str, Any] = Field(default_factory=dict, description="Variables for prompt compilation")
    context_data: Optional[Dict[str, Any]] = Field(None, description="Additional context data for analysis")
    
    # Processing options
    include_rag: bool = Field(default=True, description="Whether to include RAG content")
    max_tokens: Optional[int] = Field(None, description="Maximum tokens for LLM response")
    temperature: Optional[float] = Field(0.3, description="LLM temperature for analysis consistency")
    
    # Analysis specific options
    validation_level: str = Field(default="standard", description="Level of output validation")
    retry_on_invalid: bool = Field(default=True, description="Retry if output doesn't match schema")
    
class CompiledAnalysisPrompt(BaseModel):
    """Fully compiled prompt with analysis instructions"""
    prompt_id: str
    analysis_template_id: str
    compiled_prompt: str = Field(..., description="Complete prompt including analysis instructions")
    rag_content: Optional[Dict[str, str]] = Field(None, description="RAG content included in prompt")
    analysis_schema: Dict[str, Any] = Field(..., description="Expected response schema")
    instructions: Dict[str, Any] = Field(..., description="Analysis instructions for LLM")
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    # Compilation details
    compilation_timestamp: datetime = Field(default_factory=datetime.now)
    estimated_tokens: Optional[int] = Field(None, description="Estimated token count")
    
class LLMResponse(BaseModel):
    """Raw response from LLM"""
    content: str = Field(..., description="Raw response content from LLM")
    model: Optional[str] = Field(None, description="LLM model used")
    tokens_used: Optional[int] = Field(None, description="Actual tokens consumed")
    finish_reason: Optional[str] = Field(None, description="Reason for completion")
    response_time: Optional[float] = Field(None, description="Response time in seconds")
    timestamp: datetime = Field(default_factory=datetime.now)

class AnalysisValidation(BaseModel):
    """Results of analysis validation"""
    is_valid: bool = Field(..., description="Whether the analysis matches the expected schema")
    validation_errors: List[str] = Field(default_factory=list, description="List of validation errors")
    schema_compliance: float = Field(..., description="Percentage of schema compliance (0.0-1.0)")
    missing_fields: List[str] = Field(default_factory=list, description="Required fields that are missing")
    extra_fields: List[str] = Field(default_factory=list, description="Unexpected fields in response")
    
class ProcessedAnalysis(BaseModel):
    """Processed and validated analysis result"""
    analysis_id: str = Field(..., description="Unique identifier for this analysis")
    prompt_id: str
    analysis_template_id: str
    
    # Analysis content
    structured_content: Dict[str, Any] = Field(..., description="Validated and structured analysis content")
    raw_llm_response: str = Field(..., description="Original LLM response")
    
    # Validation and quality
    validation: AnalysisValidation
    quality_score: float = Field(..., description="Overall quality score (0.0-1.0)")
    
    # Processing metadata
    processing_time: float = Field(..., description="Total processing time in seconds")
    llm_response_time: Optional[float] = Field(None, description="LLM response time")
    validation_time: Optional[float] = Field(None, description="Validation processing time")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.now)
    processed_at: datetime = Field(default_factory=datetime.now)
    
    # Additional metadata
    metadata: Dict[str, Any] = Field(default_factory=dict)

class AnalysisExecution(BaseModel):
    """Complete analysis execution with computed insights"""
    execution_id: str = Field(..., description="Unique identifier for this analysis execution")
    analysis: ProcessedAnalysis = Field(..., description="The processed analysis")
    
    # Computed insights and metrics
    insights: Dict[str, Any] = Field(default_factory=dict, description="Extracted insights and patterns")
    metrics: Dict[str, Union[int, float, str]] = Field(default_factory=dict, description="Computed metrics")
    recommendations: List[str] = Field(default_factory=list, description="Generated recommendations")
    
    # Confidence and reliability
    confidence_score: float = Field(..., description="Confidence in analysis results (0.0-1.0)")
    reliability_indicators: Dict[str, Any] = Field(default_factory=dict)
    
    # Comparison and benchmarking
    comparison_data: Optional[Dict[str, Any]] = Field(None, description="Comparison with historical data")
    benchmarks: Optional[Dict[str, Any]] = Field(None, description="Benchmark comparisons")
    
    # Execution metadata
    execution_time: float = Field(..., description="Total execution time including analysis")
    execution_timestamp: datetime = Field(default_factory=datetime.now)

class AnalysisWorkflow(BaseModel):
    """BPMN workflow integration model"""
    workflow_id: str = Field(..., description="BPMN process instance ID")
    task_id: str = Field(..., description="Service task ID within the process")
    
    # Analysis configuration from BPMN
    prompt_reference: str = Field(..., description="Reference to prompt template (ID or name)")
    analysis_reference: str = Field(..., description="Reference to analysis template (ID or name)")
    
    # Process variables
    process_variables: Dict[str, Any] = Field(default_factory=dict, description="Variables from BPMN process")
    task_variables: Dict[str, Any] = Field(default_factory=dict, description="Task-specific variables")
    
    # Execution tracking
    execution_status: str = Field(default="pending", description="Current execution status")
    execution_result: Optional[AnalysisExecution] = Field(None, description="Analysis execution result")
    
    # Error handling
    error_details: Optional[Dict[str, Any]] = Field(None, description="Error information if execution failed")
    retry_count: int = Field(default=0, description="Number of retry attempts")
    
    # Timestamps
    started_at: Optional[datetime] = Field(None)
    completed_at: Optional[datetime] = Field(None)

class AnalysisServiceConfig(BaseModel):
    """Configuration for the analysis service"""
    service_name: str = Field(default="dadm-analysis-service")
    version: str = Field(default="0.10.0")
    port: int = Field(default=5302)
    
    # LLM Configuration
    default_llm_provider: str = Field(default="openai")
    default_model: str = Field(default="gpt-4")
    default_temperature: float = Field(default=0.3)
    max_tokens_default: int = Field(default=4000)
    
    # Validation settings
    strict_validation: bool = Field(default=True)
    max_retry_attempts: int = Field(default=3)
    validation_timeout: float = Field(default=30.0)
    
    # Storage and caching
    analysis_storage_path: str = Field(default="./analysis_results")
    cache_results: bool = Field(default=True)
    cache_ttl: int = Field(default=3600)  # 1 hour
    
    # Integration settings
    prompt_service_url: str = Field(default="http://localhost:5300")
    consul_enabled: bool = Field(default=True)
    consul_url: str = Field(default="http://consul:8500")
    
    # BPMN integration
    camunda_base_url: str = Field(default="http://dadm-camunda:8080")
    enable_workflow_integration: bool = Field(default=True)
