#!/usr/bin/env python3
"""
Test Neo4j with MCP Service Integration

This script:
1. Pushes test nodes to Neo4j database (simulating DADM workflow data)
2. Tests the MCP Neo4j service with real data
3. Compares performance with mocks vs real data
"""

import os
import sys
import json
import uuid
import logging
import requests
from datetime import datetime
from neo4j import GraphDatabase

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_test_data_in_neo4j():
    """Create comprehensive test data in Neo4j to simulate DADM workflow"""
    
    # Database connection
    uri = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
    user = os.environ.get("NEO4J_USER", "neo4j")
    password = os.environ.get("NEO4J_PASSWORD", "password")
    
    try:
        driver = GraphDatabase.driver(uri, auth=(user, password))
        
        with driver.session() as session:
            logger.info("Creating test data in Neo4j...")
            
            # Create Run nodes
            run_ids = []
            for i in range(3):
                run_id = f"test_run_{i+1}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                run_ids.append(run_id)
                
                session.run("""
                    CREATE (r:Run {
                        id: $run_id,
                        run_id: $run_id,
                        name: $name,
                        created_at: datetime(),
                        decision_context: $context,
                        status: 'completed'
                    })
                """, 
                run_id=run_id,
                name=f"Test Run {i+1}",
                context=f"Emergency response decision analysis - Scenario {i+1}"
                )
            
            # Create Process Instance nodes
            process_ids = []
            for i, run_id in enumerate(run_ids):
                process_id = f"process_instance_{i+1}"
                process_ids.append(process_id)
                
                session.run("""
                    CREATE (p:ProcessInstance {
                        id: $process_id,
                        process_instance_id: $process_id,
                        name: $name,
                        created_at: datetime(),
                        process_definition_key: 'enhanced_decision_process'
                    })
                """,
                process_id=process_id,
                name=f"Emergency Response Process {i+1}"
                )
                
                # Link Run to Process
                session.run("""
                    MATCH (r:Run {id: $run_id})
                    MATCH (p:ProcessInstance {id: $process_id})
                    CREATE (r)-[:EXECUTED_PROCESS]->(p)
                """, run_id=run_id, process_id=process_id)
            
            # Create Task nodes with rich decision data
            task_types = [
                "stakeholder_analysis",
                "risk_assessment", 
                "resource_planning",
                "cost_benefit_analysis",
                "implementation_planning"
            ]
            
            task_ids = []
            for i, process_id in enumerate(process_ids):
                for j, task_type in enumerate(task_types):
                    task_id = f"task_{i+1}_{j+1}"
                    task_ids.append(task_id)
                    
                    session.run("""
                        CREATE (t:Task {
                            id: $task_id,
                            task_id: $task_id,
                            name: $name,
                            task_name: $task_type,
                            processed_at: datetime(),
                            processed_by: 'OpenAI Assistant',
                            status: 'completed'
                        })
                    """,
                    task_id=task_id,
                    name=f"Task: {task_type.replace('_', ' ').title()}",
                    task_type=task_type
                    )
                    
                    # Link Process to Task
                    session.run("""
                        MATCH (p:ProcessInstance {id: $process_id})
                        MATCH (t:Task {id: $task_id})
                        CREATE (p)-[:HAS_TASK]->(t)
                    """, process_id=process_id, task_id=task_id)
            
            # Create Stakeholder nodes
            stakeholders = [
                {"name": "Fire Department", "type": "Primary User", "influence": "High", "interest": "High"},
                {"name": "Police Department", "type": "Primary User", "influence": "High", "interest": "High"},
                {"name": "Emergency Medical Services", "type": "Primary User", "influence": "Medium", "interest": "High"},
                {"name": "City Council", "type": "Decision Maker", "influence": "Very High", "interest": "Medium"},
                {"name": "Budget Committee", "type": "Financial Authority", "influence": "High", "interest": "Medium"},
                {"name": "IT Department", "type": "Technical Support", "influence": "Medium", "interest": "Low"},
                {"name": "Citizens", "type": "End Beneficiary", "influence": "Low", "interest": "High"}
            ]
            
            stakeholder_ids = []
            for stakeholder in stakeholders:
                stakeholder_id = str(uuid.uuid4())
                stakeholder_ids.append(stakeholder_id)
                
                session.run("""
                    CREATE (s:Stakeholder {
                        id: $id,
                        name: $name,
                        stakeholder_type: $type,
                        influence_level: $influence,
                        interest_level: $interest,
                        created_at: datetime()
                    })
                """, 
                id=stakeholder_id,
                name=stakeholder["name"],
                type=stakeholder["type"],
                influence=stakeholder["influence"],
                interest=stakeholder["interest"]
                )
            
            # Create Alternative nodes (decision options)
            alternatives = [
                {"name": "Digital Radio System A", "cost": 2500000, "complexity": "High", "timeline": "18 months"},
                {"name": "Digital Radio System B", "cost": 1800000, "complexity": "Medium", "timeline": "12 months"},
                {"name": "Hybrid Communication Platform", "cost": 3200000, "complexity": "Very High", "timeline": "24 months"},
                {"name": "Enhanced Existing System", "cost": 800000, "complexity": "Low", "timeline": "6 months"}
            ]
            
            alternative_ids = []
            for alternative in alternatives:
                alternative_id = str(uuid.uuid4())
                alternative_ids.append(alternative_id)
                
                session.run("""
                    CREATE (a:Alternative {
                        id: $id,
                        name: $name,
                        estimated_cost: $cost,
                        complexity_level: $complexity,
                        implementation_timeline: $timeline,
                        created_at: datetime()
                    })
                """,
                id=alternative_id,
                name=alternative["name"],
                cost=alternative["cost"],
                complexity=alternative["complexity"],
                timeline=alternative["timeline"]
                )
            
            # Create Criterion nodes (evaluation criteria)
            criteria = [
                {"name": "Cost Effectiveness", "weight": 0.25, "type": "Financial"},
                {"name": "Technical Reliability", "weight": 0.30, "type": "Technical"},
                {"name": "Implementation Speed", "weight": 0.20, "type": "Timeline"},
                {"name": "Scalability", "weight": 0.15, "type": "Technical"},
                {"name": "User Acceptance", "weight": 0.10, "type": "Social"}
            ]
            
            criterion_ids = []
            for criterion in criteria:
                criterion_id = str(uuid.uuid4())
                criterion_ids.append(criterion_id)
                
                session.run("""
                    CREATE (c:Criterion {
                        id: $id,
                        name: $name,
                        weight: $weight,
                        criterion_type: $type,
                        created_at: datetime()
                    })
                """,
                id=criterion_id,
                name=criterion["name"],
                weight=criterion["weight"],
                type=criterion["type"]
                )
            
            # Create Analysis nodes linking everything together
            analysis_ids = []
            for i, task_id in enumerate(task_ids[:3]):  # Link first 3 tasks to analyses
                analysis_id = str(uuid.uuid4())
                analysis_ids.append(analysis_id)
                
                session.run("""
                    CREATE (a:Analysis {
                        id: $id,
                        name: $name,
                        methodology: $methodology,
                        status: 'completed',
                        confidence_level: $confidence,
                        created_at: datetime(),
                        completed_at: datetime()
                    })
                """,
                id=analysis_id,
                name=f"Decision Analysis {i+1}",
                methodology="Multi-Criteria Decision Analysis",
                confidence=0.85 + (i * 0.05)
                )
                
                # Link Task to Analysis
                session.run("""
                    MATCH (t:Task {id: $task_id})
                    MATCH (a:Analysis {id: $analysis_id})
                    CREATE (t)-[:GENERATES]->(a)
                """, task_id=task_id, analysis_id=analysis_id)
            
            # Create relationships between entities
            logger.info("Creating relationships between entities...")
            
            # Link stakeholders to analyses
            for analysis_id in analysis_ids:
                for stakeholder_id in stakeholder_ids[:4]:  # Link first 4 stakeholders
                    session.run("""
                        MATCH (a:Analysis {id: $analysis_id})
                        MATCH (s:Stakeholder {id: $stakeholder_id})
                        CREATE (a)-[:CONSIDERS_STAKEHOLDER]->(s)
                    """, analysis_id=analysis_id, stakeholder_id=stakeholder_id)
            
            # Link alternatives to analyses
            for analysis_id in analysis_ids:
                for alternative_id in alternative_ids:
                    session.run("""
                        MATCH (a:Analysis {id: $analysis_id})
                        MATCH (alt:Alternative {id: $alternative_id})
                        CREATE (a)-[:EVALUATES_ALTERNATIVE]->(alt)
                    """, analysis_id=analysis_id, alternative_id=alternative_id)
            
            # Link criteria to analyses
            for analysis_id in analysis_ids:
                for criterion_id in criterion_ids:
                    session.run("""
                        MATCH (a:Analysis {id: $analysis_id})
                        MATCH (c:Criterion {id: $criterion_id})
                        CREATE (a)-[:USES_CRITERION]->(c)
                    """, analysis_id=analysis_id, criterion_id=criterion_id)
            
            # Create some value assessments
            for i, alternative_id in enumerate(alternative_ids):
                for j, criterion_id in enumerate(criterion_ids):
                    value_id = str(uuid.uuid4())
                    # Generate realistic scores
                    score = round(0.3 + (0.6 * ((i + j * 2) % 7) / 6), 2)
                    
                    session.run("""
                        CREATE (v:Value {
                            id: $id,
                            name: $name,
                            score: $score,
                            created_at: datetime()
                        })
                    """,
                    id=value_id,
                    name=f"Score: {alternatives[i]['name']} vs {criteria[j]['name']}",
                    score=score
                    )
                    
                    # Link to alternative and criterion
                    session.run("""
                        MATCH (alt:Alternative {id: $alternative_id})
                        MATCH (c:Criterion {id: $criterion_id})
                        MATCH (v:Value {id: $value_id})
                        CREATE (alt)-[:SCORED_ON]->(v)-[:MEASURES]->(c)
                    """, alternative_id=alternative_id, criterion_id=criterion_id, value_id=value_id)
            
            # Get final counts
            result = session.run("MATCH (n) RETURN labels(n) as labels, count(n) as count")
            node_counts = {}
            total_nodes = 0
            for record in result:
                label = record['labels'][0] if record['labels'] else 'Unlabeled'
                count = record['count']
                node_counts[label] = count
                total_nodes += count
            
            result = session.run("MATCH ()-[r]->() RETURN count(r) as rel_count")
            total_relationships = result.single()['rel_count']
            
            logger.info(f"✅ Created test data successfully!")
            logger.info(f"📊 Total nodes: {total_nodes}")
            logger.info(f"🔗 Total relationships: {total_relationships}")
            logger.info("📋 Node breakdown:")
            for label, count in sorted(node_counts.items()):
                logger.info(f"   {label}: {count}")
            
            return True
            
        driver.close()
        
    except Exception as e:
        logger.error(f"❌ Error creating test data: {e}")
        return False

