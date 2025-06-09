#!/usr/bin/env python3
"""
Data Persistence Manager for DADM

This module provides comprehensive data persistence for OpenAI service interactions:
- Stores inputs, responses, and metadata in Qdrant vector store
- Stores process flow and relationships in Neo4j graph database
- Tracks runs separately for multiple executions
- Provides endpoints for clearing databases
"""

import os
import json
import logging
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
import hashlib

# Database clients
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from sentence_transformers import SentenceTransformer
from neo4j import GraphDatabase
from neo4j.exceptions import ServiceUnavailable, AuthError

# Set up logging
logger = logging.getLogger(__name__)

class DataPersistenceManager:
    """
    Manages data persistence for DADM OpenAI service interactions
    """
    
    def __init__(self, 
                 qdrant_host: str = "localhost",
                 qdrant_port: int = 6333,
                 neo4j_uri: str = "bolt://localhost:7687",
                 neo4j_user: str = "neo4j",
                 neo4j_password: str = "password",
                 embedding_model: str = "all-MiniLM-L6-v2"):
        """
        Initialize the data persistence manager
        
        Args:
            qdrant_host: Qdrant server host
            qdrant_port: Qdrant server port  
            neo4j_uri: Neo4j database URI
            neo4j_user: Neo4j username
            neo4j_password: Neo4j password
            embedding_model: SentenceTransformer model for embeddings
        """
        self.qdrant_host = qdrant_host
        self.qdrant_port = qdrant_port
        self.neo4j_uri = neo4j_uri
        self.neo4j_user = neo4j_user
        self.neo4j_password = neo4j_password
        
        # Initialize clients
        self.qdrant_client = None
        self.neo4j_driver = None
        self.embedding_model = None
        
        # Collection/database names
        self.qdrant_collection = "dadm_interactions"
        
        # Try to initialize connections
        self._initialize_connections(embedding_model)
    
    def _initialize_connections(self, embedding_model_name: str):
        """Initialize database connections"""
        try:
            # Initialize Qdrant client
            self.qdrant_client = QdrantClient(host=self.qdrant_host, port=self.qdrant_port)
            logger.info(f"Connected to Qdrant at {self.qdrant_host}:{self.qdrant_port}")
            
            # Initialize embedding model
            self.embedding_model = SentenceTransformer(embedding_model_name)
            logger.info(f"Loaded embedding model: {embedding_model_name}")
            
            # Ensure collection exists
            self._ensure_qdrant_collection()
            
        except Exception as e:
            logger.warning(f"Failed to initialize Qdrant: {e}")
            self.qdrant_client = None
            
        try:
            # Initialize Neo4j driver
            self.neo4j_driver = GraphDatabase.driver(
                self.neo4j_uri, 
                auth=(self.neo4j_user, self.neo4j_password)
            )
            
            # Test connection
            with self.neo4j_driver.session() as session:
                session.run("RETURN 1")
            logger.info(f"Connected to Neo4j at {self.neo4j_uri}")
            
            # Ensure constraints and indexes exist
            self._ensure_neo4j_schema()
            
        except (ServiceUnavailable, AuthError) as e:
            logger.warning(f"Failed to initialize Neo4j: {e}")
            self.neo4j_driver = None
        except Exception as e:
            logger.warning(f"Unexpected error initializing Neo4j: {e}")
            self.neo4j_driver = None
    
    def _ensure_qdrant_collection(self):
        """Ensure the Qdrant collection exists with proper configuration"""
        try:
            # Check if collection exists
            collections = self.qdrant_client.get_collections().collections
            collection_names = [c.name for c in collections]
            
            if self.qdrant_collection not in collection_names:
                # Create collection
                self.qdrant_client.create_collection(
                    collection_name=self.qdrant_collection,
                    vectors_config=VectorParams(size=384, distance=Distance.COSINE)  # all-MiniLM-L6-v2 size
                )
                logger.info(f"Created Qdrant collection: {self.qdrant_collection}")
            else:
                logger.info(f"Qdrant collection already exists: {self.qdrant_collection}")
                
        except Exception as e:
            logger.error(f"Error ensuring Qdrant collection: {e}")
            raise
    
    def _ensure_neo4j_schema(self):
        """Ensure Neo4j constraints and indexes exist"""
        try:
            with self.neo4j_driver.session() as session:
                # Create constraints and indexes for better performance
                constraints_and_indexes = [
                    "CREATE CONSTRAINT run_id_unique IF NOT EXISTS FOR (r:Run) REQUIRE r.run_id IS UNIQUE",
                    "CREATE CONSTRAINT process_instance_unique IF NOT EXISTS FOR (p:ProcessInstance) REQUIRE p.process_instance_id IS UNIQUE", 
                    "CREATE CONSTRAINT task_unique IF NOT EXISTS FOR (t:Task) REQUIRE (t.task_name, t.process_instance_id) IS UNIQUE",
                    "CREATE INDEX task_name_index IF NOT EXISTS FOR (t:Task) ON (t.task_name)",
                    "CREATE INDEX assistant_id_index IF NOT EXISTS FOR (t:Task) ON (t.assistant_id)",
                    "CREATE INDEX thread_id_index IF NOT EXISTS FOR (t:Task) ON (t.thread_id)"
                ]
                
                for statement in constraints_and_indexes:
                    try:
                        session.run(statement)
                    except Exception as e:
                        # Constraints might already exist, that's okay
                        logger.debug(f"Constraint/index statement result: {e}")
                
                logger.info("Neo4j schema constraints and indexes ensured")
                
        except Exception as e:
            logger.error(f"Error ensuring Neo4j schema: {e}")
    
    def generate_run_id(self, process_name: str = None) -> str:
        """Generate a unique run ID"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_suffix = str(uuid.uuid4())[:8]
        
        if process_name:
            # Clean process name for use in ID
            clean_name = "".join(c for c in process_name if c.isalnum() or c in "-_").lower()
            return f"{clean_name}_{timestamp}_{unique_suffix}"
        else:
            return f"dadm_run_{timestamp}_{unique_suffix}"
    
    def store_interaction(self, 
                         run_id: str,
                         process_instance_id: str,
                         task_data: Dict[str, Any],
                         decision_context: str = None,
                         supporting_files: List[str] = None) -> bool:
        """
        Store a complete interaction in both Qdrant and Neo4j
        
        Args:
            run_id: Unique identifier for this run
            process_instance_id: Camunda process instance ID
            task_data: Complete task data including inputs and outputs
            decision_context: The DECISION_CONTEXT for this run
            supporting_files: List of supporting file paths
            
        Returns:
            bool: True if successful, False otherwise
        """
        success = True
        
        # Store in Qdrant
        if self.qdrant_client and self.embedding_model:
            try:
                self._store_in_qdrant(run_id, process_instance_id, task_data, decision_context, supporting_files)
                logger.info(f"Stored interaction in Qdrant for run {run_id}")
            except Exception as e:
                logger.error(f"Failed to store in Qdrant: {e}")
                success = False
        else:
            logger.warning("Qdrant not available, skipping vector storage")
        
        # Store in Neo4j  
        if self.neo4j_driver:
            try:
                self._store_in_neo4j(run_id, process_instance_id, task_data, decision_context, supporting_files)
                logger.info(f"Stored interaction in Neo4j for run {run_id}")
            except Exception as e:
                logger.error(f"Failed to store in Neo4j: {e}")
                success = False
        else:
            logger.warning("Neo4j not available, skipping graph storage")
        
        return success
    
    def _store_in_qdrant(self, 
                        run_id: str,
                        process_instance_id: str, 
                        task_data: Dict[str, Any],
                        decision_context: str,
                        supporting_files: List[str]):
        """Store interaction data in Qdrant vector store"""
        
        # Prepare text content for embedding
        text_content = self._prepare_text_for_embedding(task_data, decision_context)
        
        # Generate embedding
        embedding = self.embedding_model.encode(text_content).tolist()
        
        # Create point ID
        point_id = hashlib.md5(f"{run_id}_{task_data.get('task_name', 'unknown')}_{process_instance_id}".encode()).hexdigest()
        
        # Prepare metadata
        metadata = {
            "run_id": run_id,
            "process_instance_id": process_instance_id,
            "task_name": task_data.get("task_name", "unknown"),
            "assistant_id": task_data.get("assistant_id", ""),
            "thread_id": task_data.get("thread_id", ""),
            "processed_at": task_data.get("processed_at", datetime.now().isoformat()),
            "processed_by": task_data.get("processed_by", ""),
            "decision_context": decision_context or "",
            "supporting_files": supporting_files or [],
            "recommendation": json.dumps(task_data.get("recommendation", {})) if isinstance(task_data.get("recommendation"), dict) else str(task_data.get("recommendation", "")),
            "text_content": text_content,
            "timestamp": datetime.now().isoformat()
        }
        
        # Store point
        point = PointStruct(
            id=point_id,
            vector=embedding, 
            payload=metadata
        )
        
        self.qdrant_client.upsert(
            collection_name=self.qdrant_collection,
            points=[point]
        )
        
        logger.debug(f"Stored point {point_id} in Qdrant")
    
    def _store_in_neo4j(self, 
                       run_id: str,
                       process_instance_id: str,
                       task_data: Dict[str, Any], 
                       decision_context: str,
                       supporting_files: List[str]):
        """Store interaction data in Neo4j graph database"""
        
        with self.neo4j_driver.session() as session:
            # Create or merge run node
            session.run("""
                MERGE (r:Run {run_id: $run_id})
                ON CREATE SET 
                    r.created_at = datetime(),
                    r.decision_context = $decision_context,
                    r.supporting_files = $supporting_files
            """, run_id=run_id, decision_context=decision_context, supporting_files=supporting_files or [])
            
            # Create or merge process instance node
            session.run("""
                MERGE (p:ProcessInstance {process_instance_id: $process_instance_id})
                ON CREATE SET p.created_at = datetime()
            """, process_instance_id=process_instance_id)
            
            # Create relationship between run and process instance
            session.run("""
                MATCH (r:Run {run_id: $run_id})
                MATCH (p:ProcessInstance {process_instance_id: $process_instance_id})
                MERGE (r)-[:EXECUTED_PROCESS]->(p)
            """, run_id=run_id, process_instance_id=process_instance_id)
            
            # Create or merge task node
            task_name = task_data.get("task_name", "unknown")
            session.run("""
                MERGE (t:Task {task_name: $task_name, process_instance_id: $process_instance_id})
                SET 
                    t.assistant_id = $assistant_id,
                    t.thread_id = $thread_id,
                    t.processed_at = $processed_at,
                    t.processed_by = $processed_by,
                    t.recommendation = $recommendation,
                    t.updated_at = datetime()
            """, 
            task_name=task_name,
            process_instance_id=process_instance_id,
            assistant_id=task_data.get("assistant_id", ""),
            thread_id=task_data.get("thread_id", ""),
            processed_at=task_data.get("processed_at", ""),
            processed_by=task_data.get("processed_by", ""),
            recommendation=json.dumps(task_data.get("recommendation", {})) if isinstance(task_data.get("recommendation"), dict) else str(task_data.get("recommendation", ""))
            )
            
            # Create relationships
            session.run("""
                MATCH (p:ProcessInstance {process_instance_id: $process_instance_id})
                MATCH (t:Task {task_name: $task_name, process_instance_id: $process_instance_id})
                MERGE (p)-[:HAS_TASK]->(t)
            """, process_instance_id=process_instance_id, task_name=task_name)
            
            session.run("""
                MATCH (r:Run {run_id: $run_id})
                MATCH (t:Task {task_name: $task_name, process_instance_id: $process_instance_id})
                MERGE (r)-[:INCLUDES_TASK]->(t)
            """, run_id=run_id, task_name=task_name, process_instance_id=process_instance_id)
            
            # Expand recommendation JSON into nodes and relationships
            recommendation = task_data.get("recommendation")
            if recommendation:
                self._expand_recommendation_json(session, task_name, process_instance_id, recommendation)
            
            logger.debug(f"Stored task {task_name} in Neo4j")
    
    def _expand_recommendation_json(self, session, task_name, process_instance_id, recommendation, parent_node_id=None, relationship_name=None):
        """Recursively expand recommendation JSON into Neo4j nodes and relationships with clear hierarchical structure."""
        if isinstance(recommendation, dict):
            for key, value in recommendation.items():
                node_id = f"{task_name}_{process_instance_id}_{key}_{uuid.uuid4().hex[:8]}"
                session.run("""
                    MERGE (n:RecommendationNode {node_id: $node_id})
                    SET n.key = $key, n.task_name = $task_name, n.process_instance_id = $process_instance_id
                """, node_id=node_id, key=key, task_name=task_name, process_instance_id=process_instance_id)

                rel_name = key.upper().replace(" ", "_").replace("-", "_")
                if parent_node_id:
                    session.run(f"""
                        MATCH (parent:RecommendationNode {{node_id: $parent_node_id}}), (child:RecommendationNode {{node_id: $node_id}})
                        MERGE (parent)-[:{rel_name}]->(child)
                    """, parent_node_id=parent_node_id, node_id=node_id)
                else:
                    session.run(f"""
                        MATCH (task:Task {{task_name: $task_name, process_instance_id: $process_instance_id}}), (child:RecommendationNode {{node_id: $node_id}})
                        MERGE (task)-[:{rel_name}]->(child)
                    """, task_name=task_name, process_instance_id=process_instance_id, node_id=node_id)

                self._expand_recommendation_json(session, task_name, process_instance_id, value, node_id, rel_name)

        elif isinstance(recommendation, list):
            for idx, item in enumerate(recommendation):
                item_node_id = f"{task_name}_{process_instance_id}_item_{uuid.uuid4().hex[:8]}"
                session.run("""
                    MERGE (n:RecommendationNode {node_id: $item_node_id})
                    SET n.index = $idx, n.task_name = $task_name, n.process_instance_id = $process_instance_id
                """, item_node_id=item_node_id, idx=idx, task_name=task_name, process_instance_id=process_instance_id)

                if parent_node_id and relationship_name:
                    session.run(f"""
                        MATCH (parent:RecommendationNode {{node_id: $parent_node_id}}), (child:RecommendationNode {{node_id: $item_node_id}})
                        MERGE (parent)-[:{relationship_name}_ITEM]->(child)
                    """, parent_node_id=parent_node_id, item_node_id=item_node_id)

                self._expand_recommendation_json(session, task_name, process_instance_id, item, item_node_id, relationship_name)

        else:
            value_node_id = f"{task_name}_{process_instance_id}_value_{uuid.uuid4().hex[:8]}"
            session.run("""
                MERGE (n:RecommendationNode {node_id: $value_node_id})
                SET n.value = $value, n.task_name = $task_name, n.process_instance_id = $process_instance_id
            """, value_node_id=value_node_id, value=str(recommendation), task_name=task_name, process_instance_id=process_instance_id)

            if parent_node_id and relationship_name:
                session.run(f"""
                    MATCH (parent:RecommendationNode {{node_id: $parent_node_id}}), (child:RecommendationNode {{node_id: $value_node_id}})
                    MERGE (parent)-[:{relationship_name}_VALUE]->(child)
                """, parent_node_id=parent_node_id, value_node_id=value_node_id)
    
    def _prepare_text_for_embedding(self, task_data: Dict[str, Any], decision_context: str) -> str:
        """Prepare text content for embedding generation"""
        
        parts = []
        
        # Add decision context
        if decision_context:
            parts.append(f"Decision Context: {decision_context}")
        
        # Add task name
        if task_data.get("task_name"):
            parts.append(f"Task: {task_data['task_name']}")
        
        # Add recommendation content
        recommendation = task_data.get("recommendation", {})
        if isinstance(recommendation, dict):
            # Extract key fields from recommendation
            for key in ["justification", "recommended_platform", "advantages", "next_steps", "implementation_considerations"]:
                if key in recommendation:
                    value = recommendation[key]
                    if isinstance(value, list):
                        parts.append(f"{key.replace('_', ' ').title()}: {'; '.join(str(v) for v in value)}")
                    else:
                        parts.append(f"{key.replace('_', ' ').title()}: {str(value)}")
        elif recommendation:
            parts.append(f"Recommendation: {str(recommendation)}")
        
        # Add processed by information
        if task_data.get("processed_by"):
            parts.append(f"Processed by: {task_data['processed_by']}")
        
        return " | ".join(parts)
    
    def search_interactions(self, 
                           query: str, 
                           run_id: str = None, 
                           limit: int = 10,
                           score_threshold: float = 0.7) -> List[Dict[str, Any]]:
        """
        Search interactions in the vector store
        
        Args:
            query: Search query text
            run_id: Optional run ID to filter by
            limit: Maximum number of results to return
            score_threshold: Minimum similarity score threshold
            
        Returns:
            List of matching interactions with scores
        """
        if not self.qdrant_client or not self.embedding_model:
            logger.warning("Qdrant not available for search")
            return []
        
        try:
            # Generate query embedding
            query_embedding = self.embedding_model.encode(query).tolist()
            
            # Prepare filter
            filter_conditions = None
            if run_id:
                filter_conditions = Filter(
                    must=[FieldCondition(key="run_id", match=MatchValue(value=run_id))]
                )
            
            # Search
            search_results = self.qdrant_client.search(
                collection_name=self.qdrant_collection,
                query_vector=query_embedding,
                query_filter=filter_conditions,
                limit=limit,
                score_threshold=score_threshold
            )
            
            # Format results
            results = []
            for result in search_results:
                result_data = result.payload.copy()
                result_data["similarity_score"] = result.score
                results.append(result_data)
            
            logger.info(f"Found {len(results)} matching interactions")
            return results
            
        except Exception as e:
            logger.error(f"Error searching interactions: {e}")
            return []
    
    def query_graph(self, cypher_query: str, parameters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Execute a Cypher query against the Neo4j graph database
        
        Args:
            cypher_query: Cypher query string
            parameters: Query parameters
            
        Returns:
            List of query results
        """
        if not self.neo4j_driver:
            logger.warning("Neo4j not available for graph queries")
            return []
        
        try:
            with self.neo4j_driver.session() as session:
                result = session.run(cypher_query, parameters or {})
                records = [record.data() for record in result]
                logger.info(f"Graph query returned {len(records)} records")
                return records
                
        except Exception as e:
            logger.error(f"Error executing graph query: {e}")
            return []
    
    def clear_vector_store(self) -> bool:
        """Clear all data from the Qdrant vector store"""
        if not self.qdrant_client:
            logger.warning("Qdrant not available")
            return False
        
        try:
            # Delete and recreate collection
            self.qdrant_client.delete_collection(self.qdrant_collection)
            self._ensure_qdrant_collection()
            logger.info("Cleared Qdrant vector store")
            return True
            
        except Exception as e:
            logger.error(f"Error clearing vector store: {e}")
            return False
    
    def clear_graph_database(self) -> bool:
        """Clear all DADM data from the Neo4j graph database"""
        if not self.neo4j_driver:
            logger.warning("Neo4j not available")
            return False
        
        try:
            with self.neo4j_driver.session() as session:
                # Delete all DADM-related nodes and relationships
                session.run("MATCH (n:Run) DETACH DELETE n")
                session.run("MATCH (n:ProcessInstance) DETACH DELETE n") 
                session.run("MATCH (n:Task) DETACH DELETE n")
                logger.info("Cleared Neo4j graph database")
                return True
                
        except Exception as e:
            logger.error(f"Error clearing graph database: {e}")
            return False
    
    def get_run_summary(self, run_id: str) -> Dict[str, Any]:
        """Get a summary of a specific run from both databases"""
        summary = {
            "run_id": run_id,
            "vector_data": [],
            "graph_data": {}
        }
        
        # Get vector data
        if self.qdrant_client:
            try:
                # Search for all points with this run_id
                search_results = self.qdrant_client.scroll(
                    collection_name=self.qdrant_collection,
                    scroll_filter=Filter(
                        must=[FieldCondition(key="run_id", match=MatchValue(value=run_id))]
                    ),
                    limit=100
                )
                
                summary["vector_data"] = [point.payload for point in search_results[0]]
                
            except Exception as e:
                logger.error(f"Error getting vector data for run {run_id}: {e}")
        
        # Get graph data
        if self.neo4j_driver:
            try:
                cypher_query = """
                MATCH (r:Run {run_id: $run_id})-[:EXECUTED_PROCESS]->(p:ProcessInstance)
                OPTIONAL MATCH (r)-[:INCLUDES_TASK]->(t:Task)
                RETURN r, p, collect(t) as tasks
                """
                
                results = self.query_graph(cypher_query, {"run_id": run_id})
                if results:
                    summary["graph_data"] = results[0]
            except Exception as e:
                logger.error(f"Error getting graph data for run {run_id}: {e}")
    
    def close(self):
        """Close database connections"""
        if self.neo4j_driver:
            self.neo4j_driver.close()
            logger.info("Closed Neo4j connection")
