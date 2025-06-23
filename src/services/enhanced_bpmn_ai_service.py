"""
Enhanced BPMN AI Service

This service provides improved BPMN generation with:
1. External prompt management from files
2. Example storage and retrieval
3. Better BPMN structure validation
4. Vector store integration for examples
5. Configurable prompt templates
"""

import os
import json
import logging
import asyncio
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
from pathlib import Path
import openai
from dataclasses import dataclass, field
import yaml
from enum import Enum
import numpy as np
from sentence_transformers import SentenceTransformer
try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import Filter, FieldCondition, MatchValue, SearchRequest, VectorParams, Distance, PointStruct
    QDRANT_AVAILABLE = True
except ImportError:
    QDRANT_AVAILABLE = False

# Configure logging
logger = logging.getLogger(__name__)

class BPMNComplexity(Enum):
    """BPMN complexity levels"""
    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"

@dataclass
class BPMNExample:
    """BPMN example for training and reference"""
    id: str
    name: str
    description: str
    natural_language: str
    bpmn_xml: str
    complexity: BPMNComplexity
    tags: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)

@dataclass
class PromptTemplate:
    """Prompt template configuration"""
    name: str
    description: str
    template: str
    variables: List[str]
    examples: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class BPMNGenerationRequest:
    """Enhanced request model for BPMN generation"""
    user_input: str
    context: Optional[Dict] = None
    model_history: Optional[List[str]] = None
    complexity_preference: Optional[BPMNComplexity] = None
    include_examples: bool = True
    max_examples: int = 3
    template_name: Optional[str] = None

@dataclass
class BPMNResponse:
    """Enhanced response model for BPMN generation"""
    bpmn_xml: str
    explanation: str
    elements_created: List[str]
    suggestions: List[str]
    confidence_score: float
    validation_errors: List[str] = field(default_factory=list)
    examples_used: List[str] = field(default_factory=list)
    complexity_level: BPMNComplexity = BPMNComplexity.MODERATE
    generation_time: float = 0.0

class ExampleStore:
    """Manages BPMN examples for training and reference"""
    
    def __init__(self, storage_path: str = "data/bpmn_examples"):
        """Initialize the example store"""
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.examples_file = self.storage_path / "examples.json"
        self.examples: Dict[str, BPMNExample] = {}
        self._load_examples()
    
    def _load_examples(self):
        """Load examples from storage"""
        if self.examples_file.exists():
            try:
                with open(self.examples_file, 'r') as f:
                    data = json.load(f)
                    for example_data in data.values():
                        example = BPMNExample(**example_data)
                        example.created_at = datetime.fromisoformat(example_data['created_at'])
                        self.examples[example.id] = example
                logger.info(f"Loaded {len(self.examples)} BPMN examples")
            except Exception as e:
                logger.error(f"Error loading examples: {e}")
    
    def save_examples(self):
        """Save examples to storage"""
        try:
            data = {}
            for example_id, example in self.examples.items():
                example_dict = example.__dict__.copy()
                example_dict['created_at'] = example.created_at.isoformat()
                data[example_id] = example_dict
            
            with open(self.examples_file, 'w') as f:
                json.dump(data, f, indent=2)
            logger.info(f"Saved {len(self.examples)} BPMN examples")
        except Exception as e:
            logger.error(f"Error saving examples: {e}")
    
    def add_example(self, example: BPMNExample):
        """Add a new example"""
        self.examples[example.id] = example
        self.save_examples()
        logger.info(f"Added example: {example.name}")
    
    def find_similar_examples(self, user_input: str, max_results: int = 3) -> List[BPMNExample]:
        """Find similar examples based on user input"""
        # Simple keyword matching for now
        # TODO: Implement vector similarity search
        user_lower = user_input.lower()
        similar_examples = []
        
        for example in self.examples.values():
            score = 0
            # Check natural language description
            if any(word in example.natural_language.lower() for word in user_lower.split()):
                score += 2
            # Check tags
            if any(tag.lower() in user_lower for tag in example.tags):
                score += 1
            # Check description
            if any(word in example.description.lower() for word in user_lower.split()):
                score += 1
            
            if score > 0:
                similar_examples.append((example, score))
        
        # Sort by score and return top results
        similar_examples.sort(key=lambda x: x[1], reverse=True)
        return [example for example, score in similar_examples[:max_results]]
    
    def get_examples_by_complexity(self, complexity: BPMNComplexity) -> List[BPMNExample]:
        """Get examples by complexity level"""
        return [example for example in self.examples.values() if example.complexity == complexity]

