# DADMS 2.0 - Decision Analytics Service API Endpoints

## Overview

The Decision Analytics Service serves as DADMS 2.0's comprehensive decision intelligence engine, providing advanced analytics capabilities for decision space exploration, impact assessment, and performance scoring. This document provides human-readable examples and usage patterns for all available API endpoints.

**Base URL**: `http://localhost:3018` (development) | `https://api.dadms.example.com/decision-analytics` (production)

**Authentication**: Bearer Token (JWT)

## Quick Reference

| Category | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| **Decision Space Analysis** | POST | `/decision-space/analyze` | Analyze decision space for scenario |
| | GET | `/decision-space/graphs/{graphId}` | Get decision space graph |
| | POST | `/decision-space/simulate-branch` | Simulate decision branch |
| | POST | `/decision-space/scenarios/generate` | Generate scenarios |
| | POST | `/decision-space/optimize-path` | Optimize decision path |
| **Impact Analysis** | POST | `/impact/assess` | Assess decision impact |
| | POST | `/impact/risk-analysis` | Analyze risk profile |
| | POST | `/impact/cascading-effects` | Analyze cascading effects |
| | POST | `/impact/compare-alternatives` | Compare decision alternatives |
| | GET | `/impact/reports/{reportId}` | Get impact report |
| **Scoring & Efficacy** | POST | `/scoring/score-entity` | Score entity performance |
| | GET | `/scoring/entities/{entityId}/history` | Get efficacy history |
| | GET | `/scoring/leaderboard` | Get performance leaderboard |
| | POST | `/scoring/update-score` | Update entity score |
| | POST | `/scoring/feedback` | Submit performance feedback |
| | GET | `/scoring/analytics` | Get scoring analytics |
| **Visualization** | POST | `/visualization/generate` | Generate visualization |
| | POST | `/visualization/export` | Export analysis |
| **Configuration** | GET | `/configuration/frameworks` | List analysis frameworks |
| | POST | `/configuration/frameworks` | Create analysis framework |
| | GET/PUT/DELETE | `/configuration/frameworks/{frameworkId}` | Manage specific framework |
| | GET/POST | `/configuration/metrics` | Manage metric configurations |
| **Health & Monitoring** | GET | `/health` | Service health check |
| | GET | `/metrics` | Service performance metrics |

---

## 1. Decision Space Analysis

### Analyze Decision Space

#### POST `/decision-space/analyze`
**Description**: Constructs and analyzes comprehensive decision space graph for a given event or scenario

**Request Body**:
```json
{
  "eventId": "event-flight-emergency-001",
  "options": {
    "depth": 7,
    "simulationCount": 500,
    "confidenceThreshold": 0.85,
    "riskTolerance": "moderate",
    "domainFocus": ["mission", "safety", "operational"],
    "timeHorizon": "short_term"
  }
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3018/decision-space/analyze" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "event-flight-emergency-001",
    "options": {
      "depth": 5,
      "simulationCount": 200,
      "confidenceThreshold": 0.8,
      "riskTolerance": "conservative",
      "domainFocus": ["safety", "operational"]
    }
  }'
```

**Example Response**:
```json
{
  "id": "dsg-001",
  "scenarioId": "scenario-emergency-response",
  "rootEvent": {
    "id": "event-flight-emergency-001",
    "type": "crisis",
    "description": "In-flight emergency requiring immediate decision response",
    "timestamp": "2025-01-15T14:30:00Z",
    "context": {
      "domain": "aviation",
      "priority": "critical",
      "stakeholders": ["pilot", "atc", "passengers", "airline"],
      "constraints": {
        "timeLimit": 300,
        "safetyLevel": "maximum",
        "resourceConstraints": ["fuel", "runway_availability"]
      }
    }
  },
  "decisionNodes": [
    {
      "id": "decision-001",
      "parentEventId": "event-flight-emergency-001",
      "decisionType": "emergency",
      "alternatives": [
        {
          "id": "alt-divert",
          "name": "Divert to nearest airport",
          "description": "Immediate diversion to closest available runway",
          "feasibility": 0.95,
          "cost": 25000,
          "risk": 0.2
        },
        {
          "id": "alt-continue",
          "name": "Continue to destination",
          "description": "Attempt to continue flight with emergency procedures",
          "feasibility": 0.7,
          "cost": 5000,
          "risk": 0.8
        }
      ],
      "riskLevel": "high",
      "confidenceScore": 0.89
    }
  ],
  "branches": [
    {
      "id": "branch-001",
      "sourceNodeId": "event-flight-emergency-001",
      "targetNodeId": "decision-001",
      "branchType": "direct",
      "probability": 1.0,
      "cost": 0,
      "riskScore": 0.8
    }
  ],
  "metadata": {
    "createdAt": "2025-01-15T15:00:00Z",
    "analysisDepth": 5,
    "complexityScore": 8.5,
    "confidenceLevel": 0.89
  }
}
```

**SDK Examples**:

