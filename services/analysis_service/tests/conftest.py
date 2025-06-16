"""
Test configuration and fixtures for analysis service tests
"""

import os
import json
import tempfile
import pytest
from typing import Dict, Any

# Test data for analysis templates
TEST_ANALYSIS_TEMPLATES = {
    "templates": [
        {
            "id": "test_decision_analysis",
            "name": "Test Decision Analysis",
            "description": "Test template for decision analysis",
            "version": "1.0",
            "category": "decision_support",
            "output_format": "json",
            "schema": {
                "type": "object",
                "required": ["decision_context", "alternatives", "recommendation"],
                "properties": {
                    "decision_context": {
                        "type": "string",
                        "description": "Context of the decision"
                    },
                    "alternatives": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Available alternatives"
                    },
                    "recommendation": {
                        "type": "object",
                        "properties": {
                            "chosen_alternative": {"type": "string"},
                            "reasoning": {"type": "string"},
                            "confidence": {"type": "number", "minimum": 0, "maximum": 1}
                        },
                        "required": ["chosen_alternative", "reasoning", "confidence"]
                    }
                }
            },
            "instructions": {
                "analysis_type": "decision_analysis",
                "output_requirements": [
                    "Analyze the decision context thoroughly",
                    "Evaluate each alternative objectively", 
                    "Provide clear reasoning for the recommendation",
                    "Include confidence score"
                ],
                "format_guidelines": {
                    "structure": "json",
                    "required_sections": ["decision_context", "alternatives", "recommendation"]
                }
            },
            "example_output": {
                "decision_context": "Choosing technology stack for new project",
                "alternatives": ["React", "Vue", "Angular"],
                "recommendation": {
                    "chosen_alternative": "React",
                    "reasoning": "Large community, extensive ecosystem, team familiarity",
                    "confidence": 0.85
                }
            }
        },
        {
            "id": "test_risk_analysis",
            "name": "Test Risk Analysis", 
            "description": "Test template for risk analysis",
            "version": "1.0",
            "category": "risk_management",
            "output_format": "json",
            "schema": {
                "type": "object",
                "required": ["identified_risks", "risk_assessment", "mitigation_plan"],
                "properties": {
                    "identified_risks": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "risk_id": {"type": "string"},
                                "description": {"type": "string"},
                                "category": {"type": "string"}
                            }
                        }
                    },
                    "risk_assessment": {
                        "type": "object",
                        "properties": {
                            "overall_risk_level": {"type": "string"},
                            "high_priority_risks": {"type": "array"}
                        }
                    },
                    "mitigation_plan": {
                        "type": "object",
                        "properties": {
                            "immediate_actions": {"type": "array"},
                            "long_term_strategies": {"type": "array"}
                        }
                    }
                }
            },
            "instructions": {
                "analysis_type": "risk_analysis",
                "output_requirements": [
                    "Identify all potential risks",
                    "Assess probability and impact",
                    "Prioritize risks by severity",
                    "Develop mitigation strategies"
                ]
            }
        }
    ]
}

# Sample test requests
TEST_ANALYSIS_REQUEST = {
    "prompt_id": "test_business_strategy",
    "analysis_template_id": "test_decision_analysis", 
    "variables": {
        "company": "TestCorp",
        "decision": "technology_selection",
        "budget": 100000
    },
    "context_data": {
        "industry": "technology",
        "team_size": 10
    },
    "max_tokens": 1000,
    "temperature": 0.3
}

TEST_WORKFLOW_REQUEST = {
    "workflow_id": "test_workflow_123",
    "task_id": "analysis_task_1",
    "prompt_reference": "business_strategy_prompt",
    "analysis_reference": "test_decision_analysis",
    "process_variables": {
        "project_name": "TestProject",
        "deadline": "2024-12-31"
    },
    "task_variables": {
        "analysis_depth": "comprehensive"
    }
}

# Expected LLM response that matches the test schema
TEST_LLM_RESPONSE = {
    "decision_context": "TestCorp needs to select a technology stack for their new project with a budget of $100,000",
    "alternatives": ["React with Node.js", "Vue with Express", "Angular with .NET"],
    "recommendation": {
        "chosen_alternative": "React with Node.js",
        "reasoning": "Best balance of team expertise, community support, and development speed within budget constraints",
        "confidence": 0.82
    }
}

@pytest.fixture
def temp_template_file():
    """Create a temporary template file for testing"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(TEST_ANALYSIS_TEMPLATES, f, indent=2)
        temp_file = f.name
    
    yield temp_file
    
    # Cleanup
    if os.path.exists(temp_file):
        os.unlink(temp_file)

@pytest.fixture
def sample_analysis_request():
    """Sample analysis request for testing"""
    return TEST_ANALYSIS_REQUEST.copy()

@pytest.fixture
def sample_workflow_request():
    """Sample workflow request for testing"""
    return TEST_WORKFLOW_REQUEST.copy()

@pytest.fixture
def expected_llm_response():
    """Expected LLM response for testing"""
    return TEST_LLM_RESPONSE.copy()

@pytest.fixture 
def mock_prompt_service_response():
    """Mock response from prompt service"""
    return {
        "prompt_id": "test_business_strategy",
        "compiled_prompt": "Analyze the business strategy decision for {company}. Consider the budget of ${budget} and team size of {team_size}.",
        "rag_content": {
            "relevant_docs": "Sample business strategy documentation",
            "context": "Technology selection best practices"
        },
        "variables": {
            "company": "TestCorp",
            "budget": 100000,
            "team_size": 10
        },
        "metadata": {
            "template_version": "1.0",
            "compilation_time": "2024-01-15T10:30:00Z"
        }
    }
