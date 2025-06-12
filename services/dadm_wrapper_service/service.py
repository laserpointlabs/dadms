"""
DADM Application Wrapper Service

This service exposes the entire DADM application as a callable service,
allowing Camunda to orchestrate complex pipelines by calling DADM as a service.

This enables the pattern you mentioned:
1. Model detailed pipelines in Camunda BPMN
2. Call DADM application as a service from Camunda service tasks
3. Let Camunda handle the complex orchestration logic
"""

import json
import logging
import subprocess
import os
import sys
import atexit
from flask import Flask, request, jsonify
from datetime import datetime
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# Try to import the pipeline service, fall back to local implementation if not available
try:
    from src.llm_mcp_pipeline_service import LLMMCPPipelineService
except ImportError:
    # Fallback implementation for containerized deployment
    class LLMMCPPipelineService:
        def execute_pipeline(self, pipeline_name: str, variables: dict) -> dict:
            return {
                "status": "success",
                "pipeline_name": pipeline_name,
                "variables": variables,
                "message": "Pipeline executed in standalone mode",
                "fallback": True
            }

# Try to import Consul service registry for service registration
try:
    from services.openai_service.consul_registry import ConsulServiceRegistry
except ImportError:
    ConsulServiceRegistry = None

logger = logging.getLogger(__name__)

def register_with_consul(port: int) -> bool:
    """
    Register the DADM wrapper service with Consul
    
    Args:
        port: The port the service is running on
        
    Returns:
        bool: True if registration was successful, False otherwise
    """
    if not ConsulServiceRegistry:
        logger.info("ConsulServiceRegistry not available - skipping Consul registration")
        return False
        
    # Skip registration if USE_CONSUL is false
    use_consul = os.environ.get("USE_CONSUL", "true").lower() == "true"
    if not use_consul:
        logger.info("Consul registration disabled (USE_CONSUL=false)")
        return False
    
    try:
        registry = ConsulServiceRegistry()
        
        # Service configuration
        service_name = "dadm-wrapper-service"
        service_type = os.environ.get("SERVICE_TYPE", "wrapper")
        service_version = "1.0.0"
        
        # Prepare metadata
        metadata = {
            "type": service_type,
            "version": service_version,
            "description": "DADM Application Wrapper Service - Exposes entire DADM application as a callable service",
            "api": "REST",
            "capabilities": "process_execution,pipeline_analysis,custom_analysis,camunda_integration"
        }
        
        # Register the service
        success = registry.register_service(
            name=service_name,
            service_type=service_type,
            port=port,
            tags=["dadm", "wrapper", "application", "orchestration"],
            meta=metadata,
            health_check_path="/health",
            health_check_interval="30s"
        )
        
        if success:
            logger.info(f"✅ Successfully registered {service_name} with Consul")
            
            # Register cleanup function for graceful shutdown
            def deregister_service():
                try:
                    registry.deregister_service(service_name)
                    logger.info(f"✅ Deregistered {service_name} from Consul")
                except Exception as e:
                    logger.warning(f"⚠️ Failed to deregister service: {e}")
            
            atexit.register(deregister_service)
            return True
        else:
            logger.warning(f"⚠️ Failed to register {service_name} with Consul")
            return False
            
    except Exception as e:
        logger.warning(f"⚠️ Error registering service with Consul: {e}")
        return False

