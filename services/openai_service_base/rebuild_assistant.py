#!/usr/bin/env python3
"""
Rebuild Assistant Script

This script will:
1. Load assistant configuration from service_config.json
2. Delete the existing assistant and all associated resources (vector stores, files)
3. Create a new assistant with the same name
4. Create a new vector store
5. Upload files from the data directory

This ensures a clean rebuild of the entire assistant infrastructure.
"""
import os
import json
import sys
import time
import logging
import argparse
from pathlib import Path

# Add the project root to the Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, project_root)

import openai

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AssistantRebuilder:
    """Handles complete deletion and recreation of OpenAI assistant resources"""
    
    def __init__(self):
        """Initialize the rebuilder with OpenAI client and configuration"""
        self.client = openai.OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))
        self.config = self.load_service_config()
        
        # Extract assistant configuration
        assistant_config = self.config.get('assistant', {})
        self.assistant_name = assistant_config.get('name', 'DADM Decision Analysis Assistant')
        self.assistant_model = assistant_config.get('model', 'gpt-4o')
        self.assistant_instructions = assistant_config.get('instructions', self.get_default_instructions())
        
        # Data directory with files to upload
        self.data_dir = os.path.join(os.path.dirname(__file__), 'data')
        
        logger.info(f"Initialized AssistantRebuilder for: {self.assistant_name}")
    
    def load_service_config(self):
        """Load service configuration from service_config.json"""
        config_path = os.path.join(os.path.dirname(__file__), "service_config.json")
        try:
            with open(config_path, 'r') as f:
                config_data = json.load(f)
                return config_data.get('service', {})
        except Exception as e:
            logger.error(f"Could not load service config from {config_path}: {e}")
            return {}
    
    def get_default_instructions(self):
        """Get default assistant instructions"""
        return """You are a Decision Analysis Assistant specialized in helping analyze complex decisions.

Follow these guidelines when processing tasks:
1. Carefully read and understand the context and task instructions
2. Break down complex decisions into clear components
3. Consider all stakeholders mentioned in the context
4. Think about both immediate and long-term implications
5. Consider different alternatives and their trade-offs
6. When evaluating options, explicitly state the criteria used
7. Provide structured and organized responses
8. Format your responses based on the specific instructions given for each task
9. Always provide reasoning for your recommendations
10. Be clear, concise, and objective in your analysis

Work through the decision process step-by-step, maintaining context from previous tasks
in the workflow."""
    
    def find_assistant_by_name(self, name):
        """Find an assistant by name"""
        try:
            assistants = self.client.beta.assistants.list()
            for assistant in assistants.data:
                if assistant.name == name:
                    return assistant
            return None
        except Exception as e:
            logger.error(f"Error finding assistant by name '{name}': {e}")
            return None
    
    def delete_assistant_resources(self, assistant_id):
        """Delete all resources associated with an assistant"""
        logger.info(f"Deleting all resources for assistant {assistant_id}")
        
        # Get and delete vector stores
        try:
            vector_stores = self.client.vector_stores.list()
            for vs in vector_stores.data:
                # Check if this vector store is associated with the assistant
                try:
                    # Get assistant to check tool resources
                    assistant = self.client.beta.assistants.retrieve(assistant_id)
                    if hasattr(assistant, 'tool_resources') and assistant.tool_resources:
                        if hasattr(assistant.tool_resources, 'file_search') and assistant.tool_resources.file_search:
                            if hasattr(assistant.tool_resources.file_search, 'vector_store_ids'):
                                vector_store_ids = assistant.tool_resources.file_search.vector_store_ids
                                if vector_store_ids is not None and vs.id in vector_store_ids:
                                    logger.info(f"Deleting vector store: {vs.id} ({vs.name})")
                                    self.client.vector_stores.delete(vs.id)
                except Exception as e:
                    logger.warning(f"Error checking/deleting vector store {vs.id}: {e}")
        except Exception as e:
            logger.warning(f"Error listing vector stores: {e}")
        
        # Delete all files (OpenAI files are global, so we'll delete ones that might be associated)
        try:
            files = self.client.files.list()
            for file in files.data:
                if file.purpose == 'assistants':
                    try:
                        logger.info(f"Deleting file: {file.id} ({file.filename})")
                        self.client.files.delete(file.id)
                    except Exception as e:
                        logger.warning(f"Error deleting file {file.id}: {e}")
        except Exception as e:
            logger.warning(f"Error listing files: {e}")
        
        # Finally, delete the assistant
        try:
            logger.info(f"Deleting assistant: {assistant_id}")
            self.client.beta.assistants.delete(assistant_id)
            logger.info("Assistant deleted successfully")
        except Exception as e:
            logger.error(f"Error deleting assistant: {e}")
    
    def create_new_assistant(self):
        """Create a new assistant with the configured settings"""
        logger.info(f"Creating new assistant: {self.assistant_name}")
        
        try:
            assistant = self.client.beta.assistants.create(
                name=self.assistant_name,
                model=self.assistant_model,
                instructions=self.assistant_instructions,
                tools=[{"type": "file_search"}]
            )
            logger.info(f"Created new assistant: {assistant.id} ({assistant.name})")
            return assistant
        except Exception as e:
            logger.error(f"Error creating assistant: {e}")
            return None
    
    def create_vector_store(self, assistant):
        """Create a new vector store for the assistant"""
        vector_store_name = f"{self.assistant_name} Vector Store"
        logger.info(f"Creating vector store: {vector_store_name}")
        
        try:
            vector_store = self.client.vector_stores.create(
                name=vector_store_name
            )
            logger.info(f"Created vector store: {vector_store.id} ({vector_store.name})")
            
            # Associate the vector store with the assistant
            self.client.beta.assistants.update(
                assistant.id,
                tool_resources={
                    "file_search": {
                        "vector_store_ids": [vector_store.id]
                    }
                }
            )
            logger.info(f"Associated vector store with assistant")
            
            return vector_store
        except Exception as e:
            logger.error(f"Error creating vector store: {e}")
            return None
    
    def upload_files_to_vector_store(self, vector_store_id):
        """Upload all files from the data directory to the vector store"""
        if not os.path.exists(self.data_dir):
            logger.warning(f"Data directory not found: {self.data_dir}")
            return []
        
        uploaded_files = []
        
        # Find all markdown files in the data directory
        for file_path in Path(self.data_dir).glob("*.md"):
            try:
                logger.info(f"Uploading file: {file_path.name}")
                
                # Upload file to OpenAI
                with open(file_path, 'rb') as f:
                    file_obj = self.client.files.create(
                        file=f,
                        purpose='assistants'
                    )
                
                # Add file to vector store
                self.client.vector_stores.files.create(
                    vector_store_id=vector_store_id,
                    file_id=file_obj.id
                )
                
                uploaded_files.append({
                    'filename': file_path.name,
                    'file_id': file_obj.id,
                    'status': 'uploaded'
                })
                
                logger.info(f"Uploaded {file_path.name} -> {file_obj.id}")
                
            except Exception as e:
                logger.error(f"Error uploading {file_path.name}: {e}")
                uploaded_files.append({
                    'filename': file_path.name,
                    'file_id': None,
                    'status': 'error',
                    'error': str(e)
                })
        
        return uploaded_files
    
    def wait_for_vector_store_ready(self, vector_store_id, max_wait=120):
        """Wait for vector store to finish processing files"""
        logger.info(f"Waiting for vector store {vector_store_id} to be ready...")
        
        start_time = time.time()
        while time.time() - start_time < max_wait:
            try:
                vs = self.client.vector_stores.retrieve(vector_store_id)
                if vs.status == 'completed':
                    logger.info(f"Vector store is ready!")
                    return True
                elif vs.status == 'failed':
                    logger.error(f"Vector store processing failed")
                    return False
                else:
                    logger.info(f"⏳ Vector store status: {vs.status}")
                    time.sleep(5)
            except Exception as e:
                logger.error(f"Error checking vector store status: {e}")
                time.sleep(5)
        
        logger.warning(f"Vector store not ready after {max_wait} seconds")
        return False
    
    def rebuild_complete_assistant(self):
        """Complete rebuild process: delete everything and recreate"""
        logger.info("🚀 Starting complete assistant rebuild process")
        logger.info("=" * 60)
        
        # Step 1: Find existing assistant by name
        logger.info(f"Step 1: Finding existing assistant '{self.assistant_name}'")
        existing_assistant = self.find_assistant_by_name(self.assistant_name)
        
        if existing_assistant:
            logger.info(f"Found existing assistant: {existing_assistant.id}")
            # Step 2: Delete all resources
            logger.info("Step 2: Deleting existing assistant and resources")
            self.delete_assistant_resources(existing_assistant.id)
        else:
            logger.info("No existing assistant found")
        
        # Step 3: Create new assistant
        logger.info("Step 3: Creating new assistant")
        new_assistant = self.create_new_assistant()
        if not new_assistant:
            logger.error("Failed to create new assistant")
            return False
        
        # Step 4: Create vector store
        logger.info("Step 4: Creating vector store")
        vector_store = self.create_vector_store(new_assistant)
        if not vector_store:
            logger.error("Failed to create vector store")
            return False
        
        # Step 5: Upload files
        logger.info("Step 5: Uploading files to vector store")
        uploaded_files = self.upload_files_to_vector_store(vector_store.id)
        
        # Step 6: Wait for processing
        logger.info("Step 6: Waiting for vector store to process files")
        ready = self.wait_for_vector_store_ready(vector_store.id)
        
        # Summary
        logger.info("=" * 60)
        logger.info("🎉 REBUILD COMPLETE!")
        logger.info(f"Assistant ID: {new_assistant.id}")
        logger.info(f"Assistant Name: {new_assistant.name}")
        logger.info(f"Vector Store ID: {vector_store.id}")
        logger.info(f"Vector Store Name: {vector_store.name}")
        logger.info(f"Files Uploaded: {len([f for f in uploaded_files if f['status'] == 'uploaded'])}")
        logger.info(f"Vector Store Ready: {'YES' if ready else 'NO'}")
        
        # Detailed file upload results
        if uploaded_files:
            logger.info("\nFile Upload Results:")
            for file_info in uploaded_files:
                status_icon = "OK" if file_info['status'] == 'uploaded' else "FAILED"
                logger.info(f"  {status_icon} {file_info['filename']} -> {file_info.get('file_id', 'N/A')}")
        
        return True

