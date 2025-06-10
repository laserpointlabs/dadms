#!/usr/bin/env python3
"""
Simple Neo4j query to check what data was actually stored
"""
import os
import sys
from neo4j import GraphDatabase

def check_stored_data():
    """Check what data was actually stored in Neo4j"""
    
    uri = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
    user = os.environ.get("NEO4J_USER", "neo4j")
    password = os.environ.get("NEO4J_PASSWORD", "password")
    
    try:
        driver = GraphDatabase.driver(uri, auth=(user, password))
        
        with driver.session() as session:
            print("="*60)
            print("CHECKING ACTUAL DATA STORED")
            print("="*60)
            
            # Check if our improved Analysis node worked
            print("\nANALYSIS NODE PROPERTIES:")
            result = session.run("MATCH (a:Analysis) RETURN properties(a) as props LIMIT 1")
            for record in result:
                props = record['props']
                print(f"  Properties: {props}")
                print(f"  Has name property: {'name' in props}")
                if 'name' in props:
                    print(f"  Name value: {props['name']}")
            
            # Check Value nodes
            print("\nSAMPLE VALUE NODE PROPERTIES:")
            result = session.run("MATCH (v:Value) RETURN properties(v) as props LIMIT 3")
            for i, record in enumerate(result):
                props = record['props']
                print(f"  Value {i+1}: {props}")
            
            # Check Recommendation nodes
            print("\nRECOMMENDATION NODE PROPERTIES:")
            result = session.run("MATCH (r:Recommendation) RETURN properties(r) as props LIMIT 2")
            for i, record in enumerate(result):
                props = record['props']
                print(f"  Recommendation {i+1}: {props}")
            
            # Check for any nodes that DO have name properties
            print("\nNODES WITH NAME PROPERTIES:")
            result = session.run("MATCH (n) WHERE n.name IS NOT NULL RETURN labels(n) as labels, n.name as name LIMIT 10")
            nodes_with_names = list(result)
            if nodes_with_names:
                for record in nodes_with_names:
                    print(f"  {record['labels']}: {record['name']}")
            else:
                print("  No nodes found with name properties")
            
            # Check if our JSON expansion worked by looking for the recommendation data structure
            print("\nRECOMMENDATION JSON EXPANSION CHECK:")
            result = session.run("""
                MATCH (a:Analysis) 
                WHERE a.response_data IS NOT NULL 
                RETURN a.response_data as response_data LIMIT 1
            """)
            
            for record in result:
                response_data = record['response_data']
                print(f"  Found response_data: {str(response_data)[:200]}...")
            
            # Check for expanded RECOMMENDATION nodes
            print("\nEXPANDED RECOMMENDATION STRUCTURE:")
            result = session.run("""
                MATCH (a:Analysis)-[:HAS_RECOMMENDATION]->(r)
                RETURN labels(r) as labels, properties(r) as props
                LIMIT 5
            """)
            
            for record in result:
                labels = record['labels']
                props = record['props']
                print(f"  Node: {labels}")
                print(f"    Properties: {props}")
            
        driver.close()
        print("\n" + "="*60)
        
    except Exception as e:
        print(f"Error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    check_stored_data()