**Python**:
```python
import requests

headers = {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
}

payload = {
    'eventId': 'event-flight-emergency-001',
    'options': {
        'depth': 5,
        'simulationCount': 200,
        'confidenceThreshold': 0.8,
        'riskTolerance': 'conservative'
    }
}

response = requests.post(
    'http://localhost:3018/decision-space/analyze',
    headers=headers,
    json=payload
)

decision_graph = response.json()
print(f"Analysis created: {decision_graph['id']}")
print(f"Confidence level: {decision_graph['metadata']['confidenceLevel']}")
```

**Node.js**:
```javascript
const axios = require('axios');

const analyzeDecisionSpace = async (eventId, options = {}) => {
  try {
    const response = await axios.post('http://localhost:3018/decision-space/analyze', {
      eventId,
      options: {
        depth: 5,
        simulationCount: 200,
        confidenceThreshold: 0.8,
        ...options
      }
    }, {
      headers: {
        'Authorization': 'Bearer your-jwt-token',
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Decision space analysis failed:', error.response?.data);
    throw error;
  }
};

// Usage
analyzeDecisionSpace('event-flight-emergency-001', {
  riskTolerance: 'conservative',
  domainFocus: ['safety', 'operational']
}).then(graph => {
  console.log(`Decision graph created: ${graph.id}`);
  console.log(`Found ${graph.decisionNodes.length} decision nodes`);
});
```

### Simulate Decision Branch

#### POST `/decision-space/simulate-branch`
**Description**: Runs detailed simulation for a specific decision branch to explore outcomes and convergence points

**Request Body**:
```json
{
  "branchId": "branch-001",
  "depth": 3,
  "simulationParameters": {
    "iterations": 1000,
    "randomSeed": 42,
    "convergenceCriteria": 0.95,
    "timeStep": 0.1
  }
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3018/decision-space/simulate-branch" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "branchId": "branch-001",
    "depth": 4,
    "simulationParameters": {
      "iterations": 500,
      "convergenceCriteria": 0.9
    }
  }'
```

**Example Response**:
```json
[
  {
    "branchId": "branch-001",
    "depth": 4,
    "simulationResults": [
      {
        "simulationId": "sim-001",
        "branchPath": ["event-flight-emergency-001", "decision-001", "outcome-divert-success"],
        "finalOutcome": {
          "id": "outcome-divert-success",
          "outcomeType": "success",
          "probability": 0.85,
          "impactDomains": ["safety", "operational", "financial"]
        },
        "executionTime": 1800,
        "successProbability": 0.85,
        "confidenceInterval": {
          "lower": 0.8,
          "upper": 0.9,
          "confidence": 0.95
        }
      }
    ],
    "convergencePoints": [
      {
        "nodeId": "decision-001",
        "convergingBranches": ["branch-001", "branch-002"],
        "convergenceType": "critical_path",
        "strategicImportance": 0.95,
        "riskAmplification": 0.3
      }
    ],
    "optimizationSuggestions": [
      {
        "type": "risk_mitigation",
        "target": "decision-001",
        "recommendation": "Implement redundant communication systems",
        "estimatedImprovement": "15% risk reduction",
        "implementationCost": 50000
      }
    ]
  }
]
```

### Generate Scenarios

#### POST `/decision-space/scenarios/generate`
**Description**: Generates multiple scenarios for comprehensive scenario planning and analysis

**Request Body**:
```json
{
  "baseEventId": "event-flight-emergency-001",
  "count": 5,
  "variationParameters": {
    "weatherConditions": ["clear", "stormy", "foggy"],
    "fuelLevel": [0.2, 0.4, 0.6],
    "airportAvailability": ["primary", "alternate", "emergency"],
    "passengerCount": [150, 300, 450]
  }
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3018/decision-space/scenarios/generate" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "baseEventId": "event-flight-emergency-001",
    "count": 3,
    "variationParameters": {
      "weatherConditions": ["clear", "stormy"],
      "fuelLevel": [0.3, 0.5]
    }
  }'
```

**Example Response**:
```json
{
  "baseEventId": "event-flight-emergency-001",
  "scenarios": [
    {
      "id": "scenario-001",
      "name": "Clear Weather, Low Fuel",
      "description": "Emergency scenario with clear weather conditions but low fuel reserves",
      "parameters": {
        "weatherConditions": "clear",
        "fuelLevel": 0.3,
        "visibility": "high",
        "windSpeed": 5
      },
      "probability": 0.25
    },
    {
      "id": "scenario-002", 
      "name": "Stormy Weather, Medium Fuel",
      "description": "Emergency scenario with adverse weather but adequate fuel",
      "parameters": {
        "weatherConditions": "stormy",
        "fuelLevel": 0.5,
        "visibility": "low",
        "windSpeed": 25
      },
      "probability": 0.35
    }
  ],
  "metadata": {
    "generatedAt": "2025-01-15T15:30:00Z",
    "variationCount": 3,
    "coverageProbability": 0.85
  }
}
```

---

## 2. Impact Analysis

### Assess Decision Impact

#### POST `/impact/assess`
**Description**: Performs comprehensive impact assessment across multiple domains for a given decision

