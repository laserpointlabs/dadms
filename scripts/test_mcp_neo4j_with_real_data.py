#!/usr/bin/env python3
"""
Test MCP Neo4j Service with Real Data

This script:
1. Creates test nodes and relationships in Neo4j
2. Tests the MCP Neo4j service with real data
3. Verifies the service can analyze the graph
"""

import os
import sys
import json
import time
import requests
import logging
from datetime import datetime
from neo4j import GraphDatabase

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_test_data_in_neo4j():
    """Create comprehensive test data in Neo4j"""
    
    # Neo4j connection
    uri = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
    user = os.environ.get("NEO4J_USER", "neo4j")
    password = os.environ.get("NEO4J_PASSWORD", "password")
    
    try:
        driver = GraphDatabase.driver(uri, auth=(user, password))
        
        with driver.session() as session:
            logger.info("🧹 Clearing existing data...")
            session.run("MATCH (n) DETACH DELETE n")
            
            logger.info("📊 Creating decision-making test data...")
            
            # Create decision-making nodes - Decision Makers
            session.run("""
                CREATE (dm1:DecisionMaker {id: 'dm1', name: 'Chief Technology Officer', 
                       role: 'Executive', authority_level: 5, created_at: datetime()})
                CREATE (dm2:DecisionMaker {id: 'dm2', name: 'Project Manager', 
                       role: 'Management', authority_level: 3, created_at: datetime()})
                CREATE (dm3:DecisionMaker {id: 'dm3', name: 'Technical Lead', 
                       role: 'Technical', authority_level: 4, created_at: datetime()})
            """)
            
            # Create stakeholder nodes
            session.run("""
                CREATE (s1:Stakeholder {id: 's1', name: 'Emergency Response Team', 
                       type: 'Primary User', priority: 'High', created_at: datetime()})
                CREATE (s2:Stakeholder {id: 's2', name: 'Budget Committee', 
                       type: 'Financial Authority', priority: 'High', created_at: datetime()})
                CREATE (s3:Stakeholder {id: 's3', name: 'IT Operations', 
                       type: 'Support Team', priority: 'Medium', created_at: datetime()})
            """)
            
            # Create criteria nodes
            session.run("""
                CREATE (c1:Criterion {id: 'c1', name: 'Cost Effectiveness', 
                       weight: 0.3, category: 'Financial', created_at: datetime()})
                CREATE (c2:Criterion {id: 'c2', name: 'Technical Performance', 
                       weight: 0.4, category: 'Technical', created_at: datetime()})
                CREATE (c3:Criterion {id: 'c3', name: 'Implementation Speed', 
                       weight: 0.3, category: 'Timeline', created_at: datetime()})
            """)
            
            # Create alternative solutions
            session.run("""
                CREATE (a1:Alternative {id: 'a1', name: 'Cloud-Based Solution', 
                       cost: 150000, implementation_time: '6 months', created_at: datetime()})
                CREATE (a2:Alternative {id: 'a2', name: 'On-Premise Solution', 
                       cost: 300000, implementation_time: '12 months', created_at: datetime()})
                CREATE (a3:Alternative {id: 'a3', name: 'Hybrid Solution', 
                       cost: 225000, implementation_time: '9 months', created_at: datetime()})
            """)
            
            # Create analysis nodes
            session.run("""
                CREATE (an1:Analysis {id: 'an1', name: 'Cost-Benefit Analysis', 
                       methodology: 'Financial modeling', status: 'Completed', created_at: datetime()})
                CREATE (an2:Analysis {id: 'an2', name: 'Risk Assessment', 
                       methodology: 'Risk matrix', status: 'In Progress', created_at: datetime()})
            """)
            
            # Create recommendation nodes
            session.run("""
                CREATE (r1:Recommendation {id: 'r1', name: 'Primary Recommendation', 
                       decision: 'Cloud-Based Solution', confidence: 0.85, created_at: datetime()})
                CREATE (r2:Recommendation {id: 'r2', name: 'Fallback Option', 
                       decision: 'Hybrid Solution', confidence: 0.70, created_at: datetime()})
            """)
            
            logger.info("🔗 Creating relationships...")
            
            # Decision maker relationships
            session.run("""
                MATCH (dm:DecisionMaker), (s:Stakeholder)
                WHERE dm.id = 'dm1' AND s.id = 's1'
                CREATE (dm)-[:REPRESENTS]->(s)
            """)
            
            session.run("""
                MATCH (dm:DecisionMaker), (s:Stakeholder)
                WHERE dm.id = 'dm2' AND s.id = 's2'
                CREATE (dm)-[:REPRESENTS]->(s)
            """)
            
            # Stakeholder-Criteria relationships
            session.run("""
                MATCH (s:Stakeholder), (c:Criterion)
                WHERE s.id = 's1' AND c.id = 'c2'
                CREATE (s)-[:PRIORITIZES {importance: 'High'}]->(c)
            """)
            
            session.run("""
                MATCH (s:Stakeholder), (c:Criterion)
                WHERE s.id = 's2' AND c.id = 'c1'
                CREATE (s)-[:PRIORITIZES {importance: 'Critical'}]->(c)
            """)
            
            # Alternative-Criteria evaluations
            session.run("""
                MATCH (a:Alternative), (c:Criterion)
                WHERE a.id = 'a1' AND c.id = 'c1'
                CREATE (a)-[:SCORED_ON {score: 8.5, notes: 'Lower operational costs'}]->(c)
            """)
            
            session.run("""
                MATCH (a:Alternative), (c:Criterion)
                WHERE a.id = 'a1' AND c.id = 'c2'
                CREATE (a)-[:SCORED_ON {score: 7.8, notes: 'Good scalability'}]->(c)
            """)
            
            session.run("""
                MATCH (a:Alternative), (c:Criterion)
                WHERE a.id = 'a2' AND c.id = 'c2'
                CREATE (a)-[:SCORED_ON {score: 9.2, notes: 'Best performance'}]->(c)
            """)
            
            # Analysis relationships
            session.run("""
                MATCH (an:Analysis), (a:Alternative)
                WHERE an.id = 'an1'
                CREATE (an)-[:EVALUATES]->(a)
            """)
            
            # Recommendation relationships
            session.run("""
                MATCH (r:Recommendation), (a:Alternative)
                WHERE r.id = 'r1' AND a.id = 'a1'
                CREATE (r)-[:RECOMMENDS]->(a)
            """)
            
            session.run("""
                MATCH (r:Recommendation), (an:Analysis)
                WHERE r.id = 'r1' AND an.id = 'an1'
                CREATE (r)-[:BASED_ON]->(an)
            """)
            
            # Decision maker authority relationships
            session.run("""
                MATCH (dm:DecisionMaker), (r:Recommendation)
                WHERE dm.id = 'dm1' AND r.id = 'r1'
                CREATE (dm)-[:APPROVES]->(r)
            """)
            
            # Get final counts
            result = session.run("MATCH (n) RETURN count(n) as node_count")
            node_count = result.single()["node_count"]
            
            result = session.run("MATCH ()-[r]->() RETURN count(r) as rel_count")
            rel_count = result.single()["rel_count"]
            
            logger.info(f"✅ Created {node_count} nodes and {rel_count} relationships")
            
        driver.close()
        return True
        
    except Exception as e:
        logger.error(f"❌ Error creating test data: {e}")
        return False

