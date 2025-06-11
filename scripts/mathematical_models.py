#!/usr/bin/env python3
"""
Example Mathematical Models for DADM Decision Analysis
These models can be executed via the MCP Script Execution Service
"""

import numpy as np
import scipy.stats as stats
from scipy.optimize import minimize
import json

def decision_alternatives_scoring_model(criteria_weights, alternative_scores):
    """
    Multi-criteria decision analysis using weighted scoring
    
    Args:
        criteria_weights: List of weights for each criterion (should sum to 1.0)
        alternative_scores: 2D list where each row is an alternative and columns are criteria scores
    
    Returns:
        Dictionary with rankings and analysis
    """
    weights = np.array(criteria_weights)
    scores = np.array(alternative_scores)
    
    # Calculate weighted scores
    weighted_scores = np.dot(scores, weights)
    
    # Rank alternatives
    rankings = np.argsort(weighted_scores)[::-1]  # Descending order
    
    # Sensitivity analysis - how much would weights need to change
    sensitivity = {}
    for i, alt_scores in enumerate(scores):
        sensitivity[f"alternative_{i}"] = {
            "current_score": float(weighted_scores[i]),
            "rank": int(np.where(rankings == i)[0][0] + 1),
            "score_breakdown": {
                f"criterion_{j}": float(alt_scores[j] * weights[j])
                for j in range(len(weights))
            }
        }
    
    return {
        "model": "multi_criteria_weighted_scoring",
        "total_alternatives": len(alternative_scores),
        "criteria_weights": criteria_weights,
        "weighted_scores": weighted_scores.tolist(),
        "rankings": rankings.tolist(),
        "best_alternative": int(rankings[0]),
        "alternatives_analysis": sensitivity
    }

def risk_assessment_model(risk_probabilities, risk_impacts, risk_correlations=None):
    """
    Quantitative risk assessment using Monte Carlo simulation
    
    Args:
        risk_probabilities: List of risk occurrence probabilities (0-1)
        risk_impacts: List of risk impact values (negative numbers)
        risk_correlations: Optional correlation matrix between risks
    
    Returns:
        Risk analysis results
    """
    n_risks = len(risk_probabilities)
    n_simulations = 10000
    
    # Generate correlated random variables if correlation matrix provided
    if risk_correlations is not None:
        # Use multivariate normal to generate correlated uniform variables
        mean = np.zeros(n_risks)
        corr_matrix = np.array(risk_correlations)
        
        # Generate correlated normal variables
        normal_samples = np.random.multivariate_normal(mean, corr_matrix, n_simulations)
        
        # Convert to uniform using CDF
        uniform_samples = stats.norm.cdf(normal_samples)
    else:
        # Independent risks
        uniform_samples = np.random.uniform(0, 1, (n_simulations, n_risks))
    
    # Check if each risk occurs in each simulation
    risk_occurs = uniform_samples < np.array(risk_probabilities)
    
    # Calculate total impact for each simulation
    impacts = np.array(risk_impacts)
    total_impacts = np.sum(risk_occurs * impacts, axis=1)
    
    # Statistical analysis
    percentiles = [5, 25, 50, 75, 95, 99]
    risk_percentiles = {
        f"p{p}": float(np.percentile(total_impacts, p))
        for p in percentiles
    }
    
    return {
        "model": "monte_carlo_risk_assessment",
        "simulations": n_simulations,
        "individual_risks": [
            {
                "risk_id": i,
                "probability": float(prob),
                "impact": float(impact),
                "expected_value": float(prob * impact)
            }
            for i, (prob, impact) in enumerate(zip(risk_probabilities, risk_impacts))
        ],
        "total_expected_impact": float(np.mean(total_impacts)),
        "impact_std_dev": float(np.std(total_impacts)),
        "risk_percentiles": risk_percentiles,
        "probability_of_loss": float(np.mean(total_impacts < 0)),
        "maximum_simulated_loss": float(np.min(total_impacts))
    }

