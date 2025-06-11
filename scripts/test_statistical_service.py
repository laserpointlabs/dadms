#!/usr/bin/env python3
"""
Test script to verify the enhanced statistical service works
"""

import requests
import json

def test_statistical_service():
    """Test the statistical service with sample data"""
    
    # Test data with nested structure (like from DADM workflow)
    test_data = {
        "task_name": "statistical_analysis_test",
        "task_description": "Test enhanced data extraction",
        "variables": {
            "alternatives": [
                {"name": "AeroMapper X8", "cost": 125000, "performance_score": 8.5, "reliability": 0.95},
                {"name": "SkyDrone Pro", "cost": 98000, "performance_score": 7.8, "reliability": 0.88},
                {"name": "TechCopter Elite", "cost": 110000, "performance_score": 8.2, "reliability": 0.92}
            ],
            "budget_limit": 120000,
            "analysis_type": "descriptive"
        },
        "service_properties": {
            "service.type": "analytics",
            "service.name": "mcp-statistical-service"
        }
    }
    
    try:
        print("Testing enhanced statistical service...")
        print(f"Sending test data: {json.dumps(test_data, indent=2)}")
        
        response = requests.post(
            "http://localhost:5201/process_task",
            json=test_data,
            timeout=30
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response content: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Success! Enhanced data extraction worked.")
            print(f"Analysis result: {json.dumps(result, indent=2)}")
            return True
        else:
            print(f"❌ Failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_statistical_service()
    exit(0 if success else 1)
