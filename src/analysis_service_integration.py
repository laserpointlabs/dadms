#!/usr/bin/env python3
"""
Analysis Service Integration

Integration layer for the Analysis Data Manager that replaces direct persistence calls
in services. This provides a clean interface for services to store analysis data
without worrying about the underlying storage and processing implementation.
"""
import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
import uuid

from .analysis_data_manager import AnalysisDataManager, AnalysisStatus

logger = logging.getLogger(__name__)


class AnalysisServiceIntegration:
    """
    Service integration layer for analysis data management
    """
    
    def __init__(
        self,
        storage_dir: str = None,
        enable_vector_store: bool = True,
        enable_graph_db: bool = True,
        auto_process: bool = True,
        qdrant_host: str = None,
        qdrant_port: int = None,
        neo4j_uri: str = None,
        neo4j_user: str = None,
        neo4j_password: str = None
    ):
        """
        Initialize the service integration
        
        Args:
            storage_dir: Directory for storage (default: data/analysis_storage)
            enable_vector_store: Enable Qdrant vector store
            enable_graph_db: Enable Neo4j graph database
            auto_process: Automatically process stored analyses
            qdrant_host: Qdrant host (default: from env or localhost)
            qdrant_port: Qdrant port (default: from env or 6333)
            neo4j_uri: Neo4j URI (default: from env or bolt://localhost:7687)
            neo4j_user: Neo4j user (default: from env or neo4j)
            neo4j_password: Neo4j password (default: from env or password)
        """
        # Use environment variables as defaults
        self.qdrant_host = qdrant_host or os.environ.get('QDRANT_HOST', 'localhost')
        self.qdrant_port = qdrant_port or int(os.environ.get('QDRANT_PORT', '6333'))
        self.neo4j_uri = neo4j_uri or os.environ.get('NEO4J_URI', 'bolt://localhost:7687')
        self.neo4j_user = neo4j_user or os.environ.get('NEO4J_USER', 'neo4j')
        self.neo4j_password = neo4j_password or os.environ.get('NEO4J_PASSWORD', 'password')
        
        self.auto_process = auto_process
        
        # Initialize the analysis data manager
        self.data_manager = AnalysisDataManager(
            storage_dir=storage_dir,
            enable_vector_store=enable_vector_store,
            enable_graph_db=enable_graph_db,
            qdrant_host=self.qdrant_host,
            qdrant_port=self.qdrant_port,
            neo4j_uri=self.neo4j_uri,
            neo4j_user=self.neo4j_user,
            neo4j_password=self.neo4j_password
        )
        
        logger.info("Analysis service integration initialized")
    
    def store_task_analysis(
        self,
        task_description: str,
        task_id: str,
        task_name: str,
        variables: Optional[Dict[str, Any]] = None,
        response_data: Optional[Dict[str, Any]] = None,
        raw_response: Optional[str] = None,
        thread_id: Optional[str] = None,
        session_id: Optional[str] = None,
        process_instance_id: Optional[str] = None,
        service_name: str = "unknown",
        tags: Optional[List[str]] = None
    ) -> str:
        """
        Store task analysis data (replacement for direct persistence calls)
        
        Args:
            task_description: Description of the task
            task_id: Unique task ID
            task_name: Name of the task
            variables: Task variables/context
            response_data: Structured response data
            raw_response: Raw response text
            thread_id: Thread ID (generated if not provided)
            session_id: Session ID
            process_instance_id: Process instance ID
            service_name: Name of the service
            tags: Tags for categorization
        
        Returns:
            str: Analysis ID
        """
        # Generate thread_id if not provided
        if not thread_id:
            thread_id = f"task_{task_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Prepare input data
        input_data = {
            "task_description": task_description,
            "task_id": task_id,
            "task_name": task_name,
            "variables": variables or {},
            "timestamp": datetime.now().isoformat()
        }
        
        # Store the analysis
        analysis_id = self.data_manager.store_analysis(
            thread_id=thread_id,
            task_name=task_name,
            input_data=input_data,
            output_data=response_data,
            raw_response=raw_response,
            session_id=session_id,
            process_instance_id=process_instance_id,
            tags=tags,
            source_service=service_name
        )
        
        # Auto-process if enabled
        if self.auto_process:
            try:
                processed = self.data_manager.process_pending_tasks(limit=5)
                if processed > 0:
                    logger.info(f"Auto-processed {processed} tasks for analysis {analysis_id}")
            except Exception as e:
                logger.warning(f"Auto-processing failed for analysis {analysis_id}: {e}")
        
        return analysis_id
    
    def store_openai_interaction(
        self,
        run_id: str,
        process_instance_id: str,
        task_data: Dict[str, Any],
        decision_context: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        Store OpenAI interaction (replacement for DataPersistenceManager.store_interaction)
        
        This method provides compatibility with the existing store_interaction interface
        while using the new decoupled storage approach.
        
        Args:
            run_id: Run ID (used as session_id)
            process_instance_id: Process instance ID
            task_data: Task data dictionary
            decision_context: Decision context text
            **kwargs: Additional arguments (ignored for compatibility)
        
        Returns:
            str: Analysis ID
        """
        # Extract task information
        task_name = task_data.get("task_name", "OpenAI Decision Process")
        task_id = task_data.get("task_id", str(uuid.uuid4()))
        thread_id = task_data.get("thread_id", f"openai_{task_id}")
        
        # Prepare input data
        input_data = {
            "task_name": task_name,
            "assistant_id": task_data.get("assistant_id", "unknown"),
            "thread_id": thread_id,
            "processed_by": task_data.get("processed_by", "OpenAI Assistant Service"),
            "decision_context": decision_context,
            "original_task_data": task_data
        }
        
        # Extract recommendation data
        recommendation_data = task_data.get("recommendation")
        raw_response = None
        
        # Handle different recommendation formats
        if isinstance(recommendation_data, str):
            raw_response = recommendation_data
            try:
                # Try to parse as JSON
                recommendation_data = json.loads(recommendation_data)
            except json.JSONDecodeError:
                # Keep as string, will be processed later
                recommendation_data = {"response_text": recommendation_data}
        
        # Store the analysis
        analysis_id = self.data_manager.store_analysis(
            thread_id=thread_id,
            task_name=task_name,
            input_data=input_data,
            output_data=recommendation_data,
            raw_response=raw_response,
            session_id=run_id,
            process_instance_id=process_instance_id,
            tags=["openai", "decision_analysis"],
            source_service="openai_assistant"
        )
        
        # Auto-process if enabled
        if self.auto_process:
            try:
                processed = self.data_manager.process_pending_tasks(limit=5)
                if processed > 0:
                    logger.info(f"Auto-processed {processed} tasks for OpenAI analysis {analysis_id}")
            except Exception as e:
                logger.warning(f"Auto-processing failed for OpenAI analysis {analysis_id}: {e}")
        
        logger.info(f"Stored OpenAI interaction as analysis: {analysis_id}")
        return analysis_id
    
    def get_thread_conversation(self, thread_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get conversation history for a thread
        
        Args:
            thread_id: Thread ID
            limit: Maximum number of analyses to return
        
        Returns:
            List of analysis data dictionaries
        """
        analyses = self.data_manager.get_thread_analyses(thread_id, limit)
        return [analysis.to_dict() for analysis in analyses]
    
    def search_analyses(
        self,
        query: Optional[str] = None,
        thread_id: Optional[str] = None,
        session_id: Optional[str] = None,
        service_name: Optional[str] = None,
        tags: Optional[List[str]] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Search stored analyses
        
        Args:
            query: Text query (searches task names)
            thread_id: Filter by thread ID
            session_id: Filter by session ID
            service_name: Filter by service name
            tags: Filter by tags
            limit: Maximum results
        
        Returns:
            List of analysis data dictionaries
        """
        analyses = self.data_manager.search_analyses(
            thread_id=thread_id,
            session_id=session_id,
            task_name_pattern=query,
            tags=tags,
            limit=limit
        )
        
        # Filter by service name if specified
        if service_name:
            analyses = [a for a in analyses if a.metadata.source_service == service_name]
        
        return [analysis.to_dict() for analysis in analyses]
    
    def get_analysis_by_id(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        """
        Get analysis by ID
        
        Args:
            analysis_id: Analysis ID
        
        Returns:
            Analysis data dictionary or None
        """
        analysis = self.data_manager.get_analysis(analysis_id)
        return analysis.to_dict() if analysis else None
    
    def reprocess_analysis(
        self,
        analysis_id: str,
        processors: Optional[List[str]] = None
    ) -> bool:
        """
        Reprocess an analysis with specific processors
        
        Args:
            analysis_id: Analysis ID to reprocess
            processors: List of processors ('vector_store', 'graph_db')
                       If None, reprocesses with all available processors
        
        Returns:
            bool: Success status
        """
        if processors is None:
            processors = []
            if self.data_manager.qdrant_client:
                processors.append("vector_store")
            if self.data_manager.neo4j_driver:
                processors.append("graph_db")
        
        return self.data_manager.reprocess_analysis(analysis_id, processors)
    
    def process_pending_analyses(self, processor_type: Optional[str] = None, limit: int = 10) -> int:
        """
        Process pending analyses
        
        Args:
            processor_type: Type of processor ('vector_store', 'graph_db', or None for all)
            limit: Maximum number to process
        
        Returns:
            int: Number of analyses processed
        """
        return self.data_manager.process_pending_tasks(processor_type, limit)
    
    def get_processing_status(self, analysis_id: str) -> Dict[str, Any]:
        """
        Get processing status for an analysis
        
        Args:
            analysis_id: Analysis ID
        
        Returns:
            Processing status dictionary
        """
        return self.data_manager.get_processing_status(analysis_id)
    
    def get_service_stats(self) -> Dict[str, Any]:
        """
        Get service statistics
        
        Returns:
            Statistics dictionary
        """
        return self.data_manager.get_stats()
    
    def close(self):
        """Close connections"""
        self.data_manager.close()
    
    def get_analyses_by_process(self, process_instance_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get all analyses for a specific process instance
        
        Args:
            process_instance_id: Process instance ID
            limit: Maximum number of analyses to return
        
        Returns:
            List of analysis data dictionaries
        """
        analyses = self.data_manager.search_analyses(
            session_id=None,
            thread_id=None,
            limit=limit
        )
        
        # Filter by process instance ID
        process_analyses = [
            a for a in analyses 
            if a.metadata.process_instance_id == process_instance_id
        ]
        
        return [analysis.to_dict() for analysis in process_analyses]
    
    def get_openai_thread_id(self, analysis_id: str) -> Optional[str]:
        """
        Extract OpenAI thread ID from an analysis
        
        Args:
            analysis_id: Analysis ID
        
        Returns:
            OpenAI thread ID if found, None otherwise
        """
        analysis = self.data_manager.get_analysis(analysis_id)
        if not analysis or not analysis.output_data:
            return None
        
        # Check output data for thread_id
        return analysis.output_data.get('thread_id')
    
    def get_openai_assistant_id(self, analysis_id: str) -> Optional[str]:
        """
        Extract OpenAI assistant ID from an analysis
        
        Args:
            analysis_id: Analysis ID
        
        Returns:
            OpenAI assistant ID if found, None otherwise
        """
        analysis = self.data_manager.get_analysis(analysis_id)
        if not analysis or not analysis.output_data:
            return None
        
        # Check output data for assistant_id
        return analysis.output_data.get('assistant_id')
    
    def get_process_openai_context(self, process_instance_id: str) -> Dict[str, Any]:
        """
        Get OpenAI context for a specific process instance
        
        Args:
            process_instance_id: Process instance ID
        
        Returns:
            Dictionary with OpenAI thread and assistant information
        """
        analyses = self.get_analyses_by_process(process_instance_id)
        
        context = {
            'process_instance_id': process_instance_id,
            'thread_ids': [],
            'assistant_ids': [],
            'analysis_count': len(analyses)
        }
        
        for analysis_dict in analyses:
            # Extract OpenAI thread ID
            output_data = analysis_dict.get('output_data', {})
            if output_data and 'thread_id' in output_data:
                thread_id = output_data['thread_id']
                if thread_id and thread_id not in context['thread_ids']:
                    context['thread_ids'].append(thread_id)
            
            # Extract OpenAI assistant ID
            if output_data and 'assistant_id' in output_data:
                assistant_id = output_data['assistant_id']
                if assistant_id and assistant_id not in context['assistant_ids']:
                    context['assistant_ids'].append(assistant_id)
        
        return context

# Global instance for easy service integration
_global_analysis_service = None


def get_analysis_service(
    storage_dir: str = None,
    enable_vector_store: bool = True,
    enable_graph_db: bool = True,
    auto_process: bool = True
) -> AnalysisServiceIntegration:
    """
    Get or create global analysis service instance
    
    Args:
        storage_dir: Storage directory
        enable_vector_store: Enable vector store
        enable_graph_db: Enable graph database
        auto_process: Auto-process stored analyses
    
    Returns:
        AnalysisServiceIntegration instance
    """
    global _global_analysis_service
    
    if _global_analysis_service is None:
        _global_analysis_service = AnalysisServiceIntegration(
            storage_dir=storage_dir,
            enable_vector_store=enable_vector_store,
            enable_graph_db=enable_graph_db,
            auto_process=auto_process
        )
    
    return _global_analysis_service
