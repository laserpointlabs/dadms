#!/usr/bin/env python3
"""
Analysis Configuration

Configuration settings for the Analysis Data Manager and related services.
"""
import os
from pathlib import Path
from typing import Dict, Any


# Define the JSON response format instructions for decision analysis
DECISION_ANALYSIS_JSON_FORMAT = """
IMPORTANT: Always format your responses as valid JSON objects with the following structure:

{
  "analysis": {
    "decision_context": "Description of the decision context and problem statement",
    "stakeholders": ["Stakeholder 1", "Stakeholder 2", "..."],
    "alternatives": [
      {
        "name": "Alternative 1",
        "description": "Description of alternative 1",
        "pros": ["Pro 1", "Pro 2", "..."],
        "cons": ["Con 1", "Con 2", "..."]
      },
      {
        "name": "Alternative 2",
        "description": "Description of alternative 2",
        "pros": ["Pro 1", "Pro 2", "..."],
        "cons": ["Con 1", "Con 2", "..."]
      }
    ],
    "criteria": [
      {
        "name": "Criterion 1",
        "description": "Description of criterion 1",
        "weight": 0.3
      },
      {
        "name": "Criterion 2",
        "description": "Description of criterion 2",
        "weight": 0.7
      }
    ]
  },
  "evaluation": {
    "method": "Description of evaluation method used",
    "results": [
      {
        "alternative": "Alternative 1",
        "score": 0.85,
        "rationale": "Explanation for this score"
      },
      {
        "alternative": "Alternative 2",
        "score": 0.72,
        "rationale": "Explanation for this score"
      }
    ]
  },
  "recommendation": {
    "preferred_alternative": "Name of the recommended alternative",
    "justification": "Detailed justification for the recommendation",
    "implementation_considerations": [
      "Consideration 1",
      "Consideration 2",
      "..."
    ],
    "risks": [
      {
        "description": "Risk 1 description",
        "mitigation": "Suggested mitigation for risk 1"
      },
      {
        "description": "Risk 2 description", 
        "mitigation": "Suggested mitigation for risk 2"
      }
    ]
  }
}

Ensure your response is properly formatted as valid JSON. This structure is required for automated processing of decision analysis results.
"""

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
    
    # Response format configuration
    response_format_config = {
        'format_type': os.environ.get('RESPONSE_FORMAT_TYPE', 'json'),
        'json_instructions': DECISION_ANALYSIS_JSON_FORMAT,
        'enforce_json': os.environ.get('ENFORCE_JSON_RESPONSE', 'true').lower() == 'true'
    }
    
    return {
        'storage_dir': storage_dir,
        'qdrant': qdrant_config,
        'neo4j': neo4j_config,
        'processing': processing_config,
        'response_format': response_format_config
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
        'neo4j_password': config['neo4j']['password'],
        'response_format': config['response_format']
    }