def cost_benefit_optimization_model(costs, benefits, constraints, time_horizon=5):
    """
    Optimize cost-benefit over time with constraints
    
    Args:
        costs: List of cost values over time
        benefits: List of benefit values over time  
        constraints: Dictionary of constraint parameters
        time_horizon: Number of time periods
    
    Returns:
        Optimization results
    """
    discount_rate = constraints.get('discount_rate', 0.1)
    budget_limit = constraints.get('budget_limit', float('inf'))
    
    # Calculate NPV
    periods = np.arange(1, time_horizon + 1)
    discount_factors = 1 / (1 + discount_rate) ** periods
    
    # Extend costs and benefits to time horizon if needed
    costs_extended = np.array(costs[:time_horizon] + [costs[-1]] * max(0, time_horizon - len(costs)))
    benefits_extended = np.array(benefits[:time_horizon] + [benefits[-1]] * max(0, time_horizon - len(benefits)))
    
    # Calculate NPV
    discounted_costs = costs_extended * discount_factors
    discounted_benefits = benefits_extended * discount_factors
    
    npv = np.sum(discounted_benefits - discounted_costs)
    
    # Payback period calculation
    cumulative_net_flow = np.cumsum(benefits_extended - costs_extended)
    payback_period = None
    for i, cum_flow in enumerate(cumulative_net_flow):
        if cum_flow > 0:
            payback_period = i + 1
            break
    
    # ROI calculation
    total_investment = np.sum(discounted_costs)
    roi = (np.sum(discounted_benefits) - total_investment) / total_investment if total_investment > 0 else 0
    
    return {
        "model": "cost_benefit_optimization",
        "time_horizon": time_horizon,
        "discount_rate": discount_rate,
        "npv": float(npv),
        "roi": float(roi),
        "payback_period": payback_period,
        "total_discounted_costs": float(np.sum(discounted_costs)),
        "total_discounted_benefits": float(np.sum(discounted_benefits)),
        "annual_analysis": [
            {
                "year": i + 1,
                "cost": float(costs_extended[i]),
                "benefit": float(benefits_extended[i]),
                "net_flow": float(benefits_extended[i] - costs_extended[i]),
                "discount_factor": float(discount_factors[i]),
                "discounted_net_flow": float((benefits_extended[i] - costs_extended[i]) * discount_factors[i])
            }
            for i in range(time_horizon)
        ]
    }

def stakeholder_influence_network_model(stakeholder_relationships, influence_weights):
    """
    Analyze stakeholder influence using network centrality measures
    
    Args:
        stakeholder_relationships: Adjacency matrix of stakeholder relationships
        influence_weights: Weight of each stakeholder's initial influence
    
    Returns:
        Network analysis results
    """
    import networkx as nx
    
    # Create network graph
    G = nx.from_numpy_array(np.array(stakeholder_relationships), create_using=nx.DiGraph)
    
    # Calculate centrality measures
    in_centrality = nx.in_degree_centrality(G)
    out_centrality = nx.out_degree_centrality(G)
    betweenness = nx.betweenness_centrality(G)
    closeness = nx.closeness_centrality(G)
    eigenvector = nx.eigenvector_centrality(G, max_iter=1000, tol=1e-6)
    
    # PageRank algorithm for influence propagation
    pagerank = nx.pagerank(G, personalization={i: w for i, w in enumerate(influence_weights)})
    
    stakeholder_analysis = []
    for i in range(len(influence_weights)):
        stakeholder_analysis.append({
            "stakeholder_id": i,
            "initial_influence": float(influence_weights[i]),
            "in_degree_centrality": float(in_centrality.get(i, 0)),
            "out_degree_centrality": float(out_centrality.get(i, 0)),
            "betweenness_centrality": float(betweenness.get(i, 0)),
            "closeness_centrality": float(closeness.get(i, 0)),
            "eigenvector_centrality": float(eigenvector.get(i, 0)),
            "pagerank_influence": float(pagerank.get(i, 0))
        })
    
    # Identify key stakeholders
    key_stakeholders = sorted(stakeholder_analysis, key=lambda x: x['pagerank_influence'], reverse=True)
    
    return {
        "model": "stakeholder_influence_network",
        "total_stakeholders": len(influence_weights),
        "stakeholder_analysis": stakeholder_analysis,
        "top_influential_stakeholders": key_stakeholders[:5],
        "network_density": float(nx.density(G)),
        "strongly_connected_components": len(list(nx.strongly_connected_components(G)))
    }

# Example usage functions that can be called directly from MCP
def example_decision_scoring():
    """Example: Evaluate 3 alternatives on 4 criteria"""
    criteria_weights = [0.3, 0.25, 0.25, 0.2]  # Cost, Quality, Risk, Timeline
    alternative_scores = [
        [0.8, 0.7, 0.6, 0.9],  # Alternative A
        [0.6, 0.9, 0.8, 0.7],  # Alternative B  
        [0.9, 0.6, 0.7, 0.8]   # Alternative C
    ]
    
    return decision_alternatives_scoring_model(criteria_weights, alternative_scores)

def example_risk_analysis():
    """Example: Assess 4 project risks"""
    risk_probabilities = [0.2, 0.15, 0.3, 0.1]  # Probability of each risk
    risk_impacts = [-50000, -20000, -30000, -80000]  # Impact if risk occurs
    
    return risk_assessment_model(risk_probabilities, risk_impacts)

def example_cost_benefit():
    """Example: 5-year cost-benefit analysis"""
    costs = [100000, 20000, 25000, 30000, 35000]  # Annual costs
    benefits = [0, 40000, 60000, 80000, 100000]   # Annual benefits
    constraints = {'discount_rate': 0.1, 'budget_limit': 500000}
    
    return cost_benefit_optimization_model(costs, benefits, constraints)

if __name__ == "__main__":
    # Run examples
    print("=== Decision Scoring Example ===")
    print(json.dumps(example_decision_scoring(), indent=2))
    
    print("\n=== Risk Analysis Example ===")
    print(json.dumps(example_risk_analysis(), indent=2))
    
    print("\n=== Cost-Benefit Analysis Example ===")
    print(json.dumps(example_cost_benefit(), indent=2))
