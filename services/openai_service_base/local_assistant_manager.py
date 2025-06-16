"""
Local Assistant Manager for OpenAI Service

This is a simplified assistant manager that only depends on local service configuration
and is fully decoupled from the top-level application.
"""
import os
import time
import json
import logging
from pathlib import Path
from openai import OpenAI
from datetime import datetime
from typing import Optional, List, Dict, Any

from services.openai_service import config

logger = logging.getLogger(__name__)

class SimpleIdManager:
    """Simple ID manager for assistant verification"""
    
    def __init__(self, client: OpenAI):
        self.client = client
    
    def verify_and_correct_assistant_id(self, assistant_name: str, client: OpenAI) -> tuple[bool, Optional[str]]:
        """
        Verify if the current assistant ID is valid
        
        Args:
            assistant_name: Name of the assistant to verify
            client: OpenAI client
            
        Returns:
            Tuple of (is_valid, assistant_id)
        """
        try:
            # Get stored assistant ID
            metadata_file = os.path.join(os.path.dirname(__file__), "assistant_metadata.json")
            assistant_id = None
            
            if os.path.exists(metadata_file):
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
                    assistant_id = metadata.get('assistant_id')
            
            if not assistant_id:
                return False, None
                
            # Try to retrieve the assistant
            assistant = client.beta.assistants.retrieve(assistant_id)
            
            # Check if the name matches
            if assistant.name == assistant_name:
                return True, assistant_id
            else:
                logger.warning(f"Assistant name mismatch: expected {assistant_name}, got {assistant.name}")
                return False, assistant_id
                
        except Exception as e:
            logger.error(f"Error verifying assistant ID: {e}")
            return False, None

