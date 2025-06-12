"""
LLM-MCP Pipeline Service

A streamlined service that orchestrates LLM and MCP interactions through a unified pipeline.
This service allows you to define:
1. LLM service to use
2. MCP server that the LLM can use
3. Tools and necessary format for analysis

This creates a clean separation between the pipeline orchestration and the detailed
BPMN modeling, allowing complex LLM-MCP workflows to be called as simple service tasks.
"""

import json
import logging
import requests
import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from urllib.parse import urljoin

from src.mcp_service_handler import MCPServiceHandler
from config.service_registry import get_service_registry

logger = logging.getLogger(__name__)


@dataclass
class LLMConfig:
    """Configuration for LLM service"""
    service_name: str
    service_type: str = "assistant"
    model: str = "gpt-4o"
    endpoint: str = ""
    timeout: int = 120


@dataclass 
class MCPConfig:
    """Configuration for MCP server"""
    server_name: str
    service_name: str
    tools: List[str] = field(default_factory=list)
    endpoint: str = ""
    timeout: int = 60


@dataclass
class PipelineConfig:
    """Configuration for the LLM-MCP pipeline"""
    pipeline_name: str
    llm_config: LLMConfig
    mcp_config: MCPConfig
    output_format: str = "json"  # json, text, structured
    analysis_type: str = "comprehensive"
    enable_reasoning: bool = True
    enable_mathematical_analysis: bool = True