class DADMApplicationWrapper:
    """
    Wrapper that exposes DADM application functionality as a service.
    This allows Camunda to call DADM as a service for complex pipeline orchestration.
    """
    
    def __init__(self):
        self.project_root = project_root
        self.pipeline_service = LLMMCPPipelineService()
    
    def execute_dadm_process(self, process_definition: str, process_variables: dict) -> dict:
        """
        Execute a complete DADM process with the given definition and variables.
        
        Args:
            process_definition: BPMN process definition or process ID
            process_variables: Variables to pass to the process
            
        Returns:
            Process execution results
        """
        try:
            # This would start a DADM process instance
            # You could implement this to:
            # 1. Deploy the BPMN process if needed
            # 2. Start a process instance with variables
            # 3. Wait for completion or return process instance ID
            
            logger.info(f"Executing DADM process: {process_definition}")
            
            # For now, we'll simulate by using the pipeline service
            # In a real implementation, you'd start a Camunda process instance
            
            return {
                "status": "success",
                "process_definition": process_definition,
                "process_instance_id": f"proc_{int(datetime.now().timestamp())}",
                "variables": process_variables,
                "message": "DADM process execution simulated"
            }
            
        except Exception as e:
            logger.error(f"Error executing DADM process: {e}")
            return {
                "status": "error",
                "message": str(e),
                "process_definition": process_definition
            }
    
    def execute_analysis_pipeline(self, pipeline_config: dict) -> dict:
        """
        Execute an analysis pipeline using the LLM-MCP pipeline service.
        
        Args:
            pipeline_config: Pipeline configuration and variables
            
        Returns:
            Analysis results
        """
        try:
            pipeline_name = pipeline_config.get("pipeline_name", "decision_analysis")
            variables = pipeline_config.get("variables", {})
            
            # Execute using the pipeline service
            result = self.pipeline_service.execute_pipeline(pipeline_name, variables)
            
            return {
                "status": "success",
                "analysis_type": "pipeline",
                "pipeline_result": result,
                "executed_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error executing analysis pipeline: {e}")
            return {
                "status": "error",
                "message": str(e),
                "analysis_type": "pipeline"
            }
    
    def execute_custom_analysis(self, analysis_config: dict) -> dict:
        """
        Execute custom analysis using DADM capabilities.
        
        Args:
            analysis_config: Analysis configuration
            
        Returns:
            Analysis results
        """
        try:
            analysis_type = analysis_config.get("type", "unknown")
            
            if analysis_type == "pipeline":
                return self.execute_analysis_pipeline(analysis_config)
            elif analysis_type == "process":
                process_def = analysis_config.get("process_definition")
                variables = analysis_config.get("variables", {})
                return self.execute_dadm_process(process_def, variables)
            else:
                return {
                    "status": "error",
                    "message": f"Unknown analysis type: {analysis_type}"
                }
                
        except Exception as e:
            logger.error(f"Error executing custom analysis: {e}")
            return {
                "status": "error",
                "message": str(e)
            }


# Flask application
app = Flask(__name__)
dadm_wrapper = DADMApplicationWrapper()


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "dadm-application-wrapper",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "capabilities": [
            "process_execution",
            "pipeline_analysis", 
            "custom_analysis"
        ]
    })


@app.route('/execute/process', methods=['POST'])
def execute_process():
    """Execute a DADM process"""
    try:
        data = request.json
        process_definition = data.get("process_definition")
        variables = data.get("variables", {})
        
        if not process_definition:
            return jsonify({
                "status": "error",
                "message": "process_definition is required"
            }), 400
        
        result = dadm_wrapper.execute_dadm_process(process_definition, variables)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route('/execute/pipeline', methods=['POST'])
def execute_pipeline():
    """Execute an analysis pipeline"""
    try:
        data = request.json
        result = dadm_wrapper.execute_analysis_pipeline(data)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route('/execute/analysis', methods=['POST'])
def execute_analysis():
    """Execute custom analysis"""
    try:
        data = request.json
        result = dadm_wrapper.execute_custom_analysis(data)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route('/process_task', methods=['POST'])
def process_task():
    """
    Main endpoint for DADM service compatibility.
    Allows this service to be called from Camunda service tasks.
    """
    try:
        data = request.json
        task_name = data.get("task_name", "DADM Analysis")
        task_description = data.get("task_description", "")
        variables = data.get("variables", {})
        
        # Determine what type of execution to perform based on variables
        execution_type = variables.get("execution_type", "pipeline")
        
        if execution_type == "pipeline":
            pipeline_config = {
                "pipeline_name": variables.get("pipeline_name", "decision_analysis"),
                "variables": variables
            }
            result = dadm_wrapper.execute_analysis_pipeline(pipeline_config)
        elif execution_type == "process":
            process_definition = variables.get("process_definition")
            result = dadm_wrapper.execute_dadm_process(process_definition, variables)
        else:
            analysis_config = {
                "type": execution_type,
                **variables
            }
            result = dadm_wrapper.execute_custom_analysis(analysis_config)
        
        return jsonify({
            "status": "success",
            "result": result,
            "task_info": {
                "task_name": task_name,
                "task_description": task_description,
                "execution_type": execution_type
            }
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5205))
    host = os.environ.get('HOST', '0.0.0.0')
    debug = os.environ.get('DEBUG', 'false').lower() == 'true'
    
    # Register with Consul if applicable
    register_with_consul(port)
    
    logger.info(f"Starting DADM Application Wrapper on {host}:{port}")
    app.run(host=host, port=port, debug=debug)
