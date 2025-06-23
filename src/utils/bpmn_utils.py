"""
BPMN Utilities and Validation

Utilities for BPMN XML processing, validation, and element management.
"""
import xml.etree.ElementTree as ET
import re
from typing import Dict, List, Optional, Tuple, Any
import logging

logger = logging.getLogger(__name__)

class BPMNValidator:
    """
    BPMN XML validator that checks for structural and semantic correctness.
    """
    
    # BPMN 2.0 namespace
    BPMN_NAMESPACE = "http://www.omg.org/spec/BPMN/20100524/MODEL"
    BPMN_DI_NAMESPACE = "http://www.omg.org/spec/BPMN/20100524/DI"
    DC_NAMESPACE = "http://www.omg.org/spec/DD/20100524/DC"
    DI_NAMESPACE = "http://www.omg.org/spec/DD/20100524/DI"
    
    # Required BPMN elements for a valid process
    REQUIRED_ELEMENTS = ['startEvent', 'endEvent']
    
    def __init__(self):
        """Initialize the BPMN validator"""
        self.namespaces = {
            'bpmn': self.BPMN_NAMESPACE,
            'bpmndi': self.BPMN_DI_NAMESPACE,
            'dc': self.DC_NAMESPACE,
            'di': self.DI_NAMESPACE
        }
    
    def validate_xml_structure(self, bpmn_xml: str) -> List[str]:
        """
        Validate basic XML structure and BPMN namespace.
        
        Args:
            bpmn_xml: BPMN XML string to validate
            
        Returns:
            List of validation error messages
        """
        errors = []
        
        try:
            # Parse XML
            root = ET.fromstring(bpmn_xml)
            
            # Check for definitions element
            if root.tag != f"{{{self.BPMN_NAMESPACE}}}definitions":
                errors.append("Root element must be bpmn:definitions")
            
            # Check for required namespaces
            if self.BPMN_NAMESPACE not in bpmn_xml:
                errors.append("Missing required BPMN namespace")
                
        except ET.ParseError as e:
            errors.append(f"Invalid XML structure: {str(e)}")
        except Exception as e:
            errors.append(f"XML validation error: {str(e)}")
            
        return errors
    
    def validate_process_structure(self, bpmn_xml: str) -> List[str]:
        """
        Validate BPMN process structure and semantics.
        
        Args:
            bpmn_xml: BPMN XML string to validate
            
        Returns:
            List of validation error messages
        """
        errors = []
        
        try:
            root = ET.fromstring(bpmn_xml)
            
            # Find all processes
            processes = root.findall('.//bpmn:process', self.namespaces)
            
            if not processes:
                errors.append("No process element found")
                return errors
                
            for process in processes:
                process_id = process.get('id', 'unknown')
                
                # Check for start events
                start_events = process.findall('.//bpmn:startEvent', self.namespaces)
                if not start_events:
                    errors.append(f"Process '{process_id}' missing start event")
                    
                # Check for end events
                end_events = process.findall('.//bpmn:endEvent', self.namespaces)
                if not end_events:
                    errors.append(f"Process '{process_id}' missing end event")
                
                # Check for unique IDs within process
                element_ids = set()
                for element in process.findall('.//*[@id]'):
                    element_id = element.get('id')
                    if element_id in element_ids:
                        errors.append(f"Duplicate element ID: {element_id}")
                    element_ids.add(element_id)
                
                # Check for sequence flow connectivity
                self._validate_sequence_flows(process, errors)
                
        except ET.ParseError as e:
            errors.append(f"Cannot parse XML for process validation: {str(e)}")
        except Exception as e:
            errors.append(f"Process validation error: {str(e)}")
            
        return errors
    
    def _validate_sequence_flows(self, process: ET.Element, errors: List[str]):
        """
        Validate sequence flow connectivity within a process.
        
        Args:
            process: Process XML element
            errors: List to append errors to
        """
        try:
            # Get all sequence flows
            sequence_flows = process.findall('.//bpmn:sequenceFlow', self.namespaces)
            
            # Get all flow nodes (activities, events, gateways) - check both namespaced and non-namespaced
            flow_nodes = []
            
            # Try namespaced elements first
            flow_nodes.extend(process.findall('.//bpmn:startEvent | .//bpmn:endEvent | .//bpmn:task | .//bpmn:userTask | .//bpmn:serviceTask | .//bpmn:exclusiveGateway | .//bpmn:parallelGateway', self.namespaces))
            
            # Also check for non-namespaced elements (AI sometimes generates these)
            flow_nodes.extend(process.findall('.//startEvent | .//endEvent | .//task | .//userTask | .//serviceTask | .//exclusiveGateway | .//parallelGateway'))
            
            # Create sets of valid source and target references
            flow_node_ids = {node.get('id') for node in flow_nodes if node.get('id')}
            
            # Also check for elements with namespace prefixes in their IDs
            for node in flow_nodes:
                node_id = node.get('id')
                if node_id:
                    # Add both the original ID and any namespace-prefixed version
                    flow_node_ids.add(node_id)
                    if ':' in node_id:
                        # If ID has namespace prefix, also add without prefix
                        flow_node_ids.add(node_id.split(':', 1)[1])
                    else:
                        # If ID has no prefix, also add with common prefixes
                        flow_node_ids.add(f"bpmn:{node_id}")
            
            for flow in sequence_flows:
                source_ref = flow.get('sourceRef')
                target_ref = flow.get('targetRef')
                
                if source_ref and source_ref not in flow_node_ids:
                    # Try to find the element with different namespace handling
                    source_found = False
                    for node_id in flow_node_ids:
                        if source_ref == node_id or source_ref.endswith(f":{node_id}") or node_id.endswith(f":{source_ref}"):
                            source_found = True
                            break
                    
                    if not source_found:
                        errors.append(f"Sequence flow references invalid source: {source_ref}")
                    
                if target_ref and target_ref not in flow_node_ids:
                    # Try to find the element with different namespace handling
                    target_found = False
                    for node_id in flow_node_ids:
                        if target_ref == node_id or target_ref.endswith(f":{node_id}") or node_id.endswith(f":{target_ref}"):
                            target_found = True
                            break
                    
                    if not target_found:
                        errors.append(f"Sequence flow references invalid target: {target_ref}")
                    
        except Exception as e:
            errors.append(f"Sequence flow validation error: {str(e)}")
    
    def validate_complete(self, bpmn_xml: str) -> Dict[str, Any]:
        """
        Perform complete BPMN validation.
        
        Args:
            bpmn_xml: BPMN XML string to validate
            
        Returns:
            Dictionary with validation results
        """
        all_errors = []
        
        # Validate XML structure
        xml_errors = self.validate_xml_structure(bpmn_xml)
        all_errors.extend(xml_errors)
        
        # Only continue if XML is valid
        if not xml_errors:
            process_errors = self.validate_process_structure(bpmn_xml)
            all_errors.extend(process_errors)
        
        return {
            'is_valid': len(all_errors) == 0,
            'errors': all_errors,
            'error_count': len(all_errors)
        }

