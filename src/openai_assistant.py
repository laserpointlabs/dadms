import os
import time
import json
import logging
from pathlib import Path
from openai import OpenAI
from datetime import datetime

from config import openai_config
from src.rag_file_manager import RAGFileManager

class AssistantManager:
    """
    Class to manage interactions with the OpenAI Assistant API
    
    This class handles:
    - Creating and maintaining the assistant
    - Managing threads for conversations
    - Uploading files to the assistant from the data directory
    - Processing requests and handling responses
    """      
    
    def __init__(self, data_dir=None):
        """
        Initialize the AssistantManager
        
        Args:
            data_dir: Path to the directory containing files to upload to the assistant
        """
        # Check for API key
        if not openai_config.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        
        # Initialize OpenAI client
        self.client = OpenAI(api_key=openai_config.OPENAI_API_KEY)
        
        # Set data directory
        self.data_dir = data_dir or os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
        
        # Initialize the ID manager for persistence
        try:
            from src.assistant_id_manager import AssistantIDManager
            self.id_manager = AssistantIDManager(data_dir=self.data_dir, client=self.client)
            print(f"Using AssistantIDManager for ID persistence")
        except ImportError:
            self.id_manager = None
            print("Assistant ID manager not available. IDs will not persist between sessions.")
        
        # Initialize attributes
        self.assistant_id = None
        self.thread_id = None
        self.file_ids = []
          
        # Create or retrieve assistant
        self._initialize_assistant()
        
        # Create a new thread for this session
        self._create_thread()
        
        # Verify the assistant ID is valid using centralized verification
        if self.assistant_id and self.id_manager:
            print(f"Verifying assistant ID: {self.assistant_id}")
            is_valid, verified_id = self.id_manager.verify_and_correct_assistant_id(
                openai_config.ASSISTANT_NAME, 
                self.client
            )
            
            if not is_valid:
                print("WARNING: Assistant ID verification failed. Attempting to recover...")
                # Fall back to direct recovery if verification system fails
                direct_id = self._get_direct_assistant_id()
                if direct_id:
                    self.assistant_id = direct_id
                    if self.id_manager:
                        self.id_manager.set_assistant_id(self.assistant_id, openai_config.ASSISTANT_NAME)
                    print(f"Recovered with assistant ID: {self.assistant_id}")
                else:
                    print("CRITICAL: Could not recover a valid assistant ID!")
            elif self.assistant_id != verified_id:
                print(f"Updating to verified assistant ID: {verified_id}")
                self.assistant_id = verified_id
        
        print(f"Assistant '{openai_config.ASSISTANT_NAME}' (ID: {self.assistant_id}) initialized")
        if self.file_ids:
            print(f"Uploaded {len(self.file_ids)} files to the assistant")
        print(f"Created thread ID: {self.thread_id}")
    
    def _initialize_assistant(self):
        """
        Create a new assistant or retrieve an existing one with the configured name
        """
        print("Initializing OpenAI assistant...")
        
        # Initialize the file manager for tracking files
        self.file_manager = RAGFileManager(client=self.client, data_dir=self.data_dir)
        
        # Try to get the assistant ID from the service registry
        try:
            from config.service_registry import SERVICE_REGISTRY
            registry_id = SERVICE_REGISTRY["assistant"]["openai"].get("assistant_id")
            
            if registry_id:
                print(f"Using assistant ID from service registry: {registry_id}")
                try:
                    # Try to retrieve the assistant with this ID
                    assistant = self.client.beta.assistants.retrieve(registry_id)
                    self.assistant_id = registry_id
                    
                    # Upload files with deduplication and associate with this assistant
                    self._upload_files_from_data_dir()
                    
                    # Update the existing assistant with current configuration
                    self.client.beta.assistants.update(
                        assistant_id=self.assistant_id,
                        instructions=openai_config.ASSISTANT_INSTRUCTIONS,
                        model=openai_config.ASSISTANT_MODEL,
                        tools=[{"type": "file_search"}]
                    )
                    
                    print(f"Updated assistant configuration")
                    return
                except Exception as e:
                    print(f"Error using assistant ID from registry: {e}")
        except Exception as e:
            print(f"Error accessing service registry: {e}")
        
        # Try to get saved assistant ID if we have an ID manager
        saved_assistant_id = None
        if self.id_manager:
            saved_assistant_id = self.id_manager.get_assistant_id()
            if saved_assistant_id:
                try:
                    # Try to retrieve the assistant with the saved ID
                    assistant = self.client.beta.assistants.retrieve(saved_assistant_id)
                    print(f"Using saved assistant ID: {saved_assistant_id}")
                    self.assistant_id = saved_assistant_id
                    
                    # Upload files with deduplication and associate with this assistant
                    self._upload_files_from_data_dir()
                    
                    # Update the existing assistant with current configuration
                    self.client.beta.assistants.update(
                        assistant_id=self.assistant_id,
                        instructions=openai_config.ASSISTANT_INSTRUCTIONS,
                        model=openai_config.ASSISTANT_MODEL,
                        tools=[{"type": "file_search"}]
                    )
                    
                    print(f"Updated assistant configuration")
                    return
                except Exception as e:
                    print(f"Unable to use saved assistant ID: {e}")
                    saved_assistant_id = None
        
        # Check if we already have an assistant with the configured name
        assistants = self.client.beta.assistants.list(
            order="desc",
            limit=100
        )
        
        # Look for an existing assistant with the same name
        for assistant in assistants.data:
            if assistant.name == openai_config.ASSISTANT_NAME:
                print(f"Found existing assistant with name '{openai_config.ASSISTANT_NAME}'")
                self.assistant_id = assistant.id
                
                # Save the ID for future use
                if self.id_manager:
                    self.id_manager.set_assistant_id(self.assistant_id, openai_config.ASSISTANT_NAME)
                
                # Upload files with deduplication and associate with this assistant
                self._upload_files_from_data_dir()
                
                # Update the existing assistant with current configuration
                self.client.beta.assistants.update(
                    assistant_id=self.assistant_id,
                    instructions=openai_config.ASSISTANT_INSTRUCTIONS,
                    model=openai_config.ASSISTANT_MODEL,
                    tools=[{"type": "file_search"}]
                )
                
                print(f"Updated assistant configuration")
                return
        
        # No existing assistant found, create a new one
        print(f"Creating new assistant '{openai_config.ASSISTANT_NAME}'")
        
        # Create the assistant with file_search tool
        assistant = self.client.beta.assistants.create(
            name=openai_config.ASSISTANT_NAME,
            instructions=openai_config.ASSISTANT_INSTRUCTIONS,
            model=openai_config.ASSISTANT_MODEL,
            tools=[{"type": "file_search"}]
        )
        
        self.assistant_id = assistant.id
        
        # Save the new ID for future use
        if self.id_manager:
            self.id_manager.set_assistant_id(self.assistant_id, openai_config.ASSISTANT_NAME)
        
        # Upload files and associate with the assistant
        self._upload_files_from_data_dir()
      
    def _upload_files_from_data_dir(self):
        """
        Upload all files from the data directory to the OpenAI API using RAGFileManager
        """
        # Initialize RAG File Manager with our OpenAI client
        self.file_manager = RAGFileManager(client=self.client, data_dir=self.data_dir)
        
        print(f"Scanning {self.data_dir} for files to upload...")
        
        # Use the file manager to ensure files are uploaded and properly associated
        try:
            if not self.assistant_id:
                print("No assistant ID available, cannot upload files")
                return
                
            # Verify the assistant ID is valid before associating files
            try:
                self.client.beta.assistants.retrieve(self.assistant_id)
                print(f"Verified assistant ID before file upload: {self.assistant_id}")
            except Exception as e:
                print(f"Error verifying assistant ID before file upload: {e}")
                backup_id = self._get_direct_assistant_id()
                if backup_id:
                    print(f"Using corrected assistant ID for file upload: {backup_id}")
                    self.assistant_id = backup_id
                    # Save this ID for future use
                    if self.id_manager:
                        self.id_manager.set_assistant_id(self.assistant_id, openai_config.ASSISTANT_NAME)
                    # Update registry if possible
                    try:
                        from config.service_registry import SERVICE_REGISTRY
                        SERVICE_REGISTRY["assistant"]["openai"]["assistant_id"] = self.assistant_id
                    except Exception:
                        pass
                else:
                    print("Cannot proceed with file upload: No valid assistant ID")
                    return
                
            # This will upload all files and associate them with the assistant
            result = self.file_manager.ensure_files_attached(self.assistant_id)
            
            if result["success"]:
                self.file_ids = self.file_manager.get_file_ids_for_assistant(self.assistant_id)
                print(f"Uploaded {result['files_uploaded']} files to OpenAI")
            else:
                print(f"Error ensuring files are attached: {result.get('error', 'Unknown error')}")
                return
                
            # Verify file association by checking the status
            print("Verifying file association with assistant...")
            status = self.file_manager.file_association_status(self.assistant_id)
            
            # List the files that were uploaded
            if status["files"]:
                print("Files associated with assistant:")
                for file_info in status["files"]:
                    file_path = file_info.get("path", "")
                    file_id = file_info.get("file_id", "")
                    version = file_info.get("version", 1)
                    
                    # Only show the filename in the output
                    filename = os.path.basename(file_path)
                    
                    if version > 1:
                        print(f"  - {filename} (ID: {file_id}, version: {version})")
                    else:
                        print(f"  - {filename} (ID: {file_id})")
            else:
                print(f"No files found in {self.data_dir}")
                
        except Exception as e:
            print(f"Error uploading files from data directory: {str(e)}")
            # Continue execution even if file upload fails
    
    def _verify_file_association(self):
        """
        Verify that files are properly associated with the assistant
        """
        try:
            # Check if we have the assistant ID
            if not self.assistant_id:
                print("No assistant ID available, skipping verification")
                return
                
            # Get the file association status from our file manager
            status = self.file_manager.file_association_status(self.assistant_id)
            
            # If no files are associated, try to ensure files are attached
            if status["file_count"] == 0:
                print("No files associated with assistant, attempting to attach files...")
                result = self.file_manager.ensure_files_attached(self.assistant_id)
                
                if result["success"]:
                    print(f"Successfully attached {result['files_uploaded']} files to assistant")
                else:
                    print(f"Failed to attach files: {result.get('error', 'Unknown error')}")
            
            # Ensure the assistant has the file_search tool enabled
            try:
                self.client.beta.assistants.update(
                    assistant_id=self.assistant_id,
                    tools=[{"type": "file_search"}]
                )
                print("Files are associated with the assistant and accessible through file search tools")
            except Exception as tool_error:
                print(f"Error updating assistant tools: {str(tool_error)}")
                
        except Exception as e:
            print(f"Error verifying file association: {str(e)}")
            # Continue execution even if verification fails
      
    def _create_thread(self):
        """
        Create a new thread for the conversation
        """
        thread = self.client.beta.threads.create()
        self.thread_id = thread.id
        
    def process_task(self, task_name, task_documentation=None, variables=None, decision_context=None):
        """
        Process a task using the OpenAI assistant
        
        Args:
            task_name: The name of the task
            task_documentation: Documentation/instructions for the task
            variables: Dictionary of input variables for the task
            decision_context: Optional initial decision context if this is the first task
            
        Returns:
            dict: The assistant's response as a dictionary of output variables
        """
        print(f"Processing task '{task_name}' with OpenAI assistant (ID: {self.assistant_id})...")
        
        # CRITICAL: Use the verified and centralized ID manager to ensure correct assistant ID
        if self.id_manager:
            is_valid, verified_id = self.id_manager.verify_and_correct_assistant_id(
                openai_config.ASSISTANT_NAME, 
                self.client
            )
            
            if not is_valid:
                print("WARNING: Assistant ID verification failed in process_task. Attempting to recover...")
                direct_id = self._get_direct_assistant_id()
                if direct_id:
                    self.assistant_id = direct_id
                    if self.id_manager:
                        self.id_manager.set_assistant_id(self.assistant_id, openai_config.ASSISTANT_NAME)
                    print(f"Recovered with assistant ID: {self.assistant_id}")
                else:
                    print("CRITICAL: Could not recover a valid assistant ID!")
            elif self.assistant_id != verified_id and verified_id is not None:
                print(f"Updating to verified assistant ID: {verified_id}")
                self.assistant_id = verified_id
                
            # Update service registry if possible
            try:
                from config.service_registry import SERVICE_REGISTRY
                if "assistant" in SERVICE_REGISTRY and "openai" in SERVICE_REGISTRY["assistant"]:
                    if SERVICE_REGISTRY["assistant"]["openai"].get("assistant_id") != self.assistant_id:
                        SERVICE_REGISTRY["assistant"]["openai"]["assistant_id"] = self.assistant_id
                        print(f"Updated service registry with assistant ID: {self.assistant_id}")
            except Exception as reg_error:
                print(f"Could not update service registry: {reg_error}")
        else:
            # Fall back to the old verification method if ID manager is not available
            self.verify_assistant()
            
        print(f"Using verified assistant ID: {self.assistant_id}")
        
        # Double-check thread exists
        if not self.thread_id:
            print("Thread ID not set, creating new thread...")
            self._create_thread()
        
        # Check if the assistant_id in variables matches our current ID
        if isinstance(variables, dict) and variables.get('__assistant_id') and variables['__assistant_id'] != self.assistant_id:
            print(f"WARNING: Assistant ID mismatch detected in variables: {variables['__assistant_id']} != {self.assistant_id}")
            print(f"Correcting assistant ID to use: {self.assistant_id}")
            variables['__assistant_id'] = self.assistant_id
        
        # Prepare the message content
        content = f"# Task: {task_name}\n\n"
        
        if task_documentation:
            content += f"## Instructions\n{task_documentation}\n\n"
        else:
            content += "## Instructions\nPlease process the following inputs and provide appropriate outputs.\n\n"
        
        # Add decision context if provided (typically for the first task)
        if decision_context:
            content += f"## Decision Context\n{decision_context}\n\n"
        
        # Add input variables
        content += "## Input Variables\n"
        if variables:
            content += json.dumps(variables, indent=2) + "\n\n"
        else:
            content += "No input variables provided.\n\n"
        
        # Add response format instructions
        content += """## Response Format
                    Please format your response as a JSON object with appropriate keys and values. 
                    Example:
                    ```
                    {
                    "analysis": "Your detailed analysis here",
                    "recommendation": "Your specific recommendation",
                    "next_steps": "Suggested next steps"
                    }
                    ```
                    """

        # Create message
        try:
            # Ensure thread_id is not None before proceeding
            if not self.thread_id:
                raise ValueError("Thread ID is not set. Cannot create a message without a valid thread ID.")
            # Add the message to the thread
            message = self.client.beta.threads.messages.create(
                thread_id=self.thread_id,
                role="user",
                content=content
            )            # Run the assistant on the thread
            if not self.assistant_id:
                # Try to get the assistant ID directly as a fallback
                self.assistant_id = self._get_direct_assistant_id()
                if not self.assistant_id:
                    raise ValueError("Assistant ID is not set. Cannot create a run without a valid assistant ID.")
                else:
                    print(f"Retrieved assistant ID directly: {self.assistant_id}")
                    # Save this ID for future use if we have an ID manager
                    if self.id_manager:
                        self.id_manager.set_assistant_id(self.assistant_id, openai_config.ASSISTANT_NAME)
                    
                    # Also update the service registry if possible
                    try:
                        from config.service_registry import SERVICE_REGISTRY
                        if "assistant" in SERVICE_REGISTRY and "openai" in SERVICE_REGISTRY["assistant"]:
                            SERVICE_REGISTRY["assistant"]["openai"]["assistant_id"] = self.assistant_id
                            print(f"Updated service registry with assistant ID: {self.assistant_id}")
                    except Exception as reg_error:
                        print(f"Could not update service registry: {reg_error}")
            
            # Double-check the assistant ID is valid before proceeding
            try:
                # Verify the assistant exists
                self.client.beta.assistants.retrieve(self.assistant_id)
                print(f"Verified assistant ID exists: {self.assistant_id}")
            except Exception as e:
                print(f"Error verifying assistant ID: {e}")
                # Try to get a valid assistant ID
                backup_id = self._get_direct_assistant_id()
                if backup_id:
                    print(f"Using backup assistant ID: {backup_id}")
                    self.assistant_id = backup_id
                    # Save this ID for future use if we have an ID manager
                    if self.id_manager:
                        self.id_manager.set_assistant_id(self.assistant_id, openai_config.ASSISTANT_NAME)
                        
                    # Also update the service registry if possible
                    try:
                        from config.service_registry import SERVICE_REGISTRY
                        if "assistant" in SERVICE_REGISTRY and "openai" in SERVICE_REGISTRY["assistant"]:
                            SERVICE_REGISTRY["assistant"]["openai"]["assistant_id"] = self.assistant_id
                            print(f"Updated service registry with assistant ID: {self.assistant_id}")
                    except Exception as reg_error:
                        print(f"Could not update service registry: {reg_error}")
                else:
                    raise ValueError(f"Could not find a valid assistant ID")
            
            # Create the run with the verified assistant ID
            run = self.client.beta.threads.runs.create(
                thread_id=self.thread_id,
                assistant_id=self.assistant_id,
            )
            
            # Wait for the run to complete
            run = self._wait_for_run_completion(run.id)
            
            if run.status == "completed":
                # Get the assistant's response
                messages = self.client.beta.threads.messages.list(
                    thread_id=self.thread_id,
                    order="desc",
                    limit=1
                )
                
                if messages.data:
                    # Extract the response content, handling different content block types
                    content_blocks = messages.data[0].content
                    response_content = ""
                    for block in content_blocks:
                        # Safely handle each block type by checking the 'type' attribute
                        if hasattr(block, "type"):
                            if block.type == "text" and hasattr(block, "text") and hasattr(block.text, "value"):
                                response_content += block.text.value
                            elif block.type == "image_file" and hasattr(block, "file_id"):
                                response_content += f"[Image File: {getattr(block, 'file_id', '')}]"
                            elif block.type == "image_url" and hasattr(block, "image_url"):
                                response_content += f"[Image URL: {getattr(block, 'image_url', '')}]"
                            elif block.type == "refusal":
                                response_content += "[Refusal]"
                            else:
                                response_content += "[Unsupported content block]"
                        else:
                            response_content += "[Unknown content block]"

                    # Parse JSON output if possible
                    try:
                        # Extract JSON content if wrapped in markdown code blocks
                        if "```json" in response_content and "```" in response_content:
                            json_start = response_content.find("```json") + 7
                            json_end = response_content.find("```", json_start)
                            json_content = response_content[json_start:json_end].strip()
                            output_variables = json.loads(json_content)
                        elif "```" in response_content and "```" in response_content:
                            # Try to find any code block (not just json)
                            json_start = response_content.find("```") + 3
                            # Skip the language identifier line if present
                            if "\n" in response_content[json_start:]:
                                json_start = response_content.find("\n", json_start) + 1
                            json_end = response_content.find("```", json_start)
                            json_content = response_content[json_start:json_end].strip()
                            output_variables = json.loads(json_content)
                        else:
                            # Try to parse the entire response as JSON
                            output_variables = json.loads(response_content)
                    except Exception as e:
                        print(f"Failed to parse JSON response: {str(e)}")
                        # Use the full text response if JSON parsing fails
                        output_variables = {
                            "response_text": response_content,
                            "json_parse_error": f"Could not parse as JSON: {str(e)}"
                        }
                    
                    # Add task metadata
                    output_variables.update({
                        "processed_by": "OpenAI Assistant",
                        "processed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "assistant_id": self.assistant_id,
                        "thread_id": self.thread_id,
                        "task_name": task_name
                    })
                    
                    return output_variables
                else:
                    raise Exception("No response received from assistant")
            else:
                raise Exception(f"Run failed with status: {run.status}")
                
        except Exception as e:
            print(f"Error processing task with assistant: {str(e)}")
            return {
                "processed_by": "OpenAI Assistant (Error)",
                "processed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "error": str(e),
                "task_name": task_name
            }
    
    def _wait_for_run_completion(self, run_id):
        """
        Wait for a run to complete, polling at the configured interval
        
        Args:
            run_id: The ID of the run to wait for
            
        Returns:
            The completed run object
        """
        print(f"Waiting for assistant response...")
        
        attempts = 0
        while attempts < openai_config.MAX_POLLING_ATTEMPTS:
            if not self.thread_id:
                raise ValueError("Thread ID is not set. Cannot retrieve run without a valid thread ID.")
            run = self.client.beta.threads.runs.retrieve(
                thread_id=self.thread_id,
                run_id=run_id
            )
            
            if run.status in ["completed", "failed", "cancelled", "expired"]:
                if run.status == "completed":
                    print("Assistant response received")
                else:
                    print(f"Run ended with status: {run.status}")
                return run
            
            # If still processing, wait and try again
            print(f"Still processing (status: {run.status})...")
            time.sleep(openai_config.POLLING_INTERVAL)
            attempts += 1
        
        # If we reached here, the run timed out
        print(f"Timed out waiting for run to complete after {attempts * openai_config.POLLING_INTERVAL} seconds")
        raise Exception(f"Timed out waiting for assistant response. Last status: {run.status}")
    
    def get_task_documentation(self, task):
        """
        Attempt to extract documentation/instructions for a task from Camunda
        
        Args:
            task: The Camunda ExternalTask object
            
        Returns:
            str: The task documentation, or None if not available
        """
        try:
            # Get activity ID from task
            activity_id = task.get_activity_id()
            if not activity_id:
                return None
            
            # Get process instance ID
            process_instance_id = task.get_process_instance_id()
            if not process_instance_id:
                return None
            
            # Get process definition ID
            process_definition_id = self._get_process_definition_id(process_instance_id)
            if not process_definition_id:
                return None
            
            # Get process XML
            xml_data = self._get_process_xml(process_definition_id)
            if not xml_data:
                return None
            
            # Parse documentation for activity ID
            import re
            
            # Look for activity documentation in XML
            pattern = f'id="{re.escape(activity_id)}"[^>]*>\\s*<bpmn:documentation>(.*?)</bpmn:documentation>'
            matches = re.search(pattern, xml_data, re.DOTALL)
            
            if matches:
                documentation = matches.group(1).strip()
                return documentation
            
            return None
        
        except Exception as e:
            print(f"Error retrieving task documentation: {str(e)}")
            return None
    
    def _get_process_definition_id(self, process_instance_id):
        """Get process definition ID from process instance ID"""
        from config import camunda_config
        import requests
        
        base_url = camunda_config.CAMUNDA_ENGINE_URL
        if not base_url.endswith('/'):
            base_url += '/'
        
        url = f"{base_url}process-instance/{process_instance_id}"
        
        try:
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                return data.get('definitionId')
        except Exception as e:
            print(f"Error getting process definition ID: {str(e)}")
        
        return None
    
    def _get_process_xml(self, process_definition_id):
        """Get process XML from process definition ID"""
        from config import camunda_config
        import requests
        
        base_url = camunda_config.CAMUNDA_ENGINE_URL
        if not base_url.endswith('/'):
            base_url += '/'
        
        url = f"{base_url}process-definition/{process_definition_id}/xml"
        
        try:
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                return data.get('bpmn20Xml')
        except Exception as e:
            print(f"Error getting process XML: {str(e)}")
        
        return None
    
    def _get_direct_assistant_id(self):
        """
        Get the assistant ID directly from OpenAI API to ensure consistency.
        This is a failsafe method to retrieve the correct assistant ID when other methods fail.
        
        Returns:
            str: The assistant ID, or None if not found
        """
        try:
            # List assistants and find the one with our name
            assistants = self.client.beta.assistants.list(
                order="desc",
                limit=100
            )
            
            # Look for an existing assistant with the configured name
            for assistant in assistants.data:
                if assistant.name == openai_config.ASSISTANT_NAME:
                    print(f"Found assistant '{openai_config.ASSISTANT_NAME}' with ID: {assistant.id}")
                    return assistant.id
                    
            print(f"No assistant found with name '{openai_config.ASSISTANT_NAME}'")
            return None
            
        except Exception as e:
            print(f"Error retrieving assistant ID directly: {str(e)}")
            return None
    
    def cleanup(self):
        """
        Clean up resources used by the assistant
        """
        # We don't delete the assistant or files, but could delete the thread if needed
        print(f"AssistantManager cleanup complete")
    
    def verify_assistant(self):
        """Verify that the assistant exists and is properly configured"""
        if not self.assistant_id:
            print("No assistant ID available for verification")
            return False
            
        try:
            # Try to retrieve the assistant with the current ID
            assistant = self.client.beta.assistants.retrieve(self.assistant_id)
            print(f"Verified assistant ID exists: {self.assistant_id}")
            print(f"Name: {assistant.name}")
            print(f"Model: {assistant.model}")
            return True
        except Exception as e:
            print(f"Error verifying assistant ID: {e}")
            
            # Try to get a valid assistant ID
            backup_id = self._get_direct_assistant_id()
            if backup_id:
                print(f"Found valid assistant ID: {backup_id}")
                self.assistant_id = backup_id
                # Save this ID for future use
                if self.id_manager:
                    self.id_manager.set_assistant_id(self.assistant_id, openai_config.ASSISTANT_NAME)
                return True
            else:
                print("Could not find a valid assistant ID")
                return False
