"""
BPMN AI Service

This service handles BPMN generation and modification using OpenAI GPT-4.
It provides natural language to BPMN conversion and context-aware editing capabilities.
"""
import os
import json
import logging
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime
import openai
from dataclasses import dataclass

# Configure logging
logger = logging.getLogger(__name__)

@dataclass
class BPMNGenerationRequest:
    """Request model for BPMN generation"""
    user_input: str
    context: Optional[Dict] = None
    model_history: Optional[List[str]] = None

@dataclass
class BPMNModificationRequest:
    """Request model for BPMN modification"""
    current_bpmn: str
    modification_request: str
    context: Optional[Dict] = None

@dataclass
class BPMNResponse:
    """Response model for BPMN operations"""
    bpmn_xml: str
    explanation: str
    elements_created: List[str]
    suggestions: List[str]
    confidence_score: float
    validation_errors: Optional[List[str]] = None

class BPMNAIService:
    """
    Main service class for BPMN AI operations.
    Handles generation, modification, and validation of BPMN models using OpenAI.
    """
    
    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-4"):
        """
        Initialize the BPMN AI service.
        
        Args:
            api_key: OpenAI API key (if None, will use environment variable)
            model: OpenAI model to use (default: gpt-4)
        """
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("OpenAI API key is required")
            
        self.client = openai.OpenAI(api_key=self.api_key)
        self.model = model
        
        # Load BPMN generation prompt templates
        self._load_prompt_templates()
        
    def _load_prompt_templates(self):
        """Load prompt templates for BPMN generation using enhanced system"""
        try:
            from src.prompts.bpmn_prompts import get_prompt_generator
            self.prompt_generator = get_prompt_generator()
            logger.info("Enhanced BPMN prompt system loaded successfully")
        except ImportError as e:
            logger.warning(f"Could not load enhanced prompt system: {e}")
            # Fallback to basic prompts
            self._load_basic_prompts()
    
    def _load_basic_prompts(self):
        """Load basic prompt templates as fallback"""
        self.generation_prompt_template = """
You are a BPMN expert. Generate valid BPMN 2.0 XML based on the user's description.

User Request: {user_input}

Context: {context}

Requirements:
1. Generate complete, valid BPMN 2.0 XML with proper XML formatting
2. Use DOUBLE QUOTES for all XML attributes (not single quotes)
3. Include proper process structure with start/end events
4. Use appropriate BPMN elements for the described process
5. Ensure all elements have unique IDs
6. Include human-readable labels
7. Follow BPMN 2.0 standard conventions
8. Include sequence flows connecting all elements

Response Format (JSON):
{{
    "bpmn_xml": "<bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\">...</bpmn:definitions>",
    "explanation": "Brief explanation of the generated process",
    "elements_created": ["list", "of", "elements"],
    "suggestions": ["potential", "improvements"],
    "confidence_score": 0.95
}}

IMPORTANT: Use double quotes in XML attributes, not single quotes. Generate only valid JSON response.
"""

        self.modification_prompt_template = """
You are a BPMN expert. Modify the existing BPMN model based on the user's request.

Current BPMN XML: {current_bpmn}

Modification Request: {modification_request}

Context: {context}

Requirements:
1. Preserve existing structure where possible
2. Make minimal necessary changes
3. Maintain valid BPMN 2.0 XML structure
4. Ensure all element IDs remain unique
5. Update labels appropriately

Response Format (JSON):
{{
    "bpmn_xml": "<bpmn:definitions>...</bpmn:definitions>",
    "explanation": "Brief explanation of the modifications made",
    "elements_created": ["new", "elements"],
    "suggestions": ["potential", "improvements"],
    "confidence_score": 0.95
}}

Generate only valid JSON response.
"""

    async def generate_bpmn(self, request: BPMNGenerationRequest) -> BPMNResponse:
        """
        Generate BPMN from natural language description.
        
        Args:
            request: BPMN generation request
            
        Returns:
            BPMNResponse with generated BPMN and metadata
        """
        try:
            # Use enhanced prompt generator if available
            if hasattr(self, 'prompt_generator'):
                prompt = self.prompt_generator.generate_creation_prompt(
                    request.user_input,
                    request.context
                )
            else:
                # Fallback to basic prompt
                context_str = json.dumps(request.context) if request.context else "None"
                prompt = self.generation_prompt_template.format(
                    user_input=request.user_input,
                    context=context_str
                )
            
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a BPMN modeling expert with deep knowledge of business process design and BPMN 2.0 standards."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,  # Low temperature for consistent output
                max_tokens=4000
            )
            
            # Parse the response
            content = response.choices[0].message.content
            if content is None:
                raise Exception("Empty response from OpenAI")
            content = content.strip()
            
            logger.info(f"Raw OpenAI response: {content[:200]}...")  # Log first 200 chars
            
            # Try to extract JSON from the response
            if content.startswith('```json'):
                content = content[7:-3].strip()
            elif content.startswith('```'):
                content = content[3:-3].strip()
            
            # If response doesn't look like JSON, try to extract it
            if not content.startswith('{'):
                # Look for JSON block in the response
                import re
                json_match = re.search(r'(\{.*\})', content, re.DOTALL)
                if json_match:
                    content = json_match.group(1)
                else:
                    # If no JSON found, create a response with the text
                    logger.warning(f"No JSON found in response, creating fallback response")
                    fallback_response = {
                        "bpmn_xml": self._create_simple_bpmn_template(request.user_input),
                        "explanation": content,
                        "elements_created": ["startEvent", "task", "endEvent"],
                        "suggestions": ["Consider adding more details to the process"],
                        "confidence_score": 0.6
                    }
                    return BPMNResponse(**fallback_response)
                
            # Clean the JSON content to remove control characters
            try:
                # Remove control characters that break JSON parsing
                import re
                # Remove non-printable characters except newlines and tabs in JSON strings
                content = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', content)
                
                ai_response = json.loads(content)
            except json.JSONDecodeError as e:
                logger.error(f"JSON parsing failed after cleaning: {str(e)}")
                logger.error(f"Cleaned content: {content[:500]}...")
                # Create fallback response if JSON parsing still fails
                fallback_response = {
                    "bpmn_xml": self._create_simple_bpmn_template(request.user_input),
                    "explanation": f"Error parsing AI response: {str(e)}",
                    "elements_created": ["startEvent", "task", "endEvent"],
                    "suggestions": ["Consider regenerating the process"],
                    "confidence_score": 0.3
                }
                return BPMNResponse(**fallback_response)
            
            # Create BPMNResponse object
            bpmn_xml = ai_response.get('bpmn_xml', '')
            
            # Normalize BPMN XML format (fix single quotes to double quotes)
            if bpmn_xml:
                bpmn_xml = self._normalize_bpmn_xml(bpmn_xml)
            
            bpmn_response = BPMNResponse(
                bpmn_xml=bpmn_xml,
                explanation=ai_response.get('explanation', ''),
                elements_created=ai_response.get('elements_created', []),
                suggestions=ai_response.get('suggestions', []),
                confidence_score=ai_response.get('confidence_score', 0.8)
            )
            
            # Enhanced validation using utilities
            validation_errors = self._validate_bpmn_xml(bpmn_response.bpmn_xml)
            bpmn_response.validation_errors = validation_errors
            
            logger.info(f"Generated BPMN for request: {request.user_input[:50]}...")
            return bpmn_response
            
        except Exception as e:
            logger.error(f"Error generating BPMN: {str(e)}")
            raise Exception(f"Failed to generate BPMN: {str(e)}")
    
    async def modify_bpmn(self, request: BPMNModificationRequest) -> BPMNResponse:
        """
        Modify existing BPMN based on natural language request.
        
        Args:
            request: BPMN modification request
            
        Returns:
            BPMNResponse with modified BPMN and metadata
        """
        try:
            # Use enhanced prompt generator if available
            if hasattr(self, 'prompt_generator'):
                prompt = self.prompt_generator.generate_modification_prompt(
                    request.current_bpmn,
                    request.modification_request,
                    request.context
                )
            else:
                # Fallback to basic prompt
                context_str = json.dumps(request.context) if request.context else "None"
                prompt = self.modification_prompt_template.format(
                    current_bpmn=request.current_bpmn,
                    modification_request=request.modification_request,
                    context=context_str
                )
            
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a BPMN modeling expert."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=4000
            )
            
            # Parse the response
            content = response.choices[0].message.content
            if content is None:
                raise Exception("Empty response from OpenAI")
            content = content.strip()
            
            # Try to extract JSON from the response
            if content.startswith('```json'):
                content = content[7:-3].strip()
            elif content.startswith('```'):
                content = content[3:-3].strip()
                
            ai_response = json.loads(content)
            
            # Create BPMNResponse object
            bpmn_xml = ai_response.get('bpmn_xml', '')
            
            # Normalize BPMN XML format (fix single quotes to double quotes)
            if bpmn_xml:
                bpmn_xml = self._normalize_bpmn_xml(bpmn_xml)
            
            bpmn_response = BPMNResponse(
                bpmn_xml=bpmn_xml,
                explanation=ai_response.get('explanation', ''),
                elements_created=ai_response.get('elements_created', []),
                suggestions=ai_response.get('suggestions', []),
                confidence_score=ai_response.get('confidence_score', 0.8)
            )
            
            # Validate the modified BPMN
            validation_errors = self._validate_bpmn_xml(bpmn_response.bpmn_xml)
            bpmn_response.validation_errors = validation_errors
            
            logger.info(f"Modified BPMN for request: {request.modification_request[:50]}...")
            return bpmn_response
            
        except Exception as e:
            logger.error(f"Error modifying BPMN: {str(e)}")
            raise Exception(f"Failed to modify BPMN: {str(e)}")
    
    def _validate_bpmn_xml(self, bpmn_xml: str) -> List[str]:
        """
        Comprehensive validation of BPMN XML structure.
        
        Args:
            bpmn_xml: BPMN XML string to validate
            
        Returns:
            List of validation error messages
        """
        try:
            from src.utils.bpmn_utils import get_bpmn_validator
            validator = get_bpmn_validator()
            validation_result = validator.validate_complete(bpmn_xml)
            return validation_result.get('errors', [])
        except ImportError:
            logger.warning("Enhanced BPMN validation not available, using basic validation")
            return self._basic_validate_bpmn_xml(bpmn_xml)
        except Exception as e:
            logger.error(f"Error in comprehensive validation: {e}")
            return [f"Validation error: {str(e)}"]
    
    def _basic_validate_bpmn_xml(self, bpmn_xml: str) -> List[str]:
        """
        Basic validation of BPMN XML structure (fallback method).
        
        Args:
            bpmn_xml: BPMN XML string to validate
            
        Returns:
            List of validation error messages
        """
        errors = []
        
        try:
            import xml.etree.ElementTree as ET
            
            # Check if it's valid XML
            root = ET.fromstring(bpmn_xml)
            
            # Check for required BPMN namespace
            if 'bpmn' not in bpmn_xml:
                errors.append("Missing BPMN namespace")
                
            # Check for definitions element
            if 'bpmn:definitions' not in bpmn_xml:
                errors.append("Missing bpmn:definitions root element")
                
            # Check for process element
            if 'bpmn:process' not in bpmn_xml:
                errors.append("Missing bpmn:process element")
                
        except ET.ParseError as e:
            errors.append(f"Invalid XML structure: {str(e)}")
        except Exception as e:
            errors.append(f"Validation error: {str(e)}")
            
        return errors
    
    async def explain_bpmn(self, bpmn_xml: str) -> str:
        """
        Generate natural language explanation of a BPMN model.
        
        Args:
            bpmn_xml: BPMN XML to explain
            
        Returns:
            Natural language explanation
        """
        try:
            prompt = f"""
Analyze the following BPMN model and provide a clear, natural language explanation of the process:

BPMN XML: {bpmn_xml}

Provide:
1. High-level process description
2. Key activities and decision points
3. Process flow and participants
4. Any notable patterns or complexity

Keep the explanation clear and accessible to business users.
"""
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a business process analyst."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=1000
            )
            
            content = response.choices[0].message.content
            if content is None:
                raise Exception("Empty response from OpenAI")
            return content.strip()
            
        except Exception as e:
            logger.error(f"Error explaining BPMN: {str(e)}")
            return f"Error generating explanation: {str(e)}"
    
    def _normalize_bpmn_xml(self, bpmn_xml: str) -> str:
        """
        Normalize BPMN XML to ensure proper formatting for bpmn-js.
        
        Args:
            bpmn_xml: Raw BPMN XML string
            
        Returns:
            Normalized BPMN XML with proper formatting
        """
        try:
            import re
            
            # Convert single quotes to double quotes in XML attributes
            # This regex finds attribute="value" or attribute='value' patterns
            # and normalizes them to use double quotes
            normalized = re.sub(r"(\w+)='([^']*)'", r'\1="\2"', bpmn_xml)
            
            # Clean up any extra whitespace while preserving structure
            normalized = re.sub(r'>\s+<', '><', normalized.strip())
            
            # Ensure proper XML declaration if missing
            if not normalized.startswith('<?xml'):
                normalized = '<?xml version="1.0" encoding="UTF-8"?>\n' + normalized
            
            logger.debug(f"Normalized BPMN XML: {normalized[:200]}...")
            return normalized
            
        except Exception as e:
            logger.error(f"Error normalizing BPMN XML: {e}")
            return bpmn_xml  # Return original if normalization fails

    def _create_simple_bpmn_template(self, process_description: str) -> str:
        """
        Create a simple BPMN template as fallback.
        
        Args:
            process_description: Description of the process
            
        Returns:
            Basic BPMN XML template
        """
        try:
            from src.utils.bpmn_utils import BPMNTemplate
            activities = [f"Process: {process_description}"]
            return BPMNTemplate.generate_simple_process("Generated Process", activities)
        except Exception as e:
            logger.error(f"Error creating BPMN template: {e}")
            # Return minimal valid BPMN
            return '''<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  id="Definitions_1" 
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="simple_process" name="Generated Process" isExecutable="true">
    <bpmn:startEvent id="start" name="Start">
      <bpmn:outgoing>start_to_task</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="task" name="Process Task">
      <bpmn:incoming>start_to_task</bpmn:incoming>
      <bpmn:outgoing>task_to_end</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="end" name="End">
      <bpmn:incoming>task_to_end</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="start_to_task" sourceRef="start" targetRef="task" />
    <bpmn:sequenceFlow id="task_to_end" sourceRef="task" targetRef="end" />
  </bpmn:process>
</bpmn:definitions>'''

# Singleton instance for the service
_bpmn_ai_service = None

def get_bpmn_ai_service() -> BPMNAIService:
    """Get singleton instance of BPMN AI service"""
    global _bpmn_ai_service
    if _bpmn_ai_service is None:
        _bpmn_ai_service = BPMNAIService()
    return _bpmn_ai_service
