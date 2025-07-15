#!/usr/bin/env python3
"""
Test script to verify analysis data storage in PostgreSQL
"""
import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Import required modules
from config.database_config import ENABLE_POSTGRESQL
from src.postgres_analysis_data_manager import PostgresAnalysisDataManager
from src.analysis_service_integration import get_analysis_service

def test_analysis_storage():
    """Test that analysis data can be stored and retrieved"""
    print("🔍 Testing Analysis Data Storage...")
    
    # Check PostgreSQL configuration
    print(f"📊 PostgreSQL enabled: {ENABLE_POSTGRESQL}")
    
    if not ENABLE_POSTGRESQL:
        print("❌ PostgreSQL not enabled. Check config/database_config.py")
        return False
    
    try:
        # Test PostgreSQL connection
        print("🔗 Testing PostgreSQL connection...")
        data_manager = PostgresAnalysisDataManager()
        
        # Test storing analysis data
        print("💾 Testing analysis data storage...")
        test_analysis_id = data_manager.store_analysis(
            thread_id="test_thread_" + str(int(time.time())),
            task_name="Test Analysis Storage",
            input_data={"test": "data", "timestamp": str(datetime.now())},
            output_data={"result": "success", "test_passed": True},
            session_id="test_session",
            process_instance_id="test_process_123",
            tags=["test", "debug"],
            source_service="test_script"
        )
        
        print(f"✅ Analysis stored with ID: {test_analysis_id}")
        
        # Test retrieving analysis data
        print("🔍 Testing analysis data retrieval...")
        retrieved = data_manager.get_analysis(test_analysis_id)
        
        if retrieved:
            print("✅ Analysis data retrieved successfully")
            print(f"   Task: {retrieved.metadata.task_name}")
            print(f"   Status: {retrieved.metadata.status}")
            print(f"   Created: {retrieved.metadata.created_at}")
        else:
            print("❌ Failed to retrieve analysis data")
            return False
        
        # Test searching recent analyses
        print("🔍 Testing analysis search...")
        recent_analyses = data_manager.search_analyses(limit=5)
        
        print(f"✅ Found {len(recent_analyses)} recent analyses")
        if recent_analyses:
            for analysis in recent_analyses:
                print(f"   {analysis.metadata.created_at}: {analysis.metadata.task_name}")
        
        # Test analysis service integration
        print("🔗 Testing analysis service integration...")
        analysis_service = get_analysis_service()
        
        if analysis_service:
            print("✅ Analysis service integration available")
            
            # Test storing via service integration
            service_analysis_id = analysis_service.store_task_analysis(
                task_description="Test via service integration",
                task_id="test_task_" + str(int(time.time())),
                task_name="Service Integration Test",
                variables={"service_test": True},
                response_data={"service_result": "success"},
                process_instance_id="test_process_456",
                service_name="test_service",
                tags=["service_test", "integration"]
            )
            
            print(f"✅ Service integration stored analysis: {service_analysis_id}")
        else:
            print("❌ Analysis service integration not available")
            return False
        
        # Close connection
        data_manager.close()
        
        print("🎉 All tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    import time
    from datetime import datetime
    
    success = test_analysis_storage()
    
    if success:
        print("\n✅ Analysis storage is working correctly!")
        print("\nIf you're still not seeing new analyses in the viewer:")
        print("1. Check if the backend server is running the latest code")
        print("2. Verify the process management page is starting external task workers")
        print("3. Check the backend logs for any errors")
    else:
        print("\n❌ Analysis storage has issues that need to be fixed")
        
    sys.exit(0 if success else 1) 