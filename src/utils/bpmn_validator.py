"""
BPMN Validation Utilities

This module provides BPMN XML validation functionality including 
schema validation, semantic validation, and best practices checking.
"""
import xml.etree.ElementTree as ET
import logging
from typing import Dict, List, Optional, Tuple, Any
import re

logger = logging.getLogger(__name__)

class BPMNValidator:
    """
    BPMN 2.0 XML validator that checks for structural correctness,
    semantic validity, and best practices compliance.
    """
    
    # BPMN 2.0 namespace
    BPMN_NAMESPACE = "http://www.omg.org/spec/BPMN/20100524/MODEL"
    
    # Required BPMN elements for a valid process
    REQUIRED_ELEMENTS = {
        'definitions': 'bpmn:definitions',
        'process': 'bpmn:process',
        'start_event': 'bpmn:startEvent',
        'end_event': 'bpmn:endEvent'
    }
    
    # Valid BPMN element types
    VALID_ELEMENTS = {
        'events': [
            'bpmn:startEvent', 'bpmn:endEvent', 'bpmn:intermediateThrowEvent',
            'bpmn:intermediateCatchEvent', 'bpmn:boundaryEvent'
        ],
        'activities': [
            'bpmn:task', 'bpmn:userTask', 'bpmn:serviceTask', 'bpmn:scriptTask',
            'bpmn:businessRuleTask', 'bpmn:manualTask', 'bpmn:receiveTask',
            'bpmn:sendTask', 'bpmn:callActivity', 'bpmn:subProcess'
        ],
        'gateways': [
            'bpmn:exclusiveGateway', 'bpmn:parallelGateway', 'bpmn:inclusiveGateway',
            'bpmn:complexGateway', 'bpmn:eventBasedGateway'
        ],
        'flows': [
            'bpmn:sequenceFlow', 'bpmn:messageFlow'
        ],
        'data': [
            'bpmn:dataObject', 'bpmn:dataStore', 'bpmn:dataInput', 'bpmn:dataOutput'
        ]
    }
    
    def __init__(self):
        """Initialize the validator"""
        self.validation_errors = []
        self.validation_warnings = []
        
    def validate_xml(self, bpmn_xml: str) -> Dict[str, Any]:
        """
        Validate BPMN XML for structure, semantics, and best practices.
        
        Args:
            bpmn_xml: BPMN XML string to validate
            
        Returns:
            Dictionary containing validation results
        """
        self.validation_errors = []
        self.validation_warnings = []
        
        try:
            # Parse XML
            root = ET.fromstring(bpmn_xml)
            
            # Basic XML structure validation
            self._validate_xml_structure(root, bpmn_xml)
            
            # BPMN semantic validation
            self._validate_bpmn_semantics(root)
            
            # Best practices validation
            self._validate_best_practices(root)
            
            return {
                'is_valid': len(self.validation_errors) == 0,
                'errors': self.validation_errors,
                'warnings': self.validation_warnings,
                'element_count': self._count_elements(root),
                'process_complexity': self._calculate_complexity(root)
            }
            
        except ET.ParseError as e:
            self.validation_errors.append(f"XML parsing error: {str(e)}")
            return {
                'is_valid': False,
                'errors': self.validation_errors,
                'warnings': self.validation_warnings,
                'element_count': {},
                'process_complexity': 'unknown'
            }
        except Exception as e:
            logger.error(f"Validation error: {str(e)}")
            self.validation_errors.append(f"Validation error: {str(e)}")
            return {
                'is_valid': False,
                'errors': self.validation_errors,
                'warnings': self.validation_warnings,
                'element_count': {},
                'process_complexity': 'unknown'
            }
    
    def _validate_xml_structure(self, root: ET.Element, bpmn_xml: str):
        """Validate basic XML structure and namespaces"""
        
        # Check for BPMN namespace
        if self.BPMN_NAMESPACE not in bpmn_xml:
            self.validation_errors.append("Missing BPMN 2.0 namespace")
        
        # Check root element
        if not (root.tag.endswith('definitions') or 'definitions' in root.tag):
            self.validation_errors.append("Root element must be bpmn:definitions")
        
        # Check for required attributes on definitions
        if 'targetNamespace' not in root.attrib:
            self.validation_warnings.append("Missing targetNamespace attribute on definitions")
        
        # Check for process element
        processes = root.findall(".//*[local-name()='process']")
        if not processes:
            self.validation_errors.append("No process element found")
        
        # Validate IDs are unique
        self._validate_unique_ids(root)
    
    def _validate_bpmn_semantics(self, root: ET.Element):
        """Validate BPMN semantic rules"""
        
        processes = root.findall(".//*[local-name()='process']")
        
        for process in processes:
            self._validate_process_semantics(process)
    
    def _validate_process_semantics(self, process: ET.Element):
        """Validate semantic rules for a single process"""
        
        # Find all flow elements using safer iteration
        start_events = []
        end_events = []
        activities = []
        gateways = []
        sequence_flows = []
        
        for elem in process.iter():
            tag_name = elem.tag.lower()
            if 'startevent' in tag_name:
                start_events.append(elem)
            elif 'endevent' in tag_name:
                end_events.append(elem)
            elif any(activity in tag_name for activity in ['task', 'usertask', 'servicetask']):
                activities.append(elem)
            elif any(gateway in tag_name for gateway in ['exclusivegateway', 'parallelgateway']):
                gateways.append(elem)
            elif 'sequenceflow' in tag_name:
                sequence_flows.append(elem)
        
        # Check for at least one start event
        if not start_events:
            self.validation_errors.append("Process must have at least one start event")
        
        # Check for at least one end event
        if not end_events:
            self.validation_errors.append("Process must have at least one end event")
        
        # Validate sequence flows
        self._validate_sequence_flows(sequence_flows, process)
        
        # Check for unreachable elements
        self._validate_reachability(process)
        
        # Validate gateway semantics
        self._validate_gateways(gateways, sequence_flows)
    
    def _validate_sequence_flows(self, sequence_flows: List[ET.Element], process: ET.Element):
        """Validate sequence flow connections"""
        
        # Get all elements with IDs in a safer way
        element_ids = set()
        for elem in process.iter():
            elem_id = elem.get('id')
            if elem_id:
                element_ids.add(elem_id)
        
        for flow in sequence_flows:
            flow_id = flow.get('id', 'unknown')
            source_ref = flow.get('sourceRef')
            target_ref = flow.get('targetRef')
            
            if not source_ref:
                self.validation_errors.append(f"Sequence flow {flow_id} missing sourceRef")
            elif source_ref not in element_ids:
                self.validation_errors.append(f"Sequence flow {flow_id} references non-existent source: {source_ref}")
            
            if not target_ref:
                self.validation_errors.append(f"Sequence flow {flow_id} missing targetRef")
            elif target_ref not in element_ids:
                self.validation_errors.append(f"Sequence flow {flow_id} references non-existent target: {target_ref}")
    
    def _validate_reachability(self, process: ET.Element):
        """Check if all elements are reachable from start events"""
        
        start_events = process.findall(".//*[local-name()='startEvent']")
        if not start_events:
            return
        
        # Build flow graph
        flows = {}
        sequence_flows = process.findall(".//*[local-name()='sequenceFlow']")
        
        for flow in sequence_flows:
            source = flow.get('sourceRef')
            target = flow.get('targetRef')
            if source and target:
                if source not in flows:
                    flows[source] = []
                flows[source].append(target)
        
        # Get all elements with IDs (excluding diagram interchange)
        all_elements = set()
        for elem in process.findall(".//*[@id]"):
            elem_id = elem.get('id')
            # Skip diagram interchange elements
            if elem_id and not any(di_keyword in elem.tag.lower() for di_keyword in ['bpmndi', 'di:', 'dc:']):
                all_elements.add(elem_id)
        
        # Perform reachability analysis from each start event
        reachable = set()
        
        for start in start_events:
            start_id = start.get('id')
            if start_id:
                self._dfs_reachable(start_id, flows, reachable)
        
        # Find unreachable elements (excluding sequence flows themselves)
        unreachable = all_elements - reachable
        for elem_id in unreachable:
            # Skip sequence flows in unreachable check
            try:
                # Find element by iterating through all elements
                found_elem = None
                for elem in process.iter():
                    if elem.get('id') == elem_id:
                        found_elem = elem
                        break
                
                if found_elem is not None and 'sequenceFlow' not in found_elem.tag.lower():
                    self.validation_warnings.append(f"Element {elem_id} may be unreachable")
            except Exception:
                # Skip if we can't find the element
                continue
    
    def _dfs_reachable(self, element_id: str, flows: Dict[str, List[str]], visited: set):
        """Depth-first search to find reachable elements"""
        if element_id in visited:
            return
        
        visited.add(element_id)
        
        if element_id in flows:
            for target in flows[element_id]:
                self._dfs_reachable(target, flows, visited)
    
    def _validate_gateways(self, gateways: List[ET.Element], sequence_flows: List[ET.Element]):
        """Validate gateway semantics"""
        
        # Build incoming/outgoing flow counts
        incoming_flows = {}
        outgoing_flows = {}
        
        for flow in sequence_flows:
            source = flow.get('sourceRef')
            target = flow.get('targetRef')
            
            if source:
                outgoing_flows[source] = outgoing_flows.get(source, 0) + 1
            if target:
                incoming_flows[target] = incoming_flows.get(target, 0) + 1
        
        for gateway in gateways:
            gateway_id = gateway.get('id')
            gateway_type = gateway.tag.split('}')[-1] if '}' in gateway.tag else gateway.tag
            
            incoming = incoming_flows.get(gateway_id, 0)
            outgoing = outgoing_flows.get(gateway_id, 0)
            
            # Validate gateway flow counts
            if gateway_type == 'exclusiveGateway':
                if incoming == 1 and outgoing <= 1:
                    self.validation_warnings.append(f"Exclusive gateway {gateway_id} is unnecessary (1 in, ≤1 out)")
            elif gateway_type == 'parallelGateway':
                if incoming == 1 and outgoing == 1:
                    self.validation_warnings.append(f"Parallel gateway {gateway_id} is unnecessary (1 in, 1 out)")
    
    def _validate_unique_ids(self, root: ET.Element):
        """Validate that all IDs are unique"""
        
        ids = []
        elements_with_ids = root.findall(".//*[@id]")
        
        for elem in elements_with_ids:
            elem_id = elem.get('id')
            if elem_id:
                if elem_id in ids:
                    self.validation_errors.append(f"Duplicate ID found: {elem_id}")
                else:
                    ids.append(elem_id)
    
    def _validate_best_practices(self, root: ET.Element):
        """Validate BPMN best practices"""
        
        # Check for meaningful labels
        unlabeled_elements = root.findall(".//*[local-name()='task' or local-name()='userTask' or local-name()='serviceTask']")
        for elem in unlabeled_elements:
            name = elem.get('name')
            if not name or not name.strip():
                elem_id = elem.get('id', 'unknown')
                self.validation_warnings.append(f"Element {elem_id} should have a meaningful name")
        
        # Check for overly complex processes
        processes = root.findall(".//*[local-name()='process']")
        for process in processes:
            elements = process.findall(".//*[@id]")
            if len(elements) > 20:
                self.validation_warnings.append(f"Process has {len(elements)} elements - consider breaking into sub-processes")
        
        # Check for proper start/end event usage
        start_events = root.findall(".//*[local-name()='startEvent']")
        for start in start_events:
            if not start.get('name'):
                self.validation_warnings.append("Start events should have descriptive names")
    
    def _count_elements(self, root: ET.Element) -> Dict[str, int]:
        """Count different types of BPMN elements"""
        
        counts = {}
        
        for category, elements in self.VALID_ELEMENTS.items():
            counts[category] = 0
            for element_type in elements:
                local_name = element_type.split(':')[-1]
                found = root.findall(f".//*[local-name()='{local_name}']")
                counts[category] += len(found)
        
        return counts
    
    def _calculate_complexity(self, root: ET.Element) -> str:
        """Calculate process complexity score"""
        
        # Count decision points (gateways)
        gateways = root.findall(".//*[local-name()='exclusiveGateway'] | .//*[local-name()='parallelGateway'] | .//*[local-name()='inclusiveGateway']")
        
        # Count activities
        activities = root.findall(".//*[local-name()='task'] | .//*[local-name()='userTask'] | .//*[local-name()='serviceTask']")
        
        # Simple complexity calculation
        complexity_score = len(activities) + len(gateways) * 2
        
        if complexity_score <= 5:
            return 'simple'
        elif complexity_score <= 15:
            return 'moderate'
        else:
            return 'complex'

# Singleton validator instance
_validator = None

def get_bpmn_validator() -> BPMNValidator:
    """Get singleton instance of BPMN validator"""
    global _validator
    if _validator is None:
        _validator = BPMNValidator()
    return _validator

def validate_bpmn_quick(bpmn_xml: str) -> Tuple[bool, List[str]]:
    """
    Quick validation function that returns basic validity and errors.
    
    Args:
        bpmn_xml: BPMN XML string to validate
        
    Returns:
        Tuple of (is_valid, errors_list)
    """
    validator = get_bpmn_validator()
    result = validator.validate_xml(bpmn_xml)
    return result['is_valid'], result['errors']
