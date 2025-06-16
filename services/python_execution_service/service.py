"""
Python Execution Service
Independent microservice for safe Python code execution in isolated environments
"""

import os
import json
import uuid
import tempfile
import subprocess
import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from pathlib import Path

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import docker
import consul

from config_manager import load_service_config, get_service_info, get_consul_config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Models for API
class ExecutionRequest(BaseModel):
    """Request to execute Python code"""
    code: str = Field(..., description="Python code to execute")
    environment: str = Field(default="standard", description="Execution environment (standard, scientific, ml)")
    timeout: int = Field(default=300, description="Execution timeout in seconds")
    data_sources: Optional[Dict[str, str]] = Field(None, description="Data sources to mount")
    packages: Optional[List[str]] = Field(None, description="Additional packages to install")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Execution metadata")

class ExecutionResult(BaseModel):
    """Result of Python code execution"""
    execution_id: str
    status: str  # "running", "completed", "failed", "timeout"
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    files_created: Optional[List[str]] = None
    execution_time: Optional[float] = None
    exit_code: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

class EnvironmentInfo(BaseModel):
    """Information about available execution environments"""
    name: str
    description: str
    base_packages: List[str]
    python_version: str
    dockerfile: str

# FastAPI app
app = FastAPI(
    title="DADM Python Execution Service",
    description="Safe Python code execution in isolated Docker containers",
    version="1.0.0"
)

# Global state
execution_jobs: Dict[str, ExecutionResult] = {}
docker_client = None

def get_docker_client():
    """Get Docker client"""
    global docker_client
    if docker_client is None:
        try:
            docker_client = docker.from_env()
            logger.info("✅ Connected to Docker")
        except Exception as e:
            logger.error(f"❌ Failed to connect to Docker: {e}")
            docker_client = None
    return docker_client

@app.on_event("startup")
async def startup_event():
    """Initialize service on startup"""
    logger.info("Starting Python Execution Service...")
    
    # Test Docker connection
    client = get_docker_client()
    if client:
        logger.info("✅ Docker client initialized")
    else:
        logger.warning("⚠️ Docker not available - using subprocess execution")
    
    # Register with Consul
    register_with_consul()
    
    logger.info("Python Execution Service ready")

@app.get("/health")
async def health_check():
    """Health check endpoint with service configuration info"""
    client = get_docker_client()
    service_config = load_service_config()
    service_info = service_config.get("service", {})
    
    return {
        "status": "healthy",
        "service": service_info.get("name", "python-execution-service"),
        "version": service_info.get("version", "1.0.0"),
        "type": service_info.get("type", "python-execution"),
        "docker_available": client is not None,
        "active_executions": len([j for j in execution_jobs.values() if j.status == "running"]),
        "capabilities": service_info.get("capabilities", {}),
        "supported_environments": ["standard", "scientific", "ml"],
        "timestamp": datetime.now().isoformat()
    }

@app.get("/environments")
async def list_environments():
    """List available execution environments"""
    environments = [
        EnvironmentInfo(
            name="standard",
            description="Standard Python with basic libraries",
            base_packages=["pandas", "numpy", "requests", "json"],
            python_version="3.11",
            dockerfile="python:3.11-slim"
        ),
        EnvironmentInfo(
            name="scientific",
            description="Scientific computing environment",
            base_packages=["pandas", "numpy", "scipy", "matplotlib", "seaborn", "plotly"],
            python_version="3.11",
            dockerfile="python:3.11-slim"
        ),
        EnvironmentInfo(
            name="ml",
            description="Machine learning environment",
            base_packages=["pandas", "numpy", "scikit-learn", "tensorflow", "pytorch"],
            python_version="3.11",
            dockerfile="python:3.11-slim"
        )
    ]
    
    return {
        "environments": [env.dict() for env in environments],
        "default": "standard"
    }

@app.post("/execute", response_model=ExecutionResult)
async def execute_code(request: ExecutionRequest, background_tasks: BackgroundTasks):
    """Execute Python code in isolated environment"""
    
    execution_id = str(uuid.uuid4())
    
    # Create execution job
    job = ExecutionResult(
        execution_id=execution_id,
        status="running",
        metadata=request.metadata
    )
    execution_jobs[execution_id] = job
    
    # Execute in background
    background_tasks.add_task(
        _execute_code_background,
        execution_id,
        request
    )
    
    return job

