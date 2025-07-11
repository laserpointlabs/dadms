#!/usr/bin/env python3
"""
PostgreSQL Data Governance Module for DADM
Adapted from data_governance.py to use PostgreSQL

REQ-004: PostgreSQL Infrastructure Setup - Data governance management
"""

import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
import psycopg2
from psycopg2.extras import RealDictCursor

from config.database_config import (
    POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, 
    POSTGRES_USER, POSTGRES_PASSWORD,
    DEFAULT_TENANT_ID
)

logger = logging.getLogger(__name__)

class PostgresDataGovernance:
    """
    Manages data governance policies, compliance, and quality metrics in PostgreSQL
    """
    
    def __init__(self, tenant_id: Optional[str] = None):
        """
        Initialize the PostgreSQL Data Governance module
        
        Args:
            tenant_id: Tenant ID for multi-tenant isolation
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
    
    def _test_connection(self):
        """Test PostgreSQL connection"""
        try:
            with psycopg2.connect(**self.db_config) as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT 1")
                    logger.info("PostgreSQL connection successful for data governance")
        except Exception as e:
            logger.error(f"Failed to connect to PostgreSQL: {e}")
            raise
    
    def _get_connection(self):
        """Get a new database connection"""
        return psycopg2.connect(**self.db_config)
    
    def create_policy(
        self,
        name: str,
        description: str,
        policy_type: str,
        rules: Dict[str, Any],
        classification: str = "internal"
    ) -> str:
        """
        Create a new data governance policy
        
        Args:
            name: Policy name
            description: Policy description
            policy_type: Type of policy (retention, access, quality, etc.)
            rules: Policy rules as a dictionary
            classification: Data classification level
        
        Returns:
            str: Policy ID
        """
        policy_id = str(uuid.uuid4())
        
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO data_policies (
                        policy_id, name, description, policy_type,
                        rules, classification, created_at, status, tenant_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    policy_id,
                    name,
                    description,
                    policy_type,
                    json.dumps(rules),
                    classification,
                    datetime.now(),
                    'active',
                    self.tenant_id
                ))
                conn.commit()
        
        logger.info(f"Created data policy: {policy_id}")
        return policy_id
    
    def get_policy(self, policy_id: str) -> Optional[Dict[str, Any]]:
        """Get a policy by ID"""
        with self._get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT * FROM data_policies 
                    WHERE policy_id = %s AND tenant_id = %s
                """, (policy_id, self.tenant_id))
                
                row = cur.fetchone()
                if row:
                    return dict(row)
                return None
    
    def list_policies(
        self,
        policy_type: Optional[str] = None,
        classification: Optional[str] = None,
        status: str = 'active'
    ) -> List[Dict[str, Any]]:
        """List policies with optional filters"""
        query_parts = ["SELECT * FROM data_policies WHERE tenant_id = %s"]
        params = [self.tenant_id]
        
        if policy_type:
            query_parts.append("AND policy_type = %s")
            params.append(policy_type)
        
        if classification:
            query_parts.append("AND classification = %s")
            params.append(classification)
        
        if status:
            query_parts.append("AND status = %s")
            params.append(status)
        
        query = " ".join(query_parts) + " ORDER BY created_at DESC"
        
        with self._get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, params)
                return [dict(row) for row in cur.fetchall()]
    
    def record_lineage(
        self,
        entity_id: str,
        entity_type: str,
        parent_id: Optional[str] = None,
        operation: str = "created",
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Record data lineage information
        
        Args:
            entity_id: ID of the entity (analysis, prompt, etc.)
            entity_type: Type of entity
            parent_id: ID of parent entity if applicable
            operation: Operation performed
            metadata: Additional metadata
        
        Returns:
            str: Lineage record ID
        """
        lineage_id = str(uuid.uuid4())
        
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO data_lineage (
                        lineage_id, entity_id, entity_type, parent_id,
                        operation, created_at, metadata, tenant_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    lineage_id,
                    entity_id,
                    entity_type,
                    parent_id,
                    operation,
                    datetime.now(),
                    json.dumps(metadata or {}),
                    self.tenant_id
                ))
                conn.commit()
        
        logger.info(f"Recorded lineage: {lineage_id} for entity {entity_id}")
        return lineage_id
    
    def get_lineage(self, entity_id: str) -> List[Dict[str, Any]]:
        """Get lineage history for an entity"""
        with self._get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Get direct lineage
                cur.execute("""
                    SELECT * FROM data_lineage 
                    WHERE entity_id = %s AND tenant_id = %s 
                    ORDER BY created_at DESC
                """, (entity_id, self.tenant_id))
                direct_lineage = [dict(row) for row in cur.fetchall()]
                
                # Get parent lineage if exists
                parent_lineage = []
                for record in direct_lineage:
                    if record.get('parent_id'):
                        cur.execute("""
                            SELECT * FROM data_lineage 
                            WHERE entity_id = %s AND tenant_id = %s 
                            ORDER BY created_at DESC
                        """, (record['parent_id'], self.tenant_id))
                        parent_lineage.extend([dict(row) for row in cur.fetchall()])
                
                return direct_lineage + parent_lineage
    
    def record_quality_metric(
        self,
        entity_id: str,
        entity_type: str,
        metric_name: str,
        metric_value: float,
        threshold: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Record a data quality metric
        
        Args:
            entity_id: ID of the entity being measured
            entity_type: Type of entity
            metric_name: Name of the metric
            metric_value: Metric value
            threshold: Threshold value if applicable
            metadata: Additional metadata
        
        Returns:
            str: Metric ID
        """
        metric_id = str(uuid.uuid4())
        passed = True
        
        if threshold is not None:
            passed = metric_value >= threshold
        
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO quality_metrics (
                        metric_id, entity_id, entity_type, metric_name,
                        metric_value, threshold, passed, created_at,
                        metadata, tenant_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    metric_id,
                    entity_id,
                    entity_type,
                    metric_name,
                    metric_value,
                    threshold,
                    passed,
                    datetime.now(),
                    json.dumps(metadata or {}),
                    self.tenant_id
                ))
                conn.commit()
        
        logger.info(f"Recorded quality metric: {metric_id} for entity {entity_id}")
        return metric_id
    
    def get_quality_metrics(
        self,
        entity_id: Optional[str] = None,
        entity_type: Optional[str] = None,
        metric_name: Optional[str] = None,
        only_failed: bool = False,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get quality metrics with optional filters"""
        query_parts = ["SELECT * FROM quality_metrics WHERE tenant_id = %s"]
        params = [self.tenant_id]
        
        if entity_id:
            query_parts.append("AND entity_id = %s")
            params.append(entity_id)
        
        if entity_type:
            query_parts.append("AND entity_type = %s")
            params.append(entity_type)
        
        if metric_name:
            query_parts.append("AND metric_name = %s")
            params.append(metric_name)
        
        if only_failed:
            query_parts.append("AND passed = false")
        
        query = " ".join(query_parts) + f" ORDER BY created_at DESC LIMIT {limit}"
        
        with self._get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, params)
                return [dict(row) for row in cur.fetchall()]
    
    def apply_policy(
        self,
        policy_id: str,
        entity_id: str,
        entity_type: str
    ) -> Dict[str, Any]:
        """
        Apply a policy to an entity
        
        Args:
            policy_id: Policy to apply
            entity_id: Entity to apply policy to
            entity_type: Type of entity
        
        Returns:
            dict: Application result
        """
        policy = self.get_policy(policy_id)
        if not policy:
            return {'success': False, 'error': 'Policy not found'}
        
        # Record policy application in lineage
        self.record_lineage(
            entity_id=entity_id,
            entity_type=entity_type,
            operation=f"applied_policy:{policy_id}",
            metadata={'policy_name': policy['name']}
        )
        
        # Apply policy rules (simplified for now)
        result = {
            'success': True,
            'policy_id': policy_id,
            'entity_id': entity_id,
            'applied_at': datetime.now().isoformat()
        }
        
        logger.info(f"Applied policy {policy_id} to entity {entity_id}")
        return result
    
    def get_compliance_report(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Generate compliance report"""
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                # Get policy compliance stats
                cur.execute("""
                    SELECT 
                        policy_type,
                        COUNT(*) as policy_count,
                        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count
                    FROM data_policies
                    WHERE tenant_id = %s
                    GROUP BY policy_type
                """, (self.tenant_id,))
                
                policy_stats = []
                for row in cur.fetchall():
                    policy_stats.append({
                        'policy_type': row[0],
                        'total_policies': row[1],
                        'active_policies': row[2]
                    })
                
                # Get quality metrics summary
                cur.execute("""
                    SELECT 
                        metric_name,
                        COUNT(*) as total_checks,
                        SUM(CASE WHEN passed THEN 1 ELSE 0 END) as passed_checks,
                        AVG(metric_value) as avg_value
                    FROM quality_metrics
                    WHERE tenant_id = %s
                    GROUP BY metric_name
                """, (self.tenant_id,))
                
                quality_stats = []
                for row in cur.fetchall():
                    quality_stats.append({
                        'metric_name': row[0],
                        'total_checks': row[1],
                        'passed_checks': row[2],
                        'pass_rate': row[2] / row[1] if row[1] > 0 else 0,
                        'average_value': float(row[3]) if row[3] else 0
                    })
                
                return {
                    'generated_at': datetime.now().isoformat(),
                    'tenant_id': self.tenant_id,
                    'policy_statistics': policy_stats,
                    'quality_statistics': quality_stats
                } 