"""
Analysis Service Interface
FastAPI service for handling analysis requests from BPMN workflows
"""

import os
import json
import logging
from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
import asyncio
import json

from models import (
    AnalysisTemplate, AnalysisRequest, CompiledAnalysisPrompt, ProcessedAnalysis,
    AnalysisExecution, AnalysisServiceConfig, AnalysisWorkflow
)
from template_manager import AnalysisTemplateManager  
from prompt_compiler import AnalysisPromptCompiler
from analysis_processor import AnalysisProcessor
from config_manager import load_service_config, get_service_discovery
from consul_registry import ConsulServiceRegistry
from service_integrations import IntegratedAnalysisOrchestrator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Request/Response models for the API
class AnalysisAPIRequest(BaseModel):
    """API request model for analysis"""
    prompt_reference: str
    analysis_reference: str
    context_variables: Dict[str, Any] = {}
    metadata: Dict[str, Any] = {}

class AnalysisAPIResponse(BaseModel):
    """API response model for analysis"""
    execution_id: str
    status: str
    analysis: Optional[ProcessedAnalysis] = None
    execution: Optional[AnalysisExecution] = None
    error: Optional[str] = None

class WorkflowAnalysisRequest(BaseModel):
    """BPMN workflow analysis request"""
    workflow_id: str
    task_id: str
    prompt_reference: str
    analysis_reference: str
    process_variables: Dict[str, Any] = {}
    task_variables: Dict[str, Any] = {}

# Additional request models for integrated analysis
class IntegratedAnalysisRequest(BaseModel):
    """Request for integrated analysis using all services"""
    analysis_type: str = Field(..., description="Type of analysis to perform")
    data_sources: Dict[str, Any] = Field(default_factory=dict, description="Data sources for analysis")
    analysis_parameters: Dict[str, Any] = Field(default_factory=dict, description="Analysis parameters")
    execution_tools: List[str] = Field(default=["python"], description="Tools to use for execution")
    llm_model: Optional[str] = Field(None, description="Specific LLM model to use")
    timeout: int = Field(default=600, description="Maximum execution time in seconds")

class IntegratedAnalysisResponse(BaseModel):
    """Response from integrated analysis"""
    execution_id: str
    status: str
    llm_analysis: Optional[Dict[str, Any]] = None
    computational_results: Optional[Dict[str, Any]] = None
    final_insights: Optional[Dict[str, Any]] = None
    execution_metadata: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# Global service instances
template_manager: Optional[AnalysisTemplateManager] = None
prompt_compiler: Optional[AnalysisPromptCompiler] = None
analysis_processor: Optional[AnalysisProcessor] = None
service_config: Optional[AnalysisServiceConfig] = None
consul_registry: Optional[ConsulServiceRegistry] = None
orchestrator: Optional[IntegratedAnalysisOrchestrator] = None

def load_service_info():
    """Load service information from service_config.json"""
    config_path = os.path.join(os.path.dirname(__file__), "service_config.json")
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.warning(f"Could not load service_config.json: {e}")
        return {
            "service": {
                "name": "dadm-analysis-service",
                "type": "analysis",
                "port": 8002,
                "version": "0.10.0",
                "health_endpoint": "/health",
                "description": "DADM Analysis Service"
            }
        }

def register_with_consul():
    """Register the analysis service with Consul"""
    global consul_registry
    
    # Check if Consul registration is enabled
    config = get_service_config()
    if not config.consul_enabled:
        logger.info("Consul registration disabled, skipping...")
        return
    
    try:
        # Load service info
        service_info = load_service_info()["service"]
        
        # Initialize Consul registry
        consul_registry = ConsulServiceRegistry()
        
        # Register the service
        success = consul_registry.register_service(
            name=service_info["name"],
            service_type=service_info["type"],
            host=None,  # Auto-detect from environment
            port=service_info["port"],
            tags=service_info.get("tags", ["analysis", "llm", "bpmn"]),
            meta={
                "version": service_info["version"],
                "description": service_info["description"],
                **service_info.get("meta", {})
            },
            health_check_path=service_info["health_endpoint"],
            health_check_interval="30s"
        )
        
        if success:
            logger.info(f"✅ Successfully registered {service_info['name']} with Consul")
        else:
            logger.warning(f"❌ Failed to register {service_info['name']} with Consul")
            
    except Exception as e:
        logger.error(f"Error registering with Consul: {e}")

