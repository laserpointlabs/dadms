#!/usr/bin/env python3
"""
Script to create analysis tables in PostgreSQL
"""
import psycopg2
import sys

def create_analysis_tables():
    """Create the analysis tables in PostgreSQL"""
    try:
        # Connect to PostgreSQL
        conn = psycopg2.connect(
            host='localhost',
            port=5432,
            database='dadm_db',
            user='dadm_user',
            password='dadm_password'
        )
        
        cursor = conn.cursor()
        
        print("🔗 Connected to PostgreSQL")
        
        # Enable UUID extension
        cursor.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        print("✅ UUID extension enabled")
        
        # Create analysis_metadata table
        cursor.execute("""
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
        print("✅ analysis_metadata table created")
        
        # Create analysis_data table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS analysis_data (
                analysis_id UUID PRIMARY KEY REFERENCES analysis_metadata(analysis_id) ON DELETE CASCADE,
                input_data JSONB,
                output_data JSONB,
                raw_response TEXT,
                processing_log JSONB DEFAULT '[]'::jsonb,
                tenant_id UUID DEFAULT NULL
            );
        """)
        print("✅ analysis_data table created")
        
        # Create processing_tasks table
        cursor.execute("""
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
        print("✅ processing_tasks table created")
        
        # Create indexes
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
            cursor.execute(index_sql)
        
        print("✅ Indexes created")
        
        # Commit changes
        conn.commit()
        
        # Verify tables exist
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name LIKE '%analysis%' 
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        print(f"✅ Verified {len(tables)} analysis tables exist:")
        for table in tables:
            print(f"   - {table[0]}")
        
        cursor.close()
        conn.close()
        
        print("🎉 Analysis tables created successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False

if __name__ == "__main__":
    success = create_analysis_tables()
    sys.exit(0 if success else 1) 