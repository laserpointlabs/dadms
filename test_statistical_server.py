#!/usr/bin/env python3
"""
Simple test script for the MCP Statistical Server
"""

import asyncio
import json
from mcp_servers.mcp_statistical_server import calculate_statistics

async def test_calculate_statistics():
    """Test the calculate_statistics function with sample data"""
    
    print("=== Testing MCP Statistical Server - calculate_statistics ===\n")
    
    # Test Case 1: Simple dataset with distribution tests
    print("Test Case 1: Normal-like dataset with distribution tests")
    test_data_1 = {
        "data": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        "include_distribution_tests": True
    }
    
    result_1 = await calculate_statistics(test_data_1)
    print("Input:", test_data_1["data"])
    print("Result:")
    print(result_1[0].text)
    print("\n" + "="*60 + "\n")
    
    # Test Case 2: Larger dataset with more variation
    print("Test Case 2: Larger dataset with more variation")
    test_data_2 = {
        "data": [12, 15, 18, 22, 25, 28, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95],
        "include_distribution_tests": True
    }
    
    result_2 = await calculate_statistics(test_data_2)
    print("Input: 20 data points from 12 to 95")
    print("Result:")
    print(result_2[0].text)
    print("\n" + "="*60 + "\n")
    
    # Test Case 3: Small dataset without distribution tests
    print("Test Case 3: Small dataset without distribution tests")
    test_data_3 = {
        "data": [100, 200, 150],
        "include_distribution_tests": False
    }
    
    result_3 = await calculate_statistics(test_data_3)
    print("Input:", test_data_3["data"])
    print("Result:")
    print(result_3[0].text)
    print("\n" + "="*60 + "\n")
    
    # Test Case 4: Dataset with decimals
    print("Test Case 4: Dataset with decimal values")
    test_data_4 = {
        "data": [1.5, 2.7, 3.2, 4.8, 5.1, 6.9, 7.3, 8.6, 9.2, 10.4],
        "include_distribution_tests": True
    }
    
    result_4 = await calculate_statistics(test_data_4)
    print("Input:", test_data_4["data"])
    print("Result:")
    print(result_4[0].text)

if __name__ == "__main__":
    asyncio.run(test_calculate_statistics())
