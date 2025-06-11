#!/usr/bin/env python3
"""
MCP Statistical Service - Enhanced Version
A DADM service that wraps MCP servers for statistical analysis
"""

import json
import logging
import asyncio
import subprocess
import time
import re
import os
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
SERVICE_VERSION = "1.1"

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
            try:
                import numpy as np
                q1, q3 = np.percentile(unique_data, [25, 75])
                iqr = q3 - q1
                lower_bound = q1 - 1.5 * iqr
                upper_bound = q3 + 1.5 * iqr
                unique_data = [x for x in unique_data if lower_bound <= x <= upper_bound]
            except ImportError:
                # If numpy not available, skip outlier removal
                pass
        
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
                if 'mcp_process' in locals() and mcp_process and mcp_process.poll() is None:
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
            result = await self.session.call_tool(tool_name, arguments)
            
            return {
                "success": True,
                "result": result.content,
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
        """Enhanced mock statistical analysis when MCP is not available"""
        try:
            data = arguments.get('data', [])
            analysis_type = arguments.get('analysis_type', 'descriptive')
            
            if not data:
                return {
                    "success": False,
                    "error": "No data provided for statistical analysis"
                }
            
            # Import numpy for calculations (with fallback)
            try:
                import numpy as np
                from scipy import stats
                has_scipy = True
            except ImportError:
                # Fallback to basic calculations
                has_scipy = False
                import statistics as stats_basic
            
            if has_scipy:
                data_array = np.array(data)
                
                # Enhanced descriptive statistics
                result = {
                    "success": True,
                    "result": {
                        "analysis_type": analysis_type,
                        "sample_size": len(data),
                        "descriptive_statistics": {
                            "mean": float(np.mean(data_array)),
                            "median": float(np.median(data_array)),
                            "std_dev": float(np.std(data_array, ddof=1)) if len(data) > 1 else 0.0,
                            "variance": float(np.var(data_array, ddof=1)) if len(data) > 1 else 0.0,
                            "min": float(np.min(data_array)),
                            "max": float(np.max(data_array)),
                            "range": float(np.max(data_array) - np.min(data_array)),
                            "skewness": float(stats.skew(data_array)) if len(data) > 2 else 0.0,
                            "kurtosis": float(stats.kurtosis(data_array)) if len(data) > 3 else 0.0,
                            "quartiles": {
                                "q1": float(np.percentile(data_array, 25)),
                                "q2": float(np.percentile(data_array, 50)),
                                "q3": float(np.percentile(data_array, 75))
                            }
                        },
                        "distribution_tests": {
                            "normality_test": {
                                "shapiro_wilk": stats.shapiro(data_array) if len(data) >= 3 and len(data) <= 5000 else None,
                                "interpretation": "Data appears normally distributed" if len(data) >= 3 and stats.shapiro(data_array)[1] > 0.05 else "Data may not be normally distributed"
                            }
                        } if len(data) >= 3 else {},
                        "confidence_intervals": {
                            "mean_95ci": stats.t.interval(0.95, len(data)-1, loc=np.mean(data_array), scale=stats.sem(data_array)) if len(data) > 1 else None
                        } if len(data) > 1 else {},
                        "analysis_timestamp": datetime.now().isoformat(),
                        "tool_used": tool_name
                    }
                }
            else:
                # Basic fallback calculations
                mean_val = sum(data) / len(data)
                sorted_data = sorted(data)
                n = len(data)
                median_val = sorted_data[n//2] if n % 2 == 1 else (sorted_data[n//2-1] + sorted_data[n//2]) / 2
                
                result = {
                    "success": True,
                    "result": {
                        "analysis_type": analysis_type,
                        "sample_size": len(data),
                        "descriptive_statistics": {
                            "mean": mean_val,
                            "median": median_val,
                            "min": min(data),
                            "max": max(data),
                            "range": max(data) - min(data)
                        },
                        "analysis_timestamp": datetime.now().isoformat(),
                        "tool_used": tool_name,
                        "note": "Limited analysis due to missing scipy/numpy dependencies"
                    }
                }
            
            return result
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Mock statistical analysis failed: {str(e)}"
            }
    
    async def analyze_data_statistically(self, data: List[float], analysis_type: str = "descriptive") -> Dict[str, Any]:
        """Perform statistical analysis on data"""
        return await self.call_mcp_tool("calculate_statistics", {
            "data": data,
            "analysis_type": analysis_type,
            "include_distribution_tests": True,
            "confidence_level": 0.95
        })

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
        "description": "Enhanced statistical analysis service powered by MCP servers",
        "capabilities": [
            "descriptive_statistics",
            "hypothesis_testing",
            "distribution_analysis",
            "confidence_intervals",
            "data_extraction_from_variables",
            "enhanced_numerical_parsing"
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
        
        logger.info(f"Processing enhanced statistical analysis task: {task_name}")
        
        # Extract analysis parameters from variables
        analysis_data = variables.get('data', [])
        analysis_type = variables.get('analysis_type', 'descriptive')
        
        # Enhanced data extraction if no direct data field
        if not analysis_data:
            logger.info("No direct 'data' field found, extracting numerical data from variables")
            analysis_data = extract_numerical_data_from_variables(variables)
            logger.info(f"Extracted {len(analysis_data)} numerical values from variables")
        
        # Handle different data formats
        if isinstance(analysis_data, str):
            try:
                # Try to parse as JSON array
                analysis_data = json.loads(analysis_data)
                logger.info("Parsed data from JSON string")
            except:
                try:
                    # Try to parse as comma-separated values
                    analysis_data = [float(x.strip()) for x in analysis_data.split(',')]
                    logger.info("Parsed data from CSV string")
                except:
                    logger.warning("Failed to parse string data")
                    analysis_data = []
        
        if not analysis_data:
            logger.error("No numerical data could be extracted")
            return jsonify({
                "status": "error",
                "message": "No numerical analysis data could be extracted from variables",
                "available_variables": list(variables.keys()),
                "variable_data_summary": summarize_variables(variables),
                "extraction_suggestions": [
                    "Ensure variables contain numerical values",
                    "Use 'data' field with array of numbers",
                    "Include cost, score, rating, or value fields"
                ]
            }), 400
        
        logger.info(f"Proceeding with statistical analysis on {len(analysis_data)} data points")
        
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
            "data_range": {"min": min(analysis_data), "max": max(analysis_data)} if analysis_data else None,
            "statistical_results": analysis_result,
            "processed_by": f"{SERVICE_TYPE}/{SERVICE_NAME}",
            "processed_at": datetime.now().isoformat(),
            "processing_time_ms": int((time.time() - start_time) * 1000),
            "mcp_tool_used": analysis_result.get("tool_used", "mock_statistical_analysis"),
            "data_extracted_from_variables": not bool(variables.get('data')),
            "extraction_summary": {
                "original_variable_count": len(variables),
                "numerical_values_found": len(analysis_data),
                "extraction_successful": len(analysis_data) > 0
            }
        }
        
        return jsonify({
            "status": "success",
            "result": result
        })
        
    except Exception as e:
        logger.error(f"Error processing enhanced statistical task: {e}")
        return jsonify({
            "status": "error",
            "message": str(e),
            "service": f"{SERVICE_TYPE}/{SERVICE_NAME}"
        }), 500

async def initialize_service():
    """Initialize the MCP service on startup"""
    logger.info("Initializing Enhanced MCP Statistical Service...")
    success = await statistical_service.initialize_mcp_connection()
    if success:
        logger.info("Enhanced MCP Statistical Service ready")
    else:
        logger.error("Failed to initialize Enhanced MCP Statistical Service")

if __name__ == '__main__':
    # Initialize the MCP connection
    asyncio.run(initialize_service())
    
    # Start the Flask service
    port = 5201
    logger.info(f"Starting Enhanced MCP Statistical Service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
