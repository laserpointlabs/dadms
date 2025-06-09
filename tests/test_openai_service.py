"""
Tests for the OpenAI Assistant Service

DEPRECATED: This test depends on Flask module which is not installed in the current environment.
To use this test, install Flask first with: pip install flask
"""
import os
import sys
import unittest
from unittest.mock import MagicMock, patch
import json
import tempfile

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Import the Flask app for testing
# Add services directory to path
services_path = os.path.join(project_root, 'services')
if services_path not in sys.path:
    sys.path.insert(0, services_path)

# Must set these environment variables for the service to load properly
os.environ['OPENAI_API_KEY'] = 'test_key_for_testing'
os.environ['ASSISTANT_NAME'] = 'Test Assistant'
os.environ['ASSISTANT_MODEL'] = 'gpt-4-test'

# Import the service module
with patch('src.openai_assistant.OpenAI'):  # Mock OpenAI during import
    from openai_service.service import app

class TestOpenAIService(unittest.TestCase):
    """Test cases for the OpenAI Assistant Service"""
    
    def setUp(self):
        """Setup test client"""
        app.config['TESTING'] = True
        self.client = app.test_client()
        
        # Create patchers for OpenAI
        self.assistant_manager_patcher = patch('openai_service.service.AssistantManager')
        self.mock_assistant_manager = self.assistant_manager_patcher.start()
        
        # Setup mock assistant manager instance
        self.mock_instance = MagicMock()
        self.mock_assistant_manager.return_value = self.mock_instance
        self.mock_instance.assistant_id = 'test_assistant_id'
        self.mock_instance.thread_id = 'test_thread_id'
        self.mock_instance.file_ids = ['file1', 'file2']
        
        # Set global assistant_manager in the service module
        import openai_service.service as service_module
        service_module.assistant_manager = self.mock_instance
    
    def tearDown(self):
        """Clean up patchers"""
        self.assistant_manager_patcher.stop()
    
    def test_health_check(self):
        """Test the health check endpoint"""
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['service'], 'openai-assistant')
    
    def test_initialize(self):
        """Test the initialize endpoint"""
        response = self.client.post('/initialize', 
                                   json={'data_dir': '/test/data'},
                                   content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['assistant_id'], 'test_assistant_id')
        self.assertEqual(data['thread_id'], 'test_thread_id')
        self.assertEqual(data['files_count'], 2)
        
        # Verify AssistantManager was created with correct parameters
        self.mock_assistant_manager.assert_called_once_with(data_dir='/test/data')
    
    def test_process_task_success(self):
        """Test successful task processing"""
        # Setup mock response
        self.mock_instance.process_task.return_value = {
            'analysis': 'Test analysis',
            'recommendation': 'Test recommendation'
        }
        
        # Test request
        request_data = {
            'task_name': 'test_task',
            'task_documentation': 'Test documentation',
            'variables': {'input': 'test input'},
            'decision_context': 'Test decision context',
            'service_properties': {
                'service.type': 'assistant',
                'service.name': 'openai',
                'model': 'gpt-4-turbo'
            }
        }
        
        response = self.client.post('/process_task',
                                   json=request_data,
                                   content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['result']['analysis'], 'Test analysis')
        self.assertEqual(data['result']['recommendation'], 'Test recommendation')
        
        # Verify process_task was called with correct parameters
        self.mock_instance.process_task.assert_called_once_with(
            task_name='test_task',
            task_documentation='Test documentation',
            variables={'input': 'test input'},
            decision_context='Test decision context'
        )
    
    def test_process_task_missing_parameters(self):
        """Test error handling for missing parameters"""
        # Missing task_name
        response = self.client.post('/process_task',
                                   json={},
                                   content_type='application/json')
        
        self.assertEqual(response.status_code, 400)
        
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'error')
        self.assertIn('task_name is required', data['message'])
    
    def test_process_task_not_initialized(self):
        """Test error handling when assistant not initialized"""
        # Set assistant_manager to None
        import openai_service.service as service_module
        service_module.assistant_manager = None
        
        response = self.client.post('/process_task',
                                  json={'task_name': 'test_task'},
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 400)
        
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'error')
        self.assertIn('Assistant not initialized', data['message'])

if __name__ == '__main__':
    unittest.main()
