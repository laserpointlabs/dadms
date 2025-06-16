#!/usr/bin/env python3
"""
Analysis Script Registry Service
FastAPI service for managing and executing analysis scripts
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
import asyncio
import os
import sys

# Add the service directory to the path for imports
sys.path.append(os.path.dirname(__file__))

from script_registry_manager import AnalysisScriptRegistry

app = FastAPI(
    title="DADM Analysis Script Registry",
    description="Flexible analysis script management and execution service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Global registry instance
registry = None

class AnalysisExecutionRequest(BaseModel):
    """Request model for script execution"""
    script_id: str = Field(..., description="ID of the analysis script to execute")
    input_data: Dict[str, Any] = Field(..., description="Input data for the script")
    context_metadata: Optional[Dict[str, Any]] = Field(None, description="BPMN/thread context metadata")

class AnalysisExecutionResponse(BaseModel):
    """Response model for script execution"""
    status: str = Field(..., description="Execution status")
    script_id: str = Field(..., description="ID of executed script")
    result: Optional[Dict[str, Any]] = Field(None, description="Script execution result")
    error: Optional[str] = Field(None, description="Error message if execution failed")
    execution_metadata: Optional[Dict[str, Any]] = Field(None, description="Execution metadata")

def get_registry() -> AnalysisScriptRegistry:
    """Dependency to get the registry instance"""
    global registry
    if registry is None:
        registry_file = os.path.join(os.path.dirname(__file__), "analysis_scripts_registry.json")
        registry = AnalysisScriptRegistry(registry_file)
    return registry

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "DADM Analysis Script Registry",
        "version": "1.0.0",
        "description": "Flexible analysis script management and execution",
        "endpoints": {
            "scripts": "/scripts",
            "execute": "/execute",
            "schema": "/scripts/{script_id}/schema",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    reg = get_registry()
    return {
        "status": "healthy",
        "service": "dadm-analysis-script-registry",
        "version": "1.0.0",
        "scripts_loaded": len(reg.scripts),
        "timestamp": reg.get_statistics()["last_loaded"]
    }

@app.get("/scripts")
async def list_scripts(category: Optional[str] = None, source_type: Optional[str] = None):
    """List all available analysis scripts with optional filtering"""
    reg = get_registry()
    scripts = reg.list_scripts()
    
    # Apply filters
    if category:
        scripts = [s for s in scripts if s.get("category") == category]
    if source_type:
        scripts = [s for s in scripts if s.get("source_type") == source_type]
    
    return {
        "scripts": scripts,
        "total_count": len(scripts),
        "filters_applied": {
            "category": category,
            "source_type": source_type
        }
    }

@app.get("/scripts/{script_id}")
async def get_script_details(script_id: str):
    """Get detailed information about a specific script"""
    reg = get_registry()
    script_details = reg.get_script_details(script_id)
    
    if not script_details:
        raise HTTPException(status_code=404, detail=f"Script '{script_id}' not found")
    
    return script_details

@app.get("/scripts/{script_id}/schema")
async def get_script_schema(script_id: str):
    """Get input/output schema for a specific script"""
    reg = get_registry()
    schema = reg.get_script_schema(script_id)
    
    if "error" in schema:
        raise HTTPException(status_code=404, detail=schema["error"])
    
    return schema

@app.post("/execute")
async def execute_script(request: AnalysisExecutionRequest):
    """Execute an analysis script"""
    reg = get_registry()
    
    # Merge context metadata into input data
    input_data = request.input_data.copy()
    if request.context_metadata:
        input_data["context_metadata"] = request.context_metadata
    
    # Validate input data
    validation = reg.validate_input_data(request.script_id, input_data)
    if not validation["valid"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Input validation failed: {validation['errors']}"
        )
    
    # Execute the script
    result = await reg.execute_script(request.script_id, input_data)
    
    # Handle execution errors
    if result.get("status") == "error":
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "script_id": request.script_id,
                "error": result.get("error", "Unknown execution error"),
                "execution_metadata": result.get("execution_metadata")
            }
        )
    
    return {
        "status": "success",
        "script_id": request.script_id,
        "result": result,
        "execution_metadata": result.get("execution_metadata")
    }

@app.post("/validate")
async def validate_input(script_id: str, input_data: Dict[str, Any]):
    """Validate input data against a script's schema without executing"""
    reg = get_registry()
    validation = reg.validate_input_data(script_id, input_data)
    
    return {
        "script_id": script_id,
        "validation": validation
    }

@app.get("/statistics")
async def get_statistics():
    """Get registry statistics"""
    reg = get_registry()
    stats = reg.get_statistics()
    
    return {
        "service_info": {
            "status": "running",
            "version": "1.0.0",
            "service_name": "dadm-analysis-script-registry"
        },
        "registry_statistics": stats
    }

@app.get("/categories")
async def get_categories():
    """Get available script categories"""
    reg = get_registry()
    stats = reg.get_statistics()
    
    return {
        "categories": list(stats["categories"].keys()),
        "category_counts": stats["categories"]
    }

@app.get("/source-types")
async def get_source_types():
    """Get available script source types"""
    reg = get_registry()
    stats = reg.get_statistics()
    
    return {
        "source_types": list(stats["source_types"].keys()),
        "source_type_counts": stats["source_types"]
    }

# BPMN Integration endpoints
@app.post("/bpmn/execute")
async def bpmn_execute_script(
    script_id: str,
    input_data: Dict[str, Any],
    service_task_name: Optional[str] = None,
    process_instance_id: Optional[str] = None,
    thread_id: Optional[str] = None
):
    """Execute script with BPMN context (convenience endpoint for BPMN integration)"""
    
    # Build context metadata
    context_metadata = {}
    if service_task_name:
        context_metadata["service_task_name"] = service_task_name
    if process_instance_id:
        context_metadata["process_instance_id"] = process_instance_id
    if thread_id:
        context_metadata["thread_id"] = thread_id
    
    # Create execution request
    request = AnalysisExecutionRequest(
        script_id=script_id,
        input_data=input_data,
        context_metadata=context_metadata if context_metadata else None
    )
    
    return await execute_script(request)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
