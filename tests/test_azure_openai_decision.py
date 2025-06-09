"""
Test case for validating the OpenAI Decision Process workflow with Azure OpenAI Service.
This test focuses on real integration with Azure OpenAI endpoints following Azure best practices.
"""
import os
import sys
import unittest
import json
import time
import logging
import requests
from datetime import datetime
from unittest.mock import patch, MagicMock
import uuid

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from src import EnhancedServiceOrchestrator
from config import camunda_config
from camunda.external_task.external_task import ExternalTask

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class TestAzureOpenAIDecisionProcess(unittest.TestCase):
    """Test the OpenAI Decision Process workflow with Azure OpenAI Service integration."""
    
    def setUp(self):
        """Setup test environment with Azure OpenAI configuration."""
        # Check for Azure OpenAI credentials
        self.azure_endpoint = os.environ.get('AZURE_OPENAI_ENDPOINT')
        self.azure_api_key = os.environ.get('AZURE_OPENAI_API_KEY')
        self.azure_deployment = os.environ.get('AZURE_OPENAI_DEPLOYMENT', 'gpt-4')
        self.azure_api_version = os.environ.get('AZURE_OPENAI_API_VERSION', '2023-05-15')
        
        # Skip tests if Azure credentials are not available
        if not self.azure_endpoint or not self.azure_api_key:
            self.skipTest("Azure OpenAI credentials not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY environment variables.")
        
        # Create a service registry with Azure OpenAI
        self.service_registry = {
            "assistant": {
                "azure-openai": {
                    "endpoint": self.azure_endpoint,
                    "api_key": self.azure_api_key,
                    "deployment": self.azure_deployment,
                    "api_version": self.azure_api_version,
                    "service_type": "azure"
                }
            }
        }
        
        # Create an orchestrator with Azure-specific settings
        self.orchestrator = EnhancedServiceOrchestrator(
            service_registry=self.service_registry,
            debug=True,
            enable_metrics=True,
            retry_strategy={
                "max_retries": 3,
                "retry_delay": 1,  # Initial delay in seconds
                "backoff_factor": 2  # Exponential backoff
            }
        )
        
        # Store task outputs for validation
        self.task_outputs = {}
        
        # Initialize test context
        self.test_process_id = f"test-azure-{uuid.uuid4()}"
        
        logger.info("Test setup complete with Azure OpenAI configuration")
    
    def tearDown(self):
        """Clean up resources after tests."""
        if hasattr(self, 'orchestrator'):
            # Close any open connections and clean up resources
            self.orchestrator.close()
            
            # Log performance metrics
            metrics = self.orchestrator.get_metrics()
            logger.info("Test performance metrics: %s", json.dumps(metrics, indent=2))
            
            # Save metrics to file for later analysis
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            metrics_file = os.path.join(project_root, f"azure_test_metrics_{timestamp}.json")
            with open(metrics_file, 'w') as f:
                json.dump(metrics, f, indent=2)
                
            logger.info(f"Test metrics saved to {metrics_file}")
    
    def create_test_task(self, task_name, variables=None):
        """Create a test task for processing."""
        if variables is None:
            variables = {
                "decision_context": {
                    "value": "We need to evaluate Azure cloud services for a new enterprise application focused on AI workloads with requirements for high availability, scalability, and HIPAA compliance."
                }
            }
        
        # Create a mock Camunda task
        mock_task = MagicMock()
        mock_task.get_activity_id.return_value = task_name
        mock_task.get_process_instance_id.return_value = self.test_process_id
        mock_task.get_variables.return_value = variables
        
        return mock_task
    
    def test_connection_to_azure_openai(self):
        """Test basic connectivity to Azure OpenAI services."""
        # Test with a simple completion request
        try:
            # We'll use requests directly to test connection
            headers = {
                "Content-Type": "application/json",
                "api-key": self.azure_api_key
            }
            
            # Define a minimal request payload
            payload = {
                "messages": [{"role": "user", "content": "Hello, are you working?"}],
                "temperature": 0.7,
                "max_tokens": 50
            }
            
            # Construct the URL
            url = f"{self.azure_endpoint}/openai/deployments/{self.azure_deployment}/chat/completions?api-version={self.azure_api_version}"
            
            # Make the request with retry logic
            response = None
            retries = 3
            retry_delay = 1
            
            for attempt in range(retries):
                try:
                    response = requests.post(url, headers=headers, json=payload, timeout=30)
                    response.raise_for_status()
                    break
                except requests.exceptions.RequestException as e:
                    if attempt < retries - 1:
                        logger.warning(f"Connection attempt {attempt + 1} failed: {str(e)}. Retrying in {retry_delay} seconds...")
                        time.sleep(retry_delay)
                        retry_delay *= 2  # Exponential backoff
                    else:
                        raise
            
            self.assertIsNotNone(response)
            self.assertEqual(response.status_code, 200)
            
            result = response.json()
            self.assertIn("choices", result)
            self.assertTrue(len(result["choices"]) > 0)
            
            logger.info("Successfully connected to Azure OpenAI service")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to Azure OpenAI: {str(e)}")
            self.fail(f"Azure OpenAI connection test failed: {str(e)}")
            return False
    
    def test_frame_decision_task(self):
        """Test processing of the Frame Decision task with Azure OpenAI."""
        # Create the task
        task = self.create_test_task("FrameDecisionTask")
        
        # Process the task
        try:
            # Patch the service properties to use azure-openai instead of openai
            with patch.object(self.orchestrator, '_get_service_properties') as mock_get_props:
                mock_get_props.return_value = {
                    "service.type": "assistant",
                    "service.name": "azure-openai",
                    "service.version": "1.0"
                }
                
                # Route the task to Azure OpenAI
                result = self.orchestrator.route_task(task)
        except Exception as e:
            logger.error(f"Error processing Frame Decision task: {str(e)}")
            self.fail(f"Task processing failed: {str(e)}")
            return None
        
        # Store result for verification
        self.task_outputs["FrameDecisionTask"] = result
        
        # Validate the result
        self.assertIn("recommendation", result)
        self.assertTrue(len(result["recommendation"]) > 0)
        
        # Check for key sections
        self.assertIn("Key Decision", result["recommendation"])
        self.assertIn("Stakeholders", result["recommendation"])
        self.assertIn("Evaluation Criteria", result["recommendation"])
        
        # Log the results
        logger.info(f"✓ Frame Decision Task completed successfully")
        logger.info(f"✓ Result contains key decision framing elements")
        
        return result
    
    def test_identify_alternatives_task(self):
        """Test processing of the Identify Alternatives task."""
        # First run the frame decision task if not already done
        frame_result = self.task_outputs.get("FrameDecisionTask")
        if not frame_result:
            frame_result = self.test_frame_decision_task()
            if not frame_result:
                self.skipTest("Frame Decision task failed, cannot continue")
        
        # Create variables with the frame decision result
        variables = {
            "task_name": "FrameDecisionTask",
            "recommendation": frame_result["recommendation"],
            "processed_by": frame_result.get("processed_by", "Azure-Test")
        }
        
        # Create the task
        task = self.create_test_task("IdentifyAlternativesTask", variables=variables)
        
        # Process the task
        try:
            # Patch the service properties
            with patch.object(self.orchestrator, '_get_service_properties') as mock_get_props:
                mock_get_props.return_value = {
                    "service.type": "assistant",
                    "service.name": "azure-openai",
                    "service.version": "1.0"
                }
                
                # Route the task
                result = self.orchestrator.route_task(task)
        except Exception as e:
            logger.error(f"Error processing Identify Alternatives task: {str(e)}")
            self.fail(f"Task processing failed: {str(e)}")
            return None
        
        # Store result for verification
        self.task_outputs["IdentifyAlternativesTask"] = result
        
        # Validate the result
        self.assertIn("recommendation", result)
        
        # Check for Azure services
        azure_services_found = []
        for service in ["Azure Virtual Machines", "Azure Kubernetes Service", "Azure App Service", 
                        "Azure Functions", "Azure AI", "Azure Cognitive Services"]:
            if service in result["recommendation"]:
                azure_services_found.append(service)
        
        self.assertTrue(len(azure_services_found) > 0, f"No Azure services found in the recommendation")
        
        # Log the results
        logger.info(f"✓ Identify Alternatives Task completed successfully")
        logger.info(f"✓ Azure services identified: {', '.join(azure_services_found)}")
        
        return result
    
    def test_evaluate_alternatives_task(self):
        """Test processing of the Evaluate Alternatives task."""
        # Use the output from the previous task as input
        alternatives_result = self.task_outputs.get("IdentifyAlternativesTask")
        if not alternatives_result:
            alternatives_result = self.test_identify_alternatives_task()
            if not alternatives_result:
                self.skipTest("Identify Alternatives task failed, cannot continue")
        
        # Create variables with the previous results
        variables = {
            "task_name": "IdentifyAlternativesTask",
            "recommendation": alternatives_result["recommendation"],
            "processed_by": alternatives_result.get("processed_by", "Azure-Test")
        }
        
        # Create the task
        task = self.create_test_task("EvaluateAlternativesTask", variables=variables)
        
        # Process the task
        try:
            # Patch the service properties
            with patch.object(self.orchestrator, '_get_service_properties') as mock_get_props:
                mock_get_props.return_value = {
                    "service.type": "assistant",
                    "service.name": "azure-openai",
                    "service.version": "1.0"
                }
                
                # Route the task
                result = self.orchestrator.route_task(task)
        except Exception as e:
            logger.error(f"Error processing Evaluate Alternatives task: {str(e)}")
            self.fail(f"Task processing failed: {str(e)}")
            return None
        
        # Store result for verification
        self.task_outputs["EvaluateAlternativesTask"] = result
        
        # Validate the result
        self.assertIn("recommendation", result)
        
        # Check for evaluation elements
        self.assertTrue(any(str(i) in result["recommendation"] for i in range(1, 6)), "No rating scores found")
        self.assertIn("score", result["recommendation"].lower())
        
        # Log the results
        logger.info(f"✓ Evaluate Alternatives Task completed successfully")
        logger.info(f"✓ Contains scoring and evaluation criteria")
        
        return result
    
    def test_recommendation_task(self):
        """Test processing of the Recommendation task."""
        # Use the output from the previous task as input
        evaluate_result = self.task_outputs.get("EvaluateAlternativesTask")
        if not evaluate_result:
            evaluate_result = self.test_evaluate_alternatives_task()
            if not evaluate_result:
                self.skipTest("Evaluate Alternatives task failed, cannot continue")
        
        # Create variables with the previous results
        variables = {
            "task_name": "EvaluateAlternativesTask",
            "recommendation": evaluate_result["recommendation"],
            "processed_by": evaluate_result.get("processed_by", "Azure-Test")
        }
        
        # Create the task
        task = self.create_test_task("RecommendationTask", variables=variables)
        
        # Process the task
        try:
            # Patch the service properties
            with patch.object(self.orchestrator, '_get_service_properties') as mock_get_props:
                mock_get_props.return_value = {
                    "service.type": "assistant",
                    "service.name": "azure-openai",
                    "service.version": "1.0"
                }
                
                # Route the task
                result = self.orchestrator.route_task(task)
        except Exception as e:
            logger.error(f"Error processing Recommendation task: {str(e)}")
            self.fail(f"Task processing failed: {str(e)}")
            return None
        
        # Store result for verification
        self.task_outputs["RecommendationTask"] = result
        
        # Validate the result
        self.assertIn("recommendation", result)
        self.assertIn("Recommendation", result["recommendation"])
        self.assertIn("Justification", result["recommendation"])
        self.assertIn("Next Steps", result["recommendation"])
        
        # Log the results
        logger.info(f"✓ Recommendation Task completed successfully")
        logger.info(f"✓ Contains clear recommendation and next steps")
        
        return result
    
    def test_full_process_flow(self):
        """Test the entire process flow from start to finish with Azure OpenAI."""
        # Clear any previous outputs
        self.task_outputs = {}
        
        # Test connection to Azure OpenAI first
        if not self.test_connection_to_azure_openai():
            self.skipTest("Cannot connect to Azure OpenAI service")
        
        # Process each task in sequence
        start_time = time.time()
        
        frame_result = self.test_frame_decision_task()
        self.assertIsNotNone(frame_result, "Frame Decision task failed")
        
        alternatives_result = self.test_identify_alternatives_task()
        self.assertIsNotNone(alternatives_result, "Identify Alternatives task failed")
        
        evaluate_result = self.test_evaluate_alternatives_task()
        self.assertIsNotNone(evaluate_result, "Evaluate Alternatives task failed")
        
        recommendation_result = self.test_recommendation_task()
        self.assertIsNotNone(recommendation_result, "Recommendation task failed")
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Get orchestrator metrics
        metrics = self.orchestrator.get_metrics()
        
        # Print performance summary
        logger.info("\n--- Azure OpenAI Decision Process Performance ---")
        logger.info(f"Total execution time: {total_time:.2f} seconds")
        
        # Analyze cache performance
        cache_summary = {}
        for cache_name, cache_metrics in metrics.get("cache_metrics", {}).items():
            hits = cache_metrics.get("hits", 0)
            misses = cache_metrics.get("misses", 0)
            total = hits + misses
            hit_rate = (hits / total * 100) if total > 0 else 0
            cache_summary[cache_name] = {
                "hit_rate": f"{hit_rate:.1f}%",
                "hits": hits,
                "misses": misses,
                "total": total
            }
            logger.info(f"- {cache_name}: {hit_rate:.1f}% hit rate ({hits}/{total})")
        
        # Find a recommended Azure service from the final recommendation
        recommended_service = None
        for line in recommendation_result["recommendation"].split('\n'):
            if "recommend" in line.lower() and "Azure" in line:
                parts = line.split("Azure", 1)
                if len(parts) > 1:
                    service_part = "Azure" + parts[1].split(".")[0]
                    recommended_service = service_part.strip()
                    break
        
        if recommended_service:
            logger.info(f"\nRecommended Azure Service: {recommended_service}")
        
        # Save the full results
        results_file = os.path.join(project_root, f"azure_decision_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        
        with open(results_file, 'w') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "execution_time": total_time,
                "task_results": {
                    "FrameDecisionTask": {
                        "execution_status": "success" if frame_result else "failed",
                        "recommendation_length": len(frame_result.get("recommendation", "")) if frame_result else 0
                    },
                    "IdentifyAlternativesTask": {
                        "execution_status": "success" if alternatives_result else "failed",
                        "recommendation_length": len(alternatives_result.get("recommendation", "")) if alternatives_result else 0
                    },
                    "EvaluateAlternativesTask": {
                        "execution_status": "success" if evaluate_result else "failed",
                        "recommendation_length": len(evaluate_result.get("recommendation", "")) if evaluate_result else 0
                    },
                    "RecommendationTask": {
                        "execution_status": "success" if recommendation_result else "failed",
                        "recommendation_length": len(recommendation_result.get("recommendation", "")) if recommendation_result else 0,
                        "recommended_service": recommended_service
                    }
                },
                "cache_performance": cache_summary,
                "metrics": metrics
            }, f, indent=2)
        
        logger.info(f"Full test results saved to {results_file}")
        
        # Final assertions
        self.assertEqual(len(self.task_outputs), 4, "Not all tasks were processed")
        self.assertTrue(total_time > 0, "Execution time should be positive")
        self.assertIsNotNone(recommended_service, "No Azure service recommendation found")
        
        return recommendation_result


if __name__ == "__main__":
    unittest.main()