class LocalAssistantManager:
    """
    Simplified Assistant Manager for the decoupled OpenAI service
    """      
    
    def __init__(self, data_dir: Optional[str] = None):
        """
        Initialize the LocalAssistantManager
        
        Args:
            data_dir: Path to the directory containing files to upload to the assistant
        """
        # Check for API key
        if not config.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        
        # Initialize OpenAI client
        self.client = OpenAI(api_key=config.OPENAI_API_KEY)
        
        # Initialize ID manager
        self.id_manager = SimpleIdManager(self.client)
        
        # Set data directory
        self.data_dir = data_dir or os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
        
        # Initialize attributes
        self.assistant_id = None
        self.thread_id = None
        self.file_ids = []
        
        # Initialize file manager for vector stores
        from src.rag_file_manager import RAGFileManager
        self.file_manager = RAGFileManager(client=self.client, data_dir=self.data_dir)
        
        # Initialize the assistant
        self._initialize_assistant()
    
    def _initialize_assistant(self):
        """Initialize or retrieve the assistant"""
        try:
            # Try to get existing assistant ID from metadata
            assistant_id = self._get_stored_assistant_id()
            
            if assistant_id:
                # Verify the assistant exists
                try:
                    assistant = self.client.beta.assistants.retrieve(assistant_id)
                    self.assistant_id = assistant_id
                    logger.info(f"Using existing assistant: {assistant_id}")
                except Exception as e:
                    logger.warning(f"Stored assistant {assistant_id} not found, creating new one: {e}")
                    assistant_id = None
            
            if not assistant_id:
                # Create new assistant
                self.assistant_id = self._create_assistant()
                self._store_assistant_id(self.assistant_id)
                
            # Initialize thread
            if not self.thread_id:
                thread = self.client.beta.threads.create()
                self.thread_id = thread.id
                logger.info(f"Created thread: {self.thread_id}")
                
            # Upload files from data directory
            self._upload_files_from_data_dir()
            
        except Exception as e:
            logger.error(f"Error initializing assistant: {e}")
            raise
    
    def _create_assistant(self) -> str:
        """Create a new assistant"""
        try:
            assistant = self.client.beta.assistants.create(
                name=config.ASSISTANT_NAME,
                instructions=config.ASSISTANT_INSTRUCTIONS,
                model=config.ASSISTANT_MODEL,
                tools=[{"type": "file_search"}]
            )
            logger.info(f"Created assistant: {assistant.id}")
            return assistant.id
        except Exception as e:
            logger.error(f"Error creating assistant: {e}")
            raise
    
    def _upload_files_from_data_dir(self):
        """Upload files from the data directory and ensure they're attached"""
        try:
            if not os.path.exists(self.data_dir):
                logger.warning(f"Data directory {self.data_dir} does not exist")
                return
                
            if not self.assistant_id:
                logger.warning("Cannot upload files: assistant_id is not set")
                return
                  # Use the file manager to handle uploads and vector store association
            result = self.file_manager.ensure_files_attached(self.assistant_id)
            
            if result.get("success"):
                # Get the file IDs from the file manager
                self.file_ids = self.file_manager.get_file_ids_for_assistant(self.assistant_id)
                logger.info(f"Successfully attached {len(self.file_ids)} files to assistant")
            else:
                logger.error(f"Failed to attach files: {result.get('error', 'Unknown error')}")
                
        except Exception as e:
            logger.error(f"Error uploading files: {e}")

    def _get_stored_assistant_id(self) -> Optional[str]:
        """Get stored assistant ID from local metadata"""
        metadata_file = os.path.join(os.path.dirname(__file__), "assistant_metadata.json")
        
        # First try local assistant_metadata.json
        try:
            if os.path.exists(metadata_file):
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
                    assistant_id = metadata.get('assistant_id')
                    if assistant_id:
                        logger.info(f"Found assistant ID in local metadata: {assistant_id}")
                        return assistant_id
        except Exception as e:
            logger.warning(f"Could not read local assistant metadata: {e}")
        
        # Also try the service metadata file
        service_metadata_file = config.METADATA_FILE
        try:
            if os.path.exists(service_metadata_file):
                with open(service_metadata_file, 'r') as f:
                    metadata = json.load(f)
                    assistant_id = metadata.get('assistant_id')
                    if assistant_id:
                        logger.info(f"Found assistant ID in service metadata: {assistant_id}")
                        return assistant_id
        except Exception as e:
            logger.warning(f"Could not read service metadata: {e}")
        
        logger.warning("No stored assistant ID found in either metadata file")
        return None
    
    def _store_assistant_id(self, assistant_id: str):
        """Store assistant ID in local metadata"""
        metadata_file = os.path.join(os.path.dirname(__file__), "assistant_metadata.json")
        try:
            metadata = {'assistant_id': assistant_id, 'updated': datetime.now().isoformat()}
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)
            logger.info(f"Stored assistant ID: {assistant_id}")
        except Exception as e:
            logger.error(f"Could not store assistant metadata: {e}")
    
    def process_request(self, user_input: str, timeout: int = 30) -> Dict[str, Any]:
        """
        Process a user request using the assistant
        
        Args:
            user_input: The user's input/question
            timeout: Maximum time to wait for response in seconds
            
        Returns:
            Dictionary with response and metadata
        """
        try:
            if not self.thread_id or not self.assistant_id:
                return {
                    "status": "error",
                    "message": "Assistant or thread not properly initialized"
                }
            
            # Add message to thread
            message = self.client.beta.threads.messages.create(
                thread_id=self.thread_id,
                role="user",
                content=user_input
            )
            
            # Create and run the assistant
            run = self.client.beta.threads.runs.create(
                thread_id=self.thread_id,
                assistant_id=self.assistant_id
            )
            
            # Wait for completion
            start_time = time.time()
            while time.time() - start_time < timeout:
                run_status = self.client.beta.threads.runs.retrieve(
                    thread_id=self.thread_id,
                    run_id=run.id
                )
                
                if run_status.status == 'completed':
                    # Get the response
                    messages = self.client.beta.threads.messages.list(
                        thread_id=self.thread_id,
                        limit=1
                    )
                    
                    if messages.data and messages.data[0].content:
                        # Handle different content types safely
                        content_block = messages.data[0].content[0]
                        response_content = "No text content available"
                        
                        # Try to extract text content safely with type checking
                        if hasattr(content_block, 'type') and content_block.type == 'text':
                            if hasattr(content_block, 'text') and hasattr(content_block.text, 'value'):
                                response_content = content_block.text.value
                        
                        return {
                            "status": "success",
                            "response": response_content,
                            "run_id": run.id
                        }
                    else:
                        return {
                            "status": "error",
                            "message": "No response received"
                        }
                        
                elif run_status.status in ['failed', 'cancelled', 'expired']:
                    return {
                        "status": "error",
                        "message": f"Run {run_status.status}: {getattr(run_status, 'last_error', 'Unknown error')}"
                    }
                
                time.sleep(1)
            
            return {
                "status": "timeout",
                "message": f"Request timed out after {timeout} seconds"
            }
            
        except Exception as e:
            logger.error(f"Error processing request: {e}")
            return {
                "status": "error",
                "message": str(e)
            }
    
    def process_task(self, task_name: str, task_documentation: str, variables: Dict[str, Any]) -> str:
        """
        Process a task using the assistant (matches the interface expected by service.py)
        
        Args:
            task_name: Name of the task
            task_documentation: Documentation for the task
            variables: Variables/context for the task
            
        Returns:
            String response from the assistant
        """
        try:
            # Construct the user input from task information
            user_input = f"""
Task: {task_name}

Documentation: {task_documentation}

Variables: {json.dumps(variables, indent=2)}

Please analyze this task and provide recommendations based on the available documentation and context.
"""
            
            # Use the existing process_request method
            result = self.process_request(user_input)
            
            if result.get("status") == "success":
                return result.get("response", "No response received")
            else:
                raise Exception(f"Task processing failed: {result.get('message', 'Unknown error')}")
                
        except Exception as e:
            logger.error(f"Error processing task {task_name}: {e}")
            raise
