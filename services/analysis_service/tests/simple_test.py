#!/usr/bin/env python3
"""
Simple test for DADM Analysis Service
Tests the service without relative imports
"""

import os
import sys
import json
from pathlib import Path

# Add the service directory to the path
service_dir = Path(__file__).parent.parent
sys.path.insert(0, str(service_dir))

def test_models():
    """Test that models can be imported and instantiated"""
    print("Testing models...")
    
    try:
        from models import AnalysisServiceConfig, AnalysisRequest
        
        # Test config creation
        config = AnalysisServiceConfig()
        assert config.service_name == "dadm-analysis-service"
        assert config.version == "0.10.0"
        print("✓ AnalysisServiceConfig works")
        
        # Test request creation
        request_data = {
            "prompt_id": "test_prompt",
            "analysis_template_id": "test_template",
            "variables": {"test": "value"},
            "context_data": {"context": "test"},
            "max_tokens": 1000,
            "temperature": 0.3
        }
        request = AnalysisRequest(**request_data)
        assert request.prompt_id == "test_prompt"
        print("✓ AnalysisRequest works")
        
        return True
    except Exception as e:
        print(f"✗ Models test failed: {e}")
        return False

def test_template_manager():
    """Test template manager functionality"""
    print("Testing template manager...")
    
    try:
        from template_manager import AnalysisTemplateManager
        
        # Check if templates file exists
        templates_file = service_dir / "analysis_templates.json"
        if not templates_file.exists():
            print(f"⚠ Templates file not found: {templates_file}")
            return False
        
        # Create manager
        manager = AnalysisTemplateManager(str(templates_file))
        print(f"✓ Template manager created with {len(manager.templates)} templates")
        
        # Test template listing
        templates = manager.list_templates()
        print(f"✓ Listed {len(templates)} templates")
        
        # Test template retrieval
        if templates:
            first_template = templates[0]
            retrieved = manager.get_template(first_template.id)
            assert retrieved is not None
            print(f"✓ Retrieved template: {first_template.id}")
            
            # Test instruction generation
            instructions = manager.generate_analysis_instructions(first_template.id)
            assert isinstance(instructions, str)
            assert len(instructions) > 0
            print(f"✓ Generated instructions for {first_template.id}")
        
        return True
    except Exception as e:
        print(f"✗ Template manager test failed: {e}")
        return False

def test_prompt_compiler():
    """Test prompt compiler functionality"""
    print("Testing prompt compiler...")
    
    try:
        from prompt_compiler import AnalysisPromptCompiler
        from template_manager import AnalysisTemplateManager
        from models import AnalysisServiceConfig
        
        # Setup
        config = AnalysisServiceConfig()
        templates_file = service_dir / "analysis_templates.json"
        
        if not templates_file.exists():
            print("⚠ Templates file not found, skipping compiler test")
            return False
        
        manager = AnalysisTemplateManager(str(templates_file))
        compiler = AnalysisPromptCompiler(config, manager)
        print("✓ Prompt compiler created")
        
        # Test token estimation
        test_text = "This is a test prompt for token estimation."
        tokens = compiler._estimate_tokens(test_text)
        assert isinstance(tokens, int)
        assert tokens > 0
        print(f"✓ Token estimation works: {tokens} tokens")
        
        return True
    except Exception as e:
        print(f"✗ Prompt compiler test failed: {e}")
        return False

def test_analysis_processor():
    """Test analysis processor functionality"""
    print("Testing analysis processor...")
    
    try:
        from analysis_processor import AnalysisProcessor
        from template_manager import AnalysisTemplateManager
        from models import AnalysisServiceConfig, CompiledAnalysisPrompt
        
        # Setup
        config = AnalysisServiceConfig()
        templates_file = service_dir / "analysis_templates.json"
        
        if not templates_file.exists():
            print("⚠ Templates file not found, skipping processor test")
            return False
        
        manager = AnalysisTemplateManager(str(templates_file))
        processor = AnalysisProcessor(config, manager)
        print("✓ Analysis processor created")
        
        # Test simulation
        templates = manager.list_templates()
        if templates:
            template = templates[0]
            compiled_prompt = CompiledAnalysisPrompt(
                prompt_id="test_prompt",
                analysis_template_id=template.id,
                compiled_prompt="Test prompt for simulation",
                rag_content=None,
                analysis_schema=template.schema,
                instructions=template.instructions,
                estimated_tokens=100
            )
            
            simulated_response = processor._simulate_llm_response(compiled_prompt)
            assert isinstance(simulated_response, str)
            assert len(simulated_response) > 0
            print("✓ LLM simulation works")
        
        return True
    except Exception as e:
        print(f"✗ Analysis processor test failed: {e}")
        return False

def test_service_creation():
    """Test that the FastAPI service can be created"""
    print("Testing service creation...")
    
    try:
        # Set environment variables to avoid dependency issues
        os.environ.setdefault("PROMPT_SERVICE_URL", "http://localhost:8000")
        
        from service import app
        assert app is not None
        print("✓ FastAPI app created successfully")
        
        # Test basic app properties
        assert app.title == "DADM Analysis Service"
        assert app.version == "1.0.0"
        print("✓ App configuration correct")
        
        return True
    except Exception as e:
        print(f"✗ Service creation test failed: {e}")
        return False

def test_templates_file():
    """Test that the templates file is valid"""
    print("Testing templates file...")
    
    try:
        templates_file = service_dir / "analysis_templates.json"
        
        if not templates_file.exists():
            print(f"✗ Templates file not found: {templates_file}")
            return False
        
        with open(templates_file, 'r') as f:
            data = json.load(f)
        
        # Templates are stored as a dict with template IDs as keys
        assert isinstance(data, dict)
        template_count = len(data)
        assert template_count > 0
        print(f"✓ Templates file valid with {template_count} templates")
        
        # Validate template structure
        for template_id, template in data.items():
            required_fields = ["id", "name", "description", "category", "schema", "instructions"]
            for field in required_fields:
                assert field in template, f"Template {template_id} missing field: {field}"
        
        print("✓ All templates have required fields")
        return True
    except Exception as e:
        print(f"✗ Templates file test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("DADM Analysis Service - Simple Test Suite")
    print("=" * 50)
    
    tests = [
        ("Templates File", test_templates_file),
        ("Models", test_models),
        ("Template Manager", test_template_manager),
        ("Prompt Compiler", test_prompt_compiler),
        ("Analysis Processor", test_analysis_processor),
        ("Service Creation", test_service_creation),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n--- {test_name} ---")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"✗ {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        if result:
            passed += 1
            status = "✓ PASS"
        else:
            status = "✗ FAIL"
        
        print(f"{test_name:<20} {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Analysis service is working correctly.")
        
        print("\n📋 Quick Start:")
        print("1. Start the service: python -m uvicorn service:app --host 0.0.0.0 --port 8000")
        print("2. Check health: curl http://localhost:8000/health")
        print("3. List templates: curl http://localhost:8000/templates")
        print("4. View sample test data: cat test_data.json")
        
        return 0
    else:
        print(f"\n⚠ {total - passed} tests failed. Check output above.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
