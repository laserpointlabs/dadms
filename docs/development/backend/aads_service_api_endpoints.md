# Agent Assistance & Documentation Service (AADS) – API Endpoint Specification

This document details the API endpoints for the Agent Assistance & Documentation Service (AADS) in DADMS 2.0, which enables users to finalize decisions with AI assistance, generate formal documentation, and route decisions through approval workflows.

---

## Service Overview

**Purpose**: Post-process tool for decision finalization with AI assistance, team collaboration, white paper generation, and BPMN-managed approval workflows
**Port**: 3005
**Key Features**: Decision review, team collaboration, AI-assisted white paper generation, approval workflow integration

---

## Core Workflow

The AADS service supports a four-step decision finalization workflow:

1. **Decision Review**: Summary of process outcome, context, and supporting data
2. **Assistant/Team Collaboration**: Real-time chat with AI assistant and team members for feedback and risk identification
3. **White Paper/Documentation Generation**: Structured document creation with AI assistance and rich text editing
4. **Approval Submission**: BPMN workflow integration with multi-step approval processes and status tracking

---

## Endpoints Summary

### Decision Review
| Method | Path                        | Description                           | Request Body / Params         | Response Body                | Auth? |
|--------|-----------------------------|---------------------------------------|-------------------------------|------------------------------|-------|
| GET    | `/decisions`                | List decision reviews                 | Query parameters              | Array of DecisionReview      | Yes   |
| POST   | `/decisions`                | Create decision review                | DecisionReviewRequest (JSON)  | DecisionReview               | Yes   |
| GET    | `/decisions/{id}`           | Get decision review details           | Path: id                      | DecisionReview               | Yes   |
| PUT    | `/decisions/{id}`           | Update decision review                | DecisionReviewUpdate (JSON)   | DecisionReview               | Yes   |

### Collaboration
| Method | Path                              | Description                           | Request Body / Params         | Response Body                | Auth? |
|--------|-----------------------------------|---------------------------------------|-------------------------------|------------------------------|-------|
| GET    | `/decisions/{id}/messages`       | Get collaboration messages            | Path: id, Query: pagination   | Array of CollaborationMessage| Yes   |
| POST   | `/decisions/{id}/messages`       | Add collaboration message             | CollaborationRequest (JSON)   | CollaborationMessage         | Yes   |
| POST   | `/decisions/{id}/ai-assistant`   | Interact with AI assistant            | AIAssistantRequest (JSON)     | AIAssistantResponse          | Yes   |

### White Paper
| Method | Path                                   | Description                           | Request Body / Params         | Response Body                | Auth? |
|--------|----------------------------------------|---------------------------------------|-------------------------------|------------------------------|-------|
| GET    | `/decisions/{id}/whitepaper`           | Get white paper                       | Path: id                      | WhitePaper                   | Yes   |
| POST   | `/decisions/{id}/whitepaper`           | Create white paper                    | WhitePaperRequest (JSON)      | WhitePaper                   | Yes   |
| PUT    | `/decisions/{id}/whitepaper`           | Update white paper                    | WhitePaperUpdate (JSON)       | WhitePaper                   | Yes   |
| POST   | `/decisions/{id}/whitepaper/generate`  | Generate AI content for section       | GenerationRequest (JSON)      | GeneratedContent             | Yes   |
| GET    | `/decisions/{id}/whitepaper/export`    | Export white paper                    | Query: format                 | File (binary/text)           | Yes   |

### Approval
| Method | Path                           | Description                           | Request Body / Params         | Response Body                | Auth? |
|--------|--------------------------------|---------------------------------------|-------------------------------|------------------------------|-------|
| POST   | `/decisions/{id}/approval`     | Submit for approval                   | ApprovalRequest (JSON)        | ApprovalSubmission           | Yes   |
| GET    | `/decisions/{id}/approval`     | Get approval status                   | Path: id                      | ApprovalSubmission           | Yes   |
| POST   | `/approvals/{id}/respond`      | Respond to approval request           | ApprovalResponse (JSON)       | SuccessResponse              | Yes   |

### Health
| Method | Path       | Description                | Request Body / Params         | Response Body                | Auth? |
|--------|------------|----------------------------|-------------------------------|------------------------------|-------|
| GET    | `/health`  | Service health/readiness check              | None                          | HealthStatus (JSON)          | No    |

