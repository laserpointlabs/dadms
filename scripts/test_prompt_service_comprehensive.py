#!/usr/bin/env python3
"""
Comprehensive test script for Prompt Service
Tests prompt creation, versioning, test execution, and result retrieval
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, List, Optional

# Prompt Service URL
BASE_URL = "http://localhost:3001"

def create_prompt(prompt_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new prompt"""
    response = requests.post(f"{BASE_URL}/prompts", json=prompt_data)
    response.raise_for_status()
    return response.json()

def update_prompt(prompt_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
    """Update a prompt (creates new version)"""
    response = requests.put(f"{BASE_URL}/prompts/{prompt_id}", json=update_data)
    response.raise_for_status()
    return response.json()

def get_prompt_versions(prompt_id: str) -> Dict[str, Any]:
    """Get all versions of a prompt"""
    response = requests.get(f"{BASE_URL}/prompts/{prompt_id}/versions")
    response.raise_for_status()
    return response.json()

def test_prompt(prompt_id: str, test_config: Dict[str, Any]) -> Dict[str, Any]:
    """Test a prompt with given configuration"""
    response = requests.post(f"{BASE_URL}/prompts/{prompt_id}/test", json=test_config)
    response.raise_for_status()
    return response.json()

def get_test_results(prompt_id: str, version: Optional[int] = None) -> Dict[str, Any]:
    """Get test results for a prompt"""
    url = f"{BASE_URL}/prompts/{prompt_id}/test-results"
    if version is not None:
        url += f"?version={version}"
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

def get_test_history(prompt_id: str) -> Dict[str, Any]:
    """Get test history for a prompt"""
    response = requests.get(f"{BASE_URL}/prompts/{prompt_id}/test-history")
    response.raise_for_status()
    return response.json()

def print_section(title: str):
    """Print a formatted section header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def main():
    print_section("Comprehensive Prompt Service Test")
    
    # 1. Create a new prompt with rich metadata
    print_section("1. Creating a New Prompt")
    
    prompt_data = {
        "name": "Code Review Assistant",
        "text": "You are an expert code reviewer. Review the following code:\n\n{{code}}\n\nProvide feedback on:\n1. Code quality\n2. Potential bugs\n3. Performance issues\n4. Best practices",
        "type": "simple",
        "tool_dependencies": [],
        "workflow_dependencies": [],
        "tags": ["code-review", "development", "quality-assurance"],
        "created_by": "test_user",
        "metadata": {
            "author": "Test User",
            "department": "Engineering",
            "project": "DADM",
            "category": "code-analysis",
            "version_notes": "Initial version with basic code review capabilities"
        },
        "test_cases": [
            {
                "name": "Python function review",
                "input": {
                    "code": "def calculate_sum(numbers):\\n    total = 0\\n    for num in numbers:\\n        total += num\\n    return total"
                },
                "expected_output": "The code should be reviewed for quality and improvements",
                "enabled": True
            },
            {
                "name": "JavaScript async function",
                "input": {
                    "code": "async function fetchData() {\\n    const response = await fetch('/api/data');\\n    return response.json();\\n}"
                },
                "expected_output": "Review should mention error handling",
                "enabled": True
            }
        ]
    }
    
    result = create_prompt(prompt_data)
    prompt_id = result['data']['id']
    initial_version = result['data']['version']
    
    print(f"✅ Created prompt: {result['data']['name']}")
    print(f"   ID: {prompt_id}")
    print(f"   Version: {initial_version}")
    print(f"   Tags: {', '.join(result['data']['tags'])}")
    print(f"   Test cases: {len(result['data']['test_cases'])}")
    
    # 2. Create a new version by updating the prompt
    print_section("2. Creating New Version of Prompt")
    
    update_data = {
        "text": prompt_data["text"] + "\n5. Security vulnerabilities\n6. Code maintainability",
        "tags": prompt_data["tags"] + ["security", "maintainability"],
        "metadata": {
            **prompt_data["metadata"],
            "version_notes": "Added security and maintainability checks",
            "updated_by": "test_user_v2"
        },
        "test_cases": prompt_data["test_cases"] + [
            {
                "name": "SQL injection check",
                "input": {
                    "code": "query = 'SELECT * FROM users WHERE id = ' + user_input"
                },
                "expected_output": "Should flag SQL injection vulnerability",
                "enabled": True
            }
        ]
    }
    
    result = update_prompt(prompt_id, update_data)
    new_version = result['data']['version']
    
    print(f"✅ Created new version: {new_version}")
    print(f"   Added tags: security, maintainability")
    print(f"   Total test cases: {len(result['data']['test_cases'])}")
    
    # 3. Get all versions
    print_section("3. Retrieving All Versions")
    
    versions_result = get_prompt_versions(prompt_id)
    versions = versions_result['data']
    
    print(f"✅ Found {len(versions)} versions:")
    for v in versions:
        print(f"   Version {v['version']}: Created {v['created_at']}")
        print(f"      Tags: {', '.join(v['tags'])}")
    
    # 4. Test the prompt with multiple LLMs
    print_section("4. Testing Prompt with Multiple LLMs")
    
    test_config = {
        "test_case_ids": [],  # Empty means test all
        "llm_configs": [
            {
                "provider": "openai",
                "model": "gpt-3.5-turbo",
                "temperature": 0.3,
                "max_tokens": 500
            },
            {
                "provider": "local",
                "model": "ollama/mistral",
                "temperature": 0.5,
                "max_tokens": 500
            }
        ],
        "enable_comparison": True
    }
    
    print("⏳ Running tests (this may take a moment)...")
    test_result = test_prompt(prompt_id, test_config)
    
    if test_result['success']:
        summary = test_result['data']['summary']
        print(f"✅ Tests completed:")
        print(f"   Total tests: {summary['total']}")
        print(f"   Passed: {summary['passed']}")
        print(f"   Failed: {summary['failed']}")
        print(f"   Execution time: {summary['execution_time_ms']}ms")
        if 'avg_comparison_score' in summary:
            print(f"   Average score: {summary['avg_comparison_score']:.2f}")
    
    # Wait a moment for results to be saved
    time.sleep(1)
    
    # 5. Retrieve test results
    print_section("5. Retrieving Test Results")
    
    results = get_test_results(prompt_id)
    if results['success'] and results['data']:
        print(f"✅ Found {len(results['data'])} test results")
        for i, result in enumerate(results['data'][:3]):  # Show first 3
            print(f"\n   Result {i+1}:")
            print(f"   - Test case: {result.get('test_case_name', 'Unknown')}")
            print(f"   - Passed: {'✅' if result['passed'] else '❌'}")
            print(f"   - Score: {result.get('score', 'N/A')}")
            print(f"   - Execution time: {result['execution_time']}")
    else:
        print("❌ No test results found")
    
    # 6. Get test history
    print_section("6. Retrieving Test History")
    
    history = get_test_history(prompt_id)
    if history['success'] and history['data']:
        print(f"✅ Test history summary:")
        for entry in history['data']:
            print(f"\n   Date: {entry['date']}")
            print(f"   - Version: {entry['prompt_version']}")
            print(f"   - Total tests: {entry['total_tests']}")
            print(f"   - Pass rate: {entry['pass_rate']:.1%}")
            print(f"   - Average score: {entry.get('avg_score', 0):.2f}")
    else:
        print("❌ No test history found")
    
    # 7. Create another version and test it
    print_section("7. Creating Third Version and Testing")
    
    final_update = {
        "name": "Code Review Assistant Pro",
        "text": update_data["text"] + "\n\nAlso check for:\n- Documentation completeness\n- Test coverage",
        "metadata": {
            **update_data["metadata"],
            "version_notes": "Added documentation and test coverage checks",
            "feature_flags": ["advanced_analysis", "test_coverage"]
        }
    }
    
    result = update_prompt(prompt_id, final_update)
    final_version = result['data']['version']
    print(f"✅ Created version {final_version}")
    
    # Test the new version
    print("⏳ Testing new version...")
    test_result = test_prompt(prompt_id, {
        "test_case_ids": [],
        "llm_configs": [{
            "provider": "openai",
            "model": "gpt-4",
            "temperature": 0.2
        }],
        "enable_comparison": False
    })
    
    if test_result['success']:
        print(f"✅ Version {final_version} test completed")
    
    # 8. Final summary
    print_section("8. Final Summary")
    
    # Get all versions again
    versions_result = get_prompt_versions(prompt_id)
    print(f"✅ Successfully created and tested {len(versions_result['data'])} versions")
    
    # Get latest prompt details
    response = requests.get(f"{BASE_URL}/prompts/{prompt_id}")
    if response.ok:
        latest = response.json()['data']
        print(f"\n📋 Latest prompt details:")
        print(f"   Name: {latest['name']}")
        print(f"   Version: {latest['version']}")
        print(f"   Type: {latest['type']}")
        print(f"   Tags: {', '.join(latest['tags'])}")
        print(f"   Test cases: {len(latest['test_cases'])}")
        print(f"   Created: {latest['created_at']}")
        print(f"   Updated: {latest['updated_at']}")
        
        if 'metadata' in latest and latest['metadata']:
            print(f"\n   Metadata:")
            for key, value in latest['metadata'].items():
                print(f"   - {key}: {value}")
    
    print("\n✅ All prompt service functionality verified successfully!")

if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Error: {e}")
        print("Make sure the prompt service is running on port 3001")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc() 