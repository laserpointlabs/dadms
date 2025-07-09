# UI Integration Guide for DADM Microservices

This guide explains how to integrate the new microservices with your existing DADM UI.

## Overview

The microservices provide REST APIs that can be easily integrated with your existing React-based UI. The services are designed to work alongside your current system, providing enhanced functionality for prompt management, tool integration, workflow execution, and AI oversight.

## Integration Points

### 1. Prompt Management Integration

Replace or extend your existing prompt management with the new Prompt Service:

```javascript
// Example: Creating a prompt using the new service
const createPrompt = async (promptData) => {
  try {
    const response = await fetch('http://localhost:3001/prompts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getCurrentUserId() // Your existing user management
      },
      body: JSON.stringify({
        text: promptData.text,
        type: promptData.type || 'simple',
        test_cases: promptData.testCases || [],
        tags: promptData.tags || [],
        metadata: promptData.metadata || {}
      })
    });
    
    const result = await response.json();
    if (result.success) {
      // Handle success - update your UI state
      return result.data;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Failed to create prompt:', error);
    throw error;
  }
};
```

### 2. Tool Integration

Integrate tool management with your existing tool system:

```javascript
// Example: Registering a tool
const registerTool = async (toolData) => {
  try {
    const response = await fetch('http://localhost:3002/tools', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getCurrentUserId()
      },
      body: JSON.stringify({
        name: toolData.name,
        description: toolData.description,
        endpoint: toolData.endpoint,
        capabilities: toolData.capabilities,
        version: toolData.version
      })
    });
    
    const result = await response.json();
    if (result.success) {
      // Update your tool registry
      return result.data;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Failed to register tool:', error);
    throw error;
  }
};
```

### 3. Workflow Integration

Extend your BPMN workflow system with the new Workflow Service:

```javascript
// Example: Creating a workflow
const createWorkflow = async (workflowData) => {
  try {
    const response = await fetch('http://localhost:3003/workflows', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getCurrentUserId()
      },
      body: JSON.stringify({
        name: workflowData.name,
        description: workflowData.description,
        bpmn_xml: workflowData.bpmnXml, // Your existing BPMN XML
        linked_prompts: workflowData.promptIds || [],
        linked_tools: workflowData.toolIds || []
      })
    });
    
    const result = await response.json();
    if (result.success) {
      // Update your workflow management UI
      return result.data;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Failed to create workflow:', error);
    throw error;
  }
};
```

### 4. AI Oversight Integration

Add the AI oversight panel to your UI:

```javascript
// Example: AI Oversight Panel Component
import React, { useState, useEffect } from 'react';

const AIOversightPanel = () => {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFindings = async (filters = {}) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(`http://localhost:3004/ai-review/findings?${queryParams}`);
      const result = await response.json();
      
      if (result.success) {
        setFindings(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch findings:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveFinding = async (findingId, resolutionNotes) => {
    try {
      const response = await fetch(`http://localhost:3004/ai-review/findings/${findingId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': getCurrentUserId()
        },
        body: JSON.stringify({
          resolved_by: getCurrentUserId(),
          resolution_notes: resolutionNotes
        })
      });
      
      const result = await response.json();
      if (result.success) {
        // Refresh findings
        fetchFindings();
      }
    } catch (error) {
      console.error('Failed to resolve finding:', error);
    }
  };

  useEffect(() => {
    fetchFindings();
  }, []);

  return (
    <div className="ai-oversight-panel">
      <h3>AI Oversight & Findings</h3>
      {loading ? (
        <div>Loading findings...</div>
      ) : (
        <div className="findings-list">
          {findings.map(finding => (
            <div key={finding.finding_id} className={`finding-item finding-${finding.level}`}>
              <div className="finding-header">
                <span className={`finding-level ${finding.level}`}>
                  {finding.level.toUpperCase()}
                </span>
                <span className="finding-agent">{finding.agent_name}</span>
                <span className="finding-time">
                  {new Date(finding.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="finding-message">{finding.message}</div>
              {finding.suggested_action && (
                <div className="finding-suggestion">
                  <strong>Suggestion:</strong> {finding.suggested_action}
                </div>
              )}
              {!finding.resolved && (
                <button 
                  onClick={() => resolveFinding(finding.finding_id, 'Resolved by user')}
                  className="resolve-button"
                >
                  Mark as Resolved
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIOversightPanel;
```

## Integration Strategy

### Phase 1: Parallel Integration
1. Keep your existing UI and services running
2. Add new microservices alongside existing functionality
3. Create new UI components for the enhanced features
4. Gradually migrate functionality to the new services

### Phase 2: Feature Migration
1. Identify features that can benefit from the new services
2. Create migration paths for existing data
3. Update UI components to use new APIs
4. Maintain backward compatibility during transition

### Phase 3: Full Integration
1. Complete migration to new microservices
2. Remove deprecated functionality
3. Optimize performance and user experience
4. Add advanced features like real-time AI oversight

## Configuration

### Environment Setup

Add the following to your UI's environment configuration:

```javascript
// config/services.js
export const SERVICE_CONFIG = {
  PROMPT_SERVICE: process.env.REACT_APP_PROMPT_SERVICE_URL || 'http://localhost:3001',
  TOOL_SERVICE: process.env.REACT_APP_TOOL_SERVICE_URL || 'http://localhost:3002',
  WORKFLOW_SERVICE: process.env.REACT_APP_WORKFLOW_SERVICE_URL || 'http://localhost:3003',
  AI_OVERSIGHT_SERVICE: process.env.REACT_APP_AI_OVERSIGHT_SERVICE_URL || 'http://localhost:3004',
  EVENT_BUS: process.env.REACT_APP_EVENT_BUS_URL || 'http://localhost:3005'
};
```

### CORS Configuration

Ensure your microservices allow requests from your UI domain:

```javascript
// In each microservice
app.use(cors({
  origin: process.env.UI_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
```

## Error Handling

Implement consistent error handling across your UI:

```javascript
// utils/api.js
export const handleApiError = (error, context) => {
  console.error(`API Error in ${context}:`, error);
  
  // Show user-friendly error message
  const message = error.message || 'An unexpected error occurred';
  
  // You can integrate with your existing notification system
  showNotification(message, 'error');
  
  // Log error for debugging
  logError(error, context);
};
```

## Testing Integration

Use the provided test script to verify your integration:

```bash
cd services
./test-api.sh
```

## Performance Considerations

1. **Caching**: Implement caching for frequently accessed data
2. **Lazy Loading**: Load AI findings on demand
3. **Real-time Updates**: Use WebSocket connections for live updates
4. **Optimistic Updates**: Update UI immediately, sync with server later

## Security

1. **Authentication**: Integrate with your existing auth system
2. **Authorization**: Pass user context in headers
3. **Input Validation**: Validate all user inputs
4. **HTTPS**: Use HTTPS in production

## Monitoring

1. **Health Checks**: Monitor service health
2. **Error Tracking**: Track and alert on errors
3. **Performance Metrics**: Monitor response times
4. **User Analytics**: Track feature usage

## Next Steps

1. Start with the AI Oversight Panel integration
2. Gradually migrate prompt management features
3. Add tool integration capabilities
4. Implement workflow management features
5. Add real-time event monitoring

This integration approach allows you to enhance your existing DADM system while maintaining stability and providing a clear migration path. 