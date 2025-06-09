#!/usr/bin/env python3
"""
Refresh file metadata by re-uploading all files

This script clears old file metadata and re-uploads all files in the data directory
to ensure we have valid file IDs that can be used with vector stores.
"""

import os
import sys
import json
from pathlib import Path

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

def refresh_file_metadata():
    """Refresh file metadata by clearing old data and re-uploading files"""
    print("Refreshing file metadata...")
    
    try:
        from openai import OpenAI
        from config import openai_config
        from src.rag_file_manager import RAGFileManager
        
        # Initialize components
        client = OpenAI(api_key=openai_config.OPENAI_API_KEY)
        file_manager = RAGFileManager(client=client)
        
        # Clear old metadata
        print("Clearing old file metadata...")
        file_manager.file_metadata = {
            "files": {},
            "assistants": {},
            "vector_stores": {},
            "file_id_to_path": {},
            "last_updated": None
        }
        
        # Save cleared metadata
        file_manager._save_metadata()
        print("✓ Cleared old metadata")
        
        # Re-upload all files
        data_dir = file_manager.data_dir
        files = list(Path(data_dir).glob("*.*"))
        files = [f for f in files if not f.name.endswith("_metadata.json")]
        
        if not files:
            print("No files found in data directory")
            return True
        
        print(f"Found {len(files)} files to re-upload...")
        
        uploaded_files = []
        for file_path in files:
            try:
                print(f"Uploading {file_path.name}...")
                file_id = file_manager.upload_file(str(file_path), purpose="assistants")
                uploaded_files.append((file_path.name, file_id))
                print(f"✓ Uploaded {file_path.name} -> {file_id}")
            except Exception as e:
                print(f"❌ Failed to upload {file_path.name}: {e}")
        
        print(f"\n✅ Successfully uploaded {len(uploaded_files)} files")
        for filename, file_id in uploaded_files:
            print(f"  - {filename}: {file_id}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error refreshing file metadata: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main function"""
    print("=" * 50)
    print("DADM File Metadata Refresh")
    print("=" * 50)
    
    success = refresh_file_metadata()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ File metadata refresh completed!")
    else:
        print("❌ File metadata refresh failed.")
    print("=" * 50)

if __name__ == "__main__":
    main()
