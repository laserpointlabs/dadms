#!/usr/bin/env python3
"""
Test script to demonstrate OpenAI + MCP Statistical Server integration in BPMN workflow

This script simulates how the BPMN workflow would use the OpenAI service to interact 
with the MCP statistical server for data analysis.
"""

import asyncio
import json
import sys
import os

# Add the project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from mcp_servers.mcp_statistical_server import calculate_statistics


async def simulate_bpmn_workflow():
    """Simulate the BPMN workflow execution"""
    
    print("="*80)
    print("BPMN Workflow Simulation: OpenAI + MCP Statistical Analysis")
    print("="*80)
    print()
    
    # Step 1: Start Event - Input data (this would come from process variables)
    print("🚀 STEP 1: Start Event - Raw Data Input")
    print("-" * 50)
    
    # Sample data that might come from a business process
    raw_data = {
        "dataset_name": "Sales Performance Q4 2024",
        "data_description": "Daily sales figures for the last quarter",
        "raw_values": [150, 165, 180, 145, 200, 175, 160, 185, 190, 155, 
                      170, 195, 205, 140, 175, 160, 185, 200, 165, 180,
                      190, 175, 155, 145, 210, 195, 170, 160, 185, 175]
    }
    
    print(f"Dataset: {raw_data['dataset_name']}")
    print(f"Description: {raw_data['data_description']}")
    print(f"Raw Data Points: {len(raw_data['raw_values'])} values")
    print(f"Sample: {raw_data['raw_values'][:10]}...")
    print()
    
    # Step 2: Prepare Data Task (OpenAI Service)
    print("🤖 STEP 2: Prepare Data for Analysis (OpenAI Service Task)")
    print("-" * 50)
    
    # Simulate what the OpenAI service would do in the PrepareDataTask
    openai_preparation_response = {
        "analysis_type": "descriptive_statistics_with_distribution_tests",
        "data_validation": {
            "total_points": len(raw_data['raw_values']),
            "missing_values": 0,
            "outliers_detected": 0,
            "data_quality": "good"
        },
        "cleaned_data": raw_data['raw_values'],
        "recommended_analysis": {
            "include_distribution_tests": True,
            "reason": "Dataset size (30 points) is sufficient for normality testing"
        },
        "business_context": "Sales performance analysis for trend identification and forecasting"
    }
    
    print("✅ OpenAI Data Preparation Results:")
    print(f"   - Data Quality: {openai_preparation_response['data_validation']['data_quality']}")
    print(f"   - Total Points: {openai_preparation_response['data_validation']['total_points']}")
    print(f"   - Analysis Type: {openai_preparation_response['analysis_type']}")
    print(f"   - Include Distribution Tests: {openai_preparation_response['recommended_analysis']['include_distribution_tests']}")
    print()
    
    # Step 3: Statistical Analysis Task (OpenAI calls MCP Statistical Server)
    print("📊 STEP 3: Perform Statistical Analysis (OpenAI → MCP Statistical Server)")
    print("-" * 50)
    
    # Simulate the OpenAI service calling the MCP statistical server
    print("🔗 OpenAI service calling MCP statistical server...")
    
    # Prepare the arguments for the MCP statistical server
    mcp_arguments = {
        "data": openai_preparation_response["cleaned_data"],
        "include_distribution_tests": openai_preparation_response["recommended_analysis"]["include_distribution_tests"]
    }
    
    print(f"   MCP Input: {len(mcp_arguments['data'])} data points")
    print(f"   Distribution Tests: {mcp_arguments['include_distribution_tests']}")
    
    # Call the MCP statistical server
    try:
        statistical_results = await calculate_statistics(mcp_arguments)
        mcp_response = json.loads(statistical_results[0].text)
        
        print("✅ MCP Statistical Server Results Received")
        print(f"   - Mean: {mcp_response.get('mean', 'N/A'):.2f}")
        print(f"   - Standard Deviation: {mcp_response.get('std', 'N/A'):.2f}")
        print(f"   - Data Range: {mcp_response.get('range', 'N/A'):.2f}")
        
        if 'normality_test' in mcp_response:
            print(f"   - Normality Test: {mcp_response['normality_test']['test']}")
            print(f"   - Is Normal: {mcp_response['normality_test']['is_normal']}")
            print(f"   - P-value: {mcp_response['normality_test']['p_value']:.4f}")
        
    except Exception as e:
        print(f"❌ Error calling MCP server: {e}")
        return
    
    print()
    
    # Step 4: Interpret Results Task (OpenAI Service)
    print("🧠 STEP 4: Interpret Statistical Results (OpenAI Service Task)")
    print("-" * 50)
    
    # Simulate what the OpenAI service would do to interpret the results
    openai_interpretation = {
        "executive_summary": f"Sales performance analysis reveals average daily sales of ${mcp_response['mean']:.0f} with moderate variability.",
        "key_findings": [
            f"Average daily sales: ${mcp_response['mean']:.0f}",
            f"Sales typically range from ${mcp_response['min']:.0f} to ${mcp_response['max']:.0f}",
            f"Standard deviation of ${mcp_response['std']:.0f} indicates moderate variability",
            f"Data distribution is {'normal' if mcp_response.get('normality_test', {}).get('is_normal', False) else 'non-normal'}"
        ],
        "business_insights": [
            "Sales performance shows consistent patterns with no extreme outliers",
            "The data distribution suggests predictable sales patterns",
            "Current performance metrics can be used for reliable forecasting"
        ],
        "recommendations": [
            "Continue monitoring daily sales patterns",
            "Consider seasonal adjustments in forecasting models",
            "Investigate factors contributing to sales variability"
        ],
        "next_steps": [
            "Perform time series analysis for trend identification",
            "Compare with previous quarters for performance evaluation",
            "Set up automated monitoring for early warning of performance changes"
        ]
    }
    
    print("✅ OpenAI Interpretation Results:")
    print(f"\n📋 Executive Summary:")
    print(f"   {openai_interpretation['executive_summary']}")
    
    print(f"\n🔍 Key Statistical Findings:")
    for finding in openai_interpretation['key_findings']:
        print(f"   • {finding}")
    
    print(f"\n💡 Business Insights:")
    for insight in openai_interpretation['business_insights']:
        print(f"   • {insight}")
    
    print(f"\n🎯 Recommendations:")
    for recommendation in openai_interpretation['recommendations']:
        print(f"   • {recommendation}")
    
    print()
    
    # Step 5: End Event
    print("🏁 STEP 5: End Event - Analysis Complete")
    print("-" * 50)
    
    final_results = {
        "process_id": "OpenAI_Statistical_Analysis_Process",
        "status": "completed",
        "timestamp": "2025-06-12T10:30:00Z",
        "raw_statistical_data": mcp_response,
        "business_interpretation": openai_interpretation,
        "data_source": raw_data['dataset_name']
    }
    
    print("✅ Workflow completed successfully!")
    print(f"   Process: {final_results['process_id']}")
    print(f"   Status: {final_results['status']}")
    print(f"   Dataset: {final_results['data_source']}")
    print()
    
    print("="*80)
    print("📄 COMPLETE STATISTICAL ANALYSIS REPORT")
    print("="*80)
    print()
    
    # Display the complete raw statistical results
    print("📊 Raw Statistical Results (from MCP Statistical Server):")
    print("-" * 50)
    print(json.dumps(mcp_response, indent=2))
    
    print()
    print("="*80)
    print("Workflow simulation completed! 🎉")
    print("="*80)


async def main():
    """Main function to run the workflow simulation"""
    try:
        await simulate_bpmn_workflow()
    except Exception as e:
        print(f"❌ Error in workflow simulation: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
