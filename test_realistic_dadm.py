#!/usr/bin/env python3
"""
Test Persistence Manager with Realistic DADM Data

Test the persistence manager with the exact data structure that would come from a DADM run.
"""

import sys
import os
import json

# Add project root to path
project_root = os.path.dirname(__file__)
sys.path.insert(0, project_root)

from src.data_persistence_manager import DataPersistenceManager

def test_realistic_dadm_data():
    """Test with realistic DADM data structure"""
    
    print("=== TESTING PERSISTENCE MANAGER WITH REALISTIC DADM DATA ===")
    
    # This is the actual structure we'd get from a successful DADM task
    realistic_task_data = {
        "task_name": "IdentifyAlternatives",
        "assistant_id": "asst_test",
        "thread_id": "thread_test", 
        "processed_at": "2025-06-10T16:00:00",
        "processed_by": "OpenAI Assistant Service",
        "recommendation": {
            "alternatives": [
                {
                    "name": "DJI Matrice 300 RTK",
                    "description": "Professional drone for disaster response",
                    "specifications": {
                        "flight_time": "55 minutes",
                        "payload_capacity": "2.7 kg",
                        "weather_resistance": "IP45"
                    },
                    "cost": "$12,000-$14,000",
                    "strengths": ["Outstanding endurance", "Flexibility", "Robust"],
                    "limitations": ["High cost", "Requires skilled operators"]
                },
                {
                    "name": "Parrot Anafi USA", 
                    "description": "Compact rapid-deployment drone",
                    "specifications": {
                        "flight_time": "32 minutes",
                        "payload_capacity": "Integrated system",
                        "weather_resistance": "Light rain/wind"
                    },
                    "cost": "$7,000-$9,500",
                    "strengths": ["Quick deployment", "Cost-effective", "Easy to use"],
                    "limitations": ["Limited payload flexibility", "Reduced flight duration"]
                }
            ],
            "evaluation_criteria": [
                {
                    "name": "Cost Effectiveness",
                    "weight": 0.3,
                    "description": "Total cost of ownership including purchase and operation"
                },
                {
                    "name": "Performance Capability", 
                    "weight": 0.4,
                    "description": "Flight time, payload capacity, weather resistance"
                },
                {
                    "name": "Deployment Speed",
                    "weight": 0.3,
                    "description": "Time required to deploy and operate in emergency"
                }
            ],
            "stakeholders": [
                {
                    "name": "Emergency Response Teams",
                    "role": "Primary users",
                    "requirements": ["Quick deployment", "Reliable operation", "Easy training"]
                },
                {
                    "name": "Budget Authority",
                    "role": "Financial approval",
                    "requirements": ["Cost justification", "ROI analysis", "Maintenance costs"]
                }
            ],
            "recommendation_summary": "Based on analysis, recommend DJI Matrice 300 RTK for primary operations with Parrot Anafi USA as backup for rapid deployment scenarios.",
            "risk_factors": [
                {
                    "risk": "Weather limitations",
                    "impact": "Medium",
                    "mitigation": "Multiple platform types for different conditions"
                },
                {
                    "risk": "Training requirements",
                    "impact": "High", 
                    "mitigation": "Comprehensive training program and certification"
                }
            ]
        }
    }
    
    print("Creating DataPersistenceManager...")
    pm = DataPersistenceManager()
    
    print("Storing interaction with realistic data...")
    success = pm.store_interaction(
        run_id="test_run_realistic",
        process_instance_id="test_process_realistic",
        task_data=realistic_task_data,
        decision_context="Emergency disaster response UAS selection"
    )
    
    print(f"Storage result: {success}")
    
    if success:
        print("\n=== QUERYING RESULTS ===")
        
        # Get all node types and counts
        print("\n1. Node Types:")
        results = pm.query_graph("MATCH (n) RETURN labels(n) as labels, count(n) as count ORDER BY count DESC")
        for result in results:
            print(f"  {result['labels']}: {result['count']}")
        
        # Get all relationship types
        print("\n2. Relationship Types:")
        results = pm.query_graph("MATCH ()-[r]->() RETURN type(r) as rel_type, count(r) as count ORDER BY count DESC")
        for result in results:
            print(f"  {result['rel_type']}: {result['count']}")
        
        # Get semantic structure
        print("\n3. Sample Semantic Paths:")
        results = pm.query_graph("""
            MATCH (a:Analysis)-[r1]->(n1)-[r2]->(n2)
            RETURN a.task_name, type(r1) as rel1, labels(n1) as node1, type(r2) as rel2, labels(n2) as node2
            LIMIT 10
        """)
        for result in results:
            print(f"  {result['a.task_name']}: -[{result['rel1']}]-> {result['node1']} -[{result['rel2']}]-> {result['node2']}")
        
        # Get specific alternative data
        print("\n4. Alternatives Found:")
        results = pm.query_graph("""
            MATCH (alt:Alternative)
            WHERE alt.key CONTAINS 'alternatives_item'
            RETURN alt.key, alt.id
        """)
        for result in results:
            print(f"  Alternative: {result['alt.key']}")
            
        # Get stakeholder data
        print("\n5. Stakeholders Found:")
        results = pm.query_graph("""
            MATCH (s:Stakeholder)
            RETURN s.key, s.id
        """)
        for result in results:
            print(f"  Stakeholder: {result['s.key']}")
            
        # Get cost data
        print("\n6. Cost Information:")
        results = pm.query_graph("""
            MATCH (c:Cost)
            RETURN c.key, c.id
        """)
        for result in results:
            print(f"  Cost: {result['c.key']}")
    
    else:
        print("❌ Failed to store data!")
    
    pm.close()

if __name__ == "__main__":
    test_realistic_dadm_data()