class PromptManager:
    """Manages external prompt templates"""
    
    def __init__(self, prompts_path: str = "config/prompts"):
        """Initialize the prompt manager"""
        self.prompts_path = Path(prompts_path)
        self.prompts_path.mkdir(parents=True, exist_ok=True)
        self.templates: Dict[str, PromptTemplate] = {}
        self._load_templates()
    
    def _load_templates(self):
        """Load prompt templates from files"""
        # Load default templates
        self._create_default_templates()
        
        # Load custom templates from files
        for template_file in self.prompts_path.glob("*.yaml"):
            try:
                with open(template_file, 'r') as f:
                    data = yaml.safe_load(f)
                    template = PromptTemplate(**data)
                    self.templates[template.name] = template
                logger.info(f"Loaded template: {template.name}")
            except Exception as e:
                logger.error(f"Error loading template {template_file}: {e}")
    
    def _create_default_templates(self):
        """Create default prompt templates"""
        default_templates = {
            "basic_generation": PromptTemplate(
                name="basic_generation",
                description="Basic BPMN generation template",
                template="""You are an expert BPMN modeler. Create a BPMN XML model based on the following description:

User Input: {user_input}
Context: {context}

Requirements:
1. Generate valid BPMN 2.0 XML
2. Include proper diagram information for bpmn.io compatibility
3. Use meaningful element names and IDs
4. Ensure proper flow connections
5. Add appropriate documentation

{examples_section}

Please respond with a JSON object containing:
{{
    "bpmn_xml": "the complete BPMN XML",
    "explanation": "explanation of the generated model",
    "elements_created": ["list of element types created"],
    "suggestions": ["list of improvement suggestions"],
    "confidence_score": 0.85
}}""",
                variables=["user_input", "context", "examples_section"]
            ),
            "advanced_generation": PromptTemplate(
                name="advanced_generation",
                description="Advanced BPMN generation with detailed analysis",
                template="""You are an expert BPMN modeler and business process analyst. Create a comprehensive BPMN XML model based on the following description:

User Input: {user_input}
Context: {context}
Complexity Level: {complexity_level}

Analysis Requirements:
1. Identify process patterns and structures
2. Determine appropriate BPMN elements
3. Consider process optimization opportunities
4. Ensure compliance with BPMN 2.0 standards
5. Generate diagram information for proper visualization

{examples_section}

IMPORTANT: You MUST respond with ONLY a valid JSON object. Do not include any other text, explanations, or markdown formatting outside the JSON.

Expected JSON Response Format:
{{
    "bpmn_xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\\n<bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\" xmlns:bpmndi=\"http://www.omg.org/spec/BPMN/20100524/DI\" xmlns:dc=\"http://www.omg.org/spec/DD/20100524/DC\" xmlns:di=\"http://www.omg.org/spec/DD/20100524/DI\" id=\"Definitions_1\" targetNamespace=\"http://bpmn.io/schema/bpmn\">\\n  <!-- Complete BPMN XML here -->\\n</bpmn:definitions>",
    "explanation": "Detailed explanation of the process model design and logic",
    "elements_created": ["startEvent", "task", "gateway", "endEvent"],
    "suggestions": ["Consider adding error handling", "Include performance monitoring"],
    "confidence_score": 0.9,
    "complexity_analysis": "Analysis of process complexity and optimization opportunities"
}}

Remember: Return ONLY the JSON object, no additional text or formatting.""",
                variables=["user_input", "context", "complexity_level", "examples_section"]
            )
        }
        
        for template in default_templates.values():
            self.templates[template.name] = template
    
    def get_template(self, name: str) -> Optional[PromptTemplate]:
        """Get a prompt template by name"""
        return self.templates.get(name)
    
    def render_template(self, template_name: str, **kwargs) -> str:
        """Render a prompt template with variables"""
        template = self.get_template(template_name)
        if not template:
            raise ValueError(f"Template '{template_name}' not found")
        
        return template.template.format(**kwargs)

