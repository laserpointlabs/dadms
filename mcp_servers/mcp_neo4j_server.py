#!/usr/bin/env python3
"""
MCP Neo4j Server
Implementation of an MCP server for Neo4j graph analytics
"""

import asyncio
import json
import logging
from typing import Any, Sequence, Dict, List

from neo4j import GraphDatabase
import networkx as nx
import pandas as pd

from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.types import (
    Resource, Tool, TextContent, ImageContent, EmbeddedResource
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mcp-neo4j-server")

# Create the server
server = Server("mcp-neo4j-server")

# Neo4j connection settings (these would typically come from environment variables)
NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "password"

class Neo4jAnalytics:
    """Neo4j analytics helper class"""
    
    def __init__(self, uri: str, user: str, password: str):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))
    
    def close(self):
        self.driver.close()
    
    def run_query(self, query: str, parameters: Dict = None) -> List[Dict]:
        """Execute a Cypher query and return results"""
        with self.driver.session() as session:
            result = session.run(query, parameters or {})
            return [record.data() for record in result]
    
    def get_graph_metrics(self) -> Dict[str, Any]:
        """Calculate basic graph metrics"""
        queries = {
            "node_count": "MATCH (n) RETURN count(n) as count",
            "relationship_count": "MATCH ()-[r]->() RETURN count(r) as count",
            "node_types": "MATCH (n) RETURN labels(n) as labels, count(n) as count",
            "relationship_types": "MATCH ()-[r]->() RETURN type(r) as type, count(r) as count"
        }
        
        metrics = {}
        for metric_name, query in queries.items():
            try:
                result = self.run_query(query)
                metrics[metric_name] = result
            except Exception as e:
                logger.error(f"Error calculating {metric_name}: {e}")
                metrics[metric_name] = {"error": str(e)}
        
        return metrics
    
    def calculate_centrality(self, node_label: str = None, limit: int = 10) -> Dict[str, Any]:
        """Calculate centrality measures for nodes"""
        # Degree centrality query
        if node_label:
            query = f"""
            MATCH (n:{node_label})
            OPTIONAL MATCH (n)-[r]-()
            WITH n, count(r) as degree
            RETURN n.name as name, id(n) as node_id, degree
            ORDER BY degree DESC
            LIMIT {limit}
            """
        else:
            query = f"""
            MATCH (n)
            OPTIONAL MATCH (n)-[r]-()
            WITH n, count(r) as degree, labels(n) as labels
            RETURN n.name as name, id(n) as node_id, degree, labels
            ORDER BY degree DESC
            LIMIT {limit}
            """
        
        try:
            results = self.run_query(query)
            return {
                "centrality_type": "degree",
                "node_label": node_label or "all",
                "top_nodes": results,
                "limit": limit
            }
        except Exception as e:
            return {"error": str(e)}
    
    def find_communities(self, algorithm: str = "louvain") -> Dict[str, Any]:
        """Find communities in the graph using graph algorithms"""
        # This is a simplified version - in practice you'd use Neo4j Graph Data Science library
        query = """
        CALL gds.graph.project('community-graph', '*', '*')
        YIELD graphName
        CALL gds.louvain.stream('community-graph')
        YIELD nodeId, communityId
        MATCH (n) WHERE id(n) = nodeId
        RETURN n.name as name, communityId, labels(n) as labels
        ORDER BY communityId
        """
        
        try:
            results = self.run_query(query)
            
            # Clean up the projected graph
            cleanup_query = "CALL gds.graph.drop('community-graph')"
            self.run_query(cleanup_query)
            
            return {
                "algorithm": algorithm,
                "communities": results
            }
        except Exception as e:
            # If GDS is not available, return a basic community detection
            return {
                "algorithm": "basic_clustering",
                "error": f"Graph Data Science library not available: {e}",
                "recommendation": "Install Neo4j Graph Data Science plugin for advanced community detection"
            }
    
    def analyze_paths(self, start_node_id: int, end_node_id: int = None, max_length: int = 5) -> Dict[str, Any]:
        """Analyze paths between nodes"""
        if end_node_id:
            # Find paths between specific nodes
            query = f"""
            MATCH path = (start)-[*1..{max_length}]-(end)
            WHERE id(start) = {start_node_id} AND id(end) = {end_node_id}
            RETURN path, length(path) as path_length
            ORDER BY path_length
            LIMIT 10
            """
        else:
            # Find paths from a starting node
            query = f"""
            MATCH path = (start)-[*1..{max_length}]-(end)
            WHERE id(start) = {start_node_id}
            RETURN path, length(path) as path_length, end.name as end_name
            ORDER BY path_length
            LIMIT 20
            """
        
        try:
            results = self.run_query(query)
            return {
                "start_node_id": start_node_id,
                "end_node_id": end_node_id,
                "max_length": max_length,
                "paths_found": len(results),
                "paths": results[:10]  # Limit results for readability
            }
        except Exception as e:
            return {"error": str(e)}

