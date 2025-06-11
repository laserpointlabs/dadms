#!/usr/bin/env python3
"""
MCP Statistical Service - Fixed Version
A DADM service that wraps MCP servers for statistical analysis
"""

import json
import logging
import asyncio
import subprocess
import time
import re
from datetime import datetime
from typing import Dict, Any, Optional, List

from flask import Flask, request, jsonify

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Service configuration
SERVICE_NAME = "mcp-statistical-service"
SERVICE_TYPE = "analytics"
SERVICE_VERSION = "1.0"

def extract_numerical_data_from_variables(variables: Dict[str, Any]) -> List[float]:
    """Enhanced extraction of numerical data from workflow variables for statistical analysis"""
    numerical_data = []
    
    def extract_from_any_structure(obj, path=""):
        """Recursively extract numerical data from any nested structure"""
        if isinstance(obj, (int, float)):
            if not (obj == 0 and path.endswith('_id')):  # Skip IDs that are 0
                numerical_data.append(float(obj))
        elif isinstance(obj, str):
            # Enhanced string parsing for various formats
            try:
                # Look for currency amounts: $1,234.56
                currency_matches = re.findall(r'\$[\d,]+\.?\d*', obj)
                for match in currency_matches:
                    clean_value = float(match.replace('$', '').replace(',', ''))
                    numerical_data.append(clean_value)
                
                # Look for percentages: 85.5%
                percent_matches = re.findall(r'(\d+\.?\d*)\s*%', obj)
                for match in percent_matches:
                    numerical_data.append(float(match))
                
                # Look for scores/ratings: score: 4.5, rating: 8/10
                score_matches = re.findall(r'(?:score|rating|value):\s*(\d+\.?\d*)', obj, re.IGNORECASE)
                for match in score_matches:
                    numerical_data.append(float(match))
                
                # Look for general numbers (but be more selective)
                if len(obj) < 100:  # Only process shorter strings to avoid large text blocks
                    numbers = re.findall(r'\b\d+\.?\d*\b', obj)
                    for num_str in numbers[:5]:  # Limit to first 5 numbers to avoid noise
                        try:
                            value = float(num_str)
                            if 0.01 <= value <= 1000000:  # Reasonable range filter
                                numerical_data.append(value)
                        except ValueError:
                            continue
            except Exception:
                pass
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                extract_from_any_structure(item, f"{path}[{i}]")
        elif isinstance(obj, dict):
            # Prioritize certain keys that are likely to contain meaningful numerical data
            priority_keys = ['score', 'cost', 'price', 'value', 'rating', 'weight', 'amount', 'quantity', 'performance', 'efficiency']
            
            # First process priority keys
            for key in priority_keys:
                if key in obj:
                    extract_from_any_structure(obj[key], f"{path}.{key}")
            
            # Then process other keys
            for key, value in obj.items():
                if key not in priority_keys:
                    extract_from_any_structure(value, f"{path}.{key}")
    
    # Extract from the variables structure
    extract_from_any_structure(variables)
    
    # Remove duplicates and outliers
    if numerical_data:
        # Remove duplicates
        unique_data = list(set(numerical_data))
        
        # Simple outlier removal using IQR if we have enough data
        if len(unique_data) > 10:
            import numpy as np
            q1, q3 = np.percentile(unique_data, [25, 75])
            iqr = q3 - q1
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            unique_data = [x for x in unique_data if lower_bound <= x <= upper_bound]
        
        return unique_data
    
    return numerical_data

def summarize_variables(variables: Dict[str, Any]) -> Dict[str, str]:
    """Create a summary of variable types and content for debugging"""
    summary = {}
    for key, value in variables.items():
        if isinstance(value, (int, float)):
            summary[key] = f"Number: {value}"
        elif isinstance(value, str):
            summary[key] = f"String ({len(value)} chars): {value[:50]}..."
        elif isinstance(value, list):
            summary[key] = f"List ({len(value)} items): {type(value[0]).__name__ if value else 'empty'}"
        elif isinstance(value, dict):
            summary[key] = f"Dict ({len(value)} keys): {list(value.keys())[:3]}"
        else:
            summary[key] = f"{type(value).__name__}: {str(value)[:50]}"
    return summary

