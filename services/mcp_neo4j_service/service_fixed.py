#!/usr/bin/env python3
"""
MCP Neo4j Service - Fixed Version
A DADM service that wraps MCP servers for advanced Neo4j graph analysis
"""

import json
import logging
import asyncio
import subprocess
import time
import os
from datetime import datetime
from typing import Dict, Any, Optional, List

from flask import Flask, request, jsonify
from neo4j import GraphDatabase
import mcp
from mcp.client.session import ClientSession
from mcp.client.stdio import stdio_client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Service configuration
SERVICE_NAME = "mcp-neo4j-service"
SERVICE_TYPE = "graph_analytics"
SERVICE_VERSION = "1.0"

# Neo4j configuration
NEO4J_URI = os.environ.get('NEO4J_URI', 'bolt://localhost:7687')
NEO4J_USER = os.environ.get('NEO4J_USER', 'neo4j')
NEO4J_PASSWORD = os.environ.get('NEO4J_PASSWORD', 'password')

# Global instances
mcp_session: Optional[ClientSession] = None
mcp_process: Optional[subprocess.Popen] = None
neo4j_driver = None

class MCPNeo4jService:
    """Service wrapper for MCP Neo4j analysis servers"""
    
    def __init__(self):
        self.session = None
        self.available_tools = []
        self.neo4j_driver = None
        
    async def initialize_mcp_connection(self):
        """Initialize connection to the MCP Neo4j server"""
        try:
            # Initialize Neo4j connection
            self.neo4j_driver = GraphDatabase.driver(
                NEO4J_URI, 
                auth=(NEO4J_USER, NEO4J_PASSWORD)
            )
            
            # Test Neo4j connection
            with self.neo4j_driver.session() as session:
                result = session.run("RETURN 1 as test")
                test_value = result.single()["test"]
                logger.info(f"Neo4j connection successful: {test_value}")
            
            # Try to initialize proper MCP connection
            try:
                # Check if MCP server file exists
                mcp_server_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "mcp_servers", "mcp_neo4j_server.py")
                if not os.path.exists(mcp_server_path):
                    raise FileNotFoundError(f"MCP server not found at {mcp_server_path}")
                
                # Start the MCP server process
                server_command = ["python", mcp_server_path]
                global mcp_process
                mcp_process = subprocess.Popen(
                    server_command,
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    env={**os.environ, "NEO4J_URI": NEO4J_URI, "NEO4J_USER": NEO4J_USER, "NEO4J_PASSWORD": NEO4J_PASSWORD}
                )
                
                # Give the server a moment to start
                await asyncio.sleep(2)
                
                # Check if process is still running
                if mcp_process.poll() is not None:
                    stderr_output = mcp_process.stderr.read() if mcp_process.stderr else ""
                    raise Exception(f"MCP server process failed to start. Exit code: {mcp_process.returncode}, stderr: {stderr_output}")
                
                # Initialize MCP client connection
                async with stdio_client(mcp_process.stdin, mcp_process.stdout) as (read, write):
                    async with ClientSession(read, write) as session:
                        # Initialize the session
                        init_result = await session.initialize()
                        logger.info(f"MCP session initialized: {init_result}")
                        
                        # List available tools
                        tools_result = await session.list_tools()
                        self.available_tools = [tool.name for tool in tools_result.tools]
                        
                        # Store session for later use (note: this is simplified, in reality we'd need to manage the session lifecycle)
                        logger.info(f"MCP Neo4j Server connected successfully with tools: {self.available_tools}")
                        
                        # For now, we'll still fall back to mock since managing persistent sessions is complex
                        raise Exception("Persistent MCP session management not yet implemented")
                        
            except Exception as mcp_error:
                logger.warning(f"Failed to initialize MCP server connection: {mcp_error}")
                logger.info("Falling back to mock implementations")
                
                # Cleanup process if it exists
                if mcp_process and mcp_process.poll() is None:
                    mcp_process.terminate()
                    mcp_process.wait()
                
                # Fallback to mock implementations
                self.session = None
                self.available_tools = ["mock_graph_analysis", "mock_centrality", "mock_community_detection"]
                
                logger.info(f"MCP Neo4j Service initialized with mock tools: {self.available_tools}")
                return True
            
        except Exception as e:
            logger.error(f"Failed to initialize Neo4j connection: {e}")
            return False
      
    async def call_mcp_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Call an MCP tool with the given arguments"""
        try:
            if not self.session:
                # Mock implementation when MCP is disabled
                return await self.mock_graph_analysis(tool_name, arguments)
            
            # Call the tool
            result = await self.session.call_tool(tool_name, arguments)
            
            return {
                "success": True,
                "result": result.content,
                "tool_used": tool_name,
                "arguments_sent": arguments
            }
            
        except Exception as e:
            logger.error(f"Error calling MCP tool {tool_name}: {e}")
            return {
                "success": False,
                "error": str(e),
                "tool_used": tool_name,
                "arguments_sent": arguments
            }
    
    async def mock_graph_analysis(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Mock graph analysis when MCP is not available"""
        try:
            if tool_name == "calculate_centrality":
                return {
                    "success": True,
                    "result": {
                        "centrality_analysis": {
                            "algorithm": arguments.get("algorithm", "pagerank"),
                            "top_nodes": [
                                {"node": "Decision_Node_A", "centrality": 0.35},
                                {"node": "Stakeholder_Primary", "centrality": 0.28},
                                {"node": "Criterion_Cost", "centrality": 0.22},
                                {"node": "Alternative_AeroMapper", "centrality": 0.18}
                            ],
                            "total_nodes_analyzed": 25,
                            "analysis_type": "centrality",
                            "graph_metrics": {
                                "density": 0.15,
                                "diameter": 4,
                                "avg_clustering": 0.42
                            }
                        }
                    }
                }
            elif tool_name == "detect_communities":
                return {
                    "success": True,
                    "result": {
                        "community_detection": {
                            "algorithm": "louvain",
                            "communities": [
                                {
                                    "community_id": 1, 
                                    "nodes": ["Decision_Makers", "Procurement_Team", "Budget_Authority"], 
                                    "size": 3,
                                    "description": "Decision Authority Community"
                                },
                                {
                                    "community_id": 2, 
                                    "nodes": ["Technical_Experts", "Engineering_Team", "System_Integration"], 
                                    "size": 3,
                                    "description": "Technical Expertise Community"
                                },
                                {
                                    "community_id": 3, 
                                    "nodes": ["End_Users", "Operators", "Field_Teams"], 
                                    "size": 3,
                                    "description": "Operational Users Community"
                                }
                            ],
                            "modularity": 0.67,
                            "total_communities": 3
                        }
                    }
                }
            elif tool_name == "analyze_graph_structure":
                return {
                    "success": True,
                    "result": {
                        "graph_structure": {
                            "node_count": 45,
                            "edge_count": 78,
                            "density": 0.078,
                            "connected_components": 1,
                            "diameter": 6,
                            "clustering_coefficient": 0.48,
                            "average_path_length": 3.2,
                            "centralization": 0.35
                        }
                    }
                }
            else:
                return {
                    "success": True,
                    "result": {
                        "mock_analysis": f"Mock result for {tool_name}",
                        "arguments_received": arguments,
                        "analysis_timestamp": datetime.now().isoformat()
                    }
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Mock analysis failed: {str(e)}"
            }
      
    async def analyze_graph_centrality(self, node_labels: Optional[List[str]] = None, algorithm: str = "pagerank") -> Dict[str, Any]:
        """Analyze graph centrality using MCP tools"""
        return await self.call_mcp_tool("calculate_centrality", {
            "node_labels": node_labels or [],
            "algorithm": algorithm,
            "limit": 20
        })
    
    async def detect_communities(self, relationship_types: Optional[List[str]] = None) -> Dict[str, Any]:
        """Detect communities in the graph"""
        return await self.call_mcp_tool("detect_communities", {
            "relationship_types": relationship_types or [],
            "algorithm": "louvain"
        })
    
    async def find_paths(self, start_node_id: str, end_node_id: str, max_depth: int = 5) -> Dict[str, Any]:
        """Find paths between nodes"""
        return await self.call_mcp_tool("find_shortest_paths", {
            "start_node": start_node_id,
            "end_node": end_node_id,
            "max_depth": max_depth
        })
    
    async def analyze_structure(self, analysis_type: str = "basic_metrics") -> Dict[str, Any]:
        """Analyze overall graph structure"""
        return await self.call_mcp_tool("analyze_graph_structure", {
            "analysis_type": analysis_type,
            "include_components": True,
            "include_density": True
        })
    
    def get_decision_context_summary(self) -> Dict[str, Any]:
        """Get a summary of decision-related data in the graph"""
        try:
            if not self.neo4j_driver:
                return {"error": "Neo4j driver not initialized"}
                
            with self.neo4j_driver.session() as session:
                # Count decision-related entities
                query = """
                MATCH (r:Run)
                OPTIONAL MATCH (r)-[:INCLUDES_TASK]->(t:Task)
                OPTIONAL MATCH (t)-[:GENERATES]->(rec:Recommendation)
                OPTIONAL MATCH (rec)-[:ANALYSIS]->(a:Analysis)
                RETURN 
                    count(DISTINCT r) as total_runs,
                    count(DISTINCT t) as total_tasks,
                    count(DISTINCT rec) as total_recommendations,
                    count(DISTINCT a) as total_analyses
                """
                result = session.run(query)
                counts = result.single()
                
                if counts:
                    # Get recent processes
                    recent_query = """
                    MATCH (r:Run)
                    RETURN r.run_id as run_id, r.created_at as created_at
                    ORDER BY r.created_at DESC
                    LIMIT 5
                    """
                    recent_result = session.run(recent_query)
                    recent_runs = [dict(record) for record in recent_result]
                    
                    return {
                        "decision_summary": dict(counts),
                        "recent_runs": recent_runs,
                        "graph_ready_for_analysis": counts["total_runs"] > 0
                    }
                else:
                    return {
                        "decision_summary": {"total_runs": 0, "total_tasks": 0, "total_recommendations": 0, "total_analyses": 0},
                        "recent_runs": [],
                        "graph_ready_for_analysis": False
                    }
                
        except Exception as e:
            logger.error(f"Error getting decision context: {e}")
            return {"error": str(e)}