class BPMNElementExtractor:
    """
    Extract and analyze BPMN elements from XML.
    """
    
    def __init__(self):
        """Initialize the element extractor"""
        self.namespaces = {
            'bpmn': "http://www.omg.org/spec/BPMN/20100524/MODEL"
        }
    
    def extract_elements(self, bpmn_xml: str) -> Dict[str, List[Dict]]:
        """
        Extract all BPMN elements from XML.
        
        Args:
            bpmn_xml: BPMN XML string
            
        Returns:
            Dictionary organized by element type
        """
        elements = {
            'events': [],
            'activities': [],
            'gateways': [],
            'flows': [],
            'data': []
        }
        
        try:
            root = ET.fromstring(bpmn_xml)
            
            # Extract events
            for event_type in ['startEvent', 'endEvent', 'intermediateCatchEvent', 'intermediateThrowEvent']:
                for element in root.findall(f'.//bpmn:{event_type}', self.namespaces):
                    elements['events'].append({
                        'id': element.get('id'),
                        'name': element.get('name', ''),
                        'type': event_type,
                        'element': element
                    })
            
            # Extract activities
            for activity_type in ['task', 'userTask', 'serviceTask', 'scriptTask', 'manualTask', 'businessRuleTask']:
                for element in root.findall(f'.//bpmn:{activity_type}', self.namespaces):
                    elements['activities'].append({
                        'id': element.get('id'),
                        'name': element.get('name', ''),
                        'type': activity_type,
                        'element': element
                    })
            
            # Extract gateways
            for gateway_type in ['exclusiveGateway', 'inclusiveGateway', 'parallelGateway', 'eventBasedGateway']:
                for element in root.findall(f'.//bpmn:{gateway_type}', self.namespaces):
                    elements['gateways'].append({
                        'id': element.get('id'),
                        'name': element.get('name', ''),
                        'type': gateway_type,
                        'element': element
                    })
            
            # Extract sequence flows
            for element in root.findall('.//bpmn:sequenceFlow', self.namespaces):
                elements['flows'].append({
                    'id': element.get('id'),
                    'name': element.get('name', ''),
                    'sourceRef': element.get('sourceRef'),
                    'targetRef': element.get('targetRef'),
                    'type': 'sequenceFlow',
                    'element': element
                })
                
        except Exception as e:
            logger.error(f"Error extracting BPMN elements: {str(e)}")
            
        return elements
    
    def get_process_summary(self, bpmn_xml: str) -> Dict[str, Any]:
        """
        Get a high-level summary of the BPMN process.
        
        Args:
            bpmn_xml: BPMN XML string
            
        Returns:
            Dictionary with process summary
        """
        elements = self.extract_elements(bpmn_xml)
        
        summary: Dict[str, Any] = {
            'total_elements': sum(len(elem_list) for elem_list in elements.values()),
            'events_count': len(elements['events']),
            'activities_count': len(elements['activities']),
            'gateways_count': len(elements['gateways']),
            'flows_count': len(elements['flows']),
            'complexity_score': self._calculate_complexity(elements),
            'element_types': {}
        }
        for category, elem_list in elements.items():
            type_counts = {}
            for elem in elem_list:
                elem_type = elem['type']
                type_counts[elem_type] = type_counts.get(elem_type, 0) + 1
            summary['element_types'][category] = type_counts
            
        return summary
    
    def _calculate_complexity(self, elements: Dict[str, List[Dict]]) -> int:
        """
        Calculate a simple complexity score for the process.
        
        Args:
            elements: Dictionary of extracted elements
            
        Returns:
            Complexity score (0-10)
        """
        # Simple heuristic: base score + gateways + parallel paths
        base_score = min(len(elements['activities']), 5)
        gateway_score = min(len(elements['gateways']) * 2, 3)
        
        # Check for parallel gateways (increase complexity)
        parallel_gateways = sum(1 for gw in elements['gateways'] if gw['type'] == 'parallelGateway')
        parallel_score = min(parallel_gateways, 2)
        
        return min(base_score + gateway_score + parallel_score, 10)