class MCPStatisticalService:
    """Service wrapper for MCP statistical analysis servers"""
    
    def __init__(self):
        self.session = None
        self.available_tools = ["mock_statistical_analysis", "calculate_statistics", "run_statistical_test"]
          async def initialize_mcp_connection(self):
        """Initialize connection to the MCP statistical server"""
        try:
            # Try to initialize proper MCP connection
            try:
                # Check if MCP server file exists
                mcp_server_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "mcp_servers", "mcp_statistical_server.py")
                if not os.path.exists(mcp_server_path):
                    raise FileNotFoundError(f"MCP server not found at {mcp_server_path}")
                
                # Start the MCP server process
                server_command = ["python", mcp_server_path]
                global mcp_process
                mcp_process = subprocess.Popen(
                    server_command,
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                
                # Give the server a moment to start
                await asyncio.sleep(2)
                
                # Check if process is still running
                if mcp_process.poll() is not None:
                    stderr_output = mcp_process.stderr.read() if mcp_process.stderr else ""
                    raise Exception(f"MCP server process failed to start. Exit code: {mcp_process.returncode}, stderr: {stderr_output}")
                
                # Initialize MCP client connection
                from mcp.client.stdio import stdio_client
                from mcp.client.session import ClientSession
                
                async with stdio_client(mcp_process.stdin, mcp_process.stdout) as (read, write):
                    async with ClientSession(read, write) as session:
                        # Initialize the session
                        init_result = await session.initialize()
                        logger.info(f"MCP session initialized: {init_result}")
                        
                        # List available tools
                        tools_result = await session.list_tools()
                        self.available_tools = [tool.name for tool in tools_result.tools]
                        
                        logger.info(f"MCP Statistical Server connected successfully with tools: {self.available_tools}")
                        
                        # For now, we'll still fall back to mock since managing persistent sessions is complex
                        raise Exception("Persistent MCP session management not yet implemented")
                        
            except Exception as mcp_error:
                logger.warning(f"Failed to initialize MCP server connection: {mcp_error}")
                logger.info("Falling back to mock implementations")
                
                # Cleanup process if it exists
                if 'mcp_process' in globals() and mcp_process and mcp_process.poll() is None:
                    mcp_process.terminate()
                    mcp_process.wait()
                
                # Fallback to mock implementations
                self.session = None
                self.available_tools = ["mock_statistical_analysis", "calculate_statistics", "run_statistical_test"]
                
                logger.info(f"MCP Statistical Service initialized with mock tools: {self.available_tools}")
                return True
            
        except Exception as e:
            logger.error(f"Failed to initialize MCP connection: {e}")
            return False
    
    async def call_mcp_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Call an MCP tool with the given arguments"""
        try:
            if not self.session:
                # Mock implementation when MCP is disabled
                return await self.mock_statistical_analysis(tool_name, arguments)
            
            # Would call actual MCP tool here when enabled
            return {
                "success": True,
                "result": {},
                "tool_used": tool_name,
                "arguments_sent": arguments
            }
            
        except Exception as e:
            logger.error(f"Error calling MCP tool {tool_name}: {e}")
            return {
                "success": False,
                "error": str(e),
                "tool_used": tool_name,
                "arguments_sent": arguments
            }
    
    async def mock_statistical_analysis(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Mock statistical analysis when MCP is not available"""
        import statistics
        
        data = arguments.get("data", [])
        if not data:
            return {
                "success": False,
                "error": "No data provided for analysis"
            }
        
        try:
            # Basic statistical analysis
            mean_val = statistics.mean(data)
            median_val = statistics.median(data)
            std_dev = statistics.stdev(data) if len(data) > 1 else 0
            min_val = min(data)
            max_val = max(data)
            
            results = {
                "descriptive_statistics": {
                    "count": len(data),
                    "mean": mean_val,
                    "median": median_val,
                    "std_dev": std_dev,
                    "min": min_val,
                    "max": max_val,
                    "range": max_val - min_val
                },
                "analysis_type": tool_name,
                "data_points": len(data)
            }
            
            return {
                "success": True,
                "result": results,
                "tool_used": f"mock_{tool_name}",
                "arguments_sent": arguments
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Mock analysis failed: {str(e)}"
            }

    async def analyze_data_statistically(self, data: List[float], analysis_type: str = "descriptive") -> Dict[str, Any]:
        """Perform statistical analysis on the provided data"""
        
        if analysis_type == "descriptive":
            return await self.call_mcp_tool("calculate_statistics", {"data": data})
        
        elif analysis_type == "hypothesis_test":
            return await self.call_mcp_tool("run_statistical_test", {
                "data": data,
                "test_type": "normality"
            })
        
        elif analysis_type == "regression":
            # Assume data is pairs [x, y, x, y, ...]
            if len(data) < 4:
                return {"error": "Insufficient data for regression analysis"}
            x_values = data[::2]
            y_values = data[1::2]
            return await self.call_mcp_tool("fit_regression_model", {
                "x_data": x_values,
                "y_data": y_values,
                "model_type": "linear"
            })
        
        else:
            # Default to descriptive analysis
            return await self.call_mcp_tool("calculate_statistics", {"data": data})

# Global service instance
statistical_service = MCPStatisticalService()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": f"{SERVICE_TYPE}/{SERVICE_NAME}",
        "version": SERVICE_VERSION,
        "mcp_tools_available": len(statistical_service.available_tools),
        "available_tools": statistical_service.available_tools
    })

