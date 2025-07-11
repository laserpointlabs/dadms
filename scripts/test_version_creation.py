#!/usr/bin/env python3
"""
Debug version creation
"""

import requests
import json

BASE_URL = "http://localhost:3001"

# Get a prompt to test
response = requests.get(f"{BASE_URL}/prompts")
if response.ok and response.json()['data']:
    prompt = response.json()['data'][0]
    prompt_id = prompt['id']
    current_version = prompt['version']
    
    print(f"Testing with prompt: {prompt['name']}")
    print(f"Current version: {current_version}")
    
    # Try to update
    update_data = {
        "text": prompt['text'] + "\n\nUpdated text.",
        "test_cases": prompt['test_cases']  # Include existing test cases
    }
    
    print("\nUpdating prompt...")
    response = requests.put(f"{BASE_URL}/prompts/{prompt_id}", json=update_data)
    print(f"Status: {response.status_code}")
    
    if response.ok:
        updated = response.json()['data']
        print(f"✅ New version: {updated['version']}")
        print(f"   Text updated: {'Updated text' in updated['text']}")
    else:
        print(f"❌ Error: {response.text}")
else:
    print("No prompts found") 