import os
import unittest
from unittest import mock

from src.openai_assistant import AssistantManager

class TestAssistantManager(unittest.TestCase):
    """Minimal tests for the AssistantManager class."""

    def test_missing_api_key_raises_value_error(self):
        """AssistantManager should raise ValueError if OPENAI_API_KEY is not set."""
        with mock.patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(ValueError):
                AssistantManager()

    @mock.patch('src.openai_assistant.AssistantManager._initialize_assistant')
    @mock.patch('src.openai_assistant.AssistantManager._create_thread')
    @mock.patch('src.openai_assistant.OpenAI')
    def test_initialization_with_api_key(self, mock_openai, mock_create_thread, mock_init_assistant):
        """AssistantManager initializes when API key is provided."""
        mock_create_thread.return_value = None
        mock_init_assistant.return_value = None
        with mock.patch.dict(os.environ, {'OPENAI_API_KEY': 'test-key'}):
            with mock.patch('config.openai_config.OPENAI_API_KEY', 'test-key'):
                manager = AssistantManager(data_dir='tests')
                self.assertEqual(manager.data_dir, 'tests')
