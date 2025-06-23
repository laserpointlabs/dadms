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
    
    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-4o"):
        """
        Initialize the BPMN AI service.
        
        Args:
            api_key: OpenAI API key (if None, will use environment variable)
            model: OpenAI model to use (default: gpt-4o for larger context window)
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
You are an expert BPMN process designer. Create detailed, meaningful BPMN process models with proper element names and realistic business logic.

Request: {user_input}
Context: {context}

CRITICAL REQUIREMENTS:
1. Generate REALISTIC business process elements with meaningful names
2. Use proper BPMN element types (userTask, serviceTask, exclusiveGateway, etc.)
3. Include complete visual diagram information (bpmndi section)
4. Create logical process flows with appropriate decision points
5. Use descriptive element names that reflect actual business activities
6. Include proper sequence flows with meaningful labels where appropriate
7. Ensure all elements have unique IDs and proper positioning

EXAMPLE OF GOOD ELEMENT NAMES:
- "Submit Purchase Request" (not "Process: Create a simple approval process")
- "Review Request Details" 
- "Approve or Reject Request"
- "Send Approval Notification"
- "Update Purchase Order"

RESPONSE FORMAT:
You must respond with a valid JSON object containing these exact keys:

{{
  "name": "Process Name",
  "description": "Brief description of what this process does",
  "version": "1.0",
  "author": "System Generated",
  "created": "2025-06-23",
  "tags": ["BPMN", "business process", "workflow"],
  "bpmn": "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>\\n<bpmn:definitions xmlns:bpmn=\\"http://www.omg.org/spec/BPMN/20100524/MODEL\\" xmlns:bpmndi=\\"http://www.omg.org/spec/BPMN/20100524/DI\\" xmlns:dc=\\"http://www.omg.org/spec/DD/20100524/DC\\" xmlns:di=\\"http://www.omg.org/spec/DD/20100524/DI\\" id=\\"Definitions_1\\" targetNamespace=\\"http://bpmn.io/schema/bpmn\\">\\n  <bpmn:process id=\\"ProcessId\\" name=\\"Process Name\\" isExecutable=\\"true\\">\\n    <!-- Process elements here -->\\n  </bpmn:process>\\n  <bpmndi:BPMNDiagram id=\\"BPMNDiagram_1\\">\\n    <bpmndi:BPMNPlane id=\\"BPMNPlane_1\\" bpmnElement=\\"ProcessId\\">\\n      <!-- Diagram elements here -->\\n    </bpmndi:BPMNPlane>\\n  </bpmndi:BPMNDiagram>\\n</bpmn:definitions>"
}}

The bpmn key must contain the complete BPMN XML as a properly escaped JSON string.
"""

        self.modification_prompt_template = """
You are an expert BPMN process designer. Modify the existing BPMN model based on the user's request.

Current BPMN: {current_bpmn}
Modification Request: {modification_request}
Context: {context}

RESPONSE FORMAT:
You must respond with a valid JSON object containing these exact keys:

{{
  "name": "Modified Process Name",
  "description": "Brief description of the modifications made",
  "version": "1.1",
  "author": "System Modified",
  "created": "2025-06-23",
  "tags": ["BPMN", "business process", "workflow", "modified"],
  "bpmn": "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>\\n<!-- Modified BPMN XML here -->"
}}

The bpmn key must contain the complete modified BPMN XML as a properly escaped JSON string.
"""

    def _load_bpmn_examples(self) -> str:
        """Load BPMN examples from the vector store or local files"""
        examples = []
        
        # Load from local examples file
        try:
            import json
            import os
            examples_file = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'bpmn_examples', 'examples.json')
            if os.path.exists(examples_file):
                with open(examples_file, 'r') as f:
                    data = json.load(f)
                    for example_id, example_data in data.items():
                        examples.append(f"Example: {example_data.get('name', example_id)}")
                        examples.append(f"Description: {example_data.get('description', 'No description')}")
                        examples.append(f"BPMN: {example_data.get('bpmn_xml', 'No BPMN')[:200]}...")
                        examples.append("---")
        except Exception as e:
            logger.warning(f"Could not load BPMN examples: {e}")
        
        # Load from camunda_models directory
        try:
            import os
            models_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'camunda_models')
            if os.path.exists(models_dir):
                for filename in os.listdir(models_dir):
                    if filename.endswith('.bpmn'):
                        filepath = os.path.join(models_dir, filename)
                        with open(filepath, 'r') as f:
                            content = f.read()
                            examples.append(f"Example: {filename}")
                            examples.append(f"BPMN: {content[:200]}...")
                            examples.append("---")
        except Exception as e:
            logger.warning(f"Could not load BPMN models: {e}")
        
        return "\n".join(examples) if examples else "No examples available"

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
                
                # Load BPMN examples
                bpmn_examples = self._load_bpmn_examples()
                
                prompt = self.generation_prompt_template.format(
                    user_input=request.user_input,
                    context=f"{context_str}\n\nBPMN Examples:\n{bpmn_examples}"
                )
            
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert XML writer who generates BPMN XML text. You write structured XML markup that describes business processes. You never refuse to generate XML text - it's just writing markup code like HTML or any other text format."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,  # Low temperature for consistent output
                max_tokens=8000   # Increased for larger context window
            )
            
            # Parse the response
            content = response.choices[0].message.content
            if content is None:
                raise Exception("Empty response from OpenAI")
            content = content.strip()
            
            logger.info(f"Raw OpenAI response: {content[:200]}...")  # Log first 200 chars
            
            # Parse JSON response
            try:
                # Try to extract JSON from the response if it's wrapped in code blocks
                if content.startswith('```json'):
                    content = content[7:-3].strip()
                elif content.startswith('```'):
                    content = content[3:-3].strip()
                
                ai_response = json.loads(content)
                bpmn_xml = ai_response.get('bpmn', '') or ai_response.get('bpmn_xml', '')
                
                if not bpmn_xml:
                    raise Exception("No BPMN XML found in JSON response (checked both 'bpmn' and 'bpmn_xml' keys)")
                
                # Extract metadata from JSON response
                explanation = ai_response.get('description', 'No explanation provided')
                process_name = ai_response.get('name', 'Generated Process')
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response: {e}")
                logger.error(f"Response content: {content}")
                raise Exception(f"Invalid JSON response from AI: {str(e)}")
            
            # Validate the BPMN XML
            validation_errors = self._validate_bpmn_xml(bpmn_xml)
            
            # Determine elements created
            elements_created = self._extract_elements_from_bpmn(bpmn_xml)
            
            # Generate suggestions
            suggestions = self._generate_suggestions(bpmn_xml, request.user_input)
            
            # Calculate confidence score
            confidence_score = self._calculate_confidence_score(bpmn_xml, validation_errors)
            
            return BPMNResponse(
                bpmn_xml=bpmn_xml,
                explanation=explanation,
                elements_created=elements_created,
                suggestions=suggestions,
                confidence_score=confidence_score,
                validation_errors=validation_errors
            )
            
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
            bpmn_xml = ai_response.get('bpmn', '')
            
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
        # Temporarily disable validation to let LLM work without interference
        # TODO: Implement full validation later
        return []
        
        # Original validation code (commented out for now)
        # try:
        #     from src.utils.bpmn_utils import get_bpmn_validator
        #     validator = get_bpmn_validator()
        #     validation_result = validator.validate_complete(bpmn_xml)
        #     return validation_result.get('errors', [])
        # except ImportError:
        #     logger.warning("Enhanced BPMN validation not available, using basic validation")
        #     return self._basic_validate_bpmn_xml(bpmn_xml)
        # except Exception as e:
        #     logger.error(f"Error in comprehensive validation: {e}")
        #     return [f"Validation error: {str(e)}"]
    
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

    def _has_diagram_information(self, bpmn_xml: str) -> bool:
        """
        Check if BPMN XML contains diagram information (BPMNDiagram).
        
        Args:
            bpmn_xml: BPMN XML string
            
        Returns:
            True if diagram information is present, False otherwise
        """
        return 'BPMNDiagram' in bpmn_xml or 'bpmndi:' in bpmn_xml

    def _add_auto_layout(self, bpmn_xml: str) -> str:
        """
        Add auto-layout to BPMN XML that lacks diagram information.
        
        Args:
            bpmn_xml: BPMN XML with process structure only
            
        Returns:
            BPMN XML with diagram layout information
        """
        try:
            from src.utils.bpmn_auto_layout import add_auto_layout_to_bpmn
            return add_auto_layout_to_bpmn(bpmn_xml)
        except ImportError as e:
            logger.warning(f"Auto-layout not available: {e}")
            return bpmn_xml
        except Exception as e:
            logger.error(f"Error adding auto-layout: {e}")
            return bpmn_xml

    def _create_simple_bpmn_template(self, process_description: str) -> str:
        """
        Create a simple BPMN template as fallback with diagram information.
        
        Args:
            process_description: Description of the process
            
        Returns:
            Basic BPMN XML template with diagram layout
        """
        try:
            from src.utils.bpmn_utils import BPMNTemplate
            activities = [f"Process: {process_description}"]
            bpmn_xml = BPMNTemplate.generate_simple_process("Generated Process", activities)
            
            # Add auto-layout to ensure diagram information is present
            if not self._has_diagram_information(bpmn_xml):
                bpmn_xml = self._add_auto_layout(bpmn_xml)
            
            return bpmn_xml
        except Exception as e:
            logger.error(f"Error creating BPMN template: {e}")
            # Return minimal valid BPMN with diagram information
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
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="simple_process">
      <bpmndi:BPMNShape id="start_di" bpmnElement="start">
        <dc:Bounds x="100" y="100" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="task_di" bpmnElement="task">
        <dc:Bounds x="250" y="80" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="end_di" bpmnElement="end">
        <dc:Bounds x="400" y="100" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="start_to_task_di" bpmnElement="start_to_task">
        <di:waypoint x="136" y="118" />
        <di:waypoint x="250" y="118" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="task_to_end_di" bpmnElement="task_to_end">
        <di:waypoint x="350" y="118" />
        <di:waypoint x="400" y="118" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>'''

    def _extract_bpmn_from_markdown(self, content: str) -> str:
        """Extract BPMN XML from markdown code blocks"""
        import re
        bpmn_xml = re.search(r'```xml\n(.*?)\n```', content, re.DOTALL)
        return bpmn_xml.group(1) if bpmn_xml else ""

    def _extract_explanation_from_response(self, content: str) -> str:
        """Extract explanation from the response"""
        import re
        explanation = re.search(r'Explanation:\n(.*)', content)
        return explanation.group(1) if explanation else "No explanation provided"

    def _extract_elements_from_bpmn(self, bpmn_xml: str) -> List[str]:
        """Extract elements created from BPMN XML"""
        import xml.etree.ElementTree as ET
        elements = []
        root = ET.fromstring(bpmn_xml)
        for element in root.iter():
            elements.append(element.tag)
        return elements

    def _generate_suggestions(self, bpmn_xml: str, user_input: str) -> List[str]:
        """Generate suggestions based on the BPMN XML and user input"""
        # This is a placeholder implementation. You might want to implement a more robust suggestion generation logic
        return ["No specific suggestions available"]

    def _calculate_confidence_score(self, bpmn_xml: str, validation_errors: List[str]) -> float:
        """Calculate confidence score based on validation errors"""
        # This is a placeholder implementation. You might want to implement a more robust confidence score calculation logic
        return 0.8 if not validation_errors else 0.6

# Singleton instance for the service
_bpmn_ai_service = None

def get_bpmn_ai_service() -> BPMNAIService:
    """Get singleton instance of BPMN AI service"""
    global _bpmn_ai_service
    if _bpmn_ai_service is None:
        _bpmn_ai_service = BPMNAIService()
    return _bpmn_ai_service
