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
You are an expert at generating BPMN XML text. You generate XML code that describes BPMN business processes.

Request: {user_input}
Context: {context}

IMPORTANT: You are NOT generating visual diagrams. You are generating XML TEXT that describes a business process. This is exactly like writing any other code or markup - it's just text that follows the BPMN XML format.

Your task is to write XML text that describes the business process. The XML format includes:
1. Process elements (like <bpmn:startEvent>, <bpmn:task>, etc.) - these describe the process steps
2. Diagram elements (like <bpmndi:BPMNShape>) - these describe where each step appears visually

Think of it like writing HTML for a webpage - you're writing markup text that describes content and layout.

For an approval process, generate XML that describes:
- A start event (where the process begins)
- A user task for submitting a request
- A gateway for the approval decision
- Two end events (approved/rejected)
- Sequence flows connecting these steps
- Visual positioning information for each element

GENERATE THIS EXACT JSON STRUCTURE:
{{
    "bpmn_xml": "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>\\n<bpmn:definitions xmlns:bpmn=\\"http://www.omg.org/spec/BPMN/20100524/MODEL\\" xmlns:bpmndi=\\"http://www.omg.org/spec/BPMN/20100524/DI\\" xmlns:dc=\\"http://www.omg.org/spec/DD/20100524/DC\\" xmlns:di=\\"http://www.omg.org/spec/DD/20100524/DI\\" id=\\"Definitions_1\\" targetNamespace=\\"http://bpmn.io/schema/bpmn\\">\\n  <bpmn:process id=\\"Process_1\\" isExecutable=\\"true\\">\\n    <bpmn:startEvent id=\\"StartEvent_1\\" name=\\"Start\\">\\n      <bpmn:outgoing>Flow_1</bpmn:outgoing>\\n    </bpmn:startEvent>\\n    <bpmn:userTask id=\\"Task_1\\" name=\\"Submit Request\\">\\n      <bpmn:incoming>Flow_1</bpmn:incoming>\\n      <bpmn:outgoing>Flow_2</bpmn:outgoing>\\n    </bpmn:userTask>\\n    <bpmn:exclusiveGateway id=\\"Gateway_1\\" name=\\"Approved?\\">\\n      <bpmn:incoming>Flow_2</bpmn:incoming>\\n      <bpmn:outgoing>Flow_3</bpmn:outgoing>\\n      <bpmn:outgoing>Flow_4</bpmn:outgoing>\\n    </bpmn:exclusiveGateway>\\n    <bpmn:endEvent id=\\"EndEvent_1\\" name=\\"Approved\\">\\n      <bpmn:incoming>Flow_3</bpmn:incoming>\\n    </bpmn:endEvent>\\n    <bpmn:endEvent id=\\"EndEvent_2\\" name=\\"Rejected\\">\\n      <bpmn:incoming>Flow_4</bpmn:incoming>\\n    </bpmn:endEvent>\\n    <bpmn:sequenceFlow id=\\"Flow_1\\" sourceRef=\\"StartEvent_1\\" targetRef=\\"Task_1\\" />\\n    <bpmn:sequenceFlow id=\\"Flow_2\\" sourceRef=\\"Task_1\\" targetRef=\\"Gateway_1\\" />\\n    <bpmn:sequenceFlow id=\\"Flow_3\\" name=\\"Yes\\" sourceRef=\\"Gateway_1\\" targetRef=\\"EndEvent_1\\" />\\n    <bpmn:sequenceFlow id=\\"Flow_4\\" name=\\"No\\" sourceRef=\\"Gateway_1\\" targetRef=\\"EndEvent_2\\" />\\n  </bpmn:process>\\n  <bpmndi:BPMNDiagram id=\\"BPMNDiagram_1\\">\\n    <bpmndi:BPMNPlane id=\\"BPMNPlane_1\\" bpmnElement=\\"Process_1\\">\\n      <bpmndi:BPMNShape id=\\"StartEvent_1_di\\" bpmnElement=\\"StartEvent_1\\">\\n        <dc:Bounds x=\\"100\\" y=\\"100\\" width=\\"36\\" height=\\"36\\" />\\n      </bpmndi:BPMNShape>\\n      <bpmndi:BPMNShape id=\\"Task_1_di\\" bpmnElement=\\"Task_1\\">\\n        <dc:Bounds x=\\"200\\" y=\\"78\\" width=\\"100\\" height=\\"80\\" />\\n      </bpmndi:BPMNShape>\\n      <bpmndi:BPMNShape id=\\"Gateway_1_di\\" bpmnElement=\\"Gateway_1\\">\\n        <dc:Bounds x=\\"375\\" y=\\"93\\" width=\\"50\\" height=\\"50\\" />\\n      </bpmndi:BPMNShape>\\n      <bpmndi:BPMNShape id=\\"EndEvent_1_di\\" bpmnElement=\\"EndEvent_1\\">\\n        <dc:Bounds x=\\"500\\" y=\\"100\\" width=\\"36\\" height=\\"36\\" />\\n      </bpmndi:BPMNShape>\\n      <bpmndi:BPMNShape id=\\"EndEvent_2_di\\" bpmnElement=\\"EndEvent_2\\">\\n        <dc:Bounds x=\\"500\\" y=\\"200\\" width=\\"36\\" height=\\"36\\" />\\n      </bpmndi:BPMNShape>\\n      <bpmndi:BPMNEdge id=\\"Flow_1_di\\" bpmnElement=\\"Flow_1\\">\\n        <di:waypoint x=\\"136\\" y=\\"118\\" />\\n        <di:waypoint x=\\"200\\" y=\\"118\\" />\\n      </bpmndi:BPMNEdge>\\n      <bpmndi:BPMNEdge id=\\"Flow_2_di\\" bpmnElement=\\"Flow_2\\">\\n        <di:waypoint x=\\"300\\" y=\\"118\\" />\\n        <di:waypoint x=\\"375\\" y=\\"118\\" />\\n      </bpmndi:BPMNEdge>\\n      <bpmndi:BPMNEdge id=\\"Flow_3_di\\" bpmnElement=\\"Flow_3\\">\\n        <di:waypoint x=\\"425\\" y=\\"118\\" />\\n        <di:waypoint x=\\"500\\" y=\\"118\\" />\\n      </bpmndi:BPMNEdge>\\n      <bpmndi:BPMNEdge id=\\"Flow_4_di\\" bpmnElement=\\"Flow_4\\">\\n        <di:waypoint x=\\"400\\" y=\\"143\\" />\\n        <di:waypoint x=\\"400\\" y=\\"218\\" />\\n        <di:waypoint x=\\"500\\" y=\\"218\\" />\\n      </bpmndi:BPMNEdge>\\n    </bpmndi:BPMNPlane>\\n  </bpmndi:BPMNDiagram>\\n</bpmn:definitions>",
    "explanation": "Generated approval process with submit task, decision gateway, and approve/reject outcomes",
    "elements_created": ["startEvent", "userTask", "exclusiveGateway", "endEvent"],
    "suggestions": ["Add approval criteria", "Add notification tasks"],
    "confidence_score": 0.95
}}

