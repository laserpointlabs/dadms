#!/usr/bin/env python3
"""
Analysis Data Manager

Decoupled storage and management of analysis data with multiple processing paths:
- Primary storage: Raw analysis data in structured format
- Secondary processing: Vector store, graph database, search indexes
- Thread/session management: Track related analyses and conversations
- Reprocessing: Apply different processing strategies to stored data
"""
import json
import logging
import uuid
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, field, asdict
import sqlite3
import os

# Optional imports for different storage backends
try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import Distance, VectorParams, PointStruct
    QDRANT_AVAILABLE = True
except ImportError:
    QDRANT_AVAILABLE = False

try:
    from neo4j import GraphDatabase
    NEO4J_AVAILABLE = True
except ImportError:
    NEO4J_AVAILABLE = False

logger = logging.getLogger(__name__)


class AnalysisStatus(Enum):
    """Status of an analysis"""
    CREATED = "created"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    ARCHIVED = "archived"


class ProcessingStatus(Enum):
    """Status of data processing"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class AnalysisMetadata:
    """Metadata for an analysis"""
    analysis_id: str
    thread_id: str
    session_id: Optional[str] = None
    process_instance_id: Optional[str] = None
    task_name: str = "unknown"
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    status: AnalysisStatus = AnalysisStatus.CREATED
    tags: List[str] = field(default_factory=list)
    source_service: str = "unknown"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary with datetime serialization"""
        result = asdict(self)
        result['created_at'] = self.created_at.isoformat()
        result['updated_at'] = self.updated_at.isoformat()
        result['status'] = self.status.value
        return result


