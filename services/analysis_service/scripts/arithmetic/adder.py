#!/usr/bin/env python3
"""
Simple Addition Analysis Script
Adds two numbers with full execution metadata
"""
import json
import time
from datetime import datetime

def execute(input_data):
    """
    Execute addition analysis
    
    Args:
        input_data (dict): Input containing item1, item2, and context_metadata
        
    Returns:
        dict: Addition result with execution metadata
    """
    start_time = time.time()
    
    # Extract inputs
    item1 = input_data.get('item1', 0)
    item2 = input_data.get('item2', 0)
    context_metadata = input_data.get('context_metadata', {})
    
    # Perform calculation
    result = item1 + item2
    
    # Calculate execution time
    execution_time = time.time() - start_time
    
    # Build response
    response = {
        "service_task_name": context_metadata.get('service_task_name', 'unknown'),
        "instructions": f"Successfully added {item1} + {item2} using simple arithmetic",
        "result": result,
        "operation": "addition",
        "confidence": 1.0,  # 100% confidence for basic arithmetic
        "details": {
            "formula": f"{item1} + {item2} = {result}",
            "operands": [item1, item2],
            "execution_time": execution_time
        },
        "execution_metadata": {
            "script_id": "adder",
            "script_version": "1.0",
            "execution_timestamp": datetime.now().isoformat(),
            "execution_duration": execution_time,
            "context_preserved": bool(context_metadata)
        }
    }
    
    return response

if __name__ == "__main__":
    # Test the script
    test_input = {
        "item1": 5,
        "item2": 10,
        "context_metadata": {
            "service_task_name": "AddNumbers",
            "process_instance_id": "proc_123",
            "thread_id": "thread_456"
        }
    }
    
    result = execute(test_input)
    print(json.dumps(result, indent=2))
