#!/usr/bin/env python3
"""
Enhanced debug script to test automatic vector store population from scratch

This script will:
1. Clean up existing OpenAI resources (assistant, vector store, files)
2. Test automatic recreation during AssistantManager initialization
3. Verify that files are properly uploaded and associated with vector stores

This tests the exact scenario the user wants: automatic population when resources don't exist.
"""
import os
import sys
import time
import json
from pathlib import Path

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

def cleanup_openai_resources():
    """Clean up all OpenAI resources to test fresh initialization"""
    print("="*80)
    print("CLEANING UP OPENAI RESOURCES")
    print("="*80)
    print("⚠️  This will delete ALL OpenAI resources to test fresh creation!")
    print("⚠️  Local files in data/ directory will be preserved.")
    print()
    
    # Get user confirmation
    response = input("Do you want to proceed with cleanup? (type 'yes' to confirm): ").strip().lower()
    if response != 'yes':
        print("❌ Cleanup cancelled.")
        return False
    
    try:
        from config import openai_config
        from openai import OpenAI
        
        if not openai_config.OPENAI_API_KEY:
            print("❌ OPENAI_API_KEY not found")
            return False
            
        client = OpenAI(api_key=openai_config.OPENAI_API_KEY)
        
        # Step 1: Get current assistant ID
        current_assistant_id = None
        assistant_id_file = os.path.join(project_root, "logs", "assistant_id.json")
        if os.path.exists(assistant_id_file):
            try:
                with open(assistant_id_file, 'r') as f:
                    data = json.load(f)
                    current_assistant_id = data.get("assistant_id")
                    print(f"📋 Found stored assistant ID: {current_assistant_id}")
            except Exception as e:
                print(f"⚠️  Could not read assistant ID file: {e}")
          # Step 2: Find all DADM assistants (in case there are orphaned ones)
        print("🔍 Finding all DADM assistants...")
        dadm_assistants = []
        try:
            assistants = client.beta.assistants.list(limit=20)
            for assistant in assistants.data:
                if (assistant.name and "DADM" in assistant.name) or assistant.id == current_assistant_id:
                    dadm_assistants.append(assistant)
                    print(f"   Found: {assistant.id} - {assistant.name}")
        except Exception as e:
            print(f"⚠️  Error listing assistants: {e}")
        
        # Step 3: Clean up vector stores for each assistant
        for assistant in dadm_assistants:
            try:
                from src.rag_file_manager import RAGFileManager
                file_manager = RAGFileManager(client=client, data_dir=os.path.join(project_root, "data"))
                
                vector_store_id = file_manager.get_vector_store_for_assistant(assistant.id)
                if vector_store_id:
                    print(f"🗑️  Deleting vector store: {vector_store_id} for assistant {assistant.id}")
                    try:
                        client.vector_stores.delete(vector_store_id)
                        print(f"   ✅ Vector store deleted")
                    except Exception as e:
                        print(f"   ⚠️  Vector store deletion failed: {e}")
                else:
                    print(f"📝 No vector store found for assistant {assistant.id}")
                    
            except Exception as e:
                print(f"⚠️  Error during vector store cleanup for {assistant.id}: {e}")
        
        # Step 4: Delete ALL vector stores (in case any are orphaned)
        print("🗑️  Deleting any remaining vector stores...")
        try:
            vector_stores = client.vector_stores.list(limit=20)
            deleted_vs_count = 0
            for vs in vector_stores.data:
                if "DADM" in vs.name:
                    try:
                        client.vector_stores.delete(vs.id)
                        deleted_vs_count += 1
                        print(f"   ✅ Deleted vector store: {vs.id}")
                    except Exception as e:
                        print(f"   ⚠️  Failed to delete vector store {vs.id}: {e}")
            print(f"✅ Deleted {deleted_vs_count} vector stores")
        except Exception as e:
            print(f"⚠️  Error deleting vector stores: {e}")
        
        # Step 5: Delete all files
        print("🗑️  Deleting OpenAI files...")
        try:
            files = client.files.list()
            deleted_count = 0
            for file in files.data:
                # Only delete files that might be ours (be conservative)
                if file.purpose == 'assistants':
                    try:
                        client.files.delete(file.id)
                        deleted_count += 1
                        print(f"   ✅ Deleted file: {file.id} ({file.filename})")
                    except Exception as e:
                        print(f"   ⚠️  Failed to delete file {file.id}: {e}")
            print(f"✅ Deleted {deleted_count} assistant files")
        except Exception as e:
            print(f"⚠️  Error deleting files: {e}")
        
        # Step 6: Delete all DADM assistants
        for assistant in dadm_assistants:
            print(f"🗑️  Deleting assistant: {assistant.id} - {assistant.name}")
            try:
                client.beta.assistants.delete(assistant.id)
                print(f"   ✅ Assistant deleted")
            except Exception as e:
                print(f"   ⚠️  Assistant deletion failed: {e}")
        
        # Step 7: Clear local metadata
        print("🗑️  Clearing local metadata...")
        
        # Clear assistant ID file
        if os.path.exists(assistant_id_file):
            try:
                os.remove(assistant_id_file)
                print("   ✅ Cleared assistant_id.json")
            except Exception as e:
                print(f"   ⚠️  Could not remove assistant_id.json: {e}")
        
        # Clear RAG file metadata
        metadata_file = os.path.join(project_root, "config", "metadata", "rag_file_metadata.json")
        if os.path.exists(metadata_file):
            try:
                os.remove(metadata_file)
                print("   ✅ Cleared rag_file_metadata.json")
            except Exception as e:
                print(f"   ⚠️  Could not remove rag_file_metadata.json: {e}")
        
        print("✅ Cleanup completed - all OpenAI resources removed")
        return True
        
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        import traceback
        traceback.print_exc()
        return False