class BPMNTemplate:
    """
    BPMN template generator for common process patterns.
    """
    
    @staticmethod
    def generate_simple_process(process_name: str, activities: List[str]) -> str:
        """
        Generate a simple sequential process template.
        
        Args:
            process_name: Name of the process
            activities: List of activity names
            
        Returns:
            BPMN XML string
        """
        process_id = re.sub(r'[^a-zA-Z0-9_]', '_', process_name.lower())
        
        # Build activities XML
        activities_xml = []
        flows_xml = []
        
        # Start event
        start_id = f"{process_id}_start"
        activities_xml.append(f'    <bpmn:startEvent id="{start_id}" name="Start">')
        activities_xml.append(f'      <bpmn:outgoing>{start_id}_to_activity_0</bpmn:outgoing>')
        activities_xml.append('    </bpmn:startEvent>')
        
        # Activities and flows
        for i, activity in enumerate(activities):
            activity_id = f"{process_id}_activity_{i}"
            next_target = f"{process_id}_activity_{i+1}" if i < len(activities) - 1 else f"{process_id}_end"
            
            activities_xml.append(f'    <bpmn:task id="{activity_id}" name="{activity}">')
            activities_xml.append(f'      <bpmn:incoming>{start_id if i == 0 else f"{process_id}_activity_{i-1}"}_to_activity_{i}</bpmn:incoming>')
            activities_xml.append(f'      <bpmn:outgoing>activity_{i}_to_{next_target.split("_")[-1]}</bpmn:outgoing>')
            activities_xml.append('    </bpmn:task>')
            
            # Sequence flow
            source = start_id if i == 0 else f"{process_id}_activity_{i-1}"
            target = activity_id
            flows_xml.append(f'    <bpmn:sequenceFlow id="{source}_to_activity_{i}" sourceRef="{source}" targetRef="{target}" />')
        
        # End event
        end_id = f"{process_id}_end"
        activities_xml.append(f'    <bpmn:endEvent id="{end_id}" name="End">')
        activities_xml.append(f'      <bpmn:incoming>activity_{len(activities)-1}_to_end</bpmn:incoming>')
        activities_xml.append('    </bpmn:endEvent>')
        
        # Final flow
        flows_xml.append(f'    <bpmn:sequenceFlow id="activity_{len(activities)-1}_to_end" sourceRef="{process_id}_activity_{len(activities)-1}" targetRef="{end_id}" />')
        
        # Complete BPMN XML
        bpmn_xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  id="Definitions_1" 
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="{process_id}" name="{process_name}" isExecutable="true">
{chr(10).join(activities_xml)}
{chr(10).join(flows_xml)}
  </bpmn:process>
</bpmn:definitions>'''
        
        return bpmn_xml

# Singleton instances
_bpmn_validator = None
_bpmn_extractor = None

def get_bpmn_validator() -> BPMNValidator:
    """Get singleton BPMN validator instance"""
    global _bpmn_validator
    if _bpmn_validator is None:
        _bpmn_validator = BPMNValidator()
    return _bpmn_validator

def get_bpmn_extractor() -> BPMNElementExtractor:
    """Get singleton BPMN element extractor instance"""
    global _bpmn_extractor
    if _bpmn_extractor is None:
        _bpmn_extractor = BPMNElementExtractor()
    return _bpmn_extractor
