# Ontology Modeler Versioning API Endpoints Extension

## Updated Quick Reference Table (Versioning Endpoints)

Add the following categories to the existing Quick Reference table:

| Category | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| **Version Management** | GET | `/workspaces/{workspaceId}/ontologies/{ontologyId}/versions` | Get version history |
| | POST | `/workspaces/{workspaceId}/ontologies/{ontologyId}/versions` | Create new version |
| | GET | `/workspaces/{workspaceId}/ontologies/{ontologyId}/versions/{versionId}` | Get specific version |
| | PUT | `/workspaces/{workspaceId}/ontologies/{ontologyId}/versions/{versionId}` | Update version metadata |
| | DELETE | `/workspaces/{workspaceId}/ontologies/{ontologyId}/versions/{versionId}` | Delete version |
| **Version Comparison** | POST | `/workspaces/{workspaceId}/ontologies/{ontologyId}/versions/compare` | Compare versions |
| | GET | `/workspaces/{workspaceId}/ontologies/{ontologyId}/versions/{versionId}/diff` | Get version diff |
| | POST | `/workspaces/{workspaceId}/ontologies/{ontologyId}/versions/{versionId}/rollback` | Rollback to version |
| **Impact Analysis** | POST | `/workspaces/{workspaceId}/ontologies/{ontologyId}/impact-analysis` | Analyze change impact |
| | GET | `/workspaces/{workspaceId}/ontologies/{ontologyId}/dependencies` | Get dependency graph |
| | POST | `/workspaces/{workspaceId}/ontologies/{ontologyId}/dependencies/discover` | Discover hidden dependencies |
| | POST | `/workspaces/{workspaceId}/ontologies/{ontologyId}/predict-effects` | DAS impact prediction |
| **Migration Management** | POST | `/workspaces/{workspaceId}/migration/plan` | Create migration plan |
| | POST | `/workspaces/{workspaceId}/migration/execute` | Execute migration |
| | GET | `/workspaces/{workspaceId}/migration/{migrationId}/status` | Get migration status |
| | POST | `/workspaces/{workspaceId}/migration/{migrationId}/pause` | Pause migration |
| | POST | `/workspaces/{workspaceId}/migration/{migrationId}/resume` | Resume migration |
| | POST | `/workspaces/{workspaceId}/migration/{migrationId}/cancel` | Cancel migration |
| | POST | `/workspaces/{workspaceId}/migration/{migrationId}/rollback` | Rollback migration |
| **Branch Management** | GET | `/workspaces/{workspaceId}/ontologies/{ontologyId}/branches` | List branches |
| | POST | `/workspaces/{workspaceId}/ontologies/{ontologyId}/branches` | Create branch |
| | GET | `/workspaces/{workspaceId}/ontologies/{ontologyId}/branches/{branchId}` | Get branch details |
| | POST | `/workspaces/{workspaceId}/ontologies/{ontologyId}/branches/{branchId}/merge` | Merge branch |
| | DELETE | `/workspaces/{workspaceId}/ontologies/{ontologyId}/branches/{branchId}` | Delete branch |
| **DAS Version Intelligence** | POST | `/workspaces/{workspaceId}/das/version-guidance` | Get DAS versioning advice |
| | POST | `/workspaces/{workspaceId}/das/migration-strategy` | Get DAS migration plan |
| | POST | `/workspaces/{workspaceId}/das/impact-prediction` | Get DAS impact prediction |
| | POST | `/workspaces/{workspaceId}/das/risk-assessment` | Get DAS risk assessment |
| | POST | `/workspaces/{workspaceId}/das/optimization-recommendations` | Get DAS optimization advice |
| **Stakeholder Communication** | GET | `/workspaces/{workspaceId}/stakeholders/affected` | Get affected stakeholders |
| | POST | `/workspaces/{workspaceId}/notifications/generate` | Generate notifications |
| | POST | `/workspaces/{workspaceId}/notifications/send` | Send notifications |
| | GET | `/workspaces/{workspaceId}/notifications/{notificationId}/status` | Get notification status |
| **Emergency Response** | GET | `/workspaces/{workspaceId}/emergency/conditions` | Monitor emergency conditions |
| | POST | `/workspaces/{workspaceId}/emergency/response` | Initiate emergency response |
| | POST | `/workspaces/{workspaceId}/emergency/rollback` | Execute emergency rollback |
| | GET | `/workspaces/{workspaceId}/emergency/{incidentId}/status` | Get incident status |

