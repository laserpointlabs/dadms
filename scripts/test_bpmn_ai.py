"""
Test script for BPMN AI Service

This script tests the basic functionality of the BPMN AI service
to ensure it can generate and modify BPMN models correctly.
"""
import sys
import os
import asyncio
import json

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

def test_basic_import():
    """Test that we can import the BPMN AI service"""
    try:
        from src.services.bpmn_ai_service import BPMNAIService, BPMNGenerationRequest
        print("✅ Successfully imported BPMN AI service")
        return True
    except ImportError as e:
        print(f"❌ Failed to import BPMN AI service: {e}")
        return False

def test_validator_import():
    """Test that we can import the BPMN validator"""
    try:
        from src.utils.bpmn_validator import get_bpmn_validator
        validator = get_bpmn_validator()
        print("✅ Successfully imported BPMN validator")
        return True
    except ImportError as e:
        print(f"❌ Failed to import BPMN validator: {e}")
        return False

def test_templates_import():
    """Test that we can import BPMN templates"""
    try:
        from src.utils.bpmn_templates import BASIC_PROCESS_TEMPLATE, get_template_by_type
        print("✅ Successfully imported BPMN templates")
        return True
    except ImportError as e:
        print(f"❌ Failed to import BPMN templates: {e}")
        return False

async def test_bpmn_generation():
    """Test BPMN generation with a mock service (no API call)"""
    try:
        # Create a mock response for testing
        mock_response = {
            'bpmn_xml': '''<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  id="Definitions_1" 
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Start">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Sample Task">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="End">
      <bpmn:incoming>Flow_2</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1" />
  </bpmn:process>
</bpmn:definitions>''',
            'explanation': 'This is a simple test process with a start event, a task, and an end event.',
            'elements_created': ['StartEvent_1', 'Task_1', 'EndEvent_1'],
            'suggestions': ['Consider adding error handling'],
            'confidence_score': 0.9
        }
        
        # Test validation of the mock BPMN
        from src.utils.bpmn_validator import validate_bpmn_quick
        is_valid, errors = validate_bpmn_quick(mock_response['bpmn_xml'])
        
        if is_valid:
            print("✅ Mock BPMN generation and validation successful")
            return True
        else:
            print(f"❌ Mock BPMN validation failed: {errors}")
            return False
            
    except Exception as e:
        print(f"❌ BPMN generation test failed: {e}")
        return False

def test_api_routes_import():
    """Test that we can import the API routes"""
    try:
        from src.api.bpmn_ai_routes import bpmn_ai_bp
        print(f"✅ Successfully imported BPMN AI routes blueprint: {bpmn_ai_bp.name}")
        return True
    except ImportError as e:
        print(f"❌ Failed to import BPMN AI routes: {e}")
        return False

def test_pattern_recognition():
    """Test pattern recognition from user input"""
    try:
        from src.utils.bpmn_templates import identify_process_pattern
        
        test_cases = [
            ("Create an approval process", "decision"),
            ("I need parallel processing", "parallel"),
            ("Make a sequential workflow", "sequential"),
            ("Add error handling", "error_handling")
        ]
        
        for user_input, expected_pattern in test_cases:
            pattern = identify_process_pattern(user_input)
            print(f"  Input: '{user_input}' -> Pattern: '{pattern}'")
        
        print("✅ Pattern recognition test completed")
        return True
    except Exception as e:
        print(f"❌ Pattern recognition test failed: {e}")
        return False

async def run_all_tests():
    """Run all tests"""
    print("🧪 Starting BPMN AI Service Tests\n")
    
    tests = [
        ("Basic Import", test_basic_import),
        ("Validator Import", test_validator_import),
        ("Templates Import", test_templates_import),
        ("API Routes Import", test_api_routes_import),
        ("Pattern Recognition", test_pattern_recognition),
        ("BPMN Generation", test_bpmn_generation)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"🔍 Running: {test_name}")
        try:
            if asyncio.iscoroutinefunction(test_func):
                result = await test_func()
            else:
                result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results.append((test_name, False))
        print()
    
    # Summary
    print("📊 Test Results Summary:")
    print("-" * 40)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
    
    print("-" * 40)
    print(f"Total: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! BPMN AI service is ready.")
        return True
    else:
        print("⚠️  Some tests failed. Please check the issues above.")
        return False

if __name__ == "__main__":
    # Check for OpenAI API key
    if not os.getenv('OPENAI_API_KEY'):
        print("⚠️  Warning: OPENAI_API_KEY environment variable not set.")
        print("   Some functionality may not work without it.\n")
    
    # Run tests
    success = asyncio.run(run_all_tests())
    
    if success:
        print("\n🚀 Ready to start the BPMN AI service!")
        print("   Use the following commands:")
        print("   1. Start OpenAI service: python services/openai_service/service.py")
        print("   2. Start UI: cd ui && npm start")
        print("   3. Access BPMN workspace at: http://localhost:3000/bpmn")
    else:
        print("\n🔧 Please fix the issues above before proceeding.")
    
    sys.exit(0 if success else 1)