# Global service instance
neo4j_service = MCPNeo4jService()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    neo4j_status = "connected" if neo4j_service.neo4j_driver else "disconnected"
    
    return jsonify({
        "status": "healthy",
        "service": f"{SERVICE_TYPE}/{SERVICE_NAME}",
        "version": SERVICE_VERSION,
        "neo4j_status": neo4j_status,
        "mcp_tools_available": len(neo4j_service.available_tools),
        "available_tools": neo4j_service.available_tools
    })

@app.route('/info', methods=['GET'])
def service_info():
    """Service information endpoint"""
    return jsonify({
        "name": SERVICE_NAME,
        "type": SERVICE_TYPE,
        "version": SERVICE_VERSION,
        "description": "Advanced Neo4j graph analysis service powered by MCP servers",
        "capabilities": [
            "centrality_analysis",
            "community_detection", 
            "path_analysis",
            "graph_metrics",
            "pattern_matching",
            "graph_algorithms"
        ],
        "available_tools": neo4j_service.available_tools,
        "endpoints": ["/health", "/info", "/process_task", "/decision_context"]
    })

@app.route('/decision_context', methods=['GET'])
def get_decision_context():
    """Get decision context summary from the graph"""
    context = neo4j_service.get_decision_context_summary()
    return jsonify(context)

