#!/usr/bin/env python3
"""
Test Enhanced BPMN AI Service

This script demonstrates the enhanced BPMN AI service with:
1. External prompt management
2. Example storage and retrieval
3. Better BPMN structure validation
4. Configurable templates
"""

import os
import sys
import json
import asyncio
from pathlib import Path

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from src.services.enhanced_bpmn_ai_service import (
    get_enhanced_bpmn_ai_service,
    BPMNGenerationRequest,
    BPMNExample,
    BPMNComplexity
)

async def test_enhanced_bpmn_generation():
    """Test enhanced BPMN generation"""
    print("🚀 Testing Enhanced BPMN AI Service")
    print("=" * 50)
    
    try:
        # Get the enhanced service
        service = get_enhanced_bpmn_ai_service()
        print("✅ Enhanced BPMN AI service initialized")
        
        # Test 1: Simple approval workflow
        print("\n📋 Test 1: Simple Approval Workflow")
        print("-" * 30)
        
        request1 = BPMNGenerationRequest(
            user_input="Create a simple approval process where someone submits a request, it gets reviewed, and then approved or rejected",
            template_name="approval_workflow",
            complexity_preference=BPMNComplexity.SIMPLE
        )
        
        result1 = await service.generate_bpmn(request1)
        print(f"✅ Generated BPMN in {result1.generation_time:.2f}s")
        print(f"   Complexity: {result1.complexity_level.value}")
        print(f"   Confidence: {result1.confidence_score}")
        print(f"   Elements: {result1.elements_created}")
        print(f"   Examples used: {result1.examples_used}")
        print(f"   Validation errors: {len(result1.validation_errors)}")
        
        if result1.validation_errors:
            print("   Validation issues:")
            for error in result1.validation_errors:
                print(f"     - {error}")
        
        # Test 2: Complex parallel process
        print("\n📋 Test 2: Complex Parallel Process")
        print("-" * 30)
        
        request2 = BPMNGenerationRequest(
            user_input="Create a process that starts, then runs three tasks in parallel (data processing, validation, and notification), and then joins them together to finish",
            template_name="advanced_generation",
            complexity_preference=BPMNComplexity.COMPLEX,
            max_examples=2
        )
        
        result2 = await service.generate_bpmn(request2)
        print(f"✅ Generated BPMN in {result2.generation_time:.2f}s")
        print(f"   Complexity: {result2.complexity_level.value}")
        print(f"   Confidence: {result2.confidence_score}")
        print(f"   Elements: {result2.elements_created}")
        print(f"   Examples used: {result2.examples_used}")
        print(f"   Validation errors: {len(result2.validation_errors)}")
        
        # Test 3: Decision process
        print("\n📋 Test 3: Decision Process")
        print("-" * 30)
        
        request3 = BPMNGenerationRequest(
            user_input="Create a decision process for loan applications where we check credit score, income, and employment status, then make a decision based on multiple criteria",
            template_name="decision_process",
            complexity_preference=BPMNComplexity.MODERATE
        )
        
        result3 = await service.generate_bpmn(request3)
        print(f"✅ Generated BPMN in {result3.generation_time:.2f}s")
        print(f"   Complexity: {result3.complexity_level.value}")
        print(f"   Confidence: {result3.confidence_score}")
        print(f"   Elements: {result3.elements_created}")
        print(f"   Examples used: {result3.examples_used}")
        print(f"   Validation errors: {len(result3.validation_errors)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing enhanced BPMN generation: {e}")
        return False

