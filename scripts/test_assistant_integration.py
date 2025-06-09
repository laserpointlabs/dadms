#!/usr/bin/env python3
"""
Test the full end-to-end integration with AssistantManager

This script tests that the AssistantManager properly uses vector stores
when uploading files from the data directory.
"""

import os
import sys
from pathlib import Path

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

def test_assistant_integration():
    """Test full integration with AssistantManager"""
    print("Testing AssistantManager integration with vector stores...")
    
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
            print("❌ No assistant ID found")
            return False
        
        print(f"✓ Using assistant ID: {assistant_id}")
        
        # Test the main ensure_files_attached method
        print("Testing ensure_files_attached with vector stores...")
        result = file_manager.ensure_files_attached(assistant_id)
        
        if result["success"]:
            print(f"✅ Files successfully attached via vector stores!")
            print(f"  - Files uploaded: {result['files_uploaded']}")
            print(f"  - Vector store ID: {result['vector_store_id']}")
            print(f"  - Files in assistant: {result['status']['file_count']}")
            
            # Show file details
            for file_info in result['status']['files']:
                filename = os.path.basename(file_info['path'])
                file_id = file_info['file_id']
                print(f"    - {filename} ({file_id})")
                
            return True
        else:
            print(f"❌ Failed to attach files: {result.get('error', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"❌ Error during assistant integration test: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main function"""
    print("=" * 60)
    print("DADM AssistantManager Vector Store Integration Test")
    print("=" * 60)
    
    success = test_assistant_integration()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 AssistantManager vector store integration is working!")
        print("The DADM system now properly uses vector stores for file management.")
    else:
        print("❌ AssistantManager integration test failed.")
    print("=" * 60)

if __name__ == "__main__":
    main()
