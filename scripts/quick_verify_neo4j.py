#!/usr/bin/env python3
"""
Quick verification of what's actually stored in Neo4j
"""

import logging
from src.data_persistence_manager import DataPersistenceManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def quick_verify():
    dpm = DataPersistenceManager()
    
    # Simple query to see what's actually stored
    query = """
    MATCH (n) 
    RETURN n.name as name, labels(n) as labels, n.key as key
    LIMIT 10
    """
    
    results = dpm.query_graph(query)
    
    print("=== WHAT'S ACTUALLY IN NEO4J ===")
    for i, result in enumerate(results):
        print(f"{i+1}. Label: {result['labels'][0] if result['labels'] else 'None'}")
        print(f"   Name: '{result['name']}'")
        print(f"   Key: '{result['key']}'")
        print()
    
    dpm.close()

if __name__ == "__main__":
    quick_verify()
