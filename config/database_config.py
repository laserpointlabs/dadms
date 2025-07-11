#!/usr/bin/env python3
"""
Database Configuration for DADM Data Persistence

This module contains configuration settings for PostgreSQL, Qdrant and Neo4j databases.
Settings can be overridden via environment variables.

REQ-004: PostgreSQL Infrastructure Setup - Consolidated database configuration
"""

import os

# PostgreSQL Configuration (Primary Data Store)
POSTGRES_HOST = os.environ.get("POSTGRES_HOST", "localhost")
POSTGRES_PORT = int(os.environ.get("POSTGRES_PORT", "5432"))
POSTGRES_DB = os.environ.get("POSTGRES_DB", "dadm_db")
POSTGRES_USER = os.environ.get("POSTGRES_USER", "dadm_user")
POSTGRES_PASSWORD = os.environ.get("POSTGRES_PASSWORD", "dadm_password")

# Connection string for SQLAlchemy
POSTGRES_CONNECTION_STRING = (
    f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@"
    f"{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
)

# Legacy Database Configuration (for migration)
SQLITE_ANALYSIS_DB = os.environ.get("SQLITE_ANALYSIS_DB", "data/analysis_storage/analysis_data.db")
SQLITE_PROMPTS_DB = os.environ.get("SQLITE_PROMPTS_DB", "data/prompts.db")
SQLITE_GOVERNANCE_DB = os.environ.get("SQLITE_GOVERNANCE_DB", "data/governance/governance.db")

# Qdrant Configuration (Vector Store)
QDRANT_HOST = os.environ.get("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.environ.get("QDRANT_PORT", "6333"))
QDRANT_COLLECTION = os.environ.get("QDRANT_COLLECTION", "dadm_interactions")

# Neo4j Configuration (Graph Database)
NEO4J_URI = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.environ.get("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD", "password")

# Embedding Model Configuration
EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

# Vector Search Configuration
DEFAULT_SEARCH_LIMIT = int(os.environ.get("DEFAULT_SEARCH_LIMIT", "10"))
DEFAULT_SCORE_THRESHOLD = float(os.environ.get("DEFAULT_SCORE_THRESHOLD", "0.7"))

# Enable/Disable Database Features
ENABLE_POSTGRESQL = os.environ.get("ENABLE_POSTGRESQL", "true").lower() == "true"
ENABLE_QDRANT = os.environ.get("ENABLE_QDRANT", "true").lower() == "true"
ENABLE_NEO4J = os.environ.get("ENABLE_NEO4J", "true").lower() == "true"

# Migration Settings
RUN_MIGRATION = os.environ.get("RUN_MIGRATION", "false").lower() == "true"
MIGRATION_BATCH_SIZE = int(os.environ.get("MIGRATION_BATCH_SIZE", "1000"))

# Multi-Tenancy Settings
DEFAULT_COMPANY_ID = os.environ.get("DEFAULT_COMPANY_ID", "00000000-0000-0000-0000-000000000001")
DEFAULT_TENANT_ID = os.environ.get("DEFAULT_TENANT_ID", "00000000-0000-0000-0000-000000000002")
DEFAULT_TENANT_SLUG = os.environ.get("DEFAULT_TENANT_SLUG", "default-tenant")

# Logging Configuration
DB_LOG_LEVEL = os.environ.get("DB_LOG_LEVEL", "INFO")

# Connection Pool Settings
POSTGRES_POOL_SIZE = int(os.environ.get("POSTGRES_POOL_SIZE", "10"))
POSTGRES_MAX_OVERFLOW = int(os.environ.get("POSTGRES_MAX_OVERFLOW", "20"))
POSTGRES_POOL_TIMEOUT = int(os.environ.get("POSTGRES_POOL_TIMEOUT", "30"))

# Docker vs Local Configuration
def get_postgres_host():
    """Get PostgreSQL host based on environment"""
    if os.environ.get('DOCKER_CONTAINER'):
        return 'dadm-postgres'
    return POSTGRES_HOST

def get_qdrant_host():
    """Get Qdrant host based on environment"""
    if os.environ.get('DOCKER_CONTAINER'):
        return 'dadm-qdrant'
    return QDRANT_HOST

def get_neo4j_uri():
    """Get Neo4j URI based on environment"""
    if os.environ.get('DOCKER_CONTAINER'):
        return "bolt://dadm-neo4j:7687"
    return NEO4J_URI