---

## Detailed API Endpoints

### Version Management

#### GET `/workspaces/{workspaceId}/ontologies/{ontologyId}/versions`
**Description**: Retrieve the complete version history for an ontology

**Path Parameters:**
- `workspaceId` (required): Workspace identifier
- `ontologyId` (required): Ontology identifier

**Query Parameters:**
- `limit` (optional): Maximum number of versions to return (default: 50)
- `offset` (optional): Number of versions to skip (default: 0)
- `include_metadata` (optional): Include detailed version metadata (default: true)
- `stability_level` (optional): Filter by stability level (alpha, beta, stable, etc.)
- `created_by` (optional): Filter by version creator
- `date_from` (optional): Filter versions created after this date
- `date_to` (optional): Filter versions created before this date

**Response Example:**
```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "version_id": "ver-uuid-001",
        "version_number": "2.1.0",
        "stability_level": "stable",
        "created_at": "2025-01-15T14:35:12Z",
        "created_by": "user@example.com",
        "change_summary": "Added UAV classification and updated maintenance rules",
        "breaking_changes": [
          {
            "change_type": "class_addition",
            "element_affected": "UAV",
            "impact_level": "minor",
            "description": "Added new UAV subclass under Aircraft"
          }
        ],
        "compatibility_level": "backward_compatible",
        "migration_required": false,
        "affected_dependencies": 12,
        "quality_metrics": {
          "completeness": 0.94,
          "consistency": 0.97,
          "maintainability": 0.89
        }
      }
    ],
    "total_versions": 15,
    "current_version": "ver-uuid-001",
    "pagination": {
      "limit": 50,
      "offset": 0,
      "has_more": false
    }
  }
}
```

#### POST `/workspaces/{workspaceId}/ontologies/{ontologyId}/versions`
**Description**: Create a new version of the ontology

**Path Parameters:**
- `workspaceId` (required): Workspace identifier
- `ontologyId` (required): Ontology identifier

**Request Body:**
```json
{
  "version_type": "minor",
  "change_summary": "Added new aircraft classification for UAV",
  "change_justification": "Business requirement to track unmanned aerial vehicles",
  "stability_level": "stable",
  "breaking_changes": [
    {
      "change_type": "class_addition",
      "element_affected": "UAV",
      "description": "Added UAV as new aircraft subclass",
      "migration_notes": "No migration required for existing data"
    }
  ],
  "tags": [
    {
      "key": "feature",
      "value": "uav_support"
    },
    {
      "key": "domain",
      "value": "aviation"
    }
  ],
  "notify_stakeholders": true,
  "run_impact_analysis": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "version_id": "ver-uuid-002",
    "version_number": "2.2.0",
    "created_at": "2025-01-15T15:22:18Z",
    "impact_analysis": {
      "overall_impact_score": 0.23,
      "affected_systems": 8,
      "breaking_changes": 0,
      "migration_required": false,
      "estimated_migration_time": "2 hours"
    },
    "stakeholder_notifications": {
      "notifications_generated": 15,
      "notifications_sent": 15,
      "estimated_review_time": "24 hours"
    }
  }
}
```

### Impact Analysis

#### POST `/workspaces/{workspaceId}/ontologies/{ontologyId}/impact-analysis`
**Description**: Perform comprehensive impact analysis for proposed changes

