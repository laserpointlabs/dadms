"""
OpenAI Assistant Manager CLI

This script provides a command-line interface for managing OpenAI assistants.
It helps with creating, updating, and verifying assistants.
"""
import os
import json
import argparse
import sys
import time
from pathlib import Path

# Add the project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

def list_assistants():
    """List all assistants"""
    try:
        from config import openai_config
        from openai import OpenAI
        
        # Check for API key
        if not openai_config.OPENAI_API_KEY:
            print("ERROR: OPENAI_API_KEY environment variable is not set")
            return
        
        # Initialize OpenAI client
        client = OpenAI(api_key=openai_config.OPENAI_API_KEY)
        
        # List assistants
        assistants = client.beta.assistants.list(
            order="desc",
            limit=100
        )
        
        if not assistants.data:
            print("No assistants found")
            return
        
        print(f"Found {len(assistants.data)} assistants:")
        print("-"*80)
        print(f"{'ID':<40} {'Name':<30} {'Model':<10}")
        print("-"*80)
        
        for assistant in assistants.data:
            # Handle possible None values in name
            assistant_name = assistant.name if assistant.name else "Unnamed Assistant"
            assistant_model = assistant.model if hasattr(assistant, 'model') else "Unknown"
            print(f"{assistant.id:<40} {assistant_name[:30]:<30} {assistant_model:<10}")
        
        # Indicate which assistant is the current one based on config name
        print("\nCurrent assistant from config:")
        found = False
        for assistant in assistants.data:
            if assistant.name == openai_config.ASSISTANT_NAME:
                print(f"* {assistant.id} ({assistant.name}) [ACTIVE]")
                found = True
                break
        
        if not found:
            print(f"* No assistant found with name '{openai_config.ASSISTANT_NAME}'")
            
        # Also check if there's an assistant ID saved in the assistant_id.json file
        try:
            saved_id = get_saved_assistant_id()
            if saved_id:
                print(f"\nSaved assistant ID from file:")
                print(f"* {saved_id}")
        except Exception as e:
            print(f"Warning: Could not read saved assistant ID: {e}")
    
    except Exception as e:
        print(f"Error listing assistants: {e}")

def get_saved_assistant_id():
    """Get the assistant ID from the saved file"""
    # Path to project root
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    
    # New path to assistant ID file in config/metadata
    metadata_dir = os.path.join(project_root, "config", "metadata")
    assistant_id_file = os.path.join(metadata_dir, "assistant_id.json")
    
    # Check if file exists in new location
    if os.path.exists(assistant_id_file):
        try:
            with open(assistant_id_file, 'r') as f:
                data = json.load(f)
                return data.get("assistant_id")
        except Exception:
            pass
    
    # For backward compatibility, check old location
    old_assistant_id_file = os.path.join(project_root, "data", "assistant_id.json")
    if os.path.exists(old_assistant_id_file):
        try:
            with open(old_assistant_id_file, 'r') as f:
                data = json.load(f)
                return data.get("assistant_id")
        except Exception:
            pass
    
    return None

def create_assistant():
    """Create a new assistant with the configured parameters"""
    try:
        from config import openai_config
        from openai import OpenAI
        
        # Check for API key
        if not openai_config.OPENAI_API_KEY:
            print("ERROR: OPENAI_API_KEY environment variable is not set")
            return
        
        # Initialize OpenAI client
        client = OpenAI(api_key=openai_config.OPENAI_API_KEY)
        
        # Create assistant
        print(f"Creating new assistant '{openai_config.ASSISTANT_NAME}'...")
        
        assistant = client.beta.assistants.create(
            name=openai_config.ASSISTANT_NAME,
            instructions=openai_config.ASSISTANT_INSTRUCTIONS,
            model=openai_config.ASSISTANT_MODEL,
            tools=[{"type": "file_search"}]
        )
        
        print(f"Assistant created successfully!")
        print(f"ID: {assistant.id}")
        print(f"Name: {assistant.name}")
        print(f"Model: {assistant.model}")
        
        # Save the assistant ID to file
        save_assistant_id(assistant.id, assistant.name or openai_config.ASSISTANT_NAME)
        
        return assistant.id
    
    except Exception as e:
        print(f"Error creating assistant: {e}")
        return None

def update_assistant(assistant_id=None):
    """Update an existing assistant with the configured parameters"""
    try:
        from config import openai_config
        from openai import OpenAI
        
        # Check for API key
        if not openai_config.OPENAI_API_KEY:
            print("ERROR: OPENAI_API_KEY environment variable is not set")
            return False
        
        # Initialize OpenAI client
        client = OpenAI(api_key=openai_config.OPENAI_API_KEY)
        
        # If no assistant ID provided, try to find by name
        if not assistant_id:
            assistants = client.beta.assistants.list(
                order="desc",
                limit=100
            )
            
            for assistant in assistants.data:
                if assistant.name == openai_config.ASSISTANT_NAME:
                    assistant_id = assistant.id
                    break
            
            if not assistant_id:
                print(f"No assistant found with name '{openai_config.ASSISTANT_NAME}'")
                return False
        
        # Update assistant
        print(f"Updating assistant '{assistant_id}'...")
        
        assistant = client.beta.assistants.update(
            assistant_id=assistant_id,
            name=openai_config.ASSISTANT_NAME,
            instructions=openai_config.ASSISTANT_INSTRUCTIONS,
            model=openai_config.ASSISTANT_MODEL,
            tools=[{"type": "file_search"}]
        )
        
        print(f"Assistant updated successfully!")
        print(f"ID: {assistant.id}")
        print(f"Name: {assistant.name}")
        print(f"Model: {assistant.model}")
        
        # Save the assistant ID to file
        save_assistant_id(assistant.id, assistant.name or openai_config.ASSISTANT_NAME)
        
        return True
    
    except Exception as e:
        print(f"Error updating assistant: {e}")
        return False

