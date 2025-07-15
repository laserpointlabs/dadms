#!/usr/bin/env python3
"""
PostgreSQL Analysis Data Manager for DADM
Adapted from analysis_data_manager.py to use PostgreSQL

REQ-004: PostgreSQL Infrastructure Setup - Analysis data management
"""

import json
import logging
import os
from dataclasses import asdict, dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional
import uuid
import psycopg2
from psycopg2.extras import RealDictCursor

from config.database_config import (
    POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, 
    POSTGRES_USER, POSTGRES_PASSWORD,
    DEFAULT_TENANT_ID
)

# Check for optional dependencies
try:
    from qdrant_client import QdrantClient
    from qdrant_client.http.models import Distance, PointStruct, VectorParams
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

class PostgresAnalysisDataManager:
    """
    Manages analysis data persistence in PostgreSQL with optional integration
    for vector stores (Qdrant) and graph databases (Neo4j)
    """
    
    def __init__(
        self,
        tenant_id: Optional[str] = None,
        enable_vector_store: bool = True,
        enable_graph_db: bool = True,
        qdrant_host: str = "localhost",
        qdrant_port: int = 6333,
        neo4j_uri: str = "bolt://localhost:7687",
        neo4j_user: str = "neo4j",
        neo4j_password: str = "password"
    ):
        """
        Initialize the PostgreSQL Analysis Data Manager
        
        Args:
            tenant_id: Tenant ID for multi-tenant isolation
            enable_vector_store: Enable Qdrant vector store integration
            enable_graph_db: Enable Neo4j graph database integration
            qdrant_host: Qdrant host
            qdrant_port: Qdrant port
            neo4j_uri: Neo4j connection URI
            neo4j_user: Neo4j username
            neo4j_password: Neo4j password
        """
        self.tenant_id = tenant_id or DEFAULT_TENANT_ID
        
        # PostgreSQL connection parameters
        self.db_config = {
            'host': POSTGRES_HOST,
            'port': POSTGRES_PORT,
            'database': POSTGRES_DB,
            'user': POSTGRES_USER,
            'password': POSTGRES_PASSWORD
        }
        
        # Test connection
        self._test_connection()
        
        # Create tables if they don't exist
        self._create_tables_if_not_exist()
        
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
    
    def _test_connection(self):
        """Test PostgreSQL connection"""
        try:
            with psycopg2.connect(**self.db_config) as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT 1")
                    logger.info("PostgreSQL connection successful")
        except Exception as e:
            logger.error(f"Failed to connect to PostgreSQL: {e}")
            raise
    
    def _create_tables_if_not_exist(self):
        """Create analysis tables if they don't exist"""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    # Enable UUID extension
                    cur.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
                    
                    # Create analysis_metadata table
                    cur.execute("""
                        CREATE TABLE IF NOT EXISTS analysis_metadata (
                            analysis_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                            tenant_id UUID DEFAULT NULL,
                            thread_id VARCHAR(255) NOT NULL,
                            session_id VARCHAR(255),
                            process_instance_id VARCHAR(255),
                            task_name VARCHAR(255),
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            status VARCHAR(50) DEFAULT 'created',
                            tags JSONB DEFAULT '[]'::jsonb,
                            source_service VARCHAR(255)
                        );
                    """)
                    
                    # Create analysis_data table
                    cur.execute("""
                        CREATE TABLE IF NOT EXISTS analysis_data (
                            analysis_id UUID PRIMARY KEY REFERENCES analysis_metadata(analysis_id) ON DELETE CASCADE,
                            input_data JSONB,
                            output_data JSONB,
                            raw_response TEXT,
                            processing_log JSONB DEFAULT '[]'::jsonb,
                            tenant_id UUID DEFAULT NULL
                        );
                    """)
                    
                    # Create processing_tasks table
                    cur.execute("""
                        CREATE TABLE IF NOT EXISTS processing_tasks (
                            task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                            analysis_id UUID REFERENCES analysis_metadata(analysis_id) ON DELETE CASCADE,
                            processor_type VARCHAR(100),
                            status VARCHAR(50),
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            completed_at TIMESTAMP,
                            error_message TEXT,
                            metadata JSONB DEFAULT '{}'::jsonb,
                            tenant_id UUID DEFAULT NULL
                        );
                    """)
                    
                    # Create indexes for better performance
                    indexes = [
                        "CREATE INDEX IF NOT EXISTS idx_analysis_metadata_created_at ON analysis_metadata(created_at);",
                        "CREATE INDEX IF NOT EXISTS idx_analysis_metadata_process_instance_id ON analysis_metadata(process_instance_id);",
                        "CREATE INDEX IF NOT EXISTS idx_analysis_metadata_thread_id ON analysis_metadata(thread_id);",
                        "CREATE INDEX IF NOT EXISTS idx_analysis_metadata_source_service ON analysis_metadata(source_service);",
                        "CREATE INDEX IF NOT EXISTS idx_analysis_metadata_status ON analysis_metadata(status);",
                        "CREATE INDEX IF NOT EXISTS idx_processing_tasks_analysis_id ON processing_tasks(analysis_id);",
                        "CREATE INDEX IF NOT EXISTS idx_processing_tasks_status ON processing_tasks(status);"
                    ]
                    
                    for index_sql in indexes:
                        cur.execute(index_sql)
                    
                    conn.commit()
                    logger.info("Analysis tables created/verified successfully")
                    
        except Exception as e:
            logger.error(f"Failed to create analysis tables: {e}")
            raise
    
    def _get_connection(self):
        """Get a new database connection"""
        return psycopg2.connect(**self.db_config)
    
    def _init_qdrant_collections(self):
        """Initialize Qdrant collections"""
        if not self.qdrant_client:
            return
            
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
        
        # Store in PostgreSQL
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                # Store metadata
                cur.execute("""
                    INSERT INTO analysis_metadata (
                        analysis_id, thread_id, session_id, process_instance_id,
                        task_name, created_at, updated_at, status, tags, 
                        source_service, tenant_id
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                """, (
                    metadata.analysis_id,
                    metadata.thread_id,
                    metadata.session_id,
                    metadata.process_instance_id,
                    metadata.task_name,
                    metadata.created_at,
                    metadata.updated_at,
                    metadata.status.value,
                    json.dumps(metadata.tags),
                    metadata.source_service,
                    self.tenant_id
                ))
                
                # Store data
                cur.execute("""
                    INSERT INTO analysis_data (
                        analysis_id, input_data, output_data, raw_response, 
                        processing_log, tenant_id
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    analysis_id,
                    json.dumps(input_data),
                    json.dumps(output_data) if output_data else None,
                    raw_response,
                    json.dumps([]),
                    self.tenant_id
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
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                for task in tasks:
                    cur.execute("""
                        INSERT INTO processing_tasks (
                            task_id, analysis_id, processor_type, status,
                            created_at, metadata, tenant_id
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (
                        task.task_id,
                        task.analysis_id,
                        task.processor_type,
                        task.status.value,
                        task.created_at,
                        json.dumps(task.metadata),
                        self.tenant_id
                    ))
                conn.commit()
        
        logger.info(f"Queued {len(tasks)} processing tasks for analysis {analysis_id}")
    
    def get_analysis(self, analysis_id: str) -> Optional[AnalysisData]:
        """Retrieve analysis data by ID"""
        has_tenant_id = self._check_tenant_id_exists()
        
        with self._get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Get metadata
                if has_tenant_id:
                    cur.execute("""
                        SELECT * FROM analysis_metadata 
                        WHERE analysis_id = %s AND tenant_id = %s
                    """, (analysis_id, self.tenant_id))
                else:
                    cur.execute("""
                        SELECT * FROM analysis_metadata 
                        WHERE analysis_id = %s
                    """, (analysis_id,))
                    
                metadata_row = cur.fetchone()
                
                if not metadata_row:
                    return None
                
                # Get data - check if analysis_data has tenant_id
                if has_tenant_id and self._check_column_exists('analysis_data', 'tenant_id'):
                    cur.execute("""
                        SELECT * FROM analysis_data 
                        WHERE analysis_id = %s AND tenant_id = %s
                    """, (analysis_id, self.tenant_id))
                else:
                    cur.execute("""
                        SELECT * FROM analysis_data 
                        WHERE analysis_id = %s
                    """, (analysis_id,))
                    
                data_row = cur.fetchone()
                
                if not data_row:
                    return None
                
                # Reconstruct metadata
                metadata = AnalysisMetadata(
                    analysis_id=metadata_row['analysis_id'],
                    thread_id=metadata_row['thread_id'],
                    session_id=metadata_row['session_id'],
                    process_instance_id=metadata_row['process_instance_id'],
                    task_name=metadata_row['task_name'],
                    created_at=metadata_row['created_at'],
                    updated_at=metadata_row['updated_at'],
                    status=AnalysisStatus(metadata_row['status']),
                    tags=metadata_row['tags'] if metadata_row['tags'] else [],
                    source_service=metadata_row['source_service']
                )
                
                # Reconstruct data
                analysis_data = AnalysisData(
                    metadata=metadata,
                    input_data=data_row['input_data'],
                    output_data=data_row['output_data'],
                    raw_response=data_row['raw_response'],
                    processing_log=data_row['processing_log'] if data_row['processing_log'] else []
                )
                
                return analysis_data
    
    def get_thread_analyses(self, thread_id: str, limit: int = 100) -> List[AnalysisData]:
        """Get all analyses for a specific thread"""
        analyses = []
        has_tenant_id = self._check_tenant_id_exists()
        
        with self._get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if has_tenant_id:
                    cur.execute("""
                        SELECT analysis_id FROM analysis_metadata 
                        WHERE thread_id = %s AND tenant_id = %s 
                        ORDER BY created_at DESC 
                        LIMIT %s
                    """, (thread_id, self.tenant_id, limit))
                else:
                    cur.execute("""
                        SELECT analysis_id FROM analysis_metadata 
                        WHERE thread_id = %s 
                        ORDER BY created_at DESC 
                        LIMIT %s
                    """, (thread_id, limit))
                
                rows = cur.fetchall()
                
                for row in rows:
                    analysis = self.get_analysis(row['analysis_id'])
                    if analysis:
                        analyses.append(analysis)
        
        return analyses
    
    def close(self):
        """Close all connections"""
        if self.neo4j_driver:
            self.neo4j_driver.close()
            logger.info("Neo4j connection closed")
    
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
        # Check if tenant_id column exists
        has_tenant_id = self._check_tenant_id_exists()
        
        if has_tenant_id:
            query_parts = ["SELECT analysis_id FROM analysis_metadata WHERE tenant_id = %s"]
            params = [self.tenant_id]
        else:
            query_parts = ["SELECT analysis_id FROM analysis_metadata WHERE 1=1"]
            params = []
        
        if thread_id:
            query_parts.append("AND thread_id = %s")
            params.append(thread_id)
        
        if session_id:
            query_parts.append("AND session_id = %s")
            params.append(session_id)
        
        if task_name_pattern:
            query_parts.append("AND task_name LIKE %s")
            params.append(f"%{task_name_pattern}%")
        
        if status:
            query_parts.append("AND status = %s")
            params.append(status.value)
        
        if tags:
            # Simple tag search using JSONB containment operator
            for tag in tags:
                query_parts.append("AND tags @> %s")
                params.append(json.dumps([tag]))
        
        query_parts.append("ORDER BY created_at DESC LIMIT %s")
        params.append(str(limit))
        
        query = " ".join(query_parts)
        
        analyses = []
        with self._get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, params)
                rows = cur.fetchall()
                
                for row in rows:
                    analysis = self.get_analysis(row['analysis_id'])
                    if analysis:
                        analyses.append(analysis)
        
        return analyses
    
    def _check_tenant_id_exists(self) -> bool:
        """Check if tenant_id column exists in analysis_metadata table"""
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'analysis_metadata' 
                    AND column_name = 'tenant_id'
                """)
                return cur.fetchone() is not None
    
    def _check_column_exists(self, table_name: str, column_name: str) -> bool:
        """Check if a column exists in a table"""
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = %s 
                    AND column_name = %s
                """, (table_name, column_name))
                return cur.fetchone() is not None
    
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
        has_tenant_id = self._check_column_exists('processing_tasks', 'tenant_id')
        
        with self._get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Get pending tasks
                if has_tenant_id:
                    query = """
                        SELECT * FROM processing_tasks 
                        WHERE status = %s AND tenant_id = %s
                    """
                    params = [ProcessingStatus.PENDING.value, self.tenant_id]
                else:
                    query = """
                        SELECT * FROM processing_tasks 
                        WHERE status = %s
                    """
                    params = [ProcessingStatus.PENDING.value]
                
                if processor_type:
                    query += " AND processor_type = %s"
                    params.append(processor_type)
                
                query += " ORDER BY created_at ASC LIMIT %s"
                params.append(str(limit))
                
                cur.execute(query, params)
                tasks = cur.fetchall()
                
                for task_row in tasks:
                    try:
                        # Mark as in progress
                        if has_tenant_id:
                            cur.execute("""
                                UPDATE processing_tasks 
                                SET status = %s 
                                WHERE task_id = %s AND tenant_id = %s
                            """, (ProcessingStatus.IN_PROGRESS.value, task_row['task_id'], self.tenant_id))
                        else:
                            cur.execute("""
                                UPDATE processing_tasks 
                                SET status = %s 
                                WHERE task_id = %s
                            """, (ProcessingStatus.IN_PROGRESS.value, task_row['task_id']))
                        conn.commit()
                        
                        # Process the task (implement processing logic here)
                        success = True  # Placeholder - implement actual processing
                        
                        # Update status
                        new_status = ProcessingStatus.COMPLETED if success else ProcessingStatus.FAILED
                        if has_tenant_id:
                            cur.execute("""
                                UPDATE processing_tasks 
                                SET status = %s, completed_at = %s 
                                WHERE task_id = %s AND tenant_id = %s
                            """, (new_status.value, datetime.now(), task_row['task_id'], self.tenant_id))
                        else:
                            cur.execute("""
                                UPDATE processing_tasks 
                                SET status = %s, completed_at = %s 
                                WHERE task_id = %s
                            """, (new_status.value, datetime.now(), task_row['task_id']))
                        conn.commit()
                        
                        if success:
                            processed_count += 1
                            logger.info(f"Processed task {task_row['task_id']} successfully")
                        else:
                            logger.error(f"Failed to process task {task_row['task_id']}")
                            
                    except Exception as e:
                        logger.error(f"Error processing task {task_row['task_id']}: {e}")
                        # Mark as failed
                        if has_tenant_id:
                            cur.execute("""
                                UPDATE processing_tasks 
                                SET status = %s, error_message = %s, completed_at = %s 
                                WHERE task_id = %s AND tenant_id = %s
                            """, (ProcessingStatus.FAILED.value, str(e), datetime.now(), task_row['task_id'], self.tenant_id))
                        else:
                            cur.execute("""
                                UPDATE processing_tasks 
                                SET status = %s, error_message = %s, completed_at = %s 
                                WHERE task_id = %s
                            """, (ProcessingStatus.FAILED.value, str(e), datetime.now(), task_row['task_id']))
                        conn.commit()
        
        return processed_count
    
    def get_processing_status(self, analysis_id: str) -> Dict[str, Any]:
        """Get processing status for an analysis"""
        has_tenant_id = self._check_column_exists('processing_tasks', 'tenant_id')
        
        with self._get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if has_tenant_id:
                    cur.execute("""
                        SELECT * FROM processing_tasks 
                        WHERE analysis_id = %s AND tenant_id = %s
                        ORDER BY created_at ASC
                    """, (analysis_id, self.tenant_id))
                else:
                    cur.execute("""
                        SELECT * FROM processing_tasks 
                        WHERE analysis_id = %s
                        ORDER BY created_at ASC
                    """, (analysis_id,))
                
                tasks = cur.fetchall()
                
                return {
                    'analysis_id': analysis_id,
                    'tasks': [
                        {
                            'task_id': task['task_id'],
                            'processor_type': task['processor_type'],
                            'status': task['status'],
                            'created_at': task['created_at'].isoformat() if task['created_at'] else None,
                            'completed_at': task['completed_at'].isoformat() if task['completed_at'] else None,
                            'error_message': task['error_message']
                        }
                        for task in tasks
                    ]
                }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about stored analyses"""
        has_tenant_id = self._check_tenant_id_exists()
        
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                # Total analyses
                if has_tenant_id:
                    cur.execute("""
                        SELECT COUNT(*) as total FROM analysis_metadata 
                        WHERE tenant_id = %s
                    """, (self.tenant_id,))
                else:
                    cur.execute("""
                        SELECT COUNT(*) as total FROM analysis_metadata
                    """)
                total_analyses = cur.fetchone()[0]
                
                # Processing task status
                if self._check_column_exists('processing_tasks', 'tenant_id'):
                    cur.execute("""
                        SELECT status, COUNT(*) as count 
                        FROM processing_tasks 
                        WHERE tenant_id = %s
                        GROUP BY status
                    """, (self.tenant_id,))
                else:
                    cur.execute("""
                        SELECT status, COUNT(*) as count 
                        FROM processing_tasks 
                        GROUP BY status
                    """)
                
                task_status = {}
                for row in cur.fetchall():
                    task_status[row[0]] = row[1]
                
                return {
                    'total_analyses': total_analyses,
                    'processing_task_status': task_status,
                    'backends_enabled': {
                        'vector_store': self.qdrant_client is not None,
                        'graph_db': self.neo4j_driver is not None
                    }
                } 