**Request Body**:
```json
{
  "decisionId": "decision-divert-to-alternate",
  "contextThreadId": "thread-emergency-response-001",
  "metrics": {
    "primaryMetrics": ["safety_impact", "financial_cost", "operational_disruption"],
    "secondaryMetrics": ["passenger_satisfaction", "regulatory_compliance", "reputation"],
    "weightingScheme": {
      "type": "priority_based",
      "weights": {
        "safety_impact": 0.4,
        "financial_cost": 0.3,
        "operational_disruption": 0.2,
        "passenger_satisfaction": 0.1
      }
    }
  },
  "analysisScope": {
    "timeHorizon": "short_term",
    "stakeholders": ["passengers", "crew", "airline", "airport", "regulators"],
    "domains": ["mission", "safety", "financial", "operational", "regulatory"]
  }
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3018/impact/assess" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "decisionId": "decision-divert-to-alternate",
    "contextThreadId": "thread-emergency-response-001",
    "metrics": {
      "primaryMetrics": ["safety_impact", "financial_cost"],
      "weightingScheme": {
        "type": "equal"
      }
    }
  }'
```

**Example Response**:
```json
{
  "analysisId": "impact-analysis-001",
  "decisionId": "decision-divert-to-alternate",
  "contextThreadId": "thread-emergency-response-001",
  "impactDomains": [
    {
      "domain": "safety",
      "impactScore": 9.2,
      "impactType": "positive",
      "affectedEntities": [
        {
          "entityId": "passengers",
          "entityType": "stakeholder",
          "impactLevel": "high_positive"
        },
        {
          "entityId": "crew",
          "entityType": "stakeholder", 
          "impactLevel": "high_positive"
        }
      ],
      "quantitativeMeasures": [
        {
          "metric": "risk_reduction",
          "value": 0.75,
          "unit": "probability",
          "confidence": 0.92
        }
      ],
      "confidenceLevel": 0.95
    },
    {
      "domain": "financial",
      "impactScore": -6.5,
      "impactType": "negative",
      "affectedEntities": [
        {
          "entityId": "airline",
          "entityType": "stakeholder",
          "impactLevel": "medium_negative"
        }
      ],
      "quantitativeMeasures": [
        {
          "metric": "additional_cost",
          "value": 75000,
          "unit": "USD",
          "confidence": 0.88
        },
        {
          "metric": "passenger_compensation",
          "value": 45000,
          "unit": "USD",
          "confidence": 0.85
        }
      ],
      "confidenceLevel": 0.88
    }
  ],
  "cascadingEffects": {
    "primaryEffects": [
      {
        "effectId": "effect-001",
        "description": "Immediate safety improvement",
        "domain": "safety",
        "magnitude": 0.9,
        "timeToImpact": 0
      }
    ],
    "secondaryEffects": [
      {
        "effectId": "effect-002",
        "description": "Operational disruption at alternate airport",
        "domain": "operational",
        "magnitude": 0.4,
        "timeToImpact": 1800
      }
    ],
    "stabilizationPoints": [
      {
        "domain": "operational",
        "stabilizationTime": 7200,
        "residualImpact": 0.1
      }
    ]
  },
  "riskProfile": {
    "overallRiskScore": 3.2,
    "riskCategories": [
      {
        "category": "operational_risk",
        "probability": 0.3,
        "impact": 5.0,
        "riskScore": 1.5
      },
      {
        "category": "financial_risk",
        "probability": 0.9,
        "impact": 4.0,
        "riskScore": 3.6
      }
    ]
  },
  "mitigationStrategies": [
    {
      "strategyId": "strategy-001",
      "name": "Enhanced Communication Protocol",
      "description": "Implement proactive passenger communication to reduce satisfaction impact",
      "targetDomain": "stakeholder",
      "expectedReduction": 0.3,
      "implementationCost": 5000
    }
  ],
  "summary": {
    "overallImpactScore": 2.8,
    "netBenefit": "positive",
    "primaryConcerns": ["financial_cost", "operational_disruption"],
    "keyBenefits": ["safety_improvement", "risk_mitigation"]
  }
}
```

### Analyze Risk Profile

#### POST `/impact/risk-analysis`
**Description**: Performs detailed risk analysis with uncertainty and sensitivity assessment

**Request Body**:
```json
{
  "decisionId": "decision-divert-to-alternate",
  "riskFramework": {
    "frameworkType": "comprehensive",
    "categories": ["operational", "financial", "safety", "regulatory"],
    "assessmentMethod": "monte_carlo",
    "iterations": 10000
  },
  "analysisDepth": 5
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3018/impact/risk-analysis" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "decisionId": "decision-divert-to-alternate",
    "riskFramework": {
      "frameworkType": "comprehensive",
      "assessmentMethod": "monte_carlo"
    }
  }'
```

