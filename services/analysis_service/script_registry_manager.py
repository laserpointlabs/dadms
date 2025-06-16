#!/usr/bin/env python3
"""
Analysis Script Registry Manager
Manages external analysis scripts with flexible source support
"""
import json
import os
import subprocess
import tempfile
import requests
import importlib.util
from typing import Dict, List, Any, Optional
from pathlib import Path
import asyncio
import time
from datetime import datetime

class AnalysisScriptRegistry:
    """Registry for managing analysis scripts from multiple sources"""
    
    def __init__(self, registry_file: str = "analysis_scripts_registry.json"):
        self.registry_file = registry_file
        self.scripts = {}
        self.load_registry()
    
    def load_registry(self):
        """Load script registry from JSON file"""
        try:
            with open(self.registry_file, 'r') as f:
                self.scripts = json.load(f)
            print(f"Loaded {len(self.scripts)} analysis scripts from registry")
        except FileNotFoundError:
            print(f"Registry file {self.registry_file} not found. Starting with empty registry.")
            self.scripts = {}
        except json.JSONDecodeError as e:
            print(f"Error parsing registry file: {e}")
            self.scripts = {}
    
    def list_scripts(self) -> List[Dict[str, Any]]:
        """List all available analysis scripts"""
        script_list = []
        for script_id, script_config in self.scripts.items():
            script_info = {
                "id": script_id,
                "name": script_config.get("name", "Unknown"),
                "description": script_config.get("description", ""),
                "category": script_config.get("category", "general"),
                "source_type": script_config.get("source_type", "unknown"),
                "execution_type": script_config.get("execution_type", "unknown"),
                "complexity": script_config.get("metadata", {}).get("complexity", "unknown"),
                "estimated_execution_time": script_config.get("metadata", {}).get("estimated_execution_time", 0)
            }
            script_list.append(script_info)
        return script_list
    
    def get_script_details(self, script_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific script"""
        return self.scripts.get(script_id)
    
    def get_script_schema(self, script_id: str) -> Dict[str, Any]:
        """Get input/output schemas for a script"""
        script_config = self.scripts.get(script_id)
        if not script_config:
            return {"error": f"Script {script_id} not found"}
        
        return {
            "script_id": script_id,
            "input_schema": script_config.get("input_schema", {}),
            "output_schema": script_config.get("output_schema", {}),
            "llm_template_instructions": script_config.get("llm_template_instructions", {})
        }
    
    async def execute_script(self, script_id: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute an analysis script with input data"""
        script_config = self.scripts.get(script_id)
        if not script_config:
            return {"error": f"Script {script_id} not found", "status": "error"}
        
        try:
            execution_start = time.time()
            
            # Route to appropriate execution method based on source type
            source_type = script_config.get("source_type", "local_file")
            
            if source_type == "local_file":
                result = await self._execute_local_file(script_config, input_data)
            elif source_type == "remote_server":
                result = await self._execute_remote_server(script_config, input_data)
            elif source_type == "git_repository":
                result = await self._execute_git_script(script_config, input_data)
            elif source_type == "direct_content":
                result = await self._execute_direct_content(script_config, input_data)
            else:
                return {"error": f"Unsupported source type: {source_type}", "status": "error"}
            
            execution_time = time.time() - execution_start
            
            # Add execution metadata if not already present
            if "execution_metadata" not in result:
                result["execution_metadata"] = {}
            
            result["execution_metadata"].update({
                "registry_execution_time": execution_time,
                "registry_timestamp": datetime.now().isoformat(),
                "source_type": source_type
            })
            
            return result
            
        except Exception as e:
            return {
                "error": f"Execution failed: {str(e)}", 
                "status": "error",
                "script_id": script_id,
                "execution_metadata": {
                    "error_timestamp": datetime.now().isoformat(),
                    "error_type": type(e).__name__
                }
            }
    
    async def _execute_local_file(self, script_config: Dict, input_data: Dict) -> Dict[str, Any]:
        """Execute a local Python file"""
        script_path = script_config.get("source_location", "")
        
        # Make path relative to service directory
        if not os.path.isabs(script_path):
            script_path = os.path.join(os.path.dirname(__file__), script_path)
        
        if not os.path.exists(script_path):
            return {"error": f"Script file not found: {script_path}", "status": "error"}
        
        # Import and execute the script
        spec = importlib.util.spec_from_file_location("analysis_script", script_path)
        if spec is None or spec.loader is None:
            return {"error": f"Could not load script: {script_path}", "status": "error"}
        
        analysis_script = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(analysis_script)
        
        if not hasattr(analysis_script, 'execute'):
            return {"error": "Script must have an 'execute' function", "status": "error"}
        
        # Execute the script
        result = analysis_script.execute(input_data)
        result["status"] = "success"
        return result
    
    async def _execute_remote_server(self, script_config: Dict, input_data: Dict) -> Dict[str, Any]:
        """Execute script on a remote server via HTTP API"""
        server_url = script_config.get("source_location", "")
        
        try:
            # Prepare the request
            payload = {
                "script_id": script_config.get("id"),
                "input_data": input_data,
                "execution_type": script_config.get("execution_type", "unknown")
            }
            
            # Make the request
            response = requests.post(
                server_url,
                json=payload,
                timeout=script_config.get("timeout", 300),
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                result["status"] = "success"
                result["remote_server"] = server_url
                return result
            else:
                return {
                    "error": f"Remote server error: {response.status_code}",
                    "status": "error",
                    "response_text": response.text
                }
                
        except requests.RequestException as e:
            return {
                "error": f"Remote server connection failed: {str(e)}",
                "status": "error"
            }
    
    async def _execute_git_script(self, script_config: Dict, input_data: Dict) -> Dict[str, Any]:
        """Execute script from Git repository"""
        repo_url = script_config.get("source_location", "")
        script_path = script_config.get("source_path", "")
        
        try:
            # Create temporary directory
            with tempfile.TemporaryDirectory() as temp_dir:
                # Clone the repository
                clone_process = await asyncio.create_subprocess_exec(
                    "git", "clone", repo_url, temp_dir,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                
                stdout, stderr = await clone_process.communicate()
                
                if clone_process.returncode != 0:
                    return {
                        "error": f"Git clone failed: {stderr.decode()}",
                        "status": "error"
                    }
                
                # Execute the script
                full_script_path = os.path.join(temp_dir, script_path)
                
                if not os.path.exists(full_script_path):
                    return {
                        "error": f"Script not found in repository: {script_path}",
                        "status": "error"
                    }
                
                # Import and execute
                spec = importlib.util.spec_from_file_location("git_analysis_script", full_script_path)
                if spec is None or spec.loader is None:
                    return {"error": f"Could not load Git script: {script_path}", "status": "error"}
                
                git_script = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(git_script)
                
                if not hasattr(git_script, 'execute'):
                    return {"error": "Git script must have an 'execute' function", "status": "error"}
                
                result = git_script.execute(input_data)
                result["status"] = "success"
                result["git_repository"] = repo_url
                return result
                
        except Exception as e:
            return {
                "error": f"Git script execution failed: {str(e)}",
                "status": "error"
            }
    
    async def _execute_direct_content(self, script_config: Dict, input_data: Dict) -> Dict[str, Any]:
        """Execute script content directly (for simple scripts stored in registry)"""
        script_content = script_config.get("script_content", "")
        
        if not script_content:
            return {"error": "No script content provided", "status": "error"}
        
        try:
            # Create temporary file with script content
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as temp_file:
                temp_file.write(script_content)
                temp_file_path = temp_file.name
            
            try:
                # Import and execute
                spec = importlib.util.spec_from_file_location("direct_script", temp_file_path)
                if spec is None or spec.loader is None:
                    return {"error": "Could not load direct script content", "status": "error"}
                
                direct_script = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(direct_script)
                
                if not hasattr(direct_script, 'execute'):
                    return {"error": "Direct script must have an 'execute' function", "status": "error"}
                
                result = direct_script.execute(input_data)
                result["status"] = "success"
                return result
                
            finally:
                # Clean up temporary file
                os.unlink(temp_file_path)
                
        except Exception as e:
            return {
                "error": f"Direct script execution failed: {str(e)}",
                "status": "error"
            }
    
    def validate_input_data(self, script_id: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate input data against script's input schema"""
        script_config = self.scripts.get(script_id)
        if not script_config:
            return {"valid": False, "error": f"Script {script_id} not found"}
        
        input_schema = script_config.get("input_schema", {})
        
        # Basic validation (could be enhanced with jsonschema library)
        required_fields = input_schema.get("required", [])
        properties = input_schema.get("properties", {})
        
        validation_errors = []
        
        # Check required fields
        for field in required_fields:
            if field not in input_data:
                validation_errors.append(f"Missing required field: {field}")
        
        # Check field types (basic check)
        for field, value in input_data.items():
            if field in properties:
                expected_type = properties[field].get("type")
                if expected_type == "number" and not isinstance(value, (int, float)):
                    validation_errors.append(f"Field {field} should be a number")
                elif expected_type == "string" and not isinstance(value, str):
                    validation_errors.append(f"Field {field} should be a string")
                elif expected_type == "array" and not isinstance(value, list):
                    validation_errors.append(f"Field {field} should be an array")
                elif expected_type == "object" and not isinstance(value, dict):
                    validation_errors.append(f"Field {field} should be an object")
        
        return {
            "valid": len(validation_errors) == 0,
            "errors": validation_errors
        }
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get registry statistics"""
        total_scripts = len(self.scripts)
        
        categories = {}
        source_types = {}
        execution_types = {}
        
        for script_config in self.scripts.values():
            # Count by category
            cat = script_config.get("category", "unknown")
            categories[cat] = categories.get(cat, 0) + 1
            
            # Count by source type
            source_type = script_config.get("source_type", "unknown")
            source_types[source_type] = source_types.get(source_type, 0) + 1
            
            # Count by execution type
            exec_type = script_config.get("execution_type", "unknown")
            execution_types[exec_type] = execution_types.get(exec_type, 0) + 1
        
        return {
            "total_scripts": total_scripts,
            "categories": categories,
            "source_types": source_types,
            "execution_types": execution_types,
            "registry_file": self.registry_file,
            "last_loaded": datetime.now().isoformat()
        }

# Test the registry
if __name__ == "__main__":
    import asyncio
    
    async def test_registry():
        registry = AnalysisScriptRegistry()
        
        print("=== Analysis Script Registry Test ===")
        
        # List scripts
        scripts = registry.list_scripts()
        print(f"\nAvailable Scripts: {len(scripts)}")
        for script in scripts:
            print(f"  - {script['id']}: {script['name']} ({script['category']})")
        
        # Test adder script
        print(f"\n=== Testing Adder Script ===")
        test_input = {
            "item1": 15,
            "item2": 25,
            "context_metadata": {
                "service_task_name": "TestAddition",
                "process_instance_id": "test_proc_123"
            }
        }
        
        result = await registry.execute_script("adder", test_input)
        print(f"Adder Result: {json.dumps(result, indent=2)}")
        
        # Get statistics
        stats = registry.get_statistics()
        print(f"\n=== Registry Statistics ===")
        print(json.dumps(stats, indent=2))
    
    asyncio.run(test_registry())