---

## Detailed Endpoint Specifications

### 1. List Decision Reviews

**GET** `/decisions`

Returns a list of decision reviews for the authenticated user.

#### Query Parameters
- `project_id` (optional): Filter by project ID
- `status` (optional): Filter by status (draft, under_review, ready_for_approval, approved, rejected)
- `limit` (optional): Number of results to return (default: 20)
- `offset` (optional): Number of results to skip (default: 0)

#### Response
```json
{
  "decisions": [
    {
      "id": "decision-123",
      "process_id": "process-abc",
      "project_id": "project-456",
      "title": "UAV Acquisition Decision",
      "summary": "Decision to acquire 5 UAVs for reconnaissance operations",
      "outcome": "Approved acquisition of 5 MQ-9 Reaper UAVs",
      "status": "under_review",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T14:30:00Z",
      "participants": [
        {
          "user_id": "user-789",
          "name": "Col. Smith",
          "role": "Decision Authority",
          "contribution": "Final approval authority"
        }
      ],
      "key_findings": [
        "Current UAV fleet is 60% operational",
        "Mission requirements exceed current capacity"
      ],
      "risks": [
        {
          "id": "risk-1",
          "description": "Budget overrun due to maintenance costs",
          "impact": "medium",
          "likelihood": "high",
          "mitigation": "Negotiate comprehensive maintenance contract"
        }
      ],
      "recommendations": [
        "Proceed with acquisition",
        "Negotiate extended warranty terms"
      ]
    }
  ],
  "total": 25,
  "limit": 20,
  "offset": 0
}
```

### 2. Create Decision Review

**POST** `/decisions`

Creates a new decision review from a completed process.

#### Request Body
```json
{
  "process_id": "process-abc123",
  "project_id": "project-456",
  "title": "UAV Acquisition Decision",
  "summary": "Decision to acquire 5 UAVs for reconnaissance operations"
}
```

