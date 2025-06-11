#!/usr/bin/env python3
"""
MCP Script Execution Server
Implementation of an MCP server for executing mathematical scripts (Python, R, Scilab)
"""

import asyncio
import json
import logging
import os
import subprocess
import sys
import tempfile
import uuid
from typing import Any, Sequence, Dict, List
import shutil

from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.types import (
    Resource, Tool, TextContent, ImageContent, EmbeddedResource
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mcp-script-execution-server")

# Create the server
server = Server("mcp-script-execution-server")

class ScriptExecutor:
    """Safe script execution with sandboxing"""
    
    def __init__(self, sandbox_mode: bool = True):
        self.sandbox_mode = sandbox_mode
        self.temp_dir = tempfile.mkdtemp(prefix="mcp_scripts_")
        self.execution_timeout = 30  # seconds
        
    def __del__(self):
        """Cleanup temporary directory"""
        if hasattr(self, 'temp_dir') and os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir, ignore_errors=True)    
            
    def execute_python_script(self, script: str, data: Dict = None) -> Dict[str, Any]:
        """Execute Python script with optional data input"""
        if data is None:
            data = {}
            
        script_id = str(uuid.uuid4())[:8]
        script_file = os.path.join(self.temp_dir, f"script_{script_id}.py")
        
        try:
            # Prepare the script with data injection if provided
            if data:
                data_import = f"import json\nscript_data = {json.dumps(data)}\n\n"
                full_script = data_import + script
            else:
                full_script = script
            
            # Add safety imports and restrictions
            safety_header = """
import sys
import os
# Restrict dangerous operations in sandbox mode
if os.environ.get('MCP_SANDBOX_MODE', 'true').lower() == 'true':
    # Disable file system operations outside temp directory
    original_open = open
    def safe_open(filename, *args, **kwargs):
        if isinstance(filename, str):
            abs_path = os.path.abspath(filename)
            temp_path = os.path.abspath(os.environ.get('MCP_TEMP_DIR', '/tmp'))
            if not abs_path.startswith(temp_path):
                raise PermissionError(f"File access denied: {filename}")
        return original_open(filename, *args, **kwargs)
    __builtins__['open'] = safe_open

"""
            
            if self.sandbox_mode:
                full_script = safety_header + full_script
            
            # Write script to temporary file
            with open(script_file, 'w') as f:
                f.write(full_script)
            
            # Execute script
            env = os.environ.copy()
            env['MCP_SANDBOX_MODE'] = 'true' if self.sandbox_mode else 'false'
            env['MCP_TEMP_DIR'] = self.temp_dir
            result = subprocess.run(
                [sys.executable, script_file],
                capture_output=True,
                text=True,
                timeout=self.execution_timeout,
                cwd=self.temp_dir,
                env=env
            )
            
            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "return_code": result.returncode,
                "script_id": script_id,
                "language": "python"
            }
            
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": f"Script execution timed out after {self.execution_timeout} seconds",
                "script_id": script_id,
                "language": "python"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "script_id": script_id,
                "language": "python"
            }
        finally:
            # Cleanup script file
            if os.path.exists(script_file):
                os.remove(script_file)
    
    def execute_r_script(self, script: str, data: Dict = None) -> Dict[str, Any]:
        """Execute R script with optional data input"""
        script_id = str(uuid.uuid4())[:8]
        script_file = os.path.join(self.temp_dir, f"script_{script_id}.R")
        
        try:
            # Prepare the script with data injection if provided
            if data:
                # Convert Python data to R format
                data_header = "# Data provided by MCP\n"
                for key, value in data.items():
                    if isinstance(value, list):
                        r_vector = "c(" + ", ".join(map(str, value)) + ")"
                        data_header += f"{key} <- {r_vector}\n"
                    else:
                        data_header += f"{key} <- {value}\n"
                data_header += "\n"
                full_script = data_header + script
            else:
                full_script = script
            
            # Write script to temporary file
            with open(script_file, 'w') as f:
                f.write(full_script)
            
            # Execute R script
            result = subprocess.run(
                ["Rscript", script_file],
                capture_output=True,
                text=True,
                timeout=self.execution_timeout,
                cwd=self.temp_dir
            )
            
            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "return_code": result.returncode,
                "script_id": script_id,
                "language": "R"
            }
            
        except FileNotFoundError:
            return {
                "success": False,
                "error": "R (Rscript) not found. Please install R to use R script execution.",
                "script_id": script_id,
                "language": "R"
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": f"Script execution timed out after {self.execution_timeout} seconds",
                "script_id": script_id,
                "language": "R"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "script_id": script_id,
                "language": "R"
            }
        finally:
            # Cleanup script file
            if os.path.exists(script_file):
                os.remove(script_file)
    
    def execute_scilab_script(self, script: str, data: Dict = None) -> Dict[str, Any]:
        """Execute Scilab script with optional data input"""
        script_id = str(uuid.uuid4())[:8]
        script_file = os.path.join(self.temp_dir, f"script_{script_id}.sce")
        
        try:
            # Prepare the script with data injection if provided
            if data:
                data_header = "// Data provided by MCP\n"
                for key, value in data.items():
                    if isinstance(value, list):
                        scilab_vector = "[" + " ".join(map(str, value)) + "]"
                        data_header += f"{key} = {scilab_vector};\n"
                    else:
                        data_header += f"{key} = {value};\n"
                data_header += "\n"
                full_script = data_header + script
            else:
                full_script = script
            
            # Write script to temporary file
            with open(script_file, 'w') as f:
                f.write(full_script)
            
            # Execute Scilab script
            result = subprocess.run(
                ["scilab", "-nw", "-f", script_file],
                capture_output=True,
                text=True,
                timeout=self.execution_timeout,
                cwd=self.temp_dir
            )
            
            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "return_code": result.returncode,
                "script_id": script_id,
                "language": "scilab"
            }
            
        except FileNotFoundError:
            return {
                "success": False,
                "error": "Scilab not found. Please install Scilab to use Scilab script execution.",
                "script_id": script_id,
                "language": "scilab"
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": f"Script execution timed out after {self.execution_timeout} seconds",
                "script_id": script_id,
                "language": "scilab"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "script_id": script_id,
                "language": "scilab"
            }
        finally:
            # Cleanup script file
            if os.path.exists(script_file):
                os.remove(script_file)

