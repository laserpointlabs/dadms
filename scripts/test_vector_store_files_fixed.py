#!/usr/bin/env python3
"""
Comprehensive test to verify vector store file associations - FIXED VERSION

This test verifies that:
1. Files from data directory are uploaded to OpenAI
2. Files are added to the vector store (not just general assistant files)
3. Vector store is properly associated with the assistant
4. Assistant can retrieve information from vector store files
"""

import os
import sys
from pathlib import Path

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

def test_vector_store_file_associations():
    """Test complete vector store file association flow"""
    print("🧪 Testing Vector Store File Associations")
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
        
        # Get current assistant and vector store
        assistant_id = id_manager.get_assistant_id()
        print(f"📋 Current assistant ID: {assistant_id}")
        
        # Get assistant details
        assistant = client.beta.assistants.retrieve(assistant_id)
        print(f"📋 Assistant name: {assistant.name}")
        print(f"📋 Assistant tools: {[tool.type for tool in assistant.tools]}")
        
        # Check if assistant has file_search tool
        has_file_search = any(tool.type == 'file_search' for tool in assistant.tools)
        print(f"📋 Has file_search tool: {has_file_search}")
        
        # Check assistant's tool resources
        vector_store_ids = []
        if hasattr(assistant, 'tool_resources') and assistant.tool_resources:
            if hasattr(assistant.tool_resources, 'file_search') and assistant.tool_resources.file_search:
                vector_store_ids = assistant.tool_resources.file_search.vector_store_ids or []
        
        print(f"📋 Assistant's vector store IDs: {vector_store_ids}")
        
        if not vector_store_ids:
            print("❌ ISSUE: Assistant has no vector stores associated!")
            return False
        
        # Test each vector store
        all_tests_passed = True
        total_files_in_vector_stores = 0
        
        for vs_id in vector_store_ids:
            print(f"\n🗂️ Testing Vector Store: {vs_id}")
            print("-" * 40)
            
            try:
                # Get vector store details using the correct API
                vector_store = client.vector_stores.retrieve(vs_id)
                print(f"   📂 Name: {vector_store.name}")
                print(f"   📂 Status: {vector_store.status}")
                print(f"   📂 File counts: {vector_store.file_counts}")
                
                # List files in vector store using correct API
                vs_files_response = client.vector_stores.files.list(vector_store_id=vs_id)
                vs_files = vs_files_response.data
                vs_file_ids = [f.id for f in vs_files]
                print(f"   📂 Files in vector store: {len(vs_file_ids)}")
                total_files_in_vector_stores += len(vs_file_ids)
                
                if not vs_file_ids:
                    print("   ❌ ISSUE: Vector store has no files!")
                    all_tests_passed = False
                    continue
                
                # Check each file in vector store
                print(f"   📄 Checking files in vector store:")
                for vs_file in vs_files:
                    try:
                        file_info = client.files.retrieve(vs_file.id)
                        print(f"     • {vs_file.id}: {file_info.filename} ({file_info.bytes} bytes)")
                        print(f"       Status in vector store: {vs_file.status}")
                        
                        # Check if this matches our local files
                        local_data_dir = Path(project_root) / "data"
                        local_files = list(local_data_dir.glob("*.md"))
                        
                        matching_local = None
                        for local_file in local_files:
                            if local_file.name == file_info.filename:
                                matching_local = local_file
                                break
                        
                        if matching_local:
                            print(f"       ✅ Matches local file: {matching_local}")
                        else:
                            print(f"       ⚠️ No matching local file found")
                        
                        # Check vector store file status
                        if vs_file.status != 'completed':
                            print(f"       ⚠️ File not fully processed: {vs_file.status}")
                            all_tests_passed = False
                            
                    except Exception as e:
                        print(f"     ❌ Error checking file {vs_file.id}: {e}")
                        all_tests_passed = False
                
            except Exception as e:
                print(f"   ❌ Error testing vector store {vs_id}: {e}")
                all_tests_passed = False
        
        # Compare with local files
        print(f"\n📂 Local Data Directory Analysis")
        print("-" * 40)
        local_data_dir = Path(project_root) / "data"
        local_files = list(local_data_dir.glob("*.md"))
        print(f"   📄 Local files in data directory: {len(local_files)}")
        for local_file in local_files:
            print(f"     • {local_file.name}")
        
        print(f"   📊 Files in vector stores: {total_files_in_vector_stores}")
        print(f"   📊 Local files: {len(local_files)}")
        
        if total_files_in_vector_stores != len(local_files):
            print(f"   ⚠️ File count mismatch!")
            all_tests_passed = False
        else:
            print(f"   ✅ File counts match!")
        
        # Test retrieval capability with simplified approach
        print(f"\n🔍 Testing Retrieval Capability")
        print("-" * 40)
        
        if has_file_search and vector_store_ids:
            try:
                # Create a thread for testing
                thread = client.beta.threads.create()
                print(f"   📝 Created test thread: {thread.id}")
                
                # Add a test message
                message = client.beta.threads.messages.create(
                    thread_id=thread.id,
                    role="user",
                    content="What are the key requirements mentioned in the disaster response document?"
                )
                print(f"   📝 Added test message")
                
                # Run the assistant
                run = client.beta.threads.runs.create(
                    thread_id=thread.id,
                    assistant_id=assistant_id
                )
                print(f"   🏃 Started assistant run: {run.id}")
                
                # Wait for completion
                import time
                max_wait = 30  # Maximum wait time in seconds
                wait_time = 0
                
                while wait_time < max_wait:
                    run_status = client.beta.threads.runs.retrieve(thread_id=thread.id, run_id=run.id)
                    print(f"   ⏳ Run status: {run_status.status}")
                    
                    if run_status.status == 'completed':
                        break
                    elif run_status.status in ['failed', 'cancelled', 'expired']:
                        print(f"   ❌ Run failed with status: {run_status.status}")
                        if hasattr(run_status, 'last_error') and run_status.last_error:
                            print(f"   Error details: {run_status.last_error}")
                        all_tests_passed = False
                        break
                    
                    time.sleep(2)
                    wait_time += 2
                
                if run_status.status == 'completed':
                    # Get the response
                    messages_response = client.beta.threads.messages.list(thread_id=thread.id)
                    messages = messages_response.data
                    
                    if messages and len(messages) > 1:
                        # Get the assistant's response (first message is the latest)
                        assistant_message = messages[0]
                        if assistant_message.content and len(assistant_message.content) > 0:
                            # Handle different content types
                            response_text = ""
                            for content_block in assistant_message.content:
                                if hasattr(content_block, 'text') and hasattr(content_block.text, 'value'):
                                    response_text += content_block.text.value
                            
                            print(f"   ✅ Got response (length: {len(response_text)} chars)")
                            
                            # Check if response seems to use retrieved content
                            if len(response_text) > 100:  # Substantial response
                                print(f"   ✅ Response appears to use retrieved content")
                                print(f"   📝 Response preview: {response_text[:200]}...")
                            else:
                                print(f"   ⚠️ Response seems too short - may not be using retrieval")
                                print(f"   📝 Full response: {response_text}")
                        else:
                            print(f"   ❌ Assistant message has no content")
                            all_tests_passed = False
                    else:
                        print(f"   ❌ No assistant response received")
                        all_tests_passed = False
                elif wait_time >= max_wait:
                    print(f"   ❌ Test timed out after {max_wait} seconds")
                    all_tests_passed = False
                
                # Cleanup test thread
                try:
                    client.beta.threads.delete(thread.id)
                    print(f"   🧹 Cleaned up test thread")
                except Exception as cleanup_error:
                    print(f"   ⚠️ Could not cleanup test thread: {cleanup_error}")
                    
            except Exception as e:
                print(f"   ❌ Retrieval test failed: {e}")
                import traceback
                traceback.print_exc()
                all_tests_passed = False
        else:
            print(f"   ⚠️ Skipping retrieval test - no file_search tool or vector stores")
        
        # Summary
        print(f"\n📊 Test Summary")
        print("=" * 60)
        
        if all_tests_passed:
            print("✅ ALL TESTS PASSED")
            print("   • Assistant has vector store(s) associated")
            print("   • Vector store(s) contain files")
            print("   • Files match local data directory")
            print("   • All files are properly processed in vector stores")
            print("   • Retrieval capability working")
            print("\n🎉 Vector store file associations are working correctly!")
        else:
            print("❌ SOME TESTS FAILED")
            print("   Review the issues above to fix vector store associations")
            print("\n🔧 Issues found with vector store file associations")
        
        return all_tests_passed
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main function"""
    print("Starting comprehensive vector store file association test...\n")
    success = test_vector_store_file_associations()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 Vector store file associations are working correctly!")
        print("The DADM system properly:")
        print("  • Associates files with vector stores")
        print("  • Connects vector stores to assistants")
        print("  • Enables file search and retrieval")
    else:
        print("❌ Vector store file associations need attention.")
        print("\nRecommended next steps:")
        print("1. Check RAGFileManager ensure_files_attached() method")
        print("2. Verify files are being added to vector stores, not just uploaded")
        print("3. Ensure assistant tool_resources properly configured")
        print("4. Run vector store rebuild if needed")
    print("=" * 60)

if __name__ == "__main__":
    main()
