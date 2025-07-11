#!/usr/bin/env python3
"""
SQLite to PostgreSQL Migration Script for DADM
REQ-004: PostgreSQL Infrastructure Setup

This script migrates all SQLite databases to the consolidated PostgreSQL database.
"""

import os
import sqlite3
import psycopg2
from psycopg2.extras import Json
import json
import logging
from datetime import datetime
from pathlib import Path
import uuid
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Default tenant ID for migration
DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000002'

class SQLiteToPostgreSQLMigrator:
    """Migrates SQLite databases to PostgreSQL"""
    
    def __init__(self, pg_host='localhost', pg_port=5432, pg_database='dadm_db',
                 pg_user='dadm_user', pg_password='dadm_password'):
        """Initialize migrator with PostgreSQL connection parameters"""
        self.pg_params = {
            'host': pg_host,
            'port': pg_port,
            'database': pg_database,
            'user': pg_user,
            'password': pg_password
        }
        self.pg_conn = None
        self.sqlite_connections = {}
        
    def connect_postgresql(self):
        """Connect to PostgreSQL database"""
        try:
            self.pg_conn = psycopg2.connect(**self.pg_params)
            self.pg_conn.autocommit = False
            logger.info(f"Connected to PostgreSQL database: {self.pg_params['database']}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to PostgreSQL: {e}")
            return False
    
    def connect_sqlite(self, db_path, name):
        """Connect to SQLite database"""
        try:
            if os.path.exists(db_path):
                conn = sqlite3.connect(db_path)
                conn.row_factory = sqlite3.Row
                self.sqlite_connections[name] = conn
                logger.info(f"Connected to SQLite database '{name}': {db_path}")
                return True
            else:
                logger.warning(f"SQLite database not found: {db_path}")
                return False
        except Exception as e:
            logger.error(f"Failed to connect to SQLite '{name}': {e}")
            return False
    
    def migrate_analysis_data(self):
        """Migrate analysis data from SQLite to PostgreSQL"""
        if 'analysis' not in self.sqlite_connections:
            logger.warning("Analysis database not connected, skipping migration")
            return
        
        sqlite_conn = self.sqlite_connections['analysis']
        if not self.pg_conn:
            raise Exception("PostgreSQL connection not established")
        pg_cursor = self.pg_conn.cursor()
        
        try:
            # Migrate analysis_metadata
            logger.info("Migrating analysis_metadata...")
            sqlite_cursor = sqlite_conn.execute("SELECT * FROM analysis_metadata")
            rows = sqlite_cursor.fetchall()
            
            for row in rows:
                # Convert TEXT UUID to proper UUID if needed
                analysis_id = row['analysis_id']
                if not self._is_valid_uuid(analysis_id):
                    analysis_id = str(uuid.uuid4())
                
                pg_cursor.execute("""
                    INSERT INTO analysis_metadata 
                    (analysis_id, tenant_id, thread_id, session_id, process_instance_id,
                     task_name, created_at, updated_at, status, tags, source_service)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (analysis_id) DO NOTHING
                """, (
                    analysis_id,
                    DEFAULT_TENANT_ID,  # Assign to default tenant
                    row['thread_id'],
                    row['session_id'],
                    row['process_instance_id'],
                    row['task_name'],
                    self._parse_timestamp(row['created_at']),
                    self._parse_timestamp(row['updated_at']),
                    row['status'],
                    Json(json.loads(row['tags']) if row['tags'] else []),
                    row['source_service']
                ))
                
            logger.info(f"Migrated {len(rows)} analysis_metadata records")
            
            # Migrate analysis_data
            logger.info("Migrating analysis_data...")
            sqlite_cursor = sqlite_conn.execute("SELECT * FROM analysis_data")
            rows = sqlite_cursor.fetchall()
            
            for row in rows:
                analysis_id = row['analysis_id']
                if not self._is_valid_uuid(analysis_id):
                    continue  # Skip if parent doesn't exist
                
                pg_cursor.execute("""
                    INSERT INTO analysis_data 
                    (analysis_id, input_data, output_data, raw_response, processing_log)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (analysis_id) DO NOTHING
                """, (
                    analysis_id,
                    Json(json.loads(row['input_data']) if row['input_data'] else None),
                    Json(json.loads(row['output_data']) if row['output_data'] else None),
                    row['raw_response'],
                    Json(json.loads(row['processing_log']) if row['processing_log'] else [])
                ))
            
            logger.info(f"Migrated {len(rows)} analysis_data records")
            
            # Migrate processing_tasks
            logger.info("Migrating processing_tasks...")
            sqlite_cursor = sqlite_conn.execute("SELECT * FROM processing_tasks")
            rows = sqlite_cursor.fetchall()
            
            for row in rows:
                task_id = row['task_id']
                if not self._is_valid_uuid(task_id):
                    task_id = str(uuid.uuid4())
                
                pg_cursor.execute("""
                    INSERT INTO processing_tasks 
                    (task_id, analysis_id, processor_type, status, created_at,
                     completed_at, error_message, metadata)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (task_id) DO NOTHING
                """, (
                    task_id,
                    row['analysis_id'],
                    row['processor_type'],
                    row['status'],
                    self._parse_timestamp(row['created_at']),
                    self._parse_timestamp(row['completed_at']),
                    row['error_message'],
                    Json(json.loads(row['metadata']) if row['metadata'] else None)
                ))
            
            logger.info(f"Migrated {len(rows)} processing_tasks records")
            
        except Exception as e:
            logger.error(f"Error migrating analysis data: {e}")
            raise
    
    def migrate_prompts_data(self):
        """Migrate prompts data from SQLite to PostgreSQL"""
        if 'prompts' not in self.sqlite_connections:
            logger.warning("Prompts database not connected, skipping migration")
            return
        
        sqlite_conn = self.sqlite_connections['prompts']
        if not self.pg_conn:
            raise Exception("PostgreSQL connection not established")
        pg_cursor = self.pg_conn.cursor()
        
        try:
            # Migrate prompts
            logger.info("Migrating prompts...")
            sqlite_cursor = sqlite_conn.execute("SELECT * FROM prompts")
            rows = sqlite_cursor.fetchall()
            
            for row in rows:
                # Convert TEXT UUID to proper UUID
                prompt_id = row['id']
                if not self._is_valid_uuid(prompt_id):
                    prompt_id = str(uuid.uuid4())
                
                pg_cursor.execute("""
                    INSERT INTO prompts 
                    (id, tenant_id, version, name, text, type, tool_dependencies,
                     workflow_dependencies, tags, created_by, created_at, updated_at, metadata)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id, version) DO NOTHING
                """, (
                    prompt_id,
                    DEFAULT_TENANT_ID,  # Assign to default tenant
                    row['version'],
                    row['name'],
                    row['text'],
                    row['type'],
                    Json(json.loads(row['tool_dependencies'])),
                    Json(json.loads(row['workflow_dependencies'])),
                    Json(json.loads(row['tags'])),
                    row['created_by'],
                    self._parse_timestamp(row['created_at']),
                    self._parse_timestamp(row['updated_at']),
                    Json(json.loads(row['metadata']))
                ))
            
            logger.info(f"Migrated {len(rows)} prompts records")
            
            # Migrate test_cases
            logger.info("Migrating test_cases...")
            sqlite_cursor = sqlite_conn.execute("SELECT * FROM test_cases")
            rows = sqlite_cursor.fetchall()
            
            for row in rows:
                test_case_id = row['id']
                if not self._is_valid_uuid(test_case_id):
                    test_case_id = str(uuid.uuid4())
                
                pg_cursor.execute("""
                    INSERT INTO test_cases 
                    (id, prompt_id, prompt_version, name, input, expected_output,
                     scoring_logic, enabled)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                """, (
                    test_case_id,
                    row['prompt_id'],
                    row['prompt_version'],
                    row['name'],
                    row['input'],
                    row['expected_output'],
                    row['scoring_logic'],
                    bool(row['enabled'])
                ))
            
            logger.info(f"Migrated {len(rows)} test_cases records")
            
        except Exception as e:
            logger.error(f"Error migrating prompts data: {e}")
            raise
    
    def migrate_governance_data(self):
        """Migrate governance data from SQLite to PostgreSQL"""
        if 'governance' not in self.sqlite_connections:
            logger.warning("Governance database not connected, skipping migration")
            return
        
        sqlite_conn = self.sqlite_connections['governance']
        if not self.pg_conn:
            raise Exception("PostgreSQL connection not established")
        pg_cursor = self.pg_conn.cursor()
        
        try:
            # Migrate data_policies
            logger.info("Migrating data_policies...")
            sqlite_cursor = sqlite_conn.execute("SELECT * FROM data_policies")
            rows = sqlite_cursor.fetchall()
            
            for row in rows:
                policy_id = row['policy_id']
                if not self._is_valid_uuid(policy_id):
                    policy_id = str(uuid.uuid4())
                
                pg_cursor.execute("""
                    INSERT INTO data_policies 
                    (policy_id, tenant_id, name, description, classification,
                     retention_days, encryption_required, access_controls,
                     quality_thresholds, tags, created_at, active)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (policy_id) DO NOTHING
                """, (
                    policy_id,
                    DEFAULT_TENANT_ID,  # Assign to default tenant
                    row['name'],
                    row['description'],
                    row['classification'],
                    row['retention_days'],
                    bool(row['encryption_required']),
                    Json(json.loads(row['access_controls']) if row['access_controls'] else None),
                    Json(json.loads(row['quality_thresholds']) if row['quality_thresholds'] else None),
                    Json(json.loads(row['tags']) if row['tags'] else []),
                    self._parse_timestamp(row['created_at']),
                    bool(row['active'])
                ))
            
            logger.info(f"Migrated {len(rows)} data_policies records")
            
            # Migrate data_lineage
            logger.info("Migrating data_lineage...")
            sqlite_cursor = sqlite_conn.execute("SELECT * FROM data_lineage")
            rows = sqlite_cursor.fetchall()
            
            for row in rows:
                lineage_id = row['lineage_id']
                if not self._is_valid_uuid(lineage_id):
                    lineage_id = str(uuid.uuid4())
                
                pg_cursor.execute("""
                    INSERT INTO data_lineage 
                    (lineage_id, data_id, source_data_ids, transformation_type,
                     transformation_details, created_at, user_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (lineage_id) DO NOTHING
                """, (
                    lineage_id,
                    row['data_id'],
                    Json(json.loads(row['source_data_ids']) if row['source_data_ids'] else None),
                    row['transformation_type'],
                    Json(json.loads(row['transformation_details']) if row['transformation_details'] else None),
                    self._parse_timestamp(row['created_at']),
                    row['user_id'] if self._is_valid_uuid(row['user_id']) else None
                ))
            
            logger.info(f"Migrated {len(rows)} data_lineage records")
            
            # Migrate quality_metrics
            logger.info("Migrating quality_metrics...")
            sqlite_cursor = sqlite_conn.execute("SELECT * FROM quality_metrics")
            rows = sqlite_cursor.fetchall()
            
            for row in rows:
                pg_cursor.execute("""
                    INSERT INTO quality_metrics 
                    (data_id, completeness, accuracy, consistency, timeliness,
                     validity, overall_score, quality_level, issues, measured_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (data_id) DO NOTHING
                """, (
                    row['data_id'],
                    row['completeness'],
                    row['accuracy'],
                    row['consistency'],
                    row['timeliness'],
                    row['validity'],
                    row['overall_score'],
                    row['quality_level'],
                    Json(json.loads(row['issues']) if row['issues'] else None),
                    self._parse_timestamp(row['measured_at'])
                ))
            
            logger.info(f"Migrated {len(rows)} quality_metrics records")
            
        except Exception as e:
            logger.error(f"Error migrating governance data: {e}")
            raise
    
    def _is_valid_uuid(self, value):
        """Check if a string is a valid UUID"""
        if not value:
            return False
        try:
            uuid.UUID(str(value))
            return True
        except ValueError:
            return False
    
    def _parse_timestamp(self, timestamp_str):
        """Parse timestamp string to datetime object"""
        if not timestamp_str:
            return None
        try:
            # Try ISO format first
            return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        except:
            try:
                # Try common formats
                return datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
            except:
                return datetime.now()  # Default to now if parsing fails
    
    def migrate_all(self):
        """Run all migrations"""
        try:
            logger.info("Starting SQLite to PostgreSQL migration...")
            
            # Connect to PostgreSQL
            if not self.connect_postgresql():
                raise Exception("Failed to connect to PostgreSQL")
            
            # Connect to SQLite databases
            base_dir = Path(os.getcwd())
            
            # Analysis database
            analysis_db = base_dir / "data" / "analysis_storage" / "analysis_data.db"
            self.connect_sqlite(str(analysis_db), 'analysis')
            
            # Prompts database
            prompts_db = base_dir / "data" / "prompts.db"
            self.connect_sqlite(str(prompts_db), 'prompts')
            
            # Governance database
            governance_db = base_dir / "data" / "governance" / "governance.db"
            self.connect_sqlite(str(governance_db), 'governance')
            
            # Run migrations
            self.migrate_analysis_data()
            self.migrate_prompts_data()
            self.migrate_governance_data()
            
            # Commit changes
            self.pg_conn.commit()
            logger.info("Migration completed successfully!")
            
            # Display summary
            self._display_summary()
            
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            if self.pg_conn:
                self.pg_conn.rollback()
            raise
        finally:
            # Close connections
            for conn in self.sqlite_connections.values():
                conn.close()
            if self.pg_conn:
                self.pg_conn.close()
    
    def _display_summary(self):
        """Display migration summary"""
        pg_cursor = self.pg_conn.cursor()
        
        tables = [
            ('analysis_metadata', 'Analysis Metadata'),
            ('analysis_data', 'Analysis Data'),
            ('processing_tasks', 'Processing Tasks'),
            ('prompts', 'Prompts'),
            ('test_cases', 'Test Cases'),
            ('data_policies', 'Data Policies'),
            ('data_lineage', 'Data Lineage'),
            ('quality_metrics', 'Quality Metrics')
        ]
        
        print("\n" + "="*60)
        print("MIGRATION SUMMARY")
        print("="*60)
        
        for table_name, display_name in tables:
            pg_cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = pg_cursor.fetchone()[0]
            print(f"{display_name:.<40} {count:>10} records")
        
        print("="*60)
        print(f"Default Tenant ID: {DEFAULT_TENANT_ID}")
        print("="*60 + "\n")


def main():
    """Main entry point"""
    # Check if running in Docker or local
    if os.environ.get('DOCKER_CONTAINER'):
        pg_host = 'dadm-postgres'
    else:
        pg_host = 'localhost'
    
    # Get PostgreSQL credentials from environment or use defaults
    pg_database = os.environ.get('POSTGRES_DB', 'dadm_db')
    pg_user = os.environ.get('POSTGRES_USER', 'dadm_user')
    pg_password = os.environ.get('POSTGRES_PASSWORD', 'dadm_password')
    pg_port = int(os.environ.get('POSTGRES_PORT', '5432'))
    
    # Create migrator and run migration
    migrator = SQLiteToPostgreSQLMigrator(
        pg_host=pg_host,
        pg_port=pg_port,
        pg_database=pg_database,
        pg_user=pg_user,
        pg_password=pg_password
    )
    
    try:
        migrator.migrate_all()
        return 0
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main()) 