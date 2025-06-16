"""
Enhanced Prompt Compiler with Analysis Integration
Extends the prompt service to include analysis templates and instructions
"""

import json
import requests
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import logging

from models import (
    AnalysisRequest, CompiledAnalysisPrompt, AnalysisTemplate,
    AnalysisServiceConfig
)
from template_manager import AnalysisTemplateManager
from config_manager import get_service_discovery

logger = logging.getLogger(__name__)

class AnalysisPromptCompiler:
    """Compiles prompts with integrated analysis instructions"""
    
    def __init__(self, config: AnalysisServiceConfig, template_manager: AnalysisTemplateManager):
        self.config = config
        self.template_manager = template_manager
        self.service_discovery = get_service_discovery()
        # Use service discovery to get actual prompt service URL
        self.prompt_service_url = self.service_discovery.discover_prompt_service()
        
    def compile_analysis_prompt(self, request: AnalysisRequest) -> CompiledAnalysisPrompt:
        """Compile a prompt with analysis template integration"""
        
        # 1. Get the base prompt from prompt service
        base_prompt_data = self._get_base_prompt(request.prompt_id, request.variables, request.include_rag)
        
        # 2. Get the analysis template
        analysis_template = self.template_manager.get_template(request.analysis_template_id)
        if not analysis_template:
            raise ValueError(f"Analysis template not found: {request.analysis_template_id}")
        
        # 3. Generate analysis instructions
        analysis_instructions = self.template_manager.generate_analysis_instructions(request.analysis_template_id)
        
        # 4. Compile the complete prompt
        compiled_prompt = self._compile_complete_prompt(
            base_prompt_data,
            analysis_template,
            analysis_instructions,
            request.context_data
        )
        
        # 5. Estimate tokens
        estimated_tokens = self._estimate_tokens(compiled_prompt)
        
        return CompiledAnalysisPrompt(
            prompt_id=request.prompt_id,
            analysis_template_id=request.analysis_template_id,
            compiled_prompt=compiled_prompt,
            rag_content=base_prompt_data.get("rag_content"),
            analysis_schema=analysis_template.schema,
            instructions=analysis_template.instructions,
            estimated_tokens=estimated_tokens,
            metadata={
                "base_prompt_tokens": base_prompt_data.get("estimated_tokens"),
                "analysis_instructions_tokens": self._estimate_tokens(analysis_instructions),
                "compilation_method": "integrated",
                "variables_used": list(request.variables.keys()),
                "rag_sources_count": len(base_prompt_data.get("rag_content", {})),
                "analysis_complexity": analysis_template.metadata.get("complexity", "unknown")
            }
        )
    
    def _get_base_prompt(self, prompt_id: str, variables: Dict[str, Any], include_rag: bool) -> Dict[str, Any]:
        """Get and compile the base prompt from prompt service"""
        try:
            # First get the prompt template
            prompt_url = f"{self.prompt_service_url}/prompt/{prompt_id}"
            response = requests.get(prompt_url, timeout=10)
            response.raise_for_status()
            prompt_data = response.json()
            
            # Then compile it with variables
            if variables or include_rag:
                compile_url = f"{self.prompt_service_url}/prompt/{prompt_id}/compile"
                compile_request = {
                    "variables": variables,
                    "inject_rag": include_rag,
                    "rag_injection_style": "context"
                }
                
                compile_response = requests.post(compile_url, json=compile_request, timeout=30)
                compile_response.raise_for_status()
                compiled_data = compile_response.json()
                
                return {
                    "template": prompt_data.get("prompt", {}),
                    "compiled_prompt": compiled_data.get("compiled_prompt", ""),
                    "rag_content": compiled_data.get("rag_content", {}),
                    "estimated_tokens": compiled_data.get("estimated_tokens"),
                    "variables": variables
                }
            else:
                # Just return the template
                template = prompt_data.get("prompt", {}).get("template", "")
                return {
                    "template": prompt_data.get("prompt", {}),
                    "compiled_prompt": template,
                    "rag_content": {},
                    "estimated_tokens": self._estimate_tokens(template),
                    "variables": {}
                }
                
        except requests.RequestException as e:
            logger.error(f"Error fetching prompt from service: {e}")
            raise ValueError(f"Failed to fetch prompt {prompt_id}: {str(e)}")
        except Exception as e:
            logger.error(f"Error processing prompt data: {e}")
            raise ValueError(f"Failed to process prompt {prompt_id}: {str(e)}")
    
    def _compile_complete_prompt(
        self,
        base_prompt_data: Dict[str, Any],
        analysis_template: AnalysisTemplate,
        analysis_instructions: str,
        context_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """Compile the complete prompt with analysis instructions"""
        
        sections = []
        
        # 1. Context section (if provided)
        if context_data:
            sections.append("=== ANALYSIS CONTEXT ===")
            for key, value in context_data.items():
                sections.append(f"{key.upper()}: {value}")
            sections.append("")
        
        # 2. Main prompt content
        sections.append("=== ANALYSIS TASK ===")
        sections.append(base_prompt_data["compiled_prompt"])
        sections.append("")
        
        # 3. RAG content (if available)
        rag_content = base_prompt_data.get("rag_content", {})
        if rag_content:
            sections.append("=== REFERENCE MATERIALS ===")
            for source, content in rag_content.items():
                sections.append(f"Source: {source}")
                sections.append(content)
                sections.append("")
        
        # 4. Analysis instructions
        sections.append("=== ANALYSIS INSTRUCTIONS ===")
        sections.append(f"Analysis Type: {analysis_template.name}")
        sections.append(f"Description: {analysis_template.description}")
        sections.append("")
        sections.append(analysis_instructions)
        sections.append("")
        
        # 5. Final output requirements
        sections.append("=== FINAL REQUIREMENTS ===")
        sections.append("1. Perform the analysis task using the provided context and reference materials")
        sections.append("2. Structure your response EXACTLY according to the analysis instructions above")
        sections.append("3. Ensure all required fields are included in your response")
        sections.append("4. Validate that your response matches the specified JSON schema")
        sections.append("5. Do not include any explanatory text outside the required format")
        
        return "\n".join(sections)
    
    def _estimate_tokens(self, text: str) -> int:
        """Estimate token count for text (rough approximation)"""
        # Simple estimation: ~4 characters per token for English text
        return max(1, len(text) // 4)
    
    def validate_compilation_request(self, request: AnalysisRequest) -> Tuple[bool, List[str]]:
        """Validate an analysis request before compilation"""
        errors = []
        
        # Check if prompt exists
        try:
            prompt_url = f"{self.prompt_service_url}/prompt/{request.prompt_id}"
            response = requests.get(prompt_url, timeout=5)
            if response.status_code != 200:
                errors.append(f"Prompt not found: {request.prompt_id}")
        except Exception as e:
            errors.append(f"Cannot access prompt service: {str(e)}")
        
        # Check if analysis template exists
        template = self.template_manager.get_template(request.analysis_template_id)
        if not template:
            errors.append(f"Analysis template not found: {request.analysis_template_id}")
        
        # Validate variables if provided
        if request.variables:
            for key, value in request.variables.items():
                if not isinstance(key, str):
                    errors.append(f"Variable key must be string: {key}")
                if value is None:
                    errors.append(f"Variable value cannot be None: {key}")
        
        # Check token limits
        if request.max_tokens:
            if request.max_tokens < 100:
                errors.append("max_tokens must be at least 100")
            elif request.max_tokens > 32000:
                errors.append("max_tokens cannot exceed 32000")
        
        # Validate temperature
        if request.temperature is not None:
            if not 0.0 <= request.temperature <= 2.0:
                errors.append("temperature must be between 0.0 and 2.0")
        
        return len(errors) == 0, errors
    
    def get_compilation_preview(self, request: AnalysisRequest) -> Dict[str, Any]:
        """Get a preview of what the compilation would produce without full compilation"""
        try:
            # Validate request first
            is_valid, errors = self.validate_compilation_request(request)
            if not is_valid:
                return {
                    "valid": False,
                    "errors": errors
                }
            
            # Get basic information
            template = self.template_manager.get_template(request.analysis_template_id)
            
            # Estimate components
            estimated_base_tokens = 500  # Rough estimate without actual compilation
            instruction_text = self.template_manager.generate_analysis_instructions(request.analysis_template_id)
            instruction_tokens = self._estimate_tokens(instruction_text)
            
            context_tokens = 0
            if request.context_data:
                context_text = json.dumps(request.context_data)
                context_tokens = self._estimate_tokens(context_text)
            
            total_estimated_tokens = estimated_base_tokens + instruction_tokens + context_tokens
            
            return {
                "valid": True,
                "prompt_id": request.prompt_id,
                "analysis_template_id": request.analysis_template_id,
                "analysis_template_name": template.name if template else "Unknown",
                "estimated_tokens": {
                    "base_prompt": estimated_base_tokens,
                    "analysis_instructions": instruction_tokens,
                    "context_data": context_tokens,
                    "total": total_estimated_tokens
                },
                "expected_output_format": template.output_format.value if template else "unknown",
                "complexity": template.metadata.get("complexity", "unknown") if template else "unknown",
                "variables_required": list(request.variables.keys()) if request.variables else [],
                "rag_enabled": request.include_rag
            }
            
        except Exception as e:
            logger.error(f"Error generating compilation preview: {e}")
            return {
                "valid": False,
                "errors": [f"Preview generation failed: {str(e)}"]
            }
    
    def get_analysis_template_info(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about an analysis template"""
        template = self.template_manager.get_template(template_id)
        if not template:
            return None
        
        return {
            "id": template.id,
            "name": template.name,
            "description": template.description,
            "version": template.version,
            "category": template.category.value,
            "output_format": template.output_format.value,
            "schema": template.schema,
            "instructions": template.instructions,
            "example_output": template.example_output,
            "metadata": template.metadata,
            "created_at": template.created_at.isoformat() if template.created_at else None,
            "updated_at": template.updated_at.isoformat() if template.updated_at else None
        }
    
    def list_compatible_prompts(self, analysis_template_id: str) -> List[Dict[str, Any]]:
        """List prompts that are compatible with the given analysis template"""
        try:
            # Get all prompts from prompt service
            prompts_url = f"{self.prompt_service_url}/prompts"
            response = requests.get(prompts_url, timeout=10)
            response.raise_for_status()
            prompts_data = response.json()
            
            compatible_prompts = []
            prompts = prompts_data.get("prompts", [])
            
            # Get analysis template info
            template = self.template_manager.get_template(analysis_template_id)
            if not template:
                return []
            
            template_category = template.category.value
            
            for prompt in prompts:
                # Check compatibility based on tags and categories
                prompt_tags = prompt.get("tags", [])
                
                compatibility_score = 0
                reasons = []
                
                # Category matching
                if template_category in prompt_tags:
                    compatibility_score += 3
                    reasons.append(f"Category match: {template_category}")
                
                # Tag-based compatibility
                for tag in prompt_tags:
                    if tag in ["analysis", "decision", "business", "risk", "technical"]:
                        compatibility_score += 1
                        reasons.append(f"Compatible tag: {tag}")
                
                # RAG source compatibility
                if prompt.get("rag_sources"):
                    compatibility_score += 2
                    reasons.append("Has RAG sources for context")
                
                if compatibility_score > 0:
                    compatible_prompts.append({
                        "prompt_id": prompt["id"],
                        "name": prompt.get("description", ""),
                        "tags": prompt_tags,
                        "compatibility_score": compatibility_score,
                        "compatibility_reasons": reasons,
                        "has_rag": bool(prompt.get("rag_sources"))
                    })
            
            # Sort by compatibility score
            compatible_prompts.sort(key=lambda x: x["compatibility_score"], reverse=True)
            
            return compatible_prompts
            
        except Exception as e:
            logger.error(f"Error listing compatible prompts: {e}")
            return []
