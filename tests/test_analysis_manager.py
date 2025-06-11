#!/usr/bin/env python3
"""
Test script for the new Analysis Data Manager
"""
import sys
sys.path.insert(0, '.')

def test_analysis_manager():
    """Test the AnalysisDataManager functionality"""
    print("=" * 60)
    print("Testing Analysis Data Manager")
    print("=" * 60)
    
    try:
        from src.analysis_data_manager import AnalysisDataManager
        print("✅ Successfully imported AnalysisDataManager")
        
        # Create manager with minimal configuration (no external dependencies)
        print("\n1. Creating AnalysisDataManager...")
        manager = AnalysisDataManager(
            storage_dir='./test_data/analysis_storage',
            enable_vector_store=False,  # Disable to avoid Qdrant dependency
            enable_graph_db=False       # Disable to avoid Neo4j dependency
        )
        print("✅ AnalysisDataManager created successfully")
        print(f"   Storage directory: {manager.storage_dir}")
        print(f"   Database path: {manager.db_path}")
        
        # Test storing analysis
        print("\n2. Storing test analysis...")
        analysis_id = manager.store_analysis(
            thread_id='test_thread_001',
            task_name='Test Decision Analysis',
            input_data={
                'decision_type': 'technology_selection',
                'context': 'Selecting database technology for new application',
                'budget': 50000,
                'timeline': '3 months'
            },
            output_data={
                'recommendation': 'PostgreSQL',
                'confidence': 0.85,
                'rationale': 'Best balance of features, performance, and cost'
            },
            raw_response='Based on your requirements, I recommend PostgreSQL...',
            tags=['database', 'technology', 'decision'],
            source_service='test_service'
        )
        print(f"✅ Analysis stored with ID: {analysis_id}")
        
        # Test retrieval
        print("\n3. Retrieving analysis...")
        analysis = manager.get_analysis(analysis_id)
        if analysis:
            print("✅ Analysis retrieved successfully")
            print(f"   Task name: {analysis.metadata.task_name}")
            print(f"   Thread ID: {analysis.metadata.thread_id}")
            print(f"   Tags: {analysis.metadata.tags}")
            print(f"   Status: {analysis.metadata.status.value}")
        else:
            print("❌ Failed to retrieve analysis")
            return False
        
        # Test search by tags
        print("\n4. Searching by tags...")
        results = manager.search_analyses(tags=['database'])
        print(f"✅ Search found {len(results)} analyses with 'database' tag")
        
        # Test thread retrieval
        print("\n5. Getting thread analyses...")
        thread_analyses = manager.get_thread_analyses('test_thread_001')
        print(f"✅ Found {len(thread_analyses)} analyses in thread")
        
        # Test statistics
        print("\n6. Getting statistics...")
        stats = manager.get_stats()
        print(f"✅ Statistics retrieved:")
        print(f"   Total analyses: {stats['total_analyses']}")
        print(f"   Status distribution: {stats['status_distribution']}")
        print(f"   Backends enabled: {stats['backends_enabled']}")
        
        # Test processing status (should show no tasks since backends are disabled)
        print("\n7. Getting processing status...")
        processing_status = manager.get_processing_status(analysis_id)
        print(f"✅ Processing status retrieved:")
        print(f"   Analysis ID: {processing_status['analysis_id']}")
        print(f"   Number of tasks: {len(processing_status['tasks'])}")
        
        # Close the manager
        manager.close()
        print("\n✅ All tests passed! Analysis Data Manager is working correctly.")
        return True
        
    except Exception as e:
        print(f"\n❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_service_integration():
    """Test the service integration layer"""
    print("\n" + "=" * 60)
    print("Testing Analysis Service Integration")
    print("=" * 60)
    
    try:
        from src.analysis_service_integration import get_analysis_service
        print("✅ Successfully imported analysis service integration")
        
        # Get service instance
        print("\n1. Getting analysis service...")
        service = get_analysis_service(
            storage_dir='./test_data/analysis_storage',
            enable_vector_store=False,
            enable_graph_db=False,
            auto_process=False  # Disable auto-processing for testing
        )
        print("✅ Analysis service integration created")
        
        # Test storing OpenAI interaction
        print("\n2. Storing OpenAI interaction...")
        analysis_id = service.store_openai_interaction(
            run_id='test_run_001',
            process_instance_id='proc_inst_001',
            task_data={
                'task_name': 'OpenAI Decision Process',
                'assistant_id': 'test_assistant',
                'thread_id': 'openai_thread_001',
                'recommendation': {
                    'primary_choice': 'Option A',
                    'confidence': 0.9,
                    'alternatives': ['Option B', 'Option C'],
                    'reasoning': 'Option A provides the best value proposition'
                }
            },
            decision_context='Choose between three software solutions'
        )
        print(f"✅ OpenAI interaction stored with ID: {analysis_id}")
        
        # Test search
        print("\n3. Searching analyses...")
        analyses = service.search_analyses(
            service_name='openai_assistant',
            limit=10
        )
        print(f"✅ Found {len(analyses)} analyses from OpenAI assistant")
        
        # Test getting thread conversation
        print("\n4. Getting thread conversation...")
        conversation = service.get_thread_conversation('openai_thread_001')
        print(f"✅ Found {len(conversation)} messages in conversation")
        
        # Test service stats
        print("\n5. Getting service statistics...")
        stats = service.get_service_stats()
        print(f"✅ Service statistics:")
        print(f"   Total analyses: {stats['total_analyses']}")
        print(f"   Backends enabled: {stats['backends_enabled']}")
        
        service.close()
        print("\n✅ Service integration tests passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error during service integration testing: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success1 = test_analysis_manager()
    success2 = test_service_integration()
    
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Analysis Data Manager: {'✅ PASSED' if success1 else '❌ FAILED'}")
    print(f"Service Integration: {'✅ PASSED' if success2 else '❌ FAILED'}")
    
    if success1 and success2:
        print("\n🎉 All tests passed! The new analysis data management system is ready to use.")
    else:
        print("\n⚠️ Some tests failed. Please check the errors above.")