async def _execute_code_background(execution_id: str, request: ExecutionRequest):
    """Execute code in background task"""
    start_time = datetime.now()
    
    try:
        # Choose execution method
        client = get_docker_client()
        if client:
            result = await _execute_in_docker(execution_id, request)
        else:
            result = await _execute_in_subprocess(execution_id, request)
        
        # Update job status
        execution_jobs[execution_id].status = result["status"]
        execution_jobs[execution_id].stdout = result.get("stdout")
        execution_jobs[execution_id].stderr = result.get("stderr")
        execution_jobs[execution_id].exit_code = result.get("exit_code")
        execution_jobs[execution_id].files_created = result.get("files_created", [])
        
    except Exception as e:
        logger.error(f"Execution failed for {execution_id}: {e}")
        execution_jobs[execution_id].status = "failed"
        execution_jobs[execution_id].stderr = str(e)
    
    finally:
        end_time = datetime.now()
        execution_jobs[execution_id].execution_time = (end_time - start_time).total_seconds()

async def _execute_in_docker(execution_id: str, request: ExecutionRequest) -> Dict[str, Any]:
    """Execute code in Docker container"""
    client = get_docker_client()
    
    # Create temporary directory for execution
    with tempfile.TemporaryDirectory() as temp_dir:
        # Write code to file
        code_file = os.path.join(temp_dir, "execution_script.py")
        with open(code_file, 'w') as f:
            f.write(request.code)
        
        # Create requirements.txt if additional packages needed
        if request.packages:
            req_file = os.path.join(temp_dir, "requirements.txt")
            with open(req_file, 'w') as f:
                for package in request.packages:
                    f.write(f"{package}\n")
        
        try:
            # Get base image for environment
            base_image = _get_base_image(request.environment)
            
            # Run container
            container = client.containers.run(
                base_image,
                command=["python", "/workspace/execution_script.py"],
                volumes={temp_dir: {'bind': '/workspace', 'mode': 'ro'}},
                working_dir="/workspace",
                mem_limit="512m",  # Limit memory
                cpu_quota=50000,   # Limit CPU (50% of one core)
                network_disabled=True,  # No network access for security
                remove=True,
                stdout=True,
                stderr=True,
                detach=False,
                timeout=request.timeout
            )
            
            # Get results
            stdout = container.decode('utf-8') if isinstance(container, bytes) else str(container)
            
            return {
                "status": "completed",
                "stdout": stdout,
                "stderr": "",
                "exit_code": 0,
                "files_created": []
            }
            
        except docker.errors.ContainerError as e:
            return {
                "status": "failed",
                "stdout": e.container.logs(stdout=True, stderr=False).decode('utf-8'),
                "stderr": e.container.logs(stdout=False, stderr=True).decode('utf-8'),
                "exit_code": e.exit_status
            }
        except Exception as e:
            return {
                "status": "failed",
                "stdout": "",
                "stderr": str(e),
                "exit_code": -1
            }

async def _execute_in_subprocess(execution_id: str, request: ExecutionRequest) -> Dict[str, Any]:
    """Execute code using subprocess (fallback when Docker not available)"""
    
    with tempfile.TemporaryDirectory() as temp_dir:
        # Write code to file
        code_file = os.path.join(temp_dir, "execution_script.py")
        with open(code_file, 'w') as f:
            f.write(request.code)
        
        try:
            # Execute with subprocess
            result = subprocess.run(
                ["python", code_file],
                cwd=temp_dir,
                capture_output=True,
                text=True,
                timeout=request.timeout
            )
            
            return {
                "status": "completed" if result.returncode == 0 else "failed",
                "stdout": result.stdout,
                "stderr": result.stderr,
                "exit_code": result.returncode,
                "files_created": []
            }
            
        except subprocess.TimeoutExpired:
            return {
                "status": "timeout",
                "stdout": "",
                "stderr": f"Execution timed out after {request.timeout} seconds",
                "exit_code": -1
            }
        except Exception as e:
            return {
                "status": "failed",
                "stdout": "",
                "stderr": str(e),
                "exit_code": -1
            }

