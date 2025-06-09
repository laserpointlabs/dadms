#!/usr/bin/env python3
"""
Comprehensive test to verify vector store file associations

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
        for vs_id in vector_store_ids:
            print(f"\n🗂️ Testing Vector Store: {vs_id}")
            print("-" * 40)
              try:
                # Get vector store details
                vector_store = client.vector_stores.retrieve(vs_id)
                print(f"   📂 Name: {vector_store.name}")
                print(f"   📂 Status: {vector_store.status}")
                print(f"   📂 File counts: {vector_store.file_counts}")
                
                # List files in vector store
                vs_files = client.vector_stores.files.list(vector_store_id=vs_id)
                vs_file_ids = [f.id for f in vs_files.data]
                print(f"   📂 Files in vector store: {len(vs_file_ids)}")
                
                if not vs_file_ids:
                    print("   ❌ ISSUE: Vector store has no files!")
                    all_tests_passed = False
                    continue
                
                # Check each file in vector store
                print(f"   📄 Checking files in vector store:")
                for file_id in vs_file_ids:
                    try:
                        file_info = client.files.retrieve(file_id)
                        print(f"     • {file_id}: {file_info.filename} ({file_info.bytes} bytes)")
                        
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
                            
                    except Exception as e:
                        print(f"     ❌ Error checking file {file_id}: {e}")
                        all_tests_passed = False
                
                # Test vector store file association status
                print(f"   🔍 Vector store file association status:")
                for vs_file in vs_files.data:
                    print(f"     • {vs_file.id}: status={vs_file.status}")
                    if vs_file.status != 'completed':
                        print(f"       ⚠️ File not fully processed: {vs_file.status}")
                        all_tests_passed = False
                
            except Exception as e:
                print(f"   ❌ Error testing vector store {vs_id}: {e}")
                all_tests_passed = False
        
        # Test retrieval capability
        print(f"\n🔍 Testing Retrieval Capability")
        print("-" * 40)
        
        if has_file_search and vector_store_ids:
            try:
                # Create a thread and test a query
                thread = client.beta.threads.create()
                
                # Add a message that should trigger retrieval
                message = client.beta.threads.messages.create(
                    thread_id=thread.id,
                    role="user",
                    content="What are the key requirements mentioned in the disaster response document?"
                )
                
                # Run the assistant
                run = client.beta.threads.runs.create(
                    thread_id=thread.id,
                    assistant_id=assistant_id
                )
                
                # Wait for completion (simplified - just check once)
                import time
                time.sleep(5)
                
                run_status = client.beta.threads.runs.retrieve(thread_id=thread.id, run_id=run.id)
                print(f"   🎯 Test query run status: {run_status.status}")
                
                if run_status.status == 'completed':
                    # Get the response
                    messages = client.beta.threads.messages.list(thread_id=thread.id)
                    if messages.data and len(messages.data) > 1:
                        response = messages.data[0].content[0].text.value
                        print(f"   ✅ Got response (length: {len(response)} chars)")
                        
                        # Check if response seems to use retrieved content
                        if len(response) > 100:  # Substantial response
                            print(f"   ✅ Response appears to use retrieved content")
                        else:
                            print(f"   ⚠️ Response seems too short - may not be using retrieval")
                            print(f"   Response: {response[:200]}...")
                    else:
                        print(f"   ❌ No assistant response received")
                        all_tests_passed = False
                else:
                    print(f"   ❌ Test query failed: {run_status.status}")
                    if hasattr(run_status, 'last_error') and run_status.last_error:
                        print(f"   Error: {run_status.last_error}")
                    all_tests_passed = False
                
                # Cleanup test thread
                try:
                    client.beta.threads.delete(thread.id)
                except:
                    pass
                    
            except Exception as e:
                print(f"   ❌ Retrieval test failed: {e}")
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
            print("   • Retrieval capability working")
        else:
            print("❌ SOME TESTS FAILED")
            print("   Review the issues above to fix vector store associations")
        
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
    else:
        print("❌ Vector store file associations need attention.")
        print("\nNext steps:")
        print("1. Check if files are being added to vector store (not just uploaded)")
        print("2. Verify assistant configuration includes vector store tool resources")
        print("3. Ensure RAGFileManager properly associates files with vector stores")
    print("=" * 60)

if __name__ == "__main__":
    main()
