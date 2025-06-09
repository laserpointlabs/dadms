"""
Script to move metadata files from data folder to config folder

This script moves assistant_id.json and rag_file_metadata.json from the data folder
to a new metadata folder under config to prevent them from being uploaded to OpenAI.
"""
import os
import sys
import json
import shutil
from pathlib import Path

def move_data_file_to_metadata(file_name, new_name=None):
    """
    Move a file from data directory to config/metadata directory
    
    Args:
        file_name: Name of the file in the data directory
        new_name: Optional new name for the file in the metadata directory
    """
    # Get project paths
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(project_root, "data")
    metadata_dir = os.path.join(project_root, "config", "metadata")
    
    # Source file
    source_file = os.path.join(data_dir, file_name)
    
    # Destination file (use new name if provided)
    dest_file = os.path.join(metadata_dir, new_name or file_name)
    
    # Create the metadata directory if it doesn't exist
    Path(metadata_dir).mkdir(parents=True, exist_ok=True)
    
    # Check if source file exists
    if not os.path.exists(source_file):
        print(f"Source file not found: {source_file}")
        return False
    
    # Check if destination file already exists
    if os.path.exists(dest_file):
        print(f"Destination file already exists: {dest_file}")
        backup_file = dest_file + ".bak"
        print(f"Creating backup: {backup_file}")
        shutil.copy2(dest_file, backup_file)
    
    try:
        # Read the original file
        with open(source_file, 'r') as f:
            data = json.load(f)
        
        # Create backup of the original file
        backup = source_file + ".bak"
        print(f"Creating backup of original: {backup}")
        shutil.copy2(source_file, backup)
        
        # Write to the new location
        with open(dest_file, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"Successfully moved {source_file} to {dest_file}")
        return True
    except Exception as e:
        print(f"Error moving file: {e}")
        return False

def main():
    """Main function to move metadata files"""
    print("Moving metadata files to config/metadata directory...\n")
    
    # Files to move with their new names (if any)
    files_to_move = [
        {"old_name": "assistant_id.json", "new_name": None},  # Keep the same name
        {"old_name": "meta.json", "new_name": "rag_file_metadata.json"}  # Rename
    ]
    
    for file_info in files_to_move:
        old_name = file_info["old_name"]
        new_name = file_info["new_name"]
        
        print(f"Processing {old_name}...")
        if move_data_file_to_metadata(old_name, new_name):
            print(f"✓ Successfully moved {old_name}\n")
        else:
            print(f"✗ Failed to move {old_name}\n")
    
    print("\nDone!")
    print("\nIMPORTANT:")
    print("1. The original files have been backed up with a .bak extension")
    print("2. You may want to delete the original files once everything is working")
    print("3. The RAGFileManager and AssistantIDManager have been updated to use the new locations")

if __name__ == "__main__":
    main()