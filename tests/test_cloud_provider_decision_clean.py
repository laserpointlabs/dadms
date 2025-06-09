"""
Test cases for the Cloud Provider Decision workflow
"""
import os
import sys
import unittest
from unittest.mock import MagicMock, patch
import json
import time

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from src.enhanced_service_orchestrator import EnhancedServiceOrchestrator

class TestCloudProviderDecisionProcess(unittest.TestCase):
    """Test cases for the Cloud Provider Decision workflow"""
    
    def setUp(self):
        """Set up test environment"""
        # Mock the service registry for testing
        self.service_registry = {
            'assistant': {
                'openai': {
                    'endpoint': 'http://test-openai-service:5000'
                }
            }
        }
        
        # Create the orchestrator instance
        self.orchestrator = EnhancedServiceOrchestrator(self.service_registry)
    
    def test_full_process_flow(self):
        """Test the entire process flow from start to finish."""
        # Create a mock response for the service request
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "result": {
                "decision": "AWS with Multi-Cloud Strategy",
                "criteria": "Cost, Reliability, Scalability",
                "scores": {
                    "AWS": 85,
                    "Azure": 75,
                    "GCP": 80
                }
            }
        }
        
        # Process a full decision workflow
        with patch('requests.post', return_value=mock_response):
            # Define a test decision problem
            input_data = {
                "problem": "Select the best cloud provider for our new application",
                "requirements": "High reliability, cost-effective, scalable",
                "constraints": "Budget constraints, security requirements"
            }
            
            # Run the full process
            result = self.run_decision_process(input_data)
            
            # Verify the process ran successfully and returned expected data
            self.assertIsNotNone(result)
            self.assertIn("recommendation", result)
            self.assertIn("details", result)
            
            # Check that recommendation has expected data
            recommended_provider = result.get("recommendation", {}).get("provider", "")
            self.assertIsNotNone(recommended_provider)
            self.assertNotEqual(recommended_provider, "")
            
            # Check for highest scoring provider
            highest_score = 0
            highest_provider = None
            output_text = result.get("details", "")
            
            # Parse the output to find the highest scored provider
            for line in output_text.split('\n'):
                if "Weighted Score" in line and "AWS" in line:
                    try:
                        score = float(line.split(":")[-1].strip())
                        if score > highest_score:
                            highest_score = score
                            highest_provider = "AWS"
                    except ValueError:
                        pass
                elif "Weighted Score" in line and "Azure" in line:
                    try:
                        score = float(line.split(":")[-1].strip())
                        if score > highest_score:
                            highest_score = score
                            highest_provider = "Azure"
                    except ValueError:
                        pass
                elif "Weighted Score" in line and "GCP" in line:
                    try:
                        score = float(line.split(":")[-1].strip())
                        if score > highest_score:
                            highest_score = score
                            highest_provider = "GCP"
                    except ValueError:
                        pass
            
            print(f"Highest scored provider: {highest_provider} with score {highest_score}")
            
            # Verify the recommended provider matches or includes the highest scored provider
            if highest_provider is not None and recommended_provider is not None:
                self.assertTrue(
                    highest_provider in recommended_provider,
                    f"Recommended provider '{recommended_provider}' doesn't match highest scored provider '{highest_provider}'"
                )
            else:
                # If no highest provider was determined, just check that we have a recommendation
                self.assertTrue(
                    recommended_provider is not None and recommended_provider != "",
                    f"No valid recommendation was produced: '{recommended_provider}'"
                )
    
    def run_decision_process(self, input_data):
        """Run the cloud provider decision process with the given input data."""
        # Define task variables
        frame_variables = {
            "problem": {"value": input_data.get("problem", "")},
            "requirements": {"value": input_data.get("requirements", "")},
            "constraints": {"value": input_data.get("constraints", "")}
        }
        
        # Create mock tasks
        frame_task = MagicMock()
        frame_task.get_activity_id.return_value = "FrameDecisionTask"
        frame_task.get_process_instance_id.return_value = "test-process-123"
        frame_task.get_variables.return_value = frame_variables
        
        alternatives_task = MagicMock()
        alternatives_task.get_activity_id.return_value = "IdentifyAlternativesTask"
        alternatives_task.get_process_instance_id.return_value = "test-process-123"
        alternatives_task.get_variables.return_value = {}
        
        evaluate_task = MagicMock()
        evaluate_task.get_activity_id.return_value = "EvaluateAlternativesTask"
        evaluate_task.get_process_instance_id.return_value = "test-process-123"
        evaluate_task.get_variables.return_value = {}
        
        recommend_task = MagicMock()
        recommend_task.get_activity_id.return_value = "RecommendationTask"
        recommend_task.get_process_instance_id.return_value = "test-process-123"
        recommend_task.get_variables.return_value = {}
        
        # Process each task in order
        results = {}
        
        # Process the Frame Decision task
        frame_result = self.orchestrator.route_task(frame_task)
        results["FrameDecisionTask"] = frame_result
        
        # Update variables for next task with Frame Decision results
        alternatives_vars = {"FrameDecisionTask": {"value": frame_result.get("result", {})}}
        alternatives_task.get_variables.return_value = alternatives_vars
        
        # Process the Identify Alternatives task
        alternatives_result = self.orchestrator.route_task(alternatives_task)
        results["IdentifyAlternativesTask"] = alternatives_result
        
        # Update variables for next task with Identify Alternatives results
        evaluate_vars = {
            "FrameDecisionTask": {"value": frame_result.get("result", {})},
            "IdentifyAlternativesTask": {"value": alternatives_result.get("result", {})}
        }
        evaluate_task.get_variables.return_value = evaluate_vars
        
        # Process the Evaluate Alternatives task
        evaluate_result = self.orchestrator.route_task(evaluate_task)
        results["EvaluateAlternativesTask"] = evaluate_result
        
        # Update variables for next task with Evaluate Alternatives results
        recommend_vars = {
            "FrameDecisionTask": {"value": frame_result.get("result", {})},
            "IdentifyAlternativesTask": {"value": alternatives_result.get("result", {})},
            "EvaluateAlternativesTask": {"value": evaluate_result.get("result", {})}
        }
        recommend_task.get_variables.return_value = recommend_vars
        
        # Process the Recommendation task
        recommend_result = self.orchestrator.route_task(recommend_task)
        results["RecommendationTask"] = recommend_result
        
        # Compile the final results
        frame_result = results.get("FrameDecisionTask", {}).get("result", {})
        alternatives_result = results.get("IdentifyAlternativesTask", {}).get("result", {})
        evaluation_result = results.get("EvaluateAlternativesTask", {}).get("result", {})
        recommendation_result = results.get("RecommendationTask", {}).get("result", {})
        
        # Extract the recommended provider
        recommended_provider = None
        if recommendation_result and isinstance(recommendation_result, dict):
            recommended_provider = recommendation_result.get("recommendation", "")
        
        # Combine all outputs for the detailed report
        details = ""
        if frame_result:
            details += "== DECISION FRAME ==\n"
            details += json.dumps(frame_result, indent=2) + "\n\n"
        
        if alternatives_result:
            details += "== IDENTIFIED ALTERNATIVES ==\n"
            details += json.dumps(alternatives_result, indent=2) + "\n\n"
        
        if evaluation_result:
            details += "== EVALUATION RESULTS ==\n"
            details += json.dumps(evaluation_result, indent=2) + "\n\n"
        
        if recommendation_result:
            details += "== RECOMMENDATION ==\n"
            details += json.dumps(recommendation_result, indent=2) + "\n\n"
        
        return {
            "recommendation": {
                "provider": recommended_provider,
                "score": 0  # We don't have actual scores in this test
            },
            "details": details
        }

if __name__ == "__main__":
    unittest.main()
