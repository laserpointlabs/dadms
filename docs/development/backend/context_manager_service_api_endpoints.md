# Context Manager Service API Endpoints

## Overview

The Context Manager Service provides comprehensive management of AI interaction contexts including personas, teams, tools, and prompt templates. It serves as the central hub for AI context governance with testing, approval workflows, and dynamic context assembly capabilities.

## Base URL
```
http://localhost:3020
```

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Personas

### List Personas
**GET** `/api/personas`

Returns a list of personas with optional filtering capabilities.

**Query Parameters:**
- `tags` (array, optional): Filter by tags
- `role` (string, optional): Filter by role
- `approval_status` (string, optional): Filter by approval status (draft, pending, approved, deprecated)
- `limit` (integer, optional): Number of personas to return (default: 20)
- `offset` (integer, optional): Number of personas to skip (default: 0)

**Response:**
```json
{
  "personas": [
    {
      "id": "persona-123",
      "name": "Risk Analyst",
      "role": "Analyst",
      "expertise": ["Risk Assessment", "Financial Analysis"],
      "guidelines": "Be thorough and cautious in all analyses",
      "system_prompt": "You are an expert risk analyst with 20 years of experience",
      "tags": ["finance", "analysis", "risk"],
      "tool_ids": ["tool-calc", "tool-api"],
      "model_preferences": [
        {
          "provider": "openai",
          "model_id": "gpt-4",
          "priority": 1,
          "parameters": {
            "temperature": 0.3,
            "max_tokens": 1000
          }
        }
      ],
      "parameters": {
        "temperature": 0.3,
        "max_tokens": 1000,
        "top_p": 0.9
      },
      "approval_status": "approved",
      "created_by": "user-456",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z",
      "version": 1
    }
  ],
  "total": 50,
  "limit": 20,
  "offset": 0
}
```

### Create Persona
**POST** `/api/personas`

Create a new persona with specific role and capabilities.

**Request Body:**
```json
{
  "name": "Security Expert",
  "role": "Security Analyst",
  "expertise": ["Cybersecurity", "Risk Assessment", "Compliance"],
  "guidelines": "Focus on security implications and regulatory compliance in all recommendations",
  "system_prompt": "You are a cybersecurity expert with extensive experience in threat analysis and risk mitigation",
  "tags": ["security", "compliance", "risk"],
  "tool_ids": ["security-scanner", "compliance-checker"],
  "model_preferences": [
    {
      "provider": "openai",
      "model_id": "gpt-4",
      "priority": 1,
      "parameters": {
        "temperature": 0.2,
        "max_tokens": 1500
      }
    }
  ],
  "parameters": {
    "temperature": 0.2,
    "max_tokens": 1500,
    "top_p": 0.8
  }
}
```

**Response:**
```json
{
  "id": "persona-789",
  "name": "Security Expert",
  "role": "Security Analyst",
  "expertise": ["Cybersecurity", "Risk Assessment", "Compliance"],
  "guidelines": "Focus on security implications and regulatory compliance in all recommendations",
  "system_prompt": "You are a cybersecurity expert with extensive experience in threat analysis and risk mitigation",
  "tags": ["security", "compliance", "risk"],
  "tool_ids": ["security-scanner", "compliance-checker"],
  "model_preferences": [
    {
      "provider": "openai",
      "model_id": "gpt-4",
      "priority": 1,
      "parameters": {
        "temperature": 0.2,
        "max_tokens": 1500
      }
    }
  ],
  "parameters": {
    "temperature": 0.2,
    "max_tokens": 1500,
    "top_p": 0.8
  },
  "approval_status": "draft",
  "created_by": "user-456",
  "created_at": "2024-01-15T11:00:00Z",
  "updated_at": "2024-01-15T11:00:00Z",
  "version": 1
}
```

### Get Persona Details
**GET** `/api/personas/{personaId}`

Returns detailed information about a specific persona.

