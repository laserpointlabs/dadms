-- PostgreSQL Database Initialization Script for Consolidated DADM Database
-- This script creates the unified DADM database with multi-tenant schema support
-- Version: 1.0 - REQ-004 Implementation

-- Create consolidated DADM database
CREATE DATABASE dadm_db OWNER dadm_user;
GRANT ALL PRIVILEGES ON DATABASE dadm_db TO dadm_user;

-- Connect to DADM database for schema creation
\c dadm_db;

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO dadm_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dadm_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dadm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dadm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dadm_user;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- MULTI-TENANT HIERARCHY TABLES (REQ-005 Preparation)
-- =============================================================================

-- Companies table (root of hierarchy)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settings JSONB DEFAULT '{}'::jsonb
);

-- Tenants table (isolated organizational units)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL, -- URL-friendly identifier
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settings JSONB DEFAULT '{}'::jsonb,
    UNIQUE(company_id, slug)
);

-- Teams table (functional working groups)
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table (scoped work initiatives)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active', -- active, archived, completed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Decisions table (decision tracking and artifacts)
CREATE TABLE IF NOT EXISTS decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'open', -- open, in_progress, decided, deferred
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- AUTHENTICATION TABLES (REQ-011 Preparation - Design Only, Not Enforced)
-- =============================================================================

-- Users table (placeholder for future auth implementation)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(255) UNIQUE,
    username VARCHAR(255) UNIQUE,
    email VARCHAR(255),
    display_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP NULL
);

-- User roles table (placeholder for future RBAC)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- company, tenant, team, project, decision
    entity_id UUID NOT NULL,
    role VARCHAR(100) NOT NULL, -- admin, member, viewer, contributor
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    active BOOLEAN DEFAULT true
);

-- =============================================================================
-- ANALYSIS DATA TABLES (Migrated from SQLite)
-- =============================================================================

-- Analysis metadata table
CREATE TABLE IF NOT EXISTS analysis_metadata (
    analysis_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id), -- Added for multi-tenancy
    thread_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255),
    process_instance_id VARCHAR(255),
    task_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),
    tags JSONB DEFAULT '[]'::jsonb,
    source_service VARCHAR(255)
);

-- Analysis data table
CREATE TABLE IF NOT EXISTS analysis_data (
    analysis_id UUID PRIMARY KEY REFERENCES analysis_metadata(analysis_id) ON DELETE CASCADE,
    input_data JSONB,
    output_data JSONB,
    raw_response TEXT,
    processing_log JSONB DEFAULT '[]'::jsonb
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
    metadata JSONB
);

-- =============================================================================
-- PROMPT SERVICE TABLES (Migrated from SQLite)
-- =============================================================================

-- Prompts table
CREATE TABLE IF NOT EXISTS prompts (
    id UUID NOT NULL,
    tenant_id UUID REFERENCES tenants(id), -- Added for multi-tenancy
    version INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('simple', 'tool-aware', 'workflow-aware')),
    tool_dependencies JSONB DEFAULT '[]'::jsonb,
    workflow_dependencies JSONB DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    PRIMARY KEY (id, version)
);

-- Test cases table
CREATE TABLE IF NOT EXISTS test_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID NOT NULL,
    prompt_version INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    scoring_logic TEXT,
    enabled BOOLEAN DEFAULT true,
    FOREIGN KEY (prompt_id, prompt_version) REFERENCES prompts (id, version) ON DELETE CASCADE
);

-- Test results table
CREATE TABLE IF NOT EXISTS test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id), -- Added for multi-tenancy
    test_case_id UUID REFERENCES test_cases(id) ON DELETE CASCADE,
    prompt_id UUID NOT NULL,
    prompt_version INTEGER NOT NULL,
    execution_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actual_output TEXT NOT NULL,
    score DECIMAL(5,2),
    passed BOOLEAN NOT NULL,
    llm_config JSONB NOT NULL,
    error_message TEXT,
    FOREIGN KEY (prompt_id, prompt_version) REFERENCES prompts (id, version)
);

-- =============================================================================
-- DATA GOVERNANCE TABLES (Migrated from SQLite)
-- =============================================================================

-- Data policies table
CREATE TABLE IF NOT EXISTS data_policies (
    policy_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id), -- Added for multi-tenancy
    name VARCHAR(255) NOT NULL,
    description TEXT,
    classification VARCHAR(50) NOT NULL,
    retention_days INTEGER,
    encryption_required BOOLEAN DEFAULT FALSE,
    access_controls JSONB,
    quality_thresholds JSONB,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

-- Data lineage table
CREATE TABLE IF NOT EXISTS data_lineage (
    lineage_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_id VARCHAR(255) NOT NULL,
    source_data_ids JSONB,
    transformation_type VARCHAR(255),
    transformation_details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id UUID REFERENCES users(id)
);

-- Quality metrics table
CREATE TABLE IF NOT EXISTS quality_metrics (
    data_id VARCHAR(255) PRIMARY KEY,
    completeness DECIMAL(5,2),
    accuracy DECIMAL(5,2),
    consistency DECIMAL(5,2),
    timeliness DECIMAL(5,2),
    validity DECIMAL(5,2),
    overall_score DECIMAL(5,2),
    quality_level VARCHAR(50),
    issues JSONB,
    measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Multi-tenant indexes
CREATE INDEX idx_tenants_company_id ON tenants(company_id);
CREATE INDEX idx_teams_tenant_id ON teams(tenant_id);
CREATE INDEX idx_projects_team_id ON projects(team_id);
CREATE INDEX idx_decisions_project_id ON decisions(project_id);

-- Analysis indexes
CREATE INDEX idx_analysis_metadata_thread_id ON analysis_metadata(thread_id);
CREATE INDEX idx_analysis_metadata_session_id ON analysis_metadata(session_id);
CREATE INDEX idx_analysis_metadata_process_instance_id ON analysis_metadata(process_instance_id);
CREATE INDEX idx_analysis_metadata_tenant_id ON analysis_metadata(tenant_id);
CREATE INDEX idx_processing_tasks_analysis_id ON processing_tasks(analysis_id);
CREATE INDEX idx_processing_tasks_status ON processing_tasks(status);

-- Prompt indexes
CREATE INDEX idx_prompts_tenant_id ON prompts(tenant_id);
CREATE INDEX idx_prompts_name ON prompts(name);
CREATE INDEX idx_prompts_type ON prompts(type);
CREATE INDEX idx_test_results_tenant_id ON test_results(tenant_id);

-- Governance indexes
CREATE INDEX idx_data_policies_tenant_id ON data_policies(tenant_id);
CREATE INDEX idx_data_policies_classification ON data_policies(classification);

-- =============================================================================
-- DEFAULT DATA FOR DEVELOPMENT
-- =============================================================================

-- Create default company
INSERT INTO companies (id, name, description) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Company', 'Default company for development')
ON CONFLICT DO NOTHING;

-- Create default tenant
INSERT INTO tenants (id, company_id, name, slug, description)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Default Tenant',
    'default-tenant',
    'Default tenant for development - all existing data will be migrated here'
)
ON CONFLICT DO NOTHING;

-- Return to default database
\c postgres;

SELECT 'DADM consolidated database initialization completed successfully!' as status; 