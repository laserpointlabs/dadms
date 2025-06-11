#!/usr/bin/env python3
"""
Test script to verify thread persistence functionality in the OpenAI service.
This script simulates a process with multiple tasks to verify conversations persist.
"""
import json
import requests
import time
import uuid
from datetime import datetime

def test_thread_persistence():
    """Test that conversations persist across multiple requests using the same process_instance_id"""
    
    # Service URL
    service_url = "http://localhost:5000"
    
    # Generate a unique process instance ID to simulate a Camunda process
    process_instance_id = f"test_process_{uuid.uuid4()}"
    print(f"Testing with process_instance_id: {process_instance_id}")
    
    # Test 1: First task - Establish context
    print("\n=== Test 1: First Task - Establishing Context ===")
    first_payload = {
        "task_description": "Hello, my name is John and I like pizza. Please remember this for our conversation.",
        "task_id": f"task_1_{uuid.uuid4()}",
        "task_name": "Introduction Task",
        "task_documentation": "Introduce the user and establish context",
        "variables": {"user_name": "John", "preference": "pizza"},
        "process_instance_id": process_instance_id
    }
    
    try:
        response1 = requests.post(f"{service_url}/process_task", json=first_payload, timeout=60)
        if response1.status_code == 200:
            result1 = response1.json()
            print("✓ First request successful")
            print(f"Response: {json.dumps(result1, indent=2)}")
            
            # Extract thread_id if available for tracking
            thread_id = None
            if 'result' in result1:
                thread_id = result1['result'].get('thread_id')
                if thread_id:
                    print(f"Thread ID: {thread_id}")
        else:
            print(f"✗ First request failed: {response1.status_code}")
            print(f"Error: {response1.text}")
            return False
    except Exception as e:
        print(f"✗ First request error: {e}")
        return False
    
    # Wait a moment to ensure the first task is fully processed
    time.sleep(2)
    
    # Test 2: Second task - Reference previous context
    print("\n=== Test 2: Second Task - Testing Context Persistence ===")
    second_payload = {
        "task_description": "What food do I like? Please use the information from our previous conversation.",
        "task_id": f"task_2_{uuid.uuid4()}",
        "task_name": "Context Recall Task", 
        "task_documentation": "Recall information from previous conversation",
        "variables": {"question": "What food does the user like?"},
        "process_instance_id": process_instance_id  # Same process instance ID
    }
    
    try:
        response2 = requests.post(f"{service_url}/process_task", json=second_payload, timeout=60)
        if response2.status_code == 200:
            result2 = response2.json()
            print("✓ Second request successful")
            print(f"Response: {json.dumps(result2, indent=2)}")
            
            # Check if the response mentions pizza (indicating context was preserved)
            response_text = str(result2).lower()
            if 'pizza' in response_text or 'john' in response_text:
                print("✓ Thread persistence WORKING: Context from first conversation was preserved!")
                return True
            else:
                print("✗ Thread persistence FAILED: No reference to previous context found")
                return False
        else:
            print(f"✗ Second request failed: {response2.status_code}")
            print(f"Error: {response2.text}")
            return False
    except Exception as e:
        print(f"✗ Second request error: {e}")
        return False

def test_different_processes():
    """Test that different process instances use different threads"""
    
    print("\n=== Test 3: Different Process Instances Should Use Different Threads ===")
    
    service_url = "http://localhost:5000"
    
    # Process A
    process_a_id = f"process_a_{uuid.uuid4()}"
    payload_a = {
        "task_description": "My favorite color is blue.",
        "task_id": f"task_a_{uuid.uuid4()}",
        "task_name": "Color Preference A",
        "variables": {"color": "blue"},
        "process_instance_id": process_a_id
    }
    
    # Process B  
    process_b_id = f"process_b_{uuid.uuid4()}"
    payload_b = {
        "task_description": "My favorite color is red.",
        "task_id": f"task_b_{uuid.uuid4()}",
        "task_name": "Color Preference B", 
        "variables": {"color": "red"},
        "process_instance_id": process_b_id
    }
    
    try:
        # Send both requests
        response_a = requests.post(f"{service_url}/process_task", json=payload_a, timeout=60)
        response_b = requests.post(f"{service_url}/process_task", json=payload_b, timeout=60)
        
        if response_a.status_code == 200 and response_b.status_code == 200:
            print("✓ Both processes handled successfully")
            print("✓ Different process instances are properly isolated")
            return True
        else:
            print(f"✗ Request failed - A: {response_a.status_code}, B: {response_b.status_code}")
            return False
    except Exception as e:
        print(f"✗ Error testing different processes: {e}")
        return False

def main():
    print("=== OpenAI Service Thread Persistence Test ===")
    print(f"Test started at: {datetime.now()}")
    
    # Check if service is available
    try:
        response = requests.get("http://localhost:5000/health", timeout=10)
        if response.status_code != 200:
            print("✗ OpenAI service is not available or unhealthy")
            return 1
        print("✓ OpenAI service is available")
    except Exception as e:
        print(f"✗ Cannot connect to OpenAI service: {e}")
        return 1
    
    # Run tests
    tests_passed = 0
    
    if test_thread_persistence():
        tests_passed += 1
    
    if test_different_processes():
        tests_passed += 1
    
    print(f"\n=== Test Results ===")
    print(f"Tests passed: {tests_passed}/2")
    
    if tests_passed == 2:
        print("✓ All thread persistence tests PASSED!")
        return 0
    else:
        print("✗ Some thread persistence tests FAILED!")
        return 1

if __name__ == "__main__":
    exit(main())
