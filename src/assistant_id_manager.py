"""
OpenAI Assistant ID Persistence

This module ensures that the same OpenAI Assistant ID is used consistently
across different sessions and service restarts.
"""
import os
import json
import logging
from datetime import datetime
from pathlib import Path

# Set up log directory
project_root = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
logs_dir = os.path.join(project_root, "logs", "services")
Path(logs_dir).mkdir(parents=True, exist_ok=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(logs_dir, "assistant_id_manager.log")),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("assistant_id_manager")

class AssistantIDManager:
    """
    Manages persistence of OpenAI Assistant IDs to ensure consistent usage
    """
    
    def __init__(self, data_dir=None, client=None):
        """
        Initialize the AssistantIDManager
        
        Args:
            data_dir: Directory to store the assistant ID data (will be used for backward compatibility)
            client: Optional OpenAI client instance
        """
        # Set data directory for backward compatibility
        project_root = os.path.dirname(os.path.dirname(__file__))
        self.data_dir = data_dir or os.path.join(project_root, "data")
        
        # New storage location in config/metadata directory
        metadata_dir = os.path.join(project_root, "config", "metadata")
        Path(metadata_dir).mkdir(parents=True, exist_ok=True)
        
        # Set new storage file path
        self.storage_file = os.path.join(metadata_dir, "assistant_id.json")
        
        # For backward compatibility, check if the file exists in the old location
        old_storage_file = os.path.join(self.data_dir, "assistant_id.json")
        if os.path.exists(old_storage_file) and not os.path.exists(self.storage_file):
            logger.info(f"Assistant ID file found in old location: {old_storage_file}")
            try:
                # Copy data from old location to new location
                with open(old_storage_file, 'r') as f:
                    data = json.load(f)
                with open(self.storage_file, 'w') as f:
                    json.dump(data, f, indent=2)
                logger.info(f"Copied assistant ID data to new location: {self.storage_file}")
            except Exception as e:
                logger.warning(f"Error copying assistant ID file: {e}")
        
        # Store the OpenAI client if provided
        self.client = client
        
        # Initialize storage
        self.storage = {
            "assistant_id": None,
            "name": None,
            "last_used": ""
        }
        
        # Load existing data if available
        self._load()
    
    def _load(self):
        """Load assistant ID data from storage"""
        if os.path.exists(self.storage_file):
            try:
                with open(self.storage_file, 'r') as f:
                    data = json.load(f)
                    # Ensure we have a dictionary
                    if isinstance(data, dict):
                        self.storage = data
                logger.info(f"Loaded assistant ID: {self.storage.get('assistant_id')}")
            except Exception as e:
                logger.warning(f"Error loading assistant ID file: {e}. Using default values.")
        else:
            logger.info("No assistant ID file found. Will create one when an ID is saved.")
    def _save(self):
        """Save assistant ID data to storage"""
        try:
            # Create a copy of the storage with updated timestamp
            data_to_save = dict(self.storage)
            data_to_save["last_used"] = datetime.now().isoformat()
            
            with open(self.storage_file, 'w') as f:
                json.dump(data_to_save, f, indent=2)
            logger.info(f"Saved assistant ID: {self.storage.get('assistant_id')}")
        except Exception as e:
            logger.error(f"Error saving assistant ID file: {e}")
    
    def get_assistant_id(self):
        """
        Get the stored assistant ID
        
        Returns:
            str: The assistant ID, or None if not set
        """
        return self.storage.get("assistant_id")
    
    def set_assistant_id(self, assistant_id, name=None):
        """
        Set and save the assistant ID
        
        Args:
            assistant_id: The OpenAI assistant ID
            name: Optional name of the assistant
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not assistant_id:
            logger.warning("Attempted to save an empty assistant ID")
            return False
        
        # Only update if different to avoid unnecessary writes
        if self.storage.get("assistant_id") != assistant_id:
            logger.info(f"Updating assistant ID: {self.storage.get('assistant_id')} → {assistant_id}")
            self.storage["assistant_id"] = assistant_id
            
            if name:
                self.storage["name"] = name
                
            # Save to file
            self._save()
            
        return True
    
    def clear(self):
        """
        Clear the stored assistant ID
        
        Returns:
            bool: True if successful, False otherwise
        """
        self.storage["assistant_id"] = None
        self.storage["name"] = None
        
        # Save to file
        self._save()
        return True
    
    def verify_and_correct_assistant_id(self, assistant_name, client=None):
        """
        Verify that the stored assistant ID is valid and correct it if necessary
        
        Args:
            assistant_name: The expected name of the assistant
            client: OpenAI client instance (optional if provided at init)
            
        Returns:
            tuple: (valid, assistant_id) - Whether ID is valid and the correct ID
        """
        # Use provided client or the one set at initialization
        client_to_use = client or self.client
        
        # If no client is available, we can't verify
        if not client_to_use:
            logger.warning("No OpenAI client available to verify assistant ID")
            return False, self.get_assistant_id()
            
        stored_id = self.get_assistant_id()
        
        # If we don't have an ID stored, go straight to finding a valid one
        if not stored_id:
            logger.info("No assistant ID stored, attempting to find one")
            return self._find_and_set_valid_assistant_id(assistant_name, client_to_use)
            
        # First, verify the stored ID
        try:
            # Try to retrieve the assistant with this ID
            assistant = client_to_use.beta.assistants.retrieve(stored_id)
            
            # Check if the name matches
            if assistant.name == assistant_name:
                logger.info(f"Verified assistant ID {stored_id} for '{assistant_name}'")
                # Update the last used timestamp
                self._save()
                return True, stored_id
            else:
                logger.warning(f"Stored assistant ID {stored_id} has unexpected name: '{assistant.name}' != '{assistant_name}'")
                # ID is valid but name doesn't match, try to find the correct one
                return self._find_and_set_valid_assistant_id(assistant_name, client_to_use)
                
        except Exception as e:
            logger.warning(f"Error verifying assistant ID {stored_id}: {e}")
            # ID is invalid, try to find a valid one
            return self._find_and_set_valid_assistant_id(assistant_name, client_to_use)
    
    def _find_and_set_valid_assistant_id(self, assistant_name, client):
        """Find a valid assistant ID by name and update storage"""
        try:
            # List assistants and find one with the matching name
            assistants = client.beta.assistants.list(
                order="desc",
                limit=100
            )
            
            # Look for an existing assistant with the matching name
            for assistant in assistants.data:
                if assistant.name == assistant_name:
                    logger.info(f"Found assistant '{assistant_name}' with ID: {assistant.id}")
                    
                    # Update storage with the correct ID
                    self.set_assistant_id(assistant.id, assistant_name)
                    
                    return True, assistant.id
                    
            logger.warning(f"No assistant found with name '{assistant_name}'")
            return False, None
            
        except Exception as e:
            logger.error(f"Error finding assistant by name: {e}")
            return False, None