#!/usr/bin/env python3
"""
Database Configuration for DADM Data Persistence

This module contains configuration settings for Qdrant and Neo4j databases.
Settings can be overridden via environment variables.
"""

import os

# Qdrant Configuration
QDRANT_HOST = os.environ.get("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.environ.get("QDRANT_PORT", "6333"))
QDRANT_COLLECTION = os.environ.get("QDRANT_COLLECTION", "dadm_interactions")

# Neo4j Configuration  
NEO4J_URI = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.environ.get("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD", "password")

# Embedding Model Configuration
EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

# Vector Search Configuration
DEFAULT_SEARCH_LIMIT = int(os.environ.get("DEFAULT_SEARCH_LIMIT", "10"))
DEFAULT_SCORE_THRESHOLD = float(os.environ.get("DEFAULT_SCORE_THRESHOLD", "0.7"))

# Enable/Disable Database Features
ENABLE_QDRANT = os.environ.get("ENABLE_QDRANT", "true").lower() == "true"
ENABLE_NEO4J = os.environ.get("ENABLE_NEO4J", "true").lower() == "true"

# Logging Configuration
DB_LOG_LEVEL = os.environ.get("DB_LOG_LEVEL", "INFO")