**Response:**
```json
{
  "id": "persona-123",
  "name": "Risk Analyst",
  "role": "Analyst",
  "expertise": ["Risk Assessment", "Financial Analysis"],
  "guidelines": "Be thorough and cautious in all analyses",
  "system_prompt": "You are an expert risk analyst with 20 years of experience in financial markets and risk assessment. Always provide comprehensive analysis with clear recommendations.",
  "tags": ["finance", "analysis", "risk"],
  "tool_ids": ["financial-calculator", "market-data-api"],
  "model_preferences": [
    {
      "provider": "openai",
      "model_id": "gpt-4",
      "priority": 1,
      "parameters": {
        "temperature": 0.3,
        "max_tokens": 1000
      }
    },
    {
      "provider": "anthropic",
      "model_id": "claude-3-opus",
      "priority": 2,
      "parameters": {
        "temperature": 0.3,
        "max_tokens": 1000
      }
    }
  ],
  "parameters": {
    "temperature": 0.3,
    "max_tokens": 1000,
    "top_p": 0.9
  },
  "approval_status": "approved",
  "created_by": "user-456",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z",
  "version": 1
}
```

### Approve Persona
**POST** `/api/personas/{personaId}/approve`

Approve a persona for production use.

**Request Body:**
```json
{
  "comments": "Persona thoroughly reviewed and meets all requirements for production deployment",
  "approved": true
}
```

**Response:**
```json
{
  "id": "persona-123",
  "name": "Risk Analyst",
  "approval_status": "approved",
  "approved_by": "admin-user",
  "approved_at": "2024-01-15T12:00:00Z",
  "approval_comments": "Persona thoroughly reviewed and meets all requirements for production deployment"
}
```

---

## Teams

### List Teams
**GET** `/api/teams`

Returns a list of teams with filtering capabilities.

**Query Parameters:**
- `approval_status` (string, optional): Filter by approval status
- `decision_type` (string, optional): Filter by decision type
- `limit` (integer, optional): Number of teams to return (default: 20)
- `offset` (integer, optional): Number of teams to skip (default: 0)

**Response:**
```json
{
  "teams": [
    {
      "id": "team-123",
      "name": "AI Experts",
      "description": "Team of AI and ML specialists for complex technical decisions",
      "persona_ids": ["persona-1", "persona-2", "persona-3"],
      "uses_moderator": true,
      "moderator_id": "persona-mod",
      "decision_type": "moderator",
      "collaboration_rules": [
        {
          "trigger": "disagreement",
          "action": "escalate_to_moderator",
          "parameters": {
            "threshold": 0.7,
            "timeout": 300
          }
        }
      ],
      "approval_status": "approved",
      "created_by": "user-456",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 25,
  "limit": 20,
  "offset": 0
}
```

### Create Team
**POST** `/api/teams`

Create a new team with specific personas and decision protocols.

**Request Body:**
```json
{
  "name": "Security Assessment Team",
  "description": "Specialized team for comprehensive security assessments",
  "persona_ids": ["security-expert", "risk-analyst", "compliance-officer"],
  "uses_moderator": true,
  "moderator_id": "senior-security-advisor",
  "decision_type": "moderator",
  "collaboration_rules": [
    {
      "trigger": "consensus_timeout",
      "action": "moderator_decision",
      "parameters": {
        "timeout": 600
      }
    },
    {
      "trigger": "high_risk_scenario",
      "action": "require_unanimous",
      "parameters": {
        "risk_threshold": 0.8
      }
    }
  ]
}
```

### Execute Team Prompt
**POST** `/api/teams/{teamId}/execute`

Execute a prompt using the specified team with collaborative decision-making.

**Request Body:**
```json
{
  "prompt_id": "security-assessment-prompt",
  "context": {
    "system": "Customer database with 1M+ records",
    "vulnerability": "Potential SQL injection in user input form",
    "business_impact": "Critical - customer data exposure risk",
    "timeline": "Fix required within 48 hours"
  },
  "execution_parameters": {
    "temperature": 0.2,
    "max_tokens": 2000
  }
}
```