class LLMMCPPipelineService:
    """
    Streamlined service for orchestrating LLM and MCP interactions.
    
    This service provides a high-level interface for creating pipelines that:
    1. Use an LLM for reasoning and interpretation
    2. Use MCP servers for mathematical/analytical computations
    3. Combine results in the specified format
    """
    
    def __init__(self):
        self.mcp_handler = MCPServiceHandler()
        self.service_registry = get_service_registry()
        self.predefined_pipelines = self._initialize_pipelines()
    
    def _initialize_pipelines(self) -> Dict[str, PipelineConfig]:
        """Initialize predefined pipeline configurations"""
        return {
            "decision_analysis": PipelineConfig(
                pipeline_name="decision_analysis",
                llm_config=LLMConfig(
                    service_name="dadm-openai-assistant",
                    service_type="assistant",
                    endpoint="http://localhost:5000"
                ),
                mcp_config=MCPConfig(
                    server_name="statistical",
                    service_name="mcp-statistical-service",
                    tools=["calculate_statistics", "run_statistical_test"],
                    endpoint="http://localhost:5201"
                ),
                output_format="structured",
                analysis_type="decision_analysis"
            ),
            
            "stakeholder_analysis": PipelineConfig(
                pipeline_name="stakeholder_analysis",
                llm_config=LLMConfig(
                    service_name="dadm-openai-assistant",
                    service_type="assistant",
                    endpoint="http://localhost:5000"
                ),
                mcp_config=MCPConfig(
                    server_name="neo4j",
                    service_name="mcp-neo4j-service",
                    tools=["calculate_centrality", "community_detection"],
                    endpoint="http://localhost:5202"
                ),
                output_format="structured",
                analysis_type="stakeholder_network_analysis"
            ),
            
            "optimization_analysis": PipelineConfig(
                pipeline_name="optimization_analysis", 
                llm_config=LLMConfig(
                    service_name="dadm-openai-assistant",
                    service_type="assistant",
                    endpoint="http://localhost:5000"
                ),
                mcp_config=MCPConfig(
                    server_name="script_execution",
                    service_name="mcp-script-execution-service",
                    tools=["optimize_function", "monte_carlo_simulation"],
                    endpoint="http://localhost:5203"
                ),
                output_format="structured",
                analysis_type="optimization_analysis"
            )
        }
    
    def create_custom_pipeline(self, pipeline_config: PipelineConfig) -> str:
        """
        Create a custom pipeline configuration.
        
        Args:
            pipeline_config: Configuration for the custom pipeline
            
        Returns:
            Pipeline ID for future reference
        """
        pipeline_id = f"custom_{pipeline_config.pipeline_name}_{int(time.time())}"
        self.predefined_pipelines[pipeline_id] = pipeline_config
        
        logger.info(f"Created custom pipeline: {pipeline_id}")
        return pipeline_id
    
    def _create_custom_pipeline_config(self, variables: Dict[str, Any]) -> PipelineConfig:
        """
        Create a custom pipeline configuration based on provided variables.
        
        Args:
            variables: Task variables that specify the custom pipeline requirements
            
        Returns:
            PipelineConfig for the custom pipeline
        """
        # Extract custom configuration from variables
        tools = variables.get("tools", [])
        analysis_type = variables.get("analysis_type", "custom")
        
        # Determine MCP service based on tools requested
        mcp_service_mapping = {
            "statistical_mcp_service": {
                "server_name": "statistical",
                "service_name": "mcp-statistical-service", 
                "endpoint": "http://localhost:5201",
                "tools": ["calculate_statistics", "run_statistical_test", "enhanced_statistical_analysis"]
            },
            "neo4j_mcp_service": {
                "server_name": "neo4j",
                "service_name": "mcp-neo4j-service",
                "endpoint": "http://localhost:5202", 
                "tools": ["calculate_centrality", "community_detection", "path_analysis"]
            },
            "script_execution_mcp_service": {
                "server_name": "script_execution",
                "service_name": "mcp-script-execution-service",
                "endpoint": "http://localhost:5203",
                "tools": ["execute_python_script", "solve_optimization_problem", "run_simulation"]
            },
            "openai_service": {
                "server_name": "openai",
                "service_name": "dadm-openai-assistant",
                "endpoint": "http://localhost:5200",
                "tools": ["reasoning", "analysis", "interpretation"]
            }
        }
        
        # Select appropriate MCP service based on requested tools
        selected_mcp = None
        for service_key, service_config in mcp_service_mapping.items():
            if service_key in tools or any(tool in service_config["tools"] for tool in tools):
                selected_mcp = service_config
                break
        
        # Default to statistical service if no specific service found
        if not selected_mcp:
            selected_mcp = mcp_service_mapping["statistical_mcp_service"]
        
        # Create custom pipeline configuration
        return PipelineConfig(
            pipeline_name="custom",
            llm_config=LLMConfig(
                service_name="dadm-openai-assistant",
                service_type="assistant",
                endpoint="http://localhost:5000"
            ),
            mcp_config=MCPConfig(
                server_name=selected_mcp["server_name"],
                service_name=selected_mcp["service_name"],
                tools=tools if tools else selected_mcp["tools"][:2],  # Use requested tools or first 2 default
                endpoint=selected_mcp["endpoint"]
            ),
            output_format=variables.get("output_format", "structured"),
            analysis_type=analysis_type,
            enable_reasoning=variables.get("enable_reasoning", True),
            enable_mathematical_analysis=variables.get("enable_mathematical_analysis", True)
        )

    def execute_pipeline(self, pipeline_name: str, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a complete LLM-MCP pipeline.
        
        Args:
            pipeline_name: Name of the pipeline to execute
            task_data: Task data including variables, context, etc.
            
        Returns:
            Combined results from LLM and MCP analysis
        """
        # Handle custom pipeline creation
        if pipeline_name == "custom":
            variables = task_data.get("variables", task_data)
            config = self._create_custom_pipeline_config(variables)
            logger.info(f"Created custom pipeline configuration for analysis_type: {config.analysis_type}")
        elif pipeline_name not in self.predefined_pipelines:
            raise ValueError(f"Pipeline '{pipeline_name}' not found")
        else:
            config = self.predefined_pipelines[pipeline_name]
        
        logger.info(f"Executing pipeline: {pipeline_name}")
        
        try:
            # Step 1: Execute MCP analysis if enabled
            mcp_results = None
            if config.enable_mathematical_analysis:
                mcp_results = self._execute_mcp_analysis(config.mcp_config, task_data)
                logger.info(f"MCP analysis completed for {config.mcp_config.server_name}")
            
            # Step 2: Execute LLM reasoning/interpretation
            llm_results = None
            if config.enable_reasoning:
                # Prepare enhanced task data with MCP results
                enhanced_task_data = task_data.copy()
                if mcp_results:
                    enhanced_task_data["mcp_analysis_results"] = mcp_results
                    enhanced_task_data["mathematical_analysis"] = mcp_results
                
                llm_results = self._execute_llm_analysis(config.llm_config, enhanced_task_data, config)
                logger.info(f"LLM analysis completed using {config.llm_config.service_name}")
            
            # Step 3: Combine and format results
            combined_results = self._combine_results(
                llm_results, mcp_results, config, task_data
            )
            
            return {
                "status": "success",
                "pipeline": pipeline_name,
                "results": combined_results,
                "timestamp": time.time(),
                "config_used": {
                    "llm_service": config.llm_config.service_name,
                    "mcp_service": config.mcp_config.service_name,
                    "output_format": config.output_format
                }
            }
            
        except Exception as e:
            logger.error(f"Pipeline execution failed: {e}")
            return {
                "status": "error",
                "pipeline": pipeline_name,
                "error": str(e),
                "timestamp": time.time()
            }
    
    def _execute_mcp_analysis(self, mcp_config: MCPConfig, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute MCP analysis using the specified configuration"""
        
        # Get service configuration from registry
        service_config = self.service_registry.get("mcp", {}).get(mcp_config.service_name, {})
        service_config["name"] = mcp_config.service_name
        service_config["endpoint"] = mcp_config.endpoint
        
        # Prepare MCP properties
        properties = {
            "service.type": "mcp",
            "service.name": mcp_config.service_name,
            "mcp.server": mcp_config.server_name,
            "mcp.tools": ",".join(mcp_config.tools)
        }
        
        # Create a mock task for MCP handler
        class MockTask:
            def get_activity_id(self):
                return f"pipeline_mcp_{mcp_config.server_name}"
        
        task = MockTask()
        
        # Execute MCP analysis
        result = self.mcp_handler.route_mcp_task(task, task_data, service_config, properties)
        
        return result
    
    def _execute_llm_analysis(self, llm_config: LLMConfig, task_data: Dict[str, Any], 
                             pipeline_config: PipelineConfig) -> Dict[str, Any]:
        """Execute LLM analysis with the specified configuration"""
        
        # Prepare LLM request
        llm_payload = {
            "task_name": f"Pipeline Analysis: {pipeline_config.pipeline_name}",
            "task_documentation": self._generate_llm_instructions(pipeline_config, task_data),
            "variables": task_data,
            "process_instance_id": task_data.get("process_instance_id")
        }
        
        # Make request to LLM service
        url = urljoin(llm_config.endpoint, '/process_task')
        
        try:
            response = requests.post(url, json=llm_payload, timeout=llm_config.timeout)
            
            if response.status_code == 200:
                return response.json().get("result", {})
            else:
                raise Exception(f"LLM service returned {response.status_code}: {response.text}")
                
        except requests.RequestException as e:
            raise Exception(f"Failed to connect to LLM service: {e}")
    
    def _generate_llm_instructions(self, config: PipelineConfig, task_data: Dict[str, Any]) -> str:
        """Generate instructions for the LLM based on pipeline configuration"""
        
        instructions = f"""
You are executing a {config.analysis_type} pipeline. Your task is to:

1. ANALYZE the provided data and context
2. INTERPRET any mathematical/analytical results if provided
3. PROVIDE insights and recommendations
4. FORMAT your response according to the specified output format: {config.output_format}

"""
        
        if "mcp_analysis_results" in task_data:
            instructions += """
MATHEMATICAL ANALYSIS RESULTS ARE PROVIDED:
The mathematical analysis has been completed using specialized MCP servers.
Your role is to interpret these results and provide meaningful insights.

"""
        
        if config.output_format == "structured":
            instructions += """
OUTPUT FORMAT: Provide a structured JSON response with the following sections:
- summary: Brief overview of the analysis
- key_findings: List of important discoveries
- recommendations: Actionable recommendations
- mathematical_insights: Interpretation of any quantitative results
- confidence_level: Your confidence in the analysis (high/medium/low)
- next_steps: Suggested follow-up actions

"""
        elif config.output_format == "json":
            instructions += """
OUTPUT FORMAT: Provide a valid JSON response with your analysis results.

"""
        else:
            instructions += """
OUTPUT FORMAT: Provide a clear, well-structured text response.

"""
        
        return instructions
    
    def _combine_results(self, llm_results: Optional[Dict], mcp_results: Optional[Dict], 
                        config: PipelineConfig, original_task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Combine LLM and MCP results according to the pipeline configuration"""
        
        combined = {
            "analysis_type": config.analysis_type,
            "pipeline_name": config.pipeline_name,
            "output_format": config.output_format
        }
        
        # Add LLM results
        if llm_results:
            combined["llm_analysis"] = llm_results
            combined["reasoning"] = llm_results.get("recommendation", "")
            combined["processed_by"] = llm_results.get("processed_by", "LLM")
        
        # Add MCP results
        if mcp_results:
            combined["mathematical_analysis"] = mcp_results
            combined["mcp_service_info"] = mcp_results.get("mcp_service_info", {})
            combined["computational_results"] = mcp_results.get("result", {})
        
        # Add metadata
        combined["metadata"] = {
            "llm_enabled": config.enable_reasoning,
            "mcp_enabled": config.enable_mathematical_analysis,
            "llm_service": config.llm_config.service_name,
            "mcp_service": config.mcp_config.service_name,
            "tools_used": config.mcp_config.tools,
            "original_task_variables": list(original_task_data.keys())
        }
        
        return combined
    
    def get_available_pipelines(self) -> Dict[str, Dict[str, Any]]:
        """Get information about all available pipelines"""
        
        pipelines_info = {}
        
        for name, config in self.predefined_pipelines.items():
            pipelines_info[name] = {
                "pipeline_name": config.pipeline_name,
                "analysis_type": config.analysis_type,
                "llm_service": config.llm_config.service_name,
                "mcp_service": config.mcp_config.service_name,
                "mcp_server": config.mcp_config.server_name,
                "tools": config.mcp_config.tools,
                "output_format": config.output_format,
                "reasoning_enabled": config.enable_reasoning,
                "mathematical_analysis_enabled": config.enable_mathematical_analysis
            }
        
        return pipelines_info
    
    def validate_pipeline_config(self, config: PipelineConfig) -> Dict[str, Any]:
        """Validate a pipeline configuration"""
        
        validation_result = {
            "valid": True,
            "issues": [],
            "warnings": []
        }
        
        # Check LLM service availability
        try:
            llm_response = requests.get(f"{config.llm_config.endpoint}/health", timeout=5)
            if llm_response.status_code != 200:
                validation_result["issues"].append(f"LLM service not responding: {config.llm_config.endpoint}")
                validation_result["valid"] = False
        except Exception as e:
            validation_result["issues"].append(f"Cannot reach LLM service: {e}")
            validation_result["valid"] = False
        
        # Check MCP service availability
        try:
            mcp_response = requests.get(f"{config.mcp_config.endpoint}/health", timeout=5)
            if mcp_response.status_code != 200:
                validation_result["issues"].append(f"MCP service not responding: {config.mcp_config.endpoint}")
                validation_result["valid"] = False
        except Exception as e:
            validation_result["issues"].append(f"Cannot reach MCP service: {e}")
            validation_result["valid"] = False
        
        # Check tool availability
        if config.mcp_config.tools:
            try:
                service_config = {"endpoint": config.mcp_config.endpoint, "name": config.mcp_config.service_name}
                service_info = self.mcp_handler.discover_tools(service_config)
                available_tools = list(service_info.tools.keys())
                
                missing_tools = [tool for tool in config.mcp_config.tools if tool not in available_tools]
                if missing_tools:
                    validation_result["warnings"].append(f"Tools not found in MCP service: {missing_tools}")
                    validation_result["warnings"].append(f"Available tools: {available_tools}")
                    
            except Exception as e:
                validation_result["warnings"].append(f"Could not verify tool availability: {e}")
        
        return validation_result


# Factory function for easy instantiation
def create_pipeline_service() -> LLMMCPPipelineService:
    """Create and return a configured LLM-MCP Pipeline Service"""
    return LLMMCPPipelineService()


# Service endpoint wrapper for DADM integration
class PipelineServiceEndpoint:
    """
    HTTP service endpoint wrapper for the LLM-MCP Pipeline Service.
    This allows the pipeline service to be called from BPMN as a regular service task.
    """
    
    def __init__(self):
        self.pipeline_service = create_pipeline_service()
    
    def process_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a task using the pipeline service.
        
        Expected task_data format:
        {
            "pipeline_name": "decision_analysis",
            "variables": {...},
            "custom_config": {...} (optional)
        }
        """
        
        pipeline_name = task_data.get("pipeline_name", "decision_analysis")
        variables = task_data.get("variables", {})
        custom_config = task_data.get("custom_config")
        
        # Create custom pipeline if configuration is provided
        if custom_config:
            try:
                config = PipelineConfig(**custom_config)
                pipeline_name = self.pipeline_service.create_custom_pipeline(config)
            except Exception as e:
                return {
                    "status": "error",
                    "message": f"Invalid custom configuration: {e}"
                }
        
        # Execute the pipeline
        return self.pipeline_service.execute_pipeline(pipeline_name, variables)
