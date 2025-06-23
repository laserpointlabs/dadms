"""
Workflow Composition Engine

This module provides dynamic BPMN workflow composition capabilities:
- Template-based workflow generation
- Dynamic service task injection
- Workflow validation and optimization
- Context-aware workflow routing
- Workflow versioning and migration
"""

import json
import logging
import uuid
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Set, Tuple, Union
from pathlib import Path

# Configure logging
logger = logging.getLogger(__name__)

class WorkflowComplexity(Enum):
    """Workflow complexity levels"""
    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"

class TaskType(Enum):
    """BPMN task types"""
    SERVICE_TASK = "serviceTask"
    USER_TASK = "userTask"
    SCRIPT_TASK = "scriptTask"
    BUSINESS_RULE_TASK = "businessRuleTask"
    MANUAL_TASK = "manualTask"

@dataclass
class WorkflowComponent:
    """Represents a BPMN workflow component"""
    id: str
    name: str
    type: TaskType
    properties: Dict[str, str] = field(default_factory=dict)
    documentation: Optional[str] = None
    incoming_flows: List[str] = field(default_factory=list)
    outgoing_flows: List[str] = field(default_factory=list)

@dataclass
class ServiceTaskConfig:
    """Configuration for service task injection"""
    task_id: str
    task_name: str
    service_type: str
    service_name: str
    service_version: str = "1.0"
    topic: str = None
    documentation: Optional[str] = None
    properties: Dict[str, str] = field(default_factory=dict)
    position: Optional[Tuple[int, int]] = None

@dataclass
class ValidationResult:
    """Result of workflow validation"""
    is_valid: bool
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)

@dataclass
class WorkflowTemplate:
    """Workflow template definition"""
    name: str
    description: str
    complexity: WorkflowComplexity
    xml_template: str
    placeholders: Dict[str, str] = field(default_factory=dict)
    components: List[WorkflowComponent] = field(default_factory=list)

