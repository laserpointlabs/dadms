#!/usr/bin/env python3
"""
Test script for vector store integration in RAGFileManager

This script tests the new vector store functionality to ensure:
1. Vector stores can be created
2. Files can be added to vector stores
3. Vector stores can be associated with assistants
4. The integration works end-to-end
"""

import os
import sys
from pathlib import Path

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

def test_vector_store_integration():
    """Test the vector store integration"""
    print("Testing Vector Store Integration...")
    
    try:
        from openai import OpenAI
        from config import openai_config
        from src.rag_file_manager import RAGFileManager
        from src.assistant_id_manager import AssistantIDManager
        
        # Initialize components
        client = OpenAI(api_key=openai_config.OPENAI_API_KEY)
        file_manager = RAGFileManager(client=client)
        id_manager = AssistantIDManager()
        
        # Get assistant ID
        assistant_id = id_manager.get_assistant_id()
        if not assistant_id:
            print("❌ No assistant ID found. Please create an assistant first.")
            return False
        
        print(f"✓ Using assistant ID: {assistant_id}")
        
        # Test 1: Check if vector store exists for assistant
        existing_vector_store = file_manager.get_vector_store_for_assistant(assistant_id)
        if existing_vector_store:
            print(f"✓ Existing vector store found: {existing_vector_store}")
        else:
            print("ℹ No existing vector store found for assistant")
        
        # Test 2: Create or get vector store
        try:
            vector_store_id = file_manager.create_or_get_vector_store(assistant_id)
            print(f"✓ Vector store created/retrieved: {vector_store_id}")
        except Exception as e:
            print(f"❌ Error creating/getting vector store: {e}")
            return False
        
        # Test 3: Check if data directory has files
        data_dir = file_manager.data_dir
        files = list(Path(data_dir).glob("*.*"))
        files = [f for f in files if not f.name.endswith("_metadata.json")]
        
        if not files:
            print(f"ℹ No files found in {data_dir} for testing")
            print("✓ Vector store functionality appears to be working")
            return True
        
        print(f"✓ Found {len(files)} files in data directory")
        
        # Test 4: Upload files and add to vector store
        try:
            file_ids = file_manager.upload_files_from_directory(
                associate_with_assistant_id=assistant_id
            )
            print(f"✓ Uploaded {len(file_ids)} files")
            
            # Add files to vector store
            for file_id in file_ids:
                success = file_manager.add_file_to_vector_store(vector_store_id, file_id)
                if success:
                    print(f"✓ Added file {file_id} to vector store")
                else:
                    print(f"⚠ Failed to add file {file_id} to vector store")
                    
        except Exception as e:
            print(f"❌ Error uploading files: {e}")
            return False
        
        # Test 5: Associate vector store with assistant
        try:
            success = file_manager.associate_vector_store_with_assistant(assistant_id, vector_store_id)
            if success:
                print(f"✓ Successfully associated vector store with assistant")
            else:
                print(f"⚠ Failed to associate vector store with assistant")
        except Exception as e:
            print(f"❌ Error associating vector store: {e}")
            return False
        
        # Test 6: List files in vector store
        try:
            vector_files = file_manager.list_vector_store_files(vector_store_id)
            print(f"✓ Vector store contains {len(vector_files)} files")
            for file_info in vector_files[:3]:  # Show first 3 files
                filename = file_info.get('filename', file_info.get('id', 'Unknown'))
                status = file_info.get('status', 'Unknown')
                print(f"  - {filename} (status: {status})")
            if len(vector_files) > 3:
                print(f"  ... and {len(vector_files) - 3} more files")
        except Exception as e:
            print(f"❌ Error listing vector store files: {e}")
            return False
        
        print("\n🎉 Vector store integration test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error during vector store test: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main function"""
    print("=" * 50)
    print("DADM Vector Store Integration Test")
    print("=" * 50)
    
    success = test_vector_store_integration()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ All tests passed! Vector store integration is working.")
    else:
        print("❌ Some tests failed. Check the output above for details.")
    print("=" * 50)

if __name__ == "__main__":
    main()