**Response:**
```json
{
  "execution_id": "exec-789",
  "team_id": "security-team-123",
  "prompt_id": "security-assessment-prompt",
  "persona_responses": [
    {
      "persona_id": "security-expert",
      "response": "Immediate mitigation: Deploy WAF rules to block SQL injection attempts. Long-term: Implement parameterized queries and input validation.",
      "confidence": 0.95,
      "reasoning": "This is a standard SQL injection vulnerability with well-established mitigation strategies",
      "tool_calls": [
        {
          "tool_id": "vulnerability-scanner",
          "input": {
            "target": "user-input-form",
            "scan_type": "sql_injection"
          },
          "output": {
            "vulnerability_confirmed": true,
            "severity": "critical",
            "exploit_vector": "user_search_field"
          },
          "execution_time": 2.3
        }
      ]
    },
    {
      "persona_id": "risk-analyst",
      "response": "Risk assessment: CVSS score 9.1 (Critical). Potential for full database compromise. Recommend immediate emergency response protocol.",
      "confidence": 0.92,
      "reasoning": "Database exposure represents maximum business impact with high likelihood of exploitation"
    },
    {
      "persona_id": "compliance-officer",
      "response": "Regulatory implications: GDPR Article 33 requires breach notification within 72 hours if exploited. Recommend legal team notification.",
      "confidence": 0.88,
      "reasoning": "Customer data exposure triggers mandatory regulatory reporting requirements"
    }
  ],
  "final_decision": "CRITICAL PRIORITY: Implement immediate WAF protection, deploy emergency patch within 12 hours, activate incident response team, and prepare regulatory notifications. Estimated remediation cost: $15,000. Business risk if unpatched: $2.5M+ in potential fines and damages.",
  "decision_method": "moderator",
  "execution_time": 8.7,
  "created_at": "2024-01-15T14:30:00Z"
}
```

---

## Tools

### List Tools
**GET** `/api/tools`

Returns a list of available tools with filtering capabilities.

**Query Parameters:**
- `category` (string, optional): Filter by category
- `tags` (array, optional): Filter by tags
- `availability_status` (string, optional): Filter by availability status
- `limit` (integer, optional): Number of tools to return (default: 20)
- `offset` (integer, optional): Number of tools to skip (default: 0)

**Response:**
```json
{
  "tools": [
    {
      "id": "financial-calculator",
      "name": "Financial Calculator API",
      "description": "Advanced financial calculations including NPV, IRR, and risk metrics",
      "category": "finance",
      "api_spec": "OpenAPI 3.0",
      "endpoint": "https://api.fintech.com/calculator",
      "authentication": {
        "type": "api_key",
        "config": {
          "header": "X-API-Key",
          "location": "header"
        }
      },
      "parameters": [
        {
          "name": "calculation_type",
          "type": "string",
          "description": "Type of financial calculation to perform",
          "required": true,
          "validation_rules": [
            {
              "type": "enum",
              "value": ["npv", "irr", "payback_period", "roi"]
            }
          ]
        },
        {
          "name": "cash_flows",
          "type": "array",
          "description": "Array of cash flow values",
          "required": true
        },
        {
          "name": "discount_rate",
          "type": "number",
          "description": "Discount rate as decimal (e.g., 0.1 for 10%)",
          "required": false,
          "default_value": 0.1
        }
      ],
      "tags": ["finance", "calculation", "analysis"],
      "availability_status": "active",
      "rate_limits": [
        {
          "requests": 100,
          "window": "per_minute",
          "burst_limit": 10
        }
      ],
      "cost_per_call": 0.02,
      "created_by": "user-456",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 75,
  "limit": 20,
  "offset": 0
}
```

### Register Tool
**POST** `/api/tools`

Register a new tool for use in personas and prompts.

**Request Body:**
```json
{
  "name": "Market Data API",
  "description": "Real-time and historical market data for financial analysis",
  "category": "data",
  "api_spec": "OpenAPI 3.0",
  "endpoint": "https://api.marketdata.com/v1",
  "authentication": {
    "type": "bearer",
    "config": {
      "token_endpoint": "https://api.marketdata.com/auth"
    }
  },
  "parameters": [
    {
      "name": "symbol",
      "type": "string",
      "description": "Stock symbol to retrieve data for",
      "required": true,
      "validation_rules": [
        {
          "type": "regex",
          "value": "^[A-Z]{1,5}$"
        }
      ]
    },
    {
      "name": "timeframe",
      "type": "string",
      "description": "Data timeframe",
      "required": false,
      "default_value": "1d",
      "validation_rules": [
        {
          "type": "enum",
          "value": ["1m", "5m", "15m", "1h", "1d", "1w", "1M"]
        }
      ]
    }
  ],
  "tags": ["market", "data", "finance", "real-time"],
  "rate_limits": [
    {
      "requests": 500,
      "window": "per_minute"
    }
  ],
  "cost_per_call": 0.001
}
```

### Test Tool
**POST** `/api/tools/{toolId}/test`

Test a tool with provided parameters to verify functionality.

**Request Body:**
```json
{
  "parameters": {
    "calculation_type": "npv",
    "cash_flows": [-1000, 300, 400, 300, 200],
    "discount_rate": 0.1
  }
}
```

