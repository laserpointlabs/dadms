"""
LLM-MCP Pipeline HTTP Service

This service exposes the LLM-MCP Pipeline functionality as an HTTP API,
allowing it to be called from BPMN workflows or other services.
"""

import os
import sys
import json
import logging
from flask import Flask, request, jsonify
from datetime import datetime

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from src.llm_mcp_pipeline_service import LLMMCPPipelineService, PipelineConfig, LLMConfig, MCPConfig

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)

# Initialize pipeline service
pipeline_service = LLMMCPPipelineService()


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "llm-mcp-pipeline",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "available_pipelines": len(pipeline_service.predefined_pipelines)
    })


@app.route('/info', methods=['GET'])
def info():
    """Service information endpoint"""
    pipelines = pipeline_service.get_available_pipelines()
    
    return jsonify({
        "service_name": "LLM-MCP Pipeline Service",
        "description": "Streamlined service for orchestrating LLM and MCP interactions",
        "version": "1.0.0",
        "capabilities": [
            "decision_analysis",
            "stakeholder_analysis", 
            "optimization_analysis",
            "custom_pipeline_creation"
        ],
        "endpoints": {
            "/health": "Health check",
            "/info": "Service information",
            "/process_task": "Execute pipeline",
            "/pipelines": "List available pipelines",
            "/pipelines/validate": "Validate pipeline configuration",
            "/pipelines/create": "Create custom pipeline"
        },
        "available_pipelines": pipelines
    })