def test_mcp_neo4j_service():
    """Test the MCP Neo4j service with real data"""
    
    logger.info("🧪 Testing MCP Neo4j Service with real data...")
    
    # Test endpoints
    base_url = "http://localhost:5202"
    
    tests = [
        {
            "name": "Health Check",
            "method": "GET",
            "endpoint": "/health",
            "data": None
        },
        {
            "name": "Service Info",
            "method": "GET", 
            "endpoint": "/info",
            "data": None
        },
        {
            "name": "Decision Context Summary",
            "method": "GET",
            "endpoint": "/decision_context",
            "data": None
        },
        {
            "name": "Graph Metrics Analysis",
            "method": "POST",
            "endpoint": "/process_task",
            "data": {
                "task_type": "graph_metrics",
                "task_id": "test_metrics_with_real_data",
                "parameters": {
                    "node_count": 100,
                    "analysis_type": "comprehensive"
                }
            }
        },
        {
            "name": "Centrality Analysis",
            "method": "POST",
            "endpoint": "/process_task",
            "data": {
                "task_type": "centrality_analysis",
                "task_id": "test_centrality_real_data",
                "parameters": {
                    "algorithm": "pagerank",
                    "node_label": "Stakeholder",
                    "limit": 10
                }
            }
        },
        {
            "name": "Community Detection",
            "method": "POST",
            "endpoint": "/process_task",
            "data": {
                "task_type": "community_detection",
                "task_id": "test_communities_real_data",
                "parameters": {
                    "algorithm": "louvain",
                    "min_community_size": 2
                }
            }
        },
        {
            "name": "Path Analysis",
            "method": "POST",
            "endpoint": "/process_task",
            "data": {
                "task_type": "path_analysis",
                "task_id": "test_paths_real_data",
                "parameters": {
                    "source_label": "Run",
                    "target_label": "Analysis",
                    "max_length": 5
                }
            }
        }
    ]
    
    results = []
    
    for test in tests:
        logger.info(f"🔍 Testing: {test['name']}")
        
        try:
            if test['method'] == 'GET':
                response = requests.get(f"{base_url}{test['endpoint']}", timeout=30)
            else:
                response = requests.post(
                    f"{base_url}{test['endpoint']}", 
                    json=test['data'],
                    headers={'Content-Type': 'application/json'},
                    timeout=30
                )
            
            result = {
                "test_name": test['name'],
                "status_code": response.status_code,
                "success": response.status_code == 200,
                "response_time": response.elapsed.total_seconds(),
                "response_size": len(response.text)
            }
            
            if response.status_code == 200:
                try:
                    json_response = response.json()
                    result["response_preview"] = str(json_response)[:200] + "..." if len(str(json_response)) > 200 else str(json_response)
                    
                    # Check if using real data vs mocks
                    if isinstance(json_response, dict):
                        if "result" in json_response:
                            inner_result = json_response["result"]
                            if isinstance(inner_result, dict):
                                mcp_tool = inner_result.get("mcp_tool_used", "unknown")
                                result["data_source"] = "real_data" if mcp_tool != "mock" else "mock_data"
                                result["mcp_tool_used"] = mcp_tool
                                
                                # Extract specific metrics for analysis
                                if "graph_analysis_results" in inner_result:
                                    graph_results = inner_result["graph_analysis_results"]
                                    if isinstance(graph_results, dict) and "result" in graph_results:
                                        metrics = graph_results["result"]
                                        result["extracted_metrics"] = metrics
                                
                                # Check decision context
                                if "decision_context" in inner_result:
                                    context = inner_result["decision_context"]
                                    if isinstance(context, dict):
                                        result["decision_summary"] = context.get("decision_summary", {})
                                        result["graph_ready"] = context.get("graph_ready_for_analysis", False)
                        
                        elif "health_status" in json_response:
                            result["service_status"] = json_response["health_status"]
                        
                        elif "capabilities" in json_response:
                            result["service_capabilities"] = len(json_response["capabilities"])
                
                except json.JSONDecodeError:
                    result["response_preview"] = response.text[:200] + "..." if len(response.text) > 200 else response.text
                
                logger.info(f"   ✅ {test['name']}: SUCCESS ({response.status_code}) - {result.get('response_time', 0):.3f}s")
                if "data_source" in result:
                    logger.info(f"      📊 Data Source: {result['data_source']} (Tool: {result.get('mcp_tool_used', 'unknown')})")
                if "graph_ready" in result:
                    logger.info(f"      🔗 Graph Ready: {result['graph_ready']}")
                    
            else:
                result["error"] = response.text
                logger.error(f"   ❌ {test['name']}: FAILED ({response.status_code})")
                logger.error(f"      Error: {response.text}")
            
            results.append(result)
            
        except requests.exceptions.RequestException as e:
            logger.error(f"   ❌ {test['name']}: REQUEST ERROR - {e}")
            results.append({
                "test_name": test['name'],
                "success": False,
                "error": str(e)
            })
    
    return results