**Response:**
```json
{
  "tool_id": "financial-calculator",
  "success": true,
  "result": {
    "npv": 23.43,
    "calculation_details": {
      "initial_investment": -1000,
      "present_value_inflows": 1023.43,
      "discount_rate": 0.1
    }
  },
  "execution_time": 0.8,
  "error_message": null,
  "timestamp": "2024-01-15T15:00:00Z"
}
```

---

## Prompt Templates

### List Prompt Templates
**GET** `/api/prompts`

Returns a list of prompt templates with filtering capabilities.

**Query Parameters:**
- `tags` (array, optional): Filter by tags
- `approval_status` (string, optional): Filter by approval status
- `persona_id` (string, optional): Filter by persona
- `team_id` (string, optional): Filter by team
- `limit` (integer, optional): Number of prompts to return (default: 20)
- `offset` (integer, optional): Number of prompts to skip (default: 0)

**Response:**
```json
{
  "prompts": [
    {
      "id": "risk-assessment-template",
      "name": "Security Risk Assessment",
      "description": "Comprehensive template for evaluating security risks in systems and processes",
      "template": "Conduct a security risk assessment for {{system}} considering the following factors: {{threat_vectors}}, {{asset_value}}, and {{existing_controls}}. Provide a detailed analysis including:\n\n1. Threat Identification\n2. Vulnerability Assessment\n3. Risk Calculation (Probability × Impact)\n4. Mitigation Recommendations\n5. Implementation Timeline\n\nConsider regulatory requirements: {{compliance_frameworks}}",
      "variables": [
        {
          "name": "system",
          "type": "string",
          "description": "The system or process being assessed",
          "required": true
        },
        {
          "name": "threat_vectors",
          "type": "array",
          "description": "Potential threat vectors to consider",
          "required": true
        },
        {
          "name": "asset_value",
          "type": "string",
          "description": "Business value of the asset being protected",
          "required": true
        },
        {
          "name": "existing_controls",
          "type": "array",
          "description": "Current security controls in place",
          "required": false
        },
        {
          "name": "compliance_frameworks",
          "type": "array",
          "description": "Applicable compliance frameworks",
          "required": false,
          "default_value": ["ISO 27001", "NIST"]
        }
      ],
      "persona_id": "security-expert",
      "team_id": null,
      "tool_ids": ["vulnerability-scanner", "compliance-checker"],
      "tags": ["security", "risk", "assessment", "compliance"],
      "test_cases": [
        {
          "id": "test-case-1",
          "name": "Web Application Assessment",
          "input_context": {
            "system": "Customer portal web application",
            "threat_vectors": ["SQL injection", "XSS", "CSRF", "Authentication bypass"],
            "asset_value": "High - contains customer PII and financial data",
            "existing_controls": ["WAF", "Input validation", "Session management"],
            "compliance_frameworks": ["PCI DSS", "GDPR"]
          },
          "expected_output": "Comprehensive risk assessment with threat analysis and mitigation strategies",
          "success_criteria": [
            {
              "type": "contains",
              "value": ["threat", "vulnerability", "risk", "mitigation"],
              "weight": 0.8
            },
            {
              "type": "length",
              "value": 1000,
              "weight": 0.2
            }
          ]
        }
      ],
      "approval_status": "approved",
      "version": 2,
      "parent_id": "risk-assessment-v1",
      "created_by": "user-456",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-16T14:30:00Z",
      "last_tested": "2024-01-16T12:00:00Z",
      "test_results": {
        "total_tests": 10,
        "passed_tests": 9,
        "success_rate": 0.9,
        "average_score": 0.87,
        "detailed_results": [
          {
            "test_case_id": "test-case-1",
            "passed": true,
            "score": 0.92,
            "output": "The security risk assessment reveals several critical vulnerabilities...",
            "criteria_scores": {
              "contains": 0.95,
              "length": 0.88
            }
          }
        ]
      }
    }
  ],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

### Create Prompt Template
**POST** `/api/prompts`

Create a new prompt template with variables and test cases.

**Request Body:**
```json
{
  "name": "Investment Analysis Template",
  "description": "Comprehensive template for analyzing investment opportunities",
  "template": "Analyze the investment opportunity in {{company}} with the following details:\n\nFinancial Data: {{financial_metrics}}\nMarket Position: {{market_analysis}}\nRisk Factors: {{risk_factors}}\n\nProvide analysis covering:\n1. Financial Performance Assessment\n2. Market Opportunity Evaluation\n3. Risk-Return Analysis\n4. Investment Recommendation with rationale\n5. Key Performance Indicators to monitor\n\nConsider investment criteria: {{investment_criteria}}",
  "variables": [
    {
      "name": "company",
      "type": "string",
      "description": "Company name being analyzed",
      "required": true
    },
    {
      "name": "financial_metrics",
      "type": "object",
      "description": "Key financial metrics and ratios",
      "required": true
    },
    {
      "name": "market_analysis",
      "type": "string",
      "description": "Market position and competitive landscape",
      "required": true
    },
    {
      "name": "risk_factors",
      "type": "array",
      "description": "Identified risk factors",
      "required": true
    },
    {
      "name": "investment_criteria",
      "type": "object",
      "description": "Investment criteria and requirements",
      "required": false,
      "default_value": {
        "min_roi": 0.15,
        "max_risk_score": 7,
        "time_horizon": "5_years"
      }
    }
  ],
  "persona_id": "financial-analyst",
  "tool_ids": ["financial-calculator", "market-data-api"],
  "tags": ["finance", "investment", "analysis", "due-diligence"],
  "test_cases": [
    {
      "name": "Tech Startup Analysis",
      "input_context": {
        "company": "TechCorp Inc.",
        "financial_metrics": {
          "revenue_growth": 0.45,
          "profit_margin": 0.12,
          "debt_ratio": 0.3
        },
        "market_analysis": "Growing market with strong competitive position",
        "risk_factors": ["Market volatility", "Regulatory changes", "Key person dependency"]
      },
      "expected_output": "Detailed investment analysis with clear recommendation",
      "success_criteria": [
        {
          "type": "contains",
          "value": ["recommendation", "financial", "risk", "roi"],
          "weight": 0.7
        },
        {
          "type": "semantic",
          "value": "investment analysis",
          "weight": 0.3
        }
      ]
    }
  ]
}
```

### Test Prompt Template
**POST** `/api/prompts/{promptId}/test`

Run probabilistic tests on a prompt template across multiple models.

**Request Body:**
```json
{
  "models": ["gpt-4", "claude-3-opus", "gpt-3.5-turbo"],
  "test_runs": 5,
  "execution_parameters": {
    "temperature": 0.7,
    "max_tokens": 2000,
    "top_p": 0.9
  }
}
```

**Response:**
```json
{
  "test_id": "test-run-456",
  "prompt_id": "investment-analysis-template",
  "test_results": {
    "total_tests": 15,
    "passed_tests": 13,
    "success_rate": 0.87,
    "average_score": 0.84,
    "detailed_results": [
      {
        "test_case_id": "tech-startup-test",
        "passed": true,
        "score": 0.88,
        "output": "Based on the financial analysis of TechCorp Inc., I recommend proceeding with the investment...",
        "criteria_scores": {
          "contains": 0.92,
          "semantic": 0.84
        }
      }
    ]
  },
  "model_results": [
    {
      "model": "gpt-4",
      "success_rate": 0.95,
      "average_score": 0.91,
      "execution_time": 3.2,
      "cost": 0.18
    },
    {
      "model": "claude-3-opus",
      "success_rate": 0.85,
      "average_score": 0.82,
      "execution_time": 2.8,
      "cost": 0.15
    },
    {
      "model": "gpt-3.5-turbo",
      "success_rate": 0.80,
      "average_score": 0.78,
      "execution_time": 1.9,
      "cost": 0.06
    }
  ],
  "recommendations": [
    "Consider increasing temperature for more creative responses",
    "GPT-4 shows best performance but at higher cost",
    "Add more specific success criteria for better evaluation"
  ],
  "completed_at": "2024-01-15T16:30:00Z"
}
```

---

## Context Assembly

### Assemble Execution Context
**POST** `/api/contexts/assemble`

Assemble a complete execution context from personas, tools, and prompts.

**Request Body:**
```json
{
  "prompt_id": "security-assessment-template",
  "persona_id": "security-expert",
  "tool_ids": ["vulnerability-scanner", "compliance-checker"],
  "context_variables": {
    "system": "Payment processing API",
    "threat_vectors": ["API injection", "Authentication bypass", "Data exposure"],
    "asset_value": "Critical - processes $10M+ daily transactions"
  },
  "execution_parameters": {
    "temperature": 0.2,
    "max_tokens": 2000,
    "top_p": 0.8
  }
}
```

**Response:**
```json
{
  "context_id": "ctx-security-789",
  "prompt": {
    "id": "security-assessment-template",
    "name": "Security Risk Assessment",
    "template": "Conduct a security risk assessment for {{system}} considering..."
  },
  "persona": {
    "id": "security-expert",
    "name": "Security Expert",
    "role": "Security Analyst",
    "system_prompt": "You are a cybersecurity expert with extensive experience..."
  },
  "tools": [
    {
      "id": "vulnerability-scanner",
      "name": "Vulnerability Scanner",
      "description": "Automated security vulnerability detection"
    },
    {
      "id": "compliance-checker",
      "name": "Compliance Checker",
      "description": "Regulatory compliance validation"
    }
  ],
  "assembled_prompt": "You are a cybersecurity expert with extensive experience in threat analysis and risk mitigation. Conduct a security risk assessment for Payment processing API considering the following factors: API injection, Authentication bypass, Data exposure, Critical - processes $10M+ daily transactions, and existing security controls...",
  "context_variables": {
    "system": "Payment processing API",
    "threat_vectors": ["API injection", "Authentication bypass", "Data exposure"],
    "asset_value": "Critical - processes $10M+ daily transactions"
  },
  "execution_parameters": {
    "temperature": 0.2,
    "max_tokens": 2000,
    "top_p": 0.8
  },
  "created_at": "2024-01-15T17:00:00Z",
  "expires_at": "2024-01-15T18:00:00Z"
}
```

### Execute Assembled Context
**POST** `/api/contexts/{contextId}/execute`

Execute a previously assembled context with input variables.

**Request Body:**
```json
{
  "input_variables": {
    "existing_controls": ["API Gateway", "OAuth 2.0", "Rate limiting", "Input validation"],
    "compliance_frameworks": ["PCI DSS", "SOX", "GDPR"]
  },
  "override_parameters": {
    "temperature": 0.1
  }
}
```

**Response:**
```json
{
  "execution_id": "exec-security-456",
  "context_id": "ctx-security-789",
  "response": "## Security Risk Assessment: Payment Processing API\n\n### Executive Summary\nThe payment processing API presents a critical security profile given its high transaction volume ($10M+ daily) and sensitive financial data handling...\n\n### Threat Analysis\n1. **API Injection Attacks**: HIGH RISK\n   - Attack Vector: Malicious payloads in API requests\n   - Potential Impact: Data breach, financial fraud\n   - Current Controls: Input validation (ADEQUATE)\n   \n2. **Authentication Bypass**: MEDIUM RISK\n   - Attack Vector: Token manipulation, session hijacking\n   - Potential Impact: Unauthorized access\n   - Current Controls: OAuth 2.0 (GOOD)\n   \n3. **Data Exposure**: HIGH RISK\n   - Attack Vector: Unencrypted transmission, logging\n   - Potential Impact: PCI DSS violation, customer data breach\n   - Current Controls: API Gateway (NEEDS REVIEW)\n\n### Risk Calculations\n- Overall Risk Score: 7.2/10 (HIGH)\n- Financial Impact: $2.5M+ potential loss\n- Compliance Risk: PCI DSS Level 1 violation risk\n\n### Recommendations\n1. **Immediate (0-30 days)**\n   - Implement end-to-end encryption\n   - Deploy advanced threat protection\n   - Conduct penetration testing\n   \n2. **Short-term (30-90 days)**\n   - Implement zero-trust architecture\n   - Enhanced monitoring and alerting\n   - Security team training\n\n### Compliance Status\n- PCI DSS: 85% compliant (needs encryption upgrades)\n- SOX: 92% compliant (access controls adequate)\n- GDPR: 78% compliant (data retention review needed)",
  "tool_calls": [
    {
      "tool_id": "vulnerability-scanner",
      "input": {
        "target": "payment-api",
        "scan_type": "comprehensive"
      },
      "output": {
        "vulnerabilities_found": 12,
        "critical": 2,
        "high": 4,
        "medium": 6,
        "detailed_report": "api_vuln_report_20240115.json"
      },
      "execution_time": 45.2
    },
    {
      "tool_id": "compliance-checker",
      "input": {
        "frameworks": ["PCI DSS", "SOX", "GDPR"],
        "system": "payment-api"
      },
      "output": {
        "compliance_scores": {
          "PCI_DSS": 0.85,
          "SOX": 0.92,
          "GDPR": 0.78
        },
        "gaps_identified": 23,
        "recommendations": "compliance_gap_analysis_20240115.pdf"
      },
      "execution_time": 12.8
    }
  ],
  "execution_time": 62.7,
  "cost": 0.23,
  "created_at": "2024-01-15T17:15:00Z"
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "PERSONA_NOT_FOUND",
    "message": "The specified persona was not found",
    "details": {
      "persona_id": "invalid-persona-123",
      "suggestion": "Check available personas using GET /api/personas"
    },
    "timestamp": "2024-01-15T18:00:00Z"
  }
}
```

### Common Error Codes

**Persona Errors:**
- `PERSONA_NOT_FOUND`: Persona ID not found
- `PERSONA_APPROVAL_REQUIRED`: Persona requires approval before use
- `PERSONA_TOOL_MISSING`: Referenced tool not available
- `PERSONA_VERSION_CONFLICT`: Version conflict during update

**Team Errors:**
- `TEAM_NOT_FOUND`: Team ID not found
- `TEAM_PERSONA_INVALID`: Referenced persona not available
- `TEAM_MODERATOR_REQUIRED`: Moderator required for decision type
- `TEAM_EXECUTION_FAILED`: Team execution encountered error

**Tool Errors:**
- `TOOL_NOT_FOUND`: Tool ID not found
- `TOOL_UNAVAILABLE`: Tool currently unavailable
- `TOOL_AUTHENTICATION_FAILED`: Tool authentication failed
- `TOOL_RATE_LIMIT_EXCEEDED`: Tool rate limit exceeded
- `TOOL_PARAMETER_INVALID`: Invalid tool parameters

**Prompt Errors:**
- `PROMPT_NOT_FOUND`: Prompt template not found
- `PROMPT_VARIABLE_MISSING`: Required variable not provided
- `PROMPT_TEST_FAILED`: Prompt test execution failed
- `PROMPT_APPROVAL_PENDING`: Prompt pending approval

**Context Errors:**
- `CONTEXT_ASSEMBLY_FAILED`: Context assembly failed
- `CONTEXT_EXPIRED`: Context has expired
- `CONTEXT_EXECUTION_FAILED`: Context execution failed
- `CONTEXT_INVALID_VARIABLES`: Invalid input variables

---

## Rate Limits

- **Standard endpoints**: 200 requests per minute per user
- **Context assembly**: 50 requests per minute per user
- **Testing endpoints**: 30 requests per minute per user
- **Tool testing**: 20 requests per minute per user

Rate limits are enforced per user and reset every minute. Exceeding limits returns a 429 status code with retry-after header.

---

## Usage Examples

### Complete Workflow: Creating and Testing a Persona

```bash
# 1. Create a new persona
curl -X POST http://localhost:3020/api/personas \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Financial Advisor",
    "role": "Investment Advisor",
    "expertise": ["Portfolio Management", "Risk Assessment"],
    "guidelines": "Provide conservative investment advice with risk mitigation",
    "tags": ["finance", "investment"],
    "tool_ids": ["market-data-api", "financial-calculator"]
  }'

# 2. Create a prompt template
curl -X POST http://localhost:3020/api/prompts \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Portfolio Analysis",
    "description": "Analyze investment portfolio",
    "template": "Analyze portfolio {{holdings}} with risk tolerance {{risk_level}}",
    "variables": [
      {"name": "holdings", "type": "array", "description": "Portfolio holdings", "required": true},
      {"name": "risk_level", "type": "string", "description": "Risk tolerance", "required": true}
    ],
    "persona_id": "financial-advisor-123",
    "tags": ["portfolio", "analysis"]
  }'

# 3. Test the prompt
curl -X POST http://localhost:3020/api/prompts/portfolio-analysis-123/test \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "models": ["gpt-4"],
    "test_runs": 3,
    "execution_parameters": {"temperature": 0.3, "max_tokens": 1000}
  }'

# 4. Approve the persona
curl -X POST http://localhost:3020/api/personas/financial-advisor-123/approve \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approved": true,
    "comments": "Reviewed and approved for production use"
  }'
```

This comprehensive API enables sophisticated AI context management with governance, testing, and collaborative decision-making capabilities for the DADMS platform. 