**Example Response**:
```json
{
  "overallRiskScore": 4.2,
  "riskCategories": [
    {
      "category": "safety_risk",
      "probability": 0.05,
      "impact": 9.0,
      "riskScore": 0.45,
      "mitigationOptions": [
        {
          "option": "Enhanced monitoring",
          "effectiveness": 0.8,
          "cost": 10000
        }
      ]
    },
    {
      "category": "financial_risk",
      "probability": 0.8,
      "impact": 5.0,
      "riskScore": 4.0,
      "mitigationOptions": [
        {
          "option": "Insurance coverage",
          "effectiveness": 0.6,
          "cost": 25000
        }
      ]
    }
  ],
  "uncertaintyAnalysis": {
    "uncertaintySources": [
      {
        "source": "weather_conditions",
        "uncertainty_level": 0.3,
        "impact_on_outcome": 0.6
      },
      {
        "source": "airport_availability",
        "uncertainty_level": 0.2,
        "impact_on_outcome": 0.4
      }
    ],
    "confidenceIntervals": [
      {
        "metric": "total_cost",
        "lower": 65000,
        "upper": 95000,
        "confidence": 0.95
      }
    ]
  },
  "sensitivityAnalysis": {
    "sensitiveParameters": [
      {
        "parameter": "fuel_consumption_rate",
        "sensitivity": 0.85,
        "impactRange": [0.6, 1.4]
      }
    ]
  },
  "monteCarloResults": {
    "iterations": 10000,
    "convergence": true,
    "results": {
      "meanOutcome": 78500,
      "standardDeviation": 12300,
      "percentiles": {
        "p10": 62000,
        "p50": 78000,
        "p90": 96000
      }
    }
  }
}
```

### Compare Decision Alternatives

#### POST `/impact/compare-alternatives`
**Description**: Performs comparative analysis of multiple decision alternatives across specified criteria

**Request Body**:
```json
{
  "alternativeIds": [
    "alternative-divert-nearest",
    "alternative-continue-destination", 
    "alternative-emergency-landing"
  ],
  "criteria": {
    "evaluationMetrics": ["safety", "cost", "time", "passenger_impact"],
    "weights": {
      "safety": 0.4,
      "cost": 0.25,
      "time": 0.2,
      "passenger_impact": 0.15
    },
    "comparisonMethod": "weighted_scoring"
  }
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3018/impact/compare-alternatives" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "alternativeIds": [
      "alternative-divert-nearest",
      "alternative-continue-destination"
    ],
    "criteria": {
      "evaluationMetrics": ["safety", "cost"],
      "weights": {
        "safety": 0.7,
        "cost": 0.3
      }
    }
  }'
```

**Example Response**:
```json
{
  "comparisonId": "comparison-001",
  "alternatives": [
    {
      "alternativeId": "alternative-divert-nearest",
      "name": "Divert to Nearest Airport",
      "scores": {
        "safety": 9.2,
        "cost": 6.5,
        "time": 7.8,
        "passenger_impact": 7.0
      },
      "weightedScore": 8.12,
      "rank": 1,
      "strengths": ["Highest safety score", "Moderate time impact"],
      "weaknesses": ["Higher operational cost", "Passenger disruption"]
    },
    {
      "alternativeId": "alternative-continue-destination",
      "name": "Continue to Destination",
      "scores": {
        "safety": 5.5,
        "cost": 8.5,
        "time": 9.0,
        "passenger_impact": 9.2
      },
      "weightedScore": 6.89,
      "rank": 2,
      "strengths": ["Lower cost", "Minimal passenger disruption"],
      "weaknesses": ["Significantly higher safety risk", "Uncertain feasibility"]
    }
  ],
  "recommendation": {
    "recommendedAlternative": "alternative-divert-nearest",
    "confidence": 0.92,
    "reasoning": "Safety considerations strongly favor diversion despite higher costs",
    "conditions": ["Weather permits safe landing", "Alternate airport available"]
  },
  "sensitivityAnalysis": {
    "criticalFactors": [
      {
        "factor": "safety_weight",
        "threshold": 0.3,
        "impactOnRanking": "If safety weight drops below 30%, rankings could change"
      }
    ]
  }
}
```

---

## 3. Scoring & Efficacy Analysis

### Score Entity Performance

#### POST `/scoring/score-entity`
**Description**: Calculates comprehensive performance score for an entity within specified context

**Request Body**:
```json
{
  "entityId": "agent-pilot-001",
  "entityType": "agent",
  "context": {
    "domain": "emergency_response",
    "timePeriod": {
      "start": "2025-01-01T00:00:00Z",
      "end": "2025-01-15T23:59:59Z",
      "granularity": "day"
    },
    "complexityLevel": "high",
    "stakeholderPerspective": "aviation_safety",
    "successCriteria": ["safety_maintained", "regulations_followed", "efficiency_optimized"]
  },
  "metrics": ["decision_quality", "response_time", "outcome_accuracy", "risk_management"]
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3018/scoring/score-entity" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "entityId": "agent-pilot-001",
    "entityType": "agent",
    "context": {
      "domain": "emergency_response",
      "complexityLevel": "high"
    },
    "metrics": ["decision_quality", "response_time"]
  }'
```

