#!/usr/bin/env python3
"""
Debug OpenAI Service Data Flow

Test what data is actually being passed to the persistence manager.
"""

import requests
import json
import sys
import os

# Add project root to path
project_root = os.path.dirname(__file__)
sys.path.insert(0, project_root)

from src.data_persistence_manager import DataPersistenceManager

def test_openai_service():
    """Test direct call to OpenAI service"""
    
    print("=== TESTING OPENAI SERVICE DIRECTLY ===")
    
    # Test data that would come from DADM
    test_payload = {
        "task_description": "Identify alternatives for UAS platform selection for disaster response",
        "task_id": "test_task_123",
        "task_name": "IdentifyAlternatives", 
        "variables": {
            "decision_context": "Emergency disaster response UAS selection"
        }
    }
    
    print(f"Sending payload to OpenAI service:")
    print(json.dumps(test_payload, indent=2))
    
    try:
        # Call OpenAI service directly
        response = requests.post(
            "http://localhost:5000/process_task",
            json=test_payload,
            timeout=30
        )
        
        print(f"\nResponse status: {response.status_code}")
        print(f"Response data:")
        response_data = response.json()
        print(json.dumps(response_data, indent=2))
        
        # Check if there's a recommendation
        if "result" in response_data and "recommendation" in response_data["result"]:
            print("\n=== FOUND RECOMMENDATION DATA ===")
            recommendation = response_data["result"]["recommendation"]
            print(f"Recommendation type: {type(recommendation)}")
            print(f"Recommendation: {recommendation[:200]}...")
            
            # Test our persistence manager directly
            print("\n=== TESTING PERSISTENCE MANAGER ===")
            pm = DataPersistenceManager()
            
            # Simulate what the service should do
            task_data = {
                "task_name": "IdentifyAlternatives",
                "recommendation": recommendation,
                "processed_by": "OpenAI Service Test",
                "processed_at": "2025-06-10T16:00:00"
            }
            
            success = pm.store_interaction(
                run_id="test_run_123",
                process_instance_id="test_process_123", 
                task_data=task_data
            )
            
            print(f"Persistence result: {success}")
            
            # Query the results
            print("\n=== CHECKING RESULTS ===")
            results = pm.query_graph("MATCH (n) RETURN labels(n) as labels, count(n) as count")
            for result in results:
                print(f"Node type: {result['labels']}, Count: {result['count']}")
                
        else:
            print("\n❌ NO RECOMMENDATION DATA FOUND IN RESPONSE")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_openai_service()
