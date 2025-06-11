# Thread Persistence Implementation

**Date**: June 11, 2025  
**Version**: 1.0  
**Status**: Implemented and Tested

## Overview

The DADM system now implements sophisticated thread persistence for OpenAI Assistant conversations, enabling conversation continuity across multiple tasks within the same Camunda business process instance. This feature is crucial for coherent multi-step decision analysis workflows.

## Problem Statement

Previously, each OpenAI Assistant task created a new conversation thread, resulting in:
- Loss of context between related tasks
- Inability to reference previous decisions or stakeholders
- Fragmented decision analysis across multi-step processes
- Reduced quality of AI-assisted decision making

## Solution Architecture

### Core Components

1. **Service Orchestrator** (`src/service_orchestrator.py`)
   - Passes `process_instance_id` in all OpenAI service requests
   - Maintains process-level context awareness

2. **OpenAI Service** (`services/openai_service/service.py`)
   - Receives and logs `process_instance_id` for debugging
   - Delegates thread management to the NameBasedAssistantManager

3. **NameBasedAssistantManager** (`services/openai_service/name_based_assistant_manager.py`)
   - Implements core thread persistence logic
   - Manages thread lifecycle and validation
   - Provides process isolation

### Thread Management Logic

```python
class NameBasedAssistantManager:
    def __init__(self):
        # Maps process_instance_id + assistant_id to thread_id
        self._process_threads = {}
    
    def get_or_create_process_thread(self, process_instance_id: str, assistant_id: str):
        process_key = f"{process_instance_id}:{assistant_id}"
        
        # Check for existing thread
        if process_key in self._process_threads:
            thread_id = self._process_threads[process_key]
            # Validate thread still exists on OpenAI
            try:
                self.client.beta.threads.retrieve(thread_id)
                return thread_id
            except Exception:
                # Thread no longer exists, remove from cache
                del self._process_threads[process_key]
        
        # Create new thread
        thread_id = self.create_thread()
        if thread_id:
            self._process_threads[process_key] = thread_id
        
        return thread_id
```

## Implementation Details

### Thread Persistence Workflow

1. **Request Processing**:
   ```
   Service Orchestrator → OpenAI Service
   ├── Extracts process_instance_id from request
   ├── Logs thread persistence status
   └── Calls manager.process_task()
   ```

2. **Thread Resolution**:
   ```
   NameBasedAssistantManager.process_task()
   ├── If process_instance_id provided:
   │   └── get_or_create_process_thread()
   │       ├── Check cache: process_instance_id:assistant_id
   │       ├── Validate existing thread on OpenAI
   │       └── Create new thread if needed
   └── If no process_instance_id:
       └── create_thread() (legacy behavior)
   ```

3. **Thread Validation**:
   - Every cached thread is validated by calling OpenAI's retrieve API
   - Invalid threads are automatically removed from cache
   - New threads are created as replacements

### Process Isolation

Each unique combination of `process_instance_id` + `assistant_id` gets its own thread:

```
Process A (proc_123) + Assistant (asst_abc) → thread_xyz123
Process B (proc_456) + Assistant (asst_abc) → thread_xyz456
Process A (proc_123) + Assistant (asst_def) → thread_xyz789
```

This ensures:
- Complete isolation between different business processes
- Support for multiple assistants within the same process
- No cross-contamination of conversation context

## Configuration

### Environment Variables

No additional environment variables are required. Thread persistence is enabled automatically when:
- Service orchestrator passes `process_instance_id` in requests
- OpenAI service is running with updated codebase

### Docker Development Setup

The implementation includes live code mounting for development:

```yaml
# docker-compose.yml
volumes:
  - ../services:/app/services  # Live service code
  - ../src:/app/src           # Live shared utilities
```

This enables immediate code changes without container rebuilds.

## Testing and Verification

### Test Script

A comprehensive test script validates thread persistence:

```bash
python test_thread_persistence_detailed.py
```

### Test Scenarios

1. **Thread Persistence**: Same `process_instance_id` reuses threads
2. **Context Preservation**: Conversation history is maintained
3. **Process Isolation**: Different process instances use different threads
4. **Thread Validation**: Invalid threads are automatically recreated

### Expected Log Output

```
Processing task for process_instance_id: proc_123
Thread persistence enabled for process: proc_123
Created new thread thread_abc123 for process proc_123

Processing task for process_instance_id: proc_123  
Thread persistence enabled for process: proc_123
Reusing existing thread thread_abc123 for process proc_123
```

## Benefits

### For Decision Analysis

- **Context Continuity**: Assistants remember stakeholders, alternatives, and criteria across tasks
- **Coherent Reasoning**: Multi-step decision processes maintain logical flow
- **Reference Capability**: Later tasks can reference earlier analysis and decisions
- **Improved Quality**: Better AI recommendations due to complete context awareness

### For System Operations

- **Process Isolation**: No interference between different business processes
- **Automatic Recovery**: Self-healing through thread validation and recreation
- **Development Efficiency**: Live code mounting speeds up development iteration
- **Debugging Support**: Comprehensive logging for troubleshooting

## Troubleshooting

### Thread Creation Issues

**Symptom**: New threads created for every request despite same `process_instance_id`

**Check**:
1. Verify service orchestrator passes `process_instance_id`
2. Check OpenAI service logs for thread persistence messages
3. Ensure both services are running updated code

### Thread Validation Failures

**Symptom**: Threads repeatedly recreated

**Possible Causes**:
- OpenAI API connectivity issues
- Thread deleted manually from OpenAI dashboard
- API rate limiting

**Solution**: Check OpenAI API status and rate limits

### Context Not Preserved

**Symptom**: Assistant doesn't remember previous conversations

**Check**:
1. Verify same `process_instance_id` is used across requests
2. Check logs show "Reusing existing thread" messages
3. Ensure thread IDs are identical in responses

## Future Enhancements

- **Thread Cleanup**: Automatic cleanup of completed process threads
- **Thread Metrics**: Monitoring and analytics for thread usage
- **Multi-Assistant Workflows**: Enhanced support for multiple assistants per process
- **Thread Persistence Storage**: Database-backed thread persistence for container restarts

## Related Documentation

- [OpenAI Service README](../services/openai_service/README.md)
- [OpenAI Integration Guide](openai_integration.md)
- [Service Architecture](service_architecture.md)
- [Development Docker Setup](../docker/README.md)
