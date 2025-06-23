#!/usr/bin/env python3
"""
Data Governance Framework for DADM

This module provides comprehensive data governance capabilities including:
- Data lineage tracking and provenance
- Data quality monitoring and validation
- Compliance policy enforcement
- Data classification and tagging
- Audit logging and reporting
"""

import json
import logging
import uuid
import os
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Any, Union, Set
from dataclasses import dataclass, field, asdict
import sqlite3
import hashlib
import re

logger = logging.getLogger(__name__)


class DataClassification(Enum):
    """Data classification levels"""
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"


class DataQualityLevel(Enum):
    """Data quality levels"""
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"
    UNKNOWN = "unknown"


class ComplianceStatus(Enum):
    """Compliance status"""
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    PENDING_REVIEW = "pending_review"
    EXEMPT = "exempt"


@dataclass
class DataPolicy:
    """Data governance policy"""
    policy_id: str
    name: str
    description: str
    classification: DataClassification
    retention_days: Optional[int] = None
    encryption_required: bool = False
    access_controls: List[str] = field(default_factory=list)
    quality_thresholds: Dict[str, float] = field(default_factory=dict)
    tags: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    active: bool = True
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        result = asdict(self)
        result['classification'] = self.classification.value
        result['created_at'] = self.created_at.isoformat()
        return result


@dataclass
class DataLineage:
    """Data lineage information"""
    lineage_id: str
    data_id: str
    source_data_ids: List[str]
    transformation_type: str
    transformation_details: Dict[str, Any]
    created_at: datetime = field(default_factory=datetime.now)
    user_id: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        result = asdict(self)
        result['created_at'] = self.created_at.isoformat()
        return result


@dataclass
class QualityMetrics:
    """Data quality metrics"""
    data_id: str
    completeness: float
    accuracy: float
    consistency: float
    timeliness: float
    validity: float
    overall_score: float
    quality_level: DataQualityLevel
    issues: List[str] = field(default_factory=list)
    measured_at: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        result = asdict(self)
        result['quality_level'] = self.quality_level.value
        result['measured_at'] = self.measured_at.isoformat()
        return result


@dataclass
class ComplianceResult:
    """Compliance check result"""
    data_id: str
    policy_id: str
    status: ComplianceStatus
    violations: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    checked_at: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        result = asdict(self)
        result['status'] = self.status.value
        result['checked_at'] = self.checked_at.isoformat()
        return result


