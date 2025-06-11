#!/usr/bin/env python3
"""
Service Orchestrator Analysis Integration

This file shows how to integrate the new Analysis Data Manager with the Service Orchestrator.
Copy these methods into your service_orchestrator.py file.
"""

# Add this import at the top of service_orchestrator.py
try:
    from src.analysis_service_integration import get_analysis_service
    ANALYSIS_SERVICE_AVAILABLE = True
except ImportError:
    ANALYSIS_SERVICE_AVAILABLE = False
    print("Analysis service integration not available")

class ServiceOrchestratorIntegration:
    """
    Integration methods for ServiceOrchestrator
    """
    
    def __init__(self):
        """Add this to your ServiceOrchestrator.__init__ method"""
        
        # Initialize analysis service integration
        self.analysis_service = None
        if ANALYSIS_SERVICE_AVAILABLE:
            try:
                self.analysis_service = get_analysis_service(
                    enable_vector_store=True,
                    enable_graph_db=True,
                    auto_process=True
                )
                print("✅ Analysis service integration initialized")
            except Exception as e:
                print(f"⚠️ Failed to initialize analysis service: {e}")
        else:
            print("⚠️ Analysis service integration not available")
    
    def route_task_with_analysis(self, task, variables=None):
        """
        Enhanced route_task method with analysis data management
        
        Add this logic to your existing route_task method:
        """
        # Your existing route_task logic here...
        # result = your_existing_route_logic(task, variables)
        
        # Example of calling a service (replace with your actual service call)
        result = {
            "status": "success",
            "recommendation": "Example recommendation",
            "confidence": 0.9
        }
        
        # NEW: Store analysis data after successful task routing
        if self.analysis_service and result.get("status") == "success":
            try:
                # Extract task information
                task_id = getattr(task, 'get_activity_id', lambda: 'unknown')()
                process_instance_id = getattr(task, 'get_process_instance_id', lambda: None)()
                
                # Store the analysis
                analysis_id = self.analysis_service.store_task_analysis(
                    task_description=f"Task execution: {task_id}",
                    task_id=task_id,
                    task_name=task_id,
                    variables=variables or {},
                    response_data=result,
                    thread_id=f"process_{process_instance_id}" if process_instance_id else f"task_{task_id}",
                    process_instance_id=process_instance_id,
                    service_name="service_orchestrator",
                    tags=["task_routing", "orchestration"]
                )
                
                # Add analysis ID to result for tracking
                result["analysis_id"] = analysis_id
                print(f"✅ Stored task analysis: {analysis_id}")
                
            except Exception as e:
                print(f"⚠️ Failed to store task analysis: {e}")
                # Don't fail the task routing if analysis storage fails
        
        return result
    
    def get_process_history(self, process_instance_id):
        """
        Get analysis history for a process instance
        
        Add this as a new method to ServiceOrchestrator:
        """
        if not self.analysis_service:
            return []
        
        try:
            return self.analysis_service.get_thread_conversation(
                f"process_{process_instance_id}"
            )
        except Exception as e:
            print(f"Error getting process history: {e}")
            return []
    
    def get_analysis_statistics(self):
        """
        Get analysis statistics for monitoring
        
        Add this as a new method to ServiceOrchestrator:
        """
        if not self.analysis_service:
            return {"error": "Analysis service not available"}
        
        try:
            return self.analysis_service.get_service_stats()
        except Exception as e:
            print(f"Error getting analysis statistics: {e}")
            return {"error": str(e)}
    
    def search_related_analyses(self, tags=None, task_name_pattern=None, limit=50):
        """
        Search for related analyses
        
        Add this as a new method to ServiceOrchestrator:
        """
        if not self.analysis_service:
            return []
        
        try:
            return self.analysis_service.search_analyses(
                tags=tags,
                query=task_name_pattern,
                limit=limit
            )
        except Exception as e:
            print(f"Error searching analyses: {e}")
            return []
    
    def close(self):
        """Add this to your ServiceOrchestrator.close method"""
        if self.analysis_service:
            try:
                self.analysis_service.close()
                print("✅ Closed analysis service")
            except Exception as e:
                print(f"⚠️ Error closing analysis service: {e}")


def demonstrate_integration():
    """Demonstrate the integration"""
    print("=" * 60)
    print("Service Orchestrator Analysis Integration Demo")
    print("=" * 60)
    
    # Create integration instance
    orchestrator = ServiceOrchestratorIntegration()
    
    # Mock task object
    class MockTask:
        def get_activity_id(self):
            return "demo_task_001"
        
        def get_process_instance_id(self):
            return "proc_inst_demo_001"
    
    task = MockTask()
    variables = {
        "decision_type": "technology_selection",
        "budget": 75000,
        "timeline": "4 months"
    }
    
    # Demonstrate task routing with analysis
    print("\n1. Routing task with analysis...")
    result = orchestrator.route_task_with_analysis(task, variables)
    print(f"✅ Task routed with result: {result}")
    
    # Demonstrate getting process history
    print("\n2. Getting process history...")
    history = orchestrator.get_process_history("proc_inst_demo_001")
    print(f"✅ Found {len(history)} items in process history")
    
    # Demonstrate getting statistics
    print("\n3. Getting analysis statistics...")
    stats = orchestrator.get_analysis_statistics()
    print(f"✅ Analysis statistics: {stats.get('total_analyses', 0)} total analyses")
    
    # Demonstrate searching analyses
    print("\n4. Searching related analyses...")
    related = orchestrator.search_related_analyses(tags=["orchestration"])
    print(f"✅ Found {len(related)} related analyses")
    
    # Close
    orchestrator.close()
    
    print("\n✅ Integration demonstration completed!")
    
    # Show integration summary
    print("\n" + "=" * 60)
    print("INTEGRATION SUMMARY")
    print("=" * 60)
    print("""
To integrate analysis data management with your Service Orchestrator:

1. Add the import and initialization code to your ServiceOrchestrator class
2. Modify your route_task method to store analysis data
3. Add the new methods for process history and statistics
4. Add the close method to clean up connections

Key Benefits:
✅ Automatic storage of all task executions
✅ Thread-based conversation tracking per process
✅ Vector search and graph database expansion
✅ Real-time statistics and monitoring
✅ Background processing for performance
✅ CLI tools for data management

The analysis data is stored with:
- Process instance IDs for workflow tracking
- Thread IDs for conversation history
- Tags for categorization
- Full input/output data for analysis
- Automatic processing into vector store and graph DB
    """)


if __name__ == "__main__":
    demonstrate_integration()
