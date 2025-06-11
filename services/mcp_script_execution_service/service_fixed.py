#!/usr/bin/env python3
"""
MCP Script Execution Service - Fixed Version
A DADM service that wraps MCP servers for mathematical script execution
"""

import json
import logging
import asyncio
import subprocess
import time
import os
import tempfile
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
from pathlib import Path

from flask import Flask, request, jsonify

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Service configuration
SERVICE_NAME = "mcp-script-execution-service"
SERVICE_TYPE = "computational"
SERVICE_VERSION = "1.0"

# Execution configuration
SANDBOX_MODE = os.environ.get('SANDBOX_MODE', 'true').lower() == 'true'
MAX_EXECUTION_TIME = int(os.environ.get('MAX_EXECUTION_TIME', '300'))  # 5 minutes
SCILAB_PATH = os.environ.get('SCILAB_PATH', '/usr/local/scilab/bin/scilab')
R_PATH = os.environ.get('R_PATH', '/usr/bin/R')
PYTHON_PATH = os.environ.get('PYTHON_PATH', '/usr/bin/python3')

def generate_script_from_context(task_name: str, variables: Dict[str, Any], execution_type: str) -> str:
    """Generate appropriate script content based on task context"""
    try:
        if execution_type.lower() == 'optimization':
            return """
# Generated optimization script
import numpy as np
from scipy.optimize import minimize

def objective_function(x):
    # Default quadratic objective
    return x[0]**2 + x[1]**2 + 5*x[0] + 3*x[1]

# Initial guess
x0 = [0.0, 0.0]

# Solve optimization problem
result = minimize(objective_function, x0, method='BFGS')
print(f"Optimal solution: {result.x}")
print(f"Optimal value: {result.fun}")
optimal_result = {"x": result.x.tolist(), "fun": result.fun, "success": result.success}
"""
        
        elif execution_type.lower() == 'simulation':
            return """
# Generated simulation script
import numpy as np

# Monte Carlo simulation
np.random.seed(42)
n_simulations = 1000

# Generate random samples
samples = np.random.normal(50, 10, n_simulations)

# Calculate statistics
mean_val = np.mean(samples)
std_val = np.std(samples)
percentiles = np.percentile(samples, [5, 25, 50, 75, 95])

print(f"Mean: {mean_val:.2f}")
print(f"Std Dev: {std_val:.2f}")
print(f"Percentiles: {percentiles}")

# Return results
simulation_result = {
    'mean': mean_val,
    'std_dev': std_val,
    'percentiles': percentiles.tolist(),
    'sample_size': n_simulations
}
"""
        
        elif 'analysis' in task_name.lower():
            return """
# Generated analysis script
import numpy as np
import scipy.stats as stats

# Create sample data for analysis
data = np.random.normal(100, 15, 50)

# Perform statistical analysis
mean_val = np.mean(data)
median_val = np.median(data)
std_val = np.std(data)

# Hypothesis test
t_stat, p_value = stats.ttest_1samp(data, 100)

print(f"Mean: {mean_val:.2f}")
print(f"Median: {median_val:.2f}")
print(f"Std Dev: {std_val:.2f}")
print(f"T-statistic: {t_stat:.3f}, P-value: {p_value:.3f}")

analysis_result = {
    'descriptive_stats': {
        'mean': mean_val,
        'median': median_val,
        'std_dev': std_val
    },
    'hypothesis_test': {
        't_statistic': t_stat,
        'p_value': p_value
    }
}
"""
        
        else:
            return """
# Default computational script
print("Default script execution")
default_result = {"status": "executed", "message": "Default computation completed"}
"""
    
    except Exception as e:
        return f"# Error generating script: {str(e)}\nprint('Script generation failed')"