**Example Response**:
```json
{
  "entityId": "agent-pilot-001",
  "entityType": "agent",
  "scoreContext": {
    "domain": "emergency_response",
    "complexityLevel": "high",
    "evaluationPeriod": "2025-01-01 to 2025-01-15"
  },
  "performanceMetrics": {
    "overallScore": 8.7,
    "battingAverage": 0.89,
    "clutchPerformance": 0.94,
    "consistencyScore": 0.82,
    "improvementRate": 0.12,
    "domainScores": [
      {
        "domain": "emergency_response",
        "score": 8.7,
        "percentile": 92
      },
      {
        "domain": "routine_operations",
        "score": 8.2,
        "percentile": 85
      }
    ],
    "compositeMetrics": [
      {
        "metricName": "decision_under_pressure",
        "formula": "(decision_quality * 0.6) + (response_time * 0.4)",
        "weight": 0.3,
        "componentScores": [
          {
            "component": "decision_quality",
            "score": 9.1
          },
          {
            "component": "response_time",
            "score": 8.8
          }
        ],
        "compositeScore": 8.98
      }
    ]
  },
  "historicalTrends": [
    {
      "period": "2025-01-01 to 2025-01-07",
      "score": 8.4,
      "trend": "improving"
    },
    {
      "period": "2025-01-08 to 2025-01-15",
      "score": 8.7,
      "trend": "stable"
    }
  ],
  "comparativeAnalysis": {
    "peerGroup": "emergency_response_pilots",
    "rank": 3,
    "totalPeers": 25,
    "percentile": 88,
    "aboveAverage": true,
    "benchmarkScore": 7.8
  },
  "improvementRecommendations": [
    {
      "area": "communication_clarity",
      "currentScore": 7.8,
      "targetScore": 8.5,
      "recommendation": "Focus on clear, concise communication during high-stress situations",
      "expectedImpact": "0.3 point improvement in overall score"
    }
  ]
}
```

### Get Performance Leaderboard

#### GET `/scoring/leaderboard`
**Description**: Retrieves ranked performance leaderboard with filtering capabilities

**Query Parameters**:
- `domain` (optional): Filter by performance domain
- `entityType` (optional): Filter by entity type
- `limit` (optional): Number of results (default: 20, max: 100)
- `criteria` (optional): Ranking criteria

**Example Request**:
```bash
curl -X GET "http://localhost:3018/scoring/leaderboard?domain=emergency_response&entityType=agent&limit=10" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example Response**:
```json
[
  {
    "entityId": "agent-pilot-003",
    "entityType": "agent",
    "rank": 1,
    "score": 9.4,
    "percentile": 98,
    "domain": "emergency_response",
    "rankingCriteria": {
      "primaryMetric": "composite_emergency_score",
      "timeFrame": "last_30_days",
      "minimumEvents": 5
    }
  },
  {
    "entityId": "agent-pilot-007",
    "entityType": "agent", 
    "rank": 2,
    "score": 9.1,
    "percentile": 94,
    "domain": "emergency_response",
    "rankingCriteria": {
      "primaryMetric": "composite_emergency_score",
      "timeFrame": "last_30_days",
      "minimumEvents": 5
    }
  },
  {
    "entityId": "agent-pilot-001",
    "entityType": "agent",
    "rank": 3,
    "score": 8.7,
    "percentile": 88,
    "domain": "emergency_response",
    "rankingCriteria": {
      "primaryMetric": "composite_emergency_score",
      "timeFrame": "last_30_days",
      "minimumEvents": 5
    }
  }
]
```

### Submit Performance Feedback

#### POST `/scoring/feedback`
**Description**: Submits feedback for performance validation and score adjustment

**Request Body**:
```json
{
  "entityId": "agent-pilot-001",
  "sourceType": "human_expert",
  "sourceId": "instructor-senior-001",
  "feedbackType": "performance_validation",
  "rating": 9.2,
  "comments": "Excellent decision-making under pressure. Communication could be more concise but overall performance was outstanding in this emergency scenario.",
  "suggestedAdjustments": [
    {
      "metric": "communication_clarity",
      "currentValue": 7.8,
      "suggestedValue": 8.2,
      "reasoning": "Performance better than initial automated assessment"
    }
  ]
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3018/scoring/feedback" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "entityId": "agent-pilot-001",
    "sourceType": "human_expert",
    "feedbackType": "performance_validation",
    "rating": 9.0,
    "comments": "Excellent emergency response"
  }'