def main():
    """Main function to run the rebuild process"""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Rebuild OpenAI Assistant')
    parser.add_argument('--auto-confirm', action='store_true', 
                        help='Skip confirmation prompt (for automated execution)')
    args = parser.parse_args()
    
    print("Assistant Rebuild Script")
    print("=" * 40)
    
    # Check for required environment variable
    if not os.environ.get('OPENAI_API_KEY'):
        print("Error: OPENAI_API_KEY environment variable is required")
        sys.exit(1)
    
    # Ask for confirmation unless auto-confirm is enabled
    if not args.auto_confirm:
        print("WARNING: This will DELETE the existing assistant and ALL associated resources!")
        print("   This includes:")
        print("   - The assistant itself")
        print("   - All vector stores associated with the assistant")
        print("   - All files with purpose 'assistants'")
        print()
        response = input("Are you sure you want to proceed? (yes/no): ").strip().lower()
        
        if response != 'yes':
            print("Operation cancelled")
            sys.exit(0)
    else:
        print("Auto-confirm mode: Proceeding with rebuild without confirmation")
    
    try:
        # Run the rebuild process
        rebuilder = AssistantRebuilder()
        success = rebuilder.rebuild_complete_assistant()
        
        if success:
            print("\nRebuild completed successfully!")
            print("The service can now be restarted to use the new assistant.")
        else:
            print("\nRebuild failed. Check the logs for details.")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"Fatal error during rebuild: {e}")
        print(f"\nFatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
