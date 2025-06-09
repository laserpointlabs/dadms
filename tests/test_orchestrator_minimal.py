import unittest
from unittest.mock import MagicMock, patch

from src.service_orchestrator import ServiceOrchestrator

class TestServiceOrchestratorMinimal(unittest.TestCase):
    """Basic tests for ServiceOrchestrator."""

    def test_get_default_properties(self):
        orchestrator = ServiceOrchestrator(service_registry={}, debug=True)
        defaults = orchestrator._get_default_properties()
        self.assertEqual(defaults["service.type"], "assistant")
        self.assertEqual(defaults["service.name"], "dadm-openai-assistant")

    @patch('src.service_orchestrator.requests.Session')
    def test_route_task_no_service(self, mock_session_class):
        mock_session = MagicMock()
        mock_session_class.return_value = mock_session
        orchestrator = ServiceOrchestrator(service_registry={}, debug=True)
        task = MagicMock()
        task.get_activity_id.return_value = 'TestTask'
        task.get_process_instance_id.return_value = None
        result = orchestrator.route_task(task, {})
        self.assertIn('error', result)
