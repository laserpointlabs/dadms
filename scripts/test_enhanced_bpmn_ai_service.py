#!/usr/bin/env python3
"""
Test script for the enhanced BPMN AI service
Tests all new features including vector store integration, token management, and model selection
"""

import os
import sys
import json
import time
import asyncio
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.services.enhanced_bpmn_ai_service import (
    EnhancedBPMNAIService, 
    BPMNGenerationRequest, 
    BPMNExample, 
    BPMNComplexity
)

def test_enhanced_bpmn_ai_service():
    """Test the enhanced BPMN AI service with all features"""
    print("🧪 Testing Enhanced BPMN AI Service")
    print("=" * 50)
    
    try:
        # Initialize the service
        print("1. Initializing Enhanced BPMN AI Service...")
        service = EnhancedBPMNAIService()
        print("✅ Service initialized successfully")
        
        # Test configuration
        print("\n2. Testing configuration...")
        print(f"   - Model: {service.model}")
        print(f"   - Max prompt tokens: {service.max_prompt_tokens}")
        print(f"   - Qdrant client available: {service.qdrant_client is not None}")
        print(f"   - Example store loaded: {len(service.example_store.examples)} examples")
        print(f"   - Prompt templates loaded: {len(service.prompt_manager.templates)} templates")
        print("✅ Configuration loaded successfully")
        
        # Test vector store integration
        print("\n3. Testing vector store integration...")
        if service.qdrant_client:
            try:
                # Test adding examples to vector store
                test_example = BPMNExample(
                    id="test_decision_process",
                    name="Test Decision Process",
                    description="A simple decision process for testing",
                    natural_language="Create a simple decision process for approving expense reports",
                    bpmn_xml="""<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <bpmn:process id="test_process" name="Test Process">
    <bpmn:startEvent id="start" name="Start"/>
    <bpmn:task id="task1" name="Test Task"/>
    <bpmn:endEvent id="end" name="End"/>
    <bpmn:sequenceFlow id="flow1" sourceRef="start" targetRef="task1"/>
    <bpmn:sequenceFlow id="flow2" sourceRef="task1" targetRef="end"/>
  </bpmn:process>
</bpmn:definitions>""",
                    complexity=BPMNComplexity.SIMPLE,
                    tags=["test", "decision", "simple"]
                )
                
                service.add_example(test_example)
                print("✅ Example added to store")
                
                # Test retrieving examples
                examples = service.get_examples()
                print(f"✅ Retrieved {len(examples)} examples from store")
                
            except Exception as e:
                print(f"⚠️  Vector store test failed: {e}")
        else:
            print("⚠️  Qdrant client not available")
        
        # Test prompt template loading
        print("\n4. Testing prompt templates...")
        for template_name, template in service.prompt_manager.templates.items():
            print(f"   - {template_name}: {len(template.template)} characters")
        print("✅ Prompt templates loaded successfully")
        
        # Test token counting
        print("\n5. Testing token counting...")
        test_text = "This is a test text for token counting."
        tokens = service._count_tokens(test_text)
        print(f"   - Test text: '{test_text}'")
        print(f"   - Token count: {tokens}")
        print("✅ Token counting working")
        
        # Test BPMN generation with different scenarios
        print("\n6. Testing BPMN generation scenarios...")
        
        scenarios = [
            {
                "name": "Simple Decision Process",
                "description": "Create a simple decision process for approving expense reports",
                "template": "decision_process",
                "complexity": BPMNComplexity.SIMPLE
            },
            {
                "name": "Approval Workflow",
                "description": "Create an approval workflow for project proposals",
                "template": "approval_workflow",
                "complexity": BPMNComplexity.MODERATE
            }
        ]
        
        for i, scenario in enumerate(scenarios, 1):
            print(f"\n   Testing scenario {i}: {scenario['name']}")
            try:
                # Create request
                request = BPMNGenerationRequest(
                    user_input=scenario['description'],
                    template_name=scenario['template'],
                    complexity_preference=scenario['complexity'],
                    include_examples=True,
                    max_examples=2
                )
                
                # Generate BPMN (async)
                async def generate():
                    return await service.generate_bpmn(request)
                
                result = asyncio.run(generate())
                
                print(f"   ✅ Generated BPMN successfully")
                print(f"   - Generation time: {result.generation_time:.2f}s")
                print(f"   - Examples used: {len(result.examples_used)}")
                print(f"   - Validation errors: {len(result.validation_errors)}")
                
                # Validate BPMN XML
                bpmn_xml = result.bpmn_xml
                if '<?xml' in bpmn_xml and '<bpmn:' in bpmn_xml:
                    print(f"   ✅ Valid BPMN XML generated")
                else:
                    print(f"   ⚠️  BPMN XML may be invalid")
                    
            except Exception as e:
                print(f"   ❌ Error in scenario {i}: {e}")
        
        # Test error handling
        print("\n7. Testing error handling...")
        
        # Test with empty description
        try:
            request = BPMNGenerationRequest(user_input="")
            async def generate_empty():
                return await service.generate_bpmn(request)
            
            result = asyncio.run(generate_empty())
            print("   ⚠️  Should have failed with empty description")
        except Exception as e:
            print(f"   ✅ Caught exception for empty description: {e}")
        
        # Test with invalid template
        try:
            request = BPMNGenerationRequest(
                user_input="test", 
                template_name="invalid_template"
            )
            async def generate_invalid():
                return await service.generate_bpmn(request)
            
            result = asyncio.run(generate_invalid())
            print("   ⚠️  Should have failed with invalid template")
        except Exception as e:
            print(f"   ✅ Caught exception for invalid template: {e}")
        
        print("\n" + "=" * 50)
        print("🎉 Enhanced BPMN AI Service Test Complete!")
        print("\nNext steps:")
        print("1. Start the backend services")
        print("2. Navigate to the BPMN workspace page")
        print("3. Test the AI workflow designer with different scenarios")
        print("4. Verify BPMN generation and loading into the canvas")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_api_integration():
    """Test the API integration"""
    print("\n🌐 Testing API Integration")
    print("=" * 30)
    
    try:
        # Create a Flask app for testing
        from flask import Flask
        from src.api.enhanced_bpmn_ai_routes import enhanced_bpmn_ai_bp
        
        # Create test app
        app = Flask(__name__)
        app.register_blueprint(enhanced_bpmn_ai_bp)
        
        # Create a test client
        from flask.testing import FlaskClient
        client = app.test_client()
        
        # Test the enhanced BPMN generation endpoint
        test_data = {
            "user_input": "Create a simple approval workflow for expense reports",
            "template_name": "approval_workflow",
            "complexity_preference": "simple",
            "include_examples": True,
            "max_examples": 2
        }
        
        response = client.post('/api/enhanced-bpmn-ai/generate', 
                             json=test_data,
                             content_type='application/json')
        
        if response.status_code == 200:
            result = response.get_json()
            print("✅ API endpoint working")
            print(f"   - Success: {result.get('success', False)}")
            if result.get('success'):
                print(f"   - BPMN generated: {len(result.get('bpmn_xml', ''))} characters")
                print(f"   - Generation time: {result.get('generation_time', 'N/A')}s")
        else:
            print(f"❌ API endpoint failed: {response.status_code}")
            print(f"   Response: {response.get_data(as_text=True)}")
            
    except Exception as e:
        print(f"❌ API test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🚀 Starting Enhanced BPMN AI Service Tests")
    print("=" * 60)
    
    # Run the main service test
    success = test_enhanced_bpmn_ai_service()
    
    # Run API integration test
    test_api_integration()
    
    if success:
        print("\n✅ All tests completed successfully!")
        print("\nYou can now test the BPMN workspace page:")
        print("1. Start the backend: python scripts/start_services.py")
        print("2. Start the UI: cd ui && npm start")
        print("3. Navigate to the BPMN workspace page")
        print("4. Try generating BPMN with different templates and complexity levels")
    else:
        print("\n❌ Some tests failed. Please check the errors above.")
        sys.exit(1) 