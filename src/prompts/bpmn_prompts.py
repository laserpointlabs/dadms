"""
BPMN Prompt Engineering System

Advanced prompt templates and generation system for BPMN AI assistance.
Implements the multi-stage prompt pipeline outlined in the development plan.
"""
import json
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum

logger = logging.getLogger(__name__)

class PromptStage(Enum):
    """Stages in the BPMN prompt pipeline"""
    INTENT_CLASSIFICATION = "intent_classification"
    ELEMENT_EXTRACTION = "element_extraction"
    STRUCTURE_GENERATION = "structure_generation"
    VALIDATION_CHECK = "validation_check"
    QUALITY_ASSURANCE = "quality_assurance"

class BPMNIntentType(Enum):
    """Types of BPMN-related intents"""
    CREATE_NEW = "create_new"
    MODIFY_EXISTING = "modify_existing"
    ADD_ELEMENT = "add_element"
    REMOVE_ELEMENT = "remove_element"
    EXPLAIN_MODEL = "explain_model"
    VALIDATE_MODEL = "validate_model"
    OPTIMIZE_MODEL = "optimize_model"

@dataclass
class BPMNElementMapping:
    """Mapping of natural language to BPMN elements"""
    xml_tag: str
    description: str
    common_phrases: List[str]
    required_attributes: Optional[List[str]] = None
    optional_attributes: Optional[List[str]] = None

@dataclass
class ProcessPattern:
    """Common process modeling patterns"""
    name: str
    description: str
    template: str
    keywords: List[str]
    complexity_score: int

class BPMNElementLibrary:
    """Library of BPMN elements with natural language mappings"""
    
    def __init__(self):
        """Initialize the BPMN element library"""
        self.events = {
            "start": BPMNElementMapping(
                xml_tag="bpmn:startEvent",
                description="Initiates a process",
                common_phrases=["start", "begin", "initiate", "trigger", "commence", "launch"],
                required_attributes=["id"],
                optional_attributes=["name"]
            ),
            "end": BPMNElementMapping(
                xml_tag="bpmn:endEvent",
                description="Terminates a process",
                common_phrases=["end", "finish", "complete", "terminate", "conclude", "close"],
                required_attributes=["id"],
                optional_attributes=["name"]
            ),
            "timer": BPMNElementMapping(
                xml_tag="bpmn:intermediateCatchEvent",
                description="Timer event for delays",
                common_phrases=["wait", "delay", "timer", "pause", "schedule", "timeout"],
                required_attributes=["id"],
                optional_attributes=["name"]
            ),
            "message": BPMNElementMapping(
                xml_tag="bpmn:intermediateCatchEvent",
                description="Message event for communication",
                common_phrases=["receive", "message", "notification", "signal", "alert"],
                required_attributes=["id"],
                optional_attributes=["name"]
            )
        }
        
        self.activities = {
            "task": BPMNElementMapping(
                xml_tag="bpmn:task",
                description="A generic unit of work",
                common_phrases=["do", "perform", "execute", "process", "handle", "work"],
                required_attributes=["id"],
                optional_attributes=["name"]
            ),
            "user_task": BPMNElementMapping(
                xml_tag="bpmn:userTask",
                description="A task performed by a human user",
                common_phrases=["review", "approve", "check", "verify", "manual", "human", "user"],
                required_attributes=["id"],
                optional_attributes=["name", "assignee", "candidateGroups"]
            ),
            "service_task": BPMNElementMapping(
                xml_tag="bpmn:serviceTask",
                description="An automated task performed by a system",
                common_phrases=["automatic", "system", "service", "api", "automated", "compute"],
                required_attributes=["id"],
                optional_attributes=["name", "implementation"]
            ),
            "script_task": BPMNElementMapping(
                xml_tag="bpmn:scriptTask",
                description="A task that executes a script",
                common_phrases=["script", "code", "calculation", "compute", "execute"],
                required_attributes=["id"],
                optional_attributes=["name", "scriptFormat", "script"]
            )
        }
        
        self.gateways = {
            "exclusive": BPMNElementMapping(
                xml_tag="bpmn:exclusiveGateway",
                description="Exclusive decision point (XOR)",
                common_phrases=["if", "either", "or", "choose", "decide", "condition", "exclusive"],
                required_attributes=["id"],
                optional_attributes=["name"]
            ),
            "parallel": BPMNElementMapping(
                xml_tag="bpmn:parallelGateway",
                description="Parallel execution (AND)",
                common_phrases=["parallel", "simultaneously", "and", "fork", "join", "concurrent"],
                required_attributes=["id"],
                optional_attributes=["name"]
            ),
            "inclusive": BPMNElementMapping(
                xml_tag="bpmn:inclusiveGateway",
                description="Inclusive decision point (OR)",
                common_phrases=["inclusive", "multiple", "some", "any", "several"],
                required_attributes=["id"],
                optional_attributes=["name"]
            )
        }

