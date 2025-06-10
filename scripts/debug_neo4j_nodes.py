#!/usr/bin/env python3
"""
Debug Neo4j node properties to understand display issues
"""

import logging
import sys
from src.data_persistence_manager import DataPersistenceManager

# Set up logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def debug_neo4j_nodes():
    """Query Neo4j database to examine node properties"""
    try:
        # Create a data persistence manager
        dpm = DataPersistenceManager()
        
        # First, check how many nodes are in the database
        count_query = "MATCH (n) RETURN count(n) as node_count"
        result = dpm.query_graph(count_query)
        if result:
            node_count = result[0]['node_count']
            logger.info(f"Total nodes in database: {node_count}")
        
        # Query to get node name, label and all properties
        query = """
        MATCH (n) 
        RETURN 
            labels(n) as labels,
            n.name as name,
            properties(n) as all_properties
        LIMIT 20
        """
        
        nodes = dpm.query_graph(query)
        
        # Print detailed node information
        logger.info(f"Found {len(nodes)} nodes:")
        for i, node in enumerate(nodes):
            label = node['labels'][0] if node['labels'] else "No Label"
            name = node['name'] if 'name' in node and node['name'] else "No Name"
            logger.info(f"\nNode {i+1}. Label: {label}")
            logger.info(f"   Name property: '{name}'")
            
            # Log all properties
            logger.info("   All properties:")
            for key, value in node['all_properties'].items():
                logger.info(f"      {key}: {value}")
        
        # Now let's check what Neo4j displays as "name" for nodes
        # Neo4j Browser uses node labels, captions setting or default property
        display_query = """
        CALL apoc.meta.nodeTypeProperties()
        YIELD nodeType, propertyName, propertyTypes
        RETURN nodeType, propertyName, propertyTypes
        """
        
        try:
            display_info = dpm.query_graph(display_query)
            logger.info("\nNeo4j node property metadata:")
            for info in display_info:
                logger.info(f"Node type: {info['nodeType']}, Property: {info['propertyName']}, Types: {info['propertyTypes']}")
        except Exception as e:
            logger.error(f"Error running APOC query (may not be installed): {e}")
            
            # If APOC fails, use a simpler query to get sample nodes of each type
            logger.info("\nFallback to simple node samples:")
            labels_query = "CALL db.labels() YIELD label RETURN label"
            labels = dpm.query_graph(labels_query)
            
            for label_info in labels:
                label = label_info['label']
                sample_query = f"MATCH (n:{label}) RETURN n LIMIT 1"
                samples = dpm.query_graph(sample_query)
                if samples:
                    logger.info(f"\nSample {label} node properties: {samples[0]}")
        
        # Close the connection
        dpm.close()
        return True
        
    except Exception as e:
        logger.error(f"Error in debug_neo4j_nodes: {str(e)}", exc_info=True)
        return False

if __name__ == "__main__":
    logger.info("Starting Neo4j node debugging...")
    success = debug_neo4j_nodes()
    if success:
        logger.info("Debug completed successfully.")
        sys.exit(0)
    else:
        logger.error("Debug failed.")
        sys.exit(1)