```

**Example Response**:
```json
{
  "feedbackId": "feedback-001",
  "sourceType": "human_expert",
  "sourceId": "instructor-senior-001",
  "targetEntityId": "agent-pilot-001",
  "feedbackType": "performance_validation",
  "rating": 9.2,
  "comments": "Excellent decision-making under pressure...",
  "suggestedAdjustments": [
    {
      "metric": "communication_clarity",
      "adjustment": 0.4,
      "confidence": 0.85
    }
  ],
  "validationStatus": "pending",
  "confidenceLevel": 0.92,
  "submittedAt": "2025-01-15T16:30:00Z",
  "processingStatus": "queued_for_review"
}
```

### Get Scoring Analytics

#### GET `/scoring/analytics`
**Description**: Retrieves comprehensive scoring analytics and insights

**Query Parameters**:
- `domain` (optional): Filter by domain
- `timeRange` (optional): Analysis time range (1d, 1w, 1m, 3m, 6m, 1y)
- `entityType` (optional): Filter by entity type

**Example Request**:
```bash
curl -X GET "http://localhost:3018/scoring/analytics?domain=emergency_response&timeRange=1m&entityType=agent" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example Response**:
```json
{
  "domain": "emergency_response",
  "timeRange": "last_30_days",
  "entityType": "agent",
  "summary": {
    "totalEntities": 25,
    "averageScore": 7.8,
    "scoreImprovement": 0.15,
    "topPerformer": "agent-pilot-003",
    "mostImproved": "agent-pilot-012"
  },
  "trends": {
    "overallTrend": "improving",
    "weeklyScores": [
      {"week": "2025-W01", "averageScore": 7.6},
      {"week": "2025-W02", "averageScore": 7.9},
      {"week": "2025-W03", "averageScore": 8.1}
    ]
  },
  "distributions": {
    "scoreRanges": [
      {"range": "9.0-10.0", "count": 3, "percentage": 12},
      {"range": "8.0-8.9", "count": 8, "percentage": 32},
      {"range": "7.0-7.9", "count": 10, "percentage": 40},
      {"range": "6.0-6.9", "count": 4, "percentage": 16}
    ]
  },
  "insights": [
    {
      "type": "performance_pattern",
      "insight": "Agents show 23% better performance in afternoon emergency scenarios",
      "confidence": 0.87,
      "actionable": true,
      "recommendation": "Consider scheduling critical training during peak performance hours"
    },
    {
      "type": "improvement_opportunity",
      "insight": "Communication scores lag behind decision-making scores by 0.8 points on average",
      "confidence": 0.92,
      "actionable": true,
      "recommendation": "Implement targeted communication training program"
    }
  ]
}
```

---

## 4. Visualization & Export

### Generate Visualization

#### POST `/visualization/generate`
**Description**: Generates interactive visualization for analysis results

**Request Body**:
```json
{
  "graphId": "dsg-001",
  "format": "interactive_chart",
  "options": {
    "layout": "hierarchical",
    "colorScheme": "risk_based",
    "includeMetrics": true,
    "interactiveFeatures": ["zoom", "filter", "drill_down"],
    "exportFormats": ["png", "svg", "pdf"]
  }
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3018/visualization/generate" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "graphId": "dsg-001",
    "format": "tree_diagram",
    "options": {
      "layout": "hierarchical",
      "colorScheme": "risk_based"
    }
  }'
```

**Example Response**:
```json
{
  "visualizationId": "viz-001",
  "format": "interactive_chart",
  "content": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAw...",
  "interactiveFeatures": [
    {
      "feature": "zoom",
      "enabled": true,
      "controls": ["zoom_in", "zoom_out", "reset"]
    },
    {
      "feature": "filter",
      "enabled": true,
      "filters": ["risk_level", "decision_type", "probability"]
    }
  ],
  "exportOptions": [
    {
      "format": "png",
      "resolution": "1920x1080",
      "downloadUrl": "/visualization/viz-001/export/png"
    },
    {
      "format": "svg",
      "scalable": true,
      "downloadUrl": "/visualization/viz-001/export/svg"
    }
  ]
}
```

### Export Analysis

#### POST `/visualization/export`
**Description**: Exports analysis results in various formats

**Request Body**:
```json
{
  "analysisId": "impact-analysis-001",
  "format": "pdf",
  "options": {
    "includeCharts": true,
    "includeRawData": false,
    "template": "executive_summary",
    "customizations": {
      "logo": "company_logo.png",
      "headerText": "Emergency Response Analysis",
      "footerText": "Confidential - Internal Use Only"
    }
  }
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3018/visualization/export" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "analysisId": "impact-analysis-001",
    "format": "pdf",
    "options": {
      "includeCharts": true,
      "template": "executive_summary"
    }
  }'
```

**Example Response**:
```json
{
  "exportId": "export-001",
  "format": "pdf",
  "downloadUrl": "https://api.dadms.example.com/downloads/export-001.pdf",
  "expiresAt": "2025-01-16T16:30:00Z",
  "fileSize": 2458624,
  "generatedAt": "2025-01-15T16:30:00Z"
}
```

---

## 5. Configuration Management

### List Analysis Frameworks

#### GET `/configuration/frameworks`
**Description**: Retrieves available analysis frameworks

