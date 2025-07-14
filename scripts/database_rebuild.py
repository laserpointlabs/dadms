#!/usr/bin/env python3
"""
DADM Database Rebuild Script
============================

This script provides comprehensive database rebuild capabilities for the DADM system.
It can:
- Create database schemas from scratch
- Backup current data
- Restore data from backups
- Set up different environments (dev, staging, prod)
- Initialize seed data

Usage:
    python database_rebuild.py --action rebuild --environment dev
    python database_rebuild.py --action backup --output backup_20250714.sql
    python database_rebuild.py --action restore --input backup_20250714.sql
    python database_rebuild.py --action seed --environment dev
"""

import os
import sys
import argparse
import subprocess
import json
import logging
from datetime import datetime
from pathlib import Path
import psycopg2
from psycopg2.extras import Json, RealDictCursor
import tempfile
import shutil

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ANSI color codes for output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    CYAN = '\033[96m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

class DatabaseRebuilder:
    """Main class for database rebuild operations"""
    
    def __init__(self, environment='dev'):
        self.environment = environment
        self.project_root = Path(__file__).parent.parent
        self.backup_dir = self.project_root / 'backups' / 'database'
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        
        # Environment-specific configurations
        self.environments = {
            'dev': {
                'host': 'localhost',
                'port': 5432,
                'database': 'dadm_db',
                'user': 'dadm_user',
                'password': 'dadm_password',
                'container_name': 'dadm-postgres'
            },
            'staging': {
                'host': 'localhost',
                'port': 5432,
                'database': 'dadm_db_staging',
                'user': 'dadm_user',
                'password': 'dadm_password',
                'container_name': 'dadm-postgres-staging'
            },
            'prod': {
                'host': 'localhost',
                'port': 5432,
                'database': 'dadm_db_prod',
                'user': 'dadm_user',
                'password': 'dadm_password',
                'container_name': 'dadm-postgres-prod'
            }
        }
        
        self.config = self.environments.get(environment, self.environments['dev'])
        
    def print_status(self, message, status_type="info"):
        """Print colored status message"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        color_map = {
            "success": f"{Colors.GREEN}✅",
            "warning": f"{Colors.YELLOW}⚠️ ",
            "error": f"{Colors.RED}❌",
            "info": f"{Colors.CYAN}ℹ️ "
        }
        
        color = color_map.get(status_type, color_map["info"])
        print(f"{color} [{timestamp}] {message}{Colors.ENDC}")
        
    def get_connection(self):
        """Get PostgreSQL connection"""
        try:
            return psycopg2.connect(
                host=self.config['host'],
                port=self.config['port'],
                database=self.config['database'],
                user=self.config['user'],
                password=self.config['password']
            )
        except psycopg2.Error as e:
            logger.error(f"Failed to connect to PostgreSQL: {e}")
            raise
    
    def execute_sql_file(self, sql_file_path, use_docker=True):
        """Execute SQL file using psql"""
        self.print_status(f"Executing SQL file: {sql_file_path}")
        
        if use_docker and self.config.get('container_name'):
            # Execute via Docker container
            cmd = [
                'docker', 'exec', self.config['container_name'],
                'psql', '-U', self.config['user'], '-d', self.config['database'],
                '-f', f'/docker-entrypoint-initdb.d/{sql_file_path.name}'
            ]
            
            # Copy file to container first
            docker_copy_cmd = [
                'docker', 'cp', str(sql_file_path),
                f"{self.config['container_name']}:/docker-entrypoint-initdb.d/{sql_file_path.name}"
            ]
            
            try:
                subprocess.run(docker_copy_cmd, check=True, capture_output=True)
                result = subprocess.run(cmd, check=True, capture_output=True, text=True)
                
                if result.returncode == 0:
                    self.print_status(f"Successfully executed {sql_file_path.name}", "success")
                else:
                    self.print_status(f"Error executing {sql_file_path.name}: {result.stderr}", "error")
                    
            except subprocess.CalledProcessError as e:
                self.print_status(f"Failed to execute {sql_file_path.name}: {e}", "error")
                raise
        else:
            # Execute directly
            with open(sql_file_path, 'r') as f:
                sql_content = f.read()
            
            conn = self.get_connection()
            try:
                with conn.cursor() as cursor:
                    cursor.execute(sql_content)
                    conn.commit()
                    self.print_status(f"Successfully executed {sql_file_path.name}", "success")
            except psycopg2.Error as e:
                conn.rollback()
                self.print_status(f"Error executing {sql_file_path.name}: {e}", "error")
                raise
            finally:
                conn.close()
    
    def create_database_schema(self):
        """Create database schema from scratch"""
        self.print_status("Creating database schema from scratch...")
        
        # Order matters for these scripts
        schema_scripts = [
            self.project_root / 'docker' / 'init-scripts' / '001-create-databases.sql',
            self.project_root / 'docker' / 'init-scripts' / '002-create-dadm-database.sql',
            self.project_root / 'docker' / 'init-scripts' / '003-prompt-test-configs.sql',
            self.project_root / 'docker' / 'init-scripts' / '01-fix-varchar-limits.sql'
        ]
        
        for script in schema_scripts:
            if script.exists():
                self.execute_sql_file(script)
            else:
                self.print_status(f"Schema script not found: {script}", "warning")
    
    def backup_database(self, output_file=None):
        """Create a complete backup of the database"""
        if output_file is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = self.backup_dir / f"dadm_backup_{self.environment}_{timestamp}.sql"
        
        self.print_status(f"Creating database backup: {output_file}")
        
        # Use pg_dump via Docker
        cmd = [
            'docker', 'exec', self.config['container_name'],
            'pg_dump', '-U', self.config['user'], '-d', self.config['database'],
            '--clean', '--if-exists', '--create'
        ]
        
        try:
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            
            with open(output_file, 'w') as f:
                f.write(result.stdout)
                
            self.print_status(f"Database backup created: {output_file}", "success")
            return output_file
            
        except subprocess.CalledProcessError as e:
            self.print_status(f"Backup failed: {e}", "error")
            raise
    
    def restore_database(self, backup_file):
        """Restore database from backup"""
        backup_path = Path(backup_file)
        if not backup_path.exists():
            self.print_status(f"Backup file not found: {backup_file}", "error")
            raise FileNotFoundError(f"Backup file not found: {backup_file}")
        
        self.print_status(f"Restoring database from: {backup_file}")
        
        # Copy backup to container and restore
        container_backup_path = f"/tmp/{backup_path.name}"
        
        # Copy file to container
        docker_copy_cmd = [
            'docker', 'cp', str(backup_path),
            f"{self.config['container_name']}:{container_backup_path}"
        ]
        
        # Restore from backup
        docker_restore_cmd = [
            'docker', 'exec', self.config['container_name'],
            'psql', '-U', self.config['user'], '-f', container_backup_path
        ]
        
        try:
            subprocess.run(docker_copy_cmd, check=True)
            subprocess.run(docker_restore_cmd, check=True)
            self.print_status("Database restoration completed", "success")
            
        except subprocess.CalledProcessError as e:
            self.print_status(f"Restoration failed: {e}", "error")
            raise
    
    def create_seed_data(self):
        """Create essential seed data for the environment"""
        self.print_status("Creating seed data...")
        
        conn = self.get_connection()
        try:
            with conn.cursor() as cursor:
                # Create default company
                cursor.execute("""
                    INSERT INTO companies (id, name, description, settings)
                    VALUES (
                        '00000000-0000-0000-0000-000000000001',
                        'Default Company',
                        'Default company for DADM system',
                        '{}'::jsonb
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        description = EXCLUDED.description,
                        updated_at = CURRENT_TIMESTAMP;
                """)
                
                # Create default tenant
                cursor.execute("""
                    INSERT INTO tenants (id, company_id, name, slug, description, settings)
                    VALUES (
                        '00000000-0000-0000-0000-000000000002',
                        '00000000-0000-0000-0000-000000000001',
                        'Default Tenant',
                        'default',
                        'Default tenant for DADM system',
                        '{}'::jsonb
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        slug = EXCLUDED.slug,
                        description = EXCLUDED.description,
                        updated_at = CURRENT_TIMESTAMP;
                """)
                
                # Create default team
                cursor.execute("""
                    INSERT INTO teams (id, tenant_id, name, description, settings)
                    VALUES (
                        '00000000-0000-0000-0000-000000000003',
                        '00000000-0000-0000-0000-000000000002',
                        'Default Team',
                        'Default team for DADM system',
                        '{}'::jsonb
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        description = EXCLUDED.description,
                        updated_at = CURRENT_TIMESTAMP;
                """)
                
                # Create sample prompts for development
                if self.environment == 'dev':
                    cursor.execute("""
                        INSERT INTO prompts (id, tenant_id, version, name, text, type, 
                                           tool_dependencies, workflow_dependencies, tags, 
                                           created_by, metadata)
                        VALUES (
                            '11111111-1111-1111-1111-111111111111',
                            '00000000-0000-0000-0000-000000000002',
                            1,
                            'Sample Analysis Prompt',
                            'Analyze the following data and provide insights: {data}',
                            'simple',
                            '[]'::jsonb,
                            '[]'::jsonb,
                            '["sample", "analysis", "development"]'::jsonb,
                            'system',
                            '{}'::jsonb
                        )
                        ON CONFLICT (id, version) DO NOTHING;
                    """)
                    
                    # Create sample test case
                    cursor.execute("""
                        INSERT INTO test_cases (id, prompt_id, prompt_version, name, input, expected_output, enabled)
                        VALUES (
                            '22222222-2222-2222-2222-222222222222',
                            '11111111-1111-1111-1111-111111111111',
                            1,
                            'Basic Analysis Test',
                            '{"data": "Sample data for analysis"}',
                            '"Analysis complete"',
                            true
                        )
                        ON CONFLICT (id) DO NOTHING;
                    """)
                
                conn.commit()
                self.print_status("Seed data created successfully", "success")
                
        except psycopg2.Error as e:
            conn.rollback()
            self.print_status(f"Failed to create seed data: {e}", "error")
            raise
        finally:
            conn.close()
    
    def verify_database_health(self):
        """Verify database is healthy and accessible"""
        self.print_status("Verifying database health...")
        
        try:
            conn = self.get_connection()
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # Check basic connectivity
                cursor.execute("SELECT version();")
                version = cursor.fetchone()
                if version:
                    self.print_status(f"PostgreSQL version: {version['version']}", "info")
                else:
                    self.print_status("Could not retrieve PostgreSQL version", "warning")
                
                # Check key tables exist
                cursor.execute("""
                    SELECT table_name FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name IN ('companies', 'tenants', 'teams', 'prompts', 'test_cases');
                """)
                tables = [row['table_name'] for row in cursor.fetchall()]
                
                required_tables = ['companies', 'tenants', 'teams', 'prompts', 'test_cases']
                missing_tables = set(required_tables) - set(tables)
                
                if missing_tables:
                    self.print_status(f"Missing tables: {missing_tables}", "warning")
                else:
                    self.print_status("All required tables exist", "success")
                
                # Check data counts
                for table in tables:
                    cursor.execute(f"SELECT COUNT(*) as count FROM {table};")
                    count_result = cursor.fetchone()
                    if count_result:
                        count = count_result['count']
                        self.print_status(f"Table {table}: {count} records", "info")
                    else:
                        self.print_status(f"Table {table}: Could not retrieve count", "warning")
                
            conn.close()
            self.print_status("Database health check completed", "success")
            return True
            
        except Exception as e:
            self.print_status(f"Database health check failed: {e}", "error")
            return False
    
    def full_rebuild(self):
        """Perform a complete database rebuild"""
        self.print_status(f"Starting full database rebuild for environment: {self.environment}")
        
        try:
            # 1. Create schema
            self.create_database_schema()
            
            # 2. Create seed data
            self.create_seed_data()
            
            # 3. Verify health
            if self.verify_database_health():
                self.print_status("Database rebuild completed successfully", "success")
            else:
                self.print_status("Database rebuild completed with warnings", "warning")
                
        except Exception as e:
            self.print_status(f"Database rebuild failed: {e}", "error")
            raise

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='DADM Database Rebuild Tool')
    parser.add_argument('--action', choices=['rebuild', 'backup', 'restore', 'seed', 'verify'],
                       required=True, help='Action to perform')
    parser.add_argument('--environment', choices=['dev', 'staging', 'prod'],
                       default='dev', help='Environment to target')
    parser.add_argument('--output', help='Output file for backup')
    parser.add_argument('--input', help='Input file for restore')
    
    args = parser.parse_args()
    
    rebuilder = DatabaseRebuilder(args.environment)
    
    try:
        if args.action == 'rebuild':
            rebuilder.full_rebuild()
        elif args.action == 'backup':
            rebuilder.backup_database(args.output)
        elif args.action == 'restore':
            if not args.input:
                print("Error: --input required for restore action")
                sys.exit(1)
            rebuilder.restore_database(args.input)
        elif args.action == 'seed':
            rebuilder.create_seed_data()
        elif args.action == 'verify':
            rebuilder.verify_database_health()
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main() 