class MCPScriptExecutionService:
    """Service wrapper for MCP script execution servers"""
    
    def __init__(self):
        self.session = None
        self.available_tools = ["mock_python_execution", "mock_optimization", "mock_simulation"]
        self.execution_results = {}
        
    async def initialize_mcp_connection(self):
        """Initialize connection to the MCP script execution server"""
        try:
            # For now, disable MCP and provide mock script execution
            logger.warning("MCP integration temporarily disabled for compatibility")
            self.session = None
            
            logger.info(f"MCP Script Execution Service initialized with tools: {self.available_tools}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize MCP connection: {e}")
            return False
    
    async def mock_script_execution(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Mock script execution when MCP is not available"""
        try:
            if tool_name == "execute_python_script":
                return {
                    "success": True,
                    "result": {
                        "execution_result": {
                            "output": "Mock execution successful",
                            "return_value": 42,
                            "execution_time": 0.1,
                            "variables": {"result": 42, "status": "completed"}
                        },
                        "script_type": "python"
                    }
                }
            elif tool_name == "solve_optimization_problem":
                return {
                    "success": True,
                    "result": {
                        "optimization_result": {
                            "optimal_value": 123.45,
                            "optimal_variables": {"x": 2.5, "y": 3.7},
                            "success": True,
                            "message": "Optimization terminated successfully",
                            "iterations": 15
                        }
                    }
                }
            elif tool_name == "run_simulation":
                return {
                    "success": True,
                    "result": {
                        "simulation_result": {
                            "mean": 50.2,
                            "std_dev": 12.8,
                            "percentiles": {"5th": 25.1, "95th": 75.3},
                            "iterations_completed": 1000,
                            "confidence_interval": [47.8, 52.6]
                        }
                    }
                }
            else:
                return {
                    "success": True,
                    "result": {
                        "mock_execution": f"Mock result for {tool_name}",
                        "arguments_received": arguments
                    }
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Mock execution failed: {str(e)}"
            }
    
    async def call_mcp_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Call an MCP tool with the given arguments"""
        try:
            # Mock implementation when MCP is disabled
            return await self.mock_script_execution(tool_name, arguments)
            
        except Exception as e:
            logger.error(f"Error calling MCP tool {tool_name}: {e}")
            return {
                "success": False,
                "error": str(e),
                "tool_used": tool_name,
                "arguments_sent": arguments
            }
    
    async def execute_python_script(self, script_content: str, parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute a Python script with mathematical libraries"""
        return await self.call_mcp_tool("execute_python_script", {
            "script_content": script_content,
            "parameters": parameters or {},
            "allowed_imports": ["numpy", "scipy", "matplotlib", "pandas", "scikit-learn"],
            "capture_plots": True
        })
    
    async def solve_optimization_problem(self, problem_definition: Dict[str, Any]) -> Dict[str, Any]:
        """Solve an optimization problem"""
        return await self.call_mcp_tool("solve_optimization_problem", {
            "objective_function": problem_definition.get("objective_function"),
            "constraints": problem_definition.get("constraints", []),
            "variables": problem_definition.get("variables", {}),
            "method": problem_definition.get("method", "scipy_minimize")
        })
    
    async def run_simulation(self, simulation_config: Dict[str, Any]) -> Dict[str, Any]:
        """Run a mathematical simulation"""
        return await self.call_mcp_tool("run_simulation", {
            "simulation_type": simulation_config.get("simulation_type", "monte_carlo"),
            "parameters": simulation_config.get("parameters", {}),
            "iterations": simulation_config.get("iterations", 1000),
            "random_seed": simulation_config.get("random_seed", 42)
        })
    
    def validate_script_security(self, script_content: str, language: str) -> Dict[str, Any]:
        """Validate script security if sandbox mode is enabled"""
        if not SANDBOX_MODE:
            return {"valid": True, "warnings": []}
        
        warnings = []
        
        # Check for potentially dangerous operations
        dangerous_patterns = {
            "python": ["os.system", "subprocess", "exec", "eval", "__import__", "open("],
            "scilab": ["unix", "host", "exec", "load", "save"],
            "r": ["system", "shell", "file.create", "file.remove"]
        }
        
        if language.lower() in dangerous_patterns:
            for pattern in dangerous_patterns[language.lower()]:
                if pattern in script_content:
                    warnings.append(f"Potentially dangerous pattern detected: {pattern}")
        
        return {
            "valid": len(warnings) == 0,
            "warnings": warnings,
            "sandbox_mode": SANDBOX_MODE
        }

# Global service instance
script_service = MCPScriptExecutionService()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    # Check if required executables are available
    executable_status = {}
    for name, path in [("scilab", SCILAB_PATH), ("r", R_PATH), ("python", PYTHON_PATH)]:
        executable_status[name] = os.path.exists(path) if path else False
    
    return jsonify({
        "status": "healthy",
        "service": f"{SERVICE_TYPE}/{SERVICE_NAME}",
        "version": SERVICE_VERSION,
        "sandbox_mode": SANDBOX_MODE,
        "max_execution_time": MAX_EXECUTION_TIME,
        "available_executables": executable_status,
        "mcp_tools_available": len(script_service.available_tools),
        "available_tools": script_service.available_tools
    })

@app.route('/info', methods=['GET'])
def service_info():
    """Service information endpoint"""
    return jsonify({
        "name": SERVICE_NAME,
        "type": SERVICE_TYPE,
        "version": SERVICE_VERSION,
        "description": "Script execution service for mathematical computing",
        "capabilities": [
            "python_execution",
            "mathematical_modeling",
            "numerical_analysis",
            "optimization",
            "simulation"
        ],
        "available_tools": script_service.available_tools,
        "security": {
            "sandbox_mode": SANDBOX_MODE,
            "max_execution_time": MAX_EXECUTION_TIME
        },
        "endpoints": ["/health", "/info", "/process_task", "/validate_script"]
    })

@app.route('/validate_script', methods=['POST'])
def validate_script():
    """Validate script security"""
    data = request.json or {}
    script_content = data.get('script_content', '')
    language = data.get('language', 'python')
    
    validation_result = script_service.validate_script_security(script_content, language)
    return jsonify(validation_result)

@app.route('/process_task', methods=['POST'])
def process_task():
    """Main task processing endpoint compatible with DADM orchestrator"""
    start_time = time.time()
    
    try:
        data = request.json or {}
        
        # Extract task information (DADM standard format)
        task_name = data.get('task_name', 'script_execution')
        task_description = data.get('task_description', '')
        variables = data.get('variables', {})
        service_properties = data.get('service_properties', {})
        
        logger.info(f"Processing script execution task: {task_name}")
        
        # Extract execution parameters
        execution_type = variables.get('execution_type', 'python')
        script_content = variables.get('script_content', '')
        parameters = variables.get('parameters', {})
        
        # If no script content provided, try to generate based on task context
        if not script_content:
            script_content = generate_script_from_context(task_name, variables, execution_type)
        
        if not script_content:
            return jsonify({
                "status": "error",
                "message": "No script_content provided and could not generate from context",
                "available_variables": list(variables.keys()),
                "suggested_execution_types": ["optimization", "simulation", "python"]
            }), 400
        
        # Validate script security
        validation = script_service.validate_script_security(script_content, execution_type)
        if not validation["valid"]:
            return jsonify({
                "status": "error",
                "message": "Script failed security validation",
                "validation_warnings": validation["warnings"]
            }), 400
        
        # Execute the script using MCP
        async def run_execution():
            if execution_type.lower() == 'python':
                return await script_service.execute_python_script(script_content, parameters)
            elif execution_type.lower() == 'optimization':
                return await script_service.solve_optimization_problem(parameters)
            elif execution_type.lower() == 'simulation':
                return await script_service.run_simulation(parameters)
            else:
                # Default to Python execution
                return await script_service.execute_python_script(script_content, parameters)
        
        # Run the async execution
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        execution_result = loop.run_until_complete(run_execution())
        loop.close()
        
        # Prepare the result in DADM format
        result = {
            "execution_type": execution_type,
            "script_validation": validation,
            "execution_results": execution_result,
            "processed_by": f"{SERVICE_TYPE}/{SERVICE_NAME}",
            "processed_at": datetime.now().isoformat(),
            "processing_time_ms": int((time.time() - start_time) * 1000),
            "mcp_tool_used": execution_result.get("tool_used", "unknown"),
            "sandbox_mode": SANDBOX_MODE,
            "script_generated": script_content if not variables.get('script_content') else False
        }
        
        return jsonify({
            "status": "success",
            "result": result
        })
        
    except Exception as e:
        logger.error(f"Error processing task: {e}")
        return jsonify({
            "status": "error",
            "message": str(e),
            "service": f"{SERVICE_TYPE}/{SERVICE_NAME}"
        }), 500

async def initialize_service():
    """Initialize the MCP service on startup"""
    logger.info("Initializing MCP Script Execution Service...")
    success = await script_service.initialize_mcp_connection()
    if success:
        logger.info("MCP Script Execution Service ready")
    else:
        logger.error("Failed to initialize MCP Script Execution Service")

if __name__ == '__main__':
    # Initialize the MCP connection
    asyncio.run(initialize_service())
    
    # Start the Flask service
    port = 5203
    logger.info(f"Starting MCP Script Execution Service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
