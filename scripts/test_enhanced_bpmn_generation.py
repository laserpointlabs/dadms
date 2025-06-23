#!/usr/bin/env python3
"""
Test script for enhanced BPMN generation with canvas compatibility
"""

import os
import sys
import asyncio
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.services.enhanced_bpmn_ai_service import (
    EnhancedBPMNAIService, 
    BPMNGenerationRequest,
    BPMNComplexity
)

async def test_bpmn_generation():
    """Test BPMN generation with various scenarios"""
    print("🧪 Testing Enhanced BPMN Generation")
    print("=" * 50)
    
    try:
        # Initialize the service
        service = EnhancedBPMNAIService()
        print("✅ Service initialized")
        
        # Test scenarios
        test_cases = [
            {
                "name": "Simple Approval Workflow",
                "input": "Create a simple approval workflow where a request is submitted, reviewed by a manager, and either approved or rejected",
                "complexity": BPMNComplexity.SIMPLE,
                "template": "approval_workflow"
            },
            {
                "name": "Order Processing with Inventory Check",
                "input": "Create an order processing workflow that checks inventory availability, processes payment if items are in stock, and handles backorders if not available",
                "complexity": BPMNComplexity.MODERATE,
                "template": "decision_process"
            },
            {
                "name": "Employee Onboarding Process",
                "input": "Create an employee onboarding process with document collection, IT setup, and orientation scheduling",
                "complexity": BPMNComplexity.SIMPLE,
                "template": None  # Use default
            }
        ]
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n{i}. Testing: {test_case['name']}")
            print(f"   Input: {test_case['input']}")
            print(f"   Complexity: {test_case['complexity'].value}")
            
            # Create request
            request = BPMNGenerationRequest(
                user_input=test_case['input'],
                complexity_preference=test_case['complexity'],
                template_name=test_case['template'],
                include_examples=True,
                max_examples=2
            )
            
            # Generate BPMN
            print("   🔄 Generating BPMN...")
            response = await service.generate_bpmn(request)
            
            # Display results
            print(f"   ✅ Generated in {response.generation_time:.2f}s")
            print(f"   📊 Confidence: {response.confidence_score:.2f}")
            print(f"   🧩 Elements: {', '.join(response.elements_created)}")
            print(f"   📚 Examples used: {', '.join(response.examples_used)}")
            
            if response.validation_errors:
                print(f"   ⚠️  Validation errors: {len(response.validation_errors)}")
                for error in response.validation_errors[:3]:  # Show first 3
                    print(f"      - {error}")
            else:
                print(f"   ✅ No validation errors")
            
            # Save BPMN to file for testing
            filename = f"test_bpmn_{i}_{test_case['complexity'].value}.bpmn"
            with open(filename, 'w') as f:
                f.write(response.bpmn_xml)
            print(f"   💾 Saved to: {filename}")
            
            # Show explanation
            print(f"   📝 Explanation: {response.explanation[:100]}...")
            
            print(f"   {'-' * 50}")
        
        print(f"\n🎉 BPMN Generation Test Complete!")
        print(f"   - Generated {len(test_cases)} BPMN files")
        print(f"   - Files saved for canvas testing")
        print(f"   - Check the generated .bpmn files for bpmn.io compatibility")
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()

def validate_bpmn_for_canvas(bpmn_xml: str) -> dict:
    """Validate BPMN XML for bpmn.io canvas compatibility"""
    issues = []
    warnings = []
    
    # Check for required namespaces
    required_namespaces = [
        'xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"',
        'xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"',
        'xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"',
        'xmlns:di="http://www.omg.org/spec/DD/20100524/DI"'
    ]
    
    for namespace in required_namespaces:
        if namespace not in bpmn_xml:
            issues.append(f"Missing namespace: {namespace}")
    
    # Check for diagram elements
    if '<bpmndi:BPMNDiagram' not in bpmn_xml:
        issues.append("Missing BPMNDiagram element")
    
    if '<bpmndi:BPMNPlane' not in bpmn_xml:
        issues.append("Missing BPMNPlane element")
    
    # Check for basic BPMN elements
    if '<bpmn:startEvent' not in bpmn_xml:
        issues.append("Missing startEvent")
    
    if '<bpmn:endEvent' not in bpmn_xml:
        issues.append("Missing endEvent")
    
    # Check for proper XML structure
    if not bpmn_xml.strip().startswith('<?xml'):
        warnings.append("Missing XML declaration")
    
    if '<bpmn:definitions' not in bpmn_xml:
        issues.append("Missing bpmn:definitions root element")
    
    return {
        "valid": len(issues) == 0,
        "issues": issues,
        "warnings": warnings,
        "canvas_compatible": len(issues) == 0
    }

if __name__ == "__main__":
    asyncio.run(test_bpmn_generation()) 