**Request Body:**
```json
{
  "proposed_changes": [
    {
      "change_type": "class_addition",
      "element_affected": "UAV",
      "change_details": {
        "new_value": {
          "class_name": "UAV",
          "parent_class": "Aircraft",
          "properties": ["registration", "operator", "max_altitude"],
          "constraints": ["requires_special_license"]
        }
      }
    }
  ],
  "analysis_scope": {
    "include_hidden_dependencies": true,
    "include_performance_impact": true,
    "include_security_analysis": true,
    "forecast_horizon_days": 90
  },
  "das_assistance": {
    "enable_ai_predictions": true,
    "include_recommendations": true,
    "confidence_threshold": 0.7
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis_id": "analysis-uuid-001",
    "overall_impact_score": 0.34,
    "confidence": 0.92,
    "analysis_timestamp": "2025-01-15T15:25:00Z",
    
    "ecosystem_impacts": [
      {
        "system_id": "flight_data_validator",
        "system_type": "validation_schema",
        "impact_probability": 0.89,
        "impact_severity": "medium",
        "description": "Validation schema needs update to handle UAV data",
        "estimated_fix_time": "2 hours",
        "automatic_migration_available": true
      },
      {
        "system_id": "aircraft_classification_model",
        "system_type": "classification_model",
        "impact_probability": 0.95,
        "impact_severity": "high",
        "description": "ML model needs retraining to classify UAV aircraft",
        "estimated_fix_time": "4 hours",
        "automatic_migration_available": false
      }
    ],
    
    "hidden_dependencies": [
      {
        "dependency_id": "maintenance_scheduler_implicit",
        "dependent_system": "maintenance_scheduler",
        "dependency_type": "implicit_schema_dependency",
        "discovery_confidence": 0.78,
        "description": "Maintenance scheduler implicitly assumes aircraft types",
        "recommended_investigation": "Review maintenance rule generation logic"
      }
    ],
    
    "cascade_effects": [
      {
        "trigger_change": "UAV class addition",
        "cascade_chain": [
          "Aircraft classification updated",
          "Flight planning logic affected",
          "Airspace management rules updated"
        ],
        "final_impact": {
          "system_id": "airspace_management",
          "severity": "low",
          "description": "New UAV flight rules may be needed"
        }
      }
    ],
    
    "das_recommendations": [
      {
        "recommendation": "Schedule UAV model training during low-traffic window",
        "reasoning": "Historical data shows 60% faster training Tuesday 2-6 AM",
        "confidence": 0.87
      },
      {
        "recommendation": "Pre-notify maintenance team about UAV rule updates",
        "reasoning": "Similar changes in past caused 2-day delay without advance notice",
        "confidence": 0.92
      }
    ],
    
    "risk_assessment": {
      "overall_risk": "medium",
      "risk_factors": [
        {
          "factor": "Model retraining required",
          "severity": "medium",
          "mitigation": "Test model with UAV data subset first"
        }
      ],
      "mitigation_plan": {
        "phase_1": "Update validation schemas (automatic)",
        "phase_2": "Retrain classification model (supervised)",
        "phase_3": "Update maintenance rules (manual review)"
      }
    }
  }
}
```

### Migration Management

#### POST `/workspaces/{workspaceId}/migration/plan`
**Description**: Create a comprehensive migration plan for ontology changes

