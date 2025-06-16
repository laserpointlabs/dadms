#!/usr/bin/env python3
"""
Test runner for DADM Analysis Service
Runs all tests and provides a summary of results
"""

import os
import sys
import subprocess
import json
import tempfile
from pathlib import Path

# Add the service directory to the path
service_dir = Path(__file__).parent.parent
sys.path.insert(0, str(service_dir))

def check_dependencies():
    """Check if required dependencies are available"""
    missing_deps = []
    
    try:
        import fastapi
        print("✓ FastAPI available")
    except ImportError:
        missing_deps.append("fastapi")
        print("✗ FastAPI not available")
    
    try:
        import uvicorn
        print("✓ Uvicorn available") 
    except ImportError:
        missing_deps.append("uvicorn")
        print("✗ Uvicorn not available")
    
    try:
        import pydantic
        print("✓ Pydantic available")
    except ImportError:
        missing_deps.append("pydantic")
        print("✗ Pydantic not available")
    
    try:
        import requests
        print("✓ Requests available")
    except ImportError:
        missing_deps.append("requests")
        print("✗ Requests not available")
    
    return missing_deps

def run_import_tests():
    """Test that all service components can be imported"""
    print("\n=== Testing Service Component Imports ===")
    
    try:
        # Test core models
        from models import (
            AnalysisTemplate, AnalysisRequest, CompiledAnalysisPrompt,
            ProcessedAnalysis, AnalysisExecution, AnalysisServiceConfig
        )
        print("✓ Models imported successfully")
        
        # Test template manager
        from template_manager import AnalysisTemplateManager
        print("✓ Template Manager imported successfully")
        
        # Test prompt compiler
        from prompt_compiler import AnalysisPromptCompiler
        print("✓ Prompt Compiler imported successfully")
        
        # Test analysis processor
        from analysis_processor import AnalysisProcessor
        print("✓ Analysis Processor imported successfully")
        
        # Test service
        try:
            from service import app
            print("✓ Service imported successfully")
        except Exception as e:
            print(f"⚠ Service import had issues: {e}")
        
        return True
        
    except Exception as e:
        print(f"✗ Import failed: {e}")
        return False

def test_template_loading():
    """Test template loading functionality"""
    print("\n=== Testing Template Loading ===")
    
    try:
        from template_manager import AnalysisTemplateManager
        
        # Check if templates file exists
        templates_file = service_dir / "analysis_templates.json"
        if templates_file.exists():
            manager = AnalysisTemplateManager(str(templates_file))
            templates = manager.list_templates()
            print(f"✓ Loaded {len(templates)} templates")
            
            # Test template access
            for template in templates[:2]:  # Test first two
                template_detail = manager.get_template(template.id)
                if template_detail:
                    print(f"✓ Template '{template.id}' accessible")
                else:
                    print(f"✗ Template '{template.id}' not accessible")
            
            return True
        else:
            print(f"✗ Templates file not found: {templates_file}")
            return False
            
    except Exception as e:
        print(f"✗ Template loading failed: {e}")
        return False

def test_basic_functionality():
    """Test basic service functionality"""
    print("\n=== Testing Basic Functionality ===")
    
    try:
        from models import AnalysisServiceConfig, AnalysisRequest
        from template_manager import AnalysisTemplateManager
        from prompt_compiler import AnalysisPromptCompiler
        
        # Create config
        config = AnalysisServiceConfig()
        print(f"✓ Config created: {config.service_name}")
        
        # Create template manager
        templates_file = service_dir / "analysis_templates.json"
        if templates_file.exists():
            manager = AnalysisTemplateManager(str(templates_file))
            print("✓ Template manager created")
            
            # Create prompt compiler
            compiler = AnalysisPromptCompiler(config, manager)
            print("✓ Prompt compiler created")
            
            # Test basic operations
            templates = manager.list_templates()
            if templates:
                first_template = templates[0]
                instructions = manager.generate_analysis_instructions(first_template.id)
                print(f"✓ Generated instructions for {first_template.id}")
            
            return True
        else:
            print("✗ Templates file not available")
            return False
            
    except Exception as e:
        print(f"✗ Basic functionality test failed: {e}")
        return False