class ProcessPatternLibrary:
    """Library of common process patterns"""
    
    def __init__(self):
        """Initialize the process pattern library"""
        self.patterns = {
            "sequential": ProcessPattern(
                name="Sequential Process",
                description="Linear sequence of activities",
                template="start -> activity1 -> activity2 -> ... -> end",
                keywords=["then", "next", "after", "followed by", "sequential", "linear"],
                complexity_score=1
            ),
            "parallel": ProcessPattern(
                name="Parallel Process",
                description="Parallel execution of activities",
                template="start -> split -> [activity1, activity2] -> join -> end",
                keywords=["parallel", "simultaneously", "at the same time", "concurrent", "split"],
                complexity_score=3
            ),
            "decision": ProcessPattern(
                name="Decision Process",
                description="Process with decision points",
                template="start -> activity -> decision -> [path1, path2] -> end",
                keywords=["if", "decide", "choose", "condition", "branch", "alternative"],
                complexity_score=2
            ),
            "approval": ProcessPattern(
                name="Approval Process",
                description="Process requiring approval steps",
                template="start -> submit -> review -> approve/reject -> end",
                keywords=["approve", "review", "accept", "reject", "authorization", "validation"],
                complexity_score=3
            ),
            "loop": ProcessPattern(
                name="Loop Process",
                description="Process with repeating elements",
                template="start -> activity -> check -> [continue/exit] -> end",
                keywords=["repeat", "loop", "until", "while", "iterate", "cycle"],
                complexity_score=4
            )
        }

