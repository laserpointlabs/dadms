"""
Tests for OpenAI Assistant API - Fixed Version

This test file verifies the basic functionality of the OpenAI Assistant API integration.
It includes tests for assistant creation, thread management, and message processing.

This is an updated version that works with the current OpenAI API structure.
"""
import os
import unittest
from unittest.mock import patch
import time
from openai import OpenAI

class TestAssistantAPIFixed(unittest.TestCase):
    """Test cases for OpenAI Assistant API integration"""

    def setUp(self):
        """Set up test environment"""
        # Skip tests if OpenAI API key is not available
        self.api_key = os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            self.skipTest("OPENAI_API_KEY environment variable not set")
            
        # Initialize OpenAI client
        self.client = OpenAI(api_key=self.api_key)
        
        # Test assistant properties
        self.assistant_name = "Test Assistant " + str(int(time.time()))
        self.assistant = None
        self.thread = None
        self.file_id = None
        
    def tearDown(self):
        """Clean up resources after tests"""
        # Delete the test file if created
        if self.file_id:
            try:
                self.client.files.delete(file_id=self.file_id)
                print(f"Deleted test file: {self.file_id}")
            except Exception as e:
                print(f"Error deleting file {self.file_id}: {e}")
        
        # Delete the test thread if created
        if self.thread:
            try:
                # OpenAI doesn't currently support thread deletion via API
                # This is a placeholder for when that functionality is available
                pass
            except Exception as e:
                print(f"Error deleting thread: {e}")
        
        # Delete the test assistant if created
        if self.assistant:
            try:
                self.client.beta.assistants.delete(assistant_id=self.assistant.id)
                print(f"Deleted test assistant: {self.assistant.id}")
            except Exception as e:
                print(f"Error deleting assistant: {e}")
    
    def test_create_assistant(self):
        """Test creating an assistant"""
        try:
            # Create a test assistant
            self.assistant = self.client.beta.assistants.create(
                name=self.assistant_name,
                instructions="You are a test assistant for API validation.",
                model="gpt-4o",
                tools=[{"type": "file_search"}]
            )
            
            # Verify assistant properties
            self.assertEqual(self.assistant.name, self.assistant_name)
            self.assertEqual(self.assistant.model, "gpt-4o")
            self.assertEqual(len(self.assistant.tools), 1)
            self.assertEqual(self.assistant.tools[0].type, "file_search")
            
            print(f"Created test assistant: {self.assistant.id}")
            
        except Exception as e:
            self.fail(f"Failed to create assistant: {e}")
    
    def test_create_thread(self):
        """Test creating a thread"""
        try:
            # Create a thread
            self.thread = self.client.beta.threads.create()
            
            # Verify thread was created successfully
            self.assertIsNotNone(self.thread.id)
            print(f"Created test thread: {self.thread.id}")
            
        except Exception as e:
            self.fail(f"Failed to create thread: {e}")
    
    def test_send_message(self):
        """Test sending a message to a thread"""
        # Create a test assistant and thread first
        self.test_create_assistant()
        self.test_create_thread()
        
        try:
            # Add a message to the thread
            message = self.client.beta.threads.messages.create(
                thread_id=self.thread.id,
                role="user",
                content="Hello, this is a test message."
            )
            
            # Verify message properties
            self.assertEqual(message.role, "user")
            self.assertEqual(message.content[0].text.value, "Hello, this is a test message.")
            
            print(f"Created test message: {message.id}")
            
        except Exception as e:
            self.fail(f"Failed to send message: {e}")
    
    def test_create_run(self):
        """Test creating a run on a thread with an assistant"""
        # Create a test assistant and thread first
        self.test_create_assistant()
        self.test_create_thread()
        
        try:
            # Add a message to the thread
            self.client.beta.threads.messages.create(
                thread_id=self.thread.id,
                role="user",
                content="What is the capital of France?"
            )
            
            # Create a run
            run = self.client.beta.threads.runs.create(
                thread_id=self.thread.id,
                assistant_id=self.assistant.id
            )
            
            # Verify run properties
            self.assertEqual(run.assistant_id, self.assistant.id)
            self.assertEqual(run.thread_id, self.thread.id)
            self.assertIn(run.status, ["queued", "in_progress", "completed"])
            
            print(f"Created test run: {run.id} with status: {run.status}")
            
            # Wait for run to complete (skip for CI environments)
            max_attempts = 3
            attempts = 0
            
            while run.status in ["queued", "in_progress"] and attempts < max_attempts:
                print(f"Waiting for run to complete... Status: {run.status}")
                time.sleep(2)  # Wait 2 seconds before checking again
                run = self.client.beta.threads.runs.retrieve(
                    thread_id=self.thread.id,
                    run_id=run.id
                )
                attempts += 1
            
            # Check if run completed
            if run.status == "completed":
                # Retrieve the assistant's messages
                messages = self.client.beta.threads.messages.list(
                    thread_id=self.thread.id
                )
                
                # Find the assistant's response (most recent)
                assistant_messages = [msg for msg in messages if msg.role == "assistant"]
                
                if assistant_messages:
                    response = assistant_messages[0].content[0].text.value
                    print(f"Assistant response: {response}")
                    self.assertIn("Paris", response)
            
        except Exception as e:
            self.fail(f"Failed to create or complete run: {e}")

if __name__ == '__main__':
    unittest.main()