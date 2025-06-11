#!/usr/bin/env python3
"""
Test the complete DADM workflow with enhanced semantic expansion
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.openai_service.service import OpenAIService
from src.data_persistence_manager import DataPersistenceManager
import time

def test_complete_dadm_workflow():
    """Test the complete DADM workflow with semantic expansion"""
    
    print("=== Testing Complete DADM Workflow with Semantic Expansion ===")
    
    # Initialize services
    openai_service = OpenAIService()
    persistence_manager = DataPersistenceManager()
    
    # Clear existing data for clean test
    persistence_manager.clear_graph_database()
    print("✓ Cleared existing graph data")
    
    # Test with a realistic decision scenario
    task_data = {
        "task_name": "cybersecurity_investment_decision",
        "process_instance_id": "test_cybersec_001",
        "user_input": """
        Our organization needs to decide on cybersecurity improvements. We have $500,000 budget.
        
        Context:
        - Recent increase in cyber threats targeting our industry
        - Current security systems are 5+ years old
        - Need to protect customer data and intellectual property
        - Compliance requirements for SOC2 and ISO27001
        
        Key stakeholders:
        - IT Security team wants comprehensive endpoint protection
        - Finance team concerned about ROI and ongoing costs  
        - Legal team focused on compliance and risk mitigation
        - Operations team needs minimal disruption to workflows
        
        Please provide a detailed decision analysis with alternatives and recommendations.
        """
    }
    
    print("Sending cybersecurity decision request to OpenAI...")
    
    try:
        # Process the task through OpenAI service
        response = openai_service.process_task(task_data)
        
        if response.get("success"):
            recommendation = response.get("recommendation", "")
            print(f"✓ Received OpenAI response ({len(recommendation)} characters)")
            print(f"First 200 chars: {recommendation[:200]}...")
            
            # The persistence should have been triggered automatically
            # Let's analyze what was created in the graph
            print("\n=== Analyzing Semantic Graph Results ===")
            
            # Count nodes by type
            node_counts = persistence_manager.query_graph("""
                MATCH (n)
                RETURN labels(n)[0] as node_type, count(n) as count
                ORDER BY count DESC
            """)
            
            if node_counts:
                print("Node counts by type:")
                total_nodes = 0
                for record in node_counts:
                    count = record['count']
                    node_type = record['node_type']
                    print(f"  {node_type}: {count}")
                    total_nodes += count
                
                print(f"Total nodes created: {total_nodes}")
                
                # Show recent analysis
                recent_analyses = persistence_manager.query_graph("""
                    MATCH (a:Analysis)
                    RETURN a.task_name as task, a.created_at as created, a.id as id
                    ORDER BY a.created_at DESC
                    LIMIT 5
                """)
                
                if recent_analyses:
                    print(f"\nRecent analyses:")
                    for analysis in recent_analyses:
                        print(f"  - {analysis['task']} ({analysis['id'][:8]}...)")
                
                # Show stakeholder extraction
                stakeholder_values = persistence_manager.query_graph("""
                    MATCH (s:Stakeholder)-[:HAS_PROPERTY]->(v:Value)
                    WHERE v.key CONTAINS 'name'
                    RETURN v.value as stakeholder_name
                    LIMIT 10
                """)
                
                if stakeholder_values:
                    print(f"\nExtracted stakeholders:")
                    for stakeholder in stakeholder_values:
                        print(f"  - {stakeholder['stakeholder_name']}")
                
                # Show criteria extraction
                criteria_values = persistence_manager.query_graph("""
                    MATCH (c:Criterion)-[:HAS_PROPERTY]->(v:Value)
                    WHERE v.key CONTAINS 'name'
                    RETURN v.value as criterion_name
                    LIMIT 10
                """)
                
                if criteria_values:
                    print(f"\nExtracted criteria:")
                    for criterion in criteria_values:
                        print(f"  - {criterion['criterion_name']}")
                
                # Show decision traceability
                analysis_paths = persistence_manager.query_graph("""
                    MATCH path = (a:Analysis)-[*1..3]->(n)
                    WHERE a.task_name CONTAINS 'cybersecurity'
                    RETURN length(path) as depth, count(*) as paths
                    ORDER BY depth
                """)
                
                if analysis_paths:
                    print(f"\nDecision traceability paths:")
                    for path in analysis_paths:
                        print(f"  Depth {path['depth']}: {path['paths']} connections")
                
                print(f"\n=== Workflow Test Results ===")
                print(f"✓ OpenAI integration: {'SUCCESS' if response.get('success') else 'FAILED'}")
                print(f"✓ Automatic persistence: {'SUCCESS' if total_nodes > 0 else 'FAILED'}")
                print(f"✓ Semantic expansion: {'SUCCESS' if total_nodes > 10 else 'FAILED'}")
                print(f"✓ Stakeholder extraction: {'SUCCESS' if stakeholder_values else 'PARTIAL'}")
                print(f"✓ Decision traceability: {'SUCCESS' if analysis_paths else 'PARTIAL'}")
                
            else:
                print("✗ No nodes found in graph database")
                
        else:
            error_msg = response.get("error", "Unknown error")
            print(f"✗ OpenAI service failed: {error_msg}")
            
    except Exception as e:
        print(f"✗ Error in workflow test: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Cleanup
        persistence_manager.close()
        print("\n=== Complete Workflow Test Complete ===")

if __name__ == "__main__":
    test_complete_dadm_workflow()