def deregister_from_consul():
    """Deregister the service from Consul on shutdown"""
    global consul_registry
    if consul_registry:
        try:
            service_info = load_service_info()["service"]
            success = consul_registry.deregister_service(service_info["name"])
            if success:
                logger.info(f"✅ Successfully deregistered {service_info['name']} from Consul")
            else:
                logger.warning(f"❌ Failed to deregister {service_info['name']} from Consul")
        except Exception as e:
            logger.error(f"Error deregistering from Consul: {e}")

def get_service_config() -> AnalysisServiceConfig:
    """Get or create service configuration from multiple sources"""
    global service_config
    if service_config is None:
        service_config = load_service_config()
        logger.info(f"Service configuration loaded: {service_config.service_name} v{service_config.version}")
        logger.info(f"Prompt service URL: {service_config.prompt_service_url}")
        logger.info(f"Service port: {service_config.port}")
    return service_config

def get_template_manager() -> AnalysisTemplateManager:
    """Get or create template manager"""
    global template_manager
    if template_manager is None:
        template_file_path = os.path.join(os.path.dirname(__file__), "analysis_templates.json")
        template_manager = AnalysisTemplateManager(template_file_path)
    return template_manager

def get_prompt_compiler() -> AnalysisPromptCompiler:
    """Get or create prompt compiler"""
    global prompt_compiler
    if prompt_compiler is None:
        config = get_service_config()
        tm = get_template_manager()
        prompt_compiler = AnalysisPromptCompiler(config, tm)
    return prompt_compiler

def get_analysis_processor() -> AnalysisProcessor:
    """Get or create analysis processor"""
    global analysis_processor
    if analysis_processor is None:
        config = get_service_config()
        tm = get_template_manager()
        analysis_processor = AnalysisProcessor(config, tm)
    return analysis_processor

def get_orchestrator() -> IntegratedAnalysisOrchestrator:
    """Get or create analysis orchestrator"""
    global orchestrator
    if orchestrator is None:
        config = get_service_config()
        orchestrator = IntegratedAnalysisOrchestrator(config)
    return orchestrator

# FastAPI app
app = FastAPI(
    title="DADM Analysis Service",
    description="Service for LLM-driven structured analysis with BPMN integration",
    version="1.0.0"
)