@app.route('/pipelines', methods=['GET'])
def list_pipelines():
    """List all available pipelines"""
    try:
        pipelines = pipeline_service.get_available_pipelines()
        return jsonify({
            "status": "success",
            "pipelines": pipelines,
            "count": len(pipelines)
        })
    except Exception as e:
        logger.error(f"Error listing pipelines: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route('/pipelines/validate', methods=['POST'])
def validate_pipeline():
    """Validate a pipeline configuration"""
    try:
        data = request.json
        if not data:
            return jsonify({
                "status": "error",
                "message": "Request body is required"
            }), 400
        
        # Parse configuration
        config = PipelineConfig(
            pipeline_name=data.get("pipeline_name", "custom"),
            llm_config=LLMConfig(**data.get("llm_config", {})),
            mcp_config=MCPConfig(**data.get("mcp_config", {})),
            output_format=data.get("output_format", "json"),
            analysis_type=data.get("analysis_type", "custom"),
            enable_reasoning=data.get("enable_reasoning", True),
            enable_mathematical_analysis=data.get("enable_mathematical_analysis", True)
        )
        
        # Validate configuration
        validation_result = pipeline_service.validate_pipeline_config(config)
        
        return jsonify({
            "status": "success",
            "validation": validation_result
        })
        
    except Exception as e:
        logger.error(f"Error validating pipeline: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route('/pipelines/create', methods=['POST'])
def create_custom_pipeline():
    """Create a custom pipeline"""
    try:
        data = request.json
        if not data:
            return jsonify({
                "status": "error",
                "message": "Request body is required"
            }), 400
        
        # Parse configuration
        config = PipelineConfig(
            pipeline_name=data.get("pipeline_name", "custom"),
            llm_config=LLMConfig(**data.get("llm_config", {})),
            mcp_config=MCPConfig(**data.get("mcp_config", {})),
            output_format=data.get("output_format", "json"),
            analysis_type=data.get("analysis_type", "custom"),
            enable_reasoning=data.get("enable_reasoning", True),
            enable_mathematical_analysis=data.get("enable_mathematical_analysis", True)
        )
        
        # Validate first
        validation_result = pipeline_service.validate_pipeline_config(config)
        if not validation_result["valid"]:
            return jsonify({
                "status": "error",
                "message": "Pipeline configuration is invalid",
                "validation": validation_result
            }), 400
        
        # Create pipeline
        pipeline_id = pipeline_service.create_custom_pipeline(config)
        
        return jsonify({
            "status": "success",
            "pipeline_id": pipeline_id,
            "message": f"Custom pipeline '{pipeline_id}' created successfully",
            "validation": validation_result
        })
        
    except Exception as e:
        logger.error(f"Error creating pipeline: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route('/process_task', methods=['POST'])
def process_task():
    """
    Main endpoint for processing tasks using LLM-MCP pipelines.
    
    Expected request format:
    {
        "task_name": "Analysis Task",
        "task_description": "Analyze decision alternatives",
        "variables": {
            "data": [...],
            "criteria": [...],
            "alternatives": [...]
        },
        "pipeline_name": "decision_analysis", // optional, defaults to decision_analysis
        "custom_config": {...}, // optional, for custom pipelines
        "process_instance_id": "proc_123" // optional, for tracking
    }
    """
    try:
        data = request.json
        if not data:
            return jsonify({
                "status": "error",
                "message": "Request body is required"
            }), 400
        
        # Extract parameters
        task_name = data.get("task_name", "Pipeline Task")
        task_description = data.get("task_description", "")
        variables = data.get("variables", {})
        pipeline_name = data.get("pipeline_name", "decision_analysis")
        custom_config = data.get("custom_config")
        process_instance_id = data.get("process_instance_id")
        
        # Prepare task data for pipeline
        task_data = {
            "task_name": task_name,
            "task_description": task_description,
            "process_instance_id": process_instance_id,
            **variables  # Merge variables into task data
        }
        
        # Handle custom pipeline creation
        if custom_config:
            try:
                config = PipelineConfig(
                    pipeline_name=custom_config.get("pipeline_name", "custom"),
                    llm_config=LLMConfig(**custom_config.get("llm_config", {})),
                    mcp_config=MCPConfig(**custom_config.get("mcp_config", {})),
                    output_format=custom_config.get("output_format", "json"),
                    analysis_type=custom_config.get("analysis_type", "custom"),
                    enable_reasoning=custom_config.get("enable_reasoning", True),
                    enable_mathematical_analysis=custom_config.get("enable_mathematical_analysis", True)
                )
                
                # Validate configuration
                validation_result = pipeline_service.validate_pipeline_config(config)
                if not validation_result["valid"]:
                    return jsonify({
                        "status": "error",
                        "message": "Custom pipeline configuration is invalid",
                        "validation": validation_result
                    }), 400
                
                # Create and use custom pipeline
                pipeline_name = pipeline_service.create_custom_pipeline(config)
                logger.info(f"Created and using custom pipeline: {pipeline_name}")
                
            except Exception as e:
                return jsonify({
                    "status": "error",
                    "message": f"Invalid custom configuration: {e}"
                }), 400
        
        # Execute the pipeline
        logger.info(f"Executing pipeline '{pipeline_name}' for task '{task_name}'")
        result = pipeline_service.execute_pipeline(pipeline_name, task_data)
        
        # Format response for DADM compatibility
        if result["status"] == "success":
            return jsonify({
                "status": "success",
                "result": result["results"],
                "pipeline_info": {
                    "pipeline_name": result["pipeline"],
                    "config_used": result["config_used"],
                    "timestamp": result["timestamp"]
                },
                "task_info": {
                    "task_name": task_name,
                    "task_description": task_description,
                    "process_instance_id": process_instance_id
                }
            })
        else:
            return jsonify({
                "status": "error",
                "message": result.get("error", "Pipeline execution failed"),
                "pipeline": result.get("pipeline"),
                "timestamp": result.get("timestamp")
            }), 500
            
    except Exception as e:
        logger.error(f"Error processing task: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route('/pipelines/<pipeline_name>/execute', methods=['POST'])
def execute_specific_pipeline(pipeline_name):
    """Execute a specific pipeline by name"""
    try:
        data = request.json or {}
        
        # Execute the pipeline
        result = pipeline_service.execute_pipeline(pipeline_name, data)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error executing pipeline {pipeline_name}: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


if __name__ == '__main__':
    # Get configuration from environment
    port = int(os.environ.get('PORT', 5204))
    host = os.environ.get('HOST', '0.0.0.0')
    debug = os.environ.get('DEBUG', 'false').lower() == 'true'
    
    logger.info(f"Starting LLM-MCP Pipeline Service on {host}:{port}")
    logger.info(f"Available pipelines: {list(pipeline_service.predefined_pipelines.keys())}")
    
    # Run the Flask app
    app.run(host=host, port=port, debug=debug)
