#!/usr/bin/env python3
"""
PostgreSQL Setup Test Script
REQ-004: Validate PostgreSQL Infrastructure Setup

This script tests the PostgreSQL database setup and connectivity.
"""

import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class PostgreSQLTester:
    """Test PostgreSQL setup and connectivity"""
    
    def __init__(self):
        """Initialize with database connection parameters"""
        # Check if running in Docker
        if os.environ.get('DOCKER_CONTAINER'):
            self.host = 'dadm-postgres'
        else:
            self.host = os.environ.get('POSTGRES_HOST', 'localhost')
        
        self.port = int(os.environ.get('POSTGRES_PORT', '5432'))
        self.database = os.environ.get('POSTGRES_DB', 'dadm_db')
        self.user = os.environ.get('POSTGRES_USER', 'dadm_user')
        self.password = os.environ.get('POSTGRES_PASSWORD', 'dadm_password')
        self.conn = None
        
    def test_connection(self):
        """Test basic database connectivity"""
        try:
            logger.info(f"Testing connection to PostgreSQL at {self.host}:{self.port}/{self.database}")
            self.conn = psycopg2.connect(
                host=self.host,
                port=self.port,
                database=self.database,
                user=self.user,
                password=self.password
            )
            cursor = self.conn.cursor()
            cursor.execute("SELECT version()")
            version = cursor.fetchone()[0]
            logger.info(f"✓ Connected successfully! PostgreSQL version: {version}")
            return True
        except Exception as e:
            logger.error(f"✗ Connection failed: {e}")
            return False
    
    def test_schema(self):
        """Test that all required tables exist"""
        if not self.conn:
            logger.error("No database connection")
            return False
            
        required_tables = [
            # Multi-tenant hierarchy
            'companies', 'tenants', 'teams', 'projects', 'decisions',
            # Authentication (placeholder)
            'users', 'user_roles',
            # Analysis data
            'analysis_metadata', 'analysis_data', 'processing_tasks',
            # Prompts
            'prompts', 'test_cases', 'test_results',
            # Governance
            'data_policies', 'data_lineage', 'quality_metrics'
        ]
        
        try:
            cursor = self.conn.cursor()
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """)
            existing_tables = [row[0] for row in cursor.fetchall()]
            
            logger.info("\nChecking required tables:")
            all_present = True
            for table in required_tables:
                if table in existing_tables:
                    logger.info(f"  ✓ {table}")
                else:
                    logger.error(f"  ✗ {table} - MISSING")
                    all_present = False
            
            return all_present
        except Exception as e:
            logger.error(f"Error checking schema: {e}")
            return False
    
    def test_default_data(self):
        """Test that default company and tenant exist"""
        if not self.conn:
            logger.error("No database connection")
            return False
            
        try:
            cursor = self.conn.cursor(cursor_factory=RealDictCursor)
            
            # Check default company
            cursor.execute("""
                SELECT * FROM companies 
                WHERE id = '00000000-0000-0000-0000-000000000001'
            """)
            company = cursor.fetchone()
            if company:
                logger.info(f"\n✓ Default company found: {company['name']}")
            else:
                logger.error("\n✗ Default company not found")
                return False
            
            # Check default tenant
            cursor.execute("""
                SELECT * FROM tenants 
                WHERE id = '00000000-0000-0000-0000-000000000002'
            """)
            tenant = cursor.fetchone()
            if tenant:
                logger.info(f"✓ Default tenant found: {tenant['name']} (slug: {tenant['slug']})")
            else:
                logger.error("✗ Default tenant not found")
                return False
                
            return True
        except Exception as e:
            logger.error(f"Error checking default data: {e}")
            return False
    
    def test_multi_tenant_insert(self):
        """Test inserting data with tenant isolation"""
        if not self.conn:
            logger.error("No database connection")
            return False
            
        try:
            cursor = self.conn.cursor()
            
            # Insert a test prompt
            test_prompt_id = 'test-' + datetime.now().strftime('%Y%m%d%H%M%S')
            cursor.execute("""
                INSERT INTO prompts 
                (id, tenant_id, version, name, text, type, created_by, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id
            """, (
                test_prompt_id,
                '00000000-0000-0000-0000-000000000002',  # Default tenant
                1,
                'Test Prompt',
                'This is a test prompt',
                'simple',
                'test_script'
            ))
            
            inserted_id = cursor.fetchone()[0]
            self.conn.commit()
            
            logger.info(f"\n✓ Successfully inserted test prompt with ID: {inserted_id}")
            
            # Query back with tenant filter
            cursor.execute("""
                SELECT p.name, t.name as tenant_name
                FROM prompts p
                JOIN tenants t ON p.tenant_id = t.id
                WHERE p.id = %s AND t.slug = 'default-tenant'
            """, (test_prompt_id,))
            
            result = cursor.fetchone()
            if result:
                logger.info(f"✓ Retrieved prompt '{result[0]}' from tenant '{result[1]}'")
            
            # Clean up
            cursor.execute("DELETE FROM prompts WHERE id = %s", (test_prompt_id,))
            self.conn.commit()
            
            return True
        except Exception as e:
            logger.error(f"Error testing multi-tenant insert: {e}")
            if self.conn:
                self.conn.rollback()
            return False
    
    def test_indexes(self):
        """Test that performance indexes exist"""
        if not self.conn:
            logger.error("No database connection")
            return False
            
        try:
            cursor = self.conn.cursor()
            cursor.execute("""
                SELECT indexname 
                FROM pg_indexes 
                WHERE schemaname = 'public' 
                AND indexname LIKE 'idx_%'
                ORDER BY indexname
            """)
            
            indexes = [row[0] for row in cursor.fetchall()]
            
            logger.info(f"\n✓ Found {len(indexes)} custom indexes:")
            for idx in indexes[:5]:  # Show first 5
                logger.info(f"  - {idx}")
            if len(indexes) > 5:
                logger.info(f"  ... and {len(indexes) - 5} more")
                
            return len(indexes) > 0
        except Exception as e:
            logger.error(f"Error checking indexes: {e}")
            return False
    
    def run_all_tests(self):
        """Run all tests and report results"""
        logger.info("="*60)
        logger.info("PostgreSQL Infrastructure Test Suite")
        logger.info("="*60)
        
        tests = [
            ("Database Connection", self.test_connection),
            ("Schema Validation", self.test_schema),
            ("Default Data", self.test_default_data),
            ("Multi-Tenant Operations", self.test_multi_tenant_insert),
            ("Performance Indexes", self.test_indexes)
        ]
        
        results = []
        for test_name, test_func in tests:
            logger.info(f"\nRunning: {test_name}")
            logger.info("-" * 40)
            try:
                passed = test_func()
                results.append((test_name, passed))
            except Exception as e:
                logger.error(f"Test failed with exception: {e}")
                results.append((test_name, False))
        
        # Summary
        logger.info("\n" + "="*60)
        logger.info("TEST SUMMARY")
        logger.info("="*60)
        
        total_passed = sum(1 for _, passed in results if passed)
        total_tests = len(results)
        
        for test_name, passed in results:
            status = "PASSED" if passed else "FAILED"
            symbol = "✓" if passed else "✗"
            logger.info(f"{symbol} {test_name:.<40} {status}")
        
        logger.info("="*60)
        logger.info(f"Total: {total_passed}/{total_tests} tests passed")
        
        if self.conn:
            self.conn.close()
            
        return total_passed == total_tests


def main():
    """Main entry point"""
    tester = PostgreSQLTester()
    success = tester.run_all_tests()
    
    if success:
        logger.info("\n🎉 All tests passed! PostgreSQL is ready for use.")
        return 0
    else:
        logger.error("\n❌ Some tests failed. Please check the setup.")
        return 1


if __name__ == "__main__":
    sys.exit(main()) 