class BPMNValidator:
    """Validates BPMN XML structure and content"""
    
    def __init__(self):
        """Initialize the BPMN validator"""
        self.required_namespaces = [
            "xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\"",
            "xmlns:bpmndi=\"http://www.omg.org/spec/BPMN/20100524/DI\"",
            "xmlns:dc=\"http://www.omg.org/spec/DD/20100524/DC\""
        ]
    
    def validate_bpmn_xml(self, bpmn_xml: str) -> List[str]:
        """Validate BPMN XML and return list of errors"""
        errors = []
        
        # Basic XML validation
        if not bpmn_xml.strip().startswith('<?xml'):
            errors.append("Missing XML declaration")
        
        if not bpmn_xml.strip().startswith('<bpmn:definitions'):
            errors.append("Missing bpmn:definitions root element")
        
        # Check for required namespaces
        for namespace in self.required_namespaces:
            if namespace not in bpmn_xml:
                errors.append(f"Missing required namespace: {namespace}")
        
        # Check for basic BPMN structure
        if '<bpmn:process' not in bpmn_xml:
            errors.append("Missing bpmn:process element")
        
        if '<bpmn:startEvent' not in bpmn_xml:
            errors.append("Missing start event")
        
        if '<bpmn:endEvent' not in bpmn_xml:
            errors.append("Missing end event")
        
        # Check for diagram information
        if '<bpmndi:BPMNDiagram' not in bpmn_xml:
            errors.append("Missing diagram information for bpmn.io compatibility")
        
        return errors
    
    def fix_common_issues(self, bpmn_xml: str) -> str:
        """Fix common BPMN XML issues"""
        # Fix single quotes to double quotes
        bpmn_xml = bpmn_xml.replace("'", '"')
        
        # Ensure proper XML declaration
        if not bpmn_xml.strip().startswith('<?xml'):
            bpmn_xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + bpmn_xml
        
        # Add missing namespaces if needed
        if 'xmlns:bpmn=' not in bpmn_xml:
            bpmn_xml = bpmn_xml.replace(
                '<bpmn:definitions',
                '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI"'
            )
        
        # Add diagram information if missing
        if '<bpmndi:BPMNDiagram' not in bpmn_xml and '<bpmn:process' in bpmn_xml:
            # Extract process ID
            import re
            process_match = re.search(r'<bpmn:process[^>]*id="([^"]*)"', bpmn_xml)
            process_id = process_match.group(1) if process_match else "Process_1"
            
            # Find all elements to create diagram shapes
            elements = []
            element_patterns = [
                (r'<bpmn:startEvent[^>]*id="([^"]*)"', 'startEvent'),
                (r'<bpmn:endEvent[^>]*id="([^"]*)"', 'endEvent'),
                (r'<bpmn:task[^>]*id="([^"]*)"', 'task'),
                (r'<bpmn:userTask[^>]*id="([^"]*)"', 'userTask'),
                (r'<bpmn:exclusiveGateway[^>]*id="([^"]*)"', 'exclusiveGateway'),
                (r'<bpmn:parallelGateway[^>]*id="([^"]*)"', 'parallelGateway')
            ]
            
            for pattern, element_type in element_patterns:
                matches = re.findall(pattern, bpmn_xml)
                for match in matches:
                    elements.append((match, element_type))
            
            # Create diagram information
            diagram_xml = f"""
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="{process_id}">"""
            
            # Add shapes for each element
            x_pos = 152
            y_pos = 102
            for i, (element_id, element_type) in enumerate(elements):
                if element_type in ['startEvent', 'endEvent']:
                    width, height = 36, 36
                elif element_type == 'exclusiveGateway':
                    width, height = 50, 50
                else:
                    width, height = 100, 80
                
                diagram_xml += f"""
      <bpmndi:BPMNShape id="{element_id}_di" bpmnElement="{element_id}">
        <dc:Bounds x="{x_pos}" y="{y_pos}" width="{width}" height="{height}" />
      </bpmndi:BPMNShape>"""
                
                x_pos += width + 50
                if x_pos > 800:  # Wrap to next row
                    x_pos = 152
                    y_pos += 120
            
            # Add edges for sequence flows
            flow_pattern = r'<bpmn:sequenceFlow[^>]*id="([^"]*)"[^>]*sourceRef="([^"]*)"[^>]*targetRef="([^"]*)"'
            flows = re.findall(flow_pattern, bpmn_xml)
            
            for flow_id, source_id, target_id in flows:
                diagram_xml += f"""
      <bpmndi:BPMNEdge id="{flow_id}_di" bpmnElement="{flow_id}">
        <di:waypoint x="0" y="0" />
        <di:waypoint x="0" y="0" />
      </bpmndi:BPMNEdge>"""
            
            diagram_xml += """
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>"""
            
            # Insert diagram before closing definitions
            bpmn_xml = bpmn_xml.replace('</bpmn:definitions>', diagram_xml + '\n</bpmn:definitions>')
        
        return bpmn_xml