@app.on_event("startup")
async def startup_event():
    """Initialize service components on startup"""
    logger.info("Starting DADM Analysis Service...")
    
    # Initialize all components
    get_service_config()
    get_template_manager()
    get_prompt_compiler()
    get_analysis_processor()
    get_orchestrator()
    
    # Register with Consul
    register_with_consul()
    
    logger.info("Analysis Service initialized successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown"""
    logger.info("Shutting down DADM Analysis Service...")
    
    # Cleanup orchestrator resources
    global orchestrator
    if orchestrator:
        await orchestrator.cleanup()
    
    # Deregister from Consul
    deregister_from_consul()
    
    logger.info("Service shutdown complete")

@app.get("/health")
async def health_check():
    """Health check endpoint with configuration info"""
    config = get_service_config()
    return {
        "status": "healthy", 
        "service": config.service_name,
        "version": config.version,
        "port": config.port,
        "prompt_service_url": config.prompt_service_url,
        "consul_enabled": config.consul_enabled,
        "workflow_integration": config.enable_workflow_integration,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/templates")
async def list_templates(
    template_manager: AnalysisTemplateManager = Depends(get_template_manager)
):
    """List available analysis templates"""
    try:
        templates = template_manager.list_templates()
        return {
            "templates": templates,
            "count": len(templates),
            "statistics": template_manager.get_statistics()
        }
    except Exception as e:
        logger.error(f"Error listing templates: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/templates/{template_id}")
async def get_template(
    template_id: str,
    template_manager: AnalysisTemplateManager = Depends(get_template_manager)
):
    """Get a specific analysis template"""
    try:
        template = template_manager.get_template(template_id)
        if template is None:
            raise HTTPException(status_code=404, detail=f"Template '{template_id}' not found")
        return template
    except Exception as e:
        logger.error(f"Error getting template {template_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze", response_model=AnalysisAPIResponse)
async def analyze(
    request: AnalysisAPIRequest,
    template_manager: AnalysisTemplateManager = Depends(get_template_manager),
    prompt_compiler: AnalysisPromptCompiler = Depends(get_prompt_compiler),
    analysis_processor: AnalysisProcessor = Depends(get_analysis_processor)
):
    """Execute an analysis with the specified prompt and analysis template"""
    try:
        # Create analysis request
        analysis_request = AnalysisRequest(
            prompt_id=request.prompt_reference,
            analysis_template_id=request.analysis_reference,
            variables=request.context_variables,
            context_data=request.metadata,
            max_tokens=None,  # Use default
            temperature=0.3   # Use default for analysis consistency
        )
        
        # Compile the prompt with analysis injection
        logger.info(f"Compiling prompt for analysis: {request.analysis_reference}")
        compiled_prompt = prompt_compiler.compile_analysis_prompt(analysis_request)
        
        # Process the analysis
        logger.info(f"Processing analysis with template: {request.analysis_reference}")
        processed_analysis = await analysis_processor.process_analysis(compiled_prompt)
        
        # Execute full analysis with insights and metrics
        execution = await analysis_processor.execute_analysis(processed_analysis)
        
        return AnalysisAPIResponse(
            execution_id=execution.execution_id,
            status="completed",
            analysis=processed_analysis,
            execution=execution
        )
        
    except Exception as e:
        logger.error(f"Error during analysis: {e}")
        return AnalysisAPIResponse(
            execution_id="error",
            status="failed",
            error=str(e)
        )

@app.post("/workflow/analyze", response_model=AnalysisAPIResponse)
async def workflow_analyze(
    request: WorkflowAnalysisRequest,
    template_manager: AnalysisTemplateManager = Depends(get_template_manager),
    prompt_compiler: AnalysisPromptCompiler = Depends(get_prompt_compiler),
    analysis_processor: AnalysisProcessor = Depends(get_analysis_processor)
):
    """Execute analysis as part of a BPMN workflow"""
    try:
        # Create workflow model
        workflow = AnalysisWorkflow(
            workflow_id=request.workflow_id,
            task_id=request.task_id,
            prompt_reference=request.prompt_reference,
            analysis_reference=request.analysis_reference,
            process_variables=request.process_variables,
            task_variables=request.task_variables,
            execution_result=None,    # Will be populated after execution
            error_details=None,       # No errors initially
            started_at=datetime.now(), # Mark start time
            completed_at=None         # Will be set when completed
        )
        
        # Merge process and task variables for context
        context_variables = {**request.process_variables, **request.task_variables}
        
        # Create analysis request
        analysis_request = AnalysisRequest(
            prompt_id=request.prompt_reference,
            analysis_template_id=request.analysis_reference,
            variables=context_variables,
            context_data={
                "workflow_id": request.workflow_id,
                "task_id": request.task_id,
                "source": "bpmn_workflow"
            },
            max_tokens=None,    # Use default
            temperature=0.3     # Use default for analysis consistency
        )
        
        # Compile and process
        logger.info(f"Processing workflow analysis for {request.workflow_id}/{request.task_id}")
        compiled_prompt = prompt_compiler.compile_analysis_prompt(analysis_request)
        processed_analysis = await analysis_processor.process_analysis(compiled_prompt)
        execution = await analysis_processor.execute_analysis(processed_analysis)
        
        return AnalysisAPIResponse(
            execution_id=execution.execution_id,
            status="completed",
            execution=execution
        )
        
    except Exception as e:
        logger.error(f"Error during workflow analysis: {e}")
        return AnalysisAPIResponse(
            execution_id="error",
            status="failed",
            error=str(e)
        )

@app.post("/analyze/integrated", response_model=IntegratedAnalysisResponse)
async def integrated_analysis(
    request: IntegratedAnalysisRequest,
    orchestrator: IntegratedAnalysisOrchestrator = Depends(get_orchestrator)
):
    """Execute integrated analysis using LLM, Python execution, and other services"""
    try:
        logger.info(f"Starting integrated analysis: {request.analysis_type}")
        
        # Execute complete analysis workflow
        result = await orchestrator.execute_complete_analysis(request.dict())
        
        return IntegratedAnalysisResponse(
            execution_id=result["execution_id"],
            status=result["status"],
            llm_analysis=result.get("llm_analysis"),
            computational_results=result.get("computational_results"),
            final_insights=result.get("final_insights"),
            execution_metadata=result.get("execution_metadata"),
            error=result.get("error")
        )
        
    except Exception as e:
        logger.error(f"Integrated analysis failed: {e}")
        return IntegratedAnalysisResponse(
            execution_id=f"error_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            status="failed",
            error=str(e)
        )

@app.post("/analyze/computational")
async def computational_analysis(
    request: Dict[str, Any],
    orchestrator: IntegratedAnalysisOrchestrator = Depends(get_orchestrator)
):
    """Execute computational analysis using Python execution service"""
    try:
        # Extract Python code from request
        python_code = request.get("python_code", "")
        if not python_code:
            raise HTTPException(status_code=400, detail="No Python code provided")
        
        # Execute Python analysis
        result = await orchestrator.python_integration.execute_python_code(
            code=python_code,
            environment=request.get("environment", "scientific"),
            timeout=request.get("timeout", 300),
            packages=request.get("packages", []),
            data_sources=request.get("data_sources", {})
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Computational analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/executions/{execution_id}")
async def get_execution(execution_id: str):
    """Get analysis execution results (placeholder for future implementation)"""
    # This would typically query a database or cache for stored execution results
    return {"message": f"Execution {execution_id} lookup not implemented yet"}

@app.get("/statistics")
async def get_statistics(
    template_manager: AnalysisTemplateManager = Depends(get_template_manager)
):
    """Get service statistics"""
    return {
        "template_statistics": template_manager.get_statistics(),
        "service_info": {
            "status": "running",
            "version": "1.0.0",
            "features": [
                "template_management",
                "prompt_compilation",
                "analysis_processing", 
                "workflow_integration",
                "llm_simulation"
            ]
        }
    }

@app.get("/debug/config")
async def get_debug_config():
    """Get effective configuration for debugging"""
    from config_manager import get_config_manager
    try:
        config_manager = get_config_manager()
        effective_config = config_manager.get_effective_config()
        
        # Remove sensitive information
        safe_config = {k: v for k, v in effective_config.items() 
                      if not any(sensitive in k.lower() for sensitive in ['password', 'key', 'secret', 'token'])}
        
        return {
            "effective_configuration": safe_config,
            "config_sources": {
                "config_file": config_manager.config_file,
                "env_prefix": config_manager.env_prefix,
                "environment_variables_found": [
                    key for key in os.environ.keys() 
                    if key.startswith('ANALYSIS_') or key in [
                        'PROMPT_SERVICE_URL', 'CAMUNDA_URL', 'CONSUL_URL'
                    ]
                ]
            }
        }
    except Exception as e:
        logger.error(f"Failed to get debug config: {e}")
        raise HTTPException(status_code=500, detail=f"Configuration error: {str(e)}")

@app.get("/debug/connectivity")
async def check_connectivity():
    """Check connectivity to external services"""
    config = get_service_config()
    discovery = get_service_discovery()
    
    results = {}
    
    # Test prompt service connectivity
    try:
        prompt_url = discovery.discover_prompt_service()
        import requests
        response = requests.get(f"{prompt_url}/health", timeout=5)
        results["prompt_service"] = {
            "url": prompt_url,
            "status": "connected" if response.status_code == 200 else "error",
            "response_code": response.status_code
        }
    except Exception as e:
        results["prompt_service"] = {
            "url": config.prompt_service_url,
            "status": "error",
            "error": str(e)
        }
    
    # Test Consul connectivity (if enabled)
    if config.consul_enabled:
        try:
            import requests
            consul_url = f"{config.consul_url}/v1/status/leader"
            response = requests.get(consul_url, timeout=5)
            results["consul"] = {
                "url": config.consul_url,
                "status": "connected" if response.status_code == 200 else "error",
                "response_code": response.status_code
            }
        except Exception as e:
            results["consul"] = {
                "url": config.consul_url,
                "status": "error", 
                "error": str(e)
            }
    else:
        results["consul"] = {
            "status": "disabled",
            "enabled": False
        }
    
    return {
        "connectivity_check": results,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    config = get_service_config()
    logger.info(f"Starting {config.service_name} on port {config.port}")
    uvicorn.run(app, host="0.0.0.0", port=config.port)