#### Response
```json
{
  "id": "decision-123",
  "process_id": "process-abc123",
  "project_id": "project-456",
  "title": "UAV Acquisition Decision",
  "summary": "Decision to acquire 5 UAVs for reconnaissance operations",
  "outcome": null,
  "context": {
    "process_duration": 7200,
    "tasks_completed": 8,
    "participants": 3
  },
  "status": "draft",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

### 3. Get Collaboration Messages

**GET** `/decisions/{decision_id}/messages`

Retrieves collaboration messages for a decision review.

#### Query Parameters
- `limit` (optional): Number of messages to return (default: 50)
- `offset` (optional): Number of messages to skip (default: 0)

#### Response
```json
{
  "messages": [
    {
      "id": "msg-123",
      "decision_review_id": "decision-123",
      "author_id": "user-789",
      "author_name": "Col. Smith",
      "message": "We need to consider the long-term maintenance costs for these UAVs.",
      "message_type": "comment",
      "parent_id": null,
      "created_at": "2024-01-15T11:00:00Z",
      "attachments": []
    },
    {
      "id": "msg-124",
      "decision_review_id": "decision-123",
      "author_id": "ai-assistant",
      "author_name": "AI Assistant",
      "message": "Based on historical data, MQ-9 maintenance costs average $3.2M annually per unit. I recommend including a 15% buffer in the budget calculation.",
      "message_type": "ai_response",
      "parent_id": "msg-123",
      "created_at": "2024-01-15T11:02:00Z",
      "attachments": []
    }
  ],
  "total": 12
}
```

### 4. Add Collaboration Message

**POST** `/decisions/{decision_id}/messages`

Adds a message to the collaboration thread.

#### Request Body
```json
{
  "message": "I agree with the maintenance cost analysis. Let's include the budget buffer.",
  "message_type": "comment",
  "parent_id": "msg-124"
}
```

#### Response
```json
{
  "id": "msg-125",
  "decision_review_id": "decision-123",
  "author_id": "user-456",
  "author_name": "Maj. Johnson",
  "message": "I agree with the maintenance cost analysis. Let's include the budget buffer.",
  "message_type": "comment",
  "parent_id": "msg-124",
  "created_at": "2024-01-15T11:05:00Z",
  "attachments": []
}
```

### 5. AI Assistant Interaction

**POST** `/decisions/{decision_id}/ai-assistant`

Get AI assistance for decision review, white paper generation, or risk analysis.

#### Request Body
```json
{
  "prompt": "Analyze the risks associated with this UAV acquisition decision and suggest mitigation strategies",
  "context_type": "decision_review",
  "include_process_context": true,
  "include_project_context": true
}
```

#### Response
```json
{
  "response": "Based on the decision context, I've identified several key risks: 1) Budget risk due to maintenance costs, 2) Operational risk from training requirements, 3) Technical risk from integration challenges. Here are my recommended mitigation strategies...",
  "suggestions": [
    "Conduct pilot program with 2 UAVs first",
    "Negotiate maintenance training package",
    "Establish integration testing timeline"
  ],
  "confidence": 0.85,
  "sources": [
    "Historical UAV acquisition data",
    "Process context: cost analysis task",
    "Project documentation: requirements analysis"
  ]
}
```

### 6. Create White Paper

**POST** `/decisions/{decision_id}/whitepaper`

Creates a white paper for the decision review.

#### Request Body
```json
{
  "title": "UAV Acquisition Decision White Paper",
  "template_id": "defense-acquisition-template",
  "sections": [
    {
      "name": "Executive Summary",
      "content": "",
      "order": 1
    },
    {
      "name": "Context and Background",
      "content": "",
      "order": 2
    },
    {
      "name": "Analysis and Alternatives",
      "content": "",
      "order": 3
    },
    {
      "name": "Recommendation",
      "content": "",
      "order": 4
    }
  ]
}
```

#### Response
```json
{
  "id": "wp-123",
  "decision_review_id": "decision-123",
  "title": "UAV Acquisition Decision White Paper",
  "content": "",
  "sections": [
    {
      "id": "section-1",
      "name": "Executive Summary",
      "content": "",
      "order": 1,
      "ai_generated": false
    }
  ],
  "template_id": "defense-acquisition-template",
  "version": 1,
  "status": "draft",
  "created_at": "2024-01-15T12:00:00Z",
  "updated_at": "2024-01-15T12:00:00Z",
  "created_by": "user-456"
}
```

### 7. Generate White Paper Content

**POST** `/decisions/{decision_id}/whitepaper/generate`

Uses AI to generate content for a white paper section.

#### Request Body
```json
{
  "section_id": "section-1",
  "prompt": "Generate an executive summary for the UAV acquisition decision based on the process context and analysis results",
  "include_context": true,
  "generation_type": "summary"
}
```

#### Response
```json
{
  "content": "## Executive Summary\n\nThis white paper presents the analysis and recommendation for acquiring five MQ-9 Reaper unmanned aerial vehicles (UAVs) to enhance reconnaissance capabilities. Based on comprehensive operational assessment and cost-benefit analysis, the acquisition is recommended with an estimated total cost of $87.5M including maintenance contracts...",
  "section_id": "section-1"
}
```

### 8. Export White Paper

**GET** `/decisions/{decision_id}/whitepaper/export`

Exports the white paper in various formats.

#### Query Parameters
- `format` (optional): Export format (pdf, docx, html, markdown) - default: pdf

#### Response
- **PDF**: Binary PDF file
- **DOCX**: Binary Word document
- **HTML**: HTML content
- **Markdown**: Markdown text

### 9. Submit for Approval

**POST** `/decisions/{decision_id}/approval`

Submits the decision review for approval workflow.

#### Request Body
```json
{
  "approval_type": "multi_approver",
  "approvers": [
    {
      "user_id": "user-789",
      "required": true
    },
    {
      "user_id": "user-012",
      "required": true
    }
  ],
  "comments": "Decision ready for final approval. All analysis complete.",
  "deadline": "2024-01-20T17:00:00Z"
}
```

#### Response
```json
{
  "id": "approval-456",
  "decision_review_id": "decision-123",
  "white_paper_id": "wp-123",
  "workflow_id": "workflow-789",
  "submitted_by": "user-456",
  "submitted_at": "2024-01-15T15:00:00Z",
  "approval_type": "multi_approver",
  "status": "submitted",
  "approvers": [
    {
      "user_id": "user-789",
      "name": "Col. Smith",
      "role": "Decision Authority",
      "required": true,
      "status": "pending",
      "approved_at": null,
      "comments": null
    },
    {
      "user_id": "user-012",
      "name": "Gen. Williams",
      "role": "Senior Decision Authority",
      "required": true,
      "status": "pending",
      "approved_at": null,
      "comments": null
    }
  ],
  "comments": "Decision ready for final approval. All analysis complete."
}
```

### 10. Respond to Approval Request

**POST** `/approvals/{approval_id}/respond`

Approves or rejects an approval request.

#### Request Body
```json
{
  "decision": "approve",
  "comments": "Approval granted with minor modifications to maintenance contract terms."
}
```

#### Response
```json
{
  "success": true,
  "message": "Approval response recorded successfully",
  "data": {
    "approval_id": "approval-456",
    "decision": "approve",
    "responded_at": "2024-01-15T16:00:00Z"
  }
}
```

---

## Data Models

### DecisionReview
```json
{
  "id": "string",
  "process_id": "string",
  "project_id": "string",
  "title": "string",
  "summary": "string",
  "outcome": "string",
  "context": {},
  "participants": [
    {
      "user_id": "string",
      "name": "string",
      "role": "string",
      "contribution": "string"
    }
  ],
  "key_findings": ["string"],
  "risks": [
    {
      "id": "string",
      "description": "string",
      "impact": "low|medium|high|critical",
      "likelihood": "low|medium|high",
      "mitigation": "string"
    }
  ],
  "recommendations": ["string"],
  "status": "draft|under_review|ready_for_approval|approved|rejected",
  "created_at": "ISO8601 timestamp",
  "updated_at": "ISO8601 timestamp"
}
```

### WhitePaper
```json
{
  "id": "string",
  "decision_review_id": "string",
  "title": "string",
  "content": "string",
  "sections": [
    {
      "id": "string",
      "name": "string",
      "content": "string",
      "order": "integer",
      "ai_generated": "boolean"
    }
  ],
  "template_id": "string",
  "version": "integer",
  "status": "draft|review|final",
  "created_at": "ISO8601 timestamp",
  "updated_at": "ISO8601 timestamp",
  "created_by": "string"
}
```

### ApprovalSubmission
```json
{
  "id": "string",
  "decision_review_id": "string",
  "white_paper_id": "string",
  "workflow_id": "string",
  "submitted_by": "string",
  "submitted_at": "ISO8601 timestamp",
  "approval_type": "single_approver|multi_approver|committee",
  "status": "submitted|pending|approved|rejected|cancelled",
  "approvers": [
    {
      "user_id": "string",
      "name": "string",
      "role": "string",
      "required": "boolean",
      "status": "pending|approved|rejected",
      "approved_at": "ISO8601 timestamp",
      "comments": "string"
    }
  ],
  "comments": "string"
}
```

---

## Integration Points

### BPMN Process Integration
- Decision reviews are created from completed BPMN process instances
- Process context (variables, tasks, outcomes) is automatically extracted
- Approval workflows are managed by the BPMN engine (Camunda)

### LLM Service Integration
- AI assistant interactions use the LLM Service for natural language processing
- White paper generation leverages LLM capabilities for content creation
- Context injection includes process data, project information, and historical decisions

### Knowledge Service Integration
- Background knowledge and documents are accessible during decision review
- Generated white papers are stored in the knowledge base for future reference
- Similarity analysis helps identify related decisions and precedents

### Event Bus Integration
- Decision lifecycle events are published for system-wide awareness
- Approval status changes trigger notifications to relevant stakeholders
- Audit trail events are captured for compliance and governance

---

## Error Handling

All endpoints use standardized error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Required field 'title' is missing",
    "details": "Field validation failed for decision review creation"
  }
}
```

Common error codes:
- `VALIDATION_ERROR`: Request validation failed
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `PROCESS_NOT_FOUND`: Referenced process instance not found
- `APPROVAL_WORKFLOW_ERROR`: BPMN workflow error

---

## Authentication & Authorization

- All endpoints require JWT authentication except `/health`
- Users can only access decision reviews they created or are participants in
- Approval permissions are validated against user roles and workflow definitions
- AI assistant interactions are logged for audit purposes

---

## Performance Considerations

- Decision review listings are paginated for large datasets
- White paper exports are cached for frequently accessed documents
- AI assistant responses include confidence scoring for quality assessment
- Approval workflows support asynchronous processing for complex multi-step approvals

---

**This document serves as the reference for AADS API design and implementation, supporting the complete decision finalization workflow from review to formal approval.** 