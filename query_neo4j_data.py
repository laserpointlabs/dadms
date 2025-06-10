#!/usr/bin/env python3
"""
Query Neo4j database to examine stored DADM data
"""

from neo4j import GraphDatabase
import json
import sys
from datetime import datetime

def query_neo4j_data():
    """Query and display Neo4j data for DADM"""
    
    # Database connection
    uri = "bolt://localhost:7687"
    user = "neo4j"
    password = "password"
    
    try:
        driver = GraphDatabase.driver(uri, auth=(user, password))
        
        with driver.session() as session:
            print("="*80)
            print("NEO4J DATABASE ANALYSIS - DADM DECISION PROCESS DATA")
            print("="*80)
            
            # 1. Overview - count nodes and relationships
            print("\n1. DATABASE OVERVIEW:")
            print("-" * 40)
            
            result = session.run("MATCH (n) RETURN labels(n) as labels, count(n) as count")
            for record in result:
                print(f"  {record['labels']}: {record['count']} nodes")
                
            result = session.run("MATCH ()-[r]->() RETURN type(r) as rel_type, count(r) as count")
            for record in result:
                print(f"  {record['rel_type']}: {record['count']} relationships")
            
            # 2. Run information
            print("\n2. RUNS:")
            print("-" * 40)
            result = session.run("""
                MATCH (r:Run) 
                RETURN r.run_id as run_id, r.created_at as created_at, 
                       r.decision_context as decision_context
                ORDER BY r.created_at DESC
                LIMIT 5
            """)
            for record in result:
                print(f"  Run ID: {record['run_id']}")
                print(f"    Created: {record['created_at']}")
                print(f"    Context: {record['decision_context'][:100]}..." if record['decision_context'] else "    Context: None")
                print()
            
            # 3. Process instances
            print("\n3. PROCESS INSTANCES:")
            print("-" * 40)
            result = session.run("""
                MATCH (p:ProcessInstance)
                RETURN p.process_instance_id as pid, p.created_at as created_at
                ORDER BY p.created_at DESC
                LIMIT 5
            """)
            for record in result:
                print(f"  Process Instance: {record['pid']}")
                print(f"    Created: {record['created_at']}")
                print()
            
            # 4. Tasks and their data
            print("\n4. TASKS AND RECOMMENDATIONS:")
            print("-" * 40)
            result = session.run("""
                MATCH (t:Task)
                RETURN t.task_name as task_name, 
                       t.process_instance_id as pid,
                       t.assistant_id as assistant_id,
                       t.thread_id as thread_id,
                       t.processed_at as processed_at,
                       t.recommendation as recommendation
                ORDER BY t.processed_at DESC
                LIMIT 10
            """)
            
            for record in result:
                print(f"  Task: {record['task_name']}")
                print(f"    Process Instance: {record['pid']}")
                print(f"    Assistant ID: {record['assistant_id']}")
                print(f"    Thread ID: {record['thread_id']}")
                print(f"    Processed At: {record['processed_at']}")
                
                # Parse and display recommendation JSON
                recommendation = record['recommendation']
                if recommendation:
                    try:
                        rec_data = json.loads(recommendation) if isinstance(recommendation, str) else recommendation
                        print(f"    Recommendation Keys: {list(rec_data.keys()) if isinstance(rec_data, dict) else 'Not a dict'}")
                        
                        # Show the actual response if it exists
                        if isinstance(rec_data, dict) and 'response' in rec_data:
                            response_text = rec_data['response']
                            print(f"    Response Preview: {response_text[:200]}..." if len(response_text) > 200 else f"    Response: {response_text}")
                        
                        print(f"    Full Recommendation Data:")
                        print(f"      {json.dumps(rec_data, indent=6)[:500]}...")
                        
                    except Exception as e:
                        print(f"    Recommendation (raw): {str(recommendation)[:100]}...")
                        print(f"    Error parsing JSON: {e}")
                else:
                    print(f"    Recommendation: None")
                print()
            
            # 5. Recommendation node structure
            print("\n5. RECOMMENDATION NODE STRUCTURE:")
            print("-" * 40)
            result = session.run("""
                MATCH (r:RecommendationNode)
                RETURN r.task_name as task_name, r.key as key, r.node_id as node_id
                LIMIT 20
            """)
            
            recommendation_structure = {}
            for record in result:
                task_name = record['task_name']
                key = record['key']
                if task_name not in recommendation_structure:
                    recommendation_structure[task_name] = []
                if key:
                    recommendation_structure[task_name].append(key)
            
            for task, keys in recommendation_structure.items():
                print(f"  Task: {task}")
                print(f"    Keys: {', '.join(set(keys))}")
                print()
            
            # 6. Data flow relationships
            print("\n6. DATA FLOW ANALYSIS:")
            print("-" * 40)
            result = session.run("""
                MATCH (r:Run)-[:EXECUTED_PROCESS]->(p:ProcessInstance)-[:HAS_TASK]->(t:Task)
                RETURN r.run_id as run_id, p.process_instance_id as pid, 
                       collect(t.task_name) as task_names
                LIMIT 5
            """)
            
            for record in result:
                print(f"  Run: {record['run_id']}")
                print(f"    Process: {record['pid']}")
                print(f"    Tasks: {', '.join(record['task_names'])}")
                print()
                
        driver.close()
        
    except Exception as e:
        print(f"Error connecting to Neo4j: {e}")
        return False
    
    return True

if __name__ == "__main__":
    query_neo4j_data()
