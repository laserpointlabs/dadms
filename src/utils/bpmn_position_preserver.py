"""
BPMN Position Preserver

This module provides functionality to preserve existing element positions
when modifying BPMN models, ensuring that user-arranged layouts are maintained.
"""

import xml.etree.ElementTree as ET
import re
from typing import Dict, List, Tuple, Optional
from .bpmn_auto_layout import BPMNAutoLayout


class BPMNPositionPreserver:
    """
    Preserves existing element positions when modifying BPMN models.
    """
    
    def __init__(self):
        self.auto_layout = BPMNAutoLayout()
    
    def preserve_positions(self, original_bpmn: str, modified_bpmn: str) -> str:
        """
        Merge a modified BPMN model while preserving positions from the original.
        
        Args:
            original_bpmn: The original BPMN XML with user-arranged positions
            modified_bpmn: The modified BPMN XML from AI
            
        Returns:
            Merged BPMN XML with preserved positions
        """
        try:
            # Extract existing positions from original
            existing_positions = self._extract_positions(original_bpmn)
            
            # Parse the modified BPMN
            modified_root = ET.fromstring(modified_bpmn)
            
            # Preserve positions for existing elements
            self._preserve_existing_positions(modified_root, existing_positions)
            
            # Add auto-layout for new elements only
            self._add_layout_for_new_elements(modified_root, existing_positions)
            
            # Convert back to string
            ET.register_namespace('bpmn', 'http://www.omg.org/spec/BPMN/20100524/MODEL')
            ET.register_namespace('bpmndi', 'http://www.omg.org/spec/BPMN/20100524/DI')
            ET.register_namespace('dc', 'http://www.omg.org/spec/DD/20100524/DC')
            ET.register_namespace('di', 'http://www.omg.org/spec/DD/20100524/DI')
            
            result_xml = ET.tostring(modified_root, encoding='unicode')
            
            # Add XML declaration if not present
            if not result_xml.startswith('<?xml'):
                result_xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + result_xml
            
            return result_xml
            
        except Exception as e:
            print(f"Error preserving positions: {e}")
            # Fallback to auto-layout if preservation fails
            return self.auto_layout.add_diagram_to_bpmn(modified_bpmn)
    
    def _extract_positions(self, bpmn_xml: str) -> Dict[str, Dict]:
        """Extract existing element positions from BPMN XML."""
        positions = {}
        
        try:
            root = ET.fromstring(bpmn_xml)
            
            # Find all BPMNShape elements
            for shape in root.findall('.//{http://www.omg.org/spec/BPMN/20100524/DI}BPMNShape'):
                element_id = shape.get('bpmnElement')
                bounds = shape.find('.//{http://www.omg.org/spec/DD/20100524/DC}Bounds')
                
                if element_id and bounds:
                    positions[element_id] = {
                        'x': float(bounds.get('x', 0)),
                        'y': float(bounds.get('y', 0)),
                        'width': float(bounds.get('width', 100)),
                        'height': float(bounds.get('height', 80)),
                        'shape_element': shape
                    }
        except Exception as e:
            print(f"Error extracting positions: {e}")
        
        return positions
    
    def _preserve_existing_positions(self, root: ET.Element, existing_positions: Dict[str, Dict]):
        """Preserve positions for elements that already exist."""
        # Find or create BPMNDiagram
        diagram = root.find('.//{http://www.omg.org/spec/BPMN/20100524/DI}BPMNDiagram')
        if diagram is None:
            # Create diagram if it doesn't exist
            diagram = ET.SubElement(root, '{http://www.omg.org/spec/BPMN/20100524/DI}BPMNDiagram')
            diagram.set('id', 'BPMNDiagram_1')
        
        # Find or create BPMNPlane
        plane = diagram.find('.//{http://www.omg.org/spec/BPMN/20100524/DI}BPMNPlane')
        if plane is None:
            process = root.find('.//{http://www.omg.org/spec/BPMN/20100524/MODEL}process')
            process_id = process.get('id') if process else 'Process_1'
            plane = ET.SubElement(diagram, '{http://www.omg.org/spec/BPMN/20100524/DI}BPMNPlane')
            plane.set('id', f'BPMNPlane_{process_id}')
            plane.set('bpmnElement', process_id or 'Process_1')
        
        # Preserve existing shapes
        for element_id, position_data in existing_positions.items():
            # Check if element still exists in the modified model
            if root.find(f'.//*[@id="{element_id}"]') is not None:
                # Create or update shape element
                shape = plane.find(f'.//{{http://www.omg.org/spec/BPMN/20100524/DI}}BPMNShape[@bpmnElement="{element_id}"]')
                if shape is None:
                    shape = ET.SubElement(plane, '{http://www.omg.org/spec/BPMN/20100524/DI}BPMNShape')
                    shape.set('id', f'{element_id}_di')
                    shape.set('bpmnElement', element_id)
                
                # Update or create bounds
                bounds = shape.find('.//{http://www.omg.org/spec/DD/20100524/DC}Bounds')
                if bounds is None:
                    bounds = ET.SubElement(shape, '{http://www.omg.org/spec/DD/20100524/DC}Bounds')
                
                bounds.set('x', str(position_data['x']))
                bounds.set('y', str(position_data['y']))
                bounds.set('width', str(position_data['width']))
                bounds.set('height', str(position_data['height']))
    
    def _add_layout_for_new_elements(self, root: ET.Element, existing_positions: Dict[str, Dict]):
        """Add auto-layout for elements that don't have existing positions."""
        # Find all process elements
        process = root.find('.//{http://www.omg.org/spec/BPMN/20100524/MODEL}process')
        if process is None:
            return
        
        # Get all element IDs in the current model
        current_elements = set()
        for elem in process.findall('.//*[@id]'):
            current_elements.add(elem.get('id'))
        
        # Find elements without existing positions
        new_elements = current_elements - set(existing_positions.keys())
        
        if new_elements:
            # Use auto-layout for new elements
            # This is a simplified approach - you could enhance this to be more sophisticated
            self._add_auto_layout_for_elements(root, list(new_elements), existing_positions)
    
    def _add_auto_layout_for_elements(self, root: ET.Element, new_element_ids: List[str], existing_positions: Dict[str, Dict]):
        """Add auto-layout for new elements while avoiding existing positions."""
        # Find the BPMNPlane
        plane = root.find('.//{http://www.omg.org/spec/BPMN/20100524/DI}BPMNPlane')
        if plane is None:
            return
        
        # Calculate available space (avoid existing elements)
        max_x = max([pos['x'] + pos['width'] for pos in existing_positions.values()]) if existing_positions else 0
        max_y = max([pos['y'] + pos['height'] for pos in existing_positions.values()]) if existing_positions else 0
        
        start_x = max_x + 50  # Start after existing elements
        start_y = 100
        
        # Simple grid layout for new elements
        for i, element_id in enumerate(new_element_ids):
            x = start_x + (i * 150) % 600  # Wrap every 4 elements
            y = start_y + (i // 4) * 120
            
            # Create shape element
            shape = ET.SubElement(plane, '{http://www.omg.org/spec/BPMN/20100524/DI}BPMNShape')
            shape.set('id', f'{element_id}_di')
            shape.set('bpmnElement', element_id)
            
            # Create bounds
            bounds = ET.SubElement(shape, '{http://www.omg.org/spec/DD/20100524/DC}Bounds')
            bounds.set('x', str(x))
            bounds.set('y', str(y))
            bounds.set('width', '100')
            bounds.set('height', '80')


def preserve_bpmn_positions(original_bpmn: str, modified_bpmn: str) -> str:
    """
    Convenience function to preserve BPMN element positions.
    
    Args:
        original_bpmn: Original BPMN XML with user positions
        modified_bpmn: Modified BPMN XML from AI
        
    Returns:
        Merged BPMN XML with preserved positions
    """
    preserver = BPMNPositionPreserver()
    return preserver.preserve_positions(original_bpmn, modified_bpmn) 