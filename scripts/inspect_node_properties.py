#!/usr/bin/env python3
"""
Simple test to check what's actually in the Neo4j database
"""
import os
from neo4j import GraphDatabase
import json

# Connect to Neo4j
uri = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
user = os.environ.get("NEO4J_USER", "neo4j")
password = os.environ.get("NEO4J_PASSWORD", "password")

driver = GraphDatabase.driver(uri, auth=(user, password))

with driver.session() as session:
    print("=== ANALYSIS NODES ===")
    result = session.run("MATCH (n:Analysis) RETURN n")
    for record in result:
        node = record['n']
        print(f"ID: {node.get('id', 'N/A')}")
        print(f"Name: {node.get('name', 'N/A')}")
        print(f"Task Name: {node.get('task_name', 'N/A')}")
        print(f"Status: {node.get('status', 'N/A')}")
        print(f"Response Data Length: {len(node.get('response_data', ''))}")
        print()
    
    print("=== SAMPLE STAKEHOLDER NODES ===")
    result = session.run("MATCH (n:Stakeholder) RETURN n LIMIT 3")
    for record in result:
        node = record['n']
        print(f"ID: {node.get('id', 'N/A')}")
        print(f"Name: {node.get('name', 'N/A')}")
        print(f"Key: {node.get('key', 'N/A')}")
        print(f"All Properties: {dict(node)}")
        print()
    
    print("=== SAMPLE CRITERION NODES ===")
    result = session.run("MATCH (n:Criterion) RETURN n LIMIT 3")
    for record in result:
        node = record['n']
        print(f"ID: {node.get('id', 'N/A')}")
        print(f"Name: {node.get('name', 'N/A')}")
        print(f"Key: {node.get('key', 'N/A')}")
        print(f"All Properties: {dict(node)}")
        print()
    
    print("=== SAMPLE VALUE NODES ===")
    result = session.run("MATCH (n:Value) RETURN n LIMIT 3")
    for record in result:
        node = record['n']
        print(f"ID: {node.get('id', 'N/A')}")
        print(f"Name: {node.get('name', 'N/A')}")
        print(f"Key: {node.get('key', 'N/A')}")
        print(f"Value: {node.get('value', 'N/A')}")
        print(f"All Properties: {dict(node)}")
        print()

driver.close()
print("✅ Analysis complete!")
