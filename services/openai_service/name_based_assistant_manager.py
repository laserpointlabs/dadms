"""
Name-Based Assistant Manager

This module manages OpenAI assistants using name-based discovery instead of storing IDs locally.
All assistant operations are performed by looking up the assistant by name from the config.
"""
import os
import json
import logging
import subprocess
import sys
from typing import Dict, List, Optional, Any
from datetime import datetime
import openai
from services.openai_service import config

logger = logging.getLogger(__name__)

class NameBasedAssistantManager:
    """
    Manages OpenAI assistant using name-based discovery.
    No local ID storage - everything is discovered dynamically from OpenAI.
    """
    
    def __init__(self, client: openai.OpenAI, assistant_name: str = None, assistant_model: str = None, assistant_instructions: str = None):
        self.client = client
        # Use provided parameters or fall back to config defaults
        self.assistant_name = assistant_name or config.ASSISTANT_NAME
        self.assistant_model = assistant_model or config.ASSISTANT_MODEL
        self.assistant_instructions = assistant_instructions or config.ASSISTANT_INSTRUCTIONS
        
        # Cache for current session (cleared on restart)
        self._session_cache = {
            "assistant": None,
            "vector_stores": None,
            "thread_id": None
        }
        
        logger.info(f"Initialized NameBasedAssistantManager for assistant: {self.assistant_name}")
    
    def find_assistant_by_name(self, name: str = None):
        """
        Find assistant by name on OpenAI.
        
        Args:
            name: Assistant name to search for (defaults to config name)
            
        Returns:
            Assistant object if found, None otherwise
        """
        search_name = name or self.assistant_name
        
        try:
            # Check session cache first
            if self._session_cache["assistant"] and self._session_cache["assistant"].name == search_name:
                return self._session_cache["assistant"]
            
            # Search for assistant by name
            assistants = self.client.beta.assistants.list(order="desc", limit=100)
            
            for assistant in assistants.data:
                if assistant.name == search_name:
                    logger.info(f"Found assistant '{search_name}' with ID: {assistant.id}")
                    self._session_cache["assistant"] = assistant
                    return assistant
            
            logger.info(f"No assistant found with name: {search_name}")
            return None
            
        except Exception as e:
            logger.error(f"Error searching for assistant by name: {e}")
            return None
    
    def get_or_create_assistant(self):
        """
        Get existing assistant by name or create a new one.
        
        Returns:
            Assistant object
        """
        # Try to find existing assistant
        assistant = self.find_assistant_by_name()
        
        if assistant:
            logger.info(f"Using existing assistant: {assistant.name} ({assistant.id})")
            return assistant
        
        # Create new assistant
        logger.info(f"Creating new assistant: {self.assistant_name}")
        try:
            assistant = self.client.beta.assistants.create(
                name=self.assistant_name,
                instructions=self.assistant_instructions,
                model=self.assistant_model,
                tools=[{"type": "file_search"}]
            )
            
            logger.info(f"Created new assistant: {assistant.name} ({assistant.id})")
            self._session_cache["assistant"] = assistant
            return assistant
            
        except Exception as e:
            logger.error(f"Error creating assistant: {e}")
            return None
    def get_assistant_vector_stores(self, assistant_id: str = None) -> List[Any]:
        """
        Get all vector stores associated with the assistant.
        
        Args:
            assistant_id: Assistant ID (will be discovered if not provided)
            
        Returns:
            List of vector store objects
        """
        if not assistant_id:
            assistant = self.get_or_create_assistant()
            if not assistant:
                return []
            assistant_id = assistant.id
        
        try:
            # Check session cache
            if self._session_cache["vector_stores"] is not None:
                return self._session_cache["vector_stores"]            # Get assistant details to find vector stores
            assistant = self.client.beta.assistants.retrieve(assistant_id)
            vector_store_ids = []
            
            # Extract vector store IDs from assistant tool_resources
            if assistant.tool_resources:
                if hasattr(assistant.tool_resources, 'file_search'):
                    if assistant.tool_resources.file_search:
                        if hasattr(assistant.tool_resources.file_search, 'vector_store_ids'):
                            vector_store_ids = assistant.tool_resources.file_search.vector_store_ids or []
                            logger.info(f"Found {len(vector_store_ids)} vector store IDs in assistant tool_resources")
                        else:
                            logger.info("No vector_store_ids attribute in file_search")
                    else:
                        logger.info("file_search is None")
                else:
                    logger.info("No file_search attribute in tool_resources")
            else:
                logger.info("No tool_resources found in assistant")# Get vector store details
            vector_stores = []
            for vs_id in vector_store_ids:
                try:
                    vs = self.client.vector_stores.retrieve(vs_id)
                    vector_stores.append(vs)
                    logger.info(f"Found vector store: {vs.name} ({vs.id})")
                except Exception as e:
                    logger.warning(f"Could not retrieve vector store {vs_id}: {e}")
            
            self._session_cache["vector_stores"] = vector_stores
            return vector_stores
            
        except Exception as e:
            logger.error(f"Error getting vector stores for assistant: {e}")
            return []
    
    def get_assistant_files(self, assistant_id: str = None) -> List[Dict[str, Any]]:
        """
        Get all files associated with the assistant through its vector stores.
        
        Args:
            assistant_id: Assistant ID (will be discovered if not provided)
            
        Returns:
            List of file objects        """
        vector_stores = self.get_assistant_vector_stores(assistant_id)
        all_files = []
        
        for vs in vector_stores:
            try:
                files = self.client.vector_stores.files.list(vector_store_id=vs.id)
                for file in files.data:
                    try:
                        file_details = self.client.files.retrieve(file.id)
                        all_files.append({
                            "id": file.id,
                            "filename": file_details.filename,
                            "status": file.status,
                            "vector_store_id": vs.id,
                            "vector_store_name": vs.name
                        })
                    except Exception as e:
                        logger.warning(f"Could not retrieve file details for {file.id}: {e}")
                        
            except Exception as e:
                logger.warning(f"Could not retrieve files from vector store {vs.id}: {e}")
        
        return all_files
    
    def create_or_get_vector_store(self, assistant_id: str = None) -> Optional[Any]:
        """
        Create a new vector store or get existing one for the assistant.
        
        Args:
            assistant_id: Assistant ID (will be discovered if not provided)
            
        Returns:
            Vector store object
        """
        if not assistant_id:
            assistant = self.get_or_create_assistant()
            if not assistant:
                return None
            assistant_id = assistant.id
        
        # Check if assistant already has vector stores
        existing_stores = self.get_assistant_vector_stores(assistant_id)
        if existing_stores:
            logger.info(f"Using existing vector store: {existing_stores[0].name}")
            return existing_stores[0]
        
        # Create new vector store
        try:
            vs_name = f"DADM Assistant Vector Store - {assistant_id[:8]}"
            vector_store = self.client.vector_stores.create(
                name=vs_name,
                file_ids=[]
            )
            
            # Attach vector store to assistant
            self.client.beta.assistants.update(
                assistant_id=assistant_id,
                tools=[{"type": "file_search"}],
                tool_resources={
                    "file_search": {
                        "vector_store_ids": [vector_store.id]
                    }
                }
            )
            
            logger.info(f"Created and attached vector store: {vs_name} ({vector_store.id})")
            
            # Clear cache to force refresh
            self._session_cache["vector_stores"] = None
            
            return vector_store
            
        except Exception as e:
            logger.error(f"Error creating vector store: {e}")
            return None
    
    def upload_files_to_assistant(self, file_paths: List[str], replace_existing: bool = False) -> Dict[str, Any]:
        """
        Upload files to the assistant's vector store.
        
        Args:
            file_paths: List of file paths to upload
            replace_existing: Whether to replace existing files
            
        Returns:
            Dict with upload results
        """
        assistant = self.get_or_create_assistant()
        if not assistant:
            return {"success": False, "error": "Could not get or create assistant"}
        
        # Get or create vector store
        vector_store = self.create_or_get_vector_store(assistant.id)
        if not vector_store:
            return {"success": False, "error": "Could not get or create vector store"}
        
        results = {
            "success": True,
            "uploaded_files": [],
            "errors": [],
            "vector_store_id": vector_store.id
        }
        
        for file_path in file_paths:
            try:
                if not os.path.exists(file_path):
                    results["errors"].append(f"File not found: {file_path}")
                    continue
                
                # Upload file to OpenAI
                with open(file_path, 'rb') as f:
                    file_obj = self.client.files.create(
                        file=f,
                        purpose='assistants'
                    )
                
                # Add file to vector store
                self.client.vector_stores.files.create(
                    vector_store_id=vector_store.id,
                    file_id=file_obj.id
                )
                
                results["uploaded_files"].append({
                    "file_id": file_obj.id,
                    "filename": os.path.basename(file_path),
                    "file_path": file_path
                })
                
                logger.info(f"Uploaded file: {os.path.basename(file_path)} ({file_obj.id})")
                
            except Exception as e:
                error_msg = f"Error uploading {file_path}: {e}"
                logger.error(error_msg)
                results["errors"].append(error_msg)
        
        if results["errors"]:
            results["success"] = len(results["uploaded_files"]) > 0
        
        return results
    
    def create_thread(self) -> Optional[str]:
        """
        Create a new thread for conversations.
        
        Returns:
            Thread ID if successful, None otherwise
        """
        try:
            thread = self.client.beta.threads.create()
            # Don't cache thread ID since we want new threads for each task
            logger.info(f"Created new thread: {thread.id}")
            return thread.id
        except Exception as e:
            logger.error(f"Error creating thread: {e}")
            return None
      
    def _cancel_active_runs(self, thread_id: str) -> bool:
        """Cancel any active runs on a thread"""
        try:
            runs = self.client.beta.threads.runs.list(thread_id=thread_id)
            active_runs = [run for run in runs.data if run.status in ["queued", "in_progress"]]
            
            for run in active_runs:
                try:
                    logger.info(f"Cancelling active run {run.id} on thread {thread_id}")
                    self.client.beta.threads.runs.cancel(thread_id=thread_id, run_id=run.id)
                    # Wait a moment for cancellation to process
                    import time
                    time.sleep(1)
                except Exception as e:
                    logger.warning(f"Could not cancel run {run.id}: {e}")
            
            return len(active_runs) == 0 or all(
                self.client.beta.threads.runs.retrieve(thread_id=thread_id, run_id=run.id).status 
                not in ["queued", "in_progress"] 
                for run in active_runs
            )
        except Exception as e:
            logger.error(f"Error checking/cancelling active runs: {e}")
            return False

    def process_task(self, task_name: str, task_documentation: str = "", variables: Dict = None) -> Dict[str, Any]:
        """
        Process a task using the assistant.
        
        Args:
            task_name: Name of the task
            task_documentation: Task documentation/instructions
            variables: Task variables
            
        Returns:
            Task result
        """
        assistant = self.get_or_create_assistant()
        if not assistant:
            return {"error": "Could not get or create assistant"}
        
        # Always create a new thread for each task to avoid conflicts
        thread_id = self.create_thread()
        if not thread_id:
            return {"error": "Could not create thread"}
        
        try:
            # Cancel any active runs on this thread (shouldn't be any since it's new, but safety check)
            self._cancel_active_runs(thread_id)
            
            # Prepare message content
            content = f"Task: {task_name}\n\n"
            if task_documentation:
                content += f"Instructions: {task_documentation}\n\n"
            if variables:
                content += f"Context Variables:\n{json.dumps(variables, indent=2)}\n\n"
            content += "Please process this task according to the instructions."
            
            # Create message
            self.client.beta.threads.messages.create(
                thread_id=thread_id,
                role="user",
                content=content
            )
            
            # Run assistant
            run = self.client.beta.threads.runs.create(
                thread_id=thread_id,
                assistant_id=assistant.id
            )
            
            # Wait for completion with timeout
            import time
            max_wait_time = 120  # 2 minutes timeout
            start_time = time.time()
            
            while run.status in ['queued', 'in_progress']:
                if time.time() - start_time > max_wait_time:
                    # Cancel the run and return timeout error
                    try:
                        self.client.beta.threads.runs.cancel(thread_id=thread_id, run_id=run.id)
                    except:
                        pass
                    return {"error": f"Task timed out after {max_wait_time} seconds"}
                
                time.sleep(1)
                run = self.client.beta.threads.runs.retrieve(
                    thread_id=thread_id,
                    run_id=run.id
                )
            
            if run.status == 'completed':
                # Get assistant's response
                messages = self.client.beta.threads.messages.list(
                    thread_id=thread_id,
                    order="desc",
                    limit=1
                )
                if messages.data:
                    message = messages.data[0]
                    if message.content:
                        content_block = message.content[0]
                        # Only process if the content block is of type 'text'
                        if getattr(content_block, "type", None) == "text" and hasattr(content_block, "text"):
                            response = content_block.text.value

                            # Truncate response if it's too long for Camunda's database
                            # H2 database has VARCHAR(4000) limit for TEXT_ column
                            MAX_RESPONSE_LENGTH = 3800  # Leave some buffer for encoding

                            if len(response) > MAX_RESPONSE_LENGTH:
                                logger.warning(f"Response length ({len(response)}) exceeds database limit. Truncating to {MAX_RESPONSE_LENGTH} characters.")
                                truncated_response = response[:MAX_RESPONSE_LENGTH]
                                # Try to truncate at a sentence boundary if possible
                                last_period = truncated_response.rfind('.')
                                last_newline = truncated_response.rfind('\n')
                                cut_point = max(last_period, last_newline)
                                
                                if cut_point > MAX_RESPONSE_LENGTH * 0.8:
                                    truncated_response = truncated_response[:cut_point + 1]
                                    truncated_response += "\n\n[Response truncated due to length constraints]"
                                    response = truncated_response

                            return {
                                "processed_by": f"OpenAI Assistant ({assistant.name})",
                                "processed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                                "recommendation": response,
                                "assistant_id": assistant.id,
                                "thread_id": thread_id
                            }
            
            # If run failed, get detailed error information
            error_details = {
                "status": run.status,
                "run_id": run.id
            }
            
            # Check if there are specific error details available
            if hasattr(run, 'last_error') and run.last_error:
                error_details["last_error"] = {
                    "code": run.last_error.code,
                    "message": run.last_error.message
                }
                logger.error(f"Assistant run failed: {run.last_error.code} - {run.last_error.message}")
            
            if hasattr(run, 'required_action') and run.required_action:
                error_details["required_action"] = str(run.required_action)
                logger.error(f"Assistant run requires action: {run.required_action}")
            
            return {
                "error": f"Assistant run failed with status: {run.status}",
                "details": error_details
            }
            
        except Exception as e:
            logger.error(f"Error processing task: {e}")
            return {"error": str(e)}
    
    def process_simple_task(self, task_description: str) -> Dict[str, Any]:
        """
        Process a simple task using the assistant.
        
        Args:
            task_description: Description of the task to process
            
        Returns:
            Task result
        """
        return self.process_task(
            task_name="User Task",
            task_documentation=task_description,
            variables=None
        )
    
    def get_service_status(self) -> Dict[str, Any]:
        """
        Get current service status including assistant info.
        
        Returns:
            Service status dict
        """
        assistant = self.find_assistant_by_name()
        
        status = {
            "assistant_name": self.assistant_name,
            "assistant_found": assistant is not None,
            "assistant_id": assistant.id if assistant else None,
            "model": self.assistant_model,
        }
        
        if assistant:
            vector_stores = self.get_assistant_vector_stores(assistant.id)
            files = self.get_assistant_files(assistant.id)
            
            status.update({
                "vector_stores_count": len(vector_stores),
                "files_count": len(files),
                "vector_stores": [{"id": vs.id, "name": vs.name} for vs in vector_stores],
                "files": files
            })
        
        return status
    
    def cleanup_assistant(self, assistant_name: str = None) -> Dict[str, Any]:
        """
        Clean up assistant and all associated resources.
        
        Args:
            assistant_name: Name of assistant to clean up (defaults to config name)
            
        Returns:
            Cleanup results
        """
        search_name = assistant_name or self.assistant_name
        assistant = self.find_assistant_by_name(search_name)
        
        if not assistant:
            return {"success": False, "message": f"No assistant found with name: {search_name}"}
        
        results = {
            "success": True,
            "deleted_vector_stores": [],
            "deleted_files": [],
            "assistant_deleted": False,
            "errors": []
        }
        
        try:
            # Get and delete vector stores and files
            vector_stores = self.get_assistant_vector_stores(assistant.id)
            
            for vs in vector_stores:
                try:
                    # Delete files in vector store
                    files = self.client.vector_stores.files.list(vector_store_id=vs.id)
                    for file in files.data:
                        try:
                            self.client.files.delete(file.id)
                            results["deleted_files"].append(file.id)
                        except Exception as e:
                            results["errors"].append(f"Error deleting file {file.id}: {e}")
                    
                    # Delete vector store
                    self.client.vector_stores.delete(vs.id)
                    results["deleted_vector_stores"].append(vs.id)
                    
                except Exception as e:
                    results["errors"].append(f"Error deleting vector store {vs.id}: {e}")
            
            # Delete assistant
            self.client.beta.assistants.delete(assistant.id)
            results["assistant_deleted"] = True
            
            # Clear session cache
            self._session_cache = {"assistant": None, "vector_stores": None, "thread_id": None}
            
            logger.info(f"Successfully cleaned up assistant: {search_name}")
            
        except Exception as e:
            error_msg = f"Error during cleanup: {e}"
            logger.error(error_msg)
            results["errors"].append(error_msg)
            results["success"] = False
        
        return results
    
    def get_session_thread_id(self) -> Optional[str]:
        """
        Get the current thread ID from session cache.
        
        Returns:
            Thread ID if available, None otherwise
        """
        return self._session_cache.get("thread_id")
    
    def upload_file(self, file_obj) -> Dict[str, Any]:
        """
        Upload a single file and associate it with the assistant.
        
        Args:
            file_obj: File object to upload
            
        Returns:
            Upload result dictionary
        """
        try:
            # Upload file to OpenAI
            uploaded_file = self.client.files.create(
                file=file_obj,
                purpose='assistants'
            )
            
            # Get or create assistant
            assistant = self.get_or_create_assistant()
            if not assistant:
                return {
                    "filename": file_obj.filename,
                    "status": "error",
                    "message": "Could not find or create assistant"
                }
            
            # Get or create vector store for the assistant
            vector_store = self.create_or_get_vector_store(assistant.id)
            if not vector_store:
                return {
                    "filename": file_obj.filename,
                    "status": "error",
                    "message": "Could not create or get vector store"
                }
              # Add file to vector store
            vs_file = self.client.vector_stores.files.create(
                vector_store_id=vector_store.id,
                file_id=uploaded_file.id
            )
            
            logger.info(f"Successfully uploaded file: {file_obj.filename} ({uploaded_file.id})")
            
            return {
                "filename": file_obj.filename,
                "file_id": uploaded_file.id,
                "vector_store_id": vector_store.id,
                "status": "success"
            }
            
        except Exception as e:
            logger.error(f"Error uploading file {file_obj.filename}: {e}")
            return {
                "filename": file_obj.filename,
                "status": "error",
                "message": str(e)
            }
    
    def clear_cache(self):
        """
        Clear all cached data to force fresh discovery on next access.
        """
        self._session_cache = {
            "assistant": None,
            "vector_stores": None,
            "thread_id": None
        }
        logger.info("Cleared all cached data")
    
    def refresh_cache(self):
        """
        Clear cache and refresh with current data from OpenAI.
        """
        self.clear_cache()
        
        # Force refresh by getting assistant and vector stores
        assistant = self.find_assistant_by_name()
        if assistant:
            vector_stores = self.get_assistant_vector_stores(assistant.id)
            logger.info(f"Refreshed cache: assistant {assistant.id}, {len(vector_stores)} vector stores")
        else:
            logger.info("Refreshed cache: no assistant found")
    
    def is_assistant_ready(self) -> Dict[str, Any]:
        """
        Check if assistant, vector store, and files are all properly set up.
        
        Returns:
            Dict containing readiness status and details
        """
        status = {
            "ready": False,
            "assistant_exists": False,
            "vector_store_exists": False,
            "files_exist": False,
            "details": {}
        }
        
        try:
            # Check if assistant exists
            assistant = self.find_assistant_by_name()
            if assistant:
                status["assistant_exists"] = True
                status["details"]["assistant_id"] = assistant.id
                
                # Check if vector stores exist
                vector_stores = self.get_assistant_vector_stores(assistant.id)
                if vector_stores:
                    status["vector_store_exists"] = True
                    status["details"]["vector_stores"] = len(vector_stores)
                    
                    # Check if files exist in vector stores
                    files = self.get_assistant_files(assistant.id)
                    if files:
                        status["files_exist"] = True
                        status["details"]["files_count"] = len(files)
                        status["ready"] = True
                    else:
                        status["details"]["files_count"] = 0
                else:
                    status["details"]["vector_stores"] = 0
            
            return status
            
        except Exception as e:
            logger.error(f"Error checking assistant readiness: {e}")
            status["details"]["error"] = str(e)
            return status
    
    def ensure_assistant_ready(self) -> Dict[str, Any]:
        """
        Ensure assistant is ready by running rebuild script if necessary.
        
        Returns:
            Dict containing the operation result
        """
        readiness = self.is_assistant_ready()
        
        if readiness["ready"]:
            logger.info("Assistant is already ready")
            return {
                "success": True,
                "message": "Assistant is already ready",
                "action": "none",
                "details": readiness["details"]
            }
        
        logger.info(f"Assistant not ready. Status: {readiness}")
        logger.info("Running rebuild_assistant.py to ensure complete setup")
        
        try:
            # Get the path to rebuild_assistant.py
            current_dir = os.path.dirname(os.path.abspath(__file__))
            rebuild_script = os.path.join(current_dir, "rebuild_assistant.py")
            
            if not os.path.exists(rebuild_script):
                return {
                    "success": False,
                    "message": f"Rebuild script not found at {rebuild_script}",
                    "action": "error"
                }
              # Run the rebuild script with auto-confirm flag
            logger.info(f"Executing rebuild script: {rebuild_script}")
            result = subprocess.run(
                [sys.executable, rebuild_script, "--auto-confirm"],
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode == 0:
                logger.info("Rebuild script completed successfully")
                
                # Clear cache and refresh with new data
                self.refresh_cache()
                
                # Check readiness again
                new_readiness = self.is_assistant_ready()
                
                return {
                    "success": True,
                    "message": "Assistant rebuild completed successfully",
                    "action": "rebuild",
                    "details": new_readiness["details"],
                    "ready": new_readiness["ready"]
                }
            else:
                logger.error(f"Rebuild script failed with return code {result.returncode}")
                logger.error(f"STDOUT: {result.stdout}")
                logger.error(f"STDERR: {result.stderr}")
                
                return {
                    "success": False,
                    "message": f"Rebuild script failed: {result.stderr}",
                    "action": "rebuild_failed",
                    "stdout": result.stdout,
                    "stderr": result.stderr
                }
                
        except subprocess.TimeoutExpired:
            logger.error("Rebuild script timed out after 5 minutes")
            return {
                "success": False,
                "message": "Rebuild script timed out after 5 minutes",
                "action": "timeout"
            }
        except Exception as e:
            logger.error(f"Error running rebuild script: {e}")
            return {
                "success": False,
                "message": f"Error running rebuild script: {str(e)}",
                "action": "error"
            }