# Global analytics instance
neo4j_analytics = None

@server.list_tools()
async def handle_list_tools() -> list[Tool]:
    """List available Neo4j graph analytics tools"""
    return [
        Tool(
            name="get_graph_metrics",
            description="Get basic graph metrics (node count, relationship count, types)",
            inputSchema={
                "type": "object",
                "properties": {
                    "include_types": {
                        "type": "boolean",
                        "description": "Whether to include node and relationship type counts",
                        "default": True
                    }
                },
                "required": []
            }
        ),
        Tool(
            name="calculate_centrality",
            description="Calculate centrality measures for nodes in the graph",
            inputSchema={
                "type": "object",
                "properties": {
                    "node_label": {
                        "type": "string",
                        "description": "Optional node label to filter by"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of nodes to return",
                        "default": 10
                    },
                    "centrality_type": {
                        "type": "string", 
                        "enum": ["degree", "betweenness", "closeness"],
                        "description": "Type of centrality to calculate",
                        "default": "degree"
                    }
                },
                "required": []
            }
        ),
        Tool(
            name="find_communities",
            description="Detect communities in the graph using clustering algorithms",
            inputSchema={
                "type": "object",
                "properties": {
                    "algorithm": {
                        "type": "string",
                        "enum": ["louvain", "label_propagation", "weakly_connected"],
                        "description": "Community detection algorithm to use",
                        "default": "louvain"
                    },
                    "min_community_size": {
                        "type": "integer",
                        "description": "Minimum size for a community to be included",
                        "default": 2
                    }
                },
                "required": []
            }
        ),
        Tool(
            name="analyze_paths",
            description="Analyze paths between nodes in the graph",
            inputSchema={
                "type": "object",
                "properties": {
                    "start_node_id": {
                        "type": "integer",
                        "description": "ID of the starting node"
                    },
                    "end_node_id": {
                        "type": "integer",
                        "description": "Optional ID of the ending node"
                    },
                    "max_path_length": {
                        "type": "integer",
                        "description": "Maximum path length to consider",
                        "default": 5
                    }
                },
                "required": ["start_node_id"]
            }
        ),
        Tool(
            name="run_custom_cypher",
            description="Execute a custom Cypher query",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Cypher query to execute"
                    },
                    "parameters": {
                        "type": "object",
                        "description": "Query parameters",
                        "default": {}
                    }
                },
                "required": ["query"]
            }
        )
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> list[TextContent]:
    """Handle tool calls"""
    global neo4j_analytics
    
    if not neo4j_analytics:
        neo4j_analytics = Neo4jAnalytics(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)
    
    try:
        if name == "get_graph_metrics":
            result = neo4j_analytics.get_graph_metrics()
            
        elif name == "calculate_centrality":
            node_label = arguments.get("node_label")
            limit = arguments.get("limit", 10)
            result = neo4j_analytics.calculate_centrality(node_label, limit)
            
        elif name == "find_communities":
            algorithm = arguments.get("algorithm", "louvain")
            result = neo4j_analytics.find_communities(algorithm)
            
        elif name == "analyze_paths":
            start_node_id = arguments["start_node_id"]
            end_node_id = arguments.get("end_node_id")
            max_length = arguments.get("max_path_length", 5)
            result = neo4j_analytics.analyze_paths(start_node_id, end_node_id, max_length)
            
        elif name == "run_custom_cypher":
            query = arguments["query"]
            parameters = arguments.get("parameters", {})
            result = neo4j_analytics.run_query(query, parameters)
            
        else:
            result = {"error": f"Unknown tool: {name}"}
        
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
        
    except Exception as e:
        error_result = {"error": str(e), "tool": name, "arguments": arguments}
        return [TextContent(type="text", text=json.dumps(error_result, indent=2))]

async def main():
    """Main server entry point"""
    import sys
    from mcp.server.stdio import stdio_server
    
    logger.info("Starting MCP Neo4j Server")
    
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="mcp-neo4j-server",
                server_version="1.0.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )

if __name__ == "__main__":
    asyncio.run(main())