def save_assistant_id(assistant_id, name="DADM Decision Analysis Assistant"):
    """Save the assistant ID to the file"""
    # Path to project root
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    
    # New path to metadata directory
    metadata_dir = os.path.join(project_root, "config", "metadata")
    Path(metadata_dir).mkdir(parents=True, exist_ok=True)
    
    # Path to assistant ID file in new location
    assistant_id_file = os.path.join(metadata_dir, "assistant_id.json")
    
    # Data structure for the assistant ID file
    data = {
        "assistant_id": assistant_id,
        "name": name,
        "last_used": None
    }
    
    try:
        # Update timestamp
        from datetime import datetime
        data["last_used"] = datetime.now().isoformat()
        
        # Write the file
        with open(assistant_id_file, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"Saved assistant ID {assistant_id} to {assistant_id_file}")
        
        # For backward compatibility, update the old location as well
        old_data_dir = os.path.join(project_root, "data")
        Path(old_data_dir).mkdir(parents=True, exist_ok=True)
        old_assistant_id_file = os.path.join(old_data_dir, "assistant_id.json")
        
        # Create a .bak file in the old location if it exists
        if os.path.exists(old_assistant_id_file):
            import shutil
            backup = old_assistant_id_file + ".bak"
            shutil.copy2(old_assistant_id_file, backup)
            print(f"Created backup of old assistant ID file at {backup}")
        
        return True
    except Exception as e:
        print(f"Error saving assistant ID: {e}")
        return False

def test_assistant(assistant_id=None):
    """Test the assistant by sending a simple message"""
    try:
        from config import openai_config
        from openai import OpenAI
        
        # Check for API key
        if not openai_config.OPENAI_API_KEY:
            print("ERROR: OPENAI_API_KEY environment variable is not set")
            return
        
        # Initialize OpenAI client
        client = OpenAI(api_key=openai_config.OPENAI_API_KEY)
        
        # If no assistant ID provided, try to find by name
        if not assistant_id:
            assistants = client.beta.assistants.list(
                order="desc",
                limit=100
            )
            
            for assistant in assistants.data:
                if assistant.name == openai_config.ASSISTANT_NAME:
                    assistant_id = assistant.id
                    break
            
            if not assistant_id:
                print(f"No assistant found with name '{openai_config.ASSISTANT_NAME}'")
                return
        
        # Create a thread
        print(f"Creating thread for test message...")
        thread = client.beta.threads.create()
        
        # Add a message to the thread
        print(f"Adding test message to thread...")
        message = client.beta.threads.messages.create(
            thread_id=thread.id,
            role="user",
            content="Hello! Please respond with a simple confirmation that you're working."
        )
        
        # Run the assistant
        print(f"Running assistant (ID: {assistant_id})...")
        run = client.beta.threads.runs.create(
            thread_id=thread.id,
            assistant_id=assistant_id
        )
        
        # Wait for the run to complete
        print(f"Waiting for assistant response...")
        while run.status in ["queued", "in_progress"]:
            run = client.beta.threads.runs.retrieve(
                thread_id=thread.id,
                run_id=run.id
            )
            print(f"Status: {run.status}")
            
            if run.status in ["completed", "failed", "cancelled", "expired"]:
                break
            
            time.sleep(1)
        
        if run.status == "completed":
            # Get the assistant's response
            messages = client.beta.threads.messages.list(
                thread_id=thread.id,
                order="desc",
                limit=1
            )
            
            if messages.data:
                # Extract the response content safely
                response_content = ""
                for message in messages.data:
                    if message.role == "assistant":
                        for content_item in message.content:
                            if content_item.type == "text":
                                response_content += content_item.text.value
                
                print(f"\nAssistant response:")
                print("-"*80)
                print(response_content)
                print("-"*80)
                print(f"\nTest completed successfully! Assistant is working.")
            else:
                print(f"No response received from assistant")
        else:
            print(f"Run failed with status: {run.status}")
    
    except Exception as e:
        print(f"Error testing assistant: {e}")

def parse_args():
    """Parse command-line arguments"""
    parser = argparse.ArgumentParser(description="OpenAI Assistant Manager CLI")
    
    # Define subcommands
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")
    
    # List assistants command
    list_parser = subparsers.add_parser("list", help="List all assistants")
    
    # Create assistant command
    create_parser = subparsers.add_parser("create", help="Create a new assistant")
    
    # Update assistant command
    update_parser = subparsers.add_parser("update", help="Update an existing assistant")
    update_parser.add_argument("--id", help="Assistant ID to update (uses name from config if not provided)")
    
    # Test assistant command
    test_parser = subparsers.add_parser("test", help="Test an assistant with a simple message")
    test_parser.add_argument("--id", help="Assistant ID to test (uses name from config if not provided)")
    
    # Save assistant ID command
    save_parser = subparsers.add_parser("save", help="Save an assistant ID to file")
    save_parser.add_argument("--id", required=True, help="Assistant ID to save")
    save_parser.add_argument("--name", default="DADM Decision Analysis Assistant", help="Assistant name")
    
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_args()
    
    if args.command == "list":
        list_assistants()
    elif args.command == "create":
        create_assistant()
    elif args.command == "update":
        update_assistant(args.id if hasattr(args, "id") else None)
    elif args.command == "test":
        test_assistant(args.id if hasattr(args, "id") else None)
    elif args.command == "save":
        save_assistant_id(args.id, args.name)
    else:
        print("No command specified. Use --help for usage information.")
        list_assistants()