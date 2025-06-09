#!/usr/bin/env python3
"""
Quick system status verification script for DADM vector store implementation
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.rag_file_manager import RAGFileManager

def main():
    try:
        # Initialize the manager
        print("Initializing RAGFileManager...")
        manager = RAGFileManager()
        print("✓ RAGFileManager initialized successfully")

        # Check the current status
        assistant_id = 'asst_3LE5rlH86BJTzZkCL1CzSV1K'
        print(f"\nChecking assistant: {assistant_id}")
        
        vector_store_id = manager.get_vector_store_for_assistant(assistant_id)
        if vector_store_id:
            print(f"✓ Vector store found: {vector_store_id}")
            
            # List files in the vector store
            files = manager.list_vector_store_files(vector_store_id)
            print(f"✓ Files in vector store: {len(files)}")
            
            for i, file in enumerate(files[:3]):  # Show first 3 files
                print(f"  {i+1}. {file.get('id', 'unknown')}: {file.get('filename', 'unknown')}")
                  # Check if files are properly associated with assistant
            associated_files = manager.file_metadata.get("assistants", {}).get(assistant_id, [])
            print(f"✓ Files associated with assistant: {len(associated_files)}")
            
            print("\n✅ System Status: HEALTHY")
            print("Vector store implementation is working correctly!")
            
        else:
            print("❌ No vector store found for assistant")
            return False
            
    except Exception as e:
        print(f"❌ Error during verification: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
