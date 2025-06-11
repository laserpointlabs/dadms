#!/usr/bin/env python3
"""
Test Neo4j MCP Service with Real Data

This script:
1. Creates test data in Neo4j database
2. Tests the MCP Neo4j service with real data
3. Verifies the service can handle both real and mock scenarios
"""

import os
import sys
import json
import logging
import requests
import time
from datetime import datetime
from neo4j import GraphDatabase

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Configuration
NEO4J_URI = os.environ.get('NEO4J_URI', 'bolt://localhost:7687')
NEO4J_USER = os.environ.get('NEO4J_USER', 'neo4j')
NEO4J_PASSWORD = os.environ.get('NEO4J_PASSWORD', 'password')
MCP_NEO4J_SERVICE_URL = "http://localhost:5202"

def clear_neo4j_database(driver):
    """Clear the Neo4j database"""
    print("🧹 Clearing Neo4j database...")
    with driver.session() as session:
        session.run("MATCH (n) DETACH DELETE n")
        session.run("CALL db.clearQueryCaches()")
    print("✅ Database cleared")

def create_test_data(driver):
    """Create comprehensive test data in Neo4j"""
    print("📊 Creating test data in Neo4j...")
    
    with driver.session() as session:
        # Create a simulated DADM decision process with realistic data
        
        # 1. Create Run node
        session.run("""
            CREATE (r:Run {
                run_id: 'emergency_comms_decision_20250611',
                created_at: datetime(),
                decision_context: 'Emergency communication system procurement for wildfire response'
            })
        """)
        
        # 2. Create Task nodes
        tasks = [
            {
                'task_name': 'Stakeholder Analysis',
                'task_description': 'Analyze key stakeholders and their requirements',
                'status': 'completed'
            },
            {
                'task_name': 'Technology Assessment', 
                'task_description': 'Evaluate available communication technologies',
                'status': 'completed'
            },
            {
                'task_name': 'Cost-Benefit Analysis',
                'task_description': 'Analyze costs and benefits of different options',
                'status': 'in_progress'
            }
        ]
        
        for i, task in enumerate(tasks):
            session.run("""
                MATCH (r:Run {run_id: 'emergency_comms_decision_20250611'})
                CREATE (t:Task {
                    task_id: $task_id,
                    task_name: $task_name,
                    task_description: $task_description,
                    status: $status,
                    created_at: datetime()
                })
                CREATE (r)-[:INCLUDES_TASK]->(t)
            """, 
            task_id=f"task_{i+1}",
            task_name=task['task_name'],
            task_description=task['task_description'],
            status=task['status']
            )
        
        # 3. Create Stakeholder nodes
        stakeholders = [
            {'name': 'Fire Department', 'type': 'Primary User', 'priority': 'High'},
            {'name': 'Police Department', 'type': 'Primary User', 'priority': 'High'},
            {'name': 'Emergency Management', 'type': 'Coordinator', 'priority': 'Critical'},
            {'name': 'City Council', 'type': 'Decision Authority', 'priority': 'High'},
            {'name': 'Budget Committee', 'type': 'Financial Authority', 'priority': 'Medium'},
            {'name': 'Technical Team', 'type': 'Implementation', 'priority': 'High'},
            {'name': 'Citizens', 'type': 'Beneficiary', 'priority': 'Medium'}
        ]
        
        for stakeholder in stakeholders:
            session.run("""
                CREATE (s:Stakeholder {
                    name: $name,
                    type: $type,
                    priority: $priority,
                    influence_level: $influence
                })
            """,
            name=stakeholder['name'],
            type=stakeholder['type'],
            priority=stakeholder['priority'],
            influence=stakeholder['priority']  # Use priority as influence for simplicity
            )
        
        # 4. Create Alternative nodes (communication system options)
        alternatives = [
            {
                'name': 'P25 Digital Radio System',
                'cost': 2500000,
                'implementation_time': '18 months',
                'capacity': 'High',
                'interoperability': 'Excellent'
            },
            {
                'name': 'LTE FirstNet Solution',
                'cost': 1800000,
                'implementation_time': '12 months',
                'capacity': 'Very High',
                'interoperability': 'Good'
            },
            {
                'name': 'Hybrid P25/LTE System',
                'cost': 3200000,
                'implementation_time': '24 months',
                'capacity': 'Very High',
                'interoperability': 'Excellent'
            },
            {
                'name': 'Satellite Communication Backup',
                'cost': 800000,
                'implementation_time': '6 months',
                'capacity': 'Medium',
                'interoperability': 'Fair'
            }
        ]
        
        for alternative in alternatives:
            session.run("""
                CREATE (a:Alternative {
                    name: $name,
                    cost: $cost,
                    implementation_time: $implementation_time,
                    capacity: $capacity,
                    interoperability: $interoperability,
                    feasibility_score: $score
                })
            """,
            name=alternative['name'],
            cost=alternative['cost'],
            implementation_time=alternative['implementation_time'],
            capacity=alternative['capacity'],
            interoperability=alternative['interoperability'],
            score=alternative['cost'] / 100000  # Simple scoring
            )
        
        # 5. Create Criterion nodes
        criteria = [
            {'name': 'Cost Effectiveness', 'weight': 0.25, 'type': 'Financial'},
            {'name': 'Interoperability', 'weight': 0.30, 'type': 'Technical'},
            {'name': 'Implementation Speed', 'weight': 0.20, 'type': 'Timeline'},
            {'name': 'System Reliability', 'weight': 0.15, 'type': 'Technical'},
            {'name': 'Future Scalability', 'weight': 0.10, 'type': 'Strategic'}
        ]
        
        for criterion in criteria:
            session.run("""
                CREATE (c:Criterion {
                    name: $name,
                    weight: $weight,
                    type: $type,
                    importance: $importance
                })
            """,
            name=criterion['name'],
            weight=criterion['weight'],
            type=criterion['type'],
            importance='High' if criterion['weight'] > 0.2 else 'Medium'
            )
        
        # 6. Create Analysis and Recommendation nodes
        session.run("""
            MATCH (t:Task {task_name: 'Stakeholder Analysis'})
            CREATE (a:Analysis {
                analysis_id: 'stakeholder_analysis_001',
                name: 'Stakeholder Requirements Analysis',
                methodology: 'Structured interviews and requirements gathering',
                status: 'completed',
                created_at: datetime(),
                confidence_level: 0.85
            })
            CREATE (t)-[:GENERATES]->(a)
            
            CREATE (rec:Recommendation {
                recommendation_id: 'rec_stakeholder_001',
                name: 'Stakeholder Communication Requirements',
                priority: 'High',
                implementation_phase: 'Phase 1',
                created_at: datetime()
            })
            CREATE (a)-[:PRODUCES]->(rec)
        """)
        
        # 7. Create relationships between entities
          # Stakeholder interests in alternatives
        preferences = [
            ('Fire Department', 'P25 Digital Radio System', 'Strong', 'Familiar technology'),
            ('Emergency Management', 'Hybrid P25/LTE System', 'Strong', 'Best of both worlds'),
            ('Budget Committee', 'LTE FirstNet Solution', 'Medium', 'Lower cost option')
        ]
        
        for stakeholder, alternative, strength, reason in preferences:
            session.run("""
                MATCH (s:Stakeholder {name: $stakeholder}), (a:Alternative {name: $alternative})
                CREATE (s)-[:PREFERS {strength: $strength, reason: $reason}]->(a)
            """, stakeholder=stakeholder, alternative=alternative, strength=strength, reason=reason)
          # Alternative evaluations against criteria
        evaluations = [
            ('P25 Digital Radio System', 'Interoperability', 9.0, 'Excellent interoperability with existing systems'),
            ('LTE FirstNet Solution', 'Cost Effectiveness', 8.5, 'Good balance of cost and features'),
            ('Hybrid P25/LTE System', 'Future Scalability', 9.5, 'Highest scalability potential')
        ]
        
        for alternative, criterion, value, justification in evaluations:
            session.run("""
                MATCH (a:Alternative {name: $alternative}), (c:Criterion {name: $criterion})
                CREATE (a)-[:SCORES {value: $value, justification: $justification}]->(c)
            """, alternative=alternative, criterion=criterion, value=value, justification=justification)
          # Stakeholder influences
        influences = [
            ('Emergency Management', 'Fire Department', 'High', 'Coordination'),
            ('City Council', 'Budget Committee', 'High', 'Authority')
        ]
        
        for influencer, influenced, level, relationship in influences:
            session.run("""
                MATCH (s1:Stakeholder {name: $influencer}), (s2:Stakeholder {name: $influenced})
                CREATE (s1)-[:INFLUENCES {level: $level, relationship: $relationship}]->(s2)
            """, influencer=influencer, influenced=influenced, level=level, relationship=relationship)
          # Task dependencies
        dependencies = [
            ('Stakeholder Analysis', 'Technology Assessment', 'Information flow'),
            ('Technology Assessment', 'Cost-Benefit Analysis', 'Input required')
        ]
        
        for task1, task2, dep_type in dependencies:
            session.run("""
                MATCH (t1:Task {task_name: $task1}), (t2:Task {task_name: $task2})
                CREATE (t1)-[:PRECEDES {dependency_type: $dep_type}]->(t2)
            """, task1=task1, task2=task2, dep_type=dep_type)
    
    print("✅ Test data created successfully")

