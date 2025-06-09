"""
Service Metadata Manager

This module manages the service's internal metadata including:
- Assistant ID
- Thread ID
- Vector Store ID
- File IDs
- Service state information
"""
import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from . import config

logger = logging.getLogger(__name__)

class ServiceMetadataManager:
    """Manages service metadata and state information"""
    
    def __init__(self):
        self.metadata_file = config.METADATA_FILE
        self.assistant_id_file = config.ASSISTANT_ID_FILE
        
        # Ensure directories exist
        os.makedirs(os.path.dirname(self.metadata_file), exist_ok=True)
        os.makedirs(os.path.dirname(self.assistant_id_file), exist_ok=True)
        
        # Initialize metadata
        self._metadata = self._load_metadata()
    
    def _load_metadata(self) -> Dict[str, Any]:
        """Load metadata from file"""
        try:
            if os.path.exists(self.metadata_file):
                with open(self.metadata_file, 'r') as f:
                    return json.load(f)
        except Exception as e:
            logger.warning(f"Could not load metadata: {e}")
        
        return {
            "assistant_id": None,
            "thread_id": None,
            "vector_store_id": None,
            "file_ids": [],
            "service_start_time": datetime.now().isoformat(),
            "last_updated": None,
            "processed_tasks_count": 0,
            "service_version": "1.0.0"
        }
    
    def _save_metadata(self):
        """Save metadata to file"""
        try:
            self._metadata["last_updated"] = datetime.now().isoformat()
            with open(self.metadata_file, 'w') as f:
                json.dump(self._metadata, f, indent=2)
        except Exception as e:
            logger.error(f"Could not save metadata: {e}")
    
    def get_assistant_id(self) -> Optional[str]:
        """Get the current assistant ID"""
        # First check our metadata
        assistant_id = self._metadata.get("assistant_id")
        
        # If not found, try to load from legacy assistant_id.json file
        if not assistant_id:
            try:
                if os.path.exists(self.assistant_id_file):
                    with open(self.assistant_id_file, 'r') as f:
                        data = json.load(f)
                        assistant_id = data.get("assistant_id")
                        if assistant_id:
                            self.set_assistant_id(assistant_id)
            except Exception as e:
                logger.warning(f"Could not load assistant ID from legacy file: {e}")
        
        # Finally check environment variable
        if not assistant_id:
            assistant_id = config.ASSISTANT_ID
            if assistant_id:
                self.set_assistant_id(assistant_id)
        
        return assistant_id
    
    def set_assistant_id(self, assistant_id: str):
        """Set the assistant ID"""
        self._metadata["assistant_id"] = assistant_id
        self._save_metadata()
        
        # Also save to legacy file for backward compatibility
        try:
            with open(self.assistant_id_file, 'w') as f:
                json.dump({"assistant_id": assistant_id}, f, indent=2)
        except Exception as e:
            logger.warning(f"Could not save to legacy assistant ID file: {e}")
    
    def get_thread_id(self) -> Optional[str]:
        """Get the current thread ID"""
        return self._metadata.get("thread_id")
    
    def set_thread_id(self, thread_id: str):
        """Set the thread ID"""
        self._metadata["thread_id"] = thread_id
        self._save_metadata()
    
    def get_vector_store_id(self) -> Optional[str]:
        """Get the current vector store ID"""
        return self._metadata.get("vector_store_id")
    
    def set_vector_store_id(self, vector_store_id: str):
        """Set the vector store ID"""
        self._metadata["vector_store_id"] = vector_store_id
        self._save_metadata()
    
    def get_file_ids(self) -> List[str]:
        """Get the list of file IDs"""
        return self._metadata.get("file_ids", [])
    
    def set_file_ids(self, file_ids: List[str]):
        """Set the list of file IDs"""
        self._metadata["file_ids"] = file_ids
        self._save_metadata()
    
    def add_file_id(self, file_id: str):
        """Add a file ID to the list"""
        file_ids = self.get_file_ids()
        if file_id not in file_ids:
            file_ids.append(file_id)
            self.set_file_ids(file_ids)
    
    def remove_file_id(self, file_id: str):
        """Remove a file ID from the list"""
        file_ids = self.get_file_ids()
        if file_id in file_ids:
            file_ids.remove(file_id)
            self.set_file_ids(file_ids)
    
    def increment_processed_tasks(self):
        """Increment the processed tasks counter"""
        self._metadata["processed_tasks_count"] = self._metadata.get("processed_tasks_count", 0) + 1
        self._save_metadata()
    
    def get_service_metadata(self) -> Dict[str, Any]:
        """Get all service metadata"""
        return {
            "assistant_id": self.get_assistant_id(),
            "thread_id": self.get_thread_id(),
            "vector_store_id": self.get_vector_store_id(),
            "file_ids": self.get_file_ids(),
            "file_count": len(self.get_file_ids()),
            "service_start_time": self._metadata.get("service_start_time"),
            "last_updated": self._metadata.get("last_updated"),
            "processed_tasks_count": self._metadata.get("processed_tasks_count", 0),
            "service_version": self._metadata.get("service_version", "1.0.0")
        }
    
    def clear_all_metadata(self):
        """Clear all metadata (useful for cleanup/reset)"""
        self._metadata = {
            "assistant_id": None,
            "thread_id": None,
            "vector_store_id": None,
            "file_ids": [],
            "service_start_time": datetime.now().isoformat(),
            "last_updated": None,
            "processed_tasks_count": 0,
            "service_version": "1.0.0"
        }
        self._save_metadata()
        
        # Also remove legacy files
        try:
            if os.path.exists(self.assistant_id_file):
                os.remove(self.assistant_id_file)
        except Exception as e:
            logger.warning(f"Could not remove legacy assistant ID file: {e}")