def test_mcp_neo4j_service():
    """Test the MCP Neo4j service with various analysis types"""
    
    service_url = "http://localhost:5202"
    
    logger.info("🧪 Testing MCP Neo4j Service with real data...")
    
    test_results = {
        "timestamp": datetime.now().isoformat(),
        "service_url": service_url,
        "tests": {}
    }
    
    # Test 1: Health check
    try:
        logger.info("1️⃣ Testing health endpoint...")
        response = requests.get(f"{service_url}/health", timeout=10)
        if response.status_code == 200:
            health_data = response.json()
            test_results["tests"]["health"] = {
                "status": "success",
                "response_time_ms": response.elapsed.total_seconds() * 1000,
                "neo4j_status": health_data.get("neo4j_status"),
                "available_tools": health_data.get("available_tools", [])
            }
            logger.info(f"   ✅ Health: {health_data.get('status')} (Neo4j: {health_data.get('neo4j_status')})")
        else:
            test_results["tests"]["health"] = {"status": "failed", "error": f"HTTP {response.status_code}"}
            logger.error(f"   ❌ Health check failed: {response.status_code}")
    except Exception as e:
        test_results["tests"]["health"] = {"status": "failed", "error": str(e)}
        logger.error(f"   ❌ Health check error: {e}")
    
    # Test 2: Decision context
    try:
        logger.info("2️⃣ Testing decision context endpoint...")
        response = requests.get(f"{service_url}/decision_context", timeout=10)
        if response.status_code == 200:
            context_data = response.json()
            test_results["tests"]["decision_context"] = {
                "status": "success",
                "response_time_ms": response.elapsed.total_seconds() * 1000,
                "data": context_data
            }
            logger.info(f"   ✅ Decision context retrieved")
            logger.info(f"      Graph ready: {context_data.get('graph_ready_for_analysis', False)}")
        else:
            test_results["tests"]["decision_context"] = {"status": "failed", "error": f"HTTP {response.status_code}"}
            logger.error(f"   ❌ Decision context failed: {response.status_code}")
    except Exception as e:
        test_results["tests"]["decision_context"] = {"status": "failed", "error": str(e)}
        logger.error(f"   ❌ Decision context error: {e}")
    
    # Test 3: Centrality analysis
    try:
        logger.info("3️⃣ Testing centrality analysis...")
        payload = {
            "task_name": "centrality_analysis_test",
            "task_description": "Test centrality analysis on decision graph",
            "variables": {
                "analysis_type": "centrality",
                "algorithm": "pagerank",
                "node_labels": ["DecisionMaker", "Stakeholder"]
            }
        }
        
        response = requests.post(f"{service_url}/process_task", json=payload, timeout=30)
        if response.status_code == 200:
            analysis_data = response.json()
            test_results["tests"]["centrality_analysis"] = {
                "status": "success",
                "response_time_ms": response.elapsed.total_seconds() * 1000,
                "result": analysis_data
            }
            logger.info(f"   ✅ Centrality analysis completed")
            
            # Extract some interesting results
            result = analysis_data.get("result", {})
            graph_results = result.get("graph_analysis_results", {})
            if "result" in graph_results:
                centrality_result = graph_results["result"].get("centrality_analysis", {})
                top_nodes = centrality_result.get("top_nodes", [])
                logger.info(f"      Top influential nodes: {len(top_nodes)}")
                for node in top_nodes[:3]:
                    logger.info(f"        - {node.get('node', 'Unknown')}: {node.get('centrality', 0):.3f}")
            
        else:
            test_results["tests"]["centrality_analysis"] = {"status": "failed", "error": f"HTTP {response.status_code}"}
            logger.error(f"   ❌ Centrality analysis failed: {response.status_code}")
            logger.error(f"      Response: {response.text}")
    except Exception as e:
        test_results["tests"]["centrality_analysis"] = {"status": "failed", "error": str(e)}
        logger.error(f"   ❌ Centrality analysis error: {e}")
    
    # Test 4: Community detection
    try:
        logger.info("4️⃣ Testing community detection...")
        payload = {
            "task_name": "community_detection_test",
            "task_description": "Test community detection on decision graph",
            "variables": {
                "analysis_type": "communities",
                "relationship_types": ["REPRESENTS", "PRIORITIZES", "APPROVES"]
            }
        }
        
        response = requests.post(f"{service_url}/process_task", json=payload, timeout=30)
        if response.status_code == 200:
            analysis_data = response.json()
            test_results["tests"]["community_detection"] = {
                "status": "success",
                "response_time_ms": response.elapsed.total_seconds() * 1000,
                "result": analysis_data
            }
            logger.info(f"   ✅ Community detection completed")
            
            # Extract community results
            result = analysis_data.get("result", {})
            graph_results = result.get("graph_analysis_results", {})
            if "result" in graph_results:
                community_result = graph_results["result"].get("community_detection", {})
                communities = community_result.get("communities", [])
                logger.info(f"      Found {len(communities)} communities")
                for i, community in enumerate(communities[:3]):
                    logger.info(f"        Community {i+1}: {community.get('size', 0)} nodes - {community.get('description', 'No description')}")
                    
        else:
            test_results["tests"]["community_detection"] = {"status": "failed", "error": f"HTTP {response.status_code}"}
            logger.error(f"   ❌ Community detection failed: {response.status_code}")
    except Exception as e:
        test_results["tests"]["community_detection"] = {"status": "failed", "error": str(e)}
        logger.error(f"   ❌ Community detection error: {e}")
    
    # Test 5: Structure analysis
    try:
        logger.info("5️⃣ Testing structure analysis...")
        payload = {
            "task_name": "structure_analysis_test", 
            "task_description": "Test graph structure analysis",
            "variables": {
                "analysis_type": "structure"
            }
        }
        
        response = requests.post(f"{service_url}/process_task", json=payload, timeout=30)
        if response.status_code == 200:
            analysis_data = response.json()
            test_results["tests"]["structure_analysis"] = {
                "status": "success",
                "response_time_ms": response.elapsed.total_seconds() * 1000,
                "result": analysis_data
            }
            logger.info(f"   ✅ Structure analysis completed")
            
            # Extract structure metrics
            result = analysis_data.get("result", {})
            graph_results = result.get("graph_analysis_results", {})
            if "result" in graph_results:
                structure_result = graph_results["result"].get("graph_structure", {})
                logger.info(f"      Node count: {structure_result.get('node_count', 'Unknown')}")
                logger.info(f"      Edge count: {structure_result.get('edge_count', 'Unknown')}")
                logger.info(f"      Density: {structure_result.get('density', 'Unknown')}")
                logger.info(f"      Clustering coefficient: {structure_result.get('clustering_coefficient', 'Unknown')}")
                    
        else:
            test_results["tests"]["structure_analysis"] = {"status": "failed", "error": f"HTTP {response.status_code}"}
            logger.error(f"   ❌ Structure analysis failed: {response.status_code}")
    except Exception as e:
        test_results["tests"]["structure_analysis"] = {"status": "failed", "error": str(e)}
        logger.error(f"   ❌ Structure analysis error: {e}")
    
    return test_results