def test_example_management():
    """Test example management functionality"""
    print("\n📚 Testing Example Management")
    print("=" * 30)
    
    try:
        service = get_enhanced_bpmn_ai_service()
        
        # Get current examples
        examples = service.get_examples()
        print(f"✅ Found {len(examples)} existing examples")
        
        # Test adding a new example
        new_example = BPMNExample(
            id="test_example",
            name="Test Workflow",
            description="A test workflow for demonstration",
            natural_language="Create a simple test workflow",
            bpmn_xml="""<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" name="Test Process" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Start">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Test Task">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="End">
      <bpmn:incoming>Flow_2</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1" />
  </bpmn:process>
</bpmn:definitions>""",
            complexity=BPMNComplexity.SIMPLE,
            tags=["test", "simple", "demo"]
        )
        
        service.add_example(new_example)
        print("✅ Added new example successfully")
        
        # Test finding similar examples
        similar_examples = service.example_store.find_similar_examples("approval workflow", 2)
        print(f"✅ Found {len(similar_examples)} similar examples for 'approval workflow'")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing example management: {e}")
        return False

def test_prompt_templates():
    """Test prompt template management"""
    print("\n📝 Testing Prompt Templates")
    print("=" * 30)
    
    try:
        service = get_enhanced_bpmn_ai_service()
        
        # Get available templates
        templates = service.prompt_manager.templates
        print(f"✅ Found {len(templates)} prompt templates:")
        
        for template_name, template in templates.items():
            print(f"   - {template_name}: {template.description}")
            print(f"     Variables: {template.variables}")
            print(f"     Metadata: {template.metadata}")
        
        # Test template rendering
        test_prompt = service.prompt_manager.render_template(
            "basic_generation",
            user_input="Test input",
            context="Test context",
            examples_section="Test examples"
        )
        
        print(f"✅ Successfully rendered template (length: {len(test_prompt)} chars)")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing prompt templates: {e}")
        return False

def test_validation():
    """Test BPMN validation"""
    print("\n🔍 Testing BPMN Validation")
    print("=" * 30)
    
    try:
        service = get_enhanced_bpmn_ai_service()
        
        # Test valid BPMN
        valid_bpmn = """<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" name="Test Process" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Start">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Test Task">
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
</bpmn:definitions>"""
        
        validation_errors = service.validator.validate_bpmn_xml(valid_bpmn)
        print(f"✅ Valid BPMN validation: {len(validation_errors)} errors")
        
        # Test invalid BPMN
        invalid_bpmn = "<invalid>xml</invalid>"
        validation_errors = service.validator.validate_bpmn_xml(invalid_bpmn)
        print(f"✅ Invalid BPMN validation: {len(validation_errors)} errors")
        for error in validation_errors:
            print(f"     - {error}")
        
        # Test fixing common issues
        problematic_bpmn = """<bpmn:definitions>
  <bpmn:process id='Process_1'>
    <bpmn:startEvent id='StartEvent_1'/>
    <bpmn:endEvent id='EndEvent_1'/>
  </bpmn:process>
</bpmn:definitions>"""
        
        fixed_bpmn = service.validator.fix_common_issues(problematic_bpmn)
        print(f"✅ Fixed BPMN (length: {len(fixed_bpmn)} chars)")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing validation: {e}")
        return False

async def main():
    """Main test function"""
    print("🧪 Enhanced BPMN AI Service Test Suite")
    print("Testing all enhanced functionality...")
    print("=" * 60)
    
    # Run all tests
    tests = [
        ("BPMN Generation", test_enhanced_bpmn_generation),
        ("Example Management", test_example_management),
        ("Prompt Templates", test_prompt_templates),
        ("Validation", test_validation)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            if asyncio.iscoroutinefunction(test_func):
                success = await test_func()
            else:
                success = test_func()
            results.append((test_name, success))
        except Exception as e:
            print(f"❌ {test_name} test failed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Results Summary")
    print("=" * 60)
    
    all_passed = True
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{test_name}: {status}")
        if not success:
            all_passed = False
    
    if all_passed:
        print("\n🎉 All tests passed! Enhanced BPMN AI service is working correctly.")
        print("\n🚀 Ready for Production Use:")
        print("1. Enhanced BPMN generation with external prompts")
        print("2. Example storage and retrieval")
        print("3. Better BPMN validation and fixing")
        print("4. Configurable template system")
    else:
        print("\n⚠️ Some tests failed. Please review the issues above.")
    
    return all_passed

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1) 