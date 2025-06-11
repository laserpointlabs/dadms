#!/usr/bin/env python3
"""
Simple Neo4j test script to create a node with name 'A'
"""

from neo4j import GraphDatabase
import logging

# Set up logging to see what's happening
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Neo4j connection parameters - make sure these match your setup
NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "password"  # change this to your actual password

def test_create_node():
    """Test creating a simple node with name 'A'"""
    try:
        # Connect to Neo4j
        logger.info(f"Connecting to Neo4j at {NEO4J_URI}")
        driver = GraphDatabase.driver(
            NEO4J_URI, 
            auth=(NEO4J_USER, NEO4J_PASSWORD)
        )
        
        # Test connection first
        with driver.session() as session:
            result = session.run("RETURN 1 AS test")
            for record in result:
                logger.info(f"Connection test successful: {record['test']}")
        
        # Create a simple test node
        with driver.session() as session:
            # Use a simple fixed query without formatting or parameters first
            logger.info("Creating test node with name 'A'")
            result = session.run("CREATE (n:TestNode {name: 'A'}) RETURN n")
            
            # Log the result
            summary = result.consume()
            logger.info(f"Node created: {summary.counters.nodes_created} nodes created")
            
            # Now try to find the node we just created
            logger.info("Verifying node exists...")
            find_result = session.run("MATCH (n:TestNode {name: 'A'}) RETURN n")
            for record in find_result:
                node = record['n']
                logger.info(f"Found node: {node}")
                
        logger.info("Test completed successfully")
        driver.close()
        return True
        
    except Exception as e:
        logger.error(f"Error in test_create_node: {str(e)}", exc_info=True)
        return False

if __name__ == "__main__":
    logger.info("Starting Neo4j test script")
    success = test_create_node()
    if success:
        logger.info("Test completed successfully. A node with name 'A' was created.")
    else:
        logger.error("Test failed. See error logs above.")