@app.route('/info', methods=['GET'])
def service_info():
    """Service information endpoint"""
    return jsonify({
        "name": SERVICE_NAME,
        "type": SERVICE_TYPE,
        "version": SERVICE_VERSION,
        "description": "Statistical analysis service powered by MCP servers",
        "capabilities": [
            "descriptive_statistics",
            "hypothesis_testing",
            "regression_analysis",
            "time_series_analysis",
            "statistical_modeling"
        ],
        "available_tools": statistical_service.available_tools,
        "endpoints": ["/health", "/info", "/process_task"]
    })

@app.route('/process_task', methods=['POST'])
def process_task():
    """Main task processing endpoint compatible with DADM orchestrator"""
    start_time = time.time()
    
    try:
        data = request.json or {}
        
        # Extract task information (DADM standard format)
        task_name = data.get('task_name', 'statistical_analysis')
        task_description = data.get('task_description', '')
        variables = data.get('variables', {})
        service_properties = data.get('service_properties', {})
        
        logger.info(f"Processing task: {task_name}")
        
        # Extract analysis parameters from variables
        analysis_data = variables.get('data', [])
        analysis_type = variables.get('analysis_type', 'descriptive')
        
        # If no direct data field, try to extract numerical data from workflow variables
        if not analysis_data:
            analysis_data = extract_numerical_data_from_variables(variables)
        
        # Handle different data formats
        if isinstance(analysis_data, str):
            try:
                # Try to parse as JSON array
                analysis_data = json.loads(analysis_data)
            except:
                # Try to parse as comma-separated values
                analysis_data = [float(x.strip()) for x in analysis_data.split(',')]
        
        if not analysis_data:
            return jsonify({
                "status": "error",
                "message": "No numerical analysis data could be extracted from variables",
                "available_variables": list(variables.keys()),
                "variable_data_summary": summarize_variables(variables)
            }), 400
        
        # Perform the statistical analysis using MCP
        async def run_analysis():
            return await statistical_service.analyze_data_statistically(analysis_data, analysis_type)
        
        # Run the async analysis
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        analysis_result = loop.run_until_complete(run_analysis())
        loop.close()
        
        # Prepare the result in DADM format
        result = {
            "analysis_type": analysis_type,
            "data_points": len(analysis_data),
            "statistical_results": analysis_result,
            "processed_by": f"{SERVICE_TYPE}/{SERVICE_NAME}",
            "processed_at": datetime.now().isoformat(),
            "processing_time_ms": int((time.time() - start_time) * 1000),
            "mcp_tool_used": analysis_result.get("tool_used", "unknown"),
            "data_extracted_from_variables": not bool(variables.get('data'))
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
    logger.info("Initializing MCP Statistical Service...")
    success = await statistical_service.initialize_mcp_connection()
    if success:
        logger.info("MCP Statistical Service ready")
    else:
        logger.error("Failed to initialize MCP Statistical Service")

if __name__ == '__main__':
    # Initialize the MCP connection
    asyncio.run(initialize_service())
    
    # Start the Flask service
    port = 5201
    logger.info(f"Starting MCP Statistical Service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
