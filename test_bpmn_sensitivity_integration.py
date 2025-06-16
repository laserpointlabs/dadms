#!/usr/bin/env python3
"""
Test script to demonstrate the end-to-end BPMN sensitivity analysis integration
This simulates what would happen when the BPMN process runs through the LLM formatting
and analysis execution steps.
"""

import json
import requests

def simulate_llm_formatting():
    """
    Simulate what the LLM would produce when formatting decision context
    for sensitivity analysis (FormatSensitivityTask in BPMN)
    """
    print("=" * 60)
    print("SIMULATING LLM FORMATTING STEP (FormatSensitivityTask)")
    print("=" * 60)
    
    # This represents what the LLM would extract from a decision process context
    llm_formatted_data = {
        "analysis_template": "sensitivity_analysis",
        "alternatives": [
            {
                "id": "quadcopter_dji_m300",
                "name": "DJI Matrice 300 RTK",
                "scores": {
                    "cost": 4.0,
                    "payload_capacity": 4.5,
                    "flight_time": 4.2,
                    "weather_resistance": 4.8,
                    "ease_of_use": 4.7
                }
            },
            {
                "id": "fixed_wing_senseFly",
                "name": "senseFly eBee X",
                "scores": {
                    "cost": 3.5,
                    "payload_capacity": 3.0,
                    "flight_time": 4.8,
                    "weather_resistance": 4.0,
                    "ease_of_use": 3.8
                }
            },
            {
                "id": "vtol_wingtra",
                "name": "WingtraOne VTOL",
                "scores": {
                    "cost": 2.5,
                    "payload_capacity": 4.0,
                    "flight_time": 4.5,
                    "weather_resistance": 4.2,
                    "ease_of_use": 3.5
                }
            }
        ],
        "criteria": [
            {
                "criterion": "cost",
                "weight": 0.2,
                "description": "Total cost of ownership including acquisition and maintenance"
            },
            {
                "criterion": "payload_capacity",
                "weight": 0.25,
                "description": "Ability to carry required sensors and equipment"
            },
            {
                "criterion": "flight_time",
                "weight": 0.2,
                "description": "Maximum flight duration per mission"
            },
            {
                "criterion": "weather_resistance",
                "weight": 0.2,
                "description": "Ability to operate in adverse weather conditions"
            },
            {
                "criterion": "ease_of_use",
                "weight": 0.15,
                "description": "Training requirements and operational complexity"
            }
        ],
        "base_weights": {
            "cost": 0.2,
            "payload_capacity": 0.25,
            "flight_time": 0.2,
            "weather_resistance": 0.2,
            "ease_of_use": 0.15
        },
        "sensitivity_range": 0.2
    }
    
    print("LLM extracted and formatted decision context:")
    print(json.dumps(llm_formatted_data, indent=2))
    return llm_formatted_data

def execute_sensitivity_analysis(formatted_data):
    """
    Execute the sensitivity analysis using the analysis service
    (SensitivityAnalysisTask in BPMN)
    """
    print("\n" + "=" * 60)
    print("EXECUTING SENSITIVITY ANALYSIS (SensitivityAnalysisTask)")
    print("=" * 60)
    
    # Add context metadata that would come from BPMN
    formatted_data["context_metadata"] = {
        "service_task_name": "SensitivityAnalysisTask",
        "bpmn_process_id": "OpenAI_Decision_Process",
        "execution_context": "automated_decision_pipeline"
    }
    
    try:
        # Call the analysis service
        response = requests.post(
            "http://localhost:8004/execute/sensitivity_analysis",
            json=formatted_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Sensitivity Analysis completed successfully!")
            print(f"Execution time: {result['execution_metadata']['execution_duration']:.3f} seconds")
            print(f"Script version: {result['execution_metadata']['script_version']}")
            
            print("\n📊 SENSITIVITY ANALYSIS RESULTS:")
            print("-" * 40)
            
            # Display stability analysis
            stability = result['stability_analysis']
            print(f"Most robust winner: {stability['robust_winner']}")
            print(f"Overall stability score: {stability['stability_score']:.2f}")
            
            # Display key findings
            recommendations = result['recommendations']
            print(f"\nRecommended option: {recommendations['most_stable_option']}")
            print(f"Risk factors: {len(recommendations['risk_factors'])} identified")
            
            # Show a few sensitivity scenarios
            print(f"\nTesting {len(result['sensitivity_results'])} weight variation scenarios...")
            for i, scenario in enumerate(result['sensitivity_results'][:3]):
                print(f"  Scenario {i+1}: Varying '{scenario['criterion_varied']}' by {scenario['weight_change']:+.1%}")
                if scenario['ranking_changes']:
                    print(f"    → Ranking changes detected")
                else:
                    print(f"    → No ranking changes")
            
            if len(result['sensitivity_results']) > 3:
                print(f"  ... and {len(result['sensitivity_results']) - 3} more scenarios")
            
            return result
            
        else:
            print(f"❌ Analysis failed with status {response.status_code}")
            print(f"Error: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to analysis service at http://localhost:8004")
        print("Make sure the analysis service is running")
        return None
    except Exception as e:
        print(f"❌ Error executing analysis: {e}")
        return None

def demonstrate_bpmn_workflow():
    """
    Demonstrate the complete BPMN workflow with sensitivity analysis
    """
    print("🔄 DEMONSTRATING UPDATED BPMN WORKFLOW")
    print("=" * 60)
    print("Process: OpenAI_Decision_Process")
    print("Updated to include:")
    print("  1. Frame Decision (LLM)")
    print("  2. Identify Alternatives (LLM)")
    print("  3. Evaluate Alternatives (LLM)")
    print("  4. Make Recommendation (LLM)")
    print("  5. Format for Sensitivity Analysis (LLM) ← NEW")
    print("  6. Perform Sensitivity Analysis (Analysis Service) ← NEW")
    print("")
    
    # Step 5: LLM formatting (simulated)
    formatted_data = simulate_llm_formatting()
    
    # Step 6: Analysis execution
    analysis_result = execute_sensitivity_analysis(formatted_data)
    
    if analysis_result:
        print("\n" + "=" * 60)
        print("🎯 BPMN WORKFLOW COMPLETION")
        print("=" * 60)
        print("✅ Decision process completed successfully!")
        print("✅ Sensitivity analysis integrated and executed")
        print("✅ Robust decision recommendation available")
        print("✅ Process variables contain full context for user interaction")
        print("")
        print("Users can now:")
        print("  • Review the automated decision analysis")
        print("  • Ask questions about the sensitivity results")
        print("  • Request reports on specific aspects")
        print("  • Explore 'what-if' scenarios")
        
        return True
    else:
        print("\n❌ BPMN workflow would fail at sensitivity analysis step")
        return False

if __name__ == "__main__":
    success = demonstrate_bpmn_workflow()
    exit(0 if success else 1)