def verify_data_creation(driver):
    """Verify the test data was created correctly"""
    print("🔍 Verifying data creation...")
    
    with driver.session() as session:
        # Count nodes by type
        result = session.run("""
            MATCH (n)
            RETURN labels(n)[0] as node_type, count(n) as count
            ORDER BY count DESC
        """)
        
        node_counts = {}
        total_nodes = 0
        
        for record in result:
            node_type = record['node_type']
            count = record['count']
            node_counts[node_type] = count
            total_nodes += count
            print(f"  {node_type}: {count} nodes")
        
        # Count relationships
        result = session.run("""
            MATCH ()-[r]->()
            RETURN type(r) as relationship_type, count(r) as count
            ORDER BY count DESC
        """)
        
        relationship_counts = {}
        total_relationships = 0
        
        print("\nRelationships:")
        for record in result:
            rel_type = record['relationship_type']
            count = record['count']
            relationship_counts[rel_type] = count
            total_relationships += count
            print(f"  {rel_type}: {count} relationships")
        
        print(f"\n📊 Total: {total_nodes} nodes, {total_relationships} relationships")
        
        return {
            "total_nodes": total_nodes,
            "total_relationships": total_relationships,
            "node_counts": node_counts,
            "relationship_counts": relationship_counts
        }

def test_mcp_service_health():
    """Test the MCP service health endpoint"""
    print("🏥 Testing MCP service health...")
    
    try:
        response = requests.get(f"{MCP_NEO4J_SERVICE_URL}/health", timeout=10)
        response.raise_for_status()
        
        health_data = response.json()
        print(f"  Status: {health_data.get('status')}")
        print(f"  Neo4j Status: {health_data.get('neo4j_status')}")
        print(f"  Available Tools: {health_data.get('mcp_tools_available')}")
        
        return health_data.get('status') == 'healthy'
        
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_mcp_service_with_real_data():
    """Test the MCP service with various analysis types"""
    print("🧪 Testing MCP service with real data...")
    
    test_cases = [
        {
            "name": "Centrality Analysis",
            "task_data": {
                "task_name": "centrality_analysis_test",
                "task_description": "Test centrality analysis with real data",
                "variables": {
                    "analysis_type": "centrality",
                    "algorithm": "pagerank",
                    "node_labels": ["Stakeholder", "Alternative"]
                }
            }
        },
        {
            "name": "Community Detection",
            "task_data": {
                "task_name": "community_detection_test", 
                "task_description": "Test community detection with real data",
                "variables": {
                    "analysis_type": "communities",
                    "relationship_types": ["PREFERS", "INFLUENCES"]
                }
            }
        },
        {
            "name": "Graph Structure Analysis",
            "task_data": {
                "task_name": "structure_analysis_test",
                "task_description": "Test graph structure analysis with real data", 
                "variables": {
                    "analysis_type": "structure"
                }
            }
        }
    ]
    
    results = {}
    
    for test_case in test_cases:
        print(f"\n  Testing: {test_case['name']}")
        
        try:
            response = requests.post(
                f"{MCP_NEO4J_SERVICE_URL}/process_task",
                json=test_case['task_data'],
                timeout=30
            )
            response.raise_for_status()
            
            result_data = response.json()
            
            if result_data.get('status') == 'success':
                result = result_data.get('result', {})
                analysis_result = result.get('graph_analysis_results', {})
                decision_context = result.get('decision_context', {})
                
                print(f"    ✅ Success")
                print(f"    Analysis Type: {result.get('analysis_type')}")
                print(f"    Tool Used: {result.get('mcp_tool_used')}")
                print(f"    Processing Time: {result.get('processing_time_ms')}ms")
                
                # Check if we got real data from Neo4j
                if 'decision_summary' in decision_context:
                    summary = decision_context['decision_summary']
                    if any(summary.get(key, 0) > 0 for key in ['total_runs', 'total_tasks']):
                        print(f"    📊 Real data detected in decision context")
                
                results[test_case['name']] = {
                    "status": "success",
                    "result": result,
                    "response_time": response.elapsed.total_seconds()
                }
            else:
                print(f"    ❌ Failed: {result_data.get('message', 'Unknown error')}")
                results[test_case['name']] = {
                    "status": "failed",
                    "error": result_data.get('message', 'Unknown error')
                }
                
        except Exception as e:
            print(f"    ❌ Error: {e}")
            results[test_case['name']] = {
                "status": "error",
                "error": str(e)
            }
    
    return results

