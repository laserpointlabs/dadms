from neo4j import GraphDatabase
import os
import json

uri = os.environ.get('NEO4J_URI', 'bolt://localhost:7687')
user = os.environ.get('NEO4J_USER', 'neo4j')
password = os.environ.get('NEO4J_PASSWORD', 'password')

driver = GraphDatabase.driver(uri, auth=(user, password))

with driver.session() as session:
    print("AIResponse node details:")
    result = session.run('MATCH (n:AIResponse) RETURN n')
    for record in result:
        node = record["n"]
        print(f"Node properties: {dict(node.items())}")
        print(f"Node labels: {list(node.labels)}")
        print(f"Node elementId: {node.element_id}")

driver.close()