def test_api_startup():
    """Test that the API can start up"""
    print("\n=== Testing API Startup ===")
    
    try:
        from service import app, startup_event
        
        # Test app creation
        assert app is not None
        print("✓ FastAPI app created")
        
        # Test startup event (if available)
        try:
            import asyncio
            asyncio.run(startup_event())
            print("✓ Startup event completed")
        except Exception as e:
            print(f"⚠ Startup event issues: {e}")
        
        return True
        
    except Exception as e:
        print(f"✗ API startup test failed: {e}")
        return False

def create_sample_test_data():
    """Create sample test data for manual testing"""
    print("\n=== Creating Sample Test Data ===")
    
    sample_request = {
        "prompt_reference": "business_strategy_prompt",
        "analysis_reference": "decision_analysis_v1",
        "context_variables": {
            "company": "TestCorp",
            "decision": "technology_selection",
            "budget": 100000,
            "team_size": 10
        },
        "metadata": {
            "priority": "high",
            "source": "automated_test"
        }
    }
    
    workflow_request = {
        "workflow_id": "test_workflow_123",
        "task_id": "analysis_task_001",
        "prompt_reference": "market_analysis_prompt", 
        "analysis_reference": "business_analysis_v1",
        "process_variables": {
            "target_market": "north_america",
            "budget": 500000,
            "timeline": "Q3_2024"
        },
        "task_variables": {
            "analysis_depth": "comprehensive",
            "include_competitive_analysis": True
        }
    }
    
    test_data = {
        "basic_analysis_request": sample_request,
        "workflow_analysis_request": workflow_request,
        "test_instructions": {
            "basic_analysis": "POST /analyze with basic_analysis_request",
            "workflow_analysis": "POST /workflow/analyze with workflow_analysis_request",
            "list_templates": "GET /templates",
            "health_check": "GET /health",
            "statistics": "GET /statistics"
        }
    }
    
    # Write to test data file
    test_data_file = service_dir / "test_data.json"
    with open(test_data_file, 'w') as f:
        json.dump(test_data, f, indent=2)
    
    print(f"✓ Sample test data written to {test_data_file}")
    return True

def run_pytest_if_available():
    """Run pytest if available"""
    print("\n=== Running Pytest (if available) ===")
    
    try:
        # Check if pytest is available
        result = subprocess.run(["python", "-m", "pytest", "--version"], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("✓ Pytest available")
            
            # Run tests
            test_dir = service_dir / "tests"
            result = subprocess.run(["python", "-m", "pytest", str(test_dir), "-v"], 
                                  capture_output=True, text=True)
            
            print("Pytest output:")
            print(result.stdout)
            if result.stderr:
                print("Pytest errors:")
                print(result.stderr)
            
            return result.returncode == 0
        else:
            print("✗ Pytest not available")
            return False
            
    except Exception as e:
        print(f"⚠ Pytest execution failed: {e}")
        return False

def main():
    """Main test runner"""
    print("DADM Analysis Service - Test Runner")
    print("=" * 50)
    
    results = {}
    
    # Check dependencies
    print("\n=== Checking Dependencies ===")
    missing_deps = check_dependencies()
    results["dependencies"] = len(missing_deps) == 0
    
    if missing_deps:
        print(f"\nMissing dependencies: {', '.join(missing_deps)}")
        print("Install with: pip install " + " ".join(missing_deps))
    
    # Run tests
    results["imports"] = run_import_tests()
    results["templates"] = test_template_loading()
    results["functionality"] = test_basic_functionality()
    results["api_startup"] = test_api_startup()
    results["test_data"] = create_sample_test_data()
    results["pytest"] = run_pytest_if_available()
    
    # Summary
    print("\n" + "=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    
    passed = 0
    total = 0
    
    for test_name, result in results.items():
        total += 1
        if result:
            passed += 1
            status = "✓ PASS"
        else:
            status = "✗ FAIL"
        
        print(f"{test_name.replace('_', ' ').title():<20} {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Analysis service is ready.")
        return 0
    else:
        print(f"\n⚠ {total - passed} tests failed. Check output above.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
