# DADMS Analysis Manager Service - API Endpoints

## Overview

The **Analysis Manager Service** provides a comprehensive REST API for intelligent evaluation and decision-support analysis. It transforms raw simulation outputs and other data sources into actionable insights through sophisticated analytical methods, offering scoring, statistical analysis, comparative evaluation, and ML-based pattern recognition capabilities.

- **Base URL**: `http://localhost:3012` (Development) | `https://api.dadms.com/analysis-manager` (Production)
- **Authentication**: Bearer JWT tokens required
- **API Version**: v1
- **Content-Type**: `application/json`
- **Port**: 3012

## Table of Contents

1. [Analysis Management](#1-analysis-management)
2. [Results & Insights](#2-results--insights)
3. [Recommendations](#3-recommendations)
4. [Comparative Analysis](#4-comparative-analysis)
5. [Method & Plugin Management](#5-method--plugin-management)
6. [Search & Discovery](#6-search--discovery)
7. [Health & Monitoring](#7-health--monitoring)
8. [Error Handling](#8-error-handling)
9. [Authentication](#9-authentication)
10. [SDK & Code Examples](#10-sdk--code-examples)

---

## 1. Analysis Management

### 1.1 Start New Analysis

Execute analysis on simulation results or other data sources using specified analytical methods.

**Endpoint**: `POST /api/v1/analyses`

**Request Body**:
```json
{
  "name": "UAV Performance Analysis",
  "description": "Multi-objective scoring and trade-space analysis of UAV simulation results",
  "simulation_id": "sim-uuid-789",
  "data_sources": [
    {
      "source_id": "sim-uuid-789",
      "source_type": "simulation_result",
      "format": "json"
    }
  ],
  "analysis_methods": [
    {
      "method_id": "weighted_scoring",
      "method_type": "scoring",
      "method_name": "Multi-Criteria Weighted Scoring",
      "parameters": {
        "criteria_weights": {
          "performance": 0.4,
          "efficiency": 0.3,
          "cost": 0.3
        },
        "scoring_function": "linear"
      },
      "weight": 0.6,
      "enabled": true,
      "execution_order": 1
    },
    {
      "method_id": "trade_space_analysis",
      "method_type": "comparative",
      "method_name": "Trade-Space Analysis",
      "parameters": {
        "objectives": ["performance", "cost"],
        "pareto_analysis": true,
        "resolution": 100
      },
      "weight": 0.4,
      "enabled": true,
      "execution_order": 2
    }
  ],
  "parameters": {
    "confidence_level": 0.95,
    "significance_threshold": 0.05,
    "aggregation_strategy": "weighted_average"
  },
  "output_requirements": [
    {
      "type": "scores",
      "format": "json",
      "detail_level": "comprehensive"
    },
    {
      "type": "visualizations",
      "format": "png",
      "detail_level": "summary"
    }
  ],
  "tags": ["uav", "performance", "multi-objective"],
  "project_id": "project-uuid-456"
}
```

**cURL Example**:
```bash
curl -X POST "http://localhost:3012/api/v1/analyses" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "UAV Performance Analysis",
    "simulation_id": "sim-uuid-789",
    "data_sources": [
      {
        "source_id": "sim-uuid-789",
        "source_type": "simulation_result",
        "format": "json"
      }
    ],
    "analysis_methods": [
      {
        "method_id": "weighted_scoring",
        "method_type": "scoring",
        "parameters": {
          "criteria_weights": {
            "performance": 0.4,
            "efficiency": 0.3,
            "cost": 0.3
          }
        }
      }
    ]
  }'
```

**Response** (201 Created):
```json
{
  "id": "analysis-uuid-123",
  "name": "UAV Performance Analysis",
  "simulation_id": "sim-uuid-789",
  "analysis_type": "scoring",
  "status": "queued",
  "data_source_ids": ["sim-uuid-789"],
  "methods": [
    {
      "method_id": "weighted_scoring",
      "method_type": "scoring",
      "method_name": "Multi-Criteria Weighted Scoring",
      "parameters": {
        "criteria_weights": {
          "performance": 0.4,
          "efficiency": 0.3,
          "cost": 0.3
        }
      },
      "weight": 0.6,
      "enabled": true,
      "execution_order": 1
    }
  ],
  "created_by": "user@dadms.com",
  "created_at": "2024-01-15T14:00:00Z",
  "updated_at": "2024-01-15T14:00:00Z",
  "version": "1.0.0",
  "tags": ["uav", "performance", "multi-objective"]
}
```

### 1.2 List Analyses

Retrieve a list of analyses with filtering and pagination.

**Endpoint**: `GET /api/v1/analyses`

**Query Parameters**:
- `status` (array): Filter by analysis status (`queued`, `running`, `completed`, `failed`)
- `analysis_type` (array): Filter by analysis type (`scoring`, `statistical`, `comparative`)
- `simulation_id` (string): Filter by simulation ID
- `created_by` (string): Filter by creator
- `project_id` (string): Filter by project
- `tags` (array): Filter by tags
- `created_after` (date-time): Filter analyses created after date
- `created_before` (date-time): Filter analyses created before date
- `sort_by` (string): Sort field (`created_at`, `updated_at`, `name`, `status`)
- `sort_order` (string): Sort order (`asc`, `desc`)
- `limit` (integer): Number of results per page (1-100, default: 20)
- `offset` (integer): Number of results to skip (default: 0)

**cURL Example**:
```bash
curl -X GET "http://localhost:3012/api/v1/analyses?status=completed&analysis_type=scoring&limit=10" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Response** (200 OK):
```json
{
  "analyses": [
    {
      "id": "analysis-uuid-123",
      "name": "UAV Performance Analysis",
      "analysis_type": "scoring",
      "status": "completed",
      "simulation_id": "sim-uuid-789",
      "overall_score": 85.2,
      "confidence": 0.92,
      "created_by": "user@dadms.com",
      "created_at": "2024-01-15T14:00:00Z",
      "completed_at": "2024-01-15T14:05:30Z",
      "tags": ["uav", "performance", "multi-objective"]
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

### 1.3 Get Analysis Details

Retrieve detailed information about a specific analysis.

**Endpoint**: `GET /api/v1/analyses/{id}`

**Path Parameters**:
- `id` (string, required): Analysis ID

**cURL Example**:
```bash
curl -X GET "http://localhost:3012/api/v1/analyses/analysis-uuid-123" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Response** (200 OK):
```json
{
  "id": "analysis-uuid-123",
  "name": "UAV Performance Analysis",
  "simulation_id": "sim-uuid-789",
  "analysis_type": "scoring",
  "status": "completed",
  "methods": [
    {
      "method_id": "weighted_scoring",
      "method_type": "scoring",
      "method_name": "Multi-Criteria Weighted Scoring",
      "parameters": {
        "criteria_weights": {
          "performance": 0.4,
          "efficiency": 0.3,
          "cost": 0.3
        }
      },
      "weight": 0.6,
      "enabled": true
    }
  ],
  "started_at": "2024-01-15T14:00:15Z",
  "completed_at": "2024-01-15T14:05:30Z",
  "duration_seconds": 315,
  "scores": {
    "overall_score": 85.2,
    "method_scores": [
      {
        "method_id": "weighted_scoring",
        "method_name": "Multi-Criteria Weighted Scoring",
        "raw_score": 85.2,
        "normalized_score": 0.852,
        "weight": 0.6,
        "confidence": 0.92,
        "details": {
          "performance_score": 88.5,
          "efficiency_score": 82.1,
          "cost_score": 84.8
        }
      }
    ],
    "confidence_scores": [
      {
        "method_id": "weighted_scoring",
        "confidence_level": 0.92,
        "confidence_interval": {
          "lower": 81.3,
          "upper": 89.1
        }
      }
    ]
  },
  "insights": {
    "key_findings": [
      {
        "id": "finding-1",
        "title": "High Performance Efficiency",
        "description": "The UAV demonstrates excellent performance-to-weight ratio",
        "significance": 0.89,
        "confidence": 0.94
      }
    ],
    "patterns": [
      {
        "id": "pattern-1",
        "pattern_type": "correlation",
        "description": "Strong positive correlation between altitude and efficiency",
        "frequency": 0.85,
        "strength": 0.78
      }
    ]
  },
  "recommendations": [
    {
      "id": "rec-1",
      "title": "Optimize for Medium Altitude Operations",
      "description": "Focus operational parameters around 1000-1200m altitude for optimal performance",
      "recommendation_type": "optimize",
      "priority": "high",
      "confidence": 0.88,
      "impact_score": 92
    }
  ],
  "created_at": "2024-01-15T14:00:00Z",
  "updated_at": "2024-01-15T14:05:30Z"
}
```

### 1.4 Cancel Analysis

Cancel a running analysis.

**Endpoint**: `DELETE /api/v1/analyses/{id}`

**cURL Example**:
```bash
curl -X DELETE "http://localhost:3012/api/v1/analyses/analysis-uuid-123" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Response** (204 No Content)

### 1.5 Rerun Analysis

Rerun an analysis with updated configuration or methods.

**Endpoint**: `POST /api/v1/analyses/{id}/rerun`

**Request Body**:
```json
{
  "new_methods": [
    {
      "method_id": "statistical_analysis",
      "method_type": "statistical",
      "method_name": "Statistical Inference",
      "parameters": {
        "hypothesis_tests": ["t_test", "anova"],
        "confidence_level": 0.95
      }
    }
  ],
  "updated_parameters": {
    "confidence_level": 0.99,
    "aggregation_strategy": "ensemble"
  },
  "reuse_preprocessing": true,
  "force_recompute": false
}
```

**Response** (200 OK):
```json
{
  "id": "analysis-uuid-124",
  "parent_analysis_id": "analysis-uuid-123",
  "status": "queued",
  "version": "1.1.0",
  "created_at": "2024-01-15T15:00:00Z"
}
```

### 1.6 Run Batch Analyses

Execute multiple analyses with different configurations.

**Endpoint**: `POST /api/v1/analyses/batch`

**Request Body**:
```json
{
  "base_request": {
    "name": "UAV Parameter Study",
    "simulation_id": "sim-uuid-789",
    "data_sources": [
      {
        "source_id": "sim-uuid-789",
        "source_type": "simulation_result",
        "format": "json"
      }
    ],
    "analysis_methods": [
      {
        "method_id": "weighted_scoring",
        "method_type": "scoring"
      }
    ]
  },
  "analysis_variations": [
    {
      "variation_id": "var-1",
      "name": "Performance Focus",
      "modified_methods": [
        {
          "method_id": "weighted_scoring",
          "parameters": {
            "criteria_weights": {
              "performance": 0.7,
              "efficiency": 0.2,
              "cost": 0.1
            }
          }
        }
      ]
    },
    {
      "variation_id": "var-2",
      "name": "Cost Focus",
      "modified_methods": [
        {
          "method_id": "weighted_scoring",
          "parameters": {
            "criteria_weights": {
              "performance": 0.2,
              "efficiency": 0.2,
              "cost": 0.6
            }
          }
        }
      ]
    }
  ],
  "execution_mode": "parallel",
  "max_concurrent_analyses": 5
}
```

**Response** (201 Created):
```json
{
  "batch_id": "batch-uuid-456",
  "total_analyses": 2,
  "analysis_ids": [
    "analysis-uuid-125",
    "analysis-uuid-126"
  ],
  "status": "queued",
  "created_at": "2024-01-15T15:30:00Z"
}
```

---

## 2. Results & Insights

### 2.1 Get Analysis Results

Retrieve complete results from a finished analysis.

**Endpoint**: `GET /api/v1/analyses/{id}/results`

**Query Parameters**:
- `format` (string): Result format (`json`, `csv`, `xlsx`)

**cURL Example**:
```bash
curl -X GET "http://localhost:3012/api/v1/analyses/analysis-uuid-123/results?format=json" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Response** (200 OK):
```json
{
  "analysis_id": "analysis-uuid-123",
  "scores": {
    "overall_score": 85.2,
    "method_scores": [
      {
        "method_id": "weighted_scoring",
        "method_name": "Multi-Criteria Weighted Scoring",
        "raw_score": 85.2,
        "normalized_score": 0.852,
        "confidence": 0.92,
        "details": {
          "performance_score": 88.5,
          "efficiency_score": 82.1,
          "cost_score": 84.8,
          "weighted_performance": 35.4,
          "weighted_efficiency": 24.63,
          "weighted_cost": 25.44
        }
      }
    ],
    "score_breakdown": {
      "criteria_scores": {
        "performance": 88.5,
        "efficiency": 82.1,
        "cost": 84.8
      },
      "weight_distribution": {
        "performance": 0.4,
        "efficiency": 0.3,
        "cost": 0.3
      }
    }
  },
  "statistical_summary": {
    "descriptive_statistics": {
      "variable_statistics": [
        {
          "variable_name": "performance",
          "count": 1000,
          "mean": 88.5,
          "median": 88.7,
          "std_dev": 4.2,
          "min": 78.1,
          "max": 96.3,
          "percentiles": {
            "25": 85.2,
            "50": 88.7,
            "75": 91.8,
            "95": 94.5
          }
        }
      ]
    },
    "correlation_analysis": {
      "significant_correlations": [
        {
          "variable_pair": ["altitude", "efficiency"],
          "correlation_coefficient": 0.78,
          "correlation_type": "linear",
          "p_value": 0.001,
          "significance": true
        }
      ]
    }
  },
  "generated_at": "2024-01-15T14:05:30Z"
}
```

### 2.2 Get Analysis Insights

Retrieve generated insights and patterns from an analysis.

**Endpoint**: `GET /api/v1/analyses/{id}/insights`

**Query Parameters**:
- `insight_type` (string): Filter by insight type

**cURL Example**:
```bash
curl -X GET "http://localhost:3012/api/v1/analyses/analysis-uuid-123/insights" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Response** (200 OK):
```json
{
  "analysis_id": "analysis-uuid-123",
  "key_findings": [
    {
      "id": "finding-1",
      "title": "High Performance Efficiency",
      "description": "The UAV demonstrates excellent performance-to-weight ratio with 94% confidence",
      "significance": 0.89,
      "confidence": 0.94,
      "supporting_data": {
        "performance_weight_ratio": 3.54,
        "benchmark_comparison": "15% above industry average",
        "statistical_test": "t-test p<0.001"
      }
    },
    {
      "id": "finding-2",
      "title": "Altitude-Efficiency Correlation",
      "description": "Strong positive correlation between operational altitude and fuel efficiency",
      "significance": 0.82,
      "confidence": 0.91,
      "supporting_data": {
        "correlation_coefficient": 0.78,
        "optimal_altitude_range": "1000-1200m"
      }
    }
  ],
  "patterns": [
    {
      "id": "pattern-1",
      "pattern_type": "correlation",
      "description": "Strong positive correlation between altitude and efficiency",
      "frequency": 0.85,
      "strength": 0.78,
      "variables_involved": ["altitude", "fuel_efficiency"]
    },
    {
      "id": "pattern-2",
      "pattern_type": "trend",
      "description": "Performance improves linearly with velocity up to 55 m/s",
      "frequency": 0.92,
      "strength": 0.71,
      "variables_involved": ["velocity", "performance"]
    }
  ],
  "anomalies": [
    {
      "id": "anomaly-1",
      "anomaly_type": "outlier",
      "description": "Unusually high performance at low velocity (< 30 m/s)",
      "severity": "medium",
      "affected_variables": ["velocity", "performance"],
      "detection_method": "isolation_forest"
    }
  ],
  "correlations": [
    {
      "variable_pair": ["altitude", "fuel_efficiency"],
      "correlation_coefficient": 0.78,
      "correlation_type": "linear",
      "p_value": 0.001,
      "significance": true
    },
    {
      "variable_pair": ["weight", "max_range"],
      "correlation_coefficient": -0.65,
      "correlation_type": "linear",
      "p_value": 0.003,
      "significance": true
    }
  ],
  "optimization_opportunities": [
    {
      "opportunity": "Optimize operational altitude for efficiency",
      "potential_improvement": 12.5,
      "implementation_complexity": "low",
      "resources_required": ["flight_control_update", "pilot_training"]
    }
  ]
}
```

### 2.3 List Analysis Artifacts

List all artifacts generated by an analysis.

**Endpoint**: `GET /api/v1/analyses/{id}/artifacts`

**cURL Example**:
```bash
curl -X GET "http://localhost:3012/api/v1/analyses/analysis-uuid-123/artifacts" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Response** (200 OK):
```json
[
  {
    "id": "artifact-uuid-1",
    "name": "analysis_report.pdf",
    "type": "report",
    "path": "/analyses/analysis-uuid-123/artifacts/reports/analysis_report.pdf",
    "size": 2458960,
    "hash": "sha256:abc123...",
    "mime_type": "application/pdf",
    "description": "Comprehensive analysis report with scores and insights",
    "created_at": "2024-01-15T14:05:30Z"
  },
  {
    "id": "artifact-uuid-2",
    "name": "performance_chart.png",
    "type": "visualization",
    "path": "/analyses/analysis-uuid-123/artifacts/visualizations/performance_chart.png",
    "size": 156320,
    "hash": "sha256:def456...",
    "mime_type": "image/png",
    "description": "Performance comparison chart",
    "created_at": "2024-01-15T14:05:25Z"
  },
  {
    "id": "artifact-uuid-3",
    "name": "statistical_data.csv",
    "type": "data",
    "path": "/analyses/analysis-uuid-123/artifacts/data_exports/statistical_data.csv",
    "size": 45680,
    "hash": "sha256:ghi789...",
    "mime_type": "text/csv",
    "description": "Raw statistical analysis data",
    "created_at": "2024-01-15T14:05:20Z"
  }
]
```

### 2.4 Download Analysis Artifact

Download a specific artifact from an analysis.

**Endpoint**: `GET /api/v1/analyses/{id}/artifacts/{name}`

**Path Parameters**:
- `id` (string, required): Analysis ID
- `name` (string, required): Artifact name

**cURL Example**:
```bash
curl -X GET "http://localhost:3012/api/v1/analyses/analysis-uuid-123/artifacts/analysis_report.pdf" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -o analysis_report.pdf
```

**Response** (200 OK): Binary file download

---

## 3. Recommendations

### 3.1 Get Analysis Recommendations

Retrieve generated recommendations from an analysis.

**Endpoint**: `GET /api/v1/analyses/{id}/recommendations`

**Query Parameters**:
- `priority` (string): Filter by recommendation priority (`critical`, `high`, `medium`, `low`)
- `type` (string): Filter by recommendation type (`optimize`, `mitigate`, `investigate`)

**cURL Example**:
```bash
curl -X GET "http://localhost:3012/api/v1/analyses/analysis-uuid-123/recommendations?priority=high" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Response** (200 OK):
```json
[
  {
    "id": "rec-1",
    "title": "Optimize for Medium Altitude Operations",
    "description": "Focus operational parameters around 1000-1200m altitude for optimal fuel efficiency while maintaining performance standards",
    "recommendation_type": "optimize",
    "priority": "high",
    "confidence": 0.88,
    "impact_score": 92,
    "implementation_effort": "medium",
    "supporting_evidence": [
      {
        "evidence_type": "statistical",
        "description": "Correlation analysis shows 78% positive correlation between altitude and efficiency",
        "strength": 0.78,
        "source": "weighted_scoring_method"
      },
      {
        "evidence_type": "comparative",
        "description": "12.5% improvement potential compared to current operations",
        "strength": 0.85,
        "source": "trade_space_analysis"
      }
    ],
    "alternatives": [
      {
        "title": "Maintain Current Altitude Profile",
        "description": "Continue operations at current altitude with minor efficiency loss",
        "pros": ["No operational changes required", "Lower implementation risk"],
        "cons": ["12.5% efficiency loss", "Higher fuel costs"],
        "estimated_impact": 0
      },
      {
        "title": "Variable Altitude Strategy",
        "description": "Dynamically adjust altitude based on mission requirements",
        "pros": ["Maximum flexibility", "Optimized for each mission"],
        "cons": ["Complex implementation", "Higher pilot training requirements"],
        "estimated_impact": 85
      }
    ],
    "next_steps": [
      {
        "step": "Conduct altitude optimization simulation study",
        "priority": 1,
        "estimated_duration": "2 weeks",
        "dependencies": ["simulation_model_update"]
      },
      {
        "step": "Update flight control algorithms",
        "priority": 2,
        "estimated_duration": "4 weeks",
        "dependencies": ["simulation_study_completion"]
      },
      {
        "step": "Pilot training program development",
        "priority": 3,
        "estimated_duration": "6 weeks",
        "dependencies": ["flight_control_update"]
      }
    ]
  },
  {
    "id": "rec-2",
    "title": "Investigate Low-Velocity Performance Anomaly",
    "description": "Examine the unusually high performance measurements at velocities below 30 m/s to understand underlying causes",
    "recommendation_type": "investigate",
    "priority": "medium",
    "confidence": 0.75,
    "impact_score": 65,
    "implementation_effort": "low",
    "supporting_evidence": [
      {
        "evidence_type": "anomaly_detection",
        "description": "Isolation forest algorithm detected statistically significant outliers",
        "strength": 0.82,
        "source": "anomaly_detection_method"
      }
    ],
    "next_steps": [
      {
        "step": "Review sensor calibration for low-velocity measurements",
        "priority": 1,
        "estimated_duration": "1 week",
        "dependencies": []
      },
      {
        "step": "Analyze flight test data for low-velocity conditions",
        "priority": 2,
        "estimated_duration": "2 weeks",
        "dependencies": ["sensor_review"]
      }
    ]
  }
]
```

---

## 4. Comparative Analysis

### 4.1 Compare Analyses

Compare results from multiple analyses.

**Endpoint**: `POST /api/v1/analyses/compare`

**Request Body**:
```json
{
  "analysis_ids": [
    "analysis-uuid-123",
    "analysis-uuid-124",
    "analysis-uuid-125"
  ],
  "comparison_criteria": [
    "overall_score",
    "performance_score",
    "efficiency_score",
    "confidence"
  ],
  "comparison_type": "scores"
}
```

**cURL Example**:
```bash
curl -X POST "http://localhost:3012/api/v1/analyses/compare" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "analysis_ids": ["analysis-uuid-123", "analysis-uuid-124"],
    "comparison_criteria": ["overall_score", "confidence"],
    "comparison_type": "scores"
  }'
```

**Response** (200 OK):
```json
{
  "analysis_ids": [
    "analysis-uuid-123",
    "analysis-uuid-124"
  ],
  "comparison_date": "2024-01-15T16:00:00Z",
  "comparison_type": "scores",
  "score_comparison": {
    "overall_score": {
      "analysis-uuid-123": 85.2,
      "analysis-uuid-124": 82.7,
      "difference": 2.5,
      "percentage_difference": 3.02,
      "winner": "analysis-uuid-123"
    },
    "confidence": {
      "analysis-uuid-123": 0.92,
      "analysis-uuid-124": 0.88,
      "difference": 0.04,
      "percentage_difference": 4.55,
      "winner": "analysis-uuid-123"
    }
  },
  "statistical_comparison": {
    "significance_test": {
      "test_type": "t_test",
      "p_value": 0.045,
      "significant": true,
      "confidence_level": 0.95
    },
    "effect_size": {
      "cohens_d": 0.31,
      "interpretation": "small_to_medium_effect"
    }
  },
  "recommendation": "Analysis analysis-uuid-123 shows statistically significant superior performance with higher confidence scores"
}
```

### 4.2 Benchmark Analysis

Benchmark an analysis against a reference dataset.

**Endpoint**: `POST /api/v1/analyses/{id}/benchmark`

**Request Body**:
```json
{
  "benchmark_dataset": "industry_standard_uav_performance",
  "benchmark_criteria": [
    "performance_score",
    "efficiency_score",
    "cost_effectiveness"
  ]
}
```

**Response** (200 OK):
```json
{
  "analysis_id": "analysis-uuid-123",
  "benchmark_dataset": "industry_standard_uav_performance",
  "benchmark_date": "2024-01-15T16:30:00Z",
  "performance_vs_benchmark": {
    "performance_score": {
      "analysis_value": 88.5,
      "benchmark_average": 75.2,
      "benchmark_std_dev": 8.4,
      "percentile": 92,
      "z_score": 1.58,
      "performance_vs_average": "+17.7%"
    },
    "efficiency_score": {
      "analysis_value": 82.1,
      "benchmark_average": 78.9,
      "benchmark_std_dev": 6.2,
      "percentile": 68,
      "z_score": 0.52,
      "performance_vs_average": "+4.1%"
    }
  },
  "ranking": 8,
  "total_benchmarks": 150,
  "percentile": 94.7,
  "improvement_opportunities": [
    "Efficiency optimization could improve ranking to top 5%",
    "Cost reduction strategies available for competitive advantage"
  ]
}
```

---

## 5. Method & Plugin Management

### 5.1 List Available Methods

Get all available analysis methods.

**Endpoint**: `GET /api/v1/methods`

**Query Parameters**:
- `method_type` (string): Filter by method type (`scoring`, `statistical`, `comparative`)
- `plugin_name` (string): Filter by plugin name

**cURL Example**:
```bash
curl -X GET "http://localhost:3012/api/v1/methods?method_type=scoring" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Response** (200 OK):
```json
[
  {
    "method_id": "weighted_scoring",
    "method_type": "scoring",
    "method_name": "Multi-Criteria Weighted Scoring",
    "plugin_name": "dadms_core_scoring",
    "version": "1.2.0",
    "parameters": {
      "criteria_weights": {
        "type": "object",
        "required": true,
        "description": "Weight distribution for scoring criteria"
      },
      "scoring_function": {
        "type": "string",
        "enum": ["linear", "exponential", "logarithmic"],
        "default": "linear"
      }
    },
    "weight": 1.0,
    "enabled": true,
    "execution_order": 1
  },
  {
    "method_id": "rule_based_scoring",
    "method_type": "scoring",
    "method_name": "Rule-Based Threshold Scoring",
    "plugin_name": "dadms_core_scoring",
    "version": "1.1.0",
    "parameters": {
      "rules": {
        "type": "array",
        "required": true,
        "description": "List of scoring rules and thresholds"
      },
      "aggregation_method": {
        "type": "string",
        "enum": ["sum", "average", "weighted_average"],
        "default": "weighted_average"
      }
    },
    "weight": 1.0,
    "enabled": true,
    "execution_order": 2
  }
]
```

### 5.2 Get Method Configuration

Get configuration schema and details for an analysis method.

**Endpoint**: `GET /api/v1/methods/{id}`

**cURL Example**:
```bash
curl -X GET "http://localhost:3012/api/v1/methods/weighted_scoring" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Response** (200 OK):
```json
{
  "method_id": "weighted_scoring",
  "method_name": "Multi-Criteria Weighted Scoring",
  "description": "Evaluates alternatives using weighted criteria with customizable scoring functions",
  "parameter_schema": {
    "type": "object",
    "properties": {
      "criteria_weights": {
        "type": "object",
        "description": "Weight distribution for scoring criteria (must sum to 1.0)",
        "additionalProperties": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        },
        "required": true
      },
      "scoring_function": {
        "type": "string",
        "enum": ["linear", "exponential", "logarithmic"],
        "default": "linear",
        "description": "Mathematical function for score calculation"
      },
      "normalization_method": {
        "type": "string",
        "enum": ["min_max", "z_score", "percentile"],
        "default": "min_max",
        "description": "Method for normalizing input values"
      }
    },
    "required": ["criteria_weights"]
  },
  "default_parameters": {
    "scoring_function": "linear",
    "normalization_method": "min_max"
  },
  "validation_rules": {
    "criteria_weights_sum": "Must sum to 1.0",
    "minimum_criteria": "At least 2 criteria required",
    "weight_range": "Each weight must be between 0 and 1"
  },
  "examples": [
    {
      "name": "Performance-focused scoring",
      "parameters": {
        "criteria_weights": {
          "performance": 0.6,
          "cost": 0.2,
          "reliability": 0.2
        },
        "scoring_function": "linear"
      }
    },
    {
      "name": "Balanced multi-criteria evaluation",
      "parameters": {
        "criteria_weights": {
          "performance": 0.33,
          "cost": 0.33,
          "reliability": 0.34
        },
        "scoring_function": "exponential"
      }
    }
  ]
}
```

### 5.3 Validate Analysis Request

Validate an analysis request before execution.

**Endpoint**: `POST /api/v1/analyses/validate`

**Request Body**:
```json
{
  "name": "Test Analysis",
  "data_sources": [
    {
      "source_id": "sim-uuid-789",
      "source_type": "simulation_result",
      "format": "json"
    }
  ],
  "analysis_methods": [
    {
      "method_id": "weighted_scoring",
      "method_type": "scoring",
      "parameters": {
        "criteria_weights": {
          "performance": 0.5,
          "cost": 0.3
        }
      }
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "valid": false,
  "errors": [
    "Criteria weights must sum to 1.0 (current sum: 0.8)",
    "Missing required criterion: efficiency"
  ],
  "warnings": [
    "Using default scoring function 'linear' - consider specifying explicitly"
  ],
  "estimated_duration": null,
  "estimated_resources": null
}
```

### 5.4 List Analysis Plugins

Get all available analysis plugins.

**Endpoint**: `GET /api/v1/plugins`

**Query Parameters**:
- `enabled_only` (boolean): Show only enabled plugins (default: true)

**cURL Example**:
```bash
curl -X GET "http://localhost:3012/api/v1/plugins?enabled_only=true" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Response** (200 OK):
```json
[
  {
    "plugin_id": "dadms_core_scoring",
    "name": "DADMS Core Scoring Methods",
    "version": "1.2.0",
    "description": "Built-in scoring and evaluation methods for DADMS",
    "author": "DADMS Development Team",
    "supported_analysis_types": ["scoring", "comparative"],
    "is_enabled": true,
    "created_at": "2024-01-01T00:00:00Z"
  },
  {
    "plugin_id": "advanced_statistics",
    "name": "Advanced Statistical Analysis",
    "version": "2.1.5",
    "description": "Comprehensive statistical analysis methods including Bayesian inference",
    "author": "Statistics Research Lab",
    "supported_analysis_types": ["statistical", "risk_assessment"],
    "is_enabled": true,
    "created_at": "2024-01-10T10:00:00Z"
  }
]
```

### 5.5 Register New Plugin

Register a new analysis plugin.

**Endpoint**: `POST /api/v1/plugins`

**Request Body**:
```json
{
  "plugin_id": "custom_ml_analysis",
  "name": "Custom ML Analysis Plugin",
  "version": "1.0.0",
  "description": "Custom machine learning analysis methods for specialized use cases",
  "author": "Research Team",
  "supported_analysis_types": ["machine_learning", "custom"],
  "configuration_schema": {
    "type": "object",
    "properties": {
      "model_type": {
        "type": "string",
        "enum": ["random_forest", "svm", "neural_network"]
      },
      "hyperparameters": {
        "type": "object"
      }
    }
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "classification_score": {
        "type": "number"
      },
      "feature_importance": {
        "type": "array"
      }
    }
  },
  "dependencies": ["scikit-learn>=1.0.0", "numpy>=1.21.0"]
}
```

**Response** (201 Created):
```json
{
  "plugin_id": "custom_ml_analysis",
  "registration_status": "registered",
  "message": "Plugin registered successfully and is ready for use",
  "registered_at": "2024-01-15T17:00:00Z"
}
```

---

## 6. Search & Discovery

### 6.1 Search Analyses

Search analyses using text query and filters.

**Endpoint**: `GET /api/v1/analyses/search`

**Query Parameters**:
- `q` (string, required): Search query
- `analysis_type` (array): Filter by analysis types
- `method_type` (array): Filter by method types
- `confidence_min` (number): Minimum confidence threshold (0-1)
- `limit` (integer): Number of results (1-100, default: 20)

**cURL Example**:
```bash
curl -X GET "http://localhost:3012/api/v1/analyses/search?q=UAV%20performance&analysis_type=scoring&confidence_min=0.8" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Response** (200 OK):
```json
[
  {
    "id": "analysis-uuid-123",
    "name": "UAV Performance Analysis",
    "analysis_type": "scoring",
    "status": "completed",
    "simulation_id": "sim-uuid-789",
    "overall_score": 85.2,
    "confidence": 0.92,
    "created_by": "user@dadms.com",
    "created_at": "2024-01-15T14:00:00Z",
    "completed_at": "2024-01-15T14:05:30Z",
    "tags": ["uav", "performance", "multi-objective"],
    "relevance_score": 0.94,
    "matched_fields": ["name", "tags", "insights"],
    "highlight": {
      "name": "UAV <em>Performance</em> Analysis",
      "insights": "High <em>performance</em> efficiency with excellent..."
    }
  }
]
```

### 6.2 Get Simulation Analyses

Get all analyses performed on a specific simulation.

**Endpoint**: `GET /api/v1/simulations/{id}/analyses`

**Path Parameters**:
- `id` (string, required): Simulation ID

**Query Parameters**:
- `limit` (integer): Number of results (1-100, default: 20)
- `offset` (integer): Number of results to skip (default: 0)

**cURL Example**:
```bash
curl -X GET "http://localhost:3012/api/v1/simulations/sim-uuid-789/analyses" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Response** (200 OK):
```json
[
  {
    "id": "analysis-uuid-123",
    "name": "UAV Performance Analysis",
    "analysis_type": "scoring",
    "status": "completed",
    "overall_score": 85.2,
    "confidence": 0.92,
    "created_by": "user@dadms.com",
    "created_at": "2024-01-15T14:00:00Z",
    "completed_at": "2024-01-15T14:05:30Z",
    "tags": ["uav", "performance", "multi-objective"]
  },
  {
    "id": "analysis-uuid-124",
    "name": "Statistical Validation Analysis",
    "analysis_type": "statistical",
    "status": "completed",
    "overall_score": 78.9,
    "confidence": 0.89,
    "created_by": "analyst@dadms.com",
    "created_at": "2024-01-15T15:00:00Z",
    "completed_at": "2024-01-15T15:08:45Z",
    "tags": ["statistical", "validation"]
  }
]
```

---

## 7. Health & Monitoring

### 7.1 Health Check

Service health check endpoint.

**Endpoint**: `GET /health`

**cURL Example**:
```bash
curl -X GET "http://localhost:3012/health"
```

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T18:00:00Z",
  "version": "2.0.0",
  "dependencies": {
    "database": "healthy",
    "cache": "healthy",
    "object_storage": "healthy",
    "simulation_manager": "healthy",
    "event_manager": "healthy"
  },
  "analysis_status": {
    "active_analyses": 5,
    "queued_analyses": 2,
    "plugins_loaded": 8,
    "methods_available": 24
  },
  "performance_metrics": {
    "average_analysis_time": 127.5,
    "success_rate": 0.97,
    "cache_hit_rate": 0.84
  }
}
```

### 7.2 Service Metrics

Prometheus-formatted service metrics.

**Endpoint**: `GET /metrics`

**cURL Example**:
```bash
curl -X GET "http://localhost:3012/metrics"
```

**Response** (200 OK):
```
# HELP analysis_total Total number of analyses
# TYPE analysis_total counter
analysis_total{status="completed"} 1247
analysis_total{status="failed"} 23
analysis_total{status="running"} 5

# HELP analysis_duration_seconds Analysis execution duration
# TYPE analysis_duration_seconds histogram
analysis_duration_seconds_bucket{le="30"} 234
analysis_duration_seconds_bucket{le="120"} 892
analysis_duration_seconds_bucket{le="300"} 1156
analysis_duration_seconds_bucket{le="+Inf"} 1247

# HELP analysis_score_distribution Analysis score distribution
# TYPE analysis_score_distribution histogram
analysis_score_distribution_bucket{le="50"} 45
analysis_score_distribution_bucket{le="70"} 312
analysis_score_distribution_bucket{le="85"} 856
analysis_score_distribution_bucket{le="95"} 1134
analysis_score_distribution_bucket{le="+Inf"} 1247

# HELP plugin_execution_count Plugin method execution count
# TYPE plugin_execution_count counter
plugin_execution_count{plugin="dadms_core_scoring",method="weighted_scoring"} 567
plugin_execution_count{plugin="advanced_statistics",method="hypothesis_testing"} 234
plugin_execution_count{plugin="dadms_core_scoring",method="rule_based_scoring"} 445
```

---

## 8. Error Handling

### Standard Error Response

All endpoints return errors in a consistent format:

```json
{
  "error": {
    "code": "ANALYSIS_NOT_FOUND",
    "message": "Analysis with ID 'analysis-uuid-123' not found",
    "details": {
      "analysis_id": "analysis-uuid-123",
      "timestamp": "2024-01-15T18:00:00Z",
      "trace_id": "trace-uuid-456"
    }
  }
}
```

### HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **204 No Content**: Request successful, no content to return
- **400 Bad Request**: Invalid request parameters or body
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Insufficient permissions for the requested operation
- **404 Not Found**: Requested resource not found
- **409 Conflict**: Resource already exists or conflict with current state
- **422 Unprocessable Entity**: Request validation failed
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error
- **503 Service Unavailable**: Service temporarily unavailable

### Common Error Codes

- `ANALYSIS_NOT_FOUND`: Analysis ID not found
- `DATA_SOURCE_UNAVAILABLE`: Referenced data source not accessible
- `METHOD_NOT_SUPPORTED`: Analysis method not available
- `PLUGIN_NOT_FOUND`: Plugin not registered or unavailable
- `VALIDATION_ERROR`: Request validation failed
- `INSUFFICIENT_DATA`: Not enough data for analysis
- `METHOD_EXECUTION_FAILED`: Analysis method execution failed
- `CONFIGURATION_ERROR`: Invalid method configuration
- `AUTHENTICATION_REQUIRED`: Valid JWT token required
- `PERMISSION_DENIED`: Insufficient permissions
- `RATE_LIMIT_EXCEEDED`: Too many requests

### Rate Limiting

The API implements rate limiting with the following headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642276800
```

**Rate Limits by User Type:**
- **Free Tier**: 100 requests/hour, 5 concurrent analyses
- **Premium**: 1,000 requests/hour, 25 concurrent analyses
- **Enterprise**: 10,000 requests/hour, 100 concurrent analyses

---

## 9. Authentication

### JWT Token Format

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Required JWT Claims

```json
{
  "sub": "user@dadms.com",
  "iat": 1642273200,
  "exp": 1642276800,
  "aud": "dadms-analysis-manager",
  "iss": "dadms-auth",
  "permissions": [
    "analysis:read",
    "analysis:write",
    "analysis:execute",
    "method:read",
    "plugin:read"
  ],
  "projects": ["project-uuid-456"],
  "user_type": "premium"
}
```

### Permission Levels

- **analysis:read**: View analyses and results
- **analysis:write**: Create and modify analyses
- **analysis:execute**: Execute and cancel analyses
- **analysis:delete**: Delete analyses and artifacts
- **method:read**: View available analysis methods
- **method:write**: Configure analysis methods
- **plugin:read**: View analysis plugins
- **plugin:write**: Register and manage plugins
- **plugin:admin**: Full plugin administration
- **admin**: Full administrative access

---

## 10. SDK & Code Examples

### Python SDK Example

```python
import requests
import json
from typing import Dict, List, Optional

class AnalysisManagerClient:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    
    def start_analysis(self, name: str, data_sources: List[Dict], 
                      analysis_methods: List[Dict], 
                      simulation_id: Optional[str] = None,
                      description: Optional[str] = None) -> Dict:
        """Start a new analysis"""
        payload = {
            "name": name,
            "data_sources": data_sources,
            "analysis_methods": analysis_methods
        }
        if simulation_id:
            payload["simulation_id"] = simulation_id
        if description:
            payload["description"] = description
            
        response = requests.post(
            f"{self.base_url}/api/v1/analyses",
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()
    
    def get_analysis(self, analysis_id: str) -> Dict:
        """Get analysis details"""
        response = requests.get(
            f"{self.base_url}/api/v1/analyses/{analysis_id}",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def get_analysis_results(self, analysis_id: str, 
                           format: str = "json") -> Dict:
        """Get analysis results"""
        response = requests.get(
            f"{self.base_url}/api/v1/analyses/{analysis_id}/results",
            headers=self.headers,
            params={"format": format}
        )
        response.raise_for_status()
        return response.json()
    
    def get_recommendations(self, analysis_id: str,
                          priority: Optional[str] = None) -> List[Dict]:
        """Get analysis recommendations"""
        params = {}
        if priority:
            params["priority"] = priority
            
        response = requests.get(
            f"{self.base_url}/api/v1/analyses/{analysis_id}/recommendations",
            headers=self.headers,
            params=params
        )
        response.raise_for_status()
        return response.json()
    
    def compare_analyses(self, analysis_ids: List[str], 
                        comparison_criteria: List[str]) -> Dict:
        """Compare multiple analyses"""
        payload = {
            "analysis_ids": analysis_ids,
            "comparison_criteria": comparison_criteria,
            "comparison_type": "scores"
        }
        
        response = requests.post(
            f"{self.base_url}/api/v1/analyses/compare",
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()
    
    def search_analyses(self, query: str, 
                       analysis_type: Optional[str] = None,
                       confidence_min: Optional[float] = None) -> List[Dict]:
        """Search analyses"""
        params = {"q": query}
        if analysis_type:
            params["analysis_type"] = analysis_type
        if confidence_min:
            params["confidence_min"] = confidence_min
            
        response = requests.get(
            f"{self.base_url}/api/v1/analyses/search",
            headers=self.headers,
            params=params
        )
        response.raise_for_status()
        return response.json()

# Usage Example
client = AnalysisManagerClient("http://localhost:3012", "your-jwt-token")

# Start a multi-criteria scoring analysis
analysis = client.start_analysis(
    name="UAV Performance Evaluation",
    simulation_id="sim-uuid-789",
    data_sources=[
        {
            "source_id": "sim-uuid-789",
            "source_type": "simulation_result",
            "format": "json"
        }
    ],
    analysis_methods=[
        {
            "method_id": "weighted_scoring",
            "method_type": "scoring",
            "parameters": {
                "criteria_weights": {
                    "performance": 0.4,
                    "efficiency": 0.3,
                    "cost": 0.3
                }
            }
        },
        {
            "method_id": "statistical_analysis",
            "method_type": "statistical",
            "parameters": {
                "confidence_level": 0.95,
                "hypothesis_tests": ["t_test", "anova"]
            }
        }
    ],
    description="Comprehensive performance analysis with statistical validation"
)

print(f"Analysis started: {analysis['id']}")

# Monitor progress
import time
while True:
    status = client.get_analysis(analysis['id'])
    print(f"Status: {status['status']}")
    
    if status['status'] in ['completed', 'failed', 'cancelled']:
        break
    
    time.sleep(10)

# Get results if completed
if status['status'] == 'completed':
    results = client.get_analysis_results(analysis['id'])
    print(f"Overall Score: {results['scores']['overall_score']}")
    
    # Get recommendations
    recommendations = client.get_recommendations(analysis['id'], priority="high")
    for rec in recommendations:
        print(f"Recommendation: {rec['title']} (Impact: {rec['impact_score']})")
```

### JavaScript/Node.js SDK Example

```javascript
const axios = require('axios');

class AnalysisManagerClient {
    constructor(baseUrl, token) {
        this.baseUrl = baseUrl;
        this.client = axios.create({
            baseURL: baseUrl,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async startAnalysis(name, dataSources, analysisMethods, options = {}) {
        const payload = {
            name,
            data_sources: dataSources,
            analysis_methods: analysisMethods,
            ...options
        };

        const response = await this.client.post('/api/v1/analyses', payload);
        return response.data;
    }

    async getAnalysis(analysisId) {
        const response = await this.client.get(`/api/v1/analyses/${analysisId}`);
        return response.data;
    }

    async getAnalysisResults(analysisId, format = 'json') {
        const response = await this.client.get(
            `/api/v1/analyses/${analysisId}/results`,
            { params: { format } }
        );
        return response.data;
    }

    async getRecommendations(analysisId, filters = {}) {
        const response = await this.client.get(
            `/api/v1/analyses/${analysisId}/recommendations`,
            { params: filters }
        );
        return response.data;
    }

    async getInsights(analysisId) {
        const response = await this.client.get(
            `/api/v1/analyses/${analysisId}/insights`
        );
        return response.data;
    }

    async compareAnalyses(analysisIds, comparisonCriteria) {
        const response = await this.client.post('/api/v1/analyses/compare', {
            analysis_ids: analysisIds,
            comparison_criteria: comparisonCriteria,
            comparison_type: 'scores'
        });
        return response.data;
    }

    async searchAnalyses(query, filters = {}) {
        const response = await this.client.get('/api/v1/analyses/search', {
            params: { q: query, ...filters }
        });
        return response.data;
    }

    async listMethods(methodType = null) {
        const params = methodType ? { method_type: methodType } : {};
        const response = await this.client.get('/api/v1/methods', { params });
        return response.data;
    }
}

// Usage Example
const client = new AnalysisManagerClient('http://localhost:3012', 'your-jwt-token');

(async () => {
    try {
        // Start comprehensive analysis
        const analysis = await client.startAnalysis(
            'UAV Optimization Study',
            [
                {
                    source_id: 'sim-uuid-789',
                    source_type: 'simulation_result',
                    format: 'json'
                }
            ],
            [
                {
                    method_id: 'weighted_scoring',
                    method_type: 'scoring',
                    parameters: {
                        criteria_weights: {
                            performance: 0.4,
                            efficiency: 0.3,
                            cost: 0.3
                        }
                    }
                },
                {
                    method_id: 'trade_space_analysis',
                    method_type: 'comparative',
                    parameters: {
                        objectives: ['performance', 'cost']
                    }
                }
            ],
            {
                simulation_id: 'sim-uuid-789',
                description: 'Multi-objective optimization analysis',
                tags: ['optimization', 'trade-space']
            }
        );

        console.log(`Analysis started: ${analysis.id}`);

        // Poll for completion
        let status;
        do {
            status = await client.getAnalysis(analysis.id);
            console.log(`Status: ${status.status}`);
            
            if (status.status === 'running') {
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        } while (!['completed', 'failed', 'cancelled'].includes(status.status));

        // Get comprehensive results
        if (status.status === 'completed') {
            // Get results
            const results = await client.getAnalysisResults(analysis.id);
            console.log(`Overall Score: ${results.scores.overall_score}`);

            // Get insights
            const insights = await client.getInsights(analysis.id);
            console.log(`Key Findings: ${insights.key_findings.length}`);
            insights.key_findings.forEach(finding => {
                console.log(`- ${finding.title}: ${finding.description}`);
            });

            // Get recommendations
            const recommendations = await client.getRecommendations(analysis.id, {
                priority: 'high'
            });
            console.log(`High Priority Recommendations: ${recommendations.length}`);
            recommendations.forEach(rec => {
                console.log(`- ${rec.title} (Impact: ${rec.impact_score})`);
            });
        }

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
})();
```

---

## Related Documentation

- **[OpenAPI Specification](analysis_manager_service_openapi.yaml)**: Machine-readable API specification
- **[Service Architecture](../architecture/analysis_manager_specification.md)**: Complete technical specification  
- **[Interactive Documentation](http://localhost:3012/docs)**: Swagger UI for testing endpoints
- **[Simulation Manager API](simulation_manager_api_endpoints.md)**: Related simulation execution endpoints
- **[Model Manager API](model_manager_api_endpoints.md)**: Related model management endpoints
- **[EventManager Integration](../architecture/event_manager_specification.md)**: Event-driven integration patterns

---

*This documentation is automatically generated from the OpenAPI specification. For the most up-to-date information, refer to the interactive documentation at `/docs` or the OpenAPI YAML file.* 