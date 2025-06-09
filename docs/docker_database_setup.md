# Docker Setup for DADM Data Persistence

This document describes the Docker setup for the DADM data persistence components, including Qdrant vector database and Neo4j graph database.

## Overview

The data persistence solution includes two containerized database services:

1. **Qdrant** - Vector database for semantic search capabilities
2. **Neo4j** - Graph database for relationship modeling

Both databases are configured to work with the DADM OpenAI service for storing and retrieving data about interactions.

## Docker Compose Configuration

The `docker-compose.yml` file has been updated to include:

- Qdrant container with persistent storage volume
- Neo4j container with persistent storage volumes
- Environment variables for the OpenAI service to connect to these databases

## Qdrant Configuration

```yaml
# Qdrant Vector Database Service
qdrant:
  image: qdrant/qdrant:latest
  container_name: dadm-qdrant
  ports:
    - "6333:6333"
    - "6334:6334"  # Web UI
  volumes:
    - qdrant_storage:/qdrant/storage
  restart: unless-stopped
  networks:
    - dadm-network
```

Qdrant is accessible:
- API: `http://localhost:6333`
- Web UI: `http://localhost:6334`

## Neo4j Configuration

```yaml
# Neo4j Graph Database Service
neo4j:
  image: neo4j:5.16.0
  container_name: dadm-neo4j
  ports:
    - "7474:7474"  # Web interface
    - "7687:7687"  # Bolt protocol
  volumes:
    - neo4j_data:/data
    - neo4j_logs:/logs
    - neo4j_import:/import
    - neo4j_plugins:/plugins
  environment:
    - NEO4J_AUTH=neo4j/password
    - NEO4J_dbms_memory_pagecache_size=1G
    - NEO4J_dbms_memory_heap_initial__size=1G
    - NEO4J_dbms_memory_heap_max__size=1G
  restart: unless-stopped
  networks:
    - dadm-network
```

Neo4j is accessible:
- Web UI: `http://localhost:7474`
- Bolt protocol: `bolt://localhost:7687`
- Default credentials: neo4j / password

## OpenAI Service Configuration

The OpenAI service is configured with environment variables to connect to these databases:

```yaml
environment:
  # Database configuration
  - QDRANT_HOST=qdrant
  - QDRANT_PORT=6333
  - NEO4J_URI=bolt://neo4j:7687
  - NEO4J_USER=neo4j
  - NEO4J_PASSWORD=password
  - ENABLE_QDRANT=true
  - ENABLE_NEO4J=true
```

## Persistent Storage

The docker-compose configuration includes volume definitions to ensure data persists across container restarts:

```yaml
volumes:
  qdrant_storage:
  neo4j_data:
  neo4j_logs:
  neo4j_import:
  neo4j_plugins:
```

## Potential Issues and Troubleshooting

### Hugging Face Dependency

If you encounter the error `ImportError: cannot import name 'cached_download' from 'huggingface_hub'`, this is due to a compatibility issue with the Hugging Face Hub library.

Solution: Add this version constraint to your requirements.txt:
```
huggingface_hub==0.25.2
```

### Neo4j Password

The default Neo4j password is set to "password". For production environments, you should change this to a secure password. Update both the container environment variable and the OpenAI service environment variable.

### Memory Requirements

Both Neo4j and Qdrant can be memory-intensive. The current configuration allocates 1GB of heap memory to Neo4j, which is suitable for development. For production or larger datasets, you may need to increase these values.

## Accessing the Web Interfaces

- **Qdrant Dashboard**: Open `http://localhost:6334` in your browser
- **Neo4j Browser**: Open `http://localhost:7474` in your browser and login with neo4j/password
