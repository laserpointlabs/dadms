# Data Persistence Integration for DADM OpenAI Service

This document describes the data persistence integration for the DADM OpenAI service, which stores inputs, responses, and metadata in both Qdrant vector store and Neo4j graph database.

## Overview

The data persistence solution provides comprehensive tracking of all interactions with the OpenAI service:

- Stores inputs, responses, and metadata in **Qdrant vector store** for semantic search
- Creates a graph representation in **Neo4j graph database** showing relationships between runs, tasks, and processes
- **Enhanced JSON expansion** (v0.7.0+) creates hierarchical structures with descriptive relationships
- Tracks each execution of `dadm -s` separately with unique run IDs
- Enables querying of stored data for analysis and debugging

## Enhanced Graph Structure (v0.7.0+)

The Neo4j graph database now creates more meaningful and queryable structures:

### Dynamic Relationship Naming
- Uses JSON keys as descriptive relationship names (e.g., "ANALYSIS", "STAKEHOLDERS", "KEY_SPECIFICATIONS")
- Replaces generic "HAS_PROPERTY" relationships with semantic names
- Enables intuitive graph traversal and querying

### Hierarchical Node Structure
- Recursive processing of nested JSON structures from LLM responses
- Maintains clear parent-child relationships throughout the hierarchy
- Creates separate nodes for complex objects and their attributes

### List and Value Handling
- List items get "_ITEM" suffix relationships for clarity
- Value nodes get "_VALUE" suffix relationships for leaf data
- Indexed relationships maintain order and structure

### Example Graph Structure

For a UAV recommendation response, the system now creates:

```
Task_Node
├── ANALYSIS → Analysis_Node
│   ├── STAKEHOLDERS → Stakeholder_Node
│   │   ├── STAKEHOLDER_ITEM_0 → Primary_Users_Node
│   │   └── STAKEHOLDER_ITEM_1 → Secondary_Users_Node
│   ├── UAV_RECOMMENDATIONS → Recommendations_Node
│   │   ├── UAV_ITEM_0 → UAV1_Node
│   │   │   ├── COST_VALUE → Cost_Node
│   │   │   └── SPECIFICATIONS → Spec_Node
│   │   └── UAV_ITEM_1 → UAV2_Node
│   └── KEY_SPECIFICATIONS → Specifications_Node
```

## Data Stored

The following data is captured and stored:

1. **Run Metadata**
   - Run ID (unique identifier for each execution)
   - Timestamp
   - Process context

2. **Task Inputs/Outputs**
   - Task name
   - Task documentation
   - Variables
   - Service properties 
   - Recommendation/results

3. **OpenAI Metadata**
   - Assistant ID
   - Thread ID
   - Processing timestamp

4. **Supporting Files**
   - List of files in the data directory used during processing

## API Endpoints

The following API endpoints are available for working with the persistence layer:

### `/process_task` (Updated)

The standard task processing endpoint now stores all interactions in both databases when processed.

### `/clear_databases` (New)

Clears all data from both Qdrant and Neo4j databases.

**Request Body:**
```json
{
  "confirmed": true
}
```

### `/search_interactions` (New)

Searches for stored interactions using vector similarity.

**Parameters:**
- `query`: Search query text (required)
- `run_id`: Optional run ID to filter by
- `limit`: Maximum number of results to return (default: 10)
- `threshold`: Minimum similarity score threshold (default: 0.7)

### `/query_graph` (New)

Runs a custom Cypher query against the Neo4j graph database.

**Request Body:**
```json
{
  "query": "MATCH (r:Run)-[:INCLUDES_TASK]->(t:Task) RETURN r.run_id, t.task_name",
  "parameters": {}
}
```

### `/run_summary` (New)

Gets a summary of a specific run from both databases.

**Parameters:**
- `run_id`: Run ID to get summary for (required)

## Configuration

The data persistence manager is configured in `database_config.py` with the following settings:

- `QDRANT_HOST`: Qdrant server host (default: localhost)
- `QDRANT_PORT`: Qdrant server port (default: 6333)
- `NEO4J_URI`: Neo4j database URI (default: bolt://localhost:7687)
- `NEO4J_USER`: Neo4j username (default: neo4j)
- `NEO4J_PASSWORD`: Neo4j password (default: password)
- `EMBEDDING_MODEL`: SentenceTransformer model for embeddings (default: all-MiniLM-L6-v2)

## Dependencies

The following dependencies are required for data persistence:

```
qdrant-client>=1.7.0
sentence-transformers>=2.2.2
neo4j>=5.16.0
```

## Usage Examples

### Search for interactions related to a specific topic

```
GET /search_interactions?query=disaster%20response&limit=5
```

### Clear all stored data

```
POST /clear_databases
{
  "confirmed": true
}
```

### Get summary of a specific run

```
GET /run_summary?run_id=openai_service_20250528_123045_a1b2c3d4
```

### Run a custom graph query

```
POST /query_graph
{
  "query": "MATCH (r:Run {run_id: $run_id})-[:INCLUDES_TASK]->(t:Task) RETURN t.task_name, t.recommendation",
  "parameters": {
    "run_id": "openai_service_20250528_123045_a1b2c3d4"
  }
}
```

## Enhanced Query Examples (v0.7.0+)

With the improved graph structure, you can now run more sophisticated queries:

### Find UAVs recommended for specific task types

```cypher
// Find all UAVs recommended for disaster response tasks
MATCH (t:Task)-[:ANALYSIS]->(a)-[:UAV_RECOMMENDATIONS]->(r)-[:UAV_ITEM]->(uav)
WHERE t.task_name CONTAINS "disaster"
RETURN uav.name, uav.cost, uav.specifications
```

### Trace stakeholder considerations

```cypher
// Get stakeholder analysis for a specific recommendation
MATCH (t:Task)-[:ANALYSIS]->(a)-[:STAKEHOLDERS]->(s)
RETURN t.task_name, s.considerations, s.priorities
```

### Analyze cost factors across recommendations

```cypher
// Find cost analysis for all UAV recommendations
MATCH (t:Task)-[:ANALYSIS]->(a)-[:UAV_RECOMMENDATIONS]->(r)-[:UAV_ITEM]->(uav)-[:COST_VALUE]->(cost)
RETURN t.task_name, uav.name, cost.value, cost.currency
ORDER BY cost.value
```

### Get complete recommendation hierarchy

```cypher
// Get full recommendation structure for a task
MATCH (t:Task {task_name: $task_name})-[:ANALYSIS]->(a)
MATCH (a)-[*1..3]->(child)
RETURN t, a, child, relationships(path)
```

## Graph Structure Benefits

The enhanced graph structure provides several advantages:

1. **Semantic Relationships**: Relationship names reflect the actual meaning of the data connections
2. **Intuitive Querying**: Write queries using domain-specific terms rather than generic properties
3. **Better Analytics**: Analyze decision patterns using meaningful graph traversals
4. **Enhanced Debugging**: Trace decision logic through clear hierarchical structures
5. **Improved Integration**: Connect with other systems using well-defined relationship semantics
