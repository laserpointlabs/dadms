#!/usr/bin/env python3
"""
Decision Sensitivity Analysis Script
Performs sensitivity analysis on decision alternatives with weight variations
"""
import json
import time
import itertools
from datetime import datetime
from typing import Dict, List, Any

def execute(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute sensitivity analysis on decision alternatives
    
    Args:
        input_data (dict): Input containing alternatives, criteria, base_weights, sensitivity_range
        
    Returns:
        dict: Sensitivity analysis results with recommendations
    """
    start_time = time.time()
    
    # Extract inputs
    alternatives = input_data.get('alternatives', [])
    criteria = input_data.get('criteria', [])
    base_weights = input_data.get('base_weights', {})
    sensitivity_range = input_data.get('sensitivity_range', 0.2)
    context_metadata = input_data.get('context_metadata', {})
    
    # Perform sensitivity analysis
    results = perform_sensitivity_analysis(alternatives, criteria, base_weights, sensitivity_range)
    
    # Calculate execution time
    execution_time = time.time() - start_time
    
    # Build response
    response = {
        "service_task_name": context_metadata.get('service_task_name', 'unknown'),
        "instructions": f"Sensitivity analysis completed with ±{sensitivity_range*100}% weight variation",
        "sensitivity_results": results["sensitivity_results"],
        "stability_analysis": results["stability_analysis"],
        "recommendations": results["recommendations"],
        "execution_metadata": {
            "script_id": "sensitivity_analysis",
            "script_version": "1.0",
            "execution_timestamp": datetime.now().isoformat(),
            "execution_duration": execution_time,
            "context_preserved": bool(context_metadata)
        }
    }
    
    return response

def perform_sensitivity_analysis(alternatives: List[Dict], criteria: List[Dict], 
                                base_weights: Dict[str, float], sensitivity_range: float) -> Dict[str, Any]:
    """Perform the actual sensitivity analysis calculations"""
    
    # Calculate base scores
    base_ranking = calculate_weighted_scores(alternatives, criteria, base_weights)
    
    sensitivity_results = []
    stability_scores = {}
    
    # Test sensitivity for each criterion
    for criterion in criteria:
        criterion_name = criterion['criterion']
        base_weight = base_weights.get(criterion_name, 0)
        
        # Test weight variations
        for variation in [-sensitivity_range, sensitivity_range]:
            modified_weights = base_weights.copy()
            new_weight = max(0, min(1, base_weight + variation))
            modified_weights[criterion_name] = new_weight
            
            # Normalize weights to sum to 1
            total_weight = sum(modified_weights.values())
            if total_weight > 0:
                modified_weights = {k: v/total_weight for k, v in modified_weights.items()}
            
            # Calculate new ranking
            new_ranking = calculate_weighted_scores(alternatives, criteria, modified_weights)
            
            # Compare rankings
            ranking_changes = compare_rankings(base_ranking, new_ranking)
            
            sensitivity_results.append({
                "criterion_varied": criterion_name,
                "weight_change": variation,
                "new_weight": new_weight,
                "ranking_changes": ranking_changes,
                "score_impacts": calculate_score_impacts(base_ranking, new_ranking)
            })
    
    # Determine stability
    stability_analysis = analyze_stability(base_ranking, sensitivity_results)
    recommendations = generate_recommendations(stability_analysis, sensitivity_results)
    
    return {
        "sensitivity_results": sensitivity_results,
        "stability_analysis": stability_analysis,
        "recommendations": recommendations
    }

def calculate_weighted_scores(alternatives: List[Dict], criteria: List[Dict], weights: Dict[str, float]) -> List[Dict]:
    """Calculate weighted scores for alternatives"""
    ranked_alternatives = []
    
    for alt in alternatives:
        scores = alt.get('scores', {})
        weighted_score = 0
        
        for criterion in criteria:
            criterion_name = criterion['criterion']
            weight = weights.get(criterion_name, 0)
            score = scores.get(criterion_name, 0)
            weighted_score += weight * score
        
        ranked_alternatives.append({
            "id": alt['id'],
            "name": alt['name'],
            "weighted_score": weighted_score,
            "individual_scores": scores
        })
    
    # Sort by weighted score (descending)
    ranked_alternatives.sort(key=lambda x: x['weighted_score'], reverse=True)
    
    # Add ranking
    for i, alt in enumerate(ranked_alternatives):
        alt['ranking'] = i + 1
    
    return ranked_alternatives

def compare_rankings(base_ranking: List[Dict], new_ranking: List[Dict]) -> List[Dict]:
    """Compare two rankings and identify changes"""
    changes = []
    
    # Create lookup for base rankings
    base_positions = {alt['id']: alt['ranking'] for alt in base_ranking}
    
    for alt in new_ranking:
        alt_id = alt['id']
        old_position = base_positions.get(alt_id, 0)
        new_position = alt['ranking']
        
        if old_position != new_position:
            changes.append({
                "alternative_id": alt_id,
                "alternative_name": alt['name'],
                "old_ranking": old_position,
                "new_ranking": new_position,
                "position_change": old_position - new_position
            })
    
    return changes

def calculate_score_impacts(base_ranking: List[Dict], new_ranking: List[Dict]) -> Dict[str, float]:
    """Calculate impact on scores"""
    base_scores = {alt['id']: alt['weighted_score'] for alt in base_ranking}
    new_scores = {alt['id']: alt['weighted_score'] for alt in new_ranking}
    
    impacts = {}
    for alt_id in base_scores:
        base_score = base_scores[alt_id]
        new_score = new_scores.get(alt_id, 0)
        impacts[alt_id] = new_score - base_score
    
    return impacts

def analyze_stability(base_ranking: List[Dict], sensitivity_results: List[Dict]) -> Dict[str, Any]:
    """Analyze overall stability of the decision"""
    
    # Find the base winner
    base_winner = base_ranking[0]['id'] if base_ranking else None
    
    # Count how often the winner changes
    winner_changes = 0
    total_variations = len(sensitivity_results)
    
    for result in sensitivity_results:
        ranking_changes = result['ranking_changes']
        for change in ranking_changes:
            if change['alternative_id'] == base_winner and change['new_ranking'] != 1:
                winner_changes += 1
                break
    
    stability_score = 1 - (winner_changes / total_variations) if total_variations > 0 else 1.0
    
    # Find critical thresholds
    critical_thresholds = []
    for result in sensitivity_results:
        if result['ranking_changes']:  # If there are ranking changes
            critical_thresholds.append({
                "criterion": result['criterion_varied'],
                "threshold_weight_change": result['weight_change'],
                "impact": "ranking_change"
            })
    
    return {
        "robust_winner": base_winner,
        "stability_score": stability_score,
        "winner_change_frequency": winner_changes / total_variations if total_variations > 0 else 0,
        "critical_thresholds": critical_thresholds
    }

def generate_recommendations(stability_analysis: Dict, sensitivity_results: List[Dict]) -> Dict[str, Any]:
    """Generate recommendations based on sensitivity analysis"""
    
    stability_score = stability_analysis['stability_score']
    robust_winner = stability_analysis['robust_winner']
    
    # Identify risk factors
    risk_factors = []
    if stability_score < 0.8:
        risk_factors.append("Decision is sensitive to weight changes")
    if len(stability_analysis['critical_thresholds']) > 2:
        risk_factors.append("Multiple criteria affect the outcome significantly")
    
    # Weight recommendations
    weight_recommendations = {}
    for result in sensitivity_results:
        if result['ranking_changes']:
            criterion = result['criterion_varied']
            if criterion not in weight_recommendations:
                weight_recommendations[criterion] = "Consider carefully - affects ranking"
    
    return {
        "most_stable_option": robust_winner,
        "stability_assessment": "High" if stability_score > 0.8 else "Medium" if stability_score > 0.6 else "Low",
        "risk_factors": risk_factors,
        "weight_recommendations": weight_recommendations,
        "overall_recommendation": f"The decision appears {'robust' if stability_score > 0.8 else 'sensitive'} to weight variations"
    }

if __name__ == "__main__":
    # Test the script
    test_input = {
        "alternatives": [
            {
                "id": "option_a",
                "name": "Option A",
                "scores": {"Cost": 8, "Quality": 6, "Speed": 9}
            },
            {
                "id": "option_b", 
                "name": "Option B",
                "scores": {"Cost": 6, "Quality": 9, "Speed": 7}
            }
        ],
        "criteria": [
            {"criterion": "Cost", "weight": 0.4, "description": "Cost effectiveness"},
            {"criterion": "Quality", "weight": 0.4, "description": "Quality of output"},
            {"criterion": "Speed", "weight": 0.2, "description": "Delivery speed"}
        ],
        "base_weights": {"Cost": 0.4, "Quality": 0.4, "Speed": 0.2},
        "sensitivity_range": 0.2,
        "context_metadata": {
            "service_task_name": "SensitivityAnalysis",
            "process_instance_id": "proc_123"
        }
    }
    
    result = execute(test_input)
    print(json.dumps(result, indent=2))
