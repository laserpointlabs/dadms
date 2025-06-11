#!/usr/bin/env python3
"""
MCP Statistical Server
Example implementation of an MCP server for statistical analysis
"""

import asyncio
import json
import logging
from typing import Any, Sequence

import numpy as np
import scipy.stats as stats
from scipy import optimize
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler

from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.types import (
    Resource, Tool, TextContent, ImageContent, EmbeddedResource
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mcp-statistical-server")

# Create the server
server = Server("mcp-statistical-server")

@server.list_tools()
async def handle_list_tools() -> list[Tool]:
    """List available statistical analysis tools"""
    return [
        Tool(
            name="calculate_statistics",
            description="Calculate descriptive statistics for a dataset",
            inputSchema={
                "type": "object",
                "properties": {
                    "data": {
                        "type": "array",
                        "items": {"type": "number"},
                        "description": "Array of numerical data points"
                    },
                    "include_distribution_tests": {
                        "type": "boolean",
                        "description": "Whether to include normality and distribution tests",
                        "default": True
                    }
                },
                "required": ["data"]
            }
        ),
        Tool(
            name="run_statistical_test",
            description="Run statistical hypothesis tests",
            inputSchema={
                "type": "object",
                "properties": {
                    "data": {
                        "type": "array",
                        "items": {"type": "number"},
                        "description": "Array of numerical data points"
                    },
                    "test_type": {
                        "type": "string",
                        "enum": ["normality", "t_test", "anova", "chi_square"],
                        "description": "Type of statistical test to perform"
                    },
                    "alpha": {
                        "type": "number",
                        "description": "Significance level",
                        "default": 0.05
                    }
                },
                "required": ["data", "test_type"]
            }
        ),
        Tool(
            name="fit_regression_model",
            description="Fit regression models to data",
            inputSchema={
                "type": "object",
                "properties": {
                    "x_data": {
                        "type": "array",
                        "items": {"type": "number"},
                        "description": "Independent variable data"
                    },
                    "y_data": {
                        "type": "array",
                        "items": {"type": "number"},
                        "description": "Dependent variable data"
                    },
                    "model_type": {
                        "type": "string",
                        "enum": ["linear", "polynomial", "exponential"],
                        "description": "Type of regression model",
                        "default": "linear"
                    },
                    "polynomial_degree": {
                        "type": "integer",
                        "description": "Degree for polynomial regression",
                        "default": 2
                    }
                },
                "required": ["x_data", "y_data"]
            }
        ),
        Tool(
            name="analyze_time_series",
            description="Analyze time series data for trends and patterns",
            inputSchema={
                "type": "object",
                "properties": {
                    "data": {
                        "type": "array",
                        "items": {"type": "number"},
                        "description": "Time series data points"
                    },
                    "timestamps": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Timestamps corresponding to data points"
                    },
                    "analysis_type": {
                        "type": "string",
                        "enum": ["trend", "seasonality", "forecast"],
                        "description": "Type of time series analysis",
                        "default": "trend"
                    }
                },
                "required": ["data"]
            }
        )
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> list[TextContent]:
    """Handle tool calls for statistical analysis"""
    
    if name == "calculate_statistics":
        return await calculate_statistics(arguments)
    elif name == "run_statistical_test":
        return await run_statistical_test(arguments)
    elif name == "fit_regression_model":
        return await fit_regression_model(arguments)
    elif name == "analyze_time_series":
        return await analyze_time_series(arguments)
    else:
        raise ValueError(f"Unknown tool: {name}")

async def calculate_statistics(arguments: dict[str, Any]) -> list[TextContent]:
    """Calculate descriptive statistics"""
    try:
        data = np.array(arguments["data"])
        include_tests = arguments.get("include_distribution_tests", True)
        
        # Basic descriptive statistics
        stats_result = {
            "count": len(data),
            "mean": float(np.mean(data)),
            "median": float(np.median(data)),
            "std": float(np.std(data, ddof=1)),
            "var": float(np.var(data, ddof=1)),
            "min": float(np.min(data)),
            "max": float(np.max(data)),
            "range": float(np.max(data) - np.min(data)),
            "skewness": float(stats.skew(data)),
            "kurtosis": float(stats.kurtosis(data)),
            "percentiles": {
                "25th": float(np.percentile(data, 25)),
                "50th": float(np.percentile(data, 50)),
                "75th": float(np.percentile(data, 75)),
                "95th": float(np.percentile(data, 95))
            }
        }
        
        # Distribution tests if requested
        if include_tests and len(data) >= 3:
            # Shapiro-Wilk test for normality
            shapiro_stat, shapiro_p = stats.shapiro(data)
            stats_result["normality_test"] = {
                "test": "Shapiro-Wilk",
                "statistic": float(shapiro_stat),
                "p_value": float(shapiro_p),
                "is_normal": shapiro_p > 0.05
            }
            
            # Anderson-Darling test
            anderson_result = stats.anderson(data)
            stats_result["anderson_darling"] = {
                "statistic": float(anderson_result.statistic),
                "critical_values": anderson_result.critical_values.tolist(),
                "significance_levels": anderson_result.significance_level.tolist()
            }
        
        return [TextContent(
            type="text",
            text=json.dumps(stats_result, indent=2)
        )]
        
    except Exception as e:
        logger.error(f"Error in calculate_statistics: {e}")
        return [TextContent(
            type="text", 
            text=json.dumps({"error": str(e)})
        )]

async def run_statistical_test(arguments: dict[str, Any]) -> list[TextContent]:
    """Run statistical hypothesis tests"""
    try:
        data = np.array(arguments["data"])
        test_type = arguments["test_type"]
        alpha = arguments.get("alpha", 0.05)
        
        result = {"test_type": test_type, "alpha": alpha}
        
        if test_type == "normality":
            # Shapiro-Wilk test
            stat, p_value = stats.shapiro(data)
            result.update({
                "test_name": "Shapiro-Wilk Normality Test",
                "statistic": float(stat),
                "p_value": float(p_value),
                "reject_null": p_value < alpha,
                "interpretation": "Data is not normally distributed" if p_value < alpha else "Data is normally distributed"
            })
            
        elif test_type == "t_test":
            # One-sample t-test against zero
            stat, p_value = stats.ttest_1samp(data, 0)
            result.update({
                "test_name": "One-Sample T-Test",
                "statistic": float(stat),
                "p_value": float(p_value),
                "reject_null": p_value < alpha,
                "interpretation": "Mean significantly different from 0" if p_value < alpha else "Mean not significantly different from 0"
            })
        
        return [TextContent(
            type="text",
            text=json.dumps(result, indent=2)
        )]
        
    except Exception as e:
        logger.error(f"Error in run_statistical_test: {e}")
        return [TextContent(
            type="text",
            text=json.dumps({"error": str(e)})
        )]

async def fit_regression_model(arguments: dict[str, Any]) -> list[TextContent]:
    """Fit regression models to data"""
    try:
        x_data = np.array(arguments["x_data"]).reshape(-1, 1)
        y_data = np.array(arguments["y_data"])
        model_type = arguments.get("model_type", "linear")
        
        result = {"model_type": model_type}
        
        if model_type == "linear":
            # Linear regression
            model = LinearRegression()
            model.fit(x_data, y_data)
            
            # Predictions and metrics
            y_pred = model.predict(x_data)
            r2_score = model.score(x_data, y_data)
            mse = np.mean((y_data - y_pred) ** 2)
            
            result.update({
                "coefficients": {
                    "intercept": float(model.intercept_),
                    "slope": float(model.coef_[0])
                },
                "r_squared": float(r2_score),
                "mse": float(mse),
                "rmse": float(np.sqrt(mse)),
                "equation": f"y = {model.coef_[0]:.4f}x + {model.intercept_:.4f}"
            })
            
        elif model_type == "polynomial":
            degree = arguments.get("polynomial_degree", 2)
            coeffs = np.polyfit(x_data.flatten(), y_data, degree)
            poly_model = np.poly1d(coeffs)
            y_pred = poly_model(x_data.flatten())
            
            # Calculate R-squared
            ss_res = np.sum((y_data - y_pred) ** 2)
            ss_tot = np.sum((y_data - np.mean(y_data)) ** 2)
            r2_score = 1 - (ss_res / ss_tot)
            
            result.update({
                "coefficients": coeffs.tolist(),
                "degree": degree,
                "r_squared": float(r2_score),
                "equation": str(poly_model)
            })
        
        return [TextContent(
            type="text",
            text=json.dumps(result, indent=2)
        )]
        
    except Exception as e:
        logger.error(f"Error in fit_regression_model: {e}")
        return [TextContent(
            type="text",
            text=json.dumps({"error": str(e)})
        )]

async def analyze_time_series(arguments: dict[str, Any]) -> list[TextContent]:
    """Analyze time series data"""
    try:
        data = np.array(arguments["data"])
        analysis_type = arguments.get("analysis_type", "trend")
        
        result = {"analysis_type": analysis_type, "data_points": len(data)}
        
        if analysis_type == "trend":
            # Linear trend analysis
            x = np.arange(len(data))
            slope, intercept, r_value, p_value, std_err = stats.linregress(x, data)
            
            result.update({
                "trend_slope": float(slope),
                "trend_intercept": float(intercept),
                "correlation": float(r_value),
                "p_value": float(p_value),
                "trend_direction": "increasing" if slope > 0 else "decreasing" if slope < 0 else "stable",
                "trend_strength": abs(float(r_value))
            })
            
        elif analysis_type == "seasonality":
            # Basic seasonality detection using autocorrelation
            if len(data) > 12:
                autocorr = np.correlate(data, data, mode='full')
                autocorr = autocorr[autocorr.size // 2:]
                autocorr = autocorr / autocorr[0]
                
                # Find peaks in autocorrelation
                peaks = []
                for i in range(1, min(len(autocorr), 50)):
                    if autocorr[i] > 0.3:  # Threshold for significant correlation
                        peaks.append({"lag": i, "correlation": float(autocorr[i])})
                
                result.update({
                    "potential_periods": peaks[:5],  # Top 5 potential periods
                    "has_seasonality": len(peaks) > 0
                })
        
        return [TextContent(
            type="text",
            text=json.dumps(result, indent=2)
        )]
        
    except Exception as e:
        logger.error(f"Error in analyze_time_series: {e}")
        return [TextContent(
            type="text",
            text=json.dumps({"error": str(e)})
        )]

async def main():
    """Main server function"""
    # Use stdio transport
    from mcp.server.stdio import stdio_server
    
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="mcp-statistical-server",
                server_version="1.0.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={}
                )
            )
        )

if __name__ == "__main__":
    asyncio.run(main())
