"""
Tests for Analysis Prompt Compiler
"""

import json
import os
import sys
from unittest.mock import patch, MagicMock

# Add the parent directory to the path to import the analysis service
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from prompt_compiler import AnalysisPromptCompiler
from template_manager import AnalysisTemplateManager
from models import AnalysisRequest, AnalysisServiceConfig


class TestAnalysisPromptCompiler:
    """Test cases for AnalysisPromptCompiler"""

    def test_init(self, temp_template_file):
        """Test prompt compiler initialization"""
        config = AnalysisServiceConfig()
        manager = AnalysisTemplateManager(temp_template_file)
        
        compiler = AnalysisPromptCompiler(config, manager)
        
        assert compiler.config == config
        assert compiler.template_manager == manager
        assert compiler.prompt_service_url == config.prompt_service_url

    @patch('prompt_compiler.requests.post')
    def test_get_base_prompt_success(self, mock_post, temp_template_file, mock_prompt_service_response):
        """Test successful base prompt retrieval"""
        # Setup
        config = AnalysisServiceConfig()
        manager = AnalysisTemplateManager(temp_template_file)
        compiler = AnalysisPromptCompiler(config, manager)
        
        # Mock the prompt service response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_prompt_service_response
        mock_post.return_value = mock_response
        
        # Test
        result = compiler._get_base_prompt("test_prompt", {"var1": "value1"}, True)
        
        # Assertions
        assert result["prompt_id"] == "test_business_strategy"
        assert "compiled_prompt" in result
        assert "rag_content" in result
        mock_post.assert_called_once()

    @patch('prompt_compiler.requests.post')
    def test_get_base_prompt_failure(self, mock_post, temp_template_file):
        """Test base prompt retrieval failure"""
        # Setup
        config = AnalysisServiceConfig()
        manager = AnalysisTemplateManager(temp_template_file)
        compiler = AnalysisPromptCompiler(config, manager)
        
        # Mock failed response
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_response.text = "Prompt not found"
        mock_post.return_value = mock_response
        
        # Test - should raise exception
        try:
            compiler._get_base_prompt("nonexistent_prompt", {}, False)
            assert False, "Should have raised exception"
        except Exception as e:
            assert "Failed to get base prompt" in str(e)

    def test_compile_analysis_prompt_success(self, temp_template_file, sample_analysis_request):
        """Test successful prompt compilation with analysis injection"""
        # Setup
        config = AnalysisServiceConfig()
        manager = AnalysisTemplateManager(temp_template_file)
        compiler = AnalysisPromptCompiler(config, manager)
        
        # Mock the base prompt retrieval
        with patch.object(compiler, '_get_base_prompt') as mock_get_prompt:
            mock_get_prompt.return_value = {
                "prompt_id": "test_business_strategy",
                "compiled_prompt": "Analyze business strategy for {company}",
                "rag_content": {"docs": "sample content"},
                "variables": {"company": "TestCorp"}
            }
            
            # Create request
            request = AnalysisRequest(**sample_analysis_request)
            
            # Test compilation
            compiled = compiler.compile_analysis_prompt(request)
            
            # Assertions
            assert compiled.prompt_id == request.prompt_id
            assert compiled.analysis_template_id == request.analysis_template_id
            assert len(compiled.compiled_prompt) > 0
            assert "ANALYSIS INSTRUCTIONS" in compiled.compiled_prompt
            assert compiled.analysis_schema is not None
            assert compiled.instructions is not None

    def test_compile_analysis_prompt_template_not_found(self, temp_template_file, sample_analysis_request):
        """Test compilation with non-existent analysis template"""
        # Setup
        config = AnalysisServiceConfig()
        manager = AnalysisTemplateManager(temp_template_file)
        compiler = AnalysisPromptCompiler(config, manager)
        
        # Mock the base prompt retrieval
        with patch.object(compiler, '_get_base_prompt') as mock_get_prompt:
            mock_get_prompt.return_value = {
                "prompt_id": "test_prompt",
                "compiled_prompt": "Base prompt",
                "rag_content": {},
                "variables": {}
            }
            
            # Create request with invalid template
            request_data = sample_analysis_request.copy()
            request_data["analysis_template_id"] = "nonexistent_template"
            request = AnalysisRequest(**request_data)
            
            # Test - should raise exception
            try:
                compiler.compile_analysis_prompt(request)
                assert False, "Should have raised ValueError"
            except ValueError as e:
                assert "Analysis template not found" in str(e)

    def test_compile_complete_prompt(self, temp_template_file):
        """Test complete prompt compilation"""
        # Setup
        config = AnalysisServiceConfig()
        manager = AnalysisTemplateManager(temp_template_file)
        compiler = AnalysisPromptCompiler(config, manager)
        
        # Test data
        base_prompt_data = {
            "compiled_prompt": "Original prompt content for {company}",
            "variables": {"company": "TestCorp"}
        }
        template = manager.get_template("test_decision_analysis")
        assert template is not None, "Template should exist"
        instructions = manager.generate_analysis_instructions("test_decision_analysis")
        
        # Test compilation
        compiled_prompt = compiler._compile_complete_prompt(base_prompt_data, template, instructions)
        
        # Assertions
        assert "TestCorp" in compiled_prompt  # Variable substitution
        assert "Original prompt content" in compiled_prompt
        assert "ANALYSIS INSTRUCTIONS" in compiled_prompt
        assert len(compiled_prompt) > len(base_prompt_data["compiled_prompt"])

    def test_estimate_tokens(self, temp_template_file):
        """Test token estimation"""
        # Setup
        config = AnalysisServiceConfig()
        manager = AnalysisTemplateManager(temp_template_file)
        compiler = AnalysisPromptCompiler(config, manager)
        
        # Test with various prompts
        short_prompt = "Short prompt"
        long_prompt = "This is a much longer prompt " * 100
        
        short_tokens = compiler._estimate_tokens(short_prompt)
        long_tokens = compiler._estimate_tokens(long_prompt)
        
        # Assertions
        assert isinstance(short_tokens, int)
        assert isinstance(long_tokens, int)
        assert long_tokens > short_tokens
        assert short_tokens > 0

    def test_end_to_end_compilation(self, temp_template_file, sample_analysis_request):
        """Test complete end-to-end prompt compilation"""
        # Setup
        config = AnalysisServiceConfig()
        manager = AnalysisTemplateManager(temp_template_file)
        compiler = AnalysisPromptCompiler(config, manager)
        
        # Mock the prompt service call
        with patch('prompt_compiler.requests.post') as mock_post:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "prompt_id": "test_business_strategy",
                "compiled_prompt": "Analyze the business decision for {company} with budget ${budget}",
                "rag_content": {"context": "Business analysis context"},
                "variables": sample_analysis_request["variables"]
            }
            mock_post.return_value = mock_response
            
            # Create request
            request = AnalysisRequest(**sample_analysis_request)
            
            # Compile prompt
            compiled = compiler.compile_analysis_prompt(request)
            
            # Comprehensive assertions
            assert compiled.prompt_id == request.prompt_id
            assert compiled.analysis_template_id == request.analysis_template_id
            
            # Check that the prompt contains all expected elements
            assert "TestCorp" in compiled.compiled_prompt  # Variable substitution
            assert "100000" in compiled.compiled_prompt    # Budget variable
            assert "ANALYSIS INSTRUCTIONS" in compiled.compiled_prompt
            assert "decision_context" in compiled.compiled_prompt  # Schema elements
            
            # Check schema and instructions
            assert "decision_context" in compiled.analysis_schema["properties"]
            assert "alternatives" in compiled.analysis_schema["properties"]
            assert "recommendation" in compiled.analysis_schema["properties"]
            
            # Check metadata
            assert compiled.compilation_timestamp is not None
            assert compiled.estimated_tokens is not None
            assert compiled.estimated_tokens > 0


if __name__ == "__main__":
    # Run tests if executed directly
    import subprocess
    subprocess.run(["python", "-m", "pytest", __file__, "-v"])