class WorkflowCompositionEngine:
    """Enables dynamic BPMN workflow composition and modification"""
    
    def __init__(self, templates_dir: str = "config/workflow_templates"):
        """
        Initialize the workflow composition engine
        
        Args:
            templates_dir: Directory containing workflow templates
        """
        self.templates_dir = Path(templates_dir)
        self.templates: Dict[str, WorkflowTemplate] = {}
        self.namespaces = {
            'bpmn': 'http://www.omg.org/spec/BPMN/20100524/MODEL',
            'camunda': 'http://camunda.org/schema/1.0/bpmn',
            'bpmndi': 'http://www.omg.org/spec/BPMN/20100524/DI',
            'dc': 'http://www.omg.org/spec/DD/20100524/DC',
            'di': 'http://www.omg.org/spec/DD/20100524/DI'
        }
        
        # Register namespaces
        for prefix, uri in self.namespaces.items():
            ET.register_namespace(prefix, uri)
        
        self._load_templates()
        logger.info(f"Workflow Composition Engine initialized with {len(self.templates)} templates")
    
    def _load_templates(self):
        """Load workflow templates from templates directory"""
        if not self.templates_dir.exists():
            logger.warning(f"Templates directory {self.templates_dir} does not exist")
            return
        
        for template_file in self.templates_dir.glob("*.xml"):
            try:
                template = self._parse_template(template_file)
                self.templates[template.name] = template
                logger.info(f"Loaded template: {template.name}")
            except Exception as e:
                logger.error(f"Failed to load template {template_file}: {e}")
    
    def _parse_template(self, template_file: Path) -> WorkflowTemplate:
        """Parse a workflow template file"""
        with open(template_file, 'r', encoding='utf-8') as f:
            xml_content = f.read()
        
        # Parse XML to extract metadata
        root = ET.fromstring(xml_content)
        
        # Extract process information
        process_elem = root.find('.//bpmn:process', self.namespaces)
        if process_elem is None:
            raise ValueError("No process element found in template")
        
        process_name = process_elem.get('name', template_file.stem)
        
        # Determine complexity based on number of elements
        task_count = len(process_elem.findall('.//bpmn:serviceTask', self.namespaces))
        gateway_count = len(process_elem.findall('.//bpmn:*Gateway', self.namespaces))
        
        if task_count <= 3 and gateway_count == 0:
            complexity = WorkflowComplexity.SIMPLE
        elif task_count <= 8 and gateway_count <= 2:
            complexity = WorkflowComplexity.MODERATE
        else:
            complexity = WorkflowComplexity.COMPLEX
        
        # Extract components
        components = self._extract_components(process_elem)
        
        return WorkflowTemplate(
            name=template_file.stem,
            description=process_name,
            complexity=complexity,
            xml_template=xml_content,
            components=components
        )
    
    def _extract_components(self, process_elem: ET.Element) -> List[WorkflowComponent]:
        """Extract workflow components from process element"""
        components = []
        
        # Extract service tasks
        for task_elem in process_elem.findall('.//bpmn:serviceTask', self.namespaces):
            component = self._parse_service_task(task_elem)
            components.append(component)
        
        # Extract user tasks
        for task_elem in process_elem.findall('.//bpmn:userTask', self.namespaces):
            component = self._parse_user_task(task_elem)
            components.append(component)
        
        return components
    
    def _parse_service_task(self, task_elem: ET.Element) -> WorkflowComponent:
        """Parse a service task element"""
        task_id = task_elem.get('id', '')
        task_name = task_elem.get('name', '')
        
        # Extract properties
        properties = {}
        props_elem = task_elem.find('.//camunda:properties', self.namespaces)
        if props_elem is not None:
            for prop_elem in props_elem.findall('.//camunda:property', self.namespaces):
                prop_name = prop_elem.get('name', '')
                prop_value = prop_elem.get('value', '')
                if prop_name:
                    properties[prop_name] = prop_value
        
        # Extract documentation
        doc_elem = task_elem.find('.//bpmn:documentation', self.namespaces)
        documentation = doc_elem.text if doc_elem is not None else None
        
        return WorkflowComponent(
            id=task_id,
            name=task_name,
            type=TaskType.SERVICE_TASK,
            properties=properties,
            documentation=documentation
        )
    
    def _parse_user_task(self, task_elem: ET.Element) -> WorkflowComponent:
        """Parse a user task element"""
        task_id = task_elem.get('id', '')
        task_name = task_elem.get('name', '')
        
        # Extract documentation
        doc_elem = task_elem.find('.//bpmn:documentation', self.namespaces)
        documentation = doc_elem.text if doc_elem is not None else None
        
        return WorkflowComponent(
            id=task_id,
            name=task_name,
            type=TaskType.USER_TASK,
            documentation=documentation
        )
    
    def compose_workflow(self, template_name: str, components: List[WorkflowComponent], 
                        process_id: Optional[str] = None) -> str:
        """
        Compose a workflow from template and components
        
        Args:
            template_name: Name of the base template
            components: Additional components to inject
            process_id: Custom process ID (generated if not provided)
            
        Returns:
            Generated BPMN XML
        """
        if template_name not in self.templates:
            raise ValueError(f"Template '{template_name}' not found")
        
        template = self.templates[template_name]
        
        # Parse template XML
        root = ET.fromstring(template.xml_template)
        
        # Generate unique process ID if not provided
        if process_id is None:
            process_id = f"Process_{uuid.uuid4().hex[:8]}"
        
        # Update process ID
        process_elem = root.find('.//bpmn:process', self.namespaces)
        if process_elem is not None:
            process_elem.set('id', process_id)
        
        # Inject additional components
        for component in components:
            self._inject_component(root, component)
        
        # Generate XML string
        return ET.tostring(root, encoding='unicode', xml_declaration=True)
    
    def inject_service_task(self, workflow_xml: str, task_config: ServiceTaskConfig) -> str:
        """
        Inject a service task into existing workflow
        
        Args:
            workflow_xml: Existing workflow XML
            task_config: Service task configuration
            
        Returns:
            Modified workflow XML
        """
        root = ET.fromstring(workflow_xml)
        
        # Create service task element
        process_elem = root.find('.//bpmn:process', self.namespaces)
        if process_elem is None:
            raise ValueError("No process element found in workflow")
        
        # Create service task
        service_task = ET.SubElement(process_elem, f'{{{self.namespaces["bpmn"]}}}serviceTask')
        service_task.set('id', task_config.task_id)
        service_task.set('name', task_config.task_name)
        service_task.set('camunda:type', 'external')
        
        if task_config.topic:
            service_task.set('camunda:topic', task_config.topic)
        else:
            service_task.set('camunda:topic', task_config.task_id)
        
        # Add documentation
        if task_config.documentation:
            doc_elem = ET.SubElement(service_task, f'{{{self.namespaces["bpmn"]}}}documentation')
            doc_elem.text = task_config.documentation
        
        # Add extension elements with properties
        ext_elem = ET.SubElement(service_task, f'{{{self.namespaces["bpmn"]}}}extensionElements')
        props_elem = ET.SubElement(ext_elem, f'{{{self.namespaces["camunda"]}}}properties')
        
        # Add service properties
        service_props = {
            'service.type': task_config.service_type,
            'service.name': task_config.service_name,
            'service.version': task_config.service_version,
            **task_config.properties
        }
        
        for prop_name, prop_value in service_props.items():
            prop_elem = ET.SubElement(props_elem, f'{{{self.namespaces["camunda"]}}}property')
            prop_elem.set('name', prop_name)
            prop_elem.set('value', prop_value)
        
        return ET.tostring(root, encoding='unicode', xml_declaration=True)
    
    def _inject_component(self, root: ET.Element, component: WorkflowComponent):
        """Inject a component into the workflow"""
        process_elem = root.find('.//bpmn:process', self.namespaces)
        if process_elem is None:
            return
        
        if component.type == TaskType.SERVICE_TASK:
            self._inject_service_task_component(process_elem, component)
        elif component.type == TaskType.USER_TASK:
            self._inject_user_task_component(process_elem, component)
    
    def _inject_service_task_component(self, process_elem: ET.Element, component: WorkflowComponent):
        """Inject a service task component"""
        service_task = ET.SubElement(process_elem, f'{{{self.namespaces["bpmn"]}}}serviceTask')
        service_task.set('id', component.id)
        service_task.set('name', component.name)
        service_task.set('camunda:type', 'external')
        service_task.set('camunda:topic', component.id)
        
        # Add documentation
        if component.documentation:
            doc_elem = ET.SubElement(service_task, f'{{{self.namespaces["bpmn"]}}}documentation')
            doc_elem.text = component.documentation
        
        # Add properties
        if component.properties:
            ext_elem = ET.SubElement(service_task, f'{{{self.namespaces["bpmn"]}}}extensionElements')
            props_elem = ET.SubElement(ext_elem, f'{{{self.namespaces["camunda"]}}}properties')
            
            for prop_name, prop_value in component.properties.items():
                prop_elem = ET.SubElement(props_elem, f'{{{self.namespaces["camunda"]}}}property')
                prop_elem.set('name', prop_name)
                prop_elem.set('value', prop_value)
    
    def _inject_user_task_component(self, process_elem: ET.Element, component: WorkflowComponent):
        """Inject a user task component"""
        user_task = ET.SubElement(process_elem, f'{{{self.namespaces["bpmn"]}}}userTask')
        user_task.set('id', component.id)
        user_task.set('name', component.name)
        
        # Add documentation
        if component.documentation:
            doc_elem = ET.SubElement(user_task, f'{{{self.namespaces["bpmn"]}}}documentation')
            doc_elem.text = component.documentation
    
    def validate_workflow_composition(self, workflow_xml: str) -> ValidationResult:
        """
        Validate composed workflow
        
        Args:
            workflow_xml: Workflow XML to validate
            
        Returns:
            Validation result with errors, warnings, and suggestions
        """
        errors = []
        warnings = []
        suggestions = []
        
        try:
            root = ET.fromstring(workflow_xml)
        except ET.ParseError as e:
            errors.append(f"XML parsing error: {e}")
            return ValidationResult(is_valid=False, errors=errors)
        
        # Find process element
        process_elem = root.find('.//bpmn:process', self.namespaces)
        if process_elem is None:
            errors.append("No process element found")
            return ValidationResult(is_valid=False, errors=errors)
        
        # Validate process has start event
        start_events = process_elem.findall('.//bpmn:startEvent', self.namespaces)
        if not start_events:
            errors.append("Process must have at least one start event")
        elif len(start_events) > 1:
            warnings.append("Process has multiple start events")
        
        # Validate process has end event
        end_events = process_elem.findall('.//bpmn:endEvent', self.namespaces)
        if not end_events:
            warnings.append("Process should have at least one end event")
        
        # Validate service tasks have required properties
        service_tasks = process_elem.findall('.//bpmn:serviceTask', self.namespaces)
        for task in service_tasks:
            task_id = task.get('id', 'unknown')
            
            # Check for external type
            if task.get('camunda:type') != 'external':
                warnings.append(f"Service task '{task_id}' should have camunda:type='external'")
            
            # Check for topic
            if not task.get('camunda:topic'):
                warnings.append(f"Service task '{task_id}' should have camunda:topic")
            
            # Check for service properties
            props_elem = task.find('.//camunda:properties', self.namespaces)
            if props_elem is not None:
                props = {}
                for prop_elem in props_elem.findall('.//camunda:property', self.namespaces):
                    prop_name = prop_elem.get('name', '')
                    prop_value = prop_elem.get('value', '')
                    props[prop_name] = prop_value
                
                if 'service.type' not in props:
                    warnings.append(f"Service task '{task_id}' should have service.type property")
                if 'service.name' not in props:
                    warnings.append(f"Service task '{task_id}' should have service.name property")
            else:
                suggestions.append(f"Service task '{task_id}' could benefit from service properties")
        
        # Performance suggestions
        if len(service_tasks) > 10:
            suggestions.append("Consider breaking large workflows into sub-processes")
        
        is_valid = len(errors) == 0
        
        return ValidationResult(
            is_valid=is_valid,
            errors=errors,
            warnings=warnings,
            suggestions=suggestions
        )
    
    def optimize_workflow(self, workflow_xml: str) -> str:
        """
        Optimize workflow for better performance
        
        Args:
            workflow_xml: Workflow XML to optimize
            
        Returns:
            Optimized workflow XML
        """
        root = ET.fromstring(workflow_xml)
        
        # Add process-level optimizations
        process_elem = root.find('.//bpmn:process', self.namespaces)
        if process_elem is not None:
            # Set history time to live for performance
            if not process_elem.get('camunda:historyTimeToLive'):
                process_elem.set('camunda:historyTimeToLive', '30')
            
            # Ensure process is executable
            process_elem.set('isExecutable', 'true')
        
        return ET.tostring(root, encoding='unicode', xml_declaration=True)
    
    def get_available_templates(self) -> List[Dict[str, str]]:
        """Get list of available workflow templates"""
        return [
            {
                'name': template.name,
                'description': template.description,
                'complexity': template.complexity.value,
                'component_count': len(template.components)
            }
            for template in self.templates.values()
        ]
    
    def create_workflow_from_description(self, description: str, 
                                       complexity: WorkflowComplexity = WorkflowComplexity.SIMPLE) -> str:
        """
        Create a workflow from natural language description
        
        Args:
            description: Natural language workflow description
            complexity: Target workflow complexity
            
        Returns:
            Generated BPMN XML
        """
        # This is a simplified implementation
        # In a full implementation, this would use AI/NLP to parse the description
        
        process_id = f"Generated_{uuid.uuid4().hex[:8]}"
        
        # Create basic workflow structure
        root = ET.Element(f'{{{self.namespaces["bpmn"]}}}definitions')
        root.set('xmlns:bpmn', self.namespaces['bpmn'])
        root.set('xmlns:camunda', self.namespaces['camunda'])
        root.set('targetNamespace', 'http://bpmn.io/schema/bpmn')
        
        process = ET.SubElement(root, f'{{{self.namespaces["bpmn"]}}}process')
        process.set('id', process_id)
        process.set('name', description[:50] + '...' if len(description) > 50 else description)
        process.set('isExecutable', 'true')
        process.set('camunda:historyTimeToLive', '30')
        
        # Add start event
        start_event = ET.SubElement(process, f'{{{self.namespaces["bpmn"]}}}startEvent')
        start_event.set('id', 'StartEvent_1')
        start_event.set('name', 'Start')
        
        # Add a service task based on description
        service_task = ET.SubElement(process, f'{{{self.namespaces["bpmn"]}}}serviceTask')
        service_task.set('id', 'ProcessTask_1')
        service_task.set('name', 'Process Request')
        service_task.set('camunda:type', 'external')
        service_task.set('camunda:topic', 'ProcessRequest')
        
        # Add documentation
        doc_elem = ET.SubElement(service_task, f'{{{self.namespaces["bpmn"]}}}documentation')
        doc_elem.text = description
        
        # Add service properties
        ext_elem = ET.SubElement(service_task, f'{{{self.namespaces["bpmn"]}}}extensionElements')
        props_elem = ET.SubElement(ext_elem, f'{{{self.namespaces["camunda"]}}}properties')
        
        # Default to assistant service
        for prop_name, prop_value in [
            ('service.type', 'assistant'),
            ('service.name', 'dadm-openai-assistant'),
            ('service.version', '1.0')
        ]:
            prop_elem = ET.SubElement(props_elem, f'{{{self.namespaces["camunda"]}}}property')
            prop_elem.set('name', prop_name)
            prop_elem.set('value', prop_value)
        
        # Add end event
        end_event = ET.SubElement(process, f'{{{self.namespaces["bpmn"]}}}endEvent')
        end_event.set('id', 'EndEvent_1')
        end_event.set('name', 'End')
        
        # Add sequence flows
        flow1 = ET.SubElement(process, f'{{{self.namespaces["bpmn"]}}}sequenceFlow')
        flow1.set('id', 'Flow_1')
        flow1.set('sourceRef', 'StartEvent_1')
        flow1.set('targetRef', 'ProcessTask_1')
        
        flow2 = ET.SubElement(process, f'{{{self.namespaces["bpmn"]}}}sequenceFlow')
        flow2.set('id', 'Flow_2')
        flow2.set('sourceRef', 'ProcessTask_1')
        flow2.set('targetRef', 'EndEvent_1')
        
        return ET.tostring(root, encoding='unicode', xml_declaration=True) 