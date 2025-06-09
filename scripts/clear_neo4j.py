import logging

logger = logging.getLogger(__name__)

def clear_graph_database(neo4j_driver) -> bool:
    """Clear all data and schema metadata from the Neo4j graph database"""
    if not neo4j_driver:
        logger.warning("Neo4j not available")
        return False
    
    try:
        with neo4j_driver.session() as session:
            # Delete ALL nodes and relationships
            session.run("MATCH (n) DETACH DELETE n")
            # Clear query caches explicitly
            session.run("CALL db.clearQueryCaches()")
            logger.info("Cleared entire Neo4j graph database and schema caches")
            return True
            
    except Exception as e:
        logger.error(f"Error clearing graph database: {e}")
        return False

if __name__ == "__main__":
    from neo4j import GraphDatabase
    # Replace with your actual Neo4j URI, user, and password
    uri = "bolt://localhost:7687"
    user = "neo4j"
    password = "password"
    driver = GraphDatabase.driver(uri, auth=(user, password))
    clear_graph_database(driver)
    driver.close()