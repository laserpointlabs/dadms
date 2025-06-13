#!/usr/bin/env python3
"""
Analysis Configuration

Configuration settings for the Analysis Data Manager and related services.
"""
import os
from pathlib import Path
from typing import Dict, Any


def get_analysis_config() -> Dict[str, Any]:
    """
    Get analysis configuration from environment variables and defaults
    
    Returns:
        Dict containing configuration settings
    """
    # Base storage directory
    storage_dir = os.environ.get(
        'ANALYSIS_STORAGE_DIR',
        str(Path.cwd() / "data" / "analysis_storage")
    )
    
    # Qdrant configuration
    qdrant_config = {
        'host': os.environ.get('QDRANT_HOST', 'localhost'),
        'port': int(os.environ.get('QDRANT_PORT', '6333')),
        'enabled': os.environ.get('ENABLE_VECTOR_STORE', 'true').lower() == 'true'
    }
    
    # Neo4j configuration
    neo4j_config = {
        'uri': os.environ.get('NEO4J_URI', 'bolt://localhost:7687'),
        'user': os.environ.get('NEO4J_USER', 'neo4j'),
        'password': os.environ.get('NEO4J_PASSWORD', 'password'),
        'enabled': os.environ.get('ENABLE_GRAPH_DB', 'true').lower() == 'true'
    }
    
    # Processing configuration
    processing_config = {
        'auto_process': os.environ.get('AUTO_PROCESS_ANALYSES', 'true').lower() == 'true',
        'process_interval': int(os.environ.get('PROCESS_INTERVAL', '30')),
        'batch_size': int(os.environ.get('PROCESS_BATCH_SIZE', '10'))
    }
    
    return {
        'storage_dir': storage_dir,
        'qdrant': qdrant_config,
        'neo4j': neo4j_config,
        'processing': processing_config
    }


def get_service_integration_config() -> Dict[str, Any]:
    """
    Get configuration for service integration
    
    Returns:
        Dict containing service integration configuration
    """
    config = get_analysis_config()
    
    return {
        'storage_dir': config['storage_dir'],
        'enable_vector_store': config['qdrant']['enabled'],
        'enable_graph_db': config['neo4j']['enabled'],
        'auto_process': config['processing']['auto_process'],
        'qdrant_host': config['qdrant']['host'],
        'qdrant_port': config['qdrant']['port'],
        'neo4j_uri': config['neo4j']['uri'],
        'neo4j_user': config['neo4j']['user'],
        'neo4j_password': config['neo4j']['password']
    }