class BPMNPromptGenerator:
    """
    Advanced BPMN prompt generator with multi-stage pipeline support.
    """
    
    def __init__(self):
        """Initialize the prompt generator"""
        self.element_library = BPMNElementLibrary()
        self.pattern_library = ProcessPatternLibrary()
        
        # Load base prompt templates
        self._initialize_prompt_templates()
    
    def _initialize_prompt_templates(self):
        """Initialize base prompt templates"""
        
        self.intent_classification_prompt = """
Analyze the user's request and classify the intent for BPMN modeling.

User Request: {user_input}
Current Context: {context}

Classify the intent as one of:
- CREATE_NEW: Creating a new BPMN process
- MODIFY_EXISTING: Modifying an existing process
- ADD_ELEMENT: Adding elements to existing process
- REMOVE_ELEMENT: Removing elements from process
- EXPLAIN_MODEL: Explaining a BPMN model
- VALIDATE_MODEL: Validating a BPMN model
- OPTIMIZE_MODEL: Optimizing a BPMN model

Also identify:
- Key entities mentioned (actors, systems, activities)
- Process patterns (sequential, parallel, decision-based)
- Complexity indicators

Respond in JSON format:
{{
    "intent": "CREATE_NEW",
    "confidence": 0.95,
    "entities": ["entity1", "entity2"],
    "patterns": ["sequential", "approval"],
    "complexity": "medium"
}}
"""

        self.element_extraction_prompt = """
Extract BPMN elements from the user's description.

User Request: {user_input}
Intent: {intent}
Context: {context}

Identify specific BPMN elements needed:
- Events (start, end, timer, message)
- Activities (tasks, user tasks, service tasks)
- Gateways (exclusive, parallel, inclusive)
- Data objects and flows

For each element, specify:
- Type and subtype
- Name/label
- Properties/attributes
- Relationships to other elements

Respond in JSON format:
{{
    "elements": [
        {{
            "type": "startEvent",
            "name": "Process Started",
            "id": "start_1",
            "properties": {{}}
        }},
        {{
            "type": "userTask",
            "name": "Review Application",
            "id": "task_1",
            "properties": {{"assignee": "reviewer"}}
        }}
    ],
    "flows": [
        {{
            "from": "start_1",
            "to": "task_1",
            "condition": null
        }}
    ]
}}
"""

        self.structure_generation_prompt = """
Generate complete BPMN 2.0 XML structure.

Elements to Include: {elements}
Process Pattern: {pattern}
Context: {context}

Requirements:
1. Generate valid BPMN 2.0 XML
2. Include all specified elements
3. Create proper sequence flows
4. Ensure unique IDs
5. Add meaningful names and labels
6. Follow BPMN best practices

Include both process definition and basic diagram information.

Response format:
{{
    "bpmn_xml": "<bpmn:definitions>...</bpmn:definitions>",
    "explanation": "Generated a sequential approval process...",
    "elements_created": ["startEvent", "userTask", "exclusiveGateway", "endEvent"],
    "patterns_used": ["sequential", "approval"],
    "complexity_score": 3
}}
"""

        self.validation_prompt = """
Validate the generated BPMN model for correctness.

BPMN XML: {bpmn_xml}
Original Requirements: {original_request}

Check for:
1. XML syntax and structure
2. BPMN 2.0 compliance
3. Process completeness (start/end events)
4. Element connectivity
5. Semantic correctness
6. Best practice adherence

Identify any issues and suggest corrections.

Response format:
{{
    "is_valid": true,
    "syntax_errors": [],
    "semantic_errors": [],
    "warnings": [],
    "suggestions": ["Consider adding error handling", "Add timer events for SLA"],
    "confidence_score": 0.92
}}
"""

        self.quality_assurance_prompt = """
Perform quality assurance on the BPMN model.

BPMN XML: {bpmn_xml}
Original Request: {user_input}
Validation Results: {validation_results}

Evaluate:
1. Completeness: Does it fulfill the user's requirements?
2. Clarity: Are element names clear and descriptive?
3. Efficiency: Is the process flow optimal?
4. Maintainability: Is the model easy to understand and modify?
5. Standards: Does it follow BPMN best practices?

Provide improvement recommendations and rate the overall quality.

Response format:
{{
    "quality_score": 8.5,
    "completeness": 9,
    "clarity": 8,
    "efficiency": 8,
    "maintainability": 9,
    "standards_compliance": 9,
    "recommendations": ["Add lane for process owner", "Consider adding data objects"],
    "overall_assessment": "Good quality model that meets requirements"
}}
"""

    def generate_creation_prompt(self, user_input: str, context: Optional[Dict] = None) -> str:
        """
        Generate optimized prompt for BPMN creation.
        
        Args:
            user_input: User's natural language description
            context: Additional context information
            
        Returns:
            Optimized prompt string
        """
        # Analyze user input for patterns and complexity
        detected_patterns = self._detect_patterns(user_input)
        suggested_elements = self._suggest_elements(user_input)
        
        context_str = json.dumps(context) if context else "None"
        
        # Enhanced creation prompt with pattern recognition
        enhanced_prompt = f"""
You are a BPMN expert. Create a valid BPMN 2.0 process model based on the user's description.

User Request: {user_input}
Context: {context_str}
Detected Patterns: {detected_patterns}
Suggested Elements: {suggested_elements}

Requirements:
1. Generate complete, valid BPMN 2.0 XML
2. Include proper process structure with start/end events
3. Use appropriate BPMN elements for the described process
4. Ensure all elements have unique IDs with meaningful names
5. Include human-readable labels
6. Follow BPMN 2.0 standard conventions
7. Consider the detected patterns and suggested elements
8. Add sequence flows to connect all elements properly

Response Format (JSON only):
{{
    "bpmn_xml": "<bpmn:definitions xmlns:bpmn='http://www.omg.org/spec/BPMN/20100524/MODEL' xmlns:bpmndi='http://www.omg.org/spec/BPMN/20100524/DI' xmlns:dc='http://www.omg.org/spec/DD/20100524/DC' xmlns:di='http://www.omg.org/spec/DD/20100524/DI' id='Definitions_1' targetNamespace='http://bpmn.io/schema/bpmn'>...</bpmn:definitions>",
    "explanation": "Brief explanation of the generated process and key design decisions",
    "elements_created": ["startEvent", "userTask", "exclusiveGateway", "endEvent"],
    "suggestions": ["Consider adding error handling", "Add timer events for deadlines"],
    "confidence_score": 0.95,
    "patterns_used": ["sequential", "approval"],
    "complexity_assessment": "medium"
}}

Generate only valid JSON response.
"""
        return enhanced_prompt

    def generate_modification_prompt(self, current_bpmn: str, modification_request: str, context: Optional[Dict] = None) -> str:
        """
        Generate optimized prompt for BPMN modification.
        
        Args:
            current_bpmn: Current BPMN XML
            modification_request: Requested modifications
            context: Additional context
            
        Returns:
            Optimized modification prompt
        """
        # Analyze current model
        try:
            from src.utils.bpmn_utils import get_bpmn_extractor
            extractor = get_bpmn_extractor()
            current_summary = extractor.get_process_summary(current_bpmn)
        except Exception as e:
            logger.warning(f"Could not analyze current BPMN: {e}")
            current_summary = {"error": "Could not analyze current model"}
        
        context_str = json.dumps(context) if context else "None"
        
        enhanced_prompt = f"""
You are a BPMN expert. Modify the existing BPMN model based on the user's request while preserving the existing structure where possible.

Current BPMN XML: {current_bpmn}

Current Model Summary: {json.dumps(current_summary)}

Modification Request: {modification_request}
Context: {context_str}

Requirements:
1. Preserve existing structure where possible
2. Make minimal necessary changes to achieve the requested modification
3. Maintain valid BPMN 2.0 XML structure
4. Ensure all element IDs remain unique
5. Update labels and names appropriately
6. Maintain proper sequence flow connectivity
7. Follow BPMN best practices

Response Format (JSON only):
{{
    "bpmn_xml": "<bpmn:definitions>...</bpmn:definitions>",
    "explanation": "Brief explanation of the modifications made and rationale",
    "elements_created": ["new", "elements", "added"],
    "elements_modified": ["existing", "elements", "changed"],
    "elements_removed": ["elements", "that", "were", "removed"],
    "suggestions": ["potential", "improvements"],
    "confidence_score": 0.95,
    "impact_assessment": "low|medium|high"
}}

Generate only valid JSON response.
"""
        return enhanced_prompt

    def _detect_patterns(self, user_input: str) -> List[str]:
        """
        Detect process patterns in user input.
        
        Args:
            user_input: User's description
            
        Returns:
            List of detected pattern names
        """
        detected = []
        user_input_lower = user_input.lower()
        
        for pattern_name, pattern in self.pattern_library.patterns.items():
            for keyword in pattern.keywords:
                if keyword in user_input_lower:
                    if pattern_name not in detected:
                        detected.append(pattern_name)
                    break
        
        return detected

    def _suggest_elements(self, user_input: str) -> List[str]:
        """
        Suggest BPMN elements based on user input.
        
        Args:
            user_input: User's description
            
        Returns:
            List of suggested element types
        """
        suggested = []
        user_input_lower = user_input.lower()
        
        # Check all element categories
        for category_name, category in [
            ("events", self.element_library.events),
            ("activities", self.element_library.activities),
            ("gateways", self.element_library.gateways)
        ]:
            for element_name, element in category.items():
                for phrase in element.common_phrases:
                    if phrase in user_input_lower:
                        suggested.append(f"{category_name}:{element_name}")
                        break
        
        return suggested

    def generate_pipeline_prompts(self, user_input: str, context: Optional[Dict] = None) -> Dict[PromptStage, str]:
        """
        Generate prompts for all stages of the pipeline.
        
        Args:
            user_input: User's request
            context: Additional context
            
        Returns:
            Dictionary mapping stages to prompts
        """
        context_str = json.dumps(context) if context else "None"
        
        return {
            PromptStage.INTENT_CLASSIFICATION: self.intent_classification_prompt.format(
                user_input=user_input,
                context=context_str
            ),
            PromptStage.ELEMENT_EXTRACTION: self.element_extraction_prompt.format(
                user_input=user_input,
                intent="TBD",  # Would be filled from previous stage
                context=context_str
            ),
            PromptStage.STRUCTURE_GENERATION: self.structure_generation_prompt.format(
                elements="TBD",  # Would be filled from previous stage
                pattern="TBD",   # Would be filled from previous stage
                context=context_str
            ),
            PromptStage.VALIDATION_CHECK: self.validation_prompt.format(
                bpmn_xml="TBD",  # Would be filled from previous stage
                original_request=user_input
            ),
            PromptStage.QUALITY_ASSURANCE: self.quality_assurance_prompt.format(
                bpmn_xml="TBD",  # Would be filled from previous stage
                user_input=user_input,
                validation_results="TBD"  # Would be filled from previous stage
            )
        }

# Singleton instance
_prompt_generator = None

def get_prompt_generator() -> BPMNPromptGenerator:
    """Get singleton prompt generator instance"""
    global _prompt_generator
    if _prompt_generator is None:
        _prompt_generator = BPMNPromptGenerator()
    return _prompt_generator