class DataGovernanceManager:
    """
    Manages data governance, compliance, and quality
    """
    
    def __init__(self, storage_dir: str = None):
        """
        Initialize the data governance manager
        
        Args:
            storage_dir: Directory for storing governance data
        """
        if storage_dir is None:
            storage_dir = os.path.join(os.getcwd(), "data", "governance")
        
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize SQLite database
        self.db_path = self.storage_dir / "governance.db"
        self._init_database()
        
        # Load default policies
        self._load_default_policies()
    
    def _init_database(self):
        """Initialize SQLite database schema"""
        with sqlite3.connect(self.db_path) as conn:
            # Policies table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS data_policies (
                    policy_id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    classification TEXT NOT NULL,
                    retention_days INTEGER,
                    encryption_required BOOLEAN DEFAULT FALSE,
                    access_controls TEXT, -- JSON array
                    quality_thresholds TEXT, -- JSON object
                    tags TEXT, -- JSON array
                    created_at TEXT,
                    active BOOLEAN DEFAULT TRUE
                )
            """)
            
            # Data lineage table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS data_lineage (
                    lineage_id TEXT PRIMARY KEY,
                    data_id TEXT NOT NULL,
                    source_data_ids TEXT, -- JSON array
                    transformation_type TEXT,
                    transformation_details TEXT, -- JSON object
                    created_at TEXT,
                    user_id TEXT
                )
            """)
            
            # Quality metrics table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS quality_metrics (
                    data_id TEXT PRIMARY KEY,
                    completeness REAL,
                    accuracy REAL,
                    consistency REAL,
                    timeliness REAL,
                    validity REAL,
                    overall_score REAL,
                    quality_level TEXT,
                    issues TEXT, -- JSON array
                    measured_at TEXT
                )
            """)
            
            # Compliance results table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS compliance_results (
                    data_id TEXT,
                    policy_id TEXT,
                    status TEXT,
                    violations TEXT, -- JSON array
                    recommendations TEXT, -- JSON array
                    checked_at TEXT,
                    PRIMARY KEY (data_id, policy_id)
                )
            """)
            
            # Data classification table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS data_classifications (
                    data_id TEXT PRIMARY KEY,
                    classification TEXT NOT NULL,
                    tags TEXT, -- JSON array
                    classified_at TEXT,
                    classified_by TEXT
                )
            """)
            
            # Audit log table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS audit_log (
                    log_id TEXT PRIMARY KEY,
                    action TEXT NOT NULL,
                    data_id TEXT,
                    user_id TEXT,
                    details TEXT, -- JSON object
                    timestamp TEXT
                )
            """)
    
    def _load_default_policies(self):
        """Load default data governance policies"""
        default_policies = [
            DataPolicy(
                policy_id="default-public",
                name="Public Data Policy",
                description="Default policy for public data",
                classification=DataClassification.PUBLIC,
                retention_days=365,
                encryption_required=False,
                quality_thresholds={"completeness": 0.8, "accuracy": 0.9}
            ),
            DataPolicy(
                policy_id="default-internal",
                name="Internal Data Policy",
                description="Default policy for internal data",
                classification=DataClassification.INTERNAL,
                retention_days=730,
                encryption_required=True,
                access_controls=["authenticated_users"],
                quality_thresholds={"completeness": 0.9, "accuracy": 0.95}
            ),
            DataPolicy(
                policy_id="default-confidential",
                name="Confidential Data Policy",
                description="Default policy for confidential data",
                classification=DataClassification.CONFIDENTIAL,
                retention_days=1095,
                encryption_required=True,
                access_controls=["authorized_users", "audit_logging"],
                quality_thresholds={"completeness": 0.95, "accuracy": 0.98}
            )
        ]
        
        for policy in default_policies:
            self.add_policy(policy)
    
    def add_policy(self, policy: DataPolicy) -> bool:
        """Add a new data policy"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO data_policies 
                    (policy_id, name, description, classification, retention_days,
                     encryption_required, access_controls, quality_thresholds, tags, created_at, active)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    policy.policy_id,
                    policy.name,
                    policy.description,
                    policy.classification.value,
                    policy.retention_days,
                    policy.encryption_required,
                    json.dumps(policy.access_controls),
                    json.dumps(policy.quality_thresholds),
                    json.dumps(policy.tags),
                    policy.created_at.isoformat(),
                    policy.active
                ))
            
            self._log_audit("policy_added", "", "", {"policy_id": policy.policy_id})
            logger.info(f"Added data policy: {policy.name}")
            return True
            
        except Exception as e:
            logger.error(f"Error adding policy: {e}")
            return False
    
    def get_policy(self, policy_id: str) -> Optional[DataPolicy]:
        """Get a data policy by ID"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("""
                    SELECT * FROM data_policies WHERE policy_id = ?
                """, (policy_id,))
                
                row = cursor.fetchone()
                if row:
                    return DataPolicy(
                        policy_id=row[0],
                        name=row[1],
                        description=row[2],
                        classification=DataClassification(row[3]),
                        retention_days=row[4],
                        encryption_required=bool(row[5]),
                        access_controls=json.loads(row[6]) if row[6] else [],
                        quality_thresholds=json.loads(row[7]) if row[7] else {},
                        tags=json.loads(row[8]) if row[8] else [],
                        created_at=datetime.fromisoformat(row[9]),
                        active=bool(row[10])
                    )
        except Exception as e:
            logger.error(f"Error getting policy: {e}")
        
        return None
    
    def apply_data_policies(self, data: Dict[str, Any], policies: Optional[List[str]] = None) -> ComplianceResult:
        """
        Apply data governance policies to data
        
        Args:
            data: Data to check
            policies: List of policy IDs to apply (None for all active policies)
            
        Returns:
            ComplianceResult with policy violations and recommendations
        """
        data_id = str(uuid.uuid4())
        violations = []
        recommendations = []
        overall_status = ComplianceStatus.COMPLIANT
        
        try:
            # Get policies to apply
            if policies is None:
                with sqlite3.connect(self.db_path) as conn:
                    cursor = conn.execute("""
                        SELECT policy_id FROM data_policies WHERE active = TRUE
                    """)
                    policies = [row[0] for row in cursor.fetchall()]
            
            # Check each policy
            for policy_id in policies:
                policy = self.get_policy(policy_id)
                if not policy:
                    continue
                
                policy_result = self._check_policy_compliance(data, policy)
                
                if policy_result.status == ComplianceStatus.NON_COMPLIANT:
                    overall_status = ComplianceStatus.NON_COMPLIANT
                    violations.extend(policy_result.violations)
                
                recommendations.extend(policy_result.recommendations)
                
                # Store compliance result
                self._store_compliance_result(data_id, policy_id, policy_result)
            
            # Store overall compliance result
            result = ComplianceResult(
                data_id=data_id,
                policy_id="overall",
                status=overall_status,
                violations=violations,
                recommendations=recommendations
            )
            
            self._store_compliance_result(data_id, "overall", result)
            
            return result
            
        except Exception as e:
            logger.error(f"Error applying data policies: {e}")
            return ComplianceResult(
                data_id=data_id,
                policy_id="error",
                status=ComplianceStatus.NON_COMPLIANT,
                violations=[f"Error applying policies: {str(e)}"]
            )
    
    def _check_policy_compliance(self, data: Dict[str, Any], policy: DataPolicy) -> ComplianceResult:
        """Check compliance with a specific policy"""
        violations = []
        recommendations = []
        
        # Check data classification
        data_classification = self._classify_data(data)
        if data_classification.value > policy.classification.value:
            violations.append(f"Data classification {data_classification.value} exceeds policy limit {policy.classification.value}")
        
        # Check quality thresholds
        quality_metrics = self._calculate_quality_metrics(data)
        for metric, threshold in policy.quality_thresholds.items():
            if hasattr(quality_metrics, metric):
                actual_value = getattr(quality_metrics, metric)
                if actual_value < threshold:
                    violations.append(f"Quality metric {metric} ({actual_value:.2f}) below threshold ({threshold:.2f})")
                    recommendations.append(f"Improve data quality for {metric}")
        
        # Check encryption requirements
        if policy.encryption_required:
            if not self._is_data_encrypted(data):
                violations.append("Data encryption required but not implemented")
                recommendations.append("Implement data encryption")
        
        # Check access controls
        if policy.access_controls:
            if not self._has_proper_access_controls(data, policy.access_controls):
                violations.append("Required access controls not implemented")
                recommendations.append("Implement required access controls")
        
        status = ComplianceStatus.COMPLIANT if not violations else ComplianceStatus.NON_COMPLIANT
        
        return ComplianceResult(
            data_id=str(uuid.uuid4()),
            policy_id=policy.policy_id,
            status=status,
            violations=violations,
            recommendations=recommendations
        )
    
    def track_data_lineage(self, data_id: str) -> 'LineageGraph':
        """
        Track data lineage and provenance
        
        Args:
            data_id: ID of the data to track
            
        Returns:
            LineageGraph with lineage information
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("""
                    SELECT * FROM data_lineage WHERE data_id = ?
                    ORDER BY created_at DESC
                """, (data_id,))
                
                lineage_records = []
                for row in cursor.fetchall():
                    lineage_records.append(DataLineage(
                        lineage_id=row[0],
                        data_id=row[1],
                        source_data_ids=json.loads(row[2]) if row[2] else [],
                        transformation_type=row[3],
                        transformation_details=json.loads(row[4]) if row[4] else {},
                        created_at=datetime.fromisoformat(row[5]),
                        user_id=row[6]
                    ))
                
                return LineageGraph(data_id=data_id, lineage_records=lineage_records)
                
        except Exception as e:
            logger.error(f"Error tracking data lineage: {e}")
            return LineageGraph(data_id=data_id, lineage_records=[])
    
    def add_lineage_record(self, data_id: str, source_data_ids: List[str], 
                          transformation_type: str, transformation_details: Optional[Dict[str, Any]] = None,
                          user_id: Optional[str] = None) -> bool:
        """Add a lineage record"""
        try:
            lineage_id = str(uuid.uuid4())
            
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT INTO data_lineage 
                    (lineage_id, data_id, source_data_ids, transformation_type, transformation_details, created_at, user_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    lineage_id,
                    data_id,
                    json.dumps(source_data_ids),
                    transformation_type,
                    json.dumps(transformation_details or {}),
                    datetime.now().isoformat(),
                    user_id
                ))
            
            self._log_audit("lineage_added", data_id, user_id, {
                "lineage_id": lineage_id,
                "transformation_type": transformation_type
            })
            
            return True
            
        except Exception as e:
            logger.error(f"Error adding lineage record: {e}")
            return False
    
    def monitor_data_quality(self, dataset_id: str) -> QualityMetrics:
        """
        Monitor data quality metrics
        
        Args:
            dataset_id: ID of the dataset to monitor
            
        Returns:
            QualityMetrics with quality measurements
        """
        try:
            # Get data for quality assessment
            data = self._get_dataset_data(dataset_id)
            if not data:
                return QualityMetrics(
                    data_id=dataset_id,
                    completeness=0.0,
                    accuracy=0.0,
                    consistency=0.0,
                    timeliness=0.0,
                    validity=0.0,
                    overall_score=0.0,
                    quality_level=DataQualityLevel.UNKNOWN,
                    issues=["Dataset not found"]
                )
            
            # Calculate quality metrics
            metrics = self._calculate_quality_metrics(data)
            
            # Store quality metrics
            self._store_quality_metrics(dataset_id, metrics)
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error monitoring data quality: {e}")
            return QualityMetrics(
                data_id=dataset_id,
                completeness=0.0,
                accuracy=0.0,
                consistency=0.0,
                timeliness=0.0,
                validity=0.0,
                overall_score=0.0,
                quality_level=DataQualityLevel.UNKNOWN,
                issues=[f"Error monitoring quality: {str(e)}"]
            )
    
    def _calculate_quality_metrics(self, data: Dict[str, Any]) -> QualityMetrics:
        """Calculate quality metrics for data"""
        issues = []
        
        # Completeness - check for missing values
        total_fields = len(data) if isinstance(data, dict) else 1
        missing_fields = sum(1 for v in data.values() if v is None or v == "") if isinstance(data, dict) else 0
        completeness = (total_fields - missing_fields) / total_fields if total_fields > 0 else 0.0
        
        if completeness < 0.9:
            issues.append(f"Low completeness: {completeness:.2f}")
        
        # Accuracy - basic validation (can be enhanced with domain-specific rules)
        accuracy = 1.0  # Placeholder - implement domain-specific validation
        
        # Consistency - check for consistent data types and formats
        consistency = 1.0  # Placeholder - implement consistency checks
        
        # Timeliness - check if data is recent
        timeliness = 1.0  # Placeholder - implement timeliness checks
        
        # Validity - check if data meets format requirements
        validity = 1.0  # Placeholder - implement validity checks
        
        # Overall score
        overall_score = (completeness + accuracy + consistency + timeliness + validity) / 5.0
        
        # Determine quality level
        if overall_score >= 0.9:
            quality_level = DataQualityLevel.EXCELLENT
        elif overall_score >= 0.8:
            quality_level = DataQualityLevel.GOOD
        elif overall_score >= 0.7:
            quality_level = DataQualityLevel.FAIR
        else:
            quality_level = DataQualityLevel.POOR
        
        return QualityMetrics(
            data_id=str(uuid.uuid4()),
            completeness=completeness,
            accuracy=accuracy,
            consistency=consistency,
            timeliness=timeliness,
            validity=validity,
            overall_score=overall_score,
            quality_level=quality_level,
            issues=issues
        )
    
    def _classify_data(self, data: Dict[str, Any]) -> DataClassification:
        """Classify data based on content and sensitivity"""
        # Simple classification logic - can be enhanced with ML models
        sensitive_keywords = ['password', 'secret', 'private', 'confidential', 'ssn', 'credit']
        
        data_str = json.dumps(data).lower()
        
        for keyword in sensitive_keywords:
            if keyword in data_str:
                return DataClassification.CONFIDENTIAL
        
        # Check for personal information patterns
        if re.search(r'\b\d{3}-\d{2}-\d{4}\b', data_str):  # SSN pattern
            return DataClassification.RESTRICTED
        
        if re.search(r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b', data_str):  # Credit card pattern
            return DataClassification.RESTRICTED
        
        return DataClassification.INTERNAL
    
    def _is_data_encrypted(self, data: Dict[str, Any]) -> bool:
        """Check if data is encrypted"""
        # Placeholder - implement encryption detection
        return False
    
    def _has_proper_access_controls(self, data: Dict[str, Any], required_controls: List[str]) -> bool:
        """Check if data has proper access controls"""
        # Placeholder - implement access control validation
        return True
    
    def _get_dataset_data(self, dataset_id: str) -> Optional[Dict[str, Any]]:
        """Get dataset data for quality assessment"""
        # Placeholder - implement data retrieval
        return None
    
    def _store_quality_metrics(self, dataset_id: str, metrics: QualityMetrics):
        """Store quality metrics in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO quality_metrics 
                    (data_id, completeness, accuracy, consistency, timeliness, validity,
                     overall_score, quality_level, issues, measured_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    dataset_id,
                    metrics.completeness,
                    metrics.accuracy,
                    metrics.consistency,
                    metrics.timeliness,
                    metrics.validity,
                    metrics.overall_score,
                    metrics.quality_level.value,
                    json.dumps(metrics.issues),
                    metrics.measured_at.isoformat()
                ))
        except Exception as e:
            logger.error(f"Error storing quality metrics: {e}")
    
    def _store_compliance_result(self, data_id: str, policy_id: str, result: ComplianceResult):
        """Store compliance result in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO compliance_results 
                    (data_id, policy_id, status, violations, recommendations, checked_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    data_id,
                    policy_id,
                    result.status.value,
                    json.dumps(result.violations),
                    json.dumps(result.recommendations),
                    result.checked_at.isoformat()
                ))
        except Exception as e:
            logger.error(f"Error storing compliance result: {e}")
    
    def _log_audit(self, action: str, data_id: Optional[str] = None, user_id: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        """Log audit event"""
        try:
            log_id = str(uuid.uuid4())
            
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT INTO audit_log (log_id, action, data_id, user_id, details, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    log_id,
                    action,
                    data_id,
                    user_id,
                    json.dumps(details or {}),
                    datetime.now().isoformat()
                ))
        except Exception as e:
            logger.error(f"Error logging audit event: {e}")


@dataclass
class LineageGraph:
    """Data lineage graph"""
    data_id: str
    lineage_records: List[DataLineage]
    
    def get_sources(self) -> Set[str]:
        """Get all source data IDs"""
        sources = set()
        for record in self.lineage_records:
            sources.update(record.source_data_ids)
        return sources
    
    def get_transformation_types(self) -> Set[str]:
        """Get all transformation types"""
        return {record.transformation_type for record in self.lineage_records}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'data_id': self.data_id,
            'lineage_records': [record.to_dict() for record in self.lineage_records],
            'sources': list(self.get_sources()),
            'transformation_types': list(self.get_transformation_types())
        }


# Global instance
_governance_manager = None

def get_governance_manager() -> DataGovernanceManager:
    """Get singleton instance of data governance manager"""
    global _governance_manager
    if _governance_manager is None:
        _governance_manager = DataGovernanceManager()
    return _governance_manager 