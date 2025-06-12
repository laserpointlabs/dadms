#!/usr/bin/env python3
"""
MCP Statistical Service - Fixed Version
A DADM service that provides enhanced statistical analysis with proper data extraction
"""

import json
import logging
import asyncio
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
    """Service wrapper for statistical analysis with enhanced data extraction"""
    
    def __init__(self):
        self.session = None
        self.available_tools = ["enhanced_statistical_analysis", "calculate_statistics", "run_statistical_test"]
        
    async def initialize_connection(self):
        """Initialize the statistical service"""
        try:
            logger.info("Initializing Enhanced MCP Statistical Service...")
            
            # Use enhanced mock implementations for now
            self.session = None
            self.available_tools = ["enhanced_statistical_analysis", "calculate_statistics", "run_statistical_test"]
            
            logger.info(f"MCP Statistical Service initialized with tools: {self.available_tools}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize statistical service: {e}")
            return False
    
    async def perform_statistical_analysis(self, data: List[float], analysis_type: str = "descriptive") -> Dict[str, Any]:
        """Perform enhanced statistical analysis on data"""
        try:
            if not data:
                return {
                    "success": False,
                    "error": "No data provided for statistical analysis"
                }
            
            # Import statistical libraries with fallback
            try:
                import numpy as np
                from scipy import stats
                has_scipy = True
            except ImportError:
                # Fallback to basic calculations
                has_scipy = False
            
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
                        "tool_used": "enhanced_statistical_analysis"
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
                        "tool_used": "basic_statistical_analysis",
                        "note": "Limited analysis due to missing scipy/numpy dependencies"
                    }
                }
            
            return result
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Statistical analysis failed: {str(e)}"
            }

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
        "description": "Enhanced statistical analysis service with advanced data extraction",
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

@app.route('/tools', methods=['GET'])
def get_available_tools():
    """MCP Tools discovery endpoint"""
    return jsonify({
        "tools": [
            {
                "name": "enhanced_statistical_analysis",
                "description": "Perform comprehensive statistical analysis including descriptive statistics, distribution tests, and confidence intervals",
                "parameters": {
                    "data": {
                        "type": "array",
                        "items": {"type": "number"},
                        "description": "Array of numerical values for analysis"
                    },
                    "analysis_type": {
                        "type": "string",
                        "enum": ["descriptive", "inferential", "distribution"],
                        "default": "descriptive",
                        "description": "Type of statistical analysis to perform"
                    },
                    "include_distribution_tests": {
                        "type": "boolean",
                        "default": False,
                        "description": "Whether to include normality and distribution tests"
                    }
                }
            },
            {
                "name": "calculate_statistics",
                "description": "Calculate basic descriptive statistics for numerical data",
                "parameters": {
                    "data": {
                        "type": "array", 
                        "items": {"type": "number"},
                        "description": "Numerical data array"
                    }
                }
            },
            {
                "name": "run_statistical_test",
                "description": "Run specific statistical tests on data",
                "parameters": {
                    "data": {
                        "type": "array",
                        "items": {"type": "number"},
                        "description": "Data for statistical testing"
                    },
                    "test_type": {
                        "type": "string",
                        "enum": ["shapiro", "anderson", "ttest", "mannwhitney"],
                        "description": "Type of statistical test to perform"
                    }
                }
            }
        ],
        "server_info": {
            "name": "mcp-statistical-service",
            "version": SERVICE_VERSION,
            "capabilities": ["statistical_analysis", "data_extraction", "hypothesis_testing"]
        }
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
        logger.info(f"Received variables: {list(variables.keys())}")
        
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
        
        logger.info(f"Proceeding with statistical analysis on {len(analysis_data)} data points: {analysis_data}")
        
        # Perform the statistical analysis
        async def run_analysis():
            return await statistical_service.perform_statistical_analysis(analysis_data, analysis_type)
        
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
            "mcp_tool_used": analysis_result.get("result", {}).get("tool_used", "enhanced_statistical_analysis"),
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
    """Initialize the statistical service on startup"""
    logger.info("Initializing Enhanced MCP Statistical Service...")
    success = await statistical_service.initialize_connection()
    if success:
        logger.info("Enhanced MCP Statistical Service ready")
    else:
        logger.error("Failed to initialize Enhanced MCP Statistical Service")
    
    # Register with Consul if enabled
    try:
        import atexit
        from shared.consul_registry import register_mcp_service_with_consul, deregister_mcp_service_from_consul
        
        # Get the service config path
        service_config_path = os.path.join(os.path.dirname(__file__), "service_config.json")
        
        # Register with Consul
        consul_success = register_mcp_service_with_consul(service_config_path, port=5201)
        if consul_success:
            logger.info("✅ Service registered with Consul")
            
            # Register cleanup function for graceful shutdown
            def cleanup_consul():
                deregister_mcp_service_from_consul("mcp-statistical-service")
            atexit.register(cleanup_consul)
        else:
            logger.warning("⚠️ Failed to register with Consul - continuing without service discovery")
            
    except Exception as e:
        logger.warning(f"⚠️ Consul registration error: {e} - continuing without service discovery")

if __name__ == '__main__':
    # Initialize the service
    asyncio.run(initialize_service())
    
    # Start the Flask service
    port = 5201
    logger.info(f"Starting Enhanced MCP Statistical Service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
