#!/usr/bin/env python3
"""
Query Neo4j Graph Structure

This script analyzes the current Neo4j graph to identify node naming issues
and examine the structure created by DADM.
"""
import os
import sys
import logging
from neo4j import GraphDatabase

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def analyze_graph_structure(driver):
    """Analyze the Neo4j graph structure and identify issues"""
    
    with driver.session() as session:
        print('=' * 60)
        print('NEO4J GRAPH STRUCTURE ANALYSIS')
        print('=' * 60)
        
        # Count total nodes and relationships
        result = session.run('MATCH (n) RETURN count(n) as node_count')
        node_count = result.single()['node_count']
        
        result = session.run('MATCH ()-[r]->() RETURN count(r) as rel_count')
        rel_count = result.single()['rel_count']
        
        print(f'Total Nodes: {node_count}')
        print(f'Total Relationships: {rel_count}')
        print()
        
        # Get node labels and counts
        print('NODE LABELS AND COUNTS:')
        print('-' * 30)
        result = session.run('CALL db.labels() YIELD label RETURN label')
        labels = [record['label'] for record in result]
        
        for label in labels:
            count_result = session.run(f'MATCH (n:`{label}`) RETURN count(n) as count')
            count = count_result.single()['count']
            print(f'{label}: {count} nodes')
        print()
        
        # Get relationship types
        print('RELATIONSHIP TYPES:')
        print('-' * 20)
        result = session.run('CALL db.relationshipTypes() YIELD relationshipType RETURN relationshipType')
        for record in result:
            rel_type = record['relationshipType']
            count_result = session.run(f'MATCH ()-[r:`{rel_type}`]->() RETURN count(r) as count')
            count = count_result.single()['count']
            print(f'{rel_type}: {count} relationships')
        print()
        
        # Sample nodes to see naming issues
        print('SAMPLE NODES (showing name property issues):')
        print('-' * 45)
        
        # Check Task nodes
        print('TASK NODES:')
        result = session.run('MATCH (n:Task) RETURN n.name as name, n.task_name as task_name, n.description as description LIMIT 5')
        for record in result:
            name = record.get('name', 'None')
            task_name = record.get('task_name', 'None')
            description = record.get('description', 'None')
            print(f'  Name: {name}')
            print(f'  Task Name: {task_name}')
            desc_preview = str(description)[:100] + '...' if description and len(str(description)) > 100 else str(description)
            print(f'  Description: {desc_preview}')
            print()
        
        # Check Analysis nodes
        print('ANALYSIS NODES:')
        result = session.run('MATCH (n:Analysis) RETURN n.name as name, n.methodology as methodology LIMIT 5')
        for record in result:
            name = record.get('name', 'None')
            methodology = record.get('methodology', 'None')
            print(f'  Name: {name}')
            print(f'  Methodology: {methodology}')
            print()
        
        # Check Recommendation nodes  
        print('RECOMMENDATION NODES:')
        result = session.run('MATCH (n:Recommendation) RETURN n.name as name, n.response_text as response_text LIMIT 3')
        for record in result:
            name = record.get('name', 'None')
            response_text = record.get('response_text', 'None')
            response_preview = str(response_text)[:200] + '...' if response_text and len(str(response_text)) > 200 else str(response_text)
            print(f'  Name: {name}')
            print(f'  Response Text: {response_preview}')
            print()
        
        # Check for nodes with 'str' or blank names
        print('NODES WITH PROBLEMATIC NAMES:')
        print('-' * 32)
        
        # Nodes with name = 'str'
        result = session.run("MATCH (n) WHERE n.name = 'str' RETURN labels(n) as labels, count(n) as count")
        for record in result:
            labels_list = record['labels']
            count = record['count']
            print(f"Nodes with name='str': {labels_list} ({count} nodes)")
        
        # Nodes with blank/null names
        result = session.run("MATCH (n) WHERE n.name IS NULL OR n.name = '' RETURN labels(n) as labels, count(n) as count")
        for record in result:
            labels_list = record['labels']
            count = record['count']
            print(f"Nodes with blank/null name: {labels_list} ({count} nodes)")
        
        # Check for JSON data in response_text
        print()
        print('JSON RESPONSE ANALYSIS:')
        print('-' * 25)
        
        # Look for recommendations with JSON response_text
        result = session.run("""
            MATCH (n:Recommendation) 
            WHERE n.response_text IS NOT NULL 
            AND (n.response_text CONTAINS '{' OR n.response_text CONTAINS 'task_type')
            RETURN n.name as name, length(n.response_text) as length, 
                   substring(n.response_text, 0, 100) as preview
            LIMIT 5
        """)
        
        for record in result:
            name = record.get('name', 'None')
            length = record.get('length', 0)
            preview = record.get('preview', '')
            print(f"  Name: {name}")
            print(f"  Length: {length} characters")
            print(f"  Preview: {preview}...")
            print()
        
        print('=' * 60)

def main():
    """Main function to connect to Neo4j and analyze the graph"""
    
    # Use environment variables or defaults (same as the main system)
    uri = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
    user = os.environ.get("NEO4J_USER", "neo4j")
    password = os.environ.get("NEO4J_PASSWORD", "password")
    
    print(f"Connecting to Neo4j...")
    print(f"URI: {uri}")
    print(f"User: {user}")
    print()
    
    try:
        driver = GraphDatabase.driver(uri, auth=(user, password))
        
        # Test connection
        with driver.session() as session:
            session.run("RETURN 1")
        
        print("✅ Connected successfully to Neo4j")
        print()
        
        # Analyze the graph structure
        analyze_graph_structure(driver)
        
        driver.close()
        print("✅ Analysis complete!")
        
    except Exception as e:
        print(f"❌ Error connecting to Neo4j: {e}")
        print("\nMake sure Neo4j is running and the connection details are correct.")
        print("You can set environment variables:")
        print("  NEO4J_URI=bolt://localhost:7687")
        print("  NEO4J_USER=neo4j") 
        print("  NEO4J_PASSWORD=your_password")
        sys.exit(1)

if __name__ == "__main__":
    main()