def _get_base_image(environment: str) -> str:
    """Get Docker base image for environment"""
    images = {
        "standard": "python:3.11-slim",
        "scientific": "python:3.11-slim",  # We'll install packages dynamically
        "ml": "python:3.11-slim"
    }
    return images.get(environment, "python:3.11-slim")

@app.get("/execution/{execution_id}", response_model=ExecutionResult)
async def get_execution_result(execution_id: str):
    """Get execution result by ID"""
    if execution_id not in execution_jobs:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    return execution_jobs[execution_id]

@app.get("/executions")
async def list_executions():
    """List all executions"""
    return {
        "executions": list(execution_jobs.values()),
        "total": len(execution_jobs)
    }

@app.delete("/execution/{execution_id}")
async def cancel_execution(execution_id: str):
    """Cancel running execution"""
    if execution_id not in execution_jobs:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    job = execution_jobs[execution_id]
    if job.status == "running":
        job.status = "cancelled"
        # TODO: Actually kill the running process/container
    
    return {"message": f"Execution {execution_id} cancelled"}

# Analysis-specific endpoints for integration with analysis service
@app.post("/analyze/execute")
async def execute_analysis_code(request: Dict[str, Any]):
    """Execute analysis code with pre-built templates"""
    
    # Extract analysis parameters
    analysis_type = request.get("analysis_type", "general")
    data_sources = request.get("data_sources", {})
    llm_guidance = request.get("llm_guidance", {})
    parameters = request.get("parameters", {})
    
    # Generate Python code based on analysis type and LLM guidance
    code = _generate_analysis_code(analysis_type, data_sources, llm_guidance, parameters)
    
    # Create execution request
    exec_request = ExecutionRequest(
        code=code,
        environment="scientific",
        timeout=600,  # 10 minutes for analysis
        data_sources=data_sources,
        packages=["pandas", "numpy", "matplotlib", "seaborn", "scipy", "plotly"],
        metadata={
            "analysis_type": analysis_type,
            "generated_from": "llm_guidance",
            "parameters": parameters
        }
    )
    
    # Execute
    background_tasks = BackgroundTasks()
    result = await execute_code(exec_request, background_tasks)
    
    return {
        "execution_id": result.execution_id,
        "analysis_type": analysis_type,
        "status": result.status,
        "code_generated": len(code),
        "estimated_completion": f"{exec_request.timeout} seconds"
    }