class EnhancedBPMNAIService:
    """
    Enhanced BPMN AI service with external prompt management and example storage.
    Now supports Qdrant vector search, max context enforcement, model selection, and summarization/truncation.
    """
    
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None, max_prompt_tokens: int = 6000):
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        self.model = str(model or os.getenv('OPENAI_MODEL', 'gpt-4'))  # Ensure always a string
        self.max_prompt_tokens = int(os.getenv('OPENAI_MAX_PROMPT_TOKENS', max_prompt_tokens))
        if not self.api_key:
            raise ValueError("OpenAI API key is required")
        self.client = openai.OpenAI(api_key=self.api_key)
        self.example_store = ExampleStore()
        self.prompt_manager = PromptManager()
        self.validator = BPMNValidator()
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.qdrant_client = None
        if QDRANT_AVAILABLE:
            try:
                self.qdrant_client = QdrantClient(host=os.getenv('QDRANT_HOST', 'localhost'), port=int(os.getenv('QDRANT_PORT', '6333')))
                # Ensure collection exists
                collection_name = "bpmn_examples"
                if collection_name not in [c.name for c in self.qdrant_client.get_collections().collections]:
                    self.qdrant_client.create_collection(
                        collection_name=collection_name,
                        vectors_config=VectorParams(size=384, distance=Distance.COSINE)
                    )
                    logger.info(f"Created Qdrant collection: {collection_name}")
            except Exception as e:
                logger.warning(f"Qdrant not available or collection creation failed: {e}")
        logger.info(f"Enhanced BPMN AI service initialized with model {self.model}")

    def _embed_text(self, text: str) -> np.ndarray:
        emb = self.embedding_model.encode([text])
        if hasattr(emb, 'tolist'):
            return np.array(emb[0])
        return np.array(emb)

    def _vector_search_examples(self, user_input: str, max_results: int = 3) -> List[BPMNExample]:
        if not self.qdrant_client:
            return self.example_store.find_similar_examples(user_input, max_results)
        try:
            vector = self._embed_text(user_input)
            hits = self.qdrant_client.search(
                collection_name="bpmn_examples",
                query_vector=vector.tolist() if hasattr(vector, 'tolist') else list(vector),
                limit=max_results
            )
            id_set = set(
                hit.payload['id'] for hit in hits if hit.payload and isinstance(hit.payload, dict) and 'id' in hit.payload
            )
            return [ex for ex in self.example_store.examples.values() if ex.id in id_set]
        except Exception as e:
            logger.warning(f"Qdrant search failed: {e}")
            return self.example_store.find_similar_examples(user_input, max_results)

    def _count_tokens(self, text: str) -> int:
        # Approximate: 1 token ≈ 4 chars for English
        return len(text) // 4

    def _summarize_text(self, text: str, max_tokens: int) -> str:
        # Simple truncation for now; can be replaced with LLM summarization
        approx_chars = max_tokens * 4
        if len(text) > approx_chars:
            return text[:approx_chars] + '...'
        return text

    async def generate_bpmn(self, request: BPMNGenerationRequest) -> BPMNResponse:
        start_time = datetime.now()
        try:
            # Use Qdrant or fallback for example retrieval
            examples = self._vector_search_examples(request.user_input, request.max_examples)
            # Summarize/truncate examples if needed
            max_example_tokens = 800  # per example
            examples_section = "\n\nRelevant Examples:\n"
            total_example_tokens = 0
            for i, example in enumerate(examples, 1):
                ex_nl = self._summarize_text(example.natural_language, max_example_tokens // 2)
                ex_bpmn = self._summarize_text(example.bpmn_xml, max_example_tokens // 2)
                ex_text = f"""
Example {i}: {example.name}
Description: {example.description}
Natural Language: {ex_nl}
BPMN XML:
{ex_bpmn}
"""
                examples_section += ex_text
                total_example_tokens += self._count_tokens(ex_text)
            # Summarize/truncate user input/context if needed
            user_input = self._summarize_text(request.user_input, 512)
            context = self._summarize_text(json.dumps(request.context) if request.context else "None", 256)
            complexity = request.complexity_preference or self._detect_complexity(user_input)
            template_name = request.template_name or "advanced_generation"
            prompt = self.prompt_manager.render_template(
                template_name,
                user_input=user_input,
                context=context,
                complexity_level=complexity.value,
                examples_section=examples_section
            )
            # Enforce max context length
            prompt_tokens = self._count_tokens(prompt)
            max_completion_tokens = 2000
            if prompt_tokens + max_completion_tokens > self.max_prompt_tokens:
                # Remove examples or further truncate
                logger.warning(f"Prompt too long ({prompt_tokens} tokens), reducing examples...")
                examples_section = ""
                prompt = self.prompt_manager.render_template(
                    template_name,
                    user_input=user_input,
                    context=context,
                    complexity_level=complexity.value,
                    examples_section=examples_section
                )
                prompt_tokens = self._count_tokens(prompt)
            # Call OpenAI API with selected model
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert BPMN modeler and XML writer. Generate valid BPMN 2.0 XML that can be loaded into bpmn.io."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=max_completion_tokens
            )
            content = response.choices[0].message.content
            if not content:
                raise Exception("Empty response from OpenAI")
            ai_response = self._extract_json_response(content)
            bpmn_xml = ai_response.get('bpmn_xml', '')
            if bpmn_xml:
                bpmn_xml = self.validator.fix_common_issues(bpmn_xml)
            validation_errors = self.validator.validate_bpmn_xml(bpmn_xml)
            generation_time = (datetime.now() - start_time).total_seconds()
            bpmn_response = BPMNResponse(
                bpmn_xml=bpmn_xml,
                explanation=ai_response.get('explanation', ''),
                elements_created=ai_response.get('elements_created', []),
                suggestions=ai_response.get('suggestions', []),
                confidence_score=ai_response.get('confidence_score', 0.8),
                validation_errors=validation_errors,
                examples_used=[ex.name for ex in examples],
                complexity_level=complexity,
                generation_time=generation_time
            )
            logger.info(f"Generated BPMN in {generation_time:.2f}s with {len(validation_errors)} validation errors")
            return bpmn_response
        except Exception as e:
            logger.error(f"Error generating BPMN: {str(e)}")
            raise Exception(f"Failed to generate BPMN: {str(e)}")
    
    def _detect_complexity(self, user_input: str) -> BPMNComplexity:
        """Detect complexity level from user input"""
        user_lower = user_input.lower()
        
        # Simple complexity detection based on keywords
        complex_keywords = ['parallel', 'gateway', 'subprocess', 'loop', 'multiple', 'conditional']
        moderate_keywords = ['decision', 'if', 'then', 'else', 'approval', 'review']
        
        complex_count = sum(1 for word in complex_keywords if word in user_lower)
        moderate_count = sum(1 for word in moderate_keywords if word in user_lower)
        
        if complex_count >= 2:
            return BPMNComplexity.COMPLEX
        elif moderate_count >= 1 or complex_count >= 1:
            return BPMNComplexity.MODERATE
        else:
            return BPMNComplexity.SIMPLE
    
    def _extract_json_response(self, content: str) -> Dict[str, Any]:
        """Extract JSON response from AI content"""
        content = content.strip()
        
        # Try to extract JSON from the response
        if content.startswith('```json'):
            content = content[7:-3].strip()
        elif content.startswith('```'):
            content = content[3:-3].strip()
        
        # If response doesn't look like JSON, try to extract it
        if not content.startswith('{'):
            import re
            json_match = re.search(r'(\{.*\})', content, re.DOTALL)
            if json_match:
                content = json_match.group(1)
            else:
                # Create fallback response
                logger.warning("No JSON found in response, creating fallback")
                return {
                    "bpmn_xml": self._create_simple_bpmn_template(),
                    "explanation": content,
                    "elements_created": ["startEvent", "task", "endEvent"],
                    "suggestions": ["Consider adding more details to the process"],
                    "confidence_score": 0.6
                }
        
        try:
            return json.loads(content)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing failed: {str(e)}")
            raise Exception(f"Invalid JSON response from AI: {str(e)}")
    
    def _create_simple_bpmn_template(self) -> str:
        """Create a simple BPMN template as fallback"""
        return '''<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" name="Simple Process" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Start">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Process Task">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="End">
      <bpmn:incoming>Flow_2</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="152" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
        <dc:Bounds x="240" y="80" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="392" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="188" y="120" />
        <di:waypoint x="240" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="340" y="120" />
        <di:waypoint x="392" y="120" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>'''
    
    def add_example(self, example: BPMNExample):
        """Add a new BPMN example and upsert to Qdrant if available"""
        self.example_store.add_example(example)
        # Upsert to Qdrant if available
        if self.qdrant_client:
            try:
                vector = self._embed_text(example.natural_language)
                payload = {
                    "id": example.id,
                    "name": example.name,
                    "description": example.description,
                    "tags": example.tags,
                    "complexity": example.complexity.value if hasattr(example.complexity, 'value') else str(example.complexity),
                    "created_at": example.created_at.isoformat()
                }
                # Qdrant point ID must be int or UUID, so use a hash of the string ID
                qdrant_id = abs(hash(example.id)) % (2**63)
                self.qdrant_client.upsert(
                    collection_name="bpmn_examples",
                    points=[
                        {
                            "id": qdrant_id,
                            "vector": vector.tolist() if hasattr(vector, 'tolist') else list(vector),
                            "payload": payload
                        }
                    ]
                )  # type: ignore[arg-type]
                logger.info(f"Upserted example '{example.name}' to Qdrant.")
            except Exception as e:
                logger.warning(f"Failed to upsert example to Qdrant: {e}")
    
    def get_examples(self, complexity: Optional[BPMNComplexity] = None) -> List[BPMNExample]:
        """Get examples, optionally filtered by complexity"""
        if complexity:
            return self.example_store.get_examples_by_complexity(complexity)
        return list(self.example_store.examples.values())

# Singleton instance
_enhanced_bpmn_ai_service = None

def get_enhanced_bpmn_ai_service() -> EnhancedBPMNAIService:
    """Get singleton instance of enhanced BPMN AI service"""
    global _enhanced_bpmn_ai_service
    if _enhanced_bpmn_ai_service is None:
        _enhanced_bpmn_ai_service = EnhancedBPMNAIService()
    return _enhanced_bpmn_ai_service 