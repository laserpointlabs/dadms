#!/usr/bin/env python3
"""
Enhanced Data Persistence Manager for DADM

This enhanced version properly parses OpenAI responses and creates structured
graph representations of decision analysis components.
"""

import os
import json
import logging
import uuid
import re
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
import hashlib

# Database clients
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from sentence_transformers import SentenceTransformer
from neo4j import GraphDatabase
from neo4j.exceptions import ServiceUnavailable, AuthError

# Set up logging
logger = logging.getLogger(__name__)

class EnhancedDataPersistenceManager:
    """
    Enhanced Data Persistence Manager that creates structured graph representations
    of decision analysis components from OpenAI responses.
    """
    
    def __init__(self, 
                 qdrant_host: str = "localhost",
                 qdrant_port: int = 6333,
                 neo4j_uri: str = "bolt://localhost:7687",
                 neo4j_user: str = "neo4j",
                 neo4j_password: str = "password",
                 embedding_model: str = "all-MiniLM-L6-v2"):
        """Initialize the enhanced data persistence manager"""
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
            
            # Ensure enhanced schema exists
            self._ensure_enhanced_neo4j_schema()
            
        except Exception as e:
            logger.error(f"Failed to initialize Neo4j: {e}")
            self.neo4j_driver = None

    def _ensure_qdrant_collection(self):
        """Ensure Qdrant collection exists"""
        try:
            collections = self.qdrant_client.get_collections().collections
            collection_names = [c.name for c in collections]
            
            if self.qdrant_collection not in collection_names:
                self.qdrant_client.create_collection(
                    collection_name=self.qdrant_collection,
                    vectors_config=VectorParams(size=384, distance=Distance.COSINE)
                )
                logger.info(f"Created Qdrant collection: {self.qdrant_collection}")
        except Exception as e:
            logger.error(f"Failed to ensure Qdrant collection: {e}")

    def _ensure_enhanced_neo4j_schema(self):
        """Ensure enhanced Neo4j schema with decision analysis constraints"""
        try:
            with self.neo4j_driver.session() as session:
                # Create constraints for decision analysis entities
                constraints = [
                    "CREATE CONSTRAINT run_id_unique IF NOT EXISTS FOR (r:Run) REQUIRE r.run_id IS UNIQUE",
                    "CREATE CONSTRAINT process_instance_id_unique IF NOT EXISTS FOR (p:ProcessInstance) REQUIRE p.process_instance_id IS UNIQUE", 
                    "CREATE CONSTRAINT task_unique IF NOT EXISTS FOR (t:Task) REQUIRE (t.task_name, t.process_instance_id) IS UNIQUE",
                    "CREATE CONSTRAINT decision_unique IF NOT EXISTS FOR (d:Decision) REQUIRE (d.decision_id, d.process_instance_id) IS UNIQUE",
                    "CREATE CONSTRAINT stakeholder_unique IF NOT EXISTS FOR (s:Stakeholder) REQUIRE (s.name, s.process_instance_id) IS UNIQUE",
                    "CREATE CONSTRAINT criterion_unique IF NOT EXISTS FOR (c:Criterion) REQUIRE (c.name, c.process_instance_id) IS UNIQUE",
                    "CREATE CONSTRAINT alternative_unique IF NOT EXISTS FOR (a:Alternative) REQUIRE (a.name, a.process_instance_id) IS UNIQUE",
                    "CREATE CONSTRAINT evaluation_unique IF NOT EXISTS FOR (e:Evaluation) REQUIRE (e.evaluation_id, e.process_instance_id) IS UNIQUE"
                ]
                
                for constraint in constraints:
                    try:
                        session.run(constraint)
                    except Exception as e:
                        if "already exists" not in str(e).lower():
                            logger.warning(f"Failed to create constraint: {e}")
                
                # Create indexes for better performance
                indexes = [
                    "CREATE INDEX task_name_idx IF NOT EXISTS FOR (t:Task) ON (t.task_name)",
                    "CREATE INDEX decision_type_idx IF NOT EXISTS FOR (d:Decision) ON (d.decision_type)",
                    "CREATE INDEX stakeholder_type_idx IF NOT EXISTS FOR (s:Stakeholder) ON (s.stakeholder_type)",
                    "CREATE INDEX criterion_weight_idx IF NOT EXISTS FOR (c:Criterion) ON (c.weight)",
                    "CREATE INDEX alternative_cost_idx IF NOT EXISTS FOR (a:Alternative) ON (a.cost)",
                    "CREATE INDEX evaluation_score_idx IF NOT EXISTS FOR (e:Evaluation) ON (e.score)"
                ]
                
                for index in indexes:
                    try:
                        session.run(index)
                    except Exception as e:
                        if "already exists" not in str(e).lower():
                            logger.warning(f"Failed to create index: {e}")
                
                logger.info("Enhanced Neo4j schema constraints and indexes ensured")
                
        except Exception as e:
            logger.error(f"Error ensuring enhanced Neo4j schema: {e}")

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
                  except Exception as e:
            logger.error(f"Error ensuring enhanced Neo4j schema: {e}")

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

    def store_enhanced_interaction(self, 
                                 run_id: str,
                                 process_instance_id: str,
                                 task_data: Dict[str, Any],
                                 decision_context: str = None,
                                 supporting_files: List[str] = None) -> bool:
        """
        Store interaction with enhanced parsing and structured graph creation
        """
        success = True
        
        # Store in Qdrant (unchanged for now)
        if self.qdrant_client and self.embedding_model:
            try:
                self._store_in_qdrant(run_id, process_instance_id, task_data, decision_context, supporting_files)
                logger.info(f"Stored interaction in Qdrant for run {run_id}")
            except Exception as e:
                logger.error(f"Failed to store in Qdrant: {e}")
                success = False
        
        # Store in Neo4j with enhanced parsing
        if self.neo4j_driver:
            try:
                self._store_enhanced_neo4j(run_id, process_instance_id, task_data, decision_context, supporting_files)
                logger.info(f"Stored enhanced interaction in Neo4j for run {run_id}")
            except Exception as e:
                logger.error(f"Failed to store enhanced interaction in Neo4j: {e}")
                success = False
        
        return success

    def _store_enhanced_neo4j(self,
                             run_id: str,
                             process_instance_id: str,
                             task_data: Dict[str, Any],
                             decision_context: str,
                             supporting_files: List[str]):
        """Store interaction with enhanced parsing and structured graph creation"""
        
        with self.neo4j_driver.session() as session:
            # Create basic structure (Run, ProcessInstance, Task)
            self._create_basic_structure(session, run_id, process_instance_id, task_data, decision_context, supporting_files)
            
            # Parse and create decision analysis structure
            recommendation = task_data.get("recommendation", {})
            task_name = task_data.get("task_name", "")
            
            if isinstance(recommendation, str):
                try:
                    recommendation = json.loads(recommendation)
                except:
                    pass
            
            # Extract the actual AI response content
            response_content = ""
            if isinstance(recommendation, dict):
                response_content = recommendation.get("response", "")
            
            if response_content:
                # Parse based on task type
                if "FrameDecision" in task_name:
                    self._parse_frame_decision(session, process_instance_id, response_content)
                elif "IdentifyAlternatives" in task_name:
                    self._parse_alternatives(session, process_instance_id, response_content)
                elif "EvaluateAlternatives" in task_name:
                    self._parse_evaluations(session, process_instance_id, response_content)
                elif "MakeRecommendation" in task_name:
                    self._parse_recommendation(session, process_instance_id, response_content)
                
                logger.debug(f"Parsed {task_name} response content into structured graph")
            else:
                logger.warning(f"No response content found for task {task_name}")

    def _create_basic_structure(self, session, run_id, process_instance_id, task_data, decision_context, supporting_files):
        """Create basic Run -> ProcessInstance -> Task structure"""
        
        # Create or merge run node
        session.run(
            """
            MERGE (r:Run {run_id: $run_id})
            ON CREATE SET
                r.created_at = datetime(),
                r.decision_context = $decision_context,
                r.supporting_files = $supporting_files
            """,
            run_id=run_id,
            decision_context=decision_context,
            supporting_files=supporting_files or [],
        )

        # Create or merge process instance node
        session.run(
            """
            MERGE (p:ProcessInstance {process_instance_id: $process_instance_id})
            ON CREATE SET p.created_at = datetime()
            """,
            process_instance_id=process_instance_id,
        )

        # Create relationship between run and process instance
        session.run(
            """
            MATCH (r:Run {run_id: $run_id})
            MATCH (p:ProcessInstance {process_instance_id: $process_instance_id})
            MERGE (r)-[:EXECUTED_PROCESS]->(p)
            """,
            run_id=run_id,
            process_instance_id=process_instance_id,
        )

        # Create or merge task node
        task_name = task_data.get("task_name", "unknown")
        session.run(
            """
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
            recommendation=json.dumps(task_data.get("recommendation", {}))
            if isinstance(task_data.get("recommendation"), dict)
            else str(task_data.get("recommendation", "")),
        )

        # Create relationships
        session.run(
            """
            MATCH (p:ProcessInstance {process_instance_id: $process_instance_id})
            MATCH (t:Task {task_name: $task_name, process_instance_id: $process_instance_id})
            MERGE (p)-[:HAS_TASK]->(t)
            """,
            process_instance_id=process_instance_id,
            task_name=task_name,
        )

    def _parse_frame_decision(self, session, process_instance_id: str, response_content: str):
        """Parse FrameDecision response and create Decision, Stakeholder, and Criterion nodes"""
        
        # Create main decision node
        decision_id = f"decision_{process_instance_id}"
        session.run(
            """
            MERGE (d:Decision {decision_id: $decision_id, process_instance_id: $process_instance_id})
            SET d.decision_type = 'primary',
                d.content = $content,
                d.created_at = datetime()
            """,
            decision_id=decision_id,
            process_instance_id=process_instance_id,
            content=response_content
        )
        
        # Link to process instance
        session.run(
            """
            MATCH (p:ProcessInstance {process_instance_id: $process_instance_id})
            MATCH (d:Decision {decision_id: $decision_id})
            MERGE (p)-[:HAS_DECISION]->(d)
            """,
            process_instance_id=process_instance_id,
            decision_id=decision_id
        )
        
        # Parse stakeholders
        stakeholder_patterns = [
            r"emergency response teams?[:\-]?\s*([^.]+)",
            r"procurement officers?[:\-]?\s*([^.]+)",
            r"technical experts?[:\-]?\s*([^.]+)",
            r"regulatory author[a-z]+[:\-]?\s*([^.]+)"
        ]
        
        for pattern in stakeholder_patterns:
            matches = re.findall(pattern, response_content, re.IGNORECASE)
            for match in matches:
                stakeholder_name = match.strip()[:100]  # Limit length
                if stakeholder_name:
                    session.run(
                        """
                        MERGE (s:Stakeholder {name: $name, process_instance_id: $process_instance_id})
                        SET s.interests = $interests,
                            s.created_at = datetime()
                        """,
                        name=stakeholder_name.lower().replace(":", "").strip(),
                        process_instance_id=process_instance_id,
                        interests=stakeholder_name
                    )
                    
                    session.run(
                        """
                        MATCH (d:Decision {decision_id: $decision_id})
                        MATCH (s:Stakeholder {name: $name, process_instance_id: $process_instance_id})
                        MERGE (d)-[:INVOLVES_STAKEHOLDER]->(s)
                        """,
                        decision_id=decision_id,
                        name=stakeholder_name.lower().replace(":", "").strip(),
                        process_instance_id=process_instance_id
                    )
        
        # Parse criteria from the response
        criteria_patterns = [
            r"operational[^.]*requirements?[:\-]?\s*([^.]+)",
            r"technical[^.]*capabilities?[:\-]?\s*([^.]+)",
            r"cost[^.]*constraints?[:\-]?\s*([^.]+)",
            r"regulatory[^.]*compliance[:\-]?\s*([^.]+)",
            r"endurance[:\-]?\s*([^.]+)",
            r"payload[:\-]?\s*([^.]+)",
            r"weather[^.]*conditions?[:\-]?\s*([^.]+)"
        ]
        
        for pattern in criteria_patterns:
            matches = re.findall(pattern, response_content, re.IGNORECASE)
            for match in matches:
                criterion_desc = match.strip()[:200]  # Limit length
                if criterion_desc:
                    criterion_name = pattern.split('[')[0].replace('r"', '').replace('\\', '')
                    session.run(
                        """
                        MERGE (c:Criterion {name: $name, process_instance_id: $process_instance_id})
                        SET c.description = $description,
                            c.created_at = datetime()
                        """,
                        name=criterion_name,
                        process_instance_id=process_instance_id,
                        description=criterion_desc
                    )
                    
                    session.run(
                        """
                        MATCH (d:Decision {decision_id: $decision_id})
                        MATCH (c:Criterion {name: $name, process_instance_id: $process_instance_id})
                        MERGE (d)-[:HAS_CRITERION]->(c)
                        """,
                        decision_id=decision_id,
                        name=criterion_name,
                        process_instance_id=process_instance_id
                    )

    def _parse_alternatives(self, session, process_instance_id: str, response_content: str):
        """Parse IdentifyAlternatives response and create Alternative nodes"""
        
        # Look for numbered alternatives or specific UAS models
        alternative_patterns = [
            r"#{1,4}\s*\d+[.\)]\s*\*{0,2}([^*\n]+)\*{0,2}[:\-]?\s*([^#]+?)(?=#{1,4}\s*\d+|$)",
            r"\*{2}([^*]+?)\*{2}[:\-]?\s*([^*]+?)(?=\*{2}|$)"
        ]
        
        for pattern in alternative_patterns:
            matches = re.findall(pattern, response_content, re.DOTALL)
            for match in matches:
                alt_name = match[0].strip()[:100]
                alt_description = match[1].strip()[:1000] if len(match) > 1 else ""
                
                if alt_name and len(alt_name) > 3:  # Filter out very short matches
                    # Extract cost if present
                    cost_pattern = r"\$([0-9,]+(?:\.[0-9]{2})?)"
                    cost_matches = re.findall(cost_pattern, alt_description)
                    cost = cost_matches[0].replace(',', '') if cost_matches else None
                    
                    session.run(
                        """
                        MERGE (a:Alternative {name: $name, process_instance_id: $process_instance_id})
                        SET a.description = $description,
                            a.cost = $cost,
                            a.created_at = datetime()
                        """,
                        name=alt_name,
                        process_instance_id=process_instance_id,
                        description=alt_description,
                        cost=cost
                    )
                    
                    # Link to process instance
                    session.run(
                        """
                        MATCH (p:ProcessInstance {process_instance_id: $process_instance_id})
                        MATCH (a:Alternative {name: $name, process_instance_id: $process_instance_id})
                        MERGE (p)-[:HAS_ALTERNATIVE]->(a)
                        """,
                        process_instance_id=process_instance_id,
                        name=alt_name
                    )

    def _parse_evaluations(self, session, process_instance_id: str, response_content: str):
        """Parse EvaluateAlternatives response and create Evaluation nodes"""
        
        # Look for scoring patterns
        score_patterns = [
            r"([^:\n]+):\s*([0-9\.]+)/([0-9\.]+)",
            r"([^:\n]+):\s*([0-9\.]+)\s*(?:out of|/)\s*([0-9\.]+)",
            r"([^:\n]+)\s*scores?\s*([0-9\.]+)"
        ]
        
        evaluation_id = f"eval_{process_instance_id}_{uuid.uuid4().hex[:8]}"
        
        # Create main evaluation node
        session.run(
            """
            MERGE (e:Evaluation {evaluation_id: $eval_id, process_instance_id: $process_instance_id})
            SET e.content = $content,
                e.created_at = datetime()
            """,
            eval_id=evaluation_id,
            process_instance_id=process_instance_id,
            content=response_content
        )
        
        # Link to process instance
        session.run(
            """
            MATCH (p:ProcessInstance {process_instance_id: $process_instance_id})
            MATCH (e:Evaluation {evaluation_id: $eval_id})
            MERGE (p)-[:HAS_EVALUATION]->(e)
            """,
            process_instance_id=process_instance_id,
            eval_id=evaluation_id
        )

    def _parse_recommendation(self, session, process_instance_id: str, response_content: str):
        """Parse MakeRecommendation response and create final recommendation structure"""
        
        recommendation_id = f"final_rec_{process_instance_id}"
        
        # Create recommendation node
        session.run(
            """
            MERGE (r:FinalRecommendation {recommendation_id: $rec_id, process_instance_id: $process_instance_id})
            SET r.content = $content,
                r.created_at = datetime()
            """,
            rec_id=recommendation_id,
            process_instance_id=process_instance_id,
            content=response_content
        )
        
        # Link to process instance
        session.run(
            """
            MATCH (p:ProcessInstance {process_instance_id: $process_instance_id})
            MATCH (r:FinalRecommendation {recommendation_id: $rec_id})
            MERGE (p)-[:HAS_FINAL_RECOMMENDATION]->(r)
            """,
            process_instance_id=process_instance_id,
            rec_id=recommendation_id
        )

    def _store_in_qdrant(self, run_id, process_instance_id, task_data, decision_context, supporting_files):
        """Store interaction data in Qdrant vector store (simplified version)"""
        try:
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
            
        except Exception as e:
            logger.error(f"Qdrant storage error: {e}")

    def _prepare_text_for_embedding(self, task_data: Dict[str, Any], decision_context: str) -> str:
        """Prepare text content for vector embedding"""
        parts = []
        
        if decision_context:
            parts.append(f"Context: {decision_context}")
        
        task_name = task_data.get("task_name", "")
        if task_name:
            parts.append(f"Task: {task_name}")
        
        recommendation = task_data.get("recommendation", {})
        if isinstance(recommendation, dict):
            response_content = recommendation.get("response", "")
            if response_content:
                parts.append(f"Response: {response_content}")
        
        return " | ".join(parts)

if __name__ == "__main__":
    # Test the enhanced manager
    manager = EnhancedDataPersistenceManager()
    print("Enhanced Data Persistence Manager initialized successfully")
