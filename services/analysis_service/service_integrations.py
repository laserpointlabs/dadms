"""
Service Integration Layer for Analysis Service
Handles communication with other DADM services while maintaining decoupling
"""

import json
import requests
import asyncio
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import aiohttp

from models import AnalysisServiceConfig
from config_manager import get_service_discovery

logger = logging.getLogger(__name__)

class ServiceIntegration:
    """Base class for service integrations"""
    
    def __init__(self, config: AnalysisServiceConfig):
        self.config = config
        self.service_discovery = get_service_discovery()
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def get_session(self) -> aiohttp.ClientSession:
        """Get or create HTTP session"""
        if self.session is None:
            self.session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=30)
            )
        return self.session
    
    async def cleanup(self):
        """Cleanup resources"""
        if self.session:
            await self.session.close()
            self.session = None

class OpenAIServiceIntegration(ServiceIntegration):
    """Integration with OpenAI Service for LLM calls"""
    
    def __init__(self, config: AnalysisServiceConfig):
        super().__init__(config)
        self._openai_url = None
    
    def _get_openai_url(self) -> str:
        """Get OpenAI service URL with service discovery"""
        if self._openai_url is None:
            # Use service discovery to find OpenAI service
            if self.config.consul_enabled:
                try:
                    import consul
                    consul_client = consul.Consul(host=self._extract_consul_host())
                    services = consul_client.health.service('dadm-openai-service', passing=True)
                    if services[1]:
                        service = services[1][0]['Service']
                        self._openai_url = f"http://{service['Address']}:{service['Port']}"
                        logger.info(f"Discovered OpenAI service: {self._openai_url}")
                        return self._openai_url
                except Exception as e:
                    logger.warning(f"Failed to discover OpenAI service: {e}")
            
            # Fallback to environment or default
            self._openai_url = self.config.openai_service_url or "http://localhost:8001"
            
        return self._openai_url
    
    def _extract_consul_host(self) -> str:
        """Extract host from Consul URL"""
        url = self.config.consul_url
        if "://" in url:
            url = url.split("://")[1]
        if ":" in url:
            url = url.split(":")[0]
        return url
    
    async def generate_analysis(self, 
                              prompt: str, 
                              analysis_schema: Dict[str, Any],
                              model: Optional[str] = None,
                              temperature: Optional[float] = None) -> Dict[str, Any]:
        """Generate LLM analysis using OpenAI service"""
        
        openai_url = self._get_openai_url()
        session = await self.get_session()
        
        # Prepare request for OpenAI service
        request_data = {
            "model": model or self.config.default_model,
            "prompt": prompt,
            "temperature": temperature or self.config.default_temperature,
            "max_tokens": self.config.max_tokens_default,
            "structured_output": True,
            "output_schema": analysis_schema,
            "metadata": {
                "source": "analysis-service",
                "timestamp": datetime.utcnow().isoformat(),
                "analysis_request": True
            }
        }
        
        try:
            async with session.post(
                f"{openai_url}/api/chat/completions",
                json=request_data
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    return {
                        "status": "success",
                        "analysis": result.get("structured_response", {}),
                        "raw_response": result.get("content", ""),
                        "usage": result.get("usage", {}),
                        "model_used": result.get("model", model)
                    }
                else:
                    error_text = await response.text()
                    logger.error(f"OpenAI service error {response.status}: {error_text}")
                    return {
                        "status": "error",
                        "error": f"OpenAI service returned {response.status}: {error_text}"
                    }
                    
        except Exception as e:
            logger.error(f"Failed to call OpenAI service: {e}")
            return {
                "status": "error", 
                "error": f"OpenAI service call failed: {str(e)}"
            }

class PythonExecutionIntegration(ServiceIntegration):
    """Integration with Python Execution Service"""
    
    def __init__(self, config: AnalysisServiceConfig):
        super().__init__(config)
        self._python_url = None
    
    def _get_python_execution_url(self) -> str:
        """Get Python execution service URL with service discovery"""
        if self._python_url is None:
            # Use service discovery to find Python execution service
            if self.config.consul_enabled:
                try:
                    import consul
                    consul_client = consul.Consul(host=self._extract_consul_host())
                    services = consul_client.health.service('dadm-python-execution-service', passing=True)
                    if services[1]:
                        service = services[1][0]['Service']
                        self._python_url = f"http://{service['Address']}:{service['Port']}"
                        logger.info(f"Discovered Python execution service: {self._python_url}")
                        return self._python_url
                except Exception as e:
                    logger.warning(f"Failed to discover Python execution service: {e}")
            
            # Fallback to environment or default
            self._python_url = self.config.python_execution_url or "http://localhost:8003"
            
        return self._python_url
    
    def _extract_consul_host(self) -> str:
        """Extract host from Consul URL"""
        url = self.config.consul_url
        if "://" in url:
            url = url.split("://")[1]
        if ":" in url:
            url = url.split(":")[0]
        return url
    
    async def execute_python_code(self,
                                 code: str,
                                 environment: str = "scientific",
                                 timeout: int = 300,
                                 packages: Optional[List[str]] = None,
                                 data_sources: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Execute Python code using the Python execution service"""
        
        python_url = self._get_python_execution_url()
        session = await self.get_session()
        
        # Prepare execution request
        request_data = {
            "code": code,
            "environment": environment,
            "timeout": timeout,
            "packages": packages or [],
            "data_sources": data_sources or {},
            "metadata": {
                "source": "analysis-service",
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        try:
            # Submit execution request
            async with session.post(
                f"{python_url}/execute",
                json=request_data
            ) as response:
                if response.status == 202:  # Accepted
                    result = await response.json()
                    execution_id = result["execution_id"]
                    
                    # Poll for completion
                    return await self._poll_execution_result(execution_id)
                else:
                    error_text = await response.text()
                    logger.error(f"Python execution service error {response.status}: {error_text}")
                    return {
                        "status": "error",
                        "error": f"Python execution service returned {response.status}: {error_text}"
                    }
                    
        except Exception as e:
            logger.error(f"Failed to call Python execution service: {e}")
            return {
                "status": "error",
                "error": f"Python execution service call failed: {str(e)}"
            }
    
    async def _poll_execution_result(self, execution_id: str, max_attempts: int = 60) -> Dict[str, Any]:
        """Poll for execution result"""
        python_url = self._get_python_execution_url()
        session = await self.get_session()
        
        for attempt in range(max_attempts):
            try:
                async with session.get(
                    f"{python_url}/execution/{execution_id}/status"
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        status = result.get("status")
                        
                        if status in ["completed", "failed", "timeout"]:
                            return result
                        elif status == "running":
                            await asyncio.sleep(5)  # Wait 5 seconds before next poll
                            continue
                        else:
                            return {
                                "status": "error",
                                "error": f"Unknown execution status: {status}"
                            }
                    else:
                        error_text = await response.text()
                        return {
                            "status": "error",
                            "error": f"Failed to get execution status: {error_text}"
                        }
                        
            except Exception as e:
                logger.warning(f"Error polling execution {execution_id}: {e}")
                await asyncio.sleep(5)
        
        return {
            "status": "timeout",
            "error": f"Execution polling timed out after {max_attempts} attempts"
        }

class PromptServiceIntegration(ServiceIntegration):
    """Integration with Prompt Service (already implemented in prompt_compiler.py)"""
    
    def __init__(self, config: AnalysisServiceConfig):
        super().__init__(config)
        self._prompt_url = None
    
    def get_prompt_service_url(self) -> str:
        """Get prompt service URL - delegates to service discovery"""
        return self.service_discovery.discover_prompt_service()

class IntegratedAnalysisOrchestrator:
    """Orchestrates analysis using all integrated services"""
    
    def __init__(self, config: AnalysisServiceConfig):
        self.config = config
        self.openai_integration = OpenAIServiceIntegration(config)
        self.python_integration = PythonExecutionIntegration(config)
        self.prompt_integration = PromptServiceIntegration(config)
    
    async def execute_complete_analysis(self, 
                                      analysis_request: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a complete analysis workflow using all services"""
        
        execution_id = f"analysis_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{hash(str(analysis_request)) % 10000}"
        
        try:
            # Step 1: Get LLM Analysis Plan
            logger.info(f"[{execution_id}] Step 1: Generating LLM analysis plan...")
            llm_result = await self._get_llm_analysis_plan(analysis_request)
            
            if llm_result.get("status") != "success":
                return {
                    "execution_id": execution_id,
                    "status": "failed",
                    "error": f"LLM analysis failed: {llm_result.get('error')}"
                }
            
            # Step 2: Execute Computational Analysis
            logger.info(f"[{execution_id}] Step 2: Executing computational analysis...")
            computation_result = await self._execute_computational_analysis(
                analysis_request, llm_result["analysis"]
            )
            
            # Step 3: Generate Final Insights
            logger.info(f"[{execution_id}] Step 3: Generating final insights...")
            final_insights = await self._generate_final_insights(
                llm_result["analysis"], computation_result
            )
            
            return {
                "execution_id": execution_id,
                "status": "completed",
                "llm_analysis": llm_result["analysis"],
                "computational_results": computation_result,
                "final_insights": final_insights,
                "execution_metadata": {
                    "services_used": ["openai", "python-execution"],
                    "execution_time": "calculated_time",
                    "analysis_type": analysis_request.get("analysis_type", "unknown")
                }
            }
            
        except Exception as e:
            logger.error(f"[{execution_id}] Analysis execution failed: {e}")
            return {
                "execution_id": execution_id,
                "status": "failed", 
                "error": str(e)
            }
        finally:
            # Cleanup resources
            await self.openai_integration.cleanup()
            await self.python_integration.cleanup()
    
    async def _get_llm_analysis_plan(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Get analysis plan from LLM"""
        
        # Create analysis prompt
        analysis_prompt = f"""
        Based on the following analysis request, create a detailed analysis plan:
        
        Request: {json.dumps(request, indent=2)}
        
        Please provide:
        1. Analysis methodology
        2. Key variables to analyze
        3. Statistical tests to perform
        4. Expected insights
        5. Python code to execute the analysis
        
        Be specific and actionable in your recommendations.
        """
        
        # Define schema for structured output
        analysis_schema = {
            "type": "object",
            "properties": {
                "methodology": {"type": "string"},
                "key_variables": {"type": "array", "items": {"type": "string"}},
                "statistical_tests": {"type": "array", "items": {"type": "string"}},
                "expected_insights": {"type": "array", "items": {"type": "string"}},
                "python_code": {"type": "string"},
                "confidence_score": {"type": "number", "minimum": 0, "maximum": 1}
            },
            "required": ["methodology", "key_variables", "python_code"]
        }
        
        return await self.openai_integration.generate_analysis(
            analysis_prompt, analysis_schema
        )
    
    async def _execute_computational_analysis(self, 
                                            request: Dict[str, Any], 
                                            llm_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Execute computational analysis using Python service"""
        
        python_code = llm_analysis.get("python_code", "")
        if not python_code:
            return {
                "status": "skipped",
                "reason": "No Python code provided in LLM analysis"
            }
        
        # Add data loading and result formatting to the code
        enhanced_code = f"""
import json
import pandas as pd
import numpy as np
from datetime import datetime

# Analysis data setup
analysis_request = {json.dumps(request, indent=2)}
print("=== ANALYSIS EXECUTION START ===")
print(f"Timestamp: {{datetime.utcnow().isoformat()}}")
print(f"Analysis Type: {{analysis_request.get('analysis_type', 'unknown')}}")

try:
    # Execute the LLM-generated analysis code
{self._indent_code(python_code, 4)}
    
    print("=== ANALYSIS EXECUTION COMPLETE ===")
    print("Analysis completed successfully")
    
except Exception as e:
    print(f"=== ANALYSIS ERROR ===")
    print(f"Error: {{str(e)}}")
    raise
"""
        
        return await self.python_integration.execute_python_code(
            enhanced_code,
            environment="scientific",
            timeout=300,
            packages=["pandas", "numpy", "matplotlib", "seaborn", "scikit-learn"]
        )
    
    async def _generate_final_insights(self, 
                                     llm_analysis: Dict[str, Any], 
                                     computation_result: Dict[str, Any]) -> Dict[str, Any]:
        """Generate final insights combining LLM and computational results"""
        
        insights_prompt = f"""
        Based on the LLM analysis plan and computational results below, provide final business insights:
        
        LLM Analysis Plan:
        {json.dumps(llm_analysis, indent=2)}
        
        Computational Results:
        Status: {computation_result.get('status')}
        Output: {computation_result.get('stdout', 'No output')[:1000]}
        
        Please provide:
        1. Key findings from the analysis
        2. Business recommendations
        3. Risk factors to consider
        4. Confidence in the results
        """
        
        insights_schema = {
            "type": "object", 
            "properties": {
                "key_findings": {"type": "array", "items": {"type": "string"}},
                "recommendations": {"type": "array", "items": {"type": "string"}},
                "risk_factors": {"type": "array", "items": {"type": "string"}},
                "confidence_score": {"type": "number", "minimum": 0, "maximum": 1}
            },
            "required": ["key_findings", "recommendations", "confidence_score"]
        }
        
        result = await self.openai_integration.generate_analysis(
            insights_prompt, insights_schema
        )
        
        return result.get("analysis", {})
    
    def _indent_code(self, code: str, spaces: int) -> str:
        """Indent code by specified number of spaces"""
        lines = code.split('\n')
        indented_lines = [' ' * spaces + line if line.strip() else line for line in lines]
        return '\n'.join(indented_lines)
    
    async def cleanup(self):
        """Cleanup all integration resources"""
        await self.openai_integration.cleanup()
        await self.python_integration.cleanup()