**Request Body:**
```json
{
  "from_version": "2.1.0",
  "to_version": "2.2.0",
  "migration_requirements": {
    "max_downtime_minutes": 30,
    "rollback_required": true,
    "stakeholder_approval_required": true,
    "testing_environment": "staging",
    "coordination_strategy": "parallel_coordinated"
  },
  "target_systems": [
    "flight_data_validator",
    "aircraft_classification_model",
    "maintenance_scheduler"
  ],
  "das_assistance": {
    "optimize_timeline": true,
    "generate_rollback_plan": true,
    "create_communication_plan": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "migration_plan_id": "migration-plan-uuid-001",
    "estimated_duration": "6 hours",
    "estimated_downtime": "15 minutes",
    "risk_level": "medium",
    "rollback_time": "5 minutes",
    
    "migration_phases": [
      {
        "phase_id": "phase-1",
        "phase_name": "Preparation and Validation",
        "phase_type": "preparation",
        "duration_estimate": "1 hour",
        "automation_level": "fully_automated",
        "description": "Create backups and validate migration readiness",
        "target_systems": ["all"],
        "success_criteria": ["All backups completed", "Validation passed"],
        "das_guidance": ["Optimal backup window: 1-2 AM", "Validate with test dataset first"]
      },
      {
        "phase_id": "phase-2", 
        "phase_name": "Validation Schema Update",
        "phase_type": "incremental_rollout",
        "duration_estimate": "2 hours",
        "automation_level": "fully_automated",
        "description": "Update validation schemas for UAV support",
        "target_systems": ["flight_data_validator"],
        "prerequisites": ["phase-1"],
        "rollback_procedure": "Restore schema from backup",
        "das_guidance": ["Monitor validation error rates during update"]
      },
      {
        "phase_id": "phase-3",
        "phase_name": "Model Retraining",
        "phase_type": "full_ecosystem_deployment",
        "duration_estimate": "3 hours",
        "automation_level": "semi_automated",
        "description": "Retrain aircraft classification model with UAV data",
        "target_systems": ["aircraft_classification_model"],
        "prerequisites": ["phase-2"],
        "validation_criteria": ["Model accuracy > 0.95", "UAV detection rate > 0.90"],
        "human_approval_required": true,
        "das_guidance": ["Use incremental learning approach", "Validate on UAV test set"]
      }
    ],
    
    "coordination_plan": {
      "synchronization_points": [
        {
          "point_id": "sync-1",
          "description": "Validation schema updated",
          "dependent_phases": ["phase-3"],
          "validation_required": true
        }
      ],
      "communication_schedule": [
        {
          "time": "24 hours before",
          "message": "Migration planned for Tuesday 2 AM",
          "recipients": ["data_science_team", "operations_team"]
        },
        {
          "time": "1 hour before",
          "message": "Migration starting in 1 hour",
          "recipients": ["on_call_team"]
        }
      ]
    },
    
    "rollback_strategy": {
      "rollback_points": [
        {
          "point_id": "rollback-1",
          "description": "After schema update",
          "rollback_time": "2 minutes",
          "automated": true
        },
        {
          "point_id": "rollback-2", 
          "description": "After model deployment",
          "rollback_time": "5 minutes",
          "automated": true
        }
      ],
      "rollback_triggers": [
        "Validation error rate > 5%",
        "Model accuracy drop > 10%",
        "System response time > 2x baseline"
      ]
    },
    
    "das_optimizations": [
      {
        "optimization": "Parallel schema updates",
        "benefit": "Reduce migration time by 40%",
        "risk": "Increased complexity",
        "recommendation": "Proceed - benefits outweigh risks"
      }
    ]
  }
}
```

### DAS Version Intelligence

#### POST `/workspaces/{workspaceId}/das/version-guidance`
**Description**: Get intelligent versioning guidance from DAS