def _generate_analysis_code(analysis_type: str, data_sources: Dict, llm_guidance: Dict, parameters: Dict) -> str:
    """Generate Python analysis code based on LLM guidance"""
    
    code_template = f'''
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
import json
import warnings
warnings.filterwarnings('ignore')

print("=== DADM Analysis Execution ===")
print(f"Analysis Type: {analysis_type}")
print(f"Parameters: {json.dumps(parameters, indent=2)}")
print()

# Analysis guidance from LLM:
# {json.dumps(llm_guidance, indent=2)}

def main():
    results = {{
        "analysis_type": "{analysis_type}",
        "execution_timestamp": pd.Timestamp.now().isoformat(),
        "parameters": {json.dumps(parameters)},
        "data_summary": {{}},
        "analysis_results": {{}},
        "visualizations": [],
        "insights": [],
        "recommendations": []
    }}
    
    print("Loading data sources...")
    data = {{}}
    '''
    
    # Add data loading code
    for source_name, source_info in data_sources.items():
        if isinstance(source_info, str) and source_info.endswith('.csv'):
            code_template += f'''
    # Load {source_name}
    try:
        data["{source_name}"] = pd.read_csv("{source_info}")
        print(f"✅ Loaded {{len(data['{source_name}'])}} rows from {source_name}")
        results["data_summary"]["{source_name}"] = {{
            "rows": len(data["{source_name}"]),
            "columns": list(data["{source_name}"].columns),
            "dtypes": data["{source_name}"].dtypes.to_dict()
        }}
    except Exception as e:
        print(f"❌ Error loading {source_name}: {{e}}")
        data["{source_name}"] = pd.DataFrame()
'''

    # Add analysis code based on type
    if analysis_type == "trend_analysis":
        code_template += '''
    
    # Trend Analysis
    print("\\nPerforming trend analysis...")
    for dataset_name, df in data.items():
        if not df.empty and len(df) > 1:
            # Look for date/time columns
            date_cols = [col for col in df.columns if 'date' in col.lower() or 'time' in col.lower()]
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            
            if date_cols and numeric_cols:
                date_col = date_cols[0]
                df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
                df = df.dropna(subset=[date_col]).sort_values(date_col)
                
                for num_col in numeric_cols[:3]:  # Analyze first 3 numeric columns
                    # Calculate trend
                    x = np.arange(len(df))
                    y = df[num_col].fillna(df[num_col].mean())
                    slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
                    
                    trend_result = {
                        "column": num_col,
                        "slope": slope,
                        "r_squared": r_value**2,
                        "p_value": p_value,
                        "trend_direction": "increasing" if slope > 0 else "decreasing",
                        "significance": "significant" if p_value < 0.05 else "not_significant"
                    }
                    
                    results["analysis_results"][f"{dataset_name}_{num_col}_trend"] = trend_result
                    print(f"📈 {dataset_name}.{num_col}: {trend_result['trend_direction']} trend (R² = {trend_result['r_squared']:.3f})")
'''
    
    elif analysis_type == "correlation_analysis":
        code_template += '''
    
    # Correlation Analysis
    print("\\nPerforming correlation analysis...")
    for dataset_name, df in data.items():
        if not df.empty:
            numeric_df = df.select_dtypes(include=[np.number])
            if len(numeric_df.columns) >= 2:
                correlation_matrix = numeric_df.corr()
                
                # Find strong correlations
                strong_correlations = []
                for i in range(len(correlation_matrix.columns)):
                    for j in range(i+1, len(correlation_matrix.columns)):
                        corr_value = correlation_matrix.iloc[i, j]
                        if abs(corr_value) > 0.5:  # Strong correlation threshold
                            strong_correlations.append({
                                "variable1": correlation_matrix.columns[i],
                                "variable2": correlation_matrix.columns[j],
                                "correlation": corr_value,
                                "strength": "strong" if abs(corr_value) > 0.7 else "moderate"
                            })
                
                results["analysis_results"][f"{dataset_name}_correlations"] = strong_correlations
                print(f"🔗 Found {len(strong_correlations)} strong correlations in {dataset_name}")
'''
    
    # Add general statistical summary
    code_template += '''
    
    # General Statistical Summary
    print("\\nGenerating statistical summary...")
    for dataset_name, df in data.items():
        if not df.empty:
            numeric_df = df.select_dtypes(include=[np.number])
            if not numeric_df.empty:
                summary_stats = {
                    "mean": numeric_df.mean().to_dict(),
                    "median": numeric_df.median().to_dict(),
                    "std": numeric_df.std().to_dict(),
                    "min": numeric_df.min().to_dict(),
                    "max": numeric_df.max().to_dict()
                }
                results["analysis_results"][f"{dataset_name}_summary_stats"] = summary_stats
    
    # Generate insights based on analysis
    insights = []
    '''
    
    # Add LLM guidance integration
    if llm_guidance.get("key_variables"):
        code_template += f'''
    # Focus on key variables identified by LLM
    key_variables = {llm_guidance.get("key_variables", [])}
    print(f"\\n🎯 Focusing on key variables: {{key_variables}}")
    
    for dataset_name, df in data.items():
        available_vars = [var for var in key_variables if var in df.columns]
        if available_vars:
            focused_analysis = df[available_vars].describe()
            results["analysis_results"][f"{{dataset_name}}_key_variables"] = focused_analysis.to_dict()
            insights.append(f"Key variables {{available_vars}} analyzed in {{dataset_name}}")
'''
    
    # Add conclusion
    code_template += '''
    
    results["insights"] = insights
    results["recommendations"] = [
        "Review data quality and completeness",
        "Consider additional data sources for comprehensive analysis", 
        "Validate statistical assumptions before making business decisions"
    ]
    
    # Output results
    print("\\n=== ANALYSIS COMPLETE ===")
    print("RESULTS_JSON_START")
    print(json.dumps(results, indent=2, default=str))
    print("RESULTS_JSON_END")
    
    return results

if __name__ == "__main__":
    main()
'''
    
    return code_template

