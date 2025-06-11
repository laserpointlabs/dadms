# Analysis Data Management Architecture

## Overview

The new Analysis Data Management architecture decouples data persistence from analysis execution, providing better flexibility, scalability, and maintainability. This design follows best practices for data management and enables multiple processing workflows.

## Architecture Components

### 1. Analysis Data Manager (`src/analysis_data_manager.py`)

The core component responsible for storing and managing analysis data:

- **Primary Storage**: SQLite database for metadata and structured data
- **Secondary Processing**: Queue-based processing for vector stores and graph databases
- **Thread Management**: Track related analyses by thread/session IDs
- **Status Tracking**: Monitor analysis and processing status

### 2. Analysis Service Integration (`src/analysis_service_integration.py`)

Service layer that provides a clean interface for services to store analysis data:

- **Compatibility Layer**: Drop-in replacement for `DataPersistenceManager`
- **Auto-processing**: Automatically queue background processing tasks
- **Configuration Management**: Handle environment-based configuration
- **Global Instance**: Singleton pattern for easy service integration

### 3. Processing Daemon (`scripts/analysis_processing_daemon.py`)

Background daemon for processing stored analysis data:

- **Decoupled Processing**: Processes data independently of analysis execution
- **Batch Processing**: Handles multiple analyses efficiently
- **Fault Tolerance**: Continues processing even if individual tasks fail
- **Monitoring**: Provides status and metrics

### 4. Analysis CLI (`scripts/analysis_cli.py`)

Command-line interface for managing analysis data:

- **Query Interface**: Search and filter stored analyses
- **Thread Conversations**: View analysis history by thread
- **Processing Control**: Manually trigger processing tasks
- **Export/Import**: Backup and restore analysis data

## Key Benefits

### 1. Decoupled Architecture

**Before**: Analysis execution → Direct database writes → Blocking operations
**After**: Analysis execution → Store in primary storage → Background processing

### 2. Multiple Processing Paths

- **Vector Store**: For semantic search and similarity analysis
- **Graph Database**: For relationship mapping and graph queries
- **Search Indexes**: For fast text-based queries
- **Custom Processors**: Easy to add new processing types

### 3. Thread/Session Management

- **Thread IDs**: Group related analyses (e.g., conversation history)
- **Session IDs**: Track broader workflow sessions
- **Process Instance IDs**: Link to specific workflow executions
- **Tags**: Flexible categorization system

### 4. Better Data Management

- **Structured Storage**: Primary storage in SQLite with full metadata
- **Status Tracking**: Know the processing status of each analysis
- **Reprocessing**: Re-run processing with different configurations
- **Export/Backup**: Full data export capabilities

## Migration Guide

### For Services (e.g., OpenAI Service)

Replace direct `DataPersistenceManager` usage:

```python
# Old approach
from src.data_persistence_manager import DataPersistenceManager
persistence_manager = DataPersistenceManager(...)
persistence_manager.store_interaction(...)

# New approach
from src.analysis_service_integration import get_analysis_service
analysis_service = get_analysis_service()
analysis_service.store_openai_interaction(...)
```

### For Service Orchestrator

Add analysis service integration for task routing:

```python
# In route_task method
from src.analysis_service_integration import get_analysis_service

# Store task analysis
analysis_service = get_analysis_service()
analysis_id = analysis_service.store_task_analysis(
    task_description=task_description,
    task_id=task_id,
    task_name=task_name,
    variables=variables,
    response_data=result,
    service_name=service_name
)
```

## Configuration

### Environment Variables

```bash
# Storage configuration
ANALYSIS_STORAGE_DIR="/path/to/analysis/storage"

# Vector store configuration
ENABLE_VECTOR_STORE=true
QDRANT_HOST=localhost
QDRANT_PORT=6333

# Graph database configuration
ENABLE_GRAPH_DB=true
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# Processing configuration
AUTO_PROCESS_ANALYSES=true
PROCESS_INTERVAL=30
PROCESS_BATCH_SIZE=10
```

### Configuration File

```python
from config.analysis_config import get_service_integration_config

config = get_service_integration_config()
analysis_service = AnalysisServiceIntegration(**config)
```