@dataclass
class AnalysisData:
    """Complete analysis data structure"""
    metadata: AnalysisMetadata
    input_data: Dict[str, Any]
    output_data: Optional[Dict[str, Any]] = None
    raw_response: Optional[str] = None
    processing_log: List[Dict[str, Any]] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage"""
        return {
            'metadata': self.metadata.to_dict(),
            'input_data': self.input_data,
            'output_data': self.output_data,
            'raw_response': self.raw_response,
            'processing_log': self.processing_log
        }


@dataclass
class ProcessingTask:
    """A processing task for stored analysis data"""
    task_id: str
    analysis_id: str
    processor_type: str  # 'vector_store', 'graph_db', 'search_index', etc.
    status: ProcessingStatus = ProcessingStatus.PENDING
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class AnalysisDataManager:
    """
    Manages analysis data with decoupled storage and processing
    """
    
    def __init__(
        self,
        storage_dir: str = None,
        enable_vector_store: bool = True,
        enable_graph_db: bool = True,
        qdrant_host: str = "localhost",
        qdrant_port: int = 6333,
        neo4j_uri: str = "bolt://localhost:7687",
        neo4j_user: str = "neo4j",
        neo4j_password: str = "password"
    ):
        """
        Initialize the Analysis Data Manager
        
        Args:
            storage_dir: Directory for SQLite database and file storage
            enable_vector_store: Whether to enable Qdrant vector store
            enable_graph_db: Whether to enable Neo4j graph database
            qdrant_host: Qdrant host
            qdrant_port: Qdrant port
            neo4j_uri: Neo4j connection URI
            neo4j_user: Neo4j username
            neo4j_password: Neo4j password
        """
        # Setup storage directory
        if storage_dir is None:
            storage_dir = os.path.join(os.getcwd(), "data", "analysis_storage")
        
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize SQLite database for metadata and search
        self.db_path = self.storage_dir / "analysis_data.db"
        self._init_sqlite_db()
        
        # Initialize optional backends
        self.qdrant_client = None
        self.neo4j_driver = None
        
        if enable_vector_store and QDRANT_AVAILABLE:
            try:
                self.qdrant_client = QdrantClient(host=qdrant_host, port=qdrant_port)
                self._init_qdrant_collections()
                logger.info("Qdrant vector store initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Qdrant: {e}")
        
        if enable_graph_db and NEO4J_AVAILABLE:
            try:
                self.neo4j_driver = GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password))
                logger.info("Neo4j graph database initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Neo4j: {e}")
    
    def _init_sqlite_db(self):
        """Initialize SQLite database schema"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS analysis_metadata (
                    analysis_id TEXT PRIMARY KEY,
                    thread_id TEXT NOT NULL,
                    session_id TEXT,
                    process_instance_id TEXT,
                    task_name TEXT,
                    created_at TEXT,
                    updated_at TEXT,
                    status TEXT,
                    tags TEXT, -- JSON array
                    source_service TEXT
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS analysis_data (
                    analysis_id TEXT PRIMARY KEY,
                    input_data TEXT, -- JSON
                    output_data TEXT, -- JSON
                    raw_response TEXT,
                    processing_log TEXT, -- JSON
                    FOREIGN KEY (analysis_id) REFERENCES analysis_metadata (analysis_id)
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS processing_tasks (
                    task_id TEXT PRIMARY KEY,
                    analysis_id TEXT,
                    processor_type TEXT,
                    status TEXT,
                    created_at TEXT,
                    completed_at TEXT,
                    error_message TEXT,
                    metadata TEXT, -- JSON
                    FOREIGN KEY (analysis_id) REFERENCES analysis_metadata (analysis_id)
                )
            """)
            
            # Create indexes for common queries
            conn.execute("CREATE INDEX IF NOT EXISTS idx_thread_id ON analysis_metadata (thread_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_session_id ON analysis_metadata (session_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_status ON analysis_metadata (status)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_created_at ON analysis_metadata (created_at)")
            
            conn.commit()
    
    def _init_qdrant_collections(self):
        """Initialize Qdrant collections"""
        try:
            # Collection for analysis embeddings
            collection_name = "analysis_data"
            collections = self.qdrant_client.get_collections().collections
            
            if not any(c.name == collection_name for c in collections):
                self.qdrant_client.create_collection(
                    collection_name=collection_name,
                    vectors_config=VectorParams(size=384, distance=Distance.COSINE)  # all-MiniLM-L6-v2 size
                )
                logger.info(f"Created Qdrant collection: {collection_name}")
        except Exception as e:
            logger.error(f"Failed to initialize Qdrant collections: {e}")
    
    def store_analysis(
        self,
        thread_id: str,
        task_name: str,
        input_data: Dict[str, Any],
        output_data: Optional[Dict[str, Any]] = None,
        raw_response: Optional[str] = None,
        session_id: Optional[str] = None,
        process_instance_id: Optional[str] = None,
        tags: Optional[List[str]] = None,
        source_service: str = "unknown"
    ) -> str:
        """
        Store analysis data with metadata
        
        Args:
            thread_id: Thread/conversation ID
            task_name: Name of the task
            input_data: Input data for the analysis
            output_data: Structured output data (optional)
            raw_response: Raw response text (optional)
            session_id: Session ID (optional)
            process_instance_id: Process instance ID (optional)
            tags: Tags for categorization (optional)
            source_service: Source service name
        
        Returns:
            str: Analysis ID
        """
        analysis_id = str(uuid.uuid4())
        
        # Create metadata
        metadata = AnalysisMetadata(
            analysis_id=analysis_id,
            thread_id=thread_id,
            session_id=session_id,
            process_instance_id=process_instance_id,
            task_name=task_name,
            tags=tags or [],
            source_service=source_service
        )
        
        # Create analysis data
        analysis_data = AnalysisData(
            metadata=metadata,
            input_data=input_data,
            output_data=output_data,
            raw_response=raw_response
        )
        
        # Store in SQLite
        with sqlite3.connect(self.db_path) as conn:
            # Store metadata
            conn.execute("""
                INSERT INTO analysis_metadata (
                    analysis_id, thread_id, session_id, process_instance_id,
                    task_name, created_at, updated_at, status, tags, source_service
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                metadata.analysis_id,
                metadata.thread_id,
                metadata.session_id,
                metadata.process_instance_id,
                metadata.task_name,
                metadata.created_at.isoformat(),
                metadata.updated_at.isoformat(),
                metadata.status.value,
                json.dumps(metadata.tags),
                metadata.source_service
            ))
            
            # Store data
            conn.execute("""
                INSERT INTO analysis_data (
                    analysis_id, input_data, output_data, raw_response, processing_log
                ) VALUES (?, ?, ?, ?, ?)
            """, (
                analysis_id,
                json.dumps(input_data),
                json.dumps(output_data) if output_data else None,
                raw_response,
                json.dumps([])
            ))
            
            conn.commit()
        
        logger.info(f"Stored analysis data: {analysis_id}")
        
        # Queue processing tasks
        self._queue_processing_tasks(analysis_id)
        
        return analysis_id
    
    def _queue_processing_tasks(self, analysis_id: str):
        """Queue processing tasks for stored analysis"""
        tasks = []
        
        # Queue vector store processing if enabled
        if self.qdrant_client:
            tasks.append(ProcessingTask(
                task_id=str(uuid.uuid4()),
                analysis_id=analysis_id,
                processor_type="vector_store"
            ))
        
        # Queue graph database processing if enabled
        if self.neo4j_driver:
            tasks.append(ProcessingTask(
                task_id=str(uuid.uuid4()),
                analysis_id=analysis_id,
                processor_type="graph_db"
            ))
        
        # Store processing tasks
        with sqlite3.connect(self.db_path) as conn:
            for task in tasks:
                conn.execute("""
                    INSERT INTO processing_tasks (
                        task_id, analysis_id, processor_type, status,
                        created_at, metadata
                    ) VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    task.task_id,
                    task.analysis_id,
                    task.processor_type,
                    task.status.value,
                    task.created_at.isoformat(),
                    json.dumps(task.metadata)
                ))
            conn.commit()
        
        logger.info(f"Queued {len(tasks)} processing tasks for analysis {analysis_id}")
    
    def get_analysis(self, analysis_id: str) -> Optional[AnalysisData]:
        """Retrieve analysis data by ID"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            # Get metadata
            metadata_row = conn.execute("""
                SELECT * FROM analysis_metadata WHERE analysis_id = ?
            """, (analysis_id,)).fetchone()
            
            if not metadata_row:
                return None
            
            # Get data
            data_row = conn.execute("""
                SELECT * FROM analysis_data WHERE analysis_id = ?
            """, (analysis_id,)).fetchone()
            
            if not data_row:
                return None
            
            # Reconstruct metadata
            metadata = AnalysisMetadata(
                analysis_id=metadata_row['analysis_id'],
                thread_id=metadata_row['thread_id'],
                session_id=metadata_row['session_id'],
                process_instance_id=metadata_row['process_instance_id'],
                task_name=metadata_row['task_name'],
                created_at=datetime.fromisoformat(metadata_row['created_at']),
                updated_at=datetime.fromisoformat(metadata_row['updated_at']),
                status=AnalysisStatus(metadata_row['status']),
                tags=json.loads(metadata_row['tags']) if metadata_row['tags'] else [],
                source_service=metadata_row['source_service']
            )
            
            # Reconstruct data
            analysis_data = AnalysisData(
                metadata=metadata,
                input_data=json.loads(data_row['input_data']),
                output_data=json.loads(data_row['output_data']) if data_row['output_data'] else None,
                raw_response=data_row['raw_response'],
                processing_log=json.loads(data_row['processing_log']) if data_row['processing_log'] else []
            )
            
            return analysis_data
    
    def get_thread_analyses(self, thread_id: str, limit: int = 100) -> List[AnalysisData]:
        """Get all analyses for a specific thread"""
        analyses = []
        
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            rows = conn.execute("""
                SELECT analysis_id FROM analysis_metadata 
                WHERE thread_id = ? 
                ORDER BY created_at DESC 
                LIMIT ?
            """, (thread_id, limit)).fetchall()
            
            for row in rows:
                analysis = self.get_analysis(row['analysis_id'])
                if analysis:
                    analyses.append(analysis)
        
        return analyses
    
    def search_analyses(
        self,
        thread_id: Optional[str] = None,
        session_id: Optional[str] = None,
        task_name_pattern: Optional[str] = None,
        tags: Optional[List[str]] = None,
        status: Optional[AnalysisStatus] = None,
        limit: int = 100
    ) -> List[AnalysisData]:
        """Search analyses with various filters"""
        query_parts = ["SELECT analysis_id FROM analysis_metadata WHERE 1=1"]
        params = []
        
        if thread_id:
            query_parts.append("AND thread_id = ?")
            params.append(thread_id)
        
        if session_id:
            query_parts.append("AND session_id = ?")
            params.append(session_id)
        
        if task_name_pattern:
            query_parts.append("AND task_name LIKE ?")
            params.append(f"%{task_name_pattern}%")
        
        if status:
            query_parts.append("AND status = ?")
            params.append(status.value)
        
        if tags:
            # Simple tag search - could be improved with full-text search
            for tag in tags:
                query_parts.append("AND tags LIKE ?")
                params.append(f"%{tag}%")
        
        query_parts.append("ORDER BY created_at DESC LIMIT ?")
        params.append(limit)
        
        query = " ".join(query_parts)
        
        analyses = []
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute(query, params).fetchall()
            
            for row in rows:
                analysis = self.get_analysis(row['analysis_id'])
                if analysis:
                    analyses.append(analysis)
        
        return analyses
    
    def process_pending_tasks(self, processor_type: Optional[str] = None, limit: int = 10) -> int:
        """
        Process pending processing tasks
        
        Args:
            processor_type: Type of processor to run (optional, processes all if None)
            limit: Maximum number of tasks to process
        
        Returns:
            int: Number of tasks processed
        """
        processed_count = 0
        
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            # Get pending tasks
            query = """
                SELECT * FROM processing_tasks 
                WHERE status = ? 
            """
            params = [ProcessingStatus.PENDING.value]
            
            if processor_type:
                query += " AND processor_type = ?"
                params.append(processor_type)
            
            query += " ORDER BY created_at ASC LIMIT ?"
            params.append(limit)
            
            tasks = conn.execute(query, params).fetchall()
            
            for task_row in tasks:
                try:
                    # Mark as in progress
                    conn.execute("""
                        UPDATE processing_tasks 
                        SET status = ? 
                        WHERE task_id = ?
                    """, (ProcessingStatus.IN_PROGRESS.value, task_row['task_id']))
                    conn.commit()
                    
                    # Process the task
                    success = self._process_task(task_row)
                    
                    # Update status
                    new_status = ProcessingStatus.COMPLETED if success else ProcessingStatus.FAILED
                    conn.execute("""
                        UPDATE processing_tasks 
                        SET status = ?, completed_at = ? 
                        WHERE task_id = ?
                    """, (new_status.value, datetime.now().isoformat(), task_row['task_id']))
                    conn.commit()
                    
                    if success:
                        processed_count += 1
                        logger.info(f"Processed task {task_row['task_id']} successfully")
                    else:
                        logger.error(f"Failed to process task {task_row['task_id']}")
                
                except Exception as e:
                    logger.error(f"Error processing task {task_row['task_id']}: {e}")
                    # Mark as failed
                    conn.execute("""
                        UPDATE processing_tasks 
                        SET status = ?, error_message = ?, completed_at = ? 
                        WHERE task_id = ?
                    """, (
                        ProcessingStatus.FAILED.value,
                        str(e),
                        datetime.now().isoformat(),
                        task_row['task_id']
                    ))
                    conn.commit()
        
        logger.info(f"Processed {processed_count} tasks")
        return processed_count
    
    def _process_task(self, task_row) -> bool:
        """Process a single task"""
        analysis_id = task_row['analysis_id']
        processor_type = task_row['processor_type']
        
        # Get analysis data
        analysis = self.get_analysis(analysis_id)
        if not analysis:
            logger.error(f"Analysis {analysis_id} not found")
            return False
        
        if processor_type == "vector_store" and self.qdrant_client:
            return self._process_vector_store(analysis)
        elif processor_type == "graph_db" and self.neo4j_driver:
            return self._process_graph_db(analysis)
        else:
            logger.warning(f"Processor {processor_type} not available or not implemented")
            return False
    
    def _process_vector_store(self, analysis: AnalysisData) -> bool:
        """Process analysis data into vector store"""
        try:
            # Create embeddings from text content
            text_content = []
            
            # Add task name
            text_content.append(f"Task: {analysis.metadata.task_name}")
            
            # Add input data
            if analysis.input_data:
                text_content.append(f"Input: {json.dumps(analysis.input_data)}")
            
            # Add output data
            if analysis.output_data:
                text_content.append(f"Output: {json.dumps(analysis.output_data)}")
            
            # Add raw response
            if analysis.raw_response:
                text_content.append(f"Response: {analysis.raw_response}")
            
            combined_text = " ".join(text_content)
            
            # For now, create a simple point with metadata
            # In production, you'd want to use a proper embedding model
            point = PointStruct(
                id=analysis.metadata.analysis_id,
                vector=[0.0] * 384,  # Placeholder vector
                payload={
                    "analysis_id": analysis.metadata.analysis_id,
                    "thread_id": analysis.metadata.thread_id,
                    "session_id": analysis.metadata.session_id,
                    "task_name": analysis.metadata.task_name,
                    "created_at": analysis.metadata.created_at.isoformat(),
                    "text_content": combined_text[:1000],  # Truncate for storage
                    "tags": analysis.metadata.tags
                }
            )
            
            self.qdrant_client.upsert(
                collection_name="analysis_data",
                points=[point]
            )
            
            logger.info(f"Stored analysis {analysis.metadata.analysis_id} in vector store")
            return True
            
        except Exception as e:
            logger.error(f"Error processing vector store for {analysis.metadata.analysis_id}: {e}")
            return False
    
    def _process_graph_db(self, analysis: AnalysisData) -> bool:
        """Process analysis data into graph database"""
        try:
            # Import existing data persistence manager for graph processing
            from src.data_persistence_manager import DataPersistenceManager
            
            # Create a temporary DPM instance for graph processing
            temp_dpm = DataPersistenceManager(
                qdrant_host="localhost",  # Not used for this operation
                qdrant_port=6333,
                neo4j_uri=os.environ.get('NEO4J_URI', 'bolt://localhost:7687'),
                neo4j_user=os.environ.get('NEO4J_USER', 'neo4j'),
                neo4j_password=os.environ.get('NEO4J_PASSWORD', 'password')
            )
            
            # Prepare task data in the format expected by store_interaction
            task_data = {
                "task_name": analysis.metadata.task_name,
                "assistant_id": analysis.metadata.source_service,
                "thread_id": analysis.metadata.thread_id,
                "processed_at": analysis.metadata.created_at.isoformat(),
                "processed_by": "Analysis Data Manager",
                "recommendation": analysis.output_data or analysis.raw_response or analysis.input_data
            }
            
            # Store using existing graph expansion logic
            success = temp_dpm.store_interaction(
                run_id=analysis.metadata.session_id or "analysis_data_manager",
                process_instance_id=analysis.metadata.process_instance_id or analysis.metadata.analysis_id,
                task_data=task_data,
                decision_context=json.dumps(analysis.input_data)
            )
            
            # Close the temporary connection
            temp_dpm.close()
            
            if success:
                logger.info(f"Stored analysis {analysis.metadata.analysis_id} in graph database")
            else:
                logger.error(f"Failed to store analysis {analysis.metadata.analysis_id} in graph database")
            
            return success
            
        except Exception as e:
            logger.error(f"Error processing graph database for {analysis.metadata.analysis_id}: {e}")
            return False
    
    def get_processing_status(self, analysis_id: str) -> Dict[str, Any]:
        """Get processing status for an analysis"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            tasks = conn.execute("""
                SELECT processor_type, status, created_at, completed_at, error_message
                FROM processing_tasks 
                WHERE analysis_id = ?
                ORDER BY created_at
            """, (analysis_id,)).fetchall()
            
            return {
                "analysis_id": analysis_id,
                "tasks": [dict(task) for task in tasks]
            }
    
    def reprocess_analysis(self, analysis_id: str, processor_types: List[str]) -> bool:
        """
        Reprocess an analysis with specific processors
        
        Args:
            analysis_id: Analysis ID to reprocess
            processor_types: List of processor types to run
        
        Returns:
            bool: Success status
        """
        try:
            # Create new processing tasks
            tasks = []
            for processor_type in processor_types:
                if (processor_type == "vector_store" and self.qdrant_client) or \
                   (processor_type == "graph_db" and self.neo4j_driver):
                    tasks.append(ProcessingTask(
                        task_id=str(uuid.uuid4()),
                        analysis_id=analysis_id,
                        processor_type=processor_type
                    ))
            
            if not tasks:
                logger.warning(f"No valid processors specified for reprocessing: {processor_types}")
                return False
            
            # Store new processing tasks
            with sqlite3.connect(self.db_path) as conn:
                for task in tasks:
                    conn.execute("""
                        INSERT INTO processing_tasks (
                            task_id, analysis_id, processor_type, status,
                            created_at, metadata
                        ) VALUES (?, ?, ?, ?, ?, ?)
                    """, (
                        task.task_id,
                        task.analysis_id,
                        task.processor_type,
                        task.status.value,
                        task.created_at.isoformat(),
                        json.dumps(task.metadata)
                    ))
                conn.commit()
            
            logger.info(f"Queued {len(tasks)} reprocessing tasks for analysis {analysis_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error reprocessing analysis {analysis_id}: {e}")
            return False
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about stored analyses"""
        with sqlite3.connect(self.db_path) as conn:
            # Total analyses
            total = conn.execute("SELECT COUNT(*) FROM analysis_metadata").fetchone()[0]
            
            # By status
            status_counts = {}
            for row in conn.execute("SELECT status, COUNT(*) FROM analysis_metadata GROUP BY status"):
                status_counts[row[0]] = row[1]
            
            # By thread
            thread_counts = {}
            for row in conn.execute("SELECT thread_id, COUNT(*) FROM analysis_metadata GROUP BY thread_id ORDER BY COUNT(*) DESC LIMIT 10"):
                thread_counts[row[0]] = row[1]
            
            # Processing task status
            task_status_counts = {}
            for row in conn.execute("SELECT status, COUNT(*) FROM processing_tasks GROUP BY status"):
                task_status_counts[row[0]] = row[1]
            
            return {
                "total_analyses": total,
                "status_distribution": status_counts,
                "top_threads": thread_counts,
                "processing_task_status": task_status_counts,
                "backends_enabled": {
                    "vector_store": self.qdrant_client is not None,
                    "graph_db": self.neo4j_driver is not None
                }
            }
    
    def close(self):
        """Close connections"""
        if self.neo4j_driver:
            self.neo4j_driver.close()
            logger.info("Closed Neo4j connection")
