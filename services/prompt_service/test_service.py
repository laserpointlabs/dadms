#!/usr/bin/env python3
"""
Test script for the DADM Prompt Service

Simple script to test all the main endpoints of the prompt service.
"""
import requests
import json
import sys
from typing import Dict, Any

SERVICE_URL = "http://localhost:5300"

def test_health():
    """Test the health endpoint"""
    print("Testing health endpoint...")
    try:
        response = requests.get(f"{SERVICE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data['status']}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_list_prompts():
    """Test listing all prompts"""
    print("\nTesting list prompts endpoint...")
    try:
        response = requests.get(f"{SERVICE_URL}/prompts")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {data['count']} prompts")
            return True
        else:
            print(f"❌ List prompts failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ List prompts error: {e}")
        return False

def test_get_prompt():
    """Test getting a specific prompt"""
    print("\nTesting get specific prompt...")
    try:
        response = requests.get(f"{SERVICE_URL}/prompt/engineering_review")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Retrieved prompt: {data['prompt']['id']}")
            return True
        else:
            print(f"❌ Get prompt failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Get prompt error: {e}")
        return False

def test_create_prompt():
    """Test creating a new prompt"""
    print("\nTesting create prompt...")
    test_prompt = {
        "id": "test_api_prompt",
        "description": "Test prompt created via API",
        "template": "This is a test prompt: {input}",
        "tags": ["test", "api"],
        "version": "1.0"
    }
    
    try:
        response = requests.post(
            f"{SERVICE_URL}/prompt",
            json=test_prompt,
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Created prompt: {data['prompt']['id']}")
            return True
        else:
            print(f"❌ Create prompt failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Create prompt error: {e}")
        return False

def test_update_prompt():
    """Test updating an existing prompt"""
    print("\nTesting update prompt...")
    update_data = {
        "description": "Updated test prompt description",
        "tags": ["test", "api", "updated"]
    }
    
    try:
        response = requests.put(
            f"{SERVICE_URL}/prompt/test_api_prompt",
            json=update_data,
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Updated prompt: {data['prompt']['id']}")
            return True
        else:
            print(f"❌ Update prompt failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Update prompt error: {e}")
        return False

def test_filter_prompts():
    """Test filtering prompts by tags"""
    print("\nTesting filter prompts by tags...")
    try:
        response = requests.get(f"{SERVICE_URL}/prompts?tags=test")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {data['count']} prompts with 'test' tag")
            return True
        else:
            print(f"❌ Filter prompts failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Filter prompts error: {e}")
        return False

def test_rag_content_fetching():
    """Test RAG content fetching"""
    print("\nTesting RAG content fetching...")
    try:
        response = requests.get(f"{SERVICE_URL}/prompt/disaster_response/rag-content")
        if response.status_code == 200:
            data = response.json()
            rag_sources = len(data.get('rag_sources', []))
            rag_contents = len(data.get('rag_contents', {}))
            
            # Check if any remote content was successfully fetched
            success_count = 0
            for url, content in data.get('rag_contents', {}).items():
                if not content.startswith('Error:'):
                    success_count += 1
            
            print(f"✅ RAG content test passed: {rag_sources} sources, {success_count}/{rag_contents} fetched successfully")
            return True
        else:
            print(f"❌ RAG content fetching failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ RAG content fetching error: {e}")
        return False

def test_rag_cache_info():
    """Test RAG cache information"""
    print("\nTesting RAG cache info...")
    try:
        response = requests.get(f"{SERVICE_URL}/rag/cache/info")
        if response.status_code == 200:
            data = response.json()
            cache_info = data.get('cache_info', {})
            print(f"✅ Cache info retrieved: {cache_info.get('total_files', 0)} files, {cache_info.get('total_size_bytes', 0)} bytes")
            return True
        else:
            print(f"❌ RAG cache info failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ RAG cache info error: {e}")
        return False

def test_rag_source_validation():
    """Test RAG source validation"""
    print("\nTesting RAG source validation...")
    test_sources = [
        {
            "url": "https://raw.githubusercontent.com/laserpointlabs/scripts/refs/heads/main/disaster_response_requirements.md",
            "type": "github",
            "description": "Test GitHub source"
        }
    ]
    
    try:
        response = requests.post(
            f"{SERVICE_URL}/rag/validate",
            json=test_sources,
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 200:
            data = response.json()
            results = data.get('validation_results', [])
            accessible = sum(1 for r in results if r.get('status') == 'accessible')
            print(f"✅ RAG validation passed: {accessible}/{len(results)} sources accessible")
            return True
        else:
            print(f"❌ RAG validation failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ RAG validation error: {e}")
        return False

def test_compile_prompt():
    """Test prompt compilation"""
    print("\nTesting prompt compilation...")
    compile_request = {
        "variables": {
            "input": "New microservice architecture for data processing",
            "criteria": "performance, security, and maintainability"
        },
        "include_rag": True,
        "rag_injection_style": "context",
        "max_tokens": 4000
    }
    
    try:
        response = requests.post(
            f"{SERVICE_URL}/prompt/engineering_review/compile",
            json=compile_request,
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 200:
            compile_result = response.json()
            print("✅ Prompt compilation passed")
            print(f"   - Compiled prompt length: {len(compile_result['compiled_prompt']['compiled_prompt'])} chars")
            print(f"   - Token info: {compile_result['compiled_prompt']['token_info']['estimated_tokens']} tokens")
            print(f"   - RAG sources used: {len(compile_result['compiled_prompt']['rag_sources_used'])}")
            return True
        else:
            print(f"❌ Prompt compilation failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Prompt compilation error: {e}")
        return False

def main():
    """Run all tests"""
    print("DADM Prompt Service Test Suite")
    print("=" * 50)
    
    tests = [
        test_health,
        test_list_prompts,
        test_get_prompt,
        test_create_prompt,
        test_update_prompt,
        test_filter_prompts,
        test_rag_content_fetching,
        test_rag_cache_info,
        test_rag_source_validation,
        test_compile_prompt
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
    
    print("\n" + "=" * 50)
    print(f"Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed!")
        sys.exit(0)
    else:
        print("❌ Some tests failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
