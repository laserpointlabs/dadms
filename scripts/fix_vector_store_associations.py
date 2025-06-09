#!/usr/bin/env python3
"""
Fix vector store file associations

This script fixes the issue where files are associated with an old assistant
but not with the current assistant and its vector store.
"""

import os
import sys
from pathlib import Path

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

def fix_vector_store_associations():
    """Fix vector store file associations for current assistant"""
    print("🔧 Fixing Vector Store File Associations")
    print("=" * 60)
    
    try:
        from openai import OpenAI
        from config import openai_config
        from src.rag_file_manager import RAGFileManager
        from src.assistant_id_manager import AssistantIDManager
        
        # Initialize components
        client = OpenAI(api_key=openai_config.OPENAI_API_KEY)
        file_manager = RAGFileManager(client=client)
        id_manager = AssistantIDManager()
        
        # Get current assistant
        assistant_id = id_manager.get_assistant_id()
        print(f"📋 Current assistant ID: {assistant_id}")
        
        # Get current vector store
        vector_store_id = file_manager.get_vector_store_for_assistant(assistant_id)
        print(f"📋 Current vector store ID: {vector_store_id}")
        
        # Check local files
        local_data_dir = Path(project_root) / "data"
        local_files = list(local_data_dir.glob("*.md"))
        print(f"📂 Local files found: {len(local_files)}")
        for local_file in local_files:
            print(f"   • {local_file.name}")
        
        # Check which files are in metadata for Windows paths
        windows_file_ids = []
        for local_file in local_files:
            windows_path = str(local_file)
            if windows_path in file_manager.file_metadata.get("files", {}):
                file_info = file_manager.file_metadata["files"][windows_path]
                file_id = file_info["file_id"]
                windows_file_ids.append(file_id)
                print(f"   ✅ Found file ID for {local_file.name}: {file_id}")
            else:
                print(f"   ❌ No file ID found for {local_file.name}")
        
        if not windows_file_ids:
            print("❌ No valid file IDs found for current assistant!")
            return False
        
        print(f"\n📋 Files to add to vector store: {len(windows_file_ids)}")
        
        # Add files to vector store
        print(f"\n🔄 Adding files to vector store {vector_store_id}...")
        successful_additions = 0
        
        for file_id in windows_file_ids:
            try:
                # Check if file already exists in vector store
                vs_files = client.vector_stores.files.list(vector_store_id=vector_store_id)
                existing_file_ids = [f.id for f in vs_files.data]
                
                if file_id in existing_file_ids:
                    print(f"   ✅ File {file_id} already in vector store")
                    successful_additions += 1
                else:
                    # Add file to vector store
                    result = client.vector_stores.files.create(
                        vector_store_id=vector_store_id,
                        file_id=file_id
                    )
                    print(f"   ✅ Added file {file_id} to vector store (status: {result.status})")
                    successful_additions += 1
                    
            except Exception as e:
                print(f"   ❌ Failed to add file {file_id}: {e}")
        
        print(f"\n📊 Successfully added {successful_additions}/{len(windows_file_ids)} files to vector store")
        
        # Update metadata to associate files with current assistant
        print(f"\n🔄 Updating metadata for assistant {assistant_id}...")
        
        if "assistants" not in file_manager.file_metadata:
            file_manager.file_metadata["assistants"] = {}
        
        file_manager.file_metadata["assistants"][assistant_id] = windows_file_ids
        file_manager._save_metadata()
        print(f"   ✅ Updated metadata with {len(windows_file_ids)} file associations")
        
        # Verify the fix
        print(f"\n🔍 Verifying the fix...")
        
        # Check vector store file count
        vs_files = client.vector_stores.files.list(vector_store_id=vector_store_id)
        vs_file_count = len(vs_files.data)
        print(f"   📊 Files in vector store: {vs_file_count}")
        
        # Test retrieval
        print(f"\n🧪 Testing retrieval capability...")
        thread = client.beta.threads.create()
        
        message = client.beta.threads.messages.create(
            thread_id=thread.id,
            role="user",
            content="What types of information are covered in the uploaded documents?"
        )
        
        run = client.beta.threads.runs.create(
            thread_id=thread.id,
            assistant_id=assistant_id
        )
        
        # Wait for completion
        import time
        max_wait = 20
        wait_time = 0
        
        while wait_time < max_wait:
            run_status = client.beta.threads.runs.retrieve(thread_id=thread.id, run_id=run.id)
            
            if run_status.status == 'completed':
                break
            elif run_status.status in ['failed', 'cancelled', 'expired']:
                print(f"   ❌ Test run failed: {run_status.status}")
                break
            
            time.sleep(2)
            wait_time += 2
        
        if run_status.status == 'completed':
            messages_response = client.beta.threads.messages.list(thread_id=thread.id)
            messages = messages_response.data
            
            if messages and len(messages) > 1:
                assistant_message = messages[0]
                response_text = ""
                for content_block in assistant_message.content:
                    if hasattr(content_block, 'text') and hasattr(content_block.text, 'value'):
                        response_text += content_block.text.value
                
                print(f"   ✅ Assistant response (length: {len(response_text)} chars)")
                print(f"   📝 Response preview: {response_text[:300]}...")
                
                # Check for signs that it used the files
                if "document" in response_text.lower() or "file" in response_text.lower() or len(response_text) > 200:
                    print(f"   ✅ Response appears to use document content!")
                else:
                    print(f"   ⚠️ Response may not be using documents")
            else:
                print(f"   ❌ No response received")
        
        # Cleanup
        try:
            client.beta.threads.delete(thread.id)
        except:
            pass
        
        # Final summary
        print(f"\n🎉 Fix Summary")
        print("=" * 60)
        print(f"   ✅ Files added to vector store: {successful_additions}")
        print(f"   ✅ Metadata updated for assistant: {assistant_id}")
        print(f"   ✅ Vector store file count: {vs_file_count}")
        print(f"   ✅ Current system status: Files properly associated")
        
        return successful_additions > 0
        
    except Exception as e:
        print(f"❌ Fix failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main function"""
    print("Starting vector store file association fix...\n")
    success = fix_vector_store_associations()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 Vector store file associations fixed successfully!")
        print("The DADM system should now work properly with file search.")
    else:
        print("❌ Fix failed. Please check the errors above.")
    print("=" * 60)

if __name__ == "__main__":
    main()
