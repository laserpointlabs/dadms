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
    import os
    from neo4j import GraphDatabase
    
    # Use environment variables or defaults (same as the main system)
    uri = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
    user = os.environ.get("NEO4J_USER", "neo4j")
    password = os.environ.get("NEO4J_PASSWORD", "password")
    
    try:
        driver = GraphDatabase.driver(uri, auth=(user, password))
        success = clear_graph_database(driver)
        driver.close()
        
        if success:
            print("✅ Neo4j database cleared successfully")
        else:
            print("❌ Failed to clear Neo4j database")
            exit(1)
    except Exception as e:
        print(f"❌ Error connecting to Neo4j: {e}")
        exit(1)