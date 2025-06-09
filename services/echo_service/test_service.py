"""
Test script for the Echo Service

This script tests the Echo Service by sending requests to each endpoint
and verifying the responses.
"""
import os
import sys
import json
import requests
import argparse
from datetime import datetime

def test_health(base_url):
    """Test the health endpoint"""
    print("\n=== Testing Health Endpoint ===")
    url = f"{base_url}/health"
    print(f"GET {url}")
    
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Response:")
            print(json.dumps(data, indent=2))
            
            # Verify response fields
            assert data["status"] == "healthy"
            assert data["service"] == "echo"
            assert data["type"] == "test"
            assert data["version"] == "1.0"
            
            print("✓ Health check successful")
            return True
        else:
            print(f"✗ Failed with status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_info(base_url):
    """Test the info endpoint"""
    print("\n=== Testing Info Endpoint ===")
    url = f"{base_url}/info"
    print(f"GET {url}")
    
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Response:")
            print(json.dumps(data, indent=2))
            
            # Verify response fields
            assert data["name"] == "echo"
            assert data["type"] == "test"
            assert data["version"] == "1.0"
            assert "description" in data
            assert "endpoints" in data
            
            print("✓ Info check successful")
            return True
        else:
            print(f"✗ Failed with status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_process(base_url, task_name="TestTask", variables=None, options=None):
    """Test the process endpoint"""
    print("\n=== Testing Process Endpoint ===")
    url = f"{base_url}/process"
    
    # Default test data
    variables = variables or {"test_key": "test_value", "number": 42}
    options = options or {"delay": 1}
    
    payload = {
        "task_name": task_name,
        "variables": variables,
        "options": options
    }
    
    print(f"POST {url}")
    print("Payload:")
    print(json.dumps(payload, indent=2))
    
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Response:")
            print(json.dumps(data, indent=2))
            
            # Verify response fields
            assert "result" in data
            assert data["result"]["task_name"] == task_name
            assert "processed_by" in data["result"]
            assert "processed_at" in data["result"]
            assert "processing_time_ms" in data["result"]
            assert "echo" in data["result"]
            assert data["result"]["echo"]["input_variables"] == variables
            assert data["result"]["echo"]["input_options"] == options
            
            print("✓ Process request successful")
            return True
        else:
            print(f"✗ Failed with status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def main():
    """Main function to run tests"""
    parser = argparse.ArgumentParser(description="Test the Echo Service")
    parser.add_argument("--host", default="localhost", help="Host where the service is running")
    parser.add_argument("--port", type=int, default=5100, help="Port where the service is running")
    parser.add_argument("--endpoint", choices=["health", "info", "process", "all"], default="all", 
                       help="Endpoint to test (default: all)")
    args = parser.parse_args()
    
    base_url = f"http://{args.host}:{args.port}"
    print(f"Testing Echo Service at {base_url}")
    
    success = []
    
    if args.endpoint in ["health", "all"]:
        success.append(test_health(base_url))
    
    if args.endpoint in ["info", "all"]:
        success.append(test_info(base_url))
    
    if args.endpoint in ["process", "all"]:
        success.append(test_process(base_url))
    
    # Print summary
    print("\n=== Test Summary ===")
    if all(success):
        print("✓ All tests passed!")
    else:
        print(f"✗ {success.count(False)}/{len(success)} tests failed")
    
    return 0 if all(success) else 1

if __name__ == "__main__":
    sys.exit(main())