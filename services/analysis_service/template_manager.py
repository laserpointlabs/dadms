"""
Analysis Template Manager
Handles loading, validation, and management of analysis templates
"""

import json
import os
from typing import Dict, List, Optional, Any
from pathlib import Path
import logging
from datetime import datetime

from models import AnalysisTemplate, AnalysisFormat, AnalysisCategory

logger = logging.getLogger(__name__)

class AnalysisTemplateManager:
    """Manages analysis templates with validation and caching"""
    
    def __init__(self, templates_file: str = "analysis_templates.json"):
        self.templates_file = templates_file
        self.templates: Dict[str, AnalysisTemplate] = {}
        self.load_templates()
    
    def load_templates(self) -> None:
        """Load analysis templates from JSON file"""
        try:
            templates_path = Path(__file__).parent / self.templates_file
            
            if not templates_path.exists():
                logger.warning(f"Templates file not found: {templates_path}")
                return
            
            with open(templates_path, 'r', encoding='utf-8') as f:
                templates_data = json.load(f)
            
            self.templates = {}
            for template_id, template_data in templates_data.items():
                try:
                    # Convert datetime strings to datetime objects
                    if 'created_at' in template_data:
                        template_data['created_at'] = datetime.fromisoformat(template_data['created_at'])
                    if 'updated_at' in template_data:
                        template_data['updated_at'] = datetime.fromisoformat(template_data['updated_at'])
                    
                    template = AnalysisTemplate(**template_data)
                    self.templates[template_id] = template
                    logger.debug(f"Loaded analysis template: {template_id}")
                    
                except Exception as e:
                    logger.error(f"Error loading template {template_id}: {e}")
                    continue
            
            logger.info(f"Loaded {len(self.templates)} analysis templates")
            
        except Exception as e:
            logger.error(f"Error loading analysis templates: {e}")
            self.templates = {}
    
    def get_template(self, template_id: str) -> Optional[AnalysisTemplate]:
        """Get a specific analysis template by ID"""
        return self.templates.get(template_id)
    
    def list_templates(self, category: Optional[AnalysisCategory] = None) -> List[AnalysisTemplate]:
        """List all templates, optionally filtered by category"""
        templates = list(self.templates.values())
        
        if category:
            templates = [t for t in templates if t.category == category]
        
        return sorted(templates, key=lambda x: x.name)
    
    def get_template_schema(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Get the JSON schema for a specific template"""
        template = self.get_template(template_id)
        return template.schema if template else None
    
    def get_template_instructions(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Get the analysis instructions for a specific template"""
        template = self.get_template(template_id)
        return template.instructions if template else None
    
    def validate_template_output(self, template_id: str, output_data: Any) -> Dict[str, Any]:
        """Validate output data against template schema"""
        template = self.get_template(template_id)
        if not template:
            return {
                "valid": False,
                "errors": [f"Template not found: {template_id}"]
            }
        
        try:
            # Basic validation - in production, use jsonschema library
            errors = []
            warnings = []
            
            if template.output_format == AnalysisFormat.JSON:
                if not isinstance(output_data, dict):
                    errors.append("Output must be a JSON object")
                    return {"valid": False, "errors": errors}
                
                # Check required fields from schema
                schema = template.schema
                if "required" in schema:
                    for field in schema["required"]:
                        if field not in output_data:
                            errors.append(f"Missing required field: {field}")
                
                # Check field types and structure
                if "properties" in schema:
                    for field, field_schema in schema["properties"].items():
                        if field in output_data:
                            value = output_data[field]
                            field_type = field_schema.get("type")
                            
                            if field_type == "string" and not isinstance(value, str):
                                errors.append(f"Field '{field}' must be a string")
                            elif field_type == "number" and not isinstance(value, (int, float)):
                                errors.append(f"Field '{field}' must be a number")
                            elif field_type == "array" and not isinstance(value, list):
                                errors.append(f"Field '{field}' must be an array")
                            elif field_type == "object" and not isinstance(value, dict):
                                errors.append(f"Field '{field}' must be an object")
            
            return {
                "valid": len(errors) == 0,
                "errors": errors,
                "warnings": warnings,
                "compliance_score": 1.0 - (len(errors) * 0.1)  # Simple scoring
            }
            
        except Exception as e:
            logger.error(f"Error validating template output: {e}")
            return {
                "valid": False,
                "errors": [f"Validation error: {str(e)}"]
            }
    
    def generate_analysis_instructions(self, template_id: str) -> str:
        """Generate formatted instructions for LLM inclusion"""
        template = self.get_template(template_id)
        if not template:
            return ""
        
        instructions = []
        
        # Add format requirement
        format_instruction = template.instructions.get("format", "")
        if format_instruction:
            instructions.append(f"OUTPUT FORMAT REQUIREMENT:\n{format_instruction}")
        
        # Add guidelines
        guidelines = template.instructions.get("guidelines", [])
        if guidelines:
            instructions.append("ANALYSIS GUIDELINES:")
            for i, guideline in enumerate(guidelines, 1):
                instructions.append(f"{i}. {guideline}")
        
        # Add quality checks
        quality_checks = template.instructions.get("quality_checks", [])
        if quality_checks:
            instructions.append("QUALITY CHECKS:")
            for i, check in enumerate(quality_checks, 1):
                instructions.append(f"{i}. {check}")
        
        # Add schema information
        instructions.append("REQUIRED OUTPUT SCHEMA:")
        instructions.append(json.dumps(template.schema, indent=2))
        
        return "\n\n".join(instructions)
    
    def get_example_output(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Get example output for a template"""
        template = self.get_template(template_id)
        return template.example_output if template else None
    
    def reload_templates(self) -> None:
        """Reload templates from file"""
        self.load_templates()
    
    def add_template(self, template: AnalysisTemplate) -> bool:
        """Add a new template (runtime only, not persisted)"""
        try:
            self.templates[template.id] = template
            logger.info(f"Added analysis template: {template.id}")
            return True
        except Exception as e:
            logger.error(f"Error adding template: {e}")
            return False
    
    def remove_template(self, template_id: str) -> bool:
        """Remove a template (runtime only)"""
        if template_id in self.templates:
            del self.templates[template_id]
            logger.info(f"Removed analysis template: {template_id}")
            return True
        return False
    
    def get_template_metadata(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Get metadata for a specific template"""
        template = self.get_template(template_id)
        if not template:
            return None
        
        return {
            "id": template.id,
            "name": template.name,
            "description": template.description,
            "version": template.version,
            "category": template.category.value,
            "output_format": template.output_format.value,
            "complexity": template.metadata.get("complexity", "unknown"),
            "estimated_tokens": template.metadata.get("estimated_tokens"),
            "tags": template.metadata.get("tags", []),
            "created_at": template.created_at.isoformat() if template.created_at else None,
            "updated_at": template.updated_at.isoformat() if template.updated_at else None
        }
    
    def search_templates(self, query: str, category: Optional[AnalysisCategory] = None) -> List[Dict[str, Any]]:
        """Search templates by name, description, or tags"""
        results = []
        query_lower = query.lower()
        
        for template in self.list_templates(category):
            score = 0
            
            # Check name
            if query_lower in template.name.lower():
                score += 3
            
            # Check description
            if query_lower in template.description.lower():
                score += 2
            
            # Check tags
            tags = template.metadata.get("tags", [])
            for tag in tags:
                if query_lower in tag.lower():
                    score += 1
            
            if score > 0:
                metadata = self.get_template_metadata(template.id)
                if metadata:
                    metadata["relevance_score"] = score
                    results.append(metadata)
        
        return sorted(results, key=lambda x: x["relevance_score"], reverse=True)
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get statistics about loaded templates"""
        total_templates = len(self.templates)
        
        categories = {}
        formats = {}
        complexities = {}
        
        for template in self.templates.values():
            # Count by category
            cat = template.category.value
            categories[cat] = categories.get(cat, 0) + 1
            
            # Count by format
            fmt = template.output_format.value
            formats[fmt] = formats.get(fmt, 0) + 1
            
            # Count by complexity
            complexity = template.metadata.get("complexity", "unknown")
            complexities[complexity] = complexities.get(complexity, 0) + 1
        
        return {
            "total_templates": total_templates,
            "categories": categories,
            "output_formats": formats,
            "complexity_levels": complexities,
            "last_loaded": datetime.now().isoformat()
        }