**Request Body:**
```json
{
  "scenario": {
    "scenario_type": "ontology_enhancement",
    "current_version": "2.1.0",
    "proposed_changes": [
      {
        "change_type": "class_addition",
        "element": "UAV",
        "business_priority": "high",
        "timeline_requirement": "next_release"
      }
    ],
    "constraints": {
      "max_downtime": "30 minutes",
      "stakeholder_availability": "business_hours_only",
      "testing_requirements": "full_regression",
      "rollback_requirement": "5_minute_recovery"
    }
  },
  "guidance_scope": {
    "include_timing_recommendations": true,
    "include_risk_analysis": true,
    "include_resource_planning": true,
    "include_alternative_approaches": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "guidance_id": "das-guidance-uuid-001",
    "das_confidence": 0.94,
    "generated_at": "2025-01-15T15:30:00Z",
    
    "primary_recommendation": {
      "approach": "phased_parallel_deployment",
      "reasoning": "Minimize risk while meeting timeline requirements",
      "success_probability": 0.92,
      "estimated_effort": "16 person-hours",
      "timeline": "3 business days"
    },
    
    "timing_recommendations": [
      {
        "recommendation": "Start Tuesday 2:00 AM EST",
        "reasoning": "Historical data shows 73% fewer conflicts at this time",
        "confidence": 0.89,
        "backup_times": ["Wednesday 2:00 AM EST", "Thursday 2:00 AM EST"]
      }
    ],
    
    "risk_analysis": {
      "overall_risk": "medium",
      "risk_factors": [
        {
          "factor": "Model retraining dependency",
          "probability": 0.85,
          "impact": "medium",
          "mitigation": "Pre-train model with UAV subset"
        },
        {
          "factor": "Hidden maintenance system dependency",
          "probability": 0.34,
          "impact": "low",
          "mitigation": "Proactive maintenance team notification"
        }
      ],
      "confidence_factors": [
        "Similar changes successfully implemented 3 times in past year",
        "All target systems have automated rollback capabilities",
        "Team has experience with aircraft ontology modifications"
      ]
    },
    
    "resource_planning": {
      "required_personnel": [
        {
          "role": "ontology_engineer",
          "hours": 4,
          "critical_phases": ["planning", "validation"]
        },
        {
          "role": "data_scientist",
          "hours": 8,
          "critical_phases": ["model_retraining", "validation"]
        },
        {
          "role": "system_administrator",
          "hours": 4,
          "critical_phases": ["deployment", "monitoring"]
        }
      ],
      "system_resources": [
        {
          "resource": "model_training_cluster",
          "duration": "3 hours",
          "availability_required": "Tuesday 3-6 AM"
        }
      ]
    },
    
    "alternative_approaches": [
      {
        "approach": "feature_flag_rollout",
        "pros": ["Zero downtime", "Gradual validation"],
        "cons": ["Increased complexity", "Longer timeline"],
        "success_probability": 0.88,
        "timeline": "5 business days"
      },
      {
        "approach": "blue_green_deployment",
        "pros": ["Instant rollback", "Full validation"],
        "cons": ["Resource intensive", "Complex coordination"],
        "success_probability": 0.95,
        "timeline": "2 business days"
      }
    ],
    
    "monitoring_recommendations": [
      {
        "metric": "validation_error_rate",
        "threshold": "< 2%",
        "monitoring_window": "48 hours post-deployment"
      },
      {
        "metric": "model_accuracy",
        "threshold": "> 0.95",
        "monitoring_window": "72 hours post-deployment"
      }
    ]
  }
}
```

### Emergency Response

#### POST `/workspaces/{workspaceId}/emergency/response`
**Description**: Initiate emergency response for ontology-related incidents