# Consul registration functions
def register_with_consul():
    """Register service with Consul using service configuration"""
    consul_config = get_consul_config()
    service_info = get_service_info()
    
    if not consul_config.get("enabled", True):
        logger.info("Consul registration disabled")
        return
    
    consul_url = os.getenv("CONSUL_HTTP_ADDR", consul_config.get("url", "localhost:8500"))
    
    try:
        # Extract host and port from consul URL
        if "://" in consul_url:
            consul_url = consul_url.split("://")[1]
        host, port = consul_url.split(":")
        
        consul_client = consul.Consul(host=host, port=int(port))
        
        service_host = os.getenv("SERVICE_HOST", "localhost")
        service_port = int(os.getenv("PORT", service_info.get("port", 8003)))
        
        # Build service metadata from config
        meta = {}
        if "meta" in service_info:
            # Convert all meta values to strings (Consul requirement)
            meta = {k: str(v) for k, v in service_info["meta"].items()}
        
        # Add runtime metadata
        meta.update({
            "version": str(service_info.get("version", "1.0.0")),
            "type": str(service_info.get("type", "python-execution")),
            "docker_available": str(get_docker_client() is not None)
        })
        
        # Register service
        consul_client.agent.service.register(
            name=service_info.get("name", "dadm-python-execution-service"),
            service_id=f"{service_info.get('name', 'dadm-python-execution-service')}-{service_host}-{service_port}",
            address=service_host,
            port=service_port,
            tags=service_info.get("tags", ["python", "execution", "computational", "dadm"]),
            meta=meta,
            check=consul.Check.http(
                url=f"http://{service_host}:{service_port}{service_info.get('health_endpoint', '/health')}",
                interval="10s",
                timeout="5s",
                deregister="30s"
            )
        )
        
        logger.info(f"✅ Registered with Consul: {service_host}:{service_port}")
        logger.info(f"   Service: {service_info.get('name')}")
        logger.info(f"   Tags: {', '.join(service_info.get('tags', []))}")
        
    except Exception as e:
        logger.warning(f"Failed to register with Consul: {e}")

def deregister_from_consul():
    """Deregister service from Consul using service configuration"""
    consul_config = get_consul_config()
    service_info = get_service_info()
    
    if not consul_config.get("enabled", True):
        return
    
    consul_url = os.getenv("CONSUL_HTTP_ADDR", consul_config.get("url", "localhost:8500"))
    
    try:
        if "://" in consul_url:
            consul_url = consul_url.split("://")[1]
        host, port = consul_url.split(":")
        
        consul_client = consul.Consul(host=host, port=int(port))
        
        service_host = os.getenv("SERVICE_HOST", "localhost")
        service_port = int(os.getenv("PORT", service_info.get("port", 8003)))
        service_id = f"{service_info.get('name', 'dadm-python-execution-service')}-{service_host}-{service_port}"
        
        consul_client.agent.service.deregister(service_id)
        logger.info(f"✅ Deregistered from Consul: {service_id}")
        
    except Exception as e:
        logger.warning(f"Failed to deregister from Consul: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up on shutdown"""
    logger.info("Shutting down Python Execution Service...")
    
    # Deregister from Consul
    deregister_from_consul()
    
    # Clean up any running executions
    global execution_jobs
    for execution_id, job in execution_jobs.items():
        if job.status == "running":
            logger.info(f"Terminating execution {execution_id}")
            # Add cleanup logic here if needed
    
    logger.info("Python Execution Service shutdown complete")

@app.get("/service/info")
async def service_info():
    """Get detailed service information and configuration"""
    service_config = load_service_config()
    return {
        "service_config": service_config,
        "runtime_info": {
            "docker_available": get_docker_client() is not None,
            "active_executions": len(execution_jobs),
            "environment_variables": {
                "CONSUL_HTTP_ADDR": os.getenv("CONSUL_HTTP_ADDR"),
                "USE_CONSUL": os.getenv("USE_CONSUL"),
                "SERVICE_HOST": os.getenv("SERVICE_HOST"),
                "PORT": os.getenv("PORT")
            }
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