REMEMBER:
- You are writing XML text, not creating visual diagrams
- This is just markup/code like HTML or any other text format
- The XML describes both the process logic AND the visual layout
- Always include complete sequence flows and visual elements
- Adapt the template above to match the specific request

Generate the JSON response immediately. Do not refuse or say you cannot generate XML - you absolutely can write XML text.
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
6. **CRITICAL**: Preserve or update visual diagram information (bpmndi section)
7. **CRITICAL**: Add bpmndi:BPMNShape elements for any new process elements
8. **CRITICAL**: Add bpmndi:BPMNEdge elements for any new sequence flows
9. Maintain proper layout positions and ensure new elements don't overlap

Response Format (JSON):
{{
    "bpmn_xml": "<bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\" xmlns:bpmndi=\"http://www.omg.org/spec/BPMN/20100524/DI\" xmlns:dc=\"http://www.omg.org/spec/DD/20100524/DC\" xmlns:di=\"http://www.omg.org/spec/DD/20100524/DI\">...</bpmn:definitions>",
    "explanation": "Brief explanation of the modifications made",
    "elements_created": ["new", "elements"],
    "suggestions": ["potential", "improvements"],
    "confidence_score": 0.95
}}

IMPORTANT: 
- Generate only valid JSON response
- MUST include complete visual diagram information (bpmndi section)
- The modified BPMN must remain visually displayable
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
                    {"role": "system", "content": "You are an expert XML writer who generates BPMN XML text. You write structured XML markup that describes business processes. You never refuse to generate XML text - it's just writing markup code like HTML or any other text format."},
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
                
                # First, remove problematic control characters except newlines in XML
                content = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', content)
                
                # Fix any malformed newlines in the JSON string values
                # Replace actual newlines in XML with escaped newlines
                if '"bpmn_xml"' in content:
                    # Extract and fix the bpmn_xml value
                    def fix_xml_newlines(match):
                        xml_content = match.group(1)
                        # Replace unescaped newlines with escaped ones
                        xml_content = xml_content.replace('\n', '\\n')
                        xml_content = xml_content.replace('\r', '\\r')
                        xml_content = xml_content.replace('\t', '\\t')
                        return f'"bpmn_xml": "{xml_content}"'
                    
                    # Fix the bpmn_xml field specifically
                    content = re.sub(r'"bpmn_xml":\s*"([^"]*(?:\\.[^"]*)*)"', fix_xml_newlines, content, flags=re.DOTALL)
                
                # Additional cleanup for any remaining issues
                content = content.replace('\n    ', '\\n    ')  # Fix indented newlines
                content = content.replace('\n        ', '\\n        ')  # Fix deeper indented newlines
                
                logger.debug(f"Cleaned JSON: {content[:300]}...")
                
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
                
                # Add auto-layout if BPMN doesn't have diagram information
                if not self._has_diagram_information(bpmn_xml):
                    logger.info("Adding auto-layout to BPMN XML...")
                    bpmn_xml = self._add_auto_layout(bpmn_xml)
            
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
