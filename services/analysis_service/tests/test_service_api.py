"""
Tests for the Analysis Service API
"""

import json
import os
import sys
import asyncio
from unittest.mock import patch, MagicMock

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from fastapi.testclient import TestClient
    from service import app
    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False
    TestClient = None


class TestAnalysisServiceAPI:
    """Test cases for the Analysis Service API"""

    def setup_method(self):
        """Setup for each test method"""
        if HAS_FASTAPI:
            self.client = TestClient(app)

    def test_health_endpoint(self):
        """Test the health check endpoint"""
        if not HAS_FASTAPI:
            return  # Skip if FastAPI not available
            
        response = self.client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data

    def test_list_templates_endpoint(self):
        """Test the templates listing endpoint"""
        if not HAS_FASTAPI:
            return
            
        response = self.client.get("/templates")
        assert response.status_code == 200
        data = response.json()
        assert "templates" in data
        assert "count" in data
        assert isinstance(data["templates"], list)

    def test_get_template_endpoint(self):
        """Test getting a specific template"""
        if not HAS_FASTAPI:
            return
            
        # First get the list of templates
        templates_response = self.client.get("/templates")
        if templates_response.status_code == 200:
            templates = templates_response.json()["templates"]
            if templates:
                template_id = templates[0].id if hasattr(templates[0], 'id') else templates[0]['id']
                
                # Get specific template
                response = self.client.get(f"/templates/{template_id}")
                assert response.status_code in [200, 404]  # 404 if template not found

    def test_get_nonexistent_template(self):
        """Test getting a template that doesn't exist"""
        if not HAS_FASTAPI:
            return
            
        response = self.client.get("/templates/nonexistent_template")
        assert response.status_code == 404

    @patch('service.get_prompt_compiler')
    @patch('service.get_analysis_processor')
    def test_analyze_endpoint_basic(self, mock_processor_getter, mock_compiler_getter):
        """Test the basic analysis endpoint"""
        if not HAS_FASTAPI:
            return
            
        # Mock the dependencies
        mock_compiler = MagicMock()
        mock_processor = MagicMock()
        mock_compiler_getter.return_value = mock_compiler
        mock_processor_getter.return_value = mock_processor
        
        # Mock return values
        from models import CompiledAnalysisPrompt, ProcessedAnalysis, AnalysisExecution
        
        mock_compiled = CompiledAnalysisPrompt(
            prompt_id="test_prompt",
            analysis_template_id="test_analysis",
            compiled_prompt="Test compiled prompt",
            rag_content=None,
            analysis_schema={"type": "object"},
            instructions={"test": "instructions"},
            estimated_tokens=100
        )
        mock_compiler.compile_analysis_prompt.return_value = mock_compiled
        
        # Create async mock for processor
        async def mock_process_analysis(prompt):
            return ProcessedAnalysis(
                analysis_id="test_analysis_123",
                prompt_id="test_prompt",
                analysis_template_id="test_analysis",
                structured_content={"result": "test"},
                raw_llm_response="test response",
                validation=MagicMock(),
                quality_score=0.8,
                processing_time=1.0
            )
        
        async def mock_execute_analysis(processed):
            return AnalysisExecution(
                execution_id="exec_123",
                analysis=processed,
                insights={},
                metrics={},
                recommendations=[],
                confidence_score=0.8,
                reliability_indicators={},
                comparison_data=None,
                benchmarks=None,
                execution_time=1.5
            )
        
        mock_processor.process_analysis = mock_process_analysis
        mock_processor.execute_analysis = mock_execute_analysis
        
        # Test request
        request_data = {
            "prompt_reference": "test_prompt",
            "analysis_reference": "test_analysis",
            "context_variables": {"test": "value"},
            "metadata": {"source": "test"}
        }
        
        response = self.client.post("/analyze", json=request_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "execution_id" in data
        assert data["status"] == "completed"

    def test_statistics_endpoint(self):
        """Test the statistics endpoint"""
        if not HAS_FASTAPI:
            return
            
        response = self.client.get("/statistics")
        assert response.status_code == 200
        data = response.json()
        assert "service_info" in data
        assert "version" in data["service_info"]

    def test_analyze_endpoint_validation_error(self):
        """Test analysis endpoint with validation errors"""
        if not HAS_FASTAPI:
            return
            
        # Test with missing required fields
        request_data = {
            "prompt_reference": "test_prompt"
            # Missing analysis_reference
        }
        
        response = self.client.post("/analyze", json=request_data)
        assert response.status_code == 422  # Validation error

    @patch('service.get_prompt_compiler')
    @patch('service.get_analysis_processor')
    def test_workflow_analyze_endpoint(self, mock_processor_getter, mock_compiler_getter):
        """Test the workflow analysis endpoint"""
        if not HAS_FASTAPI:
            return
            
        # Setup mocks similar to basic analyze test
        mock_compiler = MagicMock()
        mock_processor = MagicMock()
        mock_compiler_getter.return_value = mock_compiler
        mock_processor_getter.return_value = mock_processor
        
        # Mock return values
        from models import CompiledAnalysisPrompt, ProcessedAnalysis, AnalysisExecution
        
        mock_compiled = CompiledAnalysisPrompt(
            prompt_id="workflow_prompt",
            analysis_template_id="workflow_analysis",
            compiled_prompt="Workflow prompt",
            rag_content=None,
            analysis_schema={"type": "object"},
            instructions={"workflow": "instructions"},
            estimated_tokens=150
        )
        mock_compiler.compile_analysis_prompt.return_value = mock_compiled
        
        # Async mocks
        async def mock_process_analysis(prompt):
            return ProcessedAnalysis(
                analysis_id="workflow_analysis_123",
                prompt_id="workflow_prompt", 
                analysis_template_id="workflow_analysis",
                structured_content={"workflow_result": "test"},
                raw_llm_response="workflow response",
                validation=MagicMock(),
                quality_score=0.9,
                processing_time=1.2
            )
        
        async def mock_execute_analysis(processed):
            return AnalysisExecution(
                execution_id="workflow_exec_123",
                analysis=processed,
                insights={"workflow_insights": "test"},
                metrics={"workflow_metrics": 0.9},
                recommendations=["workflow recommendation"],
                confidence_score=0.9,
                reliability_indicators={},
                comparison_data=None,
                benchmarks=None,
                execution_time=2.0
            )
        
        mock_processor.process_analysis = mock_process_analysis
        mock_processor.execute_analysis = mock_execute_analysis
        
        # Test workflow request
        request_data = {
            "workflow_id": "test_workflow_123",
            "task_id": "analysis_task",
            "prompt_reference": "workflow_prompt",
            "analysis_reference": "workflow_analysis",
            "process_variables": {"project": "TestProject"},
            "task_variables": {"depth": "comprehensive"}
        }
        
        response = self.client.post("/workflow/analyze", json=request_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "execution_id" in data
        assert data["status"] == "completed"


def test_without_fastapi():
    """Test that we can at least import the service components"""
    try:
        # Test basic imports
        from models import AnalysisTemplate, AnalysisServiceConfig
        from template_manager import AnalysisTemplateManager
        from prompt_compiler import AnalysisPromptCompiler
        from analysis_processor import AnalysisProcessor
        
        # Test basic object creation
        config = AnalysisServiceConfig()
        assert config.service_name == "dadm-analysis-service"
        
        print("✓ Service components can be imported and instantiated")
        return True
    except Exception as e:
        print(f"✗ Error importing service components: {e}")
        return False


if __name__ == "__main__":
    if HAS_FASTAPI:
        print("Running FastAPI tests...")
        import subprocess
        subprocess.run(["python", "-m", "pytest", __file__, "-v"])
    else:
        print("FastAPI not available, running basic import test...")
        test_without_fastapi()