def verify_clean_state():
    """Verify that no OpenAI resources exist"""
    print("\n" + "="*80)
    print("VERIFYING CLEAN STATE")
    print("="*80)
    
    try:
        from config import openai_config
        from openai import OpenAI
        
        if not openai_config.OPENAI_API_KEY:
            print("❌ OPENAI_API_KEY not found")
            return False
            
        client = OpenAI(api_key=openai_config.OPENAI_API_KEY)
        
        # Check for assistants with our name
        assistants = client.beta.assistants.list(limit=20)
        dadm_assistants = [a for a in assistants.data if a.name == openai_config.ASSISTANT_NAME]
        
        if dadm_assistants:
            print(f"⚠️  Found {len(dadm_assistants)} existing DADM assistants:")
            for assistant in dadm_assistants:
                print(f"   - {assistant.id}: {assistant.name}")
            return False
        else:
            print("✅ No DADM assistants found")
        
        # Check for files
        files = client.files.list()
        file_count = len(files.data)
        print(f"📁 Found {file_count} files in OpenAI account")
        
        # Check local metadata files
        assistant_id_file = os.path.join(project_root, "logs", "assistant_id.json")
        metadata_file = os.path.join(project_root, "config", "metadata", "rag_file_metadata.json")
        
        if os.path.exists(assistant_id_file):
            print("⚠️  assistant_id.json still exists")
            return False
        else:
            print("✅ assistant_id.json cleared")
            
        if os.path.exists(metadata_file):
            print("⚠️  rag_file_metadata.json still exists")
            return False
        else:
            print("✅ rag_file_metadata.json cleared")
        
        print("✅ Clean state verified - ready for fresh initialization")
        return True
        
    except Exception as e:
        print(f"❌ Error verifying clean state: {e}")
        return False