**Example Request**:
```bash
curl -X GET "http://localhost:3018/configuration/frameworks" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example Response**:
```json
[
  {
    "id": "framework-001",
    "name": "Aviation Emergency Response Framework",
    "frameworkType": "decision_space",
    "configuration": {
      "defaultDepth": 5,
      "simulationCount": 1000,
      "riskCategories": ["safety", "operational", "financial", "regulatory"],
      "decisionTypes": ["emergency", "tactical", "strategic"]
    },
    "isActive": true,
    "createdAt": "2025-01-01T10:00:00Z",
    "createdBy": "admin-user-001"
  },
  {
    "id": "framework-002",
    "name": "Financial Impact Assessment Framework",
    "frameworkType": "impact_analysis",
    "configuration": {
      "domains": ["financial", "operational", "strategic"],
      "timeHorizons": ["short_term", "medium_term", "long_term"],
      "currencies": ["USD", "EUR", "GBP"]
    },
    "isActive": true,
    "createdAt": "2025-01-05T14:00:00Z",
    "createdBy": "framework-manager-001"
  }
]
```

### Create Analysis Framework

#### POST `/configuration/frameworks`
**Description**: Creates new analysis framework configuration

**Request Body**:
```json
{
  "name": "Safety-Critical Decision Framework",
  "frameworkType": "decision_space",
  "configuration": {
    "defaultDepth": 7,
    "simulationCount": 2000,
    "riskThreshold": 0.1,
    "safetyWeight": 0.6,
    "mandatoryChecks": ["safety_validation", "regulatory_compliance"],
    "escalationRules": [
      {
        "condition": "risk_level > 0.8",
        "action": "require_supervisor_approval"
      }
    ]
  }
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3018/configuration/frameworks" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Safety-Critical Decision Framework",
    "frameworkType": "decision_space",
    "configuration": {
      "defaultDepth": 7,
      "safetyWeight": 0.6
    }
  }'
```

**Example Response**:
```json
{
  "id": "framework-003",
  "name": "Safety-Critical Decision Framework",
  "frameworkType": "decision_space",
  "configuration": {
    "defaultDepth": 7,
    "simulationCount": 2000,
    "riskThreshold": 0.1,
    "safetyWeight": 0.6,
    "mandatoryChecks": ["safety_validation", "regulatory_compliance"]
  },
  "isActive": true,
  "createdAt": "2025-01-15T16:45:00Z",
  "updatedAt": "2025-01-15T16:45:00Z",
  "createdBy": "safety-manager-001"
}
```

---

## 6. Health & Monitoring

### Service Health Check

#### GET `/health`
**Description**: Comprehensive health check of service and dependencies

**Example Request**:
```bash
curl -X GET "http://localhost:3018/health" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T17:00:00Z",
  "version": "1.0.0",
  "uptime": 172800,
  "checks": {
    "database": {
      "status": "healthy",
      "responseTimeMs": 12,
      "details": "PostgreSQL connection active"
    },
    "eventManager": {
      "status": "healthy",
      "responseTimeMs": 18,
      "details": "Event publishing operational"
    },
    "externalServices": {
      "contextManager": {
        "status": "healthy",
        "responseTimeMs": 25
      },
      "memoryManager": {
        "status": "healthy",
        "responseTimeMs": 30
      },
      "taskOrchestrator": {
        "status": "degraded",
        "responseTimeMs": 1200,
        "details": "High response times detected"
      }
    }
  }
}
```

### Service Performance Metrics

#### GET `/metrics`
**Description**: Retrieves detailed service performance metrics

**Example Request**:
```bash
curl -X GET "http://localhost:3018/metrics" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example Response**:
```json
{
  "timestamp": "2025-01-15T17:00:00Z",
  "requestMetrics": {
    "requestsTotal": 8456,
    "requestsPerSecond": 14.2,
    "averageResponseTimeMs": 285,
    "errorRate": 0.8,
    "successRate": 99.2
  },
  "analysisMetrics": {
    "activeAnalyses": 12,
    "completedToday": 67,
    "averageAnalysisTime": 4200,
    "queuedAnalyses": 5
  },
  "resourceMetrics": {
    "cpuUsagePercent": 45.8,
    "memoryUsagePercent": 62.3,
    "diskUsagePercent": 28.9,
    "networkIoMbps": 18.5
  },
  "queueMetrics": {
    "totalQueuedTasks": 8,
    "averageWaitTimeSeconds": 245,
    "oldestQueuedTaskSeconds": 580
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid analysis parameters",
    "details": {
      "field": "depth",
      "reason": "Depth must be between 1 and 20"
    }
  }
}
```

### 401 Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired authentication token"
  }
}
```

### 404 Not Found
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Decision space graph not found",
    "details": {
      "resource_type": "decision_space_graph",
      "resource_id": "dsg-999"
    }
  }
}
```

### 422 Analysis Failed
```json
{
  "error": {
    "code": "ANALYSIS_FAILED",
    "message": "Decision space analysis could not be completed",
    "details": {
      "reason": "Insufficient data for reliable analysis",
      "suggestions": ["Provide more context", "Reduce analysis depth"]
    }
  }
}
```

### 500 Internal Server Error
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Analysis engine encountered an error",
    "details": {
      "correlation_id": "corr-12345",
      "timestamp": "2025-01-15T17:00:00Z"
    }
  }
}
```

---

## SDK Examples

### Python SDK

```python
import requests
from typing import Dict, List, Optional

