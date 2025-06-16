"""
Tests for Analysis Template Manager
"""

import json
import tempfile
import os
import pytest
from unittest.mock import patch, MagicMock

# Add the parent directory to the path to import the analysis service
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from template_manager import AnalysisTemplateManager
from models import AnalysisTemplate


class TestAnalysisTemplateManager:
    """Test cases for AnalysisTemplateManager"""

    def test_load_templates_success(self, temp_template_file):
        """Test successful template loading"""
        manager = AnalysisTemplateManager(temp_template_file)
        
        assert len(manager.templates) == 2
        assert "test_decision_analysis" in manager.templates
        assert "test_risk_analysis" in manager.templates
        
        # Check template structure
        decision_template = manager.templates["test_decision_analysis"]
        assert decision_template.name == "Test Decision Analysis"
        assert decision_template.category.value == "decision_support"

    def test_load_templates_file_not_found(self):
        """Test handling of missing template file"""
        with pytest.raises(FileNotFoundError):
            AnalysisTemplateManager("nonexistent_file.json")

    def test_load_templates_invalid_json(self):
        """Test handling of invalid JSON"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            f.write("invalid json content")
            temp_file = f.name
        
        try:
            with pytest.raises(json.JSONDecodeError):
                AnalysisTemplateManager(temp_file)
        finally:
            os.unlink(temp_file)

    def test_get_template_exists(self, temp_template_file):
        """Test retrieving existing template"""
        manager = AnalysisTemplateManager(temp_template_file)
        
        template = manager.get_template("test_decision_analysis")
        assert template is not None
        assert template.id == "test_decision_analysis"
        assert template.name == "Test Decision Analysis"

    def test_get_template_not_exists(self, temp_template_file):
        """Test retrieving non-existent template"""
        manager = AnalysisTemplateManager(temp_template_file)
        
        template = manager.get_template("nonexistent_template")
        assert template is None

    def test_list_templates(self, temp_template_file):
        """Test listing all templates"""
        manager = AnalysisTemplateManager(temp_template_file)
        
        template_list = manager.list_templates()
        assert len(template_list) == 2
        
        # Check that we get template objects
        template_ids = [t.id for t in template_list]
        assert "test_decision_analysis" in template_ids
        assert "test_risk_analysis" in template_ids

    def test_search_templates_by_category(self, temp_template_file):
        """Test searching templates by category"""
        from models import AnalysisCategory
        
        manager = AnalysisTemplateManager(temp_template_file)
        
        decision_templates = manager.search_templates("decision", category=AnalysisCategory.DECISION_SUPPORT)
        assert len(decision_templates) >= 1
        
        risk_templates = manager.search_templates("risk", category=AnalysisCategory.RISK_MANAGEMENT)
        assert len(risk_templates) >= 1

    def test_search_templates_by_name(self, temp_template_file):
        """Test searching templates by name"""
        manager = AnalysisTemplateManager(temp_template_file)
        
        templates = manager.search_templates("Decision")
        assert len(templates) >= 1

    def test_validate_schema_valid(self, temp_template_file, expected_llm_response):
        """Test schema validation with valid data"""
        manager = AnalysisTemplateManager(temp_template_file)
        
        validation = manager.validate_template_output(
            "test_decision_analysis", 
            expected_llm_response
        )
        
        assert validation["is_valid"]
        assert validation["score"] == 1.0
        assert len(validation["errors"]) == 0

    def test_validate_schema_invalid(self, temp_template_file):
        """Test schema validation with invalid data"""
        manager = AnalysisTemplateManager(temp_template_file)
        
        invalid_data = {
            "decision_context": "Some context",
            "alternatives": ["A", "B"],
            # Missing required 'recommendation' field
        }
        
        validation = manager.validate_template_output(
            "test_decision_analysis",
            invalid_data
        )
        
        assert not validation["is_valid"]
        assert validation["score"] < 1.0
        assert len(validation["errors"]) > 0

    def test_generate_analysis_instructions(self, temp_template_file):
        """Test analysis instruction generation"""
        manager = AnalysisTemplateManager(temp_template_file)
        
        instructions = manager.generate_analysis_instructions("test_decision_analysis")
        
        # Instructions should be a string
        assert isinstance(instructions, str)
        assert len(instructions) > 0
        assert "decision" in instructions.lower()

    def test_get_statistics(self, temp_template_file):
        """Test statistics generation"""
        manager = AnalysisTemplateManager(temp_template_file)
        
        # Perform some operations to generate stats
        manager.get_template("test_decision_analysis")
        manager.search_templates("decision")
        
        stats = manager.get_statistics()
        
        assert "total_templates" in stats
        assert "templates_by_category" in stats
        assert stats["total_templates"] == 2

    def test_template_model_validation(self):
        """Test that AnalysisTemplate model validates correctly"""
        # Valid template data
        valid_data = {
            "id": "test_template",
            "name": "Test Template",
            "description": "Test description",
            "category": "decision_support",
            "schema": {"type": "object"},
            "instructions": {"analysis_type": "test"}
        }
        
        template = AnalysisTemplate(**valid_data)
        assert template.id == "test_template"
        assert template.category.value == "decision_support"

    def test_concurrent_access(self, temp_template_file):
        """Test concurrent access to template manager"""
        import threading
        import time
        
        manager = AnalysisTemplateManager(temp_template_file)
        results = []
        
        def access_templates():
            template = manager.get_template("test_decision_analysis")
            results.append(template is not None)
            time.sleep(0.1)  # Simulate some processing
            templates = manager.list_templates()
            results.append(len(templates) == 2)
        
        # Create multiple threads
        threads = [threading.Thread(target=access_templates) for _ in range(5)]
        
        # Start all threads
        for thread in threads:
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # All operations should have succeeded
        assert all(results)
        assert len(results) == 10  # 2 results per thread, 5 threads


if __name__ == "__main__":
    # Run tests if executed directly
    import subprocess
    subprocess.run(["python", "-m", "pytest", __file__, "-v"])
