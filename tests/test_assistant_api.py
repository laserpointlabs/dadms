"""
Tests for OpenAI Assistant API

This test file verifies the basic functionality of the OpenAI Assistant API integration.
It includes tests for assistant creation, thread management, and message processing.
"""

from openai import OpenAI
import os

# Initialize the client
client = OpenAI()

# Print information about the assistants API
print("Available methods in client.beta.assistants:")
for method in dir(client.beta.assistants):
    if not method.startswith("_"):
        print(f"- {method}")

# Check for assistants_files endpoint
print("\nChecking for assistants_files endpoint:")
if hasattr(client.beta, "assistants_files"):
    print("Found assistants_files endpoint")
    for method in dir(client.beta.assistants_files):
        if not method.startswith("_"):
            print(f"- {method}")
else:
    print("assistants_files endpoint not found")

# Try to create a simple test assistant
print("\nTrying to create a test assistant...")
try:
    # Create without file_ids parameter
    assistant = client.beta.assistants.create(
        name="Test Assistant API",
        instructions="You are a test assistant.",
        model="gpt-4o",
        tools=[{"type": "file_search"}]
    )
    print(f"Successfully created assistant with ID: {assistant.id}")
    
    # Check the assistant object structure
    print("\nAssistant object properties:")
    for attr in dir(assistant):
        if not attr.startswith("_"):
            try:
                value = getattr(assistant, attr)
                print(f"- {attr}: {value}")
            except:
                print(f"- {attr}: <error accessing>")
                
    # Check if we can attach files after creation
    print("\nChecking methods to attach files to assistants...")
    
    # Check if there's a method to attach files to an assistant
    file_attachment_methods = [
        method for method in dir(client.beta.assistants) 
        if "file" in method.lower() or "attach" in method.lower()
    ]
    
    if file_attachment_methods:
        print(f"Found potential file attachment methods: {file_attachment_methods}")
    else:
        print("No obvious file attachment methods found")
        
    # Try to directly access the assistants_files API if it exists
    if hasattr(client.beta, "assistants_files"):
        print("\nTrying to use assistants_files API...")
        try:
            # Upload a test file first
            with open("test_assistant_api.py", "rb") as f:
                file = client.files.create(
                    file=f,
                    purpose="assistants"
                )
            print(f"Uploaded file with ID: {file.id}")
            
            # Try to attach the file to the assistant
            attached_file = client.beta.assistants.files.create(
                assistant_id=assistant.id,
                file_id=file.id
            )
            print(f"Successfully attached file: {attached_file}")
        except Exception as e:
            print(f"Error attaching file: {e}")
    
except Exception as e:
    print(f"Error creating assistant: {e}")
