#!/usr/bin/env python3
"""
Check prompt data stored in PostgreSQL
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime

# Database connection
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'dadm_db',
    'user': 'postgres',
    'password': 'postgres'
}

def format_json(data):
    """Format JSON data for display"""
    if isinstance(data, (dict, list)):
        return json.dumps(data, indent=2)
    return str(data)

def display_prompts():
    """Display all prompts with their details"""
    with psycopg2.connect(**DB_CONFIG) as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get prompts
            cur.execute("""
                SELECT id, name, type, version, created_at, updated_at,
                       tags, metadata, tool_dependencies, workflow_dependencies
                FROM prompts
                ORDER BY created_at DESC
            """)
            prompts = cur.fetchall()
            
            print(f"\n📚 PROMPTS IN DATABASE: {len(prompts)} total")
            print("=" * 80)
            
            for prompt in prompts:
                print(f"\n🔸 {prompt['name']} (v{prompt['version']})")
                print(f"   ID: {prompt['id']}")
                print(f"   Type: {prompt['type']}")
                print(f"   Created: {prompt['created_at']}")
                print(f"   Tags: {prompt['tags']}")
                
                if prompt['metadata']:
                    print(f"   Metadata: {format_json(prompt['metadata'])}")
                
                if prompt['tool_dependencies']:
                    print(f"   Tool Dependencies: {prompt['tool_dependencies']}")
                
                if prompt['workflow_dependencies']:
                    print(f"   Workflow Dependencies: {prompt['workflow_dependencies']}")
                
                # Get test cases for this prompt
                cur.execute("""
                    SELECT id, name, input, expected_output, enabled
                    FROM test_cases
                    WHERE prompt_id = %s
                """, (prompt['id'],))
                test_cases = cur.fetchall()
                
                if test_cases:
                    print(f"\n   📋 Test Cases ({len(test_cases)}):")
                    for tc in test_cases:
                        status = "✅" if tc['enabled'] else "❌"
                        print(f"      {status} {tc['name']}")
                        print(f"         Input: {str(tc['input'])[:60]}...")
                        print(f"         Expected: {str(tc['expected_output'])[:60]}...")

def check_test_results():
    """Check test results if any exist"""
    with psycopg2.connect(**DB_CONFIG) as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check if test_results table has data
            cur.execute("SELECT COUNT(*) as count FROM test_results")
            count = cur.fetchone()['count']
            
            print(f"\n\n📊 TEST RESULTS: {count} total")
            print("=" * 80)
            
            if count > 0:
                cur.execute("""
                    SELECT tr.*, tc.name as test_case_name, p.name as prompt_name
                    FROM test_results tr
                    JOIN test_cases tc ON tr.test_case_id = tc.id
                    JOIN prompts p ON tr.prompt_id = p.id
                    ORDER BY tr.executed_at DESC
                    LIMIT 10
                """)
                results = cur.fetchall()
                
                for result in results:
                    status = "✅ PASSED" if result['passed'] else "❌ FAILED"
                    print(f"\n{status} - {result['prompt_name']} / {result['test_case_name']}")
                    print(f"   Executed: {result['executed_at']}")
                    print(f"   Model: {result['llm_model']}")
                    print(f"   Execution Time: {result['execution_time_ms']}ms")
                    if result['error_message']:
                        print(f"   Error: {result['error_message']}")
            else:
                print("No test results found. This might be because:")
                print("- Test results are being stored in SQLite instead of PostgreSQL")
                print("- The prompt service needs to be updated to use PostgreSQL")

def check_data_governance():
    """Check data governance records"""
    with psycopg2.connect(**DB_CONFIG) as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check policies
            cur.execute("SELECT COUNT(*) as count FROM data_policies")
            policy_count = cur.fetchone()['count']
            
            # Check lineage
            cur.execute("SELECT COUNT(*) as count FROM data_lineage")
            lineage_count = cur.fetchone()['count']
            
            # Check quality metrics
            cur.execute("SELECT COUNT(*) as count FROM quality_metrics")
            metrics_count = cur.fetchone()['count']
            
            print(f"\n\n🛡️ DATA GOVERNANCE")
            print("=" * 80)
            print(f"Data Policies: {policy_count}")
            print(f"Data Lineage Records: {lineage_count}")
            print(f"Quality Metrics: {metrics_count}")

def check_tenant_data():
    """Check multi-tenant data"""
    with psycopg2.connect(**DB_CONFIG) as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get tenant info
            cur.execute("""
                SELECT t.*, c.name as company_name
                FROM tenants t
                JOIN companies c ON t.company_id = c.id
            """)
            tenants = cur.fetchall()
            
            print(f"\n\n🏢 MULTI-TENANT DATA")
            print("=" * 80)
            
            for tenant in tenants:
                print(f"\nTenant: {tenant['name']} (ID: {tenant['id']})")
                print(f"   Company: {tenant['company_name']}")
                print(f"   Slug: {tenant['slug']}")
                
                # Count prompts per tenant
                cur.execute("""
                    SELECT COUNT(*) as count FROM prompts WHERE tenant_id = %s
                """, (tenant['id'],))
                prompt_count = cur.fetchone()['count']
                print(f"   Prompts: {prompt_count}")

def main():
    print("🔍 DADM PostgreSQL Data Check")
    print("=" * 80)
    
    try:
        display_prompts()
        check_test_results()
        check_data_governance()
        check_tenant_data()
        
        print("\n\n✅ Data check completed!")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        print("\nMake sure PostgreSQL is running and accessible.")

if __name__ == "__main__":
    main() 