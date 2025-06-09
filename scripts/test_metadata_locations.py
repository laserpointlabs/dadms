"""
Test the updated file location behavior for metadata files

This script tests the behavior of the AssistantIDManager and RAGFileManager
with the new metadata file locations.
"""
import os
import sys
import json
from pathlib import Path

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

def check_metadata_dir():
    """Check if the metadata directory exists and what files it contains"""
    metadata_dir = os.path.join(project_root, "config", "metadata")
    
    print(f"Checking metadata directory: {metadata_dir}")
    if os.path.exists(metadata_dir):
        print(f"✓ Metadata directory exists")
        
        # Check for assistant_id.json
        assistant_id_file = os.path.join(metadata_dir, "assistant_id.json")
        if os.path.exists(assistant_id_file):
            print(f"✓ Found assistant_id.json in metadata directory")
            try:
                with open(assistant_id_file, 'r') as f:
                    data = json.load(f)
                print(f"  - Assistant ID: {data.get('assistant_id')}")
                print(f"  - Assistant Name: {data.get('name')}")
            except Exception as e:
                print(f"✗ Error reading assistant_id.json: {e}")
        else:
            print(f"✗ assistant_id.json not found in metadata directory")
            
        # Check for rag_file_metadata.json
        rag_file_metadata = os.path.join(metadata_dir, "rag_file_metadata.json")
        if os.path.exists(rag_file_metadata):
            print(f"✓ Found rag_file_metadata.json in metadata directory")
            try:
                with open(rag_file_metadata, 'r') as f:
                    data = json.load(f)
                file_count = len(data.get("files", {}))
                print(f"  - Contains metadata for {file_count} files")
            except Exception as e:
                print(f"✗ Error reading rag_file_metadata.json: {e}")
        else:
            print(f"✗ rag_file_metadata.json not found in metadata directory")
    else:
        print(f"✗ Metadata directory does not exist")

def test_assistant_id_manager():
    """Test that AssistantIDManager is using the new file location"""
    print("\nTesting AssistantIDManager...")
    
    try:
        from src.assistant_id_manager import AssistantIDManager
        
        # Initialize AssistantIDManager
        id_manager = AssistantIDManager()
        
        # Check storage file path
        print(f"AssistantIDManager storage file: {id_manager.storage_file}")
        
        # Verify it's in the metadata directory
        expected_path = os.path.join(project_root, "config", "metadata", "assistant_id.json")
        if id_manager.storage_file == expected_path:
            print(f"✓ AssistantIDManager is using the correct file path")
        else:
            print(f"✗ AssistantIDManager is using an unexpected file path")
            print(f"  Expected: {expected_path}")
            print(f"  Actual: {id_manager.storage_file}")
            
        # Check if it can access the assistant ID
        assistant_id = id_manager.get_assistant_id()
        if assistant_id:
            print(f"✓ Successfully retrieved assistant ID: {assistant_id}")
        else:
            print(f"ℹ No assistant ID found (this may be normal if not yet set)")
    
    except Exception as e:
        print(f"✗ Error testing AssistantIDManager: {e}")

def test_rag_file_manager():
    """Test that RAGFileManager is using the new file location"""
    print("\nTesting RAGFileManager...")
    
    try:
        from openai import OpenAI
        from config import openai_config
        from src.rag_file_manager import RAGFileManager
        
        # Initialize RAGFileManager
        client = OpenAI(api_key=openai_config.OPENAI_API_KEY)
        file_manager = RAGFileManager(client=client)
        
        # Check metadata file path
        print(f"RAGFileManager metadata file: {file_manager.metadata_file}")
        
        # Verify it's in the metadata directory
        expected_path = os.path.join(project_root, "config", "metadata", "rag_file_metadata.json")
        if file_manager.metadata_file == expected_path:
            print(f"✓ RAGFileManager is using the correct metadata file path")
        else:
            print(f"✗ RAGFileManager is using an unexpected metadata file path")
            print(f"  Expected: {expected_path}")
            print(f"  Actual: {file_manager.metadata_file}")
            
        # Check data directory path (should still be in data/)
        print(f"RAGFileManager data directory: {file_manager.data_dir}")
        expected_data_dir = os.path.join(project_root, "data")
        if file_manager.data_dir == expected_data_dir:
            print(f"✓ RAGFileManager is using the correct data directory")
        else:
            print(f"ℹ RAGFileManager is using a custom data directory: {file_manager.data_dir}")
    
    except Exception as e:
        print(f"✗ Error testing RAGFileManager: {e}")

def main():
    """Main function to run tests"""
    print("Testing metadata file location changes\n")
    
    # Check metadata directory
    check_metadata_dir()
    
    # Test AssistantIDManager
    test_assistant_id_manager()
    
    # Test RAGFileManager
    test_rag_file_manager()
    
    print("\nTests completed!")

if __name__ == "__main__":
    main()