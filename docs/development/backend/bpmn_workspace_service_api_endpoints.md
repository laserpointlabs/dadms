# BPMN Workspace Service API Endpoints

## Overview

The BPMN Workspace Service provides an AI-enhanced workflow design environment for creating, editing, and managing Business Process Model and Notation (BPMN) workflows. It offers intelligent assistance, real-time collaboration, comprehensive validation, and seamless integration with the DADMS ecosystem.

## Base URL
```
http://localhost:3021
```

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Process Models

### List Process Models
**GET** `/api/models`

Returns a list of process models with optional filtering capabilities.

**Query Parameters:**
- `project_id` (string, optional): Filter by project ID
- `category` (string, optional): Filter by category
- `status` (string, optional): Filter by status (draft, review, approved, deployed, deprecated)
- `tags` (array, optional): Filter by tags
- `limit` (integer, optional): Number of models to return (default: 20)
- `offset` (integer, optional): Number of models to skip (default: 0)

**Response:**
```json
{
  "models": [
    {
      "id": "model-123",
      "name": "Customer Onboarding Process",
      "description": "Complete customer onboarding workflow with approval gates",
      "category": "onboarding",
      "project_id": "proj-456",
      "version": 3,
      "status": "approved",
      "metadata": {
        "tags": ["customer", "onboarding", "approval"],
        "estimated_duration": 3600,
        "complexity_score": 6.5,
        "participant_count": 4,
        "decision_points": 3,
        "automation_level": "semi_automated",
        "business_value": "high"
      },
      "created_by": "user-789",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-16T14:30:00Z",
      "deployed_at": "2024-01-16T15:00:00Z",
      "deployed_by": "user-456"
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

### Create Process Model
**POST** `/api/models`

Create a new BPMN process model.

**Request Body:**
```json
{
  "name": "Invoice Approval Process",
  "description": "Automated invoice approval workflow with multi-tier approval",
  "category": "finance",
  "project_id": "proj-789",
  "bpmn_xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\">\n  <bpmn:process id=\"invoice-approval\" isExecutable=\"true\">\n    <bpmn:startEvent id=\"start\" name=\"Invoice Received\"/>\n    <bpmn:task id=\"validate\" name=\"Validate Invoice\"/>\n    <bpmn:exclusiveGateway id=\"gateway\" name=\"Amount Check\"/>\n    <bpmn:task id=\"manager-approve\" name=\"Manager Approval\"/>\n    <bpmn:task id=\"director-approve\" name=\"Director Approval\"/>\n    <bpmn:endEvent id=\"end\" name=\"Invoice Processed\"/>\n  </bpmn:process>\n</bpmn:definitions>",
  "metadata": {
    "tags": ["finance", "approval", "automated"],
    "estimated_duration": 1800,
    "complexity_score": 4.2,
    "participant_count": 3,
    "decision_points": 2,
    "automation_level": "semi_automated",
    "business_value": "high"
  },
  "template_id": "template-finance-approval"
}
```

**Response:**
```json
{
  "id": "model-456",
  "name": "Invoice Approval Process",
  "description": "Automated invoice approval workflow with multi-tier approval",
  "category": "finance",
  "project_id": "proj-789",
  "version": 1,
  "status": "draft",
  "metadata": {
    "tags": ["finance", "approval", "automated"],
    "estimated_duration": 1800,
    "complexity_score": 4.2,
    "participant_count": 3,
    "decision_points": 2,
    "automation_level": "semi_automated",
    "business_value": "high"
  },
  "created_by": "user-123",
  "created_at": "2024-01-15T11:00:00Z",
  "updated_at": "2024-01-15T11:00:00Z"
}
```

### Get Process Model Details
**GET** `/api/models/{modelId}`

Returns detailed information about a specific process model including BPMN XML and version history.

**Response:**
```json
{
  "id": "model-456",
  "name": "Invoice Approval Process",
  "description": "Automated invoice approval workflow with multi-tier approval",
  "category": "finance",
  "project_id": "proj-789",
  "bpmn_xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\">\n  <bpmn:process id=\"invoice-approval\" isExecutable=\"true\">\n    <bpmn:startEvent id=\"start\" name=\"Invoice Received\"/>\n    <bpmn:task id=\"validate\" name=\"Validate Invoice\"/>\n    <bpmn:exclusiveGateway id=\"gateway\" name=\"Amount Check\">\n      <bpmn:conditionExpression>amount > 1000</bpmn:conditionExpression>\n    </bpmn:exclusiveGateway>\n    <bpmn:task id=\"manager-approve\" name=\"Manager Approval\">\n      <bpmn:documentation>Requires manager approval for amounts over $1000</bpmn:documentation>\n    </bpmn:task>\n    <bpmn:task id=\"director-approve\" name=\"Director Approval\">\n      <bpmn:documentation>Requires director approval for amounts over $10000</bpmn:documentation>\n    </bpmn:task>\n    <bpmn:endEvent id=\"end\" name=\"Invoice Processed\"/>\n  </bpmn:process>\n</bpmn:definitions>",
  "version": 2,
  "status": "review",
  "metadata": {
    "tags": ["finance", "approval", "automated"],
    "estimated_duration": 1800,
    "complexity_score": 4.2,
    "participant_count": 3,
    "decision_points": 2,
    "automation_level": "semi_automated",
    "business_value": "high"
  },
  "version_history": [
    {
      "id": "version-1",
      "model_id": "model-456",
      "version_number": 1,
      "change_summary": "Initial version created from template",
      "created_by": "user-123",
      "created_at": "2024-01-15T11:00:00Z"
    },
    {
      "id": "version-2",
      "model_id": "model-456",
      "version_number": 2,
      "change_summary": "Added conditional logic for approval thresholds",
      "created_by": "user-123",
      "created_at": "2024-01-15T14:30:00Z"
    }
  ],
  "ai_suggestions": [
    {
      "id": "suggestion-789",
      "type": "add_validation",
      "description": "Add timeout handling for approval tasks",
      "confidence": 0.85,
      "auto_apply": false,
      "reasoning": "Long-running approval tasks should have timeout mechanisms to prevent process stalls",
      "created_at": "2024-01-15T15:00:00Z"
    }
  ],
  "created_by": "user-123",
  "created_at": "2024-01-15T11:00:00Z",
  "updated_at": "2024-01-15T14:30:00Z"
}
```

### Deploy Process Model
**POST** `/api/models/{modelId}/deploy`

Deploy a process model to an execution environment.

**Request Body:**
```json
{
  "environment": "production",
  "configuration": {
    "process_engine": "camunda",
    "deployment_name": "invoice-approval-v2",
    "tenant_id": "finance-dept",
    "auto_start": false,
    "notification_settings": {
      "deployment_success": ["admin@company.com"],
      "deployment_failure": ["devops@company.com"]
    }
  },
  "description": "Production deployment with enhanced approval logic and timeout handling"
}
```

**Response:**
```json
{
  "deployment_id": "deploy-789",
  "model_id": "model-456",
  "environment": "production",
  "status": "deployed",
  "deployed_at": "2024-01-15T16:00:00Z",
  "deployed_by": "user-123",
  "deployment_url": "https://engine.dadms.com/process/invoice-approval",
  "configuration": {
    "process_engine": "camunda",
    "deployment_name": "invoice-approval-v2",
    "tenant_id": "finance-dept",
    "process_definition_id": "invoice-approval:2:abc123"
  }
}
```

---

## AI Assistance

### Get AI Suggestions
**POST** `/api/ai/suggestions`

Get AI-powered suggestions for process model improvements.

**Request Body:**
```json
{
  "model_id": "model-456",
  "bpmn_xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>...",
  "context": {
    "current_element": "task-approve",
    "selection": ["task-1", "gateway-2"],
    "user_intent": "add error handling"
  },
  "max_suggestions": 5
}
```

**Response:**
```json
{
  "suggestions": [
    {
      "id": "suggestion-123",
      "type": "add_element",
      "element_type": "boundary_event",
      "description": "Add timer boundary event to handle approval timeouts",
      "confidence": 0.92,
      "auto_apply": false,
      "preview_data": {
        "element_type": "bpmn:BoundaryEvent",
        "event_type": "timer",
        "attached_to": "task-approve",
        "timer_duration": "PT24H"
      },
      "reasoning": "Approval tasks without timeout handling can cause process instances to stall indefinitely",
      "created_at": "2024-01-15T16:30:00Z"
    },
    {
      "id": "suggestion-124",
      "type": "add_element",
      "element_type": "error_event",
      "description": "Add error end event for invalid invoice scenarios",
      "confidence": 0.88,
      "auto_apply": false,
      "preview_data": {
        "element_type": "bpmn:EndEvent",
        "event_definition": "error",
        "error_code": "INVALID_INVOICE"
      },
      "reasoning": "Process should handle invalid invoice scenarios with proper error termination",
      "created_at": "2024-01-15T16:30:00Z"
    }
  ],
  "context_analysis": {
    "model_complexity": 4.2,
    "optimization_potential": 0.3,
    "compliance_score": 0.85
  },
  "generated_at": "2024-01-15T16:30:00Z"
}
```

### Auto-Complete Workflow
**POST** `/api/ai/complete`

Auto-complete BPMN workflow based on current context.

**Request Body:**
```json
{
  "model_id": "model-456",
  "bpmn_xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>...",
  "completion_context": {
    "from_element": "task-review",
    "completion_type": "decision_logic",
    "business_context": "Invoice approval process requires automatic routing based on amount and department"
  }
}
```

**Response:**
```json
{
  "completions": [
    {
      "type": "gateway_with_conditions",
      "confidence": 0.94,
      "elements": [
        {
          "type": "exclusiveGateway",
          "id": "amount-gateway",
          "name": "Amount Check",
          "conditions": [
            {
              "expression": "${amount <= 1000}",
              "target": "auto-approve-task"
            },
            {
              "expression": "${amount > 1000 && amount <= 10000}",
              "target": "manager-approve-task"
            },
            {
              "expression": "${amount > 10000}",
              "target": "director-approve-task"
            }
          ]
        }
      ],
      "description": "Decision gateway with amount-based approval routing"
    },
    {
      "type": "parallel_approval",
      "confidence": 0.78,
      "elements": [
        {
          "type": "parallelGateway",
          "id": "parallel-split",
          "name": "Parallel Approval Split"
        }
      ],
      "description": "Parallel gateway for concurrent approvals"
    }
  ],
  "recommended_completion": 0,
  "generated_at": "2024-01-15T17:00:00Z"
}
```

### Generate Model from Description
**POST** `/api/ai/generate`

Generate BPMN model from natural language description.

**Request Body:**
```json
{
  "description": "Customer submits expense report, system validates receipts, manager reviews and approves or rejects, if approved accounting processes payment, customer receives notification",
  "context": {
    "domain": "expense_management",
    "participants": ["customer", "manager", "accounting", "system"],
    "constraints": [
      "must complete within 48 hours",
      "requires manager approval for amounts > $500",
      "must validate all receipts before approval"
    ]
  },
  "preferences": {
    "complexity_level": "intermediate",
    "include_error_handling": true
  }
}
```

**Response:**
```json
{
  "bpmn_xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\">\n  <bpmn:process id=\"expense-report-process\" isExecutable=\"true\">\n    <bpmn:startEvent id=\"start\" name=\"Expense Report Submitted\"/>\n    <bpmn:serviceTask id=\"validate-receipts\" name=\"Validate Receipts\">\n      <bpmn:documentation>Automated validation of receipt format and content</bpmn:documentation>\n    </bpmn:serviceTask>\n    <bpmn:exclusiveGateway id=\"validation-check\" name=\"Receipts Valid?\"/>\n    <bpmn:userTask id=\"manager-review\" name=\"Manager Review\">\n      <bpmn:documentation>Manager reviews expense report and receipts</bpmn:documentation>\n    </bpmn:userTask>\n    <bpmn:exclusiveGateway id=\"approval-decision\" name=\"Approved?\"/>\n    <bpmn:serviceTask id=\"process-payment\" name=\"Process Payment\">\n      <bpmn:documentation>Accounting processes approved payment</bpmn:documentation>\n    </bpmn:serviceTask>\n    <bpmn:serviceTask id=\"send-notification\" name=\"Send Notification\"/>\n    <bpmn:endEvent id=\"end-approved\" name=\"Report Processed\"/>\n    <bpmn:endEvent id=\"end-rejected\" name=\"Report Rejected\"/>\n    <bpmn:boundaryEvent id=\"timeout\" name=\"48 Hour Timeout\" attachedToRef=\"manager-review\">\n      <bpmn:timerEventDefinition>\n        <bpmn:timeDuration>PT48H</bpmn:timeDuration>\n      </bpmn:timerEventDefinition>\n    </bpmn:boundaryEvent>\n  </bpmn:process>\n</bpmn:definitions>",
  "model_analysis": {
    "complexity_score": 5.5,
    "element_count": 12,
    "decision_points": 2,
    "estimated_duration": 1800
  },
  "suggestions": [
    "Consider adding escalation path for timeout scenarios",
    "Add notification tasks for each decision outcome",
    "Include audit trail for compliance tracking"
  ],
  "confidence": 0.89,
  "generated_at": "2024-01-15T17:30:00Z"
}
```

---

## Templates

### List Process Templates
**GET** `/api/templates`

Returns a list of available process templates with filtering capabilities.

**Query Parameters:**
- `category` (string, optional): Filter by category
- `industry` (string, optional): Filter by industry
- `complexity_level` (string, optional): Filter by complexity level
- `tags` (array, optional): Filter by tags
- `is_public` (boolean, optional): Filter by public/private templates

**Response:**
```json
{
  "templates": [
    {
      "id": "template-123",
      "name": "Standard Approval Process",
      "description": "Template for standard three-tier approval processes",
      "category": "approval",
      "industry": "financial_services",
      "use_case": "Document approval workflow",
      "complexity_level": "intermediate",
      "variables": [
        {
          "name": "approval_threshold_1",
          "type": "number",
          "description": "First tier approval threshold in dollars",
          "required": true,
          "default_value": 1000
        },
        {
          "name": "approval_threshold_2",
          "type": "number",
          "description": "Second tier approval threshold in dollars",
          "required": true,
          "default_value": 10000
        },
        {
          "name": "approver_roles",
          "type": "selection",
          "description": "Available approver roles",
          "required": true,
          "options": ["manager", "director", "vp", "cfo"]
        }
      ],
      "usage_count": 45,
      "rating": 4.7,
      "tags": ["approval", "three-tier", "finance"],
      "created_by": "user-456",
      "created_at": "2024-01-10T10:00:00Z",
      "is_public": true
    }
  ],
  "categories": [
    {
      "name": "approval",
      "count": 25
    },
    {
      "name": "onboarding",
      "count": 18
    },
    {
      "name": "finance",
      "count": 32
    }
  ],
  "total": 200
}
```

### Create Model from Template
**POST** `/api/templates/{templateId}/instantiate`

Create a new process model from a template with customized variables.

**Request Body:**
```json
{
  "name": "Customer Approval Process",
  "description": "Customer-specific approval process based on standard template",
  "project_id": "proj-456",
  "variable_values": {
    "approval_threshold_1": 5000,
    "approval_threshold_2": 25000,
    "approver_roles": ["manager", "director"],
    "notification_email": "approvals@customer.com",
    "escalation_hours": 24
  },
  "customizations": {
    "additional_tasks": [
      {
        "id": "compliance-check",
        "name": "Compliance Verification",
        "type": "serviceTask",
        "position": "after_validation"
      }
    ],
    "modified_flows": [
      {
        "from": "gateway-amount",
        "to": "compliance-check",
        "condition": "${amount > 50000}"
      }
    ]
  }
}
```

**Response:**
```json
{
  "id": "model-789",
  "name": "Customer Approval Process",
  "description": "Customer-specific approval process based on standard template",
  "category": "approval",
  "project_id": "proj-456",
  "version": 1,
  "status": "draft",
  "metadata": {
    "tags": ["approval", "customer-specific", "compliance"],
    "estimated_duration": 2400,
    "complexity_score": 6.8,
    "participant_count": 5,
    "decision_points": 4,
    "automation_level": "semi_automated",
    "business_value": "high"
  },
  "template_source": {
    "template_id": "template-123",
    "template_name": "Standard Approval Process",
    "customizations_applied": 2
  },
  "created_by": "user-123",
  "created_at": "2024-01-15T18:00:00Z",
  "updated_at": "2024-01-15T18:00:00Z"
}
```

---

## Collaboration

### Start Collaboration Session
**POST** `/api/collaboration/sessions`

Start a new real-time collaboration session for a process model.

**Request Body:**
```json
{
  "model_id": "model-456",
  "participants": [
    {
      "user_id": "user-789",
      "role": "editor"
    },
    {
      "user_id": "user-101",
      "role": "reviewer"
    }
  ],
  "expires_in": 7200,
  "description": "Collaborative design session for invoice approval process optimization"
}
```

**Response:**
```json
{
  "id": "session-123",
  "model_id": "model-456",
  "participants": [
    {
      "user_id": "user-123",
      "name": "Alice Johnson",
      "role": "owner",
      "permissions": ["edit", "comment", "view", "manage"],
      "last_active": "2024-01-15T18:30:00Z"
    },
    {
      "user_id": "user-789",
      "name": "Bob Smith",
      "role": "editor",
      "permissions": ["edit", "comment", "view"],
      "last_active": "2024-01-15T18:30:00Z"
    },
    {
      "user_id": "user-101",
      "name": "Carol Davis",
      "role": "reviewer",
      "permissions": ["comment", "view"],
      "last_active": "2024-01-15T18:30:00Z"
    }
  ],
  "created_by": "user-123",
  "created_at": "2024-01-15T18:30:00Z",
  "expires_at": "2024-01-15T20:30:00Z",
  "status": "active",
  "websocket_url": "wss://api.dadms.com/bpmn-workspace/collaboration/session-123"
}
```

### Apply Model Change
**POST** `/api/collaboration/sessions/{sessionId}/changes`

Apply a change to the model during a collaboration session.

**Request Body:**
```json
{
  "change_type": "add",
  "element_data": {
    "type": "bpmn:UserTask",
    "id": "compliance-review",
    "name": "Compliance Review",
    "documentation": "Review for regulatory compliance before final approval",
    "assignee": "compliance-team",
    "properties": {
      "form_key": "compliance-review-form",
      "priority": "high"
    }
  },
  "position": {
    "x": 450,
    "y": 200
  },
  "description": "Added compliance review step based on new regulatory requirements"
}
```

**Response:**
```json
{
  "id": "change-456",
  "session_id": "session-123",
  "user_id": "user-789",
  "change_type": "add",
  "element_id": "compliance-review",
  "before_state": null,
  "after_state": {
    "type": "bpmn:UserTask",
    "id": "compliance-review",
    "name": "Compliance Review",
    "documentation": "Review for regulatory compliance before final approval",
    "position": {
      "x": 450,
      "y": 200
    }
  },
  "timestamp": "2024-01-15T19:00:00Z",
  "applied": true,
  "conflict_resolution": "none",
  "validation_results": {
    "valid": true,
    "warnings": []
  }
}
```

### Get Session Changes
**GET** `/api/collaboration/sessions/{sessionId}/changes`

Get all changes made during a collaboration session.

**Response:**
```json
{
  "changes": [
    {
      "id": "change-123",
      "session_id": "session-123",
      "user_id": "user-123",
      "change_type": "modify",
      "element_id": "gateway-amount",
      "before_state": {
        "name": "Amount Check",
        "conditions": [
          {
            "expression": "${amount > 1000}",
            "target": "manager-approve"
          }
        ]
      },
      "after_state": {
        "name": "Amount & Department Check",
        "conditions": [
          {
            "expression": "${amount > 1000 || department == 'IT'}",
            "target": "manager-approve"
          }
        ]
      },
      "timestamp": "2024-01-15T18:45:00Z",
      "applied": true,
      "conflict_resolution": "none"
    },
    {
      "id": "change-456",
      "session_id": "session-123",
      "user_id": "user-789",
      "change_type": "add",
      "element_id": "compliance-review",
      "after_state": {
        "type": "bpmn:UserTask",
        "name": "Compliance Review"
      },
      "timestamp": "2024-01-15T19:00:00Z",
      "applied": true,
      "conflict_resolution": "none"
    }
  ],
  "session_id": "session-123",
  "total_changes": 15,
  "applied_changes": 14,
  "conflicts": 1
}
```

---

## Validation

### Validate BPMN Syntax
**POST** `/api/validation/syntax`

Validate BPMN XML syntax and structure.

**Request Body:**
```json
{
  "bpmn_xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\">\n  <bpmn:process id=\"test-process\" isExecutable=\"true\">\n    <bpmn:startEvent id=\"start\"/>\n    <bpmn:task id=\"task1\" name=\"Process Task\"/>\n    <!-- Missing end event -->\n  </bpmn:process>\n</bpmn:definitions>",
  "validation_level": "comprehensive"
}
```

**Response:**
```json
{
  "valid": false,
  "errors": [
    {
      "type": "missing_element",
      "message": "Process must have at least one end event",
      "element_id": "test-process",
      "severity": "error",
      "line": 4
    },
    {
      "type": "disconnected_element",
      "message": "Task 'task1' is not connected to any other elements",
      "element_id": "task1",
      "severity": "error",
      "line": 5
    }
  ],
  "warnings": [
    {
      "type": "naming_convention",
      "message": "Task name should be more descriptive",
      "element_id": "task1",
      "severity": "warning",
      "line": 5
    }
  ],
  "suggestions": [
    "Add end event to complete the process flow",
    "Connect start event to task with sequence flow",
    "Connect task to end event with sequence flow"
  ],
  "validated_at": "2024-01-15T19:30:00Z"
}
```

### Analyze Performance
**POST** `/api/validation/performance`

Analyze process model for performance characteristics and bottlenecks.

**Request Body:**
```json
{
  "bpmn_xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>...",
  "analysis_scope": ["duration", "bottlenecks", "resource_usage"],
  "simulation_parameters": {
    "instance_count": 1000,
    "duration_days": 30
  }
}
```

**Response:**
```json
{
  "analysis_results": {
    "estimated_duration": {
      "min": 1800,
      "max": 14400,
      "average": 4200,
      "median": 3600,
      "percentile_95": 8400
    },
    "bottlenecks": [
      {
        "element_id": "manager-approve",
        "element_name": "Manager Approval",
        "wait_time": 2400,
        "impact_score": 8.5,
        "cause": "Limited manager availability during peak periods"
      },
      {
        "element_id": "compliance-review",
        "element_name": "Compliance Review",
        "wait_time": 1800,
        "impact_score": 6.2,
        "cause": "Manual review process without automated pre-screening"
      }
    ],
    "resource_utilization": {
      "manager": 0.85,
      "compliance_team": 0.72,
      "accounting": 0.45,
      "system": 0.95
    },
    "optimization_opportunities": [
      {
        "type": "parallel_execution",
        "description": "Execute compliance review and manager approval in parallel",
        "potential_improvement": "25% duration reduction"
      },
      {
        "type": "automation",
        "description": "Automate initial compliance screening",
        "potential_improvement": "40% resource efficiency gain"
      },
      {
        "type": "load_balancing",
        "description": "Distribute approval tasks across multiple managers",
        "potential_improvement": "50% wait time reduction"
      }
    ]
  },
  "performance_score": 6.8,
  "analyzed_at": "2024-01-15T20:00:00Z"
}
```

### Check Compliance
**POST** `/api/validation/compliance`

Check process model compliance with organizational standards and regulations.

**Request Body:**
```json
{
  "bpmn_xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>...",
  "compliance_standards": ["sox", "gdpr", "iso27001", "company_policy"],
  "organization_rules": {
    "max_approval_time": 48,
    "required_approvers": 2,
    "audit_trail_required": true,
    "segregation_of_duties": true
  }
}
```

**Response:**
```json
{
  "compliant": false,
  "compliance_score": 0.75,
  "violations": [
    {
      "standard": "sox",
      "rule": "segregation_of_duties",
      "severity": "high",
      "element_id": "approve-and-process",
      "description": "Same user cannot approve and process payment (SOX Section 404)",
      "remediation": "Split approval and processing into separate tasks with different assignees"
    },
    {
      "standard": "gdpr",
      "rule": "data_retention",
      "severity": "medium",
      "element_id": "store-customer-data",
      "description": "No data retention policy specified for customer data storage",
      "remediation": "Add data retention configuration with automatic deletion after specified period"
    },
    {
      "standard": "company_policy",
      "rule": "approval_timeout",
      "severity": "low",
      "element_id": "manager-approve",
      "description": "Approval task timeout exceeds company policy (48 hours)",
      "remediation": "Set task timeout to 48 hours or less"
    }
  ],
  "recommendations": [
    "Add audit logging to all approval and financial processing tasks",
    "Implement role-based task assignment to ensure proper segregation",
    "Add automatic escalation for tasks exceeding timeout thresholds",
    "Include data protection and retention policies in data handling tasks"
  ],
  "compliance_summary": {
    "sox": 0.60,
    "gdpr": 0.80,
    "iso27001": 0.85,
    "company_policy": 0.75
  },
  "checked_at": "2024-01-15T20:30:00Z"
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "MODEL_NOT_FOUND",
    "message": "The specified process model was not found",
    "details": {
      "model_id": "invalid-model-123",
      "suggestion": "Check available models using GET /api/models"
    },
    "timestamp": "2024-01-15T21:00:00Z"
  }
}
```

### Common Error Codes

**Model Errors:**
- `MODEL_NOT_FOUND`: Process model ID not found
- `MODEL_INVALID_BPMN`: Invalid BPMN XML structure
- `MODEL_VALIDATION_FAILED`: Model failed validation checks
- `MODEL_DEPLOYMENT_FAILED`: Deployment to process engine failed
- `MODEL_VERSION_CONFLICT`: Version conflict during update

**Collaboration Errors:**
- `SESSION_NOT_FOUND`: Collaboration session not found
- `SESSION_EXPIRED`: Collaboration session has expired
- `PARTICIPANT_NOT_AUTHORIZED`: User not authorized for session
- `CHANGE_CONFLICT`: Conflicting changes from multiple users
- `COLLABORATION_LIMIT_EXCEEDED`: Maximum participants exceeded

**Template Errors:**
- `TEMPLATE_NOT_FOUND`: Process template not found
- `TEMPLATE_INSTANTIATION_FAILED`: Failed to create model from template
- `TEMPLATE_VARIABLE_INVALID`: Invalid template variable values
- `TEMPLATE_ACCESS_DENIED`: User not authorized to access template

**AI Errors:**
- `AI_SERVICE_UNAVAILABLE`: AI assistance service temporarily unavailable
- `AI_GENERATION_FAILED`: Failed to generate AI suggestions or completions
- `AI_CONTEXT_INVALID`: Invalid context provided for AI operations
- `AI_CONFIDENCE_LOW`: AI confidence below acceptable threshold

**Validation Errors:**
- `VALIDATION_SYNTAX_ERROR`: BPMN syntax validation failed
- `VALIDATION_SEMANTIC_ERROR`: BPMN semantic validation failed
- `PERFORMANCE_ANALYSIS_FAILED`: Performance analysis could not be completed
- `COMPLIANCE_CHECK_FAILED`: Compliance checking failed

---

## Rate Limits

- **Standard endpoints**: 300 requests per minute per user
- **AI assistance endpoints**: 50 requests per minute per user
- **Collaboration endpoints**: 100 requests per minute per session
- **Validation endpoints**: 100 requests per minute per user

Rate limits are enforced per user/session and reset every minute. Exceeding limits returns a 429 status code with retry-after header.

---

## WebSocket Integration

### Real-time Collaboration
For real-time collaboration features, the service provides WebSocket connections:

**Connection URL:**
```
wss://api.dadms.com/bpmn-workspace/collaboration/{sessionId}
```

**Message Types:**
- `participant_joined`: New participant joined session
- `participant_left`: Participant left session
- `model_changed`: Real-time model change notification
- `cursor_moved`: Participant cursor position update
- `comment_added`: New comment added to model element

**Example WebSocket Messages:**
```json
{
  "type": "model_changed",
  "session_id": "session-123",
  "change": {
    "id": "change-789",
    "user_id": "user-456",
    "change_type": "modify",
    "element_id": "gateway-decision",
    "timestamp": "2024-01-15T21:30:00Z"
  }
}
```

---

## Usage Examples

### Complete Workflow: Creating and Deploying a Process Model

```bash
# 1. Create a new process model from template
curl -X POST http://localhost:3021/api/templates/template-123/instantiate \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Invoice Approval Process",
    "description": "Automated invoice approval with compliance checks",
    "project_id": "proj-456",
    "variable_values": {
      "approval_threshold_1": 1000,
      "approval_threshold_2": 10000,
      "approver_roles": ["manager", "director"]
    }
  }'

# 2. Get AI suggestions for improvement
curl -X POST http://localhost:3021/api/ai/suggestions \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "model-456",
    "bpmn_xml": "<?xml version=\"1.0\"...>",
    "context": {
      "user_intent": "improve compliance and add error handling"
    }
  }'

# 3. Validate the model
curl -X POST http://localhost:3021/api/validation/syntax \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bpmn_xml": "<?xml version=\"1.0\"...>",
    "validation_level": "comprehensive"
  }'

# 4. Check compliance
curl -X POST http://localhost:3021/api/validation/compliance \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bpmn_xml": "<?xml version=\"1.0\"...>",
    "compliance_standards": ["sox", "company_policy"]
  }'

# 5. Deploy to production
curl -X POST http://localhost:3021/api/models/model-456/deploy \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "production",
    "configuration": {
      "process_engine": "camunda",
      "auto_start": false
    }
  }'
```

This comprehensive API enables sophisticated BPMN process modeling with AI assistance, real-time collaboration, comprehensive validation, and seamless deployment capabilities for the DADMS platform. 