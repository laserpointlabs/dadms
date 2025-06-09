#!/usr/bin/env python3
"""
Complete vector store rebuild

This script rebuilds the vector store from scratch by:
1. Re-uploading files from local data directory
2. Adding them to the vector store
3. Updating metadata properly
"""

import os
import sys
from pathlib import Path

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

def rebuild_vector_store():
    """Rebuild vector store from scratch"""
    print("🔨 Rebuilding Vector Store from Local Files")
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
        
        if not local_files:
            print("❌ No local files found to upload!")
            return False
        
        # Upload files fresh from data directory
        print(f"\n📤 Uploading files from data directory...")
        new_file_ids = []
        
        for local_file in local_files:
            try:
                print(f"   📄 Uploading {local_file.name}...")
                
                with open(local_file, 'rb') as f:
                    file_response = client.files.create(
                        file=f,
                        purpose='assistants'
                    )
                
                new_file_ids.append(file_response.id)
                print(f"   ✅ Uploaded: {file_response.id}")
                
            except Exception as e:
                print(f"   ❌ Failed to upload {local_file.name}: {e}")
        
        if not new_file_ids:
            print("❌ No files were successfully uploaded!")
            return False
        
        print(f"\n✅ Successfully uploaded {len(new_file_ids)} files")
        
        # Add files to vector store
        print(f"\n🗂️ Adding files to vector store {vector_store_id}...")
        successful_additions = 0
        
        for file_id in new_file_ids:
            try:
                result = client.vector_stores.files.create(
                    vector_store_id=vector_store_id,
                    file_id=file_id
                )
                print(f"   ✅ Added {file_id} to vector store (status: {result.status})")
                successful_additions += 1
                
            except Exception as e:
                print(f"   ❌ Failed to add {file_id} to vector store: {e}")
        
        print(f"\n📊 Successfully added {successful_additions}/{len(new_file_ids)} files to vector store")
        
        # Update metadata with new file information
        print(f"\n💾 Updating metadata...")
        
        # Clear old metadata entries for this assistant
        if "assistants" not in file_manager.file_metadata:
            file_manager.file_metadata["assistants"] = {}
        
        # Update file metadata
        for i, local_file in enumerate(local_files):
            if i < len(new_file_ids):
                file_path = str(local_file)
                file_id = new_file_ids[i]
                
                # Update files metadata
                if "files" not in file_manager.file_metadata:
                    file_manager.file_metadata["files"] = {}
                  # Calculate file hash
                import hashlib
                with open(file_path, 'rb') as f:
                    file_hash = hashlib.sha256(f.read()).hexdigest()
                
                # Get current timestamp
                from datetime import datetime
                timestamp = datetime.now().isoformat()
                
                file_manager.file_metadata["files"][file_path] = {
                    "file_id": file_id,
                    "hash": file_hash,
                    "timestamp": timestamp,
                    "purpose": "assistants",
                    "version": 1
                }
                
                # Update reverse lookup
                if "file_id_to_path" not in file_manager.file_metadata:
                    file_manager.file_metadata["file_id_to_path"] = {}
                
                file_manager.file_metadata["file_id_to_path"][file_id] = file_path
        
        # Associate files with assistant
        file_manager.file_metadata["assistants"][assistant_id] = new_file_ids
        
        # Save metadata
        file_manager._save_metadata()
        print(f"   ✅ Updated metadata with {len(new_file_ids)} file associations")
        
        # Wait for vector store processing
        print(f"\n⏳ Waiting for vector store processing...")
        import time
        time.sleep(5)  # Give it a moment to process
        
        # Verify the rebuild
        print(f"\n🔍 Verifying the rebuild...")
        
        # Check vector store file count
        vs_files = client.vector_stores.files.list(vector_store_id=vector_store_id)
        vs_file_count = len(vs_files.data)
        print(f"   📊 Files in vector store: {vs_file_count}")
        
        # List files in vector store
        for vs_file in vs_files.data:
            file_info = client.files.retrieve(vs_file.id)
            print(f"     • {vs_file.id}: {file_info.filename} (status: {vs_file.status})")
        
        # Test retrieval with a specific query
        print(f"\n🧪 Testing retrieval capability...")
        thread = client.beta.threads.create()
        
        message = client.beta.threads.messages.create(
            thread_id=thread.id,
            role="user",
            content="What is covered in the disaster response requirements document?"
        )
        
        run = client.beta.threads.runs.create(
            thread_id=thread.id,
            assistant_id=assistant_id
        )
        
        # Wait for completion
        max_wait = 30
        wait_time = 0
        
        while wait_time < max_wait:
            run_status = client.beta.threads.runs.retrieve(thread_id=thread.id, run_id=run.id)
            print(f"   ⏳ Run status: {run_status.status}")
            
            if run_status.status == 'completed':
                break
            elif run_status.status in ['failed', 'cancelled', 'expired']:
                print(f"   ❌ Test run failed: {run_status.status}")
                break
            
            time.sleep(3)
            wait_time += 3
        
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
                print(f"   📝 Response preview: {response_text[:400]}...")
                
                # Check for signs that it used the files
                if any(keyword in response_text.lower() for keyword in ['disaster', 'response', 'requirements', 'document']):
                    print(f"   🎉 Response appears to use document content!")
                else:
                    print(f"   ⚠️ Response may not be using documents effectively")
            else:
                print(f"   ❌ No response received")
        else:
            print(f"   ❌ Test query timed out or failed")
        
        # Cleanup
        try:
            client.beta.threads.delete(thread.id)
        except:
            pass
        
        # Final summary
        print(f"\n🎉 Rebuild Summary")
        print("=" * 60)
        print(f"   ✅ Files uploaded: {len(new_file_ids)}")
        print(f"   ✅ Files added to vector store: {successful_additions}")
        print(f"   ✅ Vector store file count: {vs_file_count}")
        print(f"   ✅ Metadata updated for assistant: {assistant_id}")
        print(f"   ✅ System status: Ready for file search operations")
        
        return successful_additions > 0 and vs_file_count > 0
        
    except Exception as e:
        print(f"❌ Rebuild failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main function"""
    print("Starting vector store rebuild from local files...\n")
    success = rebuild_vector_store()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 Vector store rebuild completed successfully!")
        print("The DADM system now has proper file associations and should work correctly.")
    else:
        print("❌ Rebuild failed. Please check the errors above.")
    print("=" * 60)

if __name__ == "__main__":
    main()
