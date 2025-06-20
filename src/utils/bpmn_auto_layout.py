"""
BPMN Auto-Layout Utility

This module provides functionality to automatically generate diagram layout information
for BPMN XML that only contains process structure but no visual layout data.
"""

import xml.etree.ElementTree as ET
import re
from typing import Dict, List, Tuple, Optional


class BPMNAutoLayout:
    """
    Automatically generates BPMN diagram layout information for BPMN XML
    that only contains process structure.
    """
    
    def __init__(self):
        # Standard dimensions for BPMN elements
        self.element_dimensions = {
            'startEvent': {'width': 36, 'height': 36},
            'endEvent': {'width': 36, 'height': 36},
            'task': {'width': 100, 'height': 80},
            'userTask': {'width': 100, 'height': 80},
            'serviceTask': {'width': 100, 'height': 80},
            'scriptTask': {'width': 100, 'height': 80},
            'exclusiveGateway': {'width': 50, 'height': 50},
            'parallelGateway': {'width': 50, 'height': 50},
            'inclusiveGateway': {'width': 50, 'height': 50},
        }
        
        # Layout configuration
        self.horizontal_spacing = 150
        self.vertical_spacing = 100
        self.start_x = 100
        self.start_y = 100
    
    def add_diagram_to_bpmn(self, bpmn_xml: str) -> str:
        """
        Add diagram layout information to BPMN XML.
        
        Args:
            bpmn_xml: BPMN XML with process structure only
            
        Returns:
            Complete BPMN XML with diagram layout information
        """
        try:
            # Parse the XML
            root = ET.fromstring(bpmn_xml)
            
            # Find the process element
            process = self._find_process_element(root)
            if process is None:
                return bpmn_xml  # Return original if no process found
            
            # Extract elements and flows
            elements = self._extract_elements(process)
            flows = self._extract_sequence_flows(process)
            
            # Generate layout
            layout = self._generate_layout(elements, flows)
            
            # Add diagram information to XML
            return self._add_diagram_to_xml(root, layout, elements, flows)
            
        except Exception as e:
            print(f"Error in auto-layout: {e}")
            return bpmn_xml  # Return original XML if layout fails
    
    def _find_process_element(self, root: ET.Element) -> Optional[ET.Element]:
        """Find the process element in the BPMN XML."""
        # Handle namespaced elements
        for process in root.findall('.//{http://www.omg.org/spec/BPMN/20100524/MODEL}process'):
            return process
        
        # Fallback for elements without namespace
        for process in root.findall('.//process'):
            return process
            
        return None
    
    def _extract_elements(self, process: ET.Element) -> List[Dict]:
        """Extract all flow elements from the process."""
        elements = []
        
        # Common BPMN elements to look for
        element_types = [
            'startEvent', 'endEvent', 'intermediateThrowEvent', 'intermediateCatchEvent',
            'task', 'userTask', 'serviceTask', 'scriptTask', 'manualTask',
            'exclusiveGateway', 'parallelGateway', 'inclusiveGateway',
            'subProcess', 'callActivity'
        ]
        
        for element_type in element_types:
            # Handle namespaced elements
            namespace_uri = "http://www.omg.org/spec/BPMN/20100524/MODEL"
            xpath = f'.//{{{namespace_uri}}}{element_type}'
            for elem in process.findall(xpath):
                elements.append({
                    'id': elem.get('id'),
                    'type': element_type,
                    'name': elem.get('name', ''),
                    'element': elem
                })
            
            # Fallback for non-namespaced
            for elem in process.findall(f'.//{element_type}'):
                if not any(e['id'] == elem.get('id') for e in elements):
                    elements.append({
                        'id': elem.get('id'),
                        'type': element_type,
                        'name': elem.get('name', ''),
                        'element': elem
                    })
        
        return elements
    
    def _extract_sequence_flows(self, process: ET.Element) -> List[Dict]:
        """Extract all sequence flows from the process."""
        flows = []
        
        # Handle namespaced sequence flows
        namespace_uri = "http://www.omg.org/spec/BPMN/20100524/MODEL"
        xpath = f'.//{{{namespace_uri}}}sequenceFlow'
        for flow in process.findall(xpath):
            flows.append({
                'id': flow.get('id'),
                'sourceRef': flow.get('sourceRef'),
                'targetRef': flow.get('targetRef'),
                'name': flow.get('name', ''),
                'element': flow
            })
        
        # Fallback for non-namespaced
        for flow in process.findall('.//sequenceFlow'):
            if not any(f['id'] == flow.get('id') for f in flows):
                flows.append({
                    'id': flow.get('id'),
                    'sourceRef': flow.get('sourceRef'),
                    'targetRef': flow.get('targetRef'),
                    'name': flow.get('name', ''),
                    'element': flow
                })
        
        return flows
    
    def _generate_layout(self, elements: List[Dict], flows: List[Dict]) -> Dict[str, Dict]:
        """Generate layout coordinates for elements."""
        layout = {}
        
        if not elements:
            return layout
        
        # Simple left-to-right layout
        # Start with start events
        start_events = [e for e in elements if 'start' in e['type'].lower()]
        current_x = self.start_x
        current_y = self.start_y
        
        # Create a simple flow-based layout
        positioned = set()
        
        if start_events:
            # Position start events first
            for i, start_event in enumerate(start_events):
                y_offset = i * (self.vertical_spacing + 50)
                layout[start_event['id']] = {
                    'x': current_x,
                    'y': current_y + y_offset,
                    'type': start_event['type']
                }
                positioned.add(start_event['id'])
                
                # Follow the flow from start event
                self._layout_connected_elements(
                    start_event['id'], elements, flows, layout, 
                    positioned, current_x + self.horizontal_spacing, 
                    current_y + y_offset
                )
        
        # Position any remaining elements
        remaining = [e for e in elements if e['id'] not in positioned]
        for i, element in enumerate(remaining):
            layout[element['id']] = {
                'x': current_x + (i * self.horizontal_spacing),
                'y': current_y + len(start_events) * self.vertical_spacing + 100,
                'type': element['type']
            }
        
        return layout
    
    def _layout_connected_elements(self, source_id: str, elements: List[Dict], 
                                 flows: List[Dict], layout: Dict, positioned: set,
                                 start_x: int, start_y: int):
        """Recursively layout elements connected to the source element."""
        outgoing_flows = [f for f in flows if f['sourceRef'] == source_id]
        
        for i, flow in enumerate(outgoing_flows):
            target_id = flow['targetRef']
            if target_id not in positioned:
                # Calculate position for target element
                y_offset = i * self.vertical_spacing if i > 0 else 0
                layout[target_id] = {
                    'x': start_x,
                    'y': start_y + y_offset,
                    'type': next((e['type'] for e in elements if e['id'] == target_id), 'task')
                }
                positioned.add(target_id)
                
                # Continue with connected elements
                self._layout_connected_elements(
                    target_id, elements, flows, layout, positioned,
                    start_x + self.horizontal_spacing, start_y + y_offset
                )
    
    def _add_diagram_to_xml(self, root: ET.Element, layout: Dict, 
                          elements: List[Dict], flows: List[Dict]) -> str:
        """Add BPMN diagram information to the XML."""
        # Get the process ID
        process = self._find_process_element(root)
        process_id = process.get('id') if process else 'Process_1'
        
        # Create BPMNDiagram element
        diagram = ET.SubElement(root, '{http://www.omg.org/spec/BPMN/20100524/DI}BPMNDiagram')
        diagram.set('id', f'BPMNDiagram_{process_id}')
        
        # Create BPMNPlane
        plane = ET.SubElement(diagram, '{http://www.omg.org/spec/BPMN/20100524/DI}BPMNPlane')
        plane.set('id', f'BPMNPlane_{process_id}')
        plane.set('bpmnElement', process_id or 'Process_1')
        
        # Add shapes for elements
        for element in elements:
            element_id = element['id']
            if element_id in layout:
                shape = ET.SubElement(plane, '{http://www.omg.org/spec/BPMN/20100524/DI}BPMNShape')
                shape.set('id', f'{element_id}_di')
                shape.set('bpmnElement', element_id)
                
                # Get dimensions
                element_type = element['type']
                dims = self.element_dimensions.get(element_type, {'width': 100, 'height': 80})
                
                # Create Bounds
                bounds = ET.SubElement(shape, '{http://www.omg.org/spec/DD/20100524/DC}Bounds')
                bounds.set('x', str(layout[element_id]['x']))
                bounds.set('y', str(layout[element_id]['y']))
                bounds.set('width', str(dims['width']))
                bounds.set('height', str(dims['height']))
        
        # Add edges for sequence flows
        for flow in flows:
            source_id = flow['sourceRef']
            target_id = flow['targetRef']
            
            if source_id in layout and target_id in layout:
                edge = ET.SubElement(plane, '{http://www.omg.org/spec/BPMN/20100524/DI}BPMNEdge')
                edge.set('id', f'{flow["id"]}_di')
                edge.set('bpmnElement', flow['id'])
                
                # Calculate waypoints
                source_layout = layout[source_id]
                target_layout = layout[target_id]
                
                source_dims = self.element_dimensions.get(source_layout['type'], {'width': 100, 'height': 80})
                target_dims = self.element_dimensions.get(target_layout['type'], {'width': 100, 'height': 80})
                
                # Source waypoint (right edge of source element)
                source_x = source_layout['x'] + source_dims['width']
                source_y = source_layout['y'] + source_dims['height'] // 2
                
                # Target waypoint (left edge of target element)
                target_x = target_layout['x']
                target_y = target_layout['y'] + target_dims['height'] // 2
                
                # Add waypoints
                waypoint1 = ET.SubElement(edge, '{http://www.omg.org/spec/DD/20100524/DI}waypoint')
                waypoint1.set('x', str(source_x))
                waypoint1.set('y', str(source_y))
                
                waypoint2 = ET.SubElement(edge, '{http://www.omg.org/spec/DD/20100524/DI}waypoint')
                waypoint2.set('x', str(target_x))
                waypoint2.set('y', str(target_y))
        
        # Convert back to string
        ET.register_namespace('bpmn', 'http://www.omg.org/spec/BPMN/20100524/MODEL')
        ET.register_namespace('bpmndi', 'http://www.omg.org/spec/BPMN/20100524/DI')
        ET.register_namespace('dc', 'http://www.omg.org/spec/DD/20100524/DC')
        ET.register_namespace('di', 'http://www.omg.org/spec/DD/20100524/DI')
        
        xml_str = ET.tostring(root, encoding='unicode')
        
        # Add XML declaration if not present
        if not xml_str.startswith('<?xml'):
            xml_str = '<?xml version="1.0" encoding="UTF-8"?>\n' + xml_str
        
        return xml_str


def add_auto_layout_to_bpmn(bpmn_xml: str) -> str:
    """
    Convenience function to add auto-layout to BPMN XML.
    
    Args:
        bpmn_xml: BPMN XML string with process structure only
        
    Returns:
        Complete BPMN XML with diagram layout information
    """
    auto_layout = BPMNAutoLayout()
    return auto_layout.add_diagram_to_bpmn(bpmn_xml)
