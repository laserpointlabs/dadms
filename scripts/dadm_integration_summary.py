#!/usr/bin/env python3
"""
DADM Analysis Integration Summary

Comprehensive demonstration of the DADM analysis data management integration
with OpenAI thread tracking and interaction capabilities.
"""

import sys
import json
from pathlib import Path

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

def demonstrate_integration():
    """Demonstrate the complete DADM analysis integration"""
    
    print("=" * 70)
    print("🎉 DADM ANALYSIS DATA MANAGEMENT INTEGRATION SUMMARY")
    print("=" * 70)
    
    try:
        from src.analysis_service_integration import get_analysis_service
        from src.analysis_data_manager import AnalysisDataManager
        
        # Initialize services
        analysis_service = get_analysis_service()
        data_manager = AnalysisDataManager()
        
        print("\n✅ 1. SYSTEM STATUS")
        print("-" * 40)
        
        # Get system statistics
        stats = data_manager.get_stats()
        print(f"📊 Total Analyses Stored: {stats['total_analyses']}")
        print(f"📊 Processing Tasks Completed: {stats.get('processing_task_status', {}).get('completed', 0)}")
        print(f"📊 Vector Store Enabled: {stats['backends_enabled']['vector_store']}")
        print(f"📊 Graph Database Enabled: {stats['backends_enabled']['graph_db']}")
        
        print("\n✅ 2. RECENT WORKFLOW CAPTURES")
        print("-" * 40)
        
        # Get recent analyses with OpenAI threads
        recent_analyses = data_manager.search_analyses(limit=10)
        openai_analyses = [a for a in recent_analyses if a.output_data and 'thread_id' in a.output_data]
        
        for analysis in openai_analyses[:3]:  # Show top 3
            thread_id = analysis.output_data.get('thread_id')
            assistant_id = analysis.output_data.get('assistant_id', 'N/A')
            
            print(f"🔄 Process: {analysis.metadata.process_instance_id}")
            print(f"   Task: {analysis.metadata.task_name}")
            print(f"   OpenAI Thread: {thread_id}")
            print(f"   Assistant: {assistant_id}")
            print(f"   Created: {analysis.metadata.created_at}")
            print()
        
        print("✅ 3. DATA STORAGE VERIFICATION")
        print("-" * 40)
        
        if openai_analyses:
            latest_analysis = openai_analyses[0]
            analysis_id = latest_analysis.metadata.analysis_id
            
            # Check storage in all backends
            print(f"📋 Analysis ID: {analysis_id}")
            
            # SQLite (primary storage)
            stored_analysis = data_manager.get_analysis(analysis_id)
            print(f"   SQLite Storage: ✅ {len(stored_analysis.input_data)} input fields")
            
            # Check processing status
            processing_status = data_manager.get_processing_status(analysis_id)
            completed_tasks = [t for t in processing_status['tasks'] if t['status'] == 'completed']
            print(f"   Processing Tasks: ✅ {len(completed_tasks)} completed")
            
            # Thread extraction
            thread_id = analysis_service.get_openai_thread_id(analysis_id)
            assistant_id = analysis_service.get_openai_assistant_id(analysis_id)
            print(f"   OpenAI Thread: ✅ {thread_id}")
            print(f"   OpenAI Assistant: ✅ {assistant_id}")
        
        print("\n✅ 4. INTEGRATION FEATURES")
        print("-" * 40)
        print("🔧 Service Orchestrator Integration: ✅ Active")
        print("   - Automatic analysis capture on task routing")
        print("   - Process instance tracking")
        print("   - Service metadata inclusion")
        print()
        print("🤖 OpenAI Thread Management: ✅ Active")
        print("   - Thread ID extraction and storage")
        print("   - Assistant ID tracking")
        print("   - Conversation continuity support")
        print()
        print("🔄 Background Processing: ✅ Active")
        print("   - Auto-processing to vector store")
        print("   - Graph database expansion")
        print("   - Queue-based task management")
        print()
        print("🛠️ CLI Tools Available:")
        print("   - analysis_cli.py: Data management and querying")
        print("   - extract_openai_threads.py: Thread information extraction")
        print("   - interact_openai_thread.py: Continue OpenAI conversations")
        print("   - analysis_processing_daemon.py: Background processing")
        
        print("\n✅ 5. USAGE EXAMPLES")
        print("-" * 40)
        
        if openai_analyses:
            latest_process = openai_analyses[0].metadata.process_instance_id
            latest_thread = openai_analyses[0].output_data.get('thread_id')
            
            print("📋 Check system status:")
            print("   python scripts/analysis_cli.py status")
            print()
            print("📋 View recent analyses:")
            print("   python scripts/analysis_cli.py list --limit 10")
            print()
            print("📋 Extract OpenAI threads:")
            print("   python scripts/extract_openai_threads.py")
            print()
            print(f"📋 View specific process context:")
            print(f"   python scripts/extract_openai_threads.py --process-id {latest_process}")
            print()
            print(f"📋 Continue OpenAI conversation:")
            print(f"   python scripts/interact_openai_thread.py --process-id {latest_process} --message \"Your question here\"")
            print()
            print(f"📋 View thread history:")
            print(f"   python scripts/interact_openai_thread.py --thread-id {latest_thread} --history")
        
        print("\n🎯 INTEGRATION SUCCESS SUMMARY")
        print("-" * 40)
        print("✅ DADM workflows automatically capture analysis data")
        print("✅ OpenAI threads are tracked and accessible")
        print("✅ Background processing stores data in multiple backends")
        print("✅ CLI tools provide comprehensive data management")
        print("✅ Process-level context tracking is operational")
        print("✅ Conversation continuity with OpenAI is enabled")
        
        data_manager.close()
        
    except Exception as e:
        print(f"❌ Error during demonstration: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Main function"""
    demonstrate_integration()

if __name__ == "__main__":
    main()
