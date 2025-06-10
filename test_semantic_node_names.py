#!/usr/bin/env python3
"""
Test script to verify semantic node name generation in Neo4j
"""

import json
import logging
import sys
from src.data_persistence_manager import DataPersistenceManager

# Set up logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_semantic_node_names():
    """Test semantic node name generation with various data types"""
    try:
        # Create a data persistence manager
        dpm = DataPersistenceManager()
        
        # First clear the database
        logger.info("Clearing Neo4j database...")
        dpm.clear_graph_database()
        
        # Create a sample task with different data types
        task_name = "Semantic Node Name Test"
        process_id = "test_process_001"
        
        # Create a complex sample input with multiple data types
        task_input = {
            "task_name": task_name,
            "stakeholders": [
                {
                    "name": "IT Department",
                    "role": "Technical Implementation",
                    "interests": "Ensure system stability and security"
                },
                {
                    "name": "Finance Team",
                    "role": "Budget Management",
                    "interests": "Cost control and ROI"
                }
            ],
            "alternatives": [
                {
                    "name": "Cloud Solution",
                    "description": "Implement a cloud-based system",
                    "cost": 50000,
                    "benefits": ["Scalability", "Low maintenance"]
                },
                {
                    "name": "On-premise Solution",
                    "description": "Build an on-premise system",
                    "cost": 75000,
                    "benefits": ["Full control", "Data sovereignty"]
                }
            ],
            "criteria": [
                {
                    "name": "Cost",
                    "weight": 0.4
                },
                {
                    "name": "Security",
                    "weight": 0.3
                },
                {
                    "name": "Scalability",
                    "weight": 0.3
                }
            ]
        }
        
        # Capture analysis start
        logger.info(f"Starting analysis capture with task: {task_name}")
        analysis_id = dpm.capture_analysis_start(task_name, task_input, process_id)
        logger.info(f"Analysis ID: {analysis_id}")
        
        # Create a sample response
        response_data = {
            "recommendation": {
                "primary_choice": "Cloud Solution",
                "reasoning": "Lower cost and better scalability make this the preferred option",
                "score": 0.82
            },
            "evaluation": {
                "cloud_score": 8.2,
                "on_premise_score": 7.5
            }
        }
        
        # Capture analysis response
        logger.info("Capturing analysis response...")
        dpm.capture_analysis_response(analysis_id, response_data)
        
        # Query the graph to verify node names
        logger.info("Querying graph for node names...")
        query = """
        MATCH (n) 
        WHERE n.name IS NOT NULL
        RETURN labels(n) as type, n.name as name, n.key as key
        LIMIT 100
        """
        
        results = dpm.query_graph(query)
        
        # Check if we have results
        if not results:
            logger.error("No nodes with names found in the graph!")
            return False
        
        # Print the node types and names
        logger.info(f"Found {len(results)} nodes with names:")
        for i, result in enumerate(results):
            node_type = result['type'][0] if result['type'] else "Unknown"
            name = result['name']
            key = result['key']
            logger.info(f"{i+1}. {node_type} - '{name}' (key: {key})")
        
        # Close the connection
        dpm.close()
        return True
        
    except Exception as e:
        logger.error(f"Error in test_semantic_node_names: {str(e)}", exc_info=True)
        return False

if __name__ == "__main__":
    logger.info("Starting semantic node name test...")
    success = test_semantic_node_names()
    if success:
        logger.info("Test completed successfully.")
        sys.exit(0)
    else:
        logger.error("Test failed.")
        sys.exit(1)
