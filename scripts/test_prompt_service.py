#!/usr/bin/env python3
"""
Test script for Prompt Service
Creates test prompts, test cases, and runs tests with different LLM configurations
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, List

# Prompt Service URL
BASE_URL = "http://localhost:3001"

def create_prompt(prompt_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new prompt"""
    response = requests.post(f"{BASE_URL}/prompts", json=prompt_data)
    response.raise_for_status()
    return response.json()

def test_prompt(prompt_id: str, test_config: Dict[str, Any]) -> Dict[str, Any]:
    """Test a prompt with given configuration"""
    response = requests.post(f"{BASE_URL}/prompts/{prompt_id}/test", json=test_config)
    response.raise_for_status()
    return response.json()

def get_prompt(prompt_id: str) -> Dict[str, Any]:
    """Get prompt details"""
    response = requests.get(f"{BASE_URL}/prompts/{prompt_id}")
    response.raise_for_status()
    return response.json()

def main():
    print("🚀 Starting Prompt Service Test Suite")
    print("=" * 60)
    
    # Test 1: Simple Text Summarization Prompt
    print("\n📝 Test 1: Creating Simple Summarization Prompt")
    summarization_prompt = {
        "name": "Text Summarizer",
        "text": """You are a helpful assistant that summarizes text. 
Please provide a concise summary of the following text:

{input_text}

Summary:""",
        "type": "simple",
        "test_cases": [
            {
                "name": "Short article summary",
                "input": {
                    "input_text": "The quick brown fox jumps over the lazy dog. This pangram contains all letters of the alphabet and is commonly used for testing fonts and keyboards."
                },
                "expected_output": "A pangram containing all alphabet letters, commonly used for testing fonts and keyboards.",
                "enabled": True
            },
            {
                "name": "Technical documentation summary",
                "input": {
                    "input_text": "PostgreSQL is a powerful, open-source object-relational database system. It has more than 30 years of active development and has earned a strong reputation for reliability, data integrity, and correctness."
                },
                "expected_output": "PostgreSQL is a reliable, open-source database with 30+ years of development, known for data integrity.",
                "enabled": True
            }
        ],
        "tags": ["summarization", "text-processing", "nlp"],
        "metadata": {
            "version": "1.0",
            "author": "test_script",
            "created_date": datetime.now().isoformat()
        }
    }
    
    result1 = create_prompt(summarization_prompt)
    print(f"✅ Created prompt: {result1['data']['id']}")
    print(f"   Name: {result1['data']['name']}")
    print(f"   Type: {result1['data']['type']}")
    print(f"   Test cases: {len(result1['data']['test_cases'])}")
    
    # Test 2: Tool-Aware Data Analysis Prompt
    print("\n🔧 Test 2: Creating Tool-Aware Data Analysis Prompt")
    analysis_prompt = {
        "name": "Data Analyzer",
        "text": """You are a data analysis assistant. Use the available tools to analyze the provided data.

Available tools:
- calculate_statistics: Calculate mean, median, mode, std deviation
- create_visualization: Generate charts and graphs
- detect_anomalies: Find outliers in the data

Data: {data}
Analysis Type: {analysis_type}

Please perform the requested analysis and provide insights.""",
        "type": "tool-aware",
        "tool_dependencies": ["calculate_statistics", "create_visualization", "detect_anomalies"],
        "test_cases": [
            {
                "name": "Basic statistics",
                "input": {
                    "data": [10, 20, 30, 40, 50],
                    "analysis_type": "descriptive_statistics"
                },
                "expected_output": "Mean: 30, Median: 30, Std Dev: 15.81",
                "enabled": True
            },
            {
                "name": "Anomaly detection",
                "input": {
                    "data": [10, 12, 11, 13, 100, 14, 15],
                    "analysis_type": "anomaly_detection"
                },
                "expected_output": "Anomaly detected: 100 (significant outlier)",
                "enabled": True
            }
        ],
        "tags": ["data-analysis", "statistics", "tool-aware"],
        "metadata": {
            "required_tools": ["pandas", "numpy", "scipy"],
            "complexity": "medium"
        }
    }
    
    result2 = create_prompt(analysis_prompt)
    print(f"✅ Created prompt: {result2['data']['id']}")
    print(f"   Name: {result2['data']['name']}")
    print(f"   Type: {result2['data']['type']}")
    print(f"   Tool dependencies: {result2['data']['tool_dependencies']}")
    
    # Test 3: Workflow-Aware Multi-Step Process
    print("\n🔄 Test 3: Creating Workflow-Aware Process Prompt")
    workflow_prompt = {
        "name": "Document Processor Workflow",
        "text": """You are orchestrating a document processing workflow.

Workflow steps:
1. Extract text from document
2. Identify document type
3. Extract key information based on type
4. Validate extracted data
5. Generate summary report

Document: {document}
Required Output Format: {output_format}

Execute the workflow and provide results for each step.""",
        "type": "workflow-aware",
        "workflow_dependencies": ["text_extraction", "classification", "validation"],
        "test_cases": [
            {
                "name": "Invoice processing",
                "input": {
                    "document": "Invoice #12345, Date: 2025-07-10, Amount: $1,500.00, Vendor: ACME Corp",
                    "output_format": "structured_json"
                },
                "expected_output": '{"invoice_number": "12345", "date": "2025-07-10", "amount": 1500.00, "vendor": "ACME Corp"}',
                "enabled": True
            },
            {
                "name": "Contract analysis",
                "input": {
                    "document": "Service Agreement between Company A and Company B. Term: 12 months. Value: $50,000",
                    "output_format": "summary"
                },
                "expected_output": "Contract type: Service Agreement, Parties: Company A & B, Duration: 12 months, Value: $50,000",
                "enabled": True
            }
        ],
        "tags": ["workflow", "document-processing", "multi-step"],
        "metadata": {
            "workflow_version": "2.0",
            "estimated_duration": "30s"
        }
    }
    
    result3 = create_prompt(workflow_prompt)
    print(f"✅ Created prompt: {result3['data']['id']}")
    print(f"   Name: {result3['data']['name']}")
    print(f"   Type: {result3['data']['type']}")
    print(f"   Workflow dependencies: {result3['data']['workflow_dependencies']}")
    
    # Now run tests with different LLM configurations
    print("\n🧪 Running Tests with Different LLM Configurations")
    print("=" * 60)
    
    # Test configurations
    test_configs = [
        {
            "name": "OpenAI GPT-4",
            "config": {
                "llm_configs": [{
                    "provider": "openai",
                    "model": "gpt-4",
                    "temperature": 0.7,
                    "maxTokens": 500
                }],
                "enable_comparison": False
            }
        },
        {
            "name": "Anthropic Claude",
            "config": {
                "llm_configs": [{
                    "provider": "anthropic",
                    "model": "claude-3-sonnet",
                    "temperature": 0.5,
                    "maxTokens": 1000
                }],
                "enable_comparison": False
            }
        },
        {
            "name": "Mock LLM (for testing)",
            "config": {
                "llm_configs": [{
                    "provider": "mock",
                    "model": "mock-model",
                    "temperature": 0.3,
                    "maxTokens": 200
                }],
                "enable_comparison": False
            }
        },
        {
            "name": "Comparison Test (Multiple Models)",
            "config": {
                "llm_configs": [
                    {
                        "provider": "mock",
                        "model": "mock-model-1",
                        "temperature": 0.3
                    },
                    {
                        "provider": "mock", 
                        "model": "mock-model-2",
                        "temperature": 0.7
                    }
                ],
                "enable_comparison": True
            }
        }
    ]
    
    # Run tests for each prompt with different configurations
    prompts = [
        (result1['data']['id'], "Text Summarizer"),
        (result2['data']['id'], "Data Analyzer"),
        (result3['data']['id'], "Document Processor")
    ]
    
    for prompt_id, prompt_name in prompts:
        print(f"\n📋 Testing: {prompt_name}")
        
        for test_config in test_configs:
            print(f"\n  🔸 Configuration: {test_config['name']}")
            
            try:
                # Run the test
                test_result = test_prompt(prompt_id, test_config['config'])
                
                if test_result.get('success'):
                    results = test_result.get('data', {})
                    
                    # Display results based on comparison mode
                    if test_config['config'].get('enable_comparison'):
                        print("    Comparison Results:")
                        for model_result in results.get('comparison_results', []):
                            print(f"      Model: {model_result.get('model', 'Unknown')}")
                            print(f"      Summary: {model_result.get('summary', {})}")
                    else:
                        print(f"    Results: {results.get('summary', {})}")
                        
                        # Show individual test case results
                        for test_case in results.get('results', []):
                            status = "✅" if test_case.get('passed') else "❌"
                            print(f"      {status} {test_case.get('test_case_name', 'Unknown')}")
                            if not test_case.get('passed'):
                                print(f"         Expected: {test_case.get('expected_output', 'N/A')[:50]}...")
                                print(f"         Actual: {test_case.get('actual_output', 'N/A')[:50]}...")
                else:
                    print(f"    ❌ Test failed: {test_result.get('error', 'Unknown error')}")
                    
            except Exception as e:
                print(f"    ❌ Error running test: {str(e)}")
            
            # Small delay between tests
            time.sleep(1)
    
    # Fetch and display detailed information about one prompt
    print("\n📊 Detailed Prompt Information")
    print("=" * 60)
    
    try:
        prompt_details = get_prompt(result1['data']['id'])
        if prompt_details.get('success'):
            prompt = prompt_details['data']
            print(f"Prompt ID: {prompt['id']}")
            print(f"Name: {prompt['name']}")
            print(f"Version: {prompt['version']}")
            print(f"Created: {prompt['created_at']}")
            print(f"Test Cases: {len(prompt.get('test_cases', []))}")
            print(f"Tags: {', '.join(prompt.get('tags', []))}")
            print(f"Metadata: {json.dumps(prompt.get('metadata', {}), indent=2)}")
    except Exception as e:
        print(f"Error fetching prompt details: {str(e)}")
    
    print("\n✅ Test suite completed!")
    print("=" * 60)
    print("\n💡 Next Steps:")
    print("1. Check PostgreSQL to verify all data was stored correctly")
    print("2. Review test results for accuracy")
    print("3. Adjust LLM configurations as needed")
    print("4. Add more complex test cases")

if __name__ == "__main__":
    main() 