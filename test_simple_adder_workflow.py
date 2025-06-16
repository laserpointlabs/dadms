#!/usr/bin/env python3
"""
Test script for the simplified BPMN adder process
This demonstrates the basic workflow: LLM formatting -> Analysis execution
"""

import json
import requests
import time

def test_llm_formatting():
    """
    Test what the basic LLM would produce when formatting numbers for addition
    """
    print("=" * 50)
    print("TESTING BASIC LLM FORMATTING")
    print("=" * 50)
    
    # This represents what the basic LLM should produce
    llm_formatted_data = {
        "analysis_template": "adder",
        "item1": 10,
        "item2": 20
    }
    
    print("LLM would format numbers for addition:")
    print(json.dumps(llm_formatted_data, indent=2))
    return llm_formatted_data

def test_adder_execution(formatted_data):
    """
    Test the adder script execution via analysis service
    """
    print("\n" + "=" * 50)
    print("TESTING ADDER EXECUTION")
    print("=" * 50)
    
    # Add context metadata to formatted data
    formatted_data["context_metadata"] = {
        "service_task_name": "AddNumbersTask",
        "bpmn_process_id": "Simple_Adder_Process",
        "execution_context": "simple_addition_test"
    }
    
    # Add context metadata
    request_data = {
        "script_id": "adder",
        "input_data": formatted_data
    }
    
    try:
        # Call the analysis service
        response = requests.post(
            "http://localhost:8004/execute",
            json=request_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Addition completed successfully!")
            print(f"Numbers: {formatted_data['item1']} + {formatted_data['item2']}")
            print(f"Result: {result['result']}")
            print(f"Execution time: {result['execution_metadata']['execution_duration']:.3f} seconds")
            return result
        else:
            print(f"❌ Addition failed with status {response.status_code}")
            print(f"Error: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to analysis service at http://localhost:8004")
        print("Make sure the analysis service is running")
        return None
    except Exception as e:
        print(f"❌ Error executing addition: {e}")
        return None

def demonstrate_simple_workflow():
    """
    Demonstrate the complete simple workflow
    """
    print("🔄 DEMONSTRATING SIMPLE ADDER WORKFLOW")
    print("=" * 50)
    print("Process: Simple_Adder_Process")
    print("Steps:")
    print("  1. Format Numbers for Addition (Basic LLM)")
    print("  2. Add Numbers (Analysis Service)")
    print()
    
    # Step 1: LLM formatting (simulated)
    formatted_data = test_llm_formatting()
    
    # Step 2: Analysis execution
    analysis_result = test_adder_execution(formatted_data)
    
    if analysis_result:
        print("\n" + "=" * 50)
        print("🎯 SIMPLE WORKFLOW COMPLETION")
        print("=" * 50)
        print("✅ Simple adder process completed successfully!")
        print("✅ LLM formatting and analysis integration working")
        print("✅ Basic pipeline ready for more complex workflows")
        return True
    else:
        print("\n❌ Simple workflow failed")
        return False

if __name__ == "__main__":
    success = demonstrate_simple_workflow()
    exit(0 if success else 1)
