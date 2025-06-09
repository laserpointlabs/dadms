#!/usr/bin/env python3
"""
RAG File Manager - Simplified for OpenAI API version 1.0.1+

This module provides efficient file management for RAG operations:
- Deduplicates file uploads by tracking file hashes
- Uses direct file attachments via the file_search tool
- Provides versioning and metadata tracking
- Optimizes OpenAI API usage by reusing file IDs
"""

import os
import hashlib
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any, Literal, Union

from openai import OpenAI

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # Output to console
    ]
)

# Set up module logger
logger = logging.getLogger(__name__)

# Define the allowed file purposes as a literal type
FilePurpose = Literal["assistants", "fine-tune", "batch", "vision", "user_data", "evals"]

class RAGFileManager:
    """
    Manager for files used in RAG operations with OpenAI Assistants
    
    Features:
    - File deduplication using content hashing
    - Direct file attachments to assistants
    - Persistent storage of file metadata
    - Simple file-assistant associations
    """
    
    def __init__(self, 
                 client: Optional[OpenAI] = None, 
                 data_dir: Optional[str] = None,
                 metadata_file: str = "rag_file_metadata.json",
                 auto_save: bool = True):
        """
        Initialize the RAG File Manager
        
        Args:
            client: OpenAI client instance (will create one if not provided)
            data_dir: Directory containing files for RAG operations
            metadata_file: File to store metadata about uploaded files
            auto_save: Whether to automatically save metadata after changes
        """
        # Initialize OpenAI client if not provided
        if client is None:
            from config import openai_config
            if not openai_config.OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY is required")
            self.client = OpenAI(api_key=openai_config.OPENAI_API_KEY)
        else:
            self.client = client
        
        # Set data directory for files
        self.data_dir = data_dir or os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
        Path(self.data_dir).mkdir(parents=True, exist_ok=True)
        
        # New metadata location in config/metadata directory
        project_root = os.path.dirname(os.path.dirname(__file__))
        metadata_dir = os.path.join(project_root, "config", "metadata")
        Path(metadata_dir).mkdir(parents=True, exist_ok=True)
        
        # Set metadata file path in new location
        self.metadata_file = os.path.join(metadata_dir, metadata_file)
        
        # For backward compatibility, check if metadata exists in old location
        old_metadata_file = os.path.join(self.data_dir, metadata_file)
        if os.path.exists(old_metadata_file) and not os.path.exists(self.metadata_file):
            logger.info(f"Metadata file found in old location: {old_metadata_file}")
            try:
                # Copy data from old location to new location
                with open(old_metadata_file, 'r') as f:
                    data = json.load(f)
                with open(self.metadata_file, 'w') as f:
                    json.dump(data, f, indent=2)
                logger.info(f"Copied metadata to new location: {self.metadata_file}")
            except Exception as e:
                logger.warning(f"Error copying metadata file: {e}")
        
        # Auto-save setting
        self.auto_save = auto_save
          # Initialize metadata storage with simplified structure
        self.file_metadata = {
            "files": {},             # Maps file_path -> {file_id, hash, timestamp, version}
            "assistants": {},        # Maps assistant_id -> [file_ids]
            "vector_stores": {},     # Maps assistant_id -> vector_store_id
            "file_id_to_path": {},   # Maps file_id -> file_path for reverse lookup
            "last_updated": None
        }
        
        # Load existing metadata if available
        self._load_metadata()
    
    def _load_metadata(self) -> None:
        """Load file metadata from storage"""
        if os.path.exists(self.metadata_file):
            try:
                with open(self.metadata_file, 'r') as f:
                    self.file_metadata = json.load(f)
                logger.info(f"Loaded metadata for {len(self.file_metadata['files'])} files")
            except (json.JSONDecodeError, IOError) as e:
                logger.warning(f"Error loading metadata file: {e}. Using empty metadata.")
        else:
            logger.info(f"No metadata file found at {self.metadata_file}. Creating new metadata.")
    
    def _save_metadata(self) -> None:
        """Save file metadata to storage"""
        self.file_metadata["last_updated"] = datetime.now().isoformat()
        try:
            with open(self.metadata_file, 'w') as f:
                json.dump(self.file_metadata, f, indent=2)
            logger.debug(f"Saved file metadata to {self.metadata_file}")
        except IOError as e:
            logger.error(f"Error saving metadata file: {e}")
    
    def _calculate_file_hash(self, file_path: str) -> str:
        """
        Calculate SHA256 hash of file contents for deduplication
        
        Args:
            file_path: Path to the file
            
        Returns:
            SHA256 hash of file contents
        """
        hash_sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()
    
    def list_files(self, assistant_id: Optional[str] = None) -> List[Dict]:
        """
        List tracked files with their metadata
        
        Args:
            assistant_id: Optional assistant ID to filter files by association
            
        Returns:
            List of file metadata dictionaries
        """
        results = []
        
        if assistant_id:
            # Get files associated with a specific assistant
            file_ids = self.get_file_ids_for_assistant(assistant_id)
            for file_id in file_ids:
                file_path = self.file_metadata["file_id_to_path"].get(file_id)
                if file_path and file_path in self.file_metadata["files"]:
                    file_info = self.file_metadata["files"][file_path].copy()
                    file_info["path"] = file_path
                    results.append(file_info)
        else:
            # Get all tracked files
            for file_path, file_info in self.file_metadata["files"].items():
                info = file_info.copy()
                info["path"] = file_path
                results.append(info)
                
        return results
    
    def upload_file(self, 
                    file_path: str, 
                    purpose: FilePurpose = "assistants") -> str:
        """
        Upload a file to OpenAI with deduplication
        
        Args:
            file_path: Path to the file
            purpose: Purpose of the file (e.g., "assistants")
            
        Returns:
            OpenAI file ID
        """
        # Check if file exists
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Calculate file hash for deduplication
        file_hash = self._calculate_file_hash(file_path)
        
        # Check if we already have this file with the same hash
        if file_path in self.file_metadata["files"]:
            existing_file = self.file_metadata["files"][file_path]
            
            # If hash matches, we can reuse the file_id
            if existing_file["hash"] == file_hash:
                logger.info(f"File {file_path} already uploaded (ID: {existing_file['file_id']})")
                return existing_file["file_id"]
            
            # File changed, need to upload new version
            logger.info(f"File {file_path} has changed, uploading new version")
        
        # File is new or changed, upload it
        try:
            with open(file_path, "rb") as file:
                # Upload the file with the specified purpose
                upload_response = self.client.files.create(
                    file=file,
                    purpose=purpose
                )
            
            file_id = upload_response.id
            logger.info(f"Uploaded file {file_path} (ID: {file_id})")
            
            # Update metadata
            self.file_metadata["files"][file_path] = {
                "file_id": file_id,
                "hash": file_hash,
                "timestamp": datetime.now().isoformat(),
                "purpose": purpose,
                "version": self.file_metadata["files"].get(file_path, {}).get("version", 0) + 1
            }
            
            # Update reverse lookup
            self.file_metadata["file_id_to_path"][file_id] = file_path
            
            # Save metadata
            if self.auto_save:
                self._save_metadata()
            
            return file_id
            
        except Exception as e:
            logger.error(f"Error uploading file {file_path}: {e}")
            raise
    
    def upload_files_from_directory(self, 
                                   directory: Optional[str] = None, 
                                   file_pattern: str = "*.*",
                                   purpose: FilePurpose = "assistants",
                                   associate_with_assistant_id: Optional[str] = None) -> List[str]:
        """
        Upload multiple files from a directory
        
        Args:
            directory: Directory containing files (defaults to data_dir)
            file_pattern: Pattern to match files (e.g., "*.pdf", "*.txt")
            purpose: Purpose of the files
            associate_with_assistant_id: Optional assistant ID to associate files with
            
        Returns:
            List of file IDs for uploaded files
        """
        # Use data_dir if no directory specified
        directory = directory or self.data_dir
        
        # Get files matching pattern
        files = list(Path(directory).glob(file_pattern))
        
        if not files:
            logger.warning(f"No files matching pattern '{file_pattern}' found in {directory}")
            return []
        
        logger.info(f"Found {len(files)} files matching pattern '{file_pattern}' in {directory}")
        
        # Upload each file
        file_ids = []
        for file_path in files:
            # Skip metadata files
            if file_path.name.endswith("_metadata.json"):
                continue
                
            try:
                file_id = self.upload_file(str(file_path), purpose=purpose)
                file_ids.append(file_id)
                
                # Associate with assistant if requested
                if associate_with_assistant_id:
                    self.associate_file_with_assistant(file_id, associate_with_assistant_id)
                    
            except Exception as e:
                logger.error(f"Error uploading {file_path}: {e}")
        
        return file_ids
    
    def associate_file_with_assistant(self, file_id: str, assistant_id: str) -> bool:
        """
        Associate a file with an assistant
        
        Args:
            file_id: OpenAI file ID
            assistant_id: OpenAI assistant ID
            
        Returns:
            True if association was successful, False otherwise
        """
        # Check if we have this file in our metadata
        file_path = self.file_metadata["file_id_to_path"].get(file_id)
        
        if not file_path or file_path not in self.file_metadata["files"]:
            logger.warning(f"File ID {file_id} not found in metadata")
            return False
        
        # Initialize assistant entry if needed
        if assistant_id not in self.file_metadata["assistants"]:
            self.file_metadata["assistants"][assistant_id] = []
        
        # Check if already associated
        if file_id in self.file_metadata["assistants"][assistant_id]:
            logger.debug(f"File {file_id} already associated with assistant {assistant_id}")
            return True
        
        try:
            logger.info(f"Attaching file {file_id} to assistant {assistant_id} via OpenAI API")
            # Get current assistant configuration
            assistant = self.client.beta.assistants.retrieve(assistant_id)
            
            # OpenAI API v1.0.1+ doesn't have a direct method to attach files to assistants
            # We need to track this in our local metadata only
            logger.info(f"API requires using tool_resources for file attachment - tracking in local metadata")
                
        except Exception as e:
            logger.error(f"Error retrieving assistant from OpenAI: {e}")
        
        # Update assistant's file list in metadata
        if file_id not in self.file_metadata["assistants"][assistant_id]:
            self.file_metadata["assistants"][assistant_id].append(file_id)
        
        # Save metadata
        if self.auto_save:
            self._save_metadata()
        
        logger.info(f"Associated file {file_id} with assistant {assistant_id} in local metadata")
        return True
    
    def get_file_ids_for_assistant(self, assistant_id: str) -> List[str]:
        """
        Get file IDs associated with a specific assistant
        
        Args:
            assistant_id: OpenAI assistant ID
            
        Returns:
            List of file IDs associated with the assistant
        """
        if not assistant_id or assistant_id not in self.file_metadata["assistants"]:
            return []
        
        return self.file_metadata["assistants"][assistant_id]
    
    def file_association_status(self, assistant_id: str) -> Dict[str, Any]:
        """
        Get status of file associations for an assistant
        
        Args:
            assistant_id: Assistant ID
            
        Returns:
            Dictionary with status information
        """
        result = {
            "assistant_id": assistant_id,
            "file_count": 0,
            "files": []
        }
        
        # Check if assistant exists in our metadata
        if assistant_id not in self.file_metadata["assistants"]:
            return result
        
        # Get file IDs associated with this assistant
        file_ids = self.file_metadata["assistants"][assistant_id]
        result["file_count"] = len(file_ids)
        
        # Get file info for each file
        for file_id in file_ids:
            file_path = self.file_metadata["file_id_to_path"].get(file_id)
            if file_path and file_path in self.file_metadata["files"]:
                file_info = self.file_metadata["files"][file_path].copy()
                file_info["path"] = file_path
                result["files"].append(file_info)
        
        return result
      
    def ensure_files_attached(self, assistant_id: str) -> Dict[str, Any]:
        """
        Ensure all files in the data directory are attached to the assistant via vector stores
        
        Args:
            assistant_id: Assistant ID
            
        Returns:
            Dictionary with status information
        """
        # Upload all files from data directory
        file_ids = self.upload_files_from_directory(
            associate_with_assistant_id=assistant_id
        )
        
        try:
            # Create or get vector store for this assistant
            vector_store_id = self.create_or_get_vector_store(assistant_id)
            logger.info(f"Using vector store {vector_store_id} for assistant {assistant_id}")
            
            # Add all files to the vector store
            for file_id in file_ids:
                success = self.add_file_to_vector_store(vector_store_id, file_id)
                if success:
                    logger.info(f"Added file {file_id} to vector store {vector_store_id}")
                else:
                    logger.warning(f"Failed to add file {file_id} to vector store {vector_store_id}")
            
            # Associate the vector store with the assistant
            association_success = self.associate_vector_store_with_assistant(assistant_id, vector_store_id)
            if association_success:
                logger.info(f"Successfully associated vector store {vector_store_id} with assistant {assistant_id}")
            else:
                logger.error(f"Failed to associate vector store {vector_store_id} with assistant {assistant_id}")
                return {
                    "success": False,
                    "error": "Failed to associate vector store with assistant"
                }
            
        except Exception as e:
            logger.error(f"Error ensuring files are attached to assistant via vector stores: {e}")
            return {
                "success": False,
                "error": str(e)
            }
        
        # Get association status
        status = self.file_association_status(assistant_id)
        
        return {
            "success": True,
            "files_uploaded": len(file_ids),
            "vector_store_id": vector_store_id,
            "status": status
        }
      
    def create_or_get_vector_store(self, assistant_id: str, store_name: Optional[str] = None) -> str:
        """
        Create a vector store for an assistant or get existing one
        
        Args:
            assistant_id: OpenAI assistant ID
            store_name: Optional name for the vector store
            
        Returns:
            Vector store ID
        """
        # Check if we already have a vector store for this assistant
        if assistant_id in self.file_metadata.get("vector_stores", {}):
            vector_store_id = self.file_metadata["vector_stores"][assistant_id]
            
            # Verify the vector store still exists in OpenAI
            try:
                vector_store = self.client.vector_stores.retrieve(vector_store_id)
                logger.info(f"Using existing vector store {vector_store_id} for assistant {assistant_id}")
                return vector_store_id
            except Exception as e:
                logger.warning(f"Existing vector store {vector_store_id} not found, creating new one: {e}")
                # Remove invalid vector store from metadata
                if "vector_stores" in self.file_metadata:
                    self.file_metadata["vector_stores"].pop(assistant_id, None)
        
        # Create new vector store
        try:
            if not store_name:
                store_name = f"DADM Assistant Vector Store - {assistant_id[:8]}"
            
            vector_store = self.client.vector_stores.create(
                name=store_name,
                expires_after={
                    "anchor": "last_active_at",
                    "days": 365
                }
            )
            
            vector_store_id = vector_store.id
            
            # Store in metadata
            if "vector_stores" not in self.file_metadata:
                self.file_metadata["vector_stores"] = {}
            self.file_metadata["vector_stores"][assistant_id] = vector_store_id
            
            # Save metadata
            if self.auto_save:
                self._save_metadata()
            
            logger.info(f"Created new vector store {vector_store_id} for assistant {assistant_id}")
            return vector_store_id
            
        except Exception as e:
            logger.error(f"Error creating vector store for assistant {assistant_id}: {e}")
            raise    
        
    def add_file_to_vector_store(self, vector_store_id: str, file_id: str) -> bool:
        """
        Add a file to a vector store
        
        Args:
            vector_store_id: Vector store ID
            file_id: OpenAI file ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Add file to vector store
            vector_store_file = self.client.vector_stores.files.create(
                vector_store_id=vector_store_id,
                file_id=file_id
            )
            
            logger.info(f"Added file {file_id} to vector store {vector_store_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error adding file {file_id} to vector store {vector_store_id}: {e}")
            return False    
        
    def associate_vector_store_with_assistant(self, assistant_id: str, vector_store_id: str) -> bool:
        """
        Associate a vector store with an assistant by updating the assistant's tool_resources
        
        Args:
            assistant_id: OpenAI assistant ID
            vector_store_id: Vector store ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Update assistant to use the vector store
            self.client.beta.assistants.update(
                assistant_id=assistant_id,
                tools=[{"type": "file_search"}],
                tool_resources={
                    "file_search": {
                        "vector_store_ids": [vector_store_id]
                    }
                }
            )
            
            logger.info(f"Associated vector store {vector_store_id} with assistant {assistant_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error associating vector store {vector_store_id} with assistant {assistant_id}: {e}")
            return False

    def get_vector_store_for_assistant(self, assistant_id: str) -> Optional[str]:
        """
        Get the vector store ID for an assistant
        
        Args:
            assistant_id: OpenAI assistant ID
            
        Returns:
            Vector store ID if exists, None otherwise
        """
        return self.file_metadata.get("vector_stores", {}).get(assistant_id)    
    
    def list_vector_store_files(self, vector_store_id: str) -> List[Dict[str, Any]]:
        """
        List files in a vector store
        
        Args:
            vector_store_id: Vector store ID
            
        Returns:
            List of file information dictionaries
        """
        try:
            files = self.client.vector_stores.files.list(vector_store_id=vector_store_id)
            
            file_list = []
            for file in files.data:
                file_info = {
                    "id": file.id,
                    "status": file.status,
                    "created_at": file.created_at
                }
                
                # Get file path from our metadata if available
                file_path = self.file_metadata.get("file_id_to_path", {}).get(file.id)
                if file_path:
                    file_info["path"] = file_path
                    file_info["filename"] = os.path.basename(file_path)
                
                file_list.append(file_info)
            
            return file_list
            
        except Exception as e:
            logger.error(f"Error listing files in vector store {vector_store_id}: {e}")
            return []
