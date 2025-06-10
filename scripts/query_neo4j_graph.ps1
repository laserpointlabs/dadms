# PowerShell script to query Neo4j graph structure
# This script will examine the current graph to identify node naming issues

# Set up environment variables (adjust these if your Neo4j setup is different)
$env:NEO4J_URI = if ($env:NEO4J_URI) { $env:NEO4J_URI } else { "bolt://localhost:7687" }
$env:NEO4J_USER = if ($env:NEO4J_USER) { $env:NEO4J_USER } else { "neo4j" }
$env:NEO4J_PASSWORD = if ($env:NEO4J_PASSWORD) { $env:NEO4J_PASSWORD } else { "password" }

Write-Host "Querying Neo4j graph structure..." -ForegroundColor Green
Write-Host "URI: $env:NEO4J_URI" -ForegroundColor Yellow
Write-Host "User: $env:NEO4J_USER" -ForegroundColor Yellow

# Run Python script to query the graph
python -c @"
import os
from neo4j import GraphDatabase

# Get connection details from environment
uri = os.environ.get('NEO4J_URI', 'bolt://localhost:7687')
user = os.environ.get('NEO4J_USER', 'neo4j')
password = os.environ.get('NEO4J_PASSWORD', 'password')

try:
    driver = GraphDatabase.driver(uri, auth=(user, password))
    
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
            count_result = session.run(f'MATCH (n:{label}) RETURN count(n) as count')
            count = count_result.single()['count']
            print(f'{label}: {count} nodes')
        print()
        
        # Get relationship types
        print('RELATIONSHIP TYPES:')
        print('-' * 20)
        result = session.run('CALL db.relationshipTypes() YIELD relationshipType RETURN relationshipType')
        for record in result:
            rel_type = record['relationshipType']
            count_result = session.run(f'MATCH ()-[r:{rel_type}]->() RETURN count(r) as count')
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
            print(f'  Description: {description[:100]}...' if description and len(str(description)) > 100 else f'  Description: {description}')
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
            print(f'  Name: {name}')
            print(f'  Response Text: {str(response_text)[:200]}...' if response_text and len(str(response_text)) > 200 else f'  Response Text: {response_text}')
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
        
        print()
        print('=' * 60)
        
    driver.close()
    
except Exception as e:
    print(f'Error connecting to Neo4j: {e}')
    exit(1)
"@

Write-Host "`nGraph structure analysis complete!" -ForegroundColor Green