## Usage Examples

### 1. Store Analysis Data

```python
from src.analysis_service_integration import get_analysis_service

analysis_service = get_analysis_service()

# Store a task analysis
analysis_id = analysis_service.store_task_analysis(
    task_description="Analyze decision alternatives",
    task_id="task_123",
    task_name="Decision Analysis",
    variables={"budget": 10000, "timeline": "6 months"},
    response_data={"recommendation": "Option A", "confidence": 0.8},
    thread_id="conversation_456",
    tags=["decision", "analysis"]
)
```

### 2. Query Analysis Data

```python
# Get thread conversation
conversation = analysis_service.get_thread_conversation("conversation_456")

# Search analyses
results = analysis_service.search_analyses(
    query="decision",
    tags=["analysis"],
    limit=50
)

# Get specific analysis
analysis = analysis_service.get_analysis_by_id(analysis_id)
```

### 3. Process Data

```python
# Process pending analyses
processed_count = analysis_service.process_pending_analyses(
    processor_type="vector_store",
    limit=10
)

# Reprocess specific analysis
success = analysis_service.reprocess_analysis(
    analysis_id,
    processors=["graph_db"]
)
```

### 4. CLI Operations

```bash
# List recent analyses
python scripts/analysis_cli.py list --limit 20

# Show thread conversation
python scripts/analysis_cli.py thread conversation_456 --verbose

# Process pending tasks
python scripts/analysis_cli.py process --limit 50

# Show system status
python scripts/analysis_cli.py status

# Export analyses
python scripts/analysis_cli.py export analyses.json --tags decision analysis
```

### 5. Background Processing

```bash
# Run processing daemon
python scripts/analysis_processing_daemon.py

# Run with custom configuration
python scripts/analysis_processing_daemon.py \
    --interval 60 \
    --batch-size 20 \
    --storage-dir /custom/path

# Process once and exit
python scripts/analysis_processing_daemon.py --once

# Show daemon status
python scripts/analysis_processing_daemon.py --status
```

## Data Flow

```
1. Service Request → Analysis Execution
                      ↓
2. Store Analysis Data → Analysis Data Manager
                      ↓
3. Queue Processing Tasks → SQLite Database
                      ↓
4. Background Daemon → Process Pending Tasks
                      ↓
5. Update Databases → Vector Store + Graph DB
```

## Thread and Session Management

### Thread IDs
- **Purpose**: Group related analyses in a conversation or workflow
- **Format**: `conversation_123`, `task_456_20250611`, etc.
- **Usage**: Track analysis history for context

### Session IDs
- **Purpose**: Track broader workflow sessions
- **Format**: `openai_service_20250611_143022`, `workflow_session_789`
- **Usage**: Group multiple threads in a session

### Process Instance IDs
- **Purpose**: Link to specific workflow executions
- **Format**: Camunda process instance IDs
- **Usage**: Connect analysis to workflow execution

## Best Practices

### 1. Thread Management
- Use consistent thread ID patterns
- Group related analyses by thread
- Include timestamp in thread IDs for uniqueness

### 2. Data Storage
- Store both structured output and raw responses
- Use tags for categorization
- Include context in input data

### 3. Processing
- Run background daemon for real-time processing
- Monitor processing status regularly
- Reprocess analyses when changing configurations

### 4. Querying
- Use thread IDs for conversation history
- Use tags for categorization
- Export data regularly for backup

## Monitoring and Debugging

### Check System Status
```bash
python scripts/analysis_cli.py status
```

### Monitor Processing
```bash
python scripts/analysis_processing_daemon.py --status
```

### View Processing Logs
```bash
# Check daemon logs
tail -f logs/analysis_processing.log

# Check service logs
tail -f logs/openai_service.log
```

### Troubleshooting

1. **Processing Stuck**: Check daemon status and restart if needed
2. **Database Issues**: Verify connection settings and permissions
3. **Storage Full**: Check storage directory and clean up old data
4. **Performance**: Adjust batch size and processing interval

This architecture provides a robust, scalable foundation for managing analysis data while maintaining flexibility for future enhancements.