# Global executor instance
script_executor = ScriptExecutor(sandbox_mode=True)

@server.list_tools()
async def handle_list_tools() -> list[Tool]:
    """List available script execution tools"""
    return [
        Tool(
            name="execute_python_script",
            description="Execute a Python script for mathematical computations",
            inputSchema={
                "type": "object",
                "properties": {
                    "script": {
                        "type": "string",
                        "description": "Python script code to execute"
                    },
                    "data": {
                        "type": "object",
                        "description": "Optional data to pass to the script as 'script_data' variable"
                    },
                    "timeout": {
                        "type": "integer",
                        "description": "Execution timeout in seconds",
                        "default": 30
                    }
                },
                "required": ["script"]
            }
        ),
        Tool(
            name="execute_r_script",
            description="Execute an R script for statistical analysis",
            inputSchema={
                "type": "object",
                "properties": {
                    "script": {
                        "type": "string",
                        "description": "R script code to execute"
                    },
                    "data": {
                        "type": "object",
                        "description": "Optional data to pass to the script as variables"
                    },
                    "timeout": {
                        "type": "integer",
                        "description": "Execution timeout in seconds",
                        "default": 30
                    }
                },
                "required": ["script"]
            }
        ),
        Tool(
            name="execute_scilab_script",
            description="Execute a Scilab script for numerical computations",
            inputSchema={
                "type": "object",
                "properties": {
                    "script": {
                        "type": "string",
                        "description": "Scilab script code to execute"
                    },
                    "data": {
                        "type": "object",
                        "description": "Optional data to pass to the script as variables"
                    },
                    "timeout": {
                        "type": "integer",
                        "description": "Execution timeout in seconds",
                        "default": 30
                    }
                },
                "required": ["script"]
            }
        ),
        Tool(
            name="optimize_function",
            description="Optimize a mathematical function using scipy.optimize",
            inputSchema={
                "type": "object",
                "properties": {
                    "objective_function": {
                        "type": "string",
                        "description": "Python function definition to optimize (e.g., 'def f(x): return x**2 + 5*x + 6')"
                    },
                    "initial_guess": {
                        "type": "array",
                        "items": {"type": "number"},
                        "description": "Initial guess for optimization variables"
                    },
                    "constraints": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of constraint functions",
                        "default": []
                    },
                    "method": {
                        "type": "string",
                        "enum": ["BFGS", "L-BFGS-B", "SLSQP", "trust-constr"],
                        "description": "Optimization method",
                        "default": "BFGS"
                    }
                },
                "required": ["objective_function", "initial_guess"]
            }
        ),
        Tool(
            name="run_simulation",
            description="Run a Monte Carlo simulation",
            inputSchema={
                "type": "object",
                "properties": {
                    "simulation_script": {
                        "type": "string",
                        "description": "Python script that defines the simulation (should return results)"
                    },
                    "iterations": {
                        "type": "integer",
                        "description": "Number of simulation iterations",
                        "default": 1000
                    },
                    "parameters": {
                        "type": "object",
                        "description": "Simulation parameters"
                    }
                },
                "required": ["simulation_script"]
            }
        )
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> list[TextContent]:
    """Handle tool calls"""
    global script_executor
    
    try:
        if name == "execute_python_script":
            script = arguments["script"]
            data = arguments.get("data")
            timeout = arguments.get("timeout", 30)
            script_executor.execution_timeout = timeout
            result = script_executor.execute_python_script(script, data)
            
        elif name == "execute_r_script":
            script = arguments["script"]
            data = arguments.get("data")
            timeout = arguments.get("timeout", 30)
            script_executor.execution_timeout = timeout
            result = script_executor.execute_r_script(script, data)
            
        elif name == "execute_scilab_script":
            script = arguments["script"]
            data = arguments.get("data")
            timeout = arguments.get("timeout", 30)
            script_executor.execution_timeout = timeout
            result = script_executor.execute_scilab_script(script, data)
            
        elif name == "optimize_function":
            # Create optimization script
            objective_func = arguments["objective_function"]
            initial_guess = arguments["initial_guess"]
            constraints = arguments.get("constraints", [])
            method = arguments.get("method", "BFGS")
            
            optimization_script = f"""
import numpy as np
from scipy import optimize
import json

{objective_func}

initial_guess = {initial_guess}
method = "{method}"

try:
    result = optimize.minimize(f, initial_guess, method=method)
    
    optimization_result = {{
        "success": result.success,
        "optimal_value": float(result.fun),
        "optimal_point": result.x.tolist(),
        "iterations": int(result.nit) if hasattr(result, 'nit') else None,
        "message": result.message,
        "method_used": method
    }}
    
    print(json.dumps(optimization_result, indent=2))
    
except Exception as e:
    error_result = {{
        "success": False,
        "error": str(e),
        "method_used": method
    }}
    print(json.dumps(error_result, indent=2))
"""
            
            result = script_executor.execute_python_script(optimization_script)
            
        elif name == "run_simulation":
            simulation_script = arguments["simulation_script"]
            iterations = arguments.get("iterations", 1000)
            parameters = arguments.get("parameters", {})
            
            # Create Monte Carlo simulation wrapper
            simulation_wrapper = f"""
import numpy as np
import json
from scipy import stats

# Simulation parameters
iterations = {iterations}
parameters = {json.dumps(parameters)}

# User-provided simulation function
{simulation_script}

# Run simulation
results = []
for i in range(iterations):
    try:
        # Call user simulation function
        result = simulate_once(parameters) if 'simulate_once' in locals() else eval(simulation_script)
        results.append(result)
    except Exception as e:
        print(f"Error in iteration {{i}}: {{e}}")
        break

# Analyze results
if results:
    results_array = np.array(results)
    
    simulation_analysis = {{
        "iterations_completed": len(results),
        "mean": float(np.mean(results_array)),
        "std": float(np.std(results_array)),
        "min": float(np.min(results_array)),
        "max": float(np.max(results_array)),
        "percentiles": {{
            "5th": float(np.percentile(results_array, 5)),
            "25th": float(np.percentile(results_array, 25)),
            "50th": float(np.percentile(results_array, 50)),
            "75th": float(np.percentile(results_array, 75)),
            "95th": float(np.percentile(results_array, 95))
        }},
        "sample_results": results[:10]  # First 10 results as examples
    }}
    
    print(json.dumps(simulation_analysis, indent=2))
else:
    print(json.dumps({{"error": "No simulation results generated"}}, indent=2))
"""
            
            result = script_executor.execute_python_script(simulation_wrapper)
            
        else:
            result = {"error": f"Unknown tool: {name}"}
        
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
        
    except Exception as e:
        error_result = {"error": str(e), "tool": name, "arguments": arguments}
        return [TextContent(type="text", text=json.dumps(error_result, indent=2))]

async def main():
    """Main server entry point"""
    import sys
    from mcp.server.stdio import stdio_server
    
    logger.info("Starting MCP Script Execution Server")
    
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="mcp-script-execution-server",
                server_version="1.0.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )

if __name__ == "__main__":
    asyncio.run(main())