def analyze_results(results):
    """Analyze and report test results"""
    
    logger.info("📈 ANALYSIS RESULTS")
    logger.info("=" * 50)
    
    total_tests = len(results)
    successful_tests = sum(1 for r in results if r.get("success", False))
    
    logger.info(f"📊 Test Summary: {successful_tests}/{total_tests} tests passed")
    
    # Check data source usage
    real_data_tests = [r for r in results if r.get("data_source") == "real_data"]
    mock_data_tests = [r for r in results if r.get("data_source") == "mock_data"]
    
    if real_data_tests:
        logger.info(f"🎯 Tests using REAL data: {len(real_data_tests)}")
        for test in real_data_tests:
            logger.info(f"   ✅ {test['test_name']} - Tool: {test.get('mcp_tool_used', 'unknown')}")
    
    if mock_data_tests:
        logger.info(f"🎭 Tests using MOCK data: {len(mock_data_tests)}")
        for test in mock_data_tests:
            logger.info(f"   ⚠️  {test['test_name']} - Tool: {test.get('mcp_tool_used', 'unknown')}")
    
    # Check graph readiness
    graph_ready_tests = [r for r in results if r.get("graph_ready") == True]
    if graph_ready_tests:
        logger.info(f"🔗 Graph ready for analysis: {len(graph_ready_tests)} tests confirmed")
    
    # Performance analysis
    response_times = [r.get("response_time", 0) for r in results if r.get("success")]
    if response_times:
        avg_time = sum(response_times) / len(response_times)
        max_time = max(response_times)
        min_time = min(response_times)
        logger.info(f"⏱️  Performance: Avg: {avg_time:.3f}s, Min: {min_time:.3f}s, Max: {max_time:.3f}s")
    
    # Extract interesting metrics
    for result in results:
        if "extracted_metrics" in result:
            metrics = result["extracted_metrics"]
            logger.info(f"📋 {result['test_name']} Metrics:")
            if isinstance(metrics, dict):
                for key, value in metrics.items():
                    logger.info(f"   {key}: {value}")
    
    return {
        "total_tests": total_tests,
        "successful_tests": successful_tests,
        "real_data_tests": len(real_data_tests),
        "mock_data_tests": len(mock_data_tests),
        "avg_response_time": sum(response_times) / len(response_times) if response_times else 0
    }

