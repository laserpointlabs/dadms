-- Create analysis tables for DADM
-- Run this script to create the missing analysis_metadata and related tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Analysis metadata table
CREATE TABLE IF NOT EXISTS analysis_metadata (
    analysis_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID DEFAULT NULL, -- Optional tenant reference
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

-- Analysis data table
CREATE TABLE IF NOT EXISTS analysis_data (
    analysis_id UUID PRIMARY KEY REFERENCES analysis_metadata(analysis_id) ON DELETE CASCADE,
    input_data JSONB,
    output_data JSONB,
    raw_response TEXT,
    processing_log JSONB DEFAULT '[]'::jsonb,
    tenant_id UUID DEFAULT NULL -- Optional tenant reference
);

-- Processing tasks table
CREATE TABLE IF NOT EXISTS processing_tasks (
    task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES analysis_metadata(analysis_id) ON DELETE CASCADE,
    processor_type VARCHAR(100),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    tenant_id UUID DEFAULT NULL -- Optional tenant reference
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analysis_metadata_created_at ON analysis_metadata(created_at);
CREATE INDEX IF NOT EXISTS idx_analysis_metadata_process_instance_id ON analysis_metadata(process_instance_id);
CREATE INDEX IF NOT EXISTS idx_analysis_metadata_thread_id ON analysis_metadata(thread_id);
CREATE INDEX IF NOT EXISTS idx_analysis_metadata_source_service ON analysis_metadata(source_service);
CREATE INDEX IF NOT EXISTS idx_analysis_metadata_status ON analysis_metadata(status);
CREATE INDEX IF NOT EXISTS idx_processing_tasks_analysis_id ON processing_tasks(analysis_id);
CREATE INDEX IF NOT EXISTS idx_processing_tasks_status ON processing_tasks(status);

-- Show tables to verify creation
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%analysis%' ORDER BY table_name; 