class DecisionAnalyticsClient:
    def __init__(self, base_url: str, auth_token: str):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {auth_token}',
            'Content-Type': 'application/json'
        }
    
    def analyze_decision_space(self, event_id: str, options: Optional[Dict] = None) -> Dict:
        """Analyze decision space for given event"""
        payload = {
            'eventId': event_id,
            'options': options or {}
        }
        response = requests.post(
            f'{self.base_url}/decision-space/analyze',
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()
    
    def assess_impact(self, decision_id: str, context_thread_id: str = None, 
                     metrics: Optional[Dict] = None) -> Dict:
        """Assess impact of a decision"""
        payload = {
            'decisionId': decision_id,
            'contextThreadId': context_thread_id,
            'metrics': metrics or {}
        }
        response = requests.post(
            f'{self.base_url}/impact/assess',
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()
    
    def score_entity(self, entity_id: str, entity_type: str, 
                    context: Optional[Dict] = None) -> Dict:
        """Score entity performance"""
        payload = {
            'entityId': entity_id,
            'entityType': entity_type,
            'context': context or {}
        }
        response = requests.post(
            f'{self.base_url}/scoring/score-entity',
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()
    
    def get_leaderboard(self, domain: str = None, entity_type: str = None, 
                       limit: int = 20) -> List[Dict]:
        """Get performance leaderboard"""
        params = {'limit': limit}
        if domain:
            params['domain'] = domain
        if entity_type:
            params['entityType'] = entity_type
            
        response = requests.get(
            f'{self.base_url}/scoring/leaderboard',
            headers=self.headers,
            params=params
        )
        response.raise_for_status()
        return response.json()

# Usage example
client = DecisionAnalyticsClient('http://localhost:3018', 'your-jwt-token')

# Analyze decision space
analysis = client.analyze_decision_space('event-emergency-001', {
    'depth': 5,
    'riskTolerance': 'conservative'
})
print(f"Analysis completed: {analysis['id']}")

# Assess impact
impact = client.assess_impact('decision-divert-001')
print(f"Overall impact score: {impact['summary']['overallImpactScore']}")

# Get performance scores
leaderboard = client.get_leaderboard(domain='emergency_response', limit=10)
print(f"Top performer: {leaderboard[0]['entityId']}")
```

### Node.js SDK

```javascript
const axios = require('axios');

class DecisionAnalyticsClient {
  constructor(baseUrl, authToken) {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async analyzeDecisionSpace(eventId, options = {}) {
    const response = await this.client.post('/decision-space/analyze', {
      eventId,
      options
    });
    return response.data;
  }

  async assessImpact(decisionId, contextThreadId = null, metrics = {}) {
    const response = await this.client.post('/impact/assess', {
      decisionId,
      contextThreadId,
      metrics
    });
    return response.data;
  }

  async scoreEntity(entityId, entityType, context = {}) {
    const response = await this.client.post('/scoring/score-entity', {
      entityId,
      entityType,
      context
    });
    return response.data;
  }

  async getLeaderboard(options = {}) {
    const response = await this.client.get('/scoring/leaderboard', {
      params: options
    });
    return response.data;
  }

  async generateVisualization(graphId, format, options = {}) {
    const response = await this.client.post('/visualization/generate', {
      graphId,
      format,
      options
    });
    return response.data;
  }

  async submitFeedback(entityId, sourceType, feedbackType, rating, comments = '') {
    const response = await this.client.post('/scoring/feedback', {
      entityId,
      sourceType,
      feedbackType,
      rating,
      comments
    });
    return response.data;
  }
}

// Usage example
const client = new DecisionAnalyticsClient('http://localhost:3018', 'your-jwt-token');

async function runAnalysis() {
  try {
    // Analyze decision space
    const analysis = await client.analyzeDecisionSpace('event-emergency-001', {
      depth: 5,
      simulationCount: 500,
      riskTolerance: 'moderate'
    });
    
    console.log(`Decision space analysis: ${analysis.id}`);
    console.log(`Found ${analysis.decisionNodes.length} decision nodes`);
    
    // Assess impact for first decision
    if (analysis.decisionNodes.length > 0) {
      const decisionId = analysis.decisionNodes[0].id;
      const impact = await client.assessImpact(decisionId);
      
      console.log(`Impact assessment: ${impact.analysisId}`);
      console.log(`Overall impact score: ${impact.summary.overallImpactScore}`);
    }
    
    // Generate visualization
    const viz = await client.generateVisualization(analysis.id, 'interactive_chart', {
      layout: 'hierarchical',
      colorScheme: 'risk_based'
    });
    
    console.log(`Visualization generated: ${viz.visualizationId}`);
    
  } catch (error) {
    console.error('Analysis failed:', error.response?.data || error.message);
  }
}

runAnalysis();
```

---

This completes the comprehensive API documentation for the DADMS 2.0 Decision Analytics Service. The service provides powerful decision intelligence capabilities combining decision space analysis, impact assessment, and performance scoring to enable data-driven decision optimization across the DADMS ecosystem. 