def test_decision_context_endpoint():
    """Test the decision context endpoint"""
    print("🎯 Testing decision context endpoint...")
    
    try:
        response = requests.get(f"{MCP_NEO4J_SERVICE_URL}/decision_context", timeout=10)
        response.raise_for_status()
        
        context_data = response.json()
        
        print(f"  Decision Summary: {context_data.get('decision_summary', {})}")
        print(f"  Graph Ready: {context_data.get('graph_ready_for_analysis', False)}")
        print(f"  Recent Runs: {len(context_data.get('recent_runs', []))}")
        
        return context_data
        
    except Exception as e:
        print(f"❌ Decision context test failed: {e}")
        return None

def save_test_results(data_stats, mcp_results, context_data):
    """Save test results to file"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f"neo4j_mcp_test_results_{timestamp}.json"
    
    test_results = {
        "timestamp": timestamp,
        "test_description": "Neo4j MCP Service Test with Real Data",
        "data_statistics": data_stats,
        "mcp_service_tests": mcp_results,
        "decision_context": context_data,
        "summary": {
            "total_tests": len(mcp_results),
            "successful_tests": len([r for r in mcp_results.values() if r.get('status') == 'success']),
            "failed_tests": len([r for r in mcp_results.values() if r.get('status') != 'success'])
        }
    }
    
    with open(results_file, 'w') as f:
        json.dump(test_results, f, indent=2, default=str)
    
    print(f"\n📋 Test results saved to: {results_file}")
    return results_file

def main():
    """Main test function"""
    print("🚀 Starting Neo4j MCP Service Test with Real Data")
    print("=" * 60)
    
    # Connect to Neo4j
    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        
        # Test connection
        with driver.session() as session:
            session.run("RETURN 1")
        
        print(f"✅ Connected to Neo4j at {NEO4J_URI}")
        
    except Exception as e:
        print(f"❌ Failed to connect to Neo4j: {e}")
        return False
    
    try:
        # Step 1: Clear and create test data
        clear_neo4j_database(driver)
        create_test_data(driver)
        data_stats = verify_data_creation(driver)
        
        print("\n" + "=" * 60)
        
        # Step 2: Test MCP service health
        if not test_mcp_service_health():
            print("❌ MCP service health check failed. Is the service running?")
            return False
        
        print("\n" + "=" * 60)
        
        # Step 3: Test MCP service functionality
        mcp_results = test_mcp_service_with_real_data()
        
        print("\n" + "=" * 60)
        
        # Step 4: Test decision context
        context_data = test_decision_context_endpoint()
        
        print("\n" + "=" * 60)
        
        # Step 5: Save results
        results_file = save_test_results(data_stats, mcp_results, context_data)
        
        # Summary
        successful_tests = len([r for r in mcp_results.values() if r.get('status') == 'success'])
        total_tests = len(mcp_results)
        
        print(f"\n🎉 Test Summary:")
        print(f"  Data Created: {data_stats['total_nodes']} nodes, {data_stats['total_relationships']} relationships")
        print(f"  MCP Tests: {successful_tests}/{total_tests} successful")
        print(f"  Results: {results_file}")
        
        if successful_tests == total_tests:
            print(f"\n✅ All tests passed! MCP Neo4j service is working correctly with real data.")
        else:
            print(f"\n⚠️ Some tests failed. Check the results file for details.")
        
        return successful_tests == total_tests
        
    finally:
        driver.close()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
