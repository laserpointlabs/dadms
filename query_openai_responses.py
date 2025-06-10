#!/usr/bin/env python3
"""
Query Neo4j to extract the actual OpenAI service response data
"""

from neo4j import GraphDatabase
import json
import sys

def query_openai_response_data():
    """Query and display the actual OpenAI service response data"""
    
    # Database connection
    uri = "bolt://localhost:7687"
    user = "neo4j"
    password = "password"
    
    try:
        driver = GraphDatabase.driver(uri, auth=(user, password))
        
        with driver.session() as session:
            print("="*80)
            print("OPENAI SERVICE RESPONSE DATA ANALYSIS")
            print("="*80)
            
            # Query for the actual response content from the OpenAI service
            print("\n1. EXTRACTING ACTUAL OPENAI RESPONSES:")
            print("-" * 60)
            
            result = session.run("""
                MATCH (t:Task)
                WHERE t.recommendation IS NOT NULL 
                RETURN t.task_name as task_name,
                       t.process_instance_id as process_id,
                       t.recommendation as recommendation_json,
                       t.processed_at as processed_at
                ORDER BY t.processed_at DESC
                LIMIT 5
            """)
            
            for i, record in enumerate(result, 1):
                print(f"\n{i}. TASK: {record['task_name']}")
                print(f"   Process ID: {record['process_id']}")
                print(f"   Processed At: {record['processed_at']}")
                print(f"   {'='*50}")
                
                # Parse the recommendation JSON
                recommendation_str = record['recommendation_json']
                try:
                    rec_data = json.loads(recommendation_str) if isinstance(recommendation_str, str) else recommendation_str
                    
                    print(f"   RESPONSE DATA STRUCTURE:")
                    print(f"   {'-'*25}")
                    for key, value in rec_data.items():
                        if key == 'response':
                            # This is the actual OpenAI response - the valuable content
                            print(f"   {key}: (OpenAI Response Content)")
                            print(f"   Length: {len(str(value))} characters")
                            if value:  # Only show if there's content
                                print(f"   Preview: {str(value)[:300]}...")
                                print(f"   {'.'*50}")
                                print(f"   FULL OPENAI RESPONSE:")
                                print(f"   {str(value)}")
                        else:
                            print(f"   {key}: {value}")
                    
                except Exception as e:
                    print(f"   Error parsing JSON: {e}")
                    print(f"   Raw data: {recommendation_str[:200]}...")
                
                print(f"\n   {'='*60}")
            
            # Check for missing response data
            print(f"\n2. CHECKING FOR EMPTY RESPONSES:")
            print("-" * 40)
            
            result = session.run("""
                MATCH (t:Task)
                WHERE t.recommendation IS NOT NULL
                RETURN t.task_name as task_name,
                       t.recommendation as rec,
                       CASE 
                         WHEN t.recommendation CONTAINS '"response":""' OR 
                              t.recommendation CONTAINS '"response": ""' 
                         THEN 'EMPTY_RESPONSE'
                         ELSE 'HAS_RESPONSE'
                       END as response_status
                ORDER BY t.processed_at DESC
            """)
            
            empty_count = 0
            total_count = 0
            
            for record in result:
                total_count += 1
                if record['response_status'] == 'EMPTY_RESPONSE':
                    empty_count += 1
                    print(f"   EMPTY: {record['task_name']}")
            
            print(f"\n   SUMMARY:")
            print(f"   Total Tasks: {total_count}")
            print(f"   Empty Responses: {empty_count}")
            print(f"   Tasks with Content: {total_count - empty_count}")
            
            if empty_count > 0:
                print(f"\n   ⚠️  WARNING: {empty_count} tasks have empty response content!")
                print(f"   This suggests the OpenAI service is not properly storing")
                print(f"   the actual AI-generated response text.")
        
        driver.close()
        
    except Exception as e:
        print(f"Error connecting to Neo4j: {e}")
        return False
    
    return True

if __name__ == "__main__":
    query_openai_response_data()
