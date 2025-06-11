#!/usr/bin/env python3
"""
Test the simplified data persistence manager directly
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from src.data_persistence_manager import DataPersistenceManager
import json

def test_simple_expansion():
    print("Testing simplified data persistence manager...")
    
    # Initialize the manager
    manager = DataPersistenceManager()
    
    # Test data - simple JSON structure
    test_data = {
        "task_name": "TestTask",
        "recommendation": {
            "stakeholders": ["John", "Mary", "Bob"],
            "alternatives": [
                {"name": "Option A", "cost": 1000},
                {"name": "Option B", "cost": 1500}
            ],
            "criteria": {
                "cost": "minimize",
                "risk": "low"
            }
        }
    }
    
    print(f"Test data: {json.dumps(test_data, indent=2)}")
    
    # Test the store_interaction method
    print("\n🔄 Testing store_interaction...")
    success = manager.store_interaction(
        run_id="test_run_001", 
        process_instance_id="test_process_001",
        task_data=test_data
    )
    
    print(f"Store interaction result: {success}")
    
    # Query the results
    print("\n🔍 Querying results...")
    
    # Check all nodes
    all_nodes = manager.query_graph("MATCH (n) RETURN labels(n) as labels, properties(n) as props LIMIT 20")
    print(f"Total nodes created: {len(all_nodes)}")
    
    for i, node in enumerate(all_nodes):
        print(f"  Node {i+1}: {node['labels']} - {node['props'].get('key', 'N/A')}")
    
    # Check relationships
    all_rels = manager.query_graph("MATCH ()-[r]->() RETURN type(r) as rel_type, count(*) as count")
    print(f"\nRelationships created:")
    for rel in all_rels:
        print(f"  {rel['rel_type']}: {rel['count']}")
    
    # Check semantic structure
    semantic_query = """
    MATCH (a:Analysis)-[:HAS_OUTPUT]->(r:Recommendation)
    OPTIONAL MATCH (r)-[:INVOLVES_STAKEHOLDER]->(s:Stakeholder)
    OPTIONAL MATCH (r)-[:HAS_ALTERNATIVE]->(alt:Alternative)
    RETURN a.task_name, r.key, 
           collect(DISTINCT s.key) as stakeholders,
           collect(DISTINCT alt.key) as alternatives
    """
    
    semantic_results = manager.query_graph(semantic_query)
    print(f"\nSemantic structure:")
    for result in semantic_results:
        print(f"  Task: {result.get('a.task_name')}")
        print(f"  Recommendation: {result.get('r.key')}")
        print(f"  Stakeholders: {result.get('stakeholders')}")
        print(f"  Alternatives: {result.get('alternatives')}")
    
    manager.close()
    print("\n✅ Test completed!")

if __name__ == "__main__":
    test_simple_expansion()