def main():
    """Main test function"""
    logger.info("🚀 Starting MCP Neo4j Service Test with Real Data")
    logger.info("=" * 60)
    
    # Step 1: Create test data
    logger.info("📊 Step 1: Creating test data in Neo4j...")
    if not create_test_data_in_neo4j():
        logger.error("❌ Failed to create test data. Exiting.")
        return False
    
    # Wait a moment for data to be available
    time.sleep(2)
    
    # Step 2: Test MCP service
    logger.info("\n🧪 Step 2: Testing MCP Neo4j Service...")
    test_results = test_mcp_neo4j_service()
    
    # Step 3: Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f"neo4j_mcp_test_results_{timestamp}.json"
    
    with open(results_file, 'w') as f:
        json.dump(test_results, f, indent=2)
    
    # Step 4: Summary
    logger.info("\n📋 Test Summary:")
    logger.info("=" * 40)
    
    total_tests = len(test_results["tests"])
    successful_tests = sum(1 for test in test_results["tests"].values() if test.get("status") == "success")
    
    logger.info(f"Total tests: {total_tests}")
    logger.info(f"Successful: {successful_tests}")
    logger.info(f"Failed: {total_tests - successful_tests}")
    logger.info(f"Success rate: {(successful_tests/total_tests)*100:.1f}%")
    
    logger.info(f"\n📁 Detailed results saved to: {results_file}")
    
    if successful_tests == total_tests:
        logger.info("🎉 All tests passed! MCP Neo4j service is working correctly with real data.")
        return True
    else:
        logger.warning("⚠️ Some tests failed. Check the detailed results.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
