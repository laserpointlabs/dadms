#!/usr/bin/env python3
"""
Detailed Thread Persistence Test for OpenAI Service

This test performs a comprehensive check of thread persistence functionality
and logs detailed information about thread management.
"""

import requests
import json
import time
import uuid
from datetime import datetime

# Test configuration
OPENAI_SERVICE_URL = "http://localhost:5000"
TEST_PROCESS_ID = f"detailed_test_{uuid.uuid4()}"

def test_service_availability():
    """Test if the OpenAI service is available"""
    try:
        response = requests.get(f"{OPENAI_SERVICE_URL}/health", timeout=10)
        return response.status_code == 200
    except:
        return False

def send_task_request(task_description, process_instance_id, task_id_suffix=""):
    """Send a task request to the OpenAI service"""
    task_id = f"detailed_task_{task_id_suffix}_{uuid.uuid4()}"
    
    payload = {
        "task_description": task_description,
        "task_id": task_id,
        "process_instance_id": process_instance_id,
        "variables": {
            "test_timestamp": datetime.now().isoformat(),
            "test_type": "thread_persistence_detailed"
        }
    }
    
    print(f"Sending request with process_instance_id: {process_instance_id}")
    print(f"Task ID: {task_id}")
    
    try:
        response = requests.post(
            f"{OPENAI_SERVICE_URL}/process_task",
            json=payload,
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            thread_id = result.get("result", {}).get("thread_id", "Unknown")
            print(f"✓ Request successful - Thread ID: {thread_id}")
            return result, thread_id
        else:
            print(f"✗ Request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return None, None
            
    except Exception as e:
        print(f"✗ Request failed with exception: {e}")
        return None, None

def main():
    print("=== Detailed OpenAI Service Thread Persistence Test ===")
    print(f"Test started at: {datetime.now()}")
    
    # Check service availability
    if not test_service_availability():
        print("✗ OpenAI service is not available")
        return
    
    print("✓ OpenAI service is available")
    
    # Test 1: Multiple tasks with same process instance
    print(f"\nTesting with process_instance_id: {TEST_PROCESS_ID}")
    
    print("\n=== Test 1: First Task ===")
    result1, thread1 = send_task_request(
        "Hello, I'm starting a conversation. My name is Alice and I like mathematics.",
        TEST_PROCESS_ID,
        "1"
    )
    
    if not result1:
        print("✗ First task failed")
        return
    
    print(f"First task thread: {thread1}")
    
    # Wait a moment
    time.sleep(2)
    
    print("\n=== Test 2: Second Task (Same Process) ===")
    result2, thread2 = send_task_request(
        "What is my name and what subject do I like? Please refer to our previous conversation.",
        TEST_PROCESS_ID,
        "2"
    )
    
    if not result2:
        print("✗ Second task failed")
        return
    
    print(f"Second task thread: {thread2}")
    
    # Check thread persistence
    print(f"\n=== Thread Persistence Analysis ===")
    print(f"First thread:  {thread1}")
    print(f"Second thread: {thread2}")
    
    if thread1 == thread2:
        print("✓ THREAD PERSISTENCE WORKING: Same thread used for both tasks")
        
        # Check if context was preserved
        response_text = result2.get("result", {}).get("recommendation", "")
        if "Alice" in response_text or "alice" in response_text.lower():
            print("✓ CONTEXT PRESERVATION WORKING: Assistant remembered the name")
        else:
            print("✗ CONTEXT PRESERVATION FAILED: Assistant didn't remember the name")
            
        if "math" in response_text.lower():
            print("✓ CONTEXT PRESERVATION WORKING: Assistant remembered the subject preference")
        else:
            print("✗ CONTEXT PRESERVATION FAILED: Assistant didn't remember the subject preference")
            
    else:
        print("✗ THREAD PERSISTENCE FAILED: Different threads used")
        print("This indicates the thread persistence mechanism is not working correctly")
    
    # Test 3: Different process instance should use different thread
    print("\n=== Test 3: Different Process Instance ===")
    different_process_id = f"different_test_{uuid.uuid4()}"
    
    result3, thread3 = send_task_request(
        "Hello, I'm Bob and I like science.",
        different_process_id,
        "3"
    )
    
    if result3:
        print(f"Different process thread: {thread3}")
        
        if thread3 != thread1:
            print("✓ PROCESS ISOLATION WORKING: Different process uses different thread")
        else:
            print("✗ PROCESS ISOLATION FAILED: Different process reused same thread")
    
    # Summary
    print(f"\n=== Test Summary ===")
    tests_passed = 0
    total_tests = 3
    
    if thread1 == thread2:
        tests_passed += 1
        print("✓ Thread persistence: PASSED")
    else:
        print("✗ Thread persistence: FAILED")
    
    if thread1 == thread2:
        response_text = result2.get("result", {}).get("recommendation", "")
        if ("Alice" in response_text or "alice" in response_text.lower()) and "math" in response_text.lower():
            tests_passed += 1
            print("✓ Context preservation: PASSED")
        else:
            print("✗ Context preservation: FAILED")
    else:
        print("✗ Context preservation: SKIPPED (thread persistence failed)")
    
    if result3 and thread3 != thread1:
        tests_passed += 1
        print("✓ Process isolation: PASSED")
    else:
        print("✗ Process isolation: FAILED")
    
    print(f"\nTests passed: {tests_passed}/{total_tests}")
    
    if tests_passed == total_tests:
        print("🎉 All thread persistence tests PASSED!")
    else:
        print("❌ Some thread persistence tests FAILED!")
    
    # Print full responses for debugging
    print(f"\n=== Full Responses for Debugging ===")
    print(f"Response 1: {json.dumps(result1, indent=2)}")
    print(f"Response 2: {json.dumps(result2, indent=2)}")
    if result3:
        print(f"Response 3: {json.dumps(result3, indent=2)}")

if __name__ == "__main__":
    main()