def main():
    """Main execution function"""
    
    logger.info("🚀 Starting Neo4j + MCP Integration Test")
    logger.info("=" * 60)
    
    # Step 1: Create test data
    logger.info("📝 Step 1: Creating test data in Neo4j...")
    if not create_test_data_in_neo4j():
        logger.error("❌ Failed to create test data. Exiting.")
        return False
    
    logger.info("✅ Test data created successfully!")
    
    # Step 2: Test MCP service
    logger.info("\n🧪 Step 2: Testing MCP Neo4j Service...")
    results = test_mcp_neo4j_service()
    
    # Step 3: Analyze results
    logger.info("\n📈 Step 3: Analyzing results...")
    summary = analyze_results(results)
    
    # Save detailed results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f"neo4j_mcp_test_results_{timestamp}.json"
    
    with open(results_file, 'w') as f:
        json.dump({
            "timestamp": timestamp,
            "summary": summary,
            "detailed_results": results
        }, f, indent=2, default=str)
    
    logger.info(f"💾 Detailed results saved to: {results_file}")
    
    # Final summary
    logger.info("\n🎯 FINAL SUMMARY")
    logger.info("=" * 40)
    logger.info(f"✅ Total tests: {summary['total_tests']}")
    logger.info(f"🎯 Successful: {summary['successful_tests']}")
    logger.info(f"📊 Real data tests: {summary['real_data_tests']}")
    logger.info(f"🎭 Mock data tests: {summary['mock_data_tests']}")
    logger.info(f"⏱️  Average response time: {summary['avg_response_time']:.3f}s")
    
    success_rate = (summary['successful_tests'] / summary['total_tests']) * 100
    logger.info(f"📈 Success rate: {success_rate:.1f}%")
    
    if summary['real_data_tests'] > 0:
        logger.info("🎉 SUCCESS: MCP Neo4j service is working with REAL data!")
    else:
        logger.info("⚠️  INFO: MCP Neo4j service is using mock data (no real data found)")
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)
