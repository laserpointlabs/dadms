"""
Analysis Service Interface
FastAPI service for handling analysis requests from BPMN workflows
"""

import os
import logging
from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
import asyncio

from models import (
    AnalysisRequest, CompiledAnalysisPrompt, ProcessedAnalysis, 
    AnalysisExecution, AnalysisServiceConfig, AnalysisWorkflow
)
from template_manager import AnalysisTemplateManager
from prompt_compiler import AnalysisPromptCompiler
from analysis_processor import AnalysisProcessor

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

# Global service instances
template_manager: Optional[AnalysisTemplateManager] = None
prompt_compiler: Optional[AnalysisPromptCompiler] = None
analysis_processor: Optional[AnalysisProcessor] = None
service_config: Optional[AnalysisServiceConfig] = None

def get_service_config() -> AnalysisServiceConfig:
    """Get or create service configuration"""
    global service_config
    if service_config is None:
        service_config = AnalysisServiceConfig(
            prompt_service_url=os.getenv("PROMPT_SERVICE_URL", "http://localhost:5300"),
            camunda_base_url=os.getenv("CAMUNDA_URL", "http://dadm-camunda:8080"),
            enable_workflow_integration=True
        )
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
    
    logger.info("Analysis Service initialized successfully")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "dadm-analysis-service"}

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
