"""
Test the Service Orchestrator functionality

DEPRECATED: Some tests in this file are failing because methods like clear_caches
don't exist in the current ServiceOrchestrator implementation. Please update the
tests to match the current API or use tests for EnhancedServiceOrchestrator instead.
"""
import os
import sys
import unittest
from unittest.mock import MagicMock, patch
import json

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from src.service_orchestrator import ServiceOrchestrator

class MockResponse:
    def __init__(self, status_code, json_data):
        self.status_code = status_code
        self._json_data = json_data
        self.text = json.dumps(json_data)
        
    def json(self):
        return self._json_data

class TestServiceOrchestrator(unittest.TestCase):
    """Test cases for ServiceOrchestrator"""
    
    def setUp(self):
        """Setup test environment"""
        # Create a test service registry
        self.test_registry = {
            "assistant": {
                "openai": {
                    "endpoint": "http://test-openai-service:5000"
                },
                "azure": {
                    "endpoint": "http://test-azure-service:5000"
                }
            },
            "nlp": {
                "spacy": {
                    "endpoint": "http://test-nlp-service:8000"
                }
            }
        }
        
        # Create orchestrator with test registry and enable debug
        self.orchestrator = ServiceOrchestrator(service_registry=self.test_registry, debug=True)
        
    def test_get_default_properties(self):
        """Test getting default service properties"""
        default_props = self.orchestrator._get_default_properties()
        
        self.assertEqual(default_props["service.type"], "assistant")
        self.assertEqual(default_props["service.name"], "openai")
        self.assertEqual(default_props["service.version"], "1.0")
    
    @patch('src.service_orchestrator.requests.Session')
    def test_route_task_success(self, mock_session_class):
        """Test successful task routing to service"""
        # Setup mock session and response
        mock_session = MagicMock()
        mock_session_class.return_value = mock_session
        
        mock_response = MockResponse(200, {
            "status": "success",
            "result": {
                "analysis": "Test analysis result",
                "recommendation": "Test recommendation"
            }
        })
        mock_session.post.return_value = mock_response
        
        # Create new orchestrator to use the mocked session
        orchestrator = ServiceOrchestrator(service_registry=self.test_registry)
        
        # Create mock task with required methods
        mock_task = MagicMock()
        mock_task.get_activity_id.return_value = "test_activity"
        mock_task.get_process_instance_id.return_value = None  # Will use default properties
        
        # Test variables
        variables = {
            "input": "Test input data",
            "options": ["option1", "option2"]
        }
        
        # Route task
        result = orchestrator.route_task(mock_task, variables)
        
        # Verify result
        self.assertEqual(result["analysis"], "Test analysis result")
        self.assertEqual(result["recommendation"], "Test recommendation")
        
        # Verify correct service was called
        mock_session.post.assert_called_once()
        args, kwargs = mock_session.post.call_args
        self.assertTrue(args[0].startswith("http://test-openai-service:5000"))
        
        # Verify payload
        payload = kwargs["json"]
        self.assertEqual(payload["task_name"], "test_activity")
        self.assertEqual(payload["variables"], variables)
    
    @patch('src.service_orchestrator.requests.Session')
    def test_route_task_error(self, mock_session_class):
        """Test error handling in task routing"""
        # Setup mock session and response
        mock_session = MagicMock()
        mock_session_class.return_value = mock_session
        
        # Setup mock response with error
        mock_response = MockResponse(500, {
            "status": "error",
            "message": "Service error"
        })
        mock_session.post.return_value = mock_response
        
        # Create new orchestrator to use the mocked session
        orchestrator = ServiceOrchestrator(service_registry=self.test_registry)
        
        # Create mock task
        mock_task = MagicMock()
        mock_task.get_activity_id.return_value = "test_activity"
        mock_task.get_process_instance_id.return_value = None
        
        # Route task
        result = orchestrator.route_task(mock_task, {})
        
        # Verify error handling
        self.assertIn("error", result)
        self.assertEqual(result["service"], "assistant/openai")
        self.assertEqual(result["task"], "test_activity")
    
    @patch('src.service_orchestrator.requests.Session')
    def test_route_task_custom_service(self, mock_session_class):
        """Test routing to a specific service based on properties"""
        # Setup mock session and response
        mock_session = MagicMock()
        mock_session_class.return_value = mock_session
        
        # Setup mock response
        mock_response = MockResponse(200, {
            "status": "success",
            "result": {"nlp_result": "Test NLP result"}
        })
        mock_session.post.return_value = mock_response
        
        # Create new orchestrator to use the mocked session
        orchestrator = ServiceOrchestrator(service_registry=self.test_registry)
        
        # Create mock task with custom service properties
        mock_task = MagicMock()
        mock_task.get_activity_id.return_value = "test_activity"
        mock_task.get_process_instance_id.return_value = None
        
        # Override extract_service_properties to return custom properties
        orchestrator.extract_service_properties = MagicMock(return_value={
            "service.type": "nlp",
            "service.name": "spacy",
            "service.version": "1.0"
        })
        
        # Route task
        result = orchestrator.route_task(mock_task, {})
        
        # Verify correct service was called
        mock_session.post.assert_called_once()
        args, kwargs = mock_session.post.call_args
        self.assertTrue(args[0].startswith("http://test-nlp-service:8000"))
        
        # Verify result
        self.assertEqual(result["nlp_result"], "Test NLP result")
    
    @patch('src.service_orchestrator.requests.Session')
    def test_caching_properties(self, mock_session_class):
        """Test that service properties are cached"""
        # Setup mock session
        mock_session = MagicMock()
        mock_session_class.return_value = mock_session
        
        # Mock XML response with properties
        mock_xml_response = MockResponse(200, {
            "bpmn20Xml": """
            <bpmn:definitions>
              <bpmn:process>
                <bpmn:serviceTask id="test_activity">
                  <bpmn:extensionElements>
                    <camunda:properties>
                      <camunda:property name="service.type" value="nlp" />
                      <camunda:property name="service.name" value="spacy" />
                    </camunda:properties>
                  </bpmn:extensionElements>
                </bpmn:serviceTask>
              </bpmn:process>
            </bpmn:definitions>
            """
        })
        
        # Mock process instance response
        mock_instance_response = MockResponse(200, {
            "definitionId": "test_process:1:123"
        })
        
        # Set up responses for different URLs
        def mock_get_response(url, **kwargs):
            if "process-instance" in url:
                return mock_instance_response
            elif "process-definition" in url:
                return mock_xml_response
            return MockResponse(404, {"error": "Not found"})
        
        mock_session.get.side_effect = mock_get_response
        
        # Create new orchestrator with mocked session
        orchestrator = ServiceOrchestrator(service_registry=self.test_registry)
        
        # Create mock task
        mock_task = MagicMock()
        mock_task.get_activity_id.return_value = "test_activity"
        mock_task.get_process_instance_id.return_value = "test_instance_id"
        
        # First call to extract properties
        props1 = orchestrator.extract_service_properties(mock_task)
        
        # Should call the session.get for both process instance and definition
        self.assertEqual(mock_session.get.call_count, 2)
        
        # Reset the mock to check second call
        mock_session.reset_mock()
        
        # Second call should use cached values
        props2 = orchestrator.extract_service_properties(mock_task)
        
        # Should not make any new HTTP calls
        mock_session.get.assert_not_called()
        
        # Both calls should return the same properties
        self.assertEqual(props1["service.type"], "nlp")
        self.assertEqual(props1["service.name"], "spacy")
        self.assertEqual(props1, props2)
        
    @patch('src.service_orchestrator.ServiceOrchestrator._get_process_xml_for_task', return_value=None)
    def test_clear_caches(self, mock_get_xml):
        """Test clearing the caches"""
        # Setup mock task and fill cache
        mock_task = MagicMock()
        mock_task.get_activity_id.return_value = "test_activity"
        mock_task.get_process_instance_id.return_value = None
        
        # This will use default properties and cache them
        self.orchestrator.extract_service_properties(mock_task)
        
        # Reset the mock to verify next calls
        mock_get_xml.reset_mock()
            
        # This should use the cache, not call _get_process_xml_for_task
        self.orchestrator.extract_service_properties(mock_task)
        mock_get_xml.assert_not_called()
            
        # Clear the caches
        self.orchestrator.clear_caches()
            
        # Now it should call _get_process_xml_for_task again
        self.orchestrator.extract_service_properties(mock_task)
        mock_get_xml.assert_called_once()

if __name__ == '__main__':
    unittest.main()
