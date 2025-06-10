#!/usr/bin/env python3
"""
Simple query to check if nodes have the name "A"
"""
import os
import sys
from neo4j import GraphDatabase

def check_node_names():
    """Check if nodes have the name A"""
    
    # Use environment variables or defaults
    uri = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
    user = os.environ.get("NEO4J_USER", "neo4j")
    password = os.environ.get("NEO4J_PASSWORD", "password")
    
    try:
        driver = GraphDatabase.driver(uri, auth=(user, password))
        
        with driver.session() as session:
            print("CHECKING IF NODES HAVE NAME 'A':")
            print("-" * 40)
            
            # Count nodes with name = 'A'
            result = session.run("MATCH (n) WHERE n.name = 'A' RETURN labels(n) as labels, count(n) as count")
            total_a_nodes = 0
            for record in result:
                labels_list = record['labels']
                count = record['count']
                total_a_nodes += count
                print(f"Nodes with name='A': {labels_list} ({count} nodes)")
            
            print(f"\nTotal nodes with name='A': {total_a_nodes}")
            
            # Count total nodes
            result = session.run("MATCH (n) RETURN count(n) as total")
            total_nodes = result.single()['total']
            print(f"Total nodes in database: {total_nodes}")
            
            # Sample some nodes to see their names
            print("\nSample node names:")
            result = session.run("MATCH (n) RETURN n.name as name, labels(n) as labels LIMIT 10")
            for record in result:
                name = record.get('name', 'None')
                labels = record['labels']
                print(f"  {labels}: name = '{name}'")
        
        driver.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_node_names()
