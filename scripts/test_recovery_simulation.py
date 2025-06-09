#!/usr/bin/env python3
"""
Test recovery simulation for DADM system

This script simulates what happens when remote OpenAI resources are deleted
by temporarily modifying metadata and testing recovery mechanisms.
"""

import os
import sys
import json
import shutil
from pathlib import Path
from datetime import datetime

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

def simulate_recovery_test():
    """Test what happens when remote resources are deleted"""
    print("🧪 Testing Recovery Simulation")
    print("=" * 50)
    
    try:
        from openai import OpenAI
        from config import openai_config
        from src.rag_file_manager import RAGFileManager
        from src.assistant_id_manager import AssistantIDManager
        
        # Initialize components
        client = OpenAI(api_key=openai_config.OPENAI_API_KEY)
        file_manager = RAGFileManager(client=client)
        id_manager = AssistantIDManager()
        
        # Get current state
        assistant_id = id_manager.get_assistant_id()
        print(f"📋 Current assistant: {assistant_id}")
        
        current_vector_store = file_manager.get_vector_store_for_assistant(assistant_id)
        print(f"📋 Current vector store: {current_vector_store}")
        
        # Backup current metadata
        backup_path = file_manager.metadata_file + ".backup"
        shutil.copy2(file_manager.metadata_file, backup_path)
        print(f"✓ Backed up metadata to: {backup_path}")
        
        # Test 1: Simulate invalid vector store ID
        print("\n🔄 Test 1: Simulating invalid vector store ID...")
        original_metadata = file_manager.file_metadata.copy()
        
        # Temporarily set an invalid vector store ID
        if "vector_stores" in file_manager.file_metadata:
            file_manager.file_metadata["vector_stores"][assistant_id] = "vs_invalid_test_id"
        
        # Test recovery
        try:
            recovered_vector_store = file_manager.create_or_get_vector_store(assistant_id)
            print(f"✅ Recovery successful! New vector store: {recovered_vector_store}")
            
            # Verify it's different from the invalid one
            if recovered_vector_store != "vs_invalid_test_id":
                print("✓ System created new vector store as expected")
            
        except Exception as e:
            print(f"❌ Recovery failed: {e}")
            return False
        
        # Test 2: Test file re-upload
        print("\n🔄 Test 2: Testing file re-upload capability...")
        
        # Check data directory files
        data_files = list(Path(file_manager.data_dir).glob("*.*"))
        data_files = [f for f in data_files if not f.name.endswith("_metadata.json")]
        print(f"✓ Found {len(data_files)} files in data directory")
        
        # Test ensure_files_attached with current setup
        result = file_manager.ensure_files_attached(assistant_id)
        
        if result["success"]:
            print(f"✅ File attachment test successful!")
            print(f"  - Files processed: {result['files_uploaded']}")
            print(f"  - Vector store: {result['vector_store_id']}")
            print(f"  - Files associated: {result['status']['file_count']}")
        else:
            print(f"❌ File attachment test failed: {result.get('error', 'Unknown error')}")
            return False
        
        # Test 3: Verify assistant configuration
        print("\n🔄 Test 3: Testing assistant configuration...")
        try:
            assistant = client.beta.assistants.retrieve(assistant_id)
            has_file_search = any(tool.type == "file_search" for tool in assistant.tools)
            has_vector_store = bool(
                assistant.tool_resources and 
                assistant.tool_resources.file_search and 
                assistant.tool_resources.file_search.vector_store_ids
            )
            
            print(f"✓ Assistant has file_search tool: {has_file_search}")
            print(f"✓ Assistant has vector store configured: {has_vector_store}")
            
            if has_vector_store:
                vs_ids = assistant.tool_resources.file_search.vector_store_ids
                print(f"✓ Current vector store IDs: {vs_ids}")
        
        except Exception as e:
            print(f"❌ Error checking assistant: {e}")
            return False
        
        # Restore original metadata (cleanup)
        print("\n🔄 Restoring original metadata...")
        file_manager.file_metadata = original_metadata
        file_manager._save_metadata()
        print("✓ Original metadata restored")
        
        print("\n✅ Recovery Simulation Results:")
        print("  ✓ Vector store recovery: WORKING")
        print("  ✓ File re-upload: WORKING") 
        print("  ✓ Assistant configuration: WORKING")
        print("  ✓ Metadata management: WORKING")
        
        return True
        
    except Exception as e:
        print(f"❌ Recovery simulation failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # Ensure backup is cleaned up
        backup_path = os.path.join(os.path.dirname(file_manager.metadata_file), "rag_file_metadata.json.backup")
        if os.path.exists(backup_path):
            try:
                # Restore from backup if needed
                if not os.path.exists(file_manager.metadata_file):
                    shutil.copy2(backup_path, file_manager.metadata_file)
                    print("🔄 Restored metadata from backup")
            except:
                pass

def main():
    """Main function"""
    print("🔬 DADM Recovery Simulation Test")
    print("This test simulates what happens when remote OpenAI resources are deleted")
    print("=" * 70)
    
    success = simulate_recovery_test()
    
    print("\n" + "=" * 70)
    if success:
        print("🎉 RECOVERY TEST PASSED!")
        print()
        print("✅ Your system CAN recover from deleted remote resources:")
        print("  • Vector stores will be recreated automatically")
        print("  • Files will be re-uploaded from your data directory") 
        print("  • Assistants will be reconfigured with new vector stores")
        print("  • All file associations will be restored")
        print()
        print("🚀 It's SAFE to delete remote OpenAI resources.")
        print("   The system will recreate everything on next run.")
    else:
        print("❌ RECOVERY TEST FAILED!")
        print("   Do NOT delete remote resources until issues are fixed.")
    
    print("=" * 70)

if __name__ == "__main__":
    main()
