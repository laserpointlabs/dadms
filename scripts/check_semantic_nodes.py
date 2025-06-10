from neo4j import GraphDatabase
import os

uri = os.environ.get('NEO4J_URI', 'bolt://localhost:7687')
user = os.environ.get('NEO4J_USER', 'neo4j')
password = os.environ.get('NEO4J_PASSWORD', 'password')

driver = GraphDatabase.driver(uri, auth=(user, password))

with driver.session() as session:
    print("Node types:")
    result = session.run('MATCH (n) RETURN DISTINCT labels(n) as labels, COUNT(*) as count')
    for record in result:
        print(f'{record["labels"]}: {record["count"]} nodes')
    
    print("\nRelationship types:")
    result = session.run('MATCH ()-[r]->() RETURN DISTINCT type(r) as rel_type, COUNT(*) as count')
    for record in result:
        print(f'{record["rel_type"]}: {record["count"]} relationships')
    
    print("\nSemantic nodes (if any):")
    result = session.run('MATCH (n:SemanticCategory) RETURN n.category as category, COUNT(*) as count')
    for record in result:
        print(f'SemanticCategory {record["category"]}: {record["count"]} nodes')
    
    result = session.run('MATCH (n:SemanticItem) RETURN n.category as category, COUNT(*) as count')
    for record in result:
        print(f'SemanticItem {record["category"]}: {record["count"]} nodes')

driver.close()