def test_direct_assistant_initialization():
    """Test direct AssistantManager initialization to see if files are uploaded"""
    print("="*80)
    print("TESTING DIRECT ASSISTANT INITIALIZATION")
    print("="*80)
    
    try:
        from src.openai_assistant import AssistantManager
        from config import openai_config
        
        # Check if we have API key
        if not openai_config.OPENAI_API_KEY:
            print("❌ OPENAI_API_KEY not found")
            return
            
        print(f"✅ OPENAI_API_KEY found")
        print(f"📁 Data directory: {os.path.join(project_root, 'data')}")
        
        # Initialize AssistantManager (this should trigger file upload)
        print("\n🔄 Initializing AssistantManager...")
        data_dir = os.path.join(project_root, "data")
        assistant_manager = AssistantManager(data_dir=data_dir)
        
        print(f"✅ AssistantManager initialized")
        print(f"🤖 Assistant ID: {assistant_manager.assistant_id}")
        print(f"🧵 Thread ID: {assistant_manager.thread_id}")
        print(f"📎 File IDs: {len(assistant_manager.file_ids)} files")
          # Check if file manager exists and has files
        if hasattr(assistant_manager, 'file_manager') and assistant_manager.file_manager and assistant_manager.assistant_id:
            print(f"\n📊 File Manager Status:")
            status = assistant_manager.file_manager.file_association_status(assistant_manager.assistant_id)
            print(f"   Files associated: {status['file_count']}")
            
            # Check vector store
            vector_store_id = assistant_manager.file_manager.get_vector_store_for_assistant(assistant_manager.assistant_id)
            if vector_store_id:
                print(f"   Vector store: {vector_store_id}")
                
                # List files in vector store
                vector_files = assistant_manager.file_manager.list_vector_store_files(vector_store_id)
                print(f"   Files in vector store: {len(vector_files)}")
                for file_info in vector_files:
                    print(f"     - {file_info.get('filename', file_info['id'])}: {file_info['status']}")
            else:
                print(f"   ❌ No vector store found for assistant")
        else:
            print(f"❌ No file manager found or no assistant ID")
        
        return assistant_manager
        
    except Exception as e:
        print(f"❌ Error during initialization: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_openai_service_initialization():
    """Test OpenAI service initialization path"""
    print("\n" + "="*80)
    print("TESTING OPENAI SERVICE INITIALIZATION")
    print("="*80)
    
    try:
        import requests
        from src.consul_app import get_openai_service_url
        
        # Get service URL
        service_url = get_openai_service_url()
        print(f"🌐 Service URL: {service_url}")
        
        # Check service status
        try:
            response = requests.get(f"{service_url}/status", timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Service status: {data.get('status')}")
                print(f"🤖 Assistant ID: {data.get('assistant_id')}")
                
                # If not operational, try to initialize
                if data.get('status') != 'operational':
                    print("\n🔄 Initializing service...")
                    data_dir = os.path.join(project_root, "data")
                    init_response = requests.post(
                        f"{service_url}/initialize",
                        json={"data_dir": data_dir},
                        timeout=30
                    )
                    
                    if init_response.status_code == 200:
                        init_data = init_response.json()
                        print(f"✅ Service initialized")
                        print(f"🤖 Assistant ID: {init_data.get('assistant_id')}")
                        print(f"📎 Files count: {init_data.get('files_count')}")
                        return True
                    else:
                        print(f"❌ Service initialization failed: {init_response.status_code}")
                        print(f"   Response: {init_response.text}")
                        return False
                else:
                    print("✅ Service already operational")
                    return True
            else:
                print(f"❌ Service check failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Could not connect to service: {e}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing service: {e}")
        return False

def test_files_exist():
    """Check if files exist in data directory"""
    print("\n" + "="*80)
    print("CHECKING DATA DIRECTORY")
    print("="*80)
    
    data_dir = os.path.join(project_root, "data")
    print(f"📁 Data directory: {data_dir}")
    
    if not os.path.exists(data_dir):
        print(f"❌ Data directory does not exist")
        return []
        
    files = list(Path(data_dir).glob("*.*"))
    # Filter out metadata files
    files = [f for f in files if not f.name.endswith("_metadata.json")]
    
    print(f"📄 Found {len(files)} files:")
    for file_path in files:
        print(f"   - {file_path.name} ({file_path.stat().st_size} bytes)")
    
    return files

def main():
    """Main function"""
    print("DADM AUTOMATIC VECTOR STORE POPULATION TEST")
    print("This script will test automatic vector store population from a completely clean state")
    print("="*80)
    
    # Get user confirmation before cleanup
    print("⚠️  WARNING: This will delete ALL OpenAI resources associated with DADM:")
    print("   - Assistant")
    print("   - Vector stores") 
    print("   - All uploaded files")
    print("   - Local metadata files")
    print()
    response = input("Are you sure you want to proceed? (yes/no): ").lower().strip()
    
    if response not in ['yes', 'y']:
        print("❌ Operation cancelled by user")
        return
    
    print(f"\n{'='*80}")
    print("STARTING FRESH INITIALIZATION TEST")
    print(f"{'='*80}")
    
    # Step 1: Check files exist before we start
    files = test_files_exist()
    if not files:
        print("\n❌ No files found in data directory - nothing to upload")
        return
    
    # Step 2: Clean up existing resources
    cleanup_success = cleanup_openai_resources()
    if not cleanup_success:
        print("\n❌ Cleanup failed - cannot proceed")
        return
    
    # Step 3: Verify clean state
    time.sleep(2)  # Give OpenAI API time to process deletions
    clean_state = verify_clean_state()
    if not clean_state:
        print("\n❌ Clean state verification failed - cannot proceed")
        return
    
    # Step 4: Test fresh initialization
    print(f"\n{'='*80}")
    print("TESTING FRESH INITIALIZATION")
    print(f"{'='*80}")
    print("🔄 Now testing automatic vector store population from scratch...")
    
    assistant_manager = test_direct_assistant_initialization()
    
    # Step 5: Verify everything was created properly
    print(f"\n{'='*80}")
    print("VERIFICATION RESULTS")
    print(f"{'='*80}")
    if assistant_manager and assistant_manager.assistant_id:
        has_vector_store = False
        vector_store_files_count = 0
        
        if hasattr(assistant_manager, 'file_manager') and assistant_manager.file_manager:
            vector_store_id = assistant_manager.file_manager.get_vector_store_for_assistant(assistant_manager.assistant_id)
            if vector_store_id:
                has_vector_store = True
                vector_files = assistant_manager.file_manager.list_vector_store_files(vector_store_id)
                vector_store_files_count = len(vector_files)
        
        if has_vector_store and vector_store_files_count > 0:
            print("🎉 SUCCESS: Automatic vector store population is WORKING!")
            print(f"   ✅ Assistant created: {assistant_manager.assistant_id}")
            print(f"   ✅ Vector store created and associated")
            print(f"   ✅ {vector_store_files_count} files uploaded and added to vector store")
            print(f"   ✅ Files in data directory: {len(files)}")
            
            if vector_store_files_count == len(files):
                print("   🎯 Perfect match: All data files are in the vector store!")
            else:
                print(f"   ⚠️  Mismatch: {len(files)} files in data dir, {vector_store_files_count} in vector store")
                
        elif has_vector_store:
            print("⚠️  PARTIAL SUCCESS: Vector store created but no files added")
            print("   ✅ Assistant created")
            print("   ✅ Vector store created and associated") 
            print("   ❌ No files in vector store")
            
        else:
            print("❌ FAILURE: Vector store not created or not associated")
            print("   ✅ Assistant created")
            print("   ❌ No vector store found")
            
    else:
        print("❌ COMPLETE FAILURE: Assistant initialization failed")
      # Step 6: Test the assistant's ability to retrieve files
    if assistant_manager and assistant_manager.assistant_id and hasattr(assistant_manager, 'file_manager') and assistant_manager.file_manager:
        vector_store_id = assistant_manager.file_manager.get_vector_store_for_assistant(assistant_manager.assistant_id)
        if vector_store_id:
            print(f"\n{'='*80}")
            print("TESTING FILE RETRIEVAL")
            print(f"{'='*80}")
            
            try:
                # Test a simple query that should use the files
                test_query = "What are the key requirements mentioned in the disaster response documents?"
                print(f"🔍 Testing query: {test_query}")
                
                result = assistant_manager.process_task(
                    task_name="Test File Retrieval",
                    task_documentation=f"Answer this question using the uploaded documents: {test_query}",
                    variables={"test_query": test_query}
                )
                
                if result and isinstance(result, dict):
                    response_text = result.get("response_text", "")
                    if response_text and len(response_text) > 100:
                        print(f"✅ File retrieval SUCCESS: Got {len(response_text)} character response")
                        print(f"   Preview: {response_text[:200]}...")
                    else:
                        print(f"⚠️  File retrieval PARTIAL: Got short response ({len(response_text)} chars)")
                        print(f"   Response: {response_text}")
                else:
                    print("❌ File retrieval FAILED: No valid response")
                    
            except Exception as e:
                print(f"❌ File retrieval test failed: {e}")
    
    print(f"\n{'='*80}")
    print("TEST COMPLETE")
    print(f"{'='*80}")
    
    print("\n📋 SUMMARY:")
    print(f"   📁 Files in data directory: {len(files)}")
    if assistant_manager:
        print(f"   🤖 Assistant ID: {assistant_manager.assistant_id}")
        if hasattr(assistant_manager, 'file_manager') and assistant_manager.file_manager:
            vector_store_id = assistant_manager.file_manager.get_vector_store_for_assistant(assistant_manager.assistant_id)
            if vector_store_id:
                vector_files = assistant_manager.file_manager.list_vector_store_files(vector_store_id)
                print(f"   🗃️  Vector store ID: {vector_store_id}")
                print(f"   📎 Files in vector store: {len(vector_files)}")
            else:
                print(f"   ❌ No vector store found")
        else:
            print(f"   ❌ No file manager found")
    else:
        print(f"   ❌ Assistant initialization failed")

if __name__ == "__main__":
    main()
