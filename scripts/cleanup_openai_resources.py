#!/usr/bin/env python3
"""
Safe cleanup script for DADM OpenAI resources

This script provides a controlled way to delete remote OpenAI resources
while keeping local metadata intact for easy recovery.
"""

import os
import sys
from pathlib import Path

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

def cleanup_openai_resources():
    """Clean up OpenAI resources with user confirmation"""
    print("🧹 DADM OpenAI Resource Cleanup")
    print("=" * 50)
    print("This will delete remote OpenAI resources:")
    print("  • Vector stores")
    print("  • Uploaded files") 
    print("  • Assistant configurations")
    print()
    print("⚠️  Your local files and metadata will be preserved!")
    print("⚠️  The system can recreate everything on next run!")
    print()
    
    # Get user confirmation
    response = input("Do you want to proceed? (type 'yes' to confirm): ").strip().lower()
    if response != 'yes':
        print("❌ Cleanup cancelled.")
        return False
    
    try:
        from openai import OpenAI
        from config import openai_config
        from src.rag_file_manager import RAGFileManager
        from src.assistant_id_manager import AssistantIDManager
        
        # Initialize components
        client = OpenAI(api_key=openai_config.OPENAI_API_KEY)
        file_manager = RAGFileManager(client=client)
        id_manager = AssistantIDManager()
        
        # Get current resources
        assistant_id = id_manager.get_assistant_id()
        vector_store_id = file_manager.get_vector_store_for_assistant(assistant_id)
        file_ids = file_manager.get_file_ids_for_assistant(assistant_id)
        
        print(f"\n📋 Found resources to delete:")
        print(f"  • Assistant: {assistant_id}")
        print(f"  • Vector store: {vector_store_id}")
        print(f"  • Files: {len(file_ids)} files")
        
        # Delete vector store
        if vector_store_id:
            try:
                print(f"\n🗂️ Deleting vector store {vector_store_id}...")
                client.vector_stores.delete(vector_store_id)
                print("✅ Vector store deleted")
            except Exception as e:
                print(f"⚠️ Vector store deletion failed (may already be deleted): {e}")
        
        # Delete files
        print(f"\n📁 Deleting {len(file_ids)} files...")
        deleted_files = 0
        for file_id in file_ids:
            try:
                client.files.delete(file_id)
                deleted_files += 1
                print(f"✅ Deleted file {file_id}")
            except Exception as e:
                print(f"⚠️ File {file_id} deletion failed (may already be deleted): {e}")
        
        print(f"✅ Deleted {deleted_files}/{len(file_ids)} files")
        
        # Option to delete assistant
        print(f"\n🤖 Assistant {assistant_id} management:")
        keep_assistant = input("Keep the assistant? (y/n, default=y): ").strip().lower()
        
        if keep_assistant in ['n', 'no']:
            try:
                client.beta.assistants.delete(assistant_id)
                print("✅ Assistant deleted")
                
                # Clear assistant ID from local storage
                id_manager.clear_assistant_id()
                print("✅ Local assistant ID cleared")
            except Exception as e:
                print(f"⚠️ Assistant deletion failed: {e}")
        else:
            print("✅ Assistant preserved")
        
        print(f"\n🔄 Cleanup Summary:")
        print(f"  ✅ Vector store: Deleted")
        print(f"  ✅ Files: {deleted_files} deleted") 
        print(f"  ✅ Assistant: {'Deleted' if keep_assistant in ['n', 'no'] else 'Preserved'}")
        print(f"  ✅ Local data: Preserved")
        print(f"  ✅ Local metadata: Preserved")
        
        print(f"\n🚀 Next Steps:")
        print(f"  • Your local files are safe in the data directory")
        print(f"  • Run any DADM script to automatically recreate resources")
        print(f"  • The system will rebuild everything from your local data")
        
        return True
        
    except Exception as e:
        print(f"❌ Cleanup failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main function"""
    success = cleanup_openai_resources()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 Cleanup completed successfully!")
        print("Your DADM system is ready to rebuild from local data.")
    else:
        print("❌ Cleanup failed or was cancelled.")
    print("=" * 50)

if __name__ == "__main__":
    main()