**Request Body:**
```json
{
  "emergency_condition": {
    "emergency_type": "massive_validation_failure",
    "severity_level": "high",
    "description": "85% of flight data validation failing after ontology update",
    "affected_systems": [
      "flight_data_validator",
      "real_time_tracker", 
      "safety_monitor"
    ],
    "detection_time": "2025-01-15T15:45:00Z",
    "impact_scope": {
      "users_affected": 450,
      "data_records_affected": 125000,
      "business_processes_disrupted": ["flight_tracking", "safety_monitoring"]
    }
  },
  "response_requirements": {
    "max_resolution_time": "15 minutes",
    "stakeholder_notification_required": true,
    "regulatory_reporting_required": true,
    "preserve_audit_trail": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "emergency_response_id": "emergency-uuid-001",
    "response_initiated_at": "2025-01-15T15:45:30Z",
    "estimated_resolution_time": "12 minutes",
    
    "immediate_actions": [
      {
        "action": "Activate emergency rollback to version 2.1.0",
        "status": "executing",
        "estimated_completion": "2 minutes",
        "automated": true
      },
      {
        "action": "Notify on-call team and stakeholders",
        "status": "completed",
        "completion_time": "30 seconds",
        "automated": true
      },
      {
        "action": "Isolate affected validation services",
        "status": "completed", 
        "completion_time": "45 seconds",
        "automated": true
      }
    ],
    
    "rollback_plan": {
      "rollback_id": "emergency-rollback-uuid-001",
      "target_version": "2.1.0",
      "rollback_strategy": "immediate_full_rollback",
      "phases": [
        {
          "phase": "Stop validation services",
          "duration": "30 seconds",
          "status": "completed"
        },
        {
          "phase": "Restore ontology to v2.1.0",
          "duration": "2 minutes",
          "status": "executing"
        },
        {
          "phase": "Restart validation services",
          "duration": "1 minute",
          "status": "pending"
        },
        {
          "phase": "Validate system recovery",
          "duration": "3 minutes",
          "status": "pending"
        }
      ]
    },
    
    "communication_plan": {
      "stakeholder_notifications": [
        {
          "stakeholder": "operations_team",
          "message": "Emergency rollback in progress - validation services will be restored in ~12 minutes",
          "channel": "slack_alert",
          "sent_at": "2025-01-15T15:45:45Z"
        },
        {
          "stakeholder": "management_team",
          "message": "Service disruption detected - emergency response initiated",
          "channel": "email",
          "sent_at": "2025-01-15T15:46:00Z"
        }
      ],
      "status_updates": {
        "frequency": "every_2_minutes",
        "channels": ["slack", "status_page"],
        "next_update": "2025-01-15T15:47:30Z"
      }
    },
    
    "monitoring": {
      "recovery_metrics": [
        {
          "metric": "validation_success_rate",
          "current_value": "15%",
          "target_value": "> 95%",
          "status": "improving"
        },
        {
          "metric": "system_response_time",
          "current_value": "850ms",
          "target_value": "< 200ms", 
          "status": "degraded"
        }
      ],
      "estimated_full_recovery": "2025-01-15T15:57:30Z"
    },
    
    "post_incident_actions": [
      {
        "action": "Conduct root cause analysis",
        "responsible_team": "ontology_engineering",
        "due_date": "2025-01-16T15:45:00Z"
      },
      {
        "action": "Review and improve rollback procedures", 
        "responsible_team": "system_reliability",
        "due_date": "2025-01-17T15:45:00Z"
      },
      {
        "action": "Update emergency response documentation",
        "responsible_team": "technical_writing",
        "due_date": "2025-01-18T15:45:00Z"
      }
    ]
  }
}
```

---

## WebSocket Events for Real-Time Versioning

### Version Management Events

```typescript
// Subscribe to version-related events
ws.send(JSON.stringify({
  type: "subscribe",
  channel: "version_management",
  ontology_id: "ontology-uuid"
}));

// Event types received:
interface VersioningWebSocketEvents {
  version_created: {
    version_id: string;
    version_number: string;
    created_by: string;
    change_summary: string;
  };
  
  impact_analysis_completed: {
    analysis_id: string;
    overall_impact_score: number;
    affected_systems: number;
    requires_attention: boolean;
  };
  
  migration_progress: {
    migration_id: string;
    phase: string;
    progress_percentage: number;
    estimated_completion: string;
  };
  
  emergency_detected: {
    emergency_id: string;
    severity: string;
    description: string;
    immediate_action_required: boolean;
  };
  
  stakeholder_response: {
    notification_id: string;
    stakeholder_id: string;
    response_type: "acknowledged" | "approved" | "rejected";
    comments?: string;
  };
}
```

### Real-Time Collaboration Events

```typescript
interface CollaborationVersioningEvents {
  version_branch_created: {
    branch_id: string;
    branch_name: string;
    created_by: string;
    from_version: string;
  };
  
  version_comparison_shared: {
    comparison_id: string;
    from_version: string;
    to_version: string;
    shared_by: string;
    collaborators: string[];
  };
  
  migration_plan_updated: {
    plan_id: string;
    updated_by: string;
    changes: string[];
    requires_review: boolean;
  };
}
```

This comprehensive API extension provides full access to the advanced ontology versioning capabilities, enabling sophisticated version management, impact analysis, migration orchestration, and emergency response through intuitive REST endpoints and real-time WebSocket events.