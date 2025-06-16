"""
Tests for Analysis Processor
"""

import os
import sys
import asyncio
from unittest.mock import patch, MagicMock, AsyncMock

# Add the parent directory to the path to import the analysis service
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from analysis_processor import AnalysisProcessor
from template_manager import AnalysisTemplateManager
from models import (
    AnalysisServiceConfig, CompiledAnalysisPrompt, LLMResponse, 
    ProcessedAnalysis, AnalysisExecution
)


class TestAnalysisProcessor:
    """Test cases for AnalysisProcessor"""

    def test_init(self, temp_template_file):
        """Test analysis processor initialization"""
        config = AnalysisServiceConfig()
        manager = AnalysisTemplateManager(temp_template_file)
        
        processor = AnalysisProcessor(config, manager)
        
        assert processor.config == config
        assert processor.template_manager == manager

    async def test_process_analysis_success(self, temp_template_file, expected_llm_response):
        """Test successful analysis processing"""
        # Setup
        config = AnalysisServiceConfig()
        manager = AnalysisTemplateManager(temp_template_file)
        processor = AnalysisProcessor(config, manager)
        
        # Create compiled prompt
        compiled_prompt = CompiledAnalysisPrompt(
            prompt_id="test_prompt",
            analysis_template_id="test_decision_analysis",
            compiled_prompt="Test prompt with analysis instructions",
            analysis_schema={"type": "object"},
            instructions={"analysis_type": "decision"}
        )
        
        # Mock LLM response
        with patch.object(processor, '_send_to_llm') as mock_llm:
            mock_llm.return_value = LLMResponse(
                content=str(expected_llm_response),
                model="gpt-4",
                tokens_used=500,
                finish_reason="stop",
                response_time=1.5
            )
            
            # Process analysis
            result = await processor.process_analysis(compiled_prompt)
            
            # Assertions
            assert isinstance(result, ProcessedAnalysis)
            assert result.llm_response is not None
            assert result.validation is not None
            assert result.parsed_analysis is not None

    async def test_process_analysis_with_simulation(self, temp_template_file):
        """Test analysis processing with LLM simulation"""
        # Setup with simulation enabled
        config = AnalysisServiceConfig()
        manager = AnalysisTemplateManager(temp_template_file)
        processor = AnalysisProcessor(config, manager)
        
        # Create compiled prompt
        compiled_prompt = CompiledAnalysisPrompt(
            prompt_id="test_prompt",
            analysis_template_id="test_decision_analysis",
            compiled_prompt="Test prompt with decision analysis",
            analysis_schema={"type": "object"},
            instructions={"analysis_type": "decision"}
        )
        
        # Process with simulation (default behavior)
        result = await processor.process_analysis(compiled_prompt)
        
        # Assertions
        assert isinstance(result, ProcessedAnalysis)
        assert result.llm_response is not None
        assert "simulation" in result.llm_response.model.lower()
        assert result.validation is not None
        assert result.parsed_analysis is not None

    async def test_execute_analysis_success(self, temp_template_file, expected_llm_response):
        """Test full analysis execution with insights and metrics"""
        # Setup
        config = AnalysisServiceConfig()
        manager = AnalysisTemplateManager(temp_template_file)
        processor = AnalysisProcessor(config, manager)
        
        # Create processed analysis
        compiled_prompt = CompiledAnalysisPrompt(
            prompt_id="test_prompt",
            analysis_template_id="test_decision_analysis",
            compiled_prompt="Test prompt",
            analysis_schema={"type": "object"},
            instructions={"analysis_type": "decision"}
        )
        
        # Mock LLM and get processed analysis
        with patch.object(processor, '_send_to_llm') as mock_llm:
            mock_llm.return_value = LLMResponse(
                content=str(expected_llm_response),
                model="gpt-4",
                tokens_used=500,
                finish_reason="stop",
                response_time=1.5
            )
            
            processed_analysis = await processor.process_analysis(compiled_prompt)
            
            # Execute full analysis
            execution = await processor.execute_analysis(processed_analysis)
            
            # Assertions
            assert isinstance(execution, AnalysisExecution)
            assert execution.execution_id is not None
            assert execution.analysis == processed_analysis
            assert execution.insights is not None
            assert execution.metrics is not None
            assert execution.recommendations is not None
            assert 0 <= execution.confidence_score <= 1
            assert execution.execution_time > 0

    async def test_validate_response_valid(self, temp_template_file, expected_llm_response):
        """Test response validation with valid data"""
        # Setup
        config = AnalysisServiceConfig()
        manager = AnalysisTemplateManager(temp_template_file)
        processor = AnalysisProcessor(config, manager)
        
        # Get template schema
        template = manager.get_template("test_decision_analysis")
        assert template is not None
        
        # Test validation
        validation = processor._validate_response(str(expected_llm_response), template.schema)
        
        # Assertions
        assert validation.is_valid
        assert validation.schema_compliance == 1.0
        assert len(validation.validation_errors) == 0

    async def test_validate_response_invalid(self, temp_template_file):
        """Test response validation with invalid data"""
        # Setup
        config = AnalysisServiceConfig()
        manager = AnalysisTemplateManager(temp_template_file)
        processor = AnalysisProcessor(config, manager)
        
        # Get template schema
        template = manager.get_template("test_decision_analysis")
        assert template is not None
        
        # Invalid response (missing required fields)
        invalid_response = '{"decision_context": "some context"}'
        
        # Test validation
        validation = processor._validate_response(invalid_response, template.schema)
        
        # Assertions
        assert not validation.is_valid
        assert validation.schema_compliance < 1.0
        assert len(validation.validation_errors) > 0

    async def test_parse_llm_response_json(self, temp_template_file, expected_llm_response):
        """Test parsing JSON LLM response"""
        # Setup
        config = AnalysisServiceConfig()
        manager = AnalysisTemplateManager(temp_template_file)
        processor = AnalysisProcessor(config, manager)
        
        # Test JSON parsing
        json_response = str(expected_llm_response)
        parsed = processor._parse_llm_response(json_response)
        
        # Assertions
        assert isinstance(parsed, dict)
        assert "decision_context" in parsed
        assert "alternatives" in parsed
        assert "recommendation" in parsed

    async def test_parse_llm_response_with_markdown(self, temp_template_file):
        """Test parsing LLM response with markdown formatting"""
        # Setup
        config = AnalysisServiceConfig()
        manager = AnalysisTemplateManager(temp_template_file)
        processor = AnalysisProcessor(config, manager)
        
        # Response with markdown formatting
        markdown_response = '''
        Here's my analysis:
        
        ```json
        {
            "decision_context": "Test context",
            "alternatives": ["Option A", "Option B"],
            "recommendation": {
                "chosen_alternative": "Option A",
                "reasoning": "Best choice",
                "confidence": 0.9
            }
        }
        ```
        '''
        
        # Test parsing
        parsed = processor._parse_llm_response(markdown_response)
        
        # Assertions
        assert isinstance(parsed, dict)
        assert parsed["decision_context"] == "Test context"
        assert len(parsed["alternatives"]) == 2

    async def test_extract_insights(self, temp_template_file, expected_llm_response):
        """Test insight extraction from analysis"""
        # Setup
        config = AnalysisServiceConfig()
        manager = AnalysisTemplateManager(temp_template_file)
        processor = AnalysisProcessor(config, manager)
        
        # Test insight extraction
        insights = processor._extract_insights(expected_llm_response, "test_decision_analysis")
        
        # Assertions
        assert isinstance(insights, dict)
        assert "key_factors" in insights or "analysis_type" in insights
        assert len(insights) > 0

    async def test_compute_metrics(self, temp_template_file, expected_llm_response):
        """Test metrics computation"""
        # Setup
        config = AnalysisServiceConfig()
        manager = AnalysisTemplateManager(temp_template_file)
        processor = AnalysisProcessor(config, manager)
        
        # Create mock validation
        mock_validation = MagicMock()
        mock_validation.is_valid = True
        mock_validation.schema_compliance = 0.95
        
        # Test metrics computation
        metrics = processor._compute_metrics(expected_llm_response, mock_validation)
        
        # Assertions
        assert isinstance(metrics, dict)
        assert "schema_compliance" in metrics
        assert "confidence_indicators" in metrics
        assert metrics["schema_compliance"] == 0.95

    async def test_generate_recommendations(self, temp_template_file, expected_llm_response):
        """Test recommendation generation"""
        # Setup
        config = AnalysisServiceConfig()
        manager = AnalysisTemplateManager(temp_template_file)
        processor = AnalysisProcessor(config, manager)
        
        # Test recommendation generation
        recommendations = processor._generate_recommendations(
            expected_llm_response, 
            "test_decision_analysis"
        )
        
        # Assertions
        assert isinstance(recommendations, list)
        assert len(recommendations) > 0
        assert all(isinstance(rec, str) for rec in recommendations)

    async def test_simulate_llm_response_decision(self, temp_template_file):
        """Test LLM response simulation for decision analysis"""
        # Setup
        config = AnalysisServiceConfig()
        manager = AnalysisTemplateManager(temp_template_file)
        processor = AnalysisProcessor(config, manager)
        
        # Test simulation
        compiled_prompt = CompiledAnalysisPrompt(
            prompt_id="test_prompt",
            analysis_template_id="test_decision_analysis",
            compiled_prompt="Decision analysis prompt",
            analysis_schema={"type": "object"},
            instructions={"analysis_type": "decision"}
        )
        
        response = processor._simulate_llm_response(compiled_prompt)
        
        # Assertions
        assert isinstance(response, str)
        assert len(response) > 0
        
        # Try to parse as JSON
        import json
        try:
            parsed = json.loads(response)
            assert isinstance(parsed, dict)
            # Should contain decision analysis fields
            assert any(key in parsed for key in ["decision_context", "alternatives", "recommendation"])
        except json.JSONDecodeError:
            # If not JSON, should still be meaningful content
            assert "decision" in response.lower() or "analysis" in response.lower()

    async def test_error_handling_invalid_template(self, temp_template_file):
        """Test error handling with invalid template"""
        # Setup
        config = AnalysisServiceConfig()
        manager = AnalysisTemplateManager(temp_template_file)
        processor = AnalysisProcessor(config, manager)
        
        # Create compiled prompt with invalid template
        compiled_prompt = CompiledAnalysisPrompt(
            prompt_id="test_prompt",
            analysis_template_id="nonexistent_template",
            compiled_prompt="Test prompt",
            analysis_schema={"type": "object"},
            instructions={}
        )
        
        # Should handle gracefully
        try:
            result = await processor.process_analysis(compiled_prompt)
            # Should still return a result, possibly with errors noted
            assert isinstance(result, ProcessedAnalysis)
        except Exception as e:
            # Or raise a meaningful exception
            assert "template" in str(e).lower()


def run_async_test(coro):
    """Helper to run async tests"""
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(coro)


if __name__ == "__main__":
    # Run tests if executed directly
    import subprocess
    subprocess.run(["python", "-m", "pytest", __file__, "-v"])