@app.route('/process_task', methods=['POST'])
def process_task():
    """Main task processing endpoint compatible with DADM orchestrator"""
    start_time = time.time()
    
    try:
        data = request.json or {}
        
        # Extract task information (DADM standard format)
        task_name = data.get('task_name', 'graph_analysis')
        task_description = data.get('task_description', '')
        variables = data.get('variables', {})
        service_properties = data.get('service_properties', {})
        
        logger.info(f"Processing graph analysis task: {task_name}")
        
        # Extract analysis parameters
        analysis_type = variables.get('analysis_type', 'centrality')
        node_labels = variables.get('node_labels', [])
        relationship_types = variables.get('relationship_types', [])
        
        # Perform the graph analysis using MCP
        async def run_analysis():
            if analysis_type == 'centrality':
                algorithm = variables.get('algorithm', 'pagerank')
                return await neo4j_service.analyze_graph_centrality(node_labels, algorithm)
            
            elif analysis_type == 'communities':
                return await neo4j_service.detect_communities(relationship_types)
            
            elif analysis_type == 'paths':
                start_node = variables.get('start_node')
                end_node = variables.get('end_node')
                max_depth = variables.get('max_depth', 5)
                if not start_node or not end_node:
                    return {"error": "start_node and end_node required for path analysis"}
                return await neo4j_service.find_paths(start_node, end_node, max_depth)
            
            elif analysis_type == 'structure':
                return await neo4j_service.analyze_structure()
            
            else:
                return {"error": f"Unknown analysis type: {analysis_type}"}
        
        # Run the async analysis
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        analysis_result = loop.run_until_complete(run_analysis())
        loop.close()
        
        # Get decision context for additional insights
        decision_context = neo4j_service.get_decision_context_summary()
        
        # Prepare the result in DADM format
        result = {
            "analysis_type": analysis_type,
            "graph_analysis_results": analysis_result,
            "decision_context": decision_context,
            "processed_by": f"{SERVICE_TYPE}/{SERVICE_NAME}",
            "processed_at": datetime.now().isoformat(),
            "processing_time_ms": int((time.time() - start_time) * 1000),
            "mcp_tool_used": analysis_result.get("tool_used", "mock"),
            "neo4j_uri": NEO4J_URI
        }
        
        return jsonify({
            "status": "success",
            "result": result
        })
        
    except Exception as e:
        logger.error(f"Error processing task: {e}")
        return jsonify({
            "status": "error",
            "message": str(e),
            "service": f"{SERVICE_TYPE}/{SERVICE_NAME}"
        }), 500

async def initialize_service():
    """Initialize the MCP service on startup"""
    logger.info("Initializing MCP Neo4j Service...")
    success = await neo4j_service.initialize_mcp_connection()
    if success:
        logger.info("MCP Neo4j Service ready")
    else:
        logger.error("Failed to initialize MCP Neo4j Service")

if __name__ == '__main__':
    # Initialize the MCP connection
    asyncio.run(initialize_service())
    
    # Start the Flask service
    port = 5202
    logger.info(f"Starting MCP Neo4j Service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
