#!/usr/bin/env python3
"""
Service Orchestrator Integration Example

Shows how to integrate the new Analysis Data Manager with the Service Orchestrator
"""
import sys
sys.path.insert(0, '.')

def demonstrate_orchestrator_integration():
    """Demonstrate how to integrate analysis data management with service orchestrator"""
    print("=" * 70)
    print("Service Orchestrator Integration with Analysis Data Manager")
    print("=" * 70)
    
    try:
        from src.analysis_service_integration import get_analysis_service
        
        # Get analysis service (this would be done once during orchestrator initialization)
        print("1. Initializing analysis service...")
        analysis_service = get_analysis_service(
            storage_dir='./test_data/analysis_storage',
            enable_vector_store=True,  # Enable for production
            enable_graph_db=True,      # Enable for production
            auto_process=True          # Enable auto-processing
        )
        print("✅ Analysis service initialized")
        
        # Simulate task routing scenario
        print("\n2. Simulating task routing...")
        
        # Mock task object
        class MockTask:
            def __init__(self, task_id, activity_id, process_instance_id):
                self.task_id = task_id
                self.activity_id = activity_id
                self.process_instance_id = process_instance_id
            
            def get_activity_id(self):
                return self.activity_id
            
            def get_process_instance_id(self):
                return self.process_instance_id
        
        # Mock task variables
        task = MockTask("task_123", "decision_analysis_task", "proc_inst_456")
        variables = {
            "decision_type": "vendor_selection",
            "budget": 100000,
            "timeline": "6 months",
            "stakeholders": ["IT Team", "Finance", "Management"]
        }
        
        # Simulate service routing result
        service_result = {
            "status": "success",
            "recommendation": {
                "primary_choice": "Vendor A",
                "confidence": 0.88,
                "criteria_scores": {
                    "cost": 0.9,
                    "quality": 0.85,
                    "support": 0.9
                },
                "reasoning": "Vendor A offers the best combination of cost-effectiveness and quality"
            },
            "alternatives": ["Vendor B", "Vendor C"],
            "total_cost": 85000
        }
        
        # This is where you would integrate in the service orchestrator
        print("   Storing task analysis result...")
        analysis_id = analysis_service.store_task_analysis(
            task_description=f"Vendor selection decision for budget ${variables['budget']}",
            task_id=task.task_id,
            task_name="Vendor Selection Analysis",
            variables=variables,
            response_data=service_result,
            thread_id=f"process_{task.process_instance_id}",
            process_instance_id=task.process_instance_id,
            service_name="dadm-openai-assistant",
            tags=["vendor_selection", "decision", "procurement"]
        )
        print(f"✅ Task analysis stored with ID: {analysis_id}")
        
        # Demonstrate querying capabilities
        print("\n3. Demonstrating query capabilities...")
        
        # Get process history
        process_analyses = analysis_service.get_thread_conversation(
            f"process_{task.process_instance_id}"
        )
        print(f"✅ Found {len(process_analyses)} analyses in this process")
        
        # Search by tags
        procurement_analyses = analysis_service.search_analyses(
            tags=["procurement"],
            limit=10
        )
        print(f"✅ Found {len(procurement_analyses)} procurement-related analyses")
        
        # Get processing status
        status = analysis_service.get_processing_status(analysis_id)
        print(f"✅ Processing status: {len(status['tasks'])} tasks")
        
        # Show how to trigger manual processing
        print("\n4. Triggering background processing...")
        processed = analysis_service.process_pending_analyses(limit=5)
        print(f"✅ Processed {processed} pending analyses")
        
        # Demonstrate statistics for monitoring
        print("\n5. Getting system statistics...")
        stats = analysis_service.get_service_stats()
        print(f"✅ System statistics:")
        print(f"   Total analyses: {stats['total_analyses']}")
        print(f"   Backends enabled: {stats['backends_enabled']}")
        
        analysis_service.close()
        print("\n✅ Integration demonstration completed successfully!")
        
        # Show integration points
        print("\n" + "=" * 70)
        print("INTEGRATION POINTS FOR SERVICE ORCHESTRATOR")
        print("=" * 70)
        print("""
1. Initialization (in ServiceOrchestrator.__init__):
   ```python
   from src.analysis_service_integration import get_analysis_service
   self.analysis_service = get_analysis_service()
   ```

2. Task Routing (in route_task method):
   ```python
   # After getting service result
   analysis_id = self.analysis_service.store_task_analysis(
       task_description=task_description,
       task_id=task.get_activity_id(),
       task_name=task_name,
       variables=variables,
       response_data=result,
       thread_id=f"process_{task.get_process_instance_id()}",
       process_instance_id=task.get_process_instance_id(),
       service_name=service_name,
       tags=["decision", "analysis"]
   )
   ```

3. Monitoring (add new endpoint):
   ```python
   def get_analysis_stats(self):
       return self.analysis_service.get_service_stats()
   ```

4. Process History (add new capability):
   ```python
   def get_process_history(self, process_instance_id):
       return self.analysis_service.get_thread_conversation(
           f"process_{process_instance_id}"
       )
   ```
        """)
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error during integration demonstration: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = demonstrate_orchestrator_integration()
    
    if success:
        print("\n🎉 Integration demonstration successful!")
        print("The new analysis data management system is ready for production use.")
    else:
        print("\n⚠️ Integration demonstration failed. Please check the errors above.")
