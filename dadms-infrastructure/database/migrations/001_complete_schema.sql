-- DADMS 2.0 Complete Database Schema Migration
-- Migration: 001_complete_schema.sql
-- Description: Complete database schema for DADMS 2.0 with all services
-- Date: 2025-01-15

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For GIN indexes

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users and Authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    avatar_url VARCHAR(500),
    preferences JSONB DEFAULT '{}',
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects (enhanced)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),
    knowledge_domain VARCHAR(100),
    decision_context TEXT,
    settings JSONB DEFAULT '{
        "default_llm": "openai/gpt-4",
        "personas": [],
        "tools_enabled": ["rag_search", "web_search", "file_upload"],
        "theme": "dark",
        "notifications": true
    }'::jsonb,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Project Team Members
CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    permissions TEXT[] DEFAULT '{}',
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- ============================================================================
-- KNOWLEDGE SERVICE TABLES
-- ============================================================================

-- Knowledge Domains
CREATE TABLE IF NOT EXISTS knowledge_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES knowledge_domains(id) ON DELETE CASCADE,
    project_ids UUID[] DEFAULT '{}',
    color VARCHAR(7) DEFAULT '#007acc',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge Tags
CREATE TABLE IF NOT EXISTS knowledge_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    domain_ids UUID[] DEFAULT '{}',
    color VARCHAR(7) DEFAULT '#6e7681',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    domain_ids UUID[] DEFAULT '{}',
    tag_ids UUID[] DEFAULT '{}',
    file_info JSONB DEFAULT '{}', -- {originalName, mimeType, size, url}
    content TEXT, -- Extracted text content
    processing JSONB DEFAULT '{
        "status": "pending",
        "extractedText": null,
        "embeddings": false,
        "processedAt": null,
        "error": null
    }'::jsonb,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Document Embeddings (for vector search)
CREATE TABLE IF NOT EXISTS document_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding_vector REAL[], -- Will be stored in Qdrant, this is for reference
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(document_id, chunk_index)
);

-- ============================================================================
-- LLM SERVICE TABLES
-- ============================================================================

-- LLM Providers
CREATE TABLE IF NOT EXISTS llm_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    api_base_url VARCHAR(500),
    api_key_required BOOLEAN DEFAULT true,
    models JSONB DEFAULT '[]',
    capabilities TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- LLM Interactions
CREATE TABLE IF NOT EXISTS llm_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT,
    system_prompt TEXT,
    messages JSONB DEFAULT '[]',
    tokens_used INTEGER,
    cost DECIMAL(10,6),
    duration_ms INTEGER,
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- LLM Templates
CREATE TABLE IF NOT EXISTS llm_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type VARCHAR(50) DEFAULT 'prompt' CHECK (template_type IN ('prompt', 'system', 'function')),
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PROCESS MANAGEMENT TABLES
-- ============================================================================

-- Process Definitions
CREATE TABLE IF NOT EXISTS process_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    bpmn_xml TEXT NOT NULL,
    version VARCHAR(50) DEFAULT '1.0',
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Process Instances
CREATE TABLE IF NOT EXISTS process_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_definition_id UUID NOT NULL REFERENCES process_definitions(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    business_key VARCHAR(255),
    status VARCHAR(50) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled', 'suspended')),
    variables JSONB DEFAULT '{}',
    started_by UUID REFERENCES users(id) ON DELETE SET NULL,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    duration_ms INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User Tasks
CREATE TABLE IF NOT EXISTS user_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_instance_id UUID NOT NULL REFERENCES process_instances(id) ON DELETE CASCADE,
    process_definition_key VARCHAR(255),
    task_definition_key VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'cancelled')),
    priority INTEGER DEFAULT 0,
    due_date TIMESTAMP,
    variables JSONB DEFAULT '{}',
    form_key VARCHAR(255),
    comments JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- ONTOLOGY WORKSPACE TABLES
-- ============================================================================

-- Ontology Entities
CREATE TABLE IF NOT EXISTS ontology_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    properties JSONB DEFAULT '{}',
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    color VARCHAR(7) DEFAULT '#007acc',
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Ontology Relationships
CREATE TABLE IF NOT EXISTS ontology_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_entity_id UUID NOT NULL REFERENCES ontology_entities(id) ON DELETE CASCADE,
    target_entity_id UUID NOT NULL REFERENCES ontology_entities(id) ON DELETE CASCADE,
    relationship_type VARCHAR(100) NOT NULL,
    label VARCHAR(255),
    properties JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- MODEL MANAGEMENT TABLES
-- ============================================================================

-- Models
CREATE TABLE IF NOT EXISTS models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    model_type VARCHAR(100) NOT NULL CHECK (model_type IN ('ml', 'simulation', 'physics', 'mission')),
    version VARCHAR(50) DEFAULT '1.0',
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived', 'deprecated')),
    file_path VARCHAR(500),
    file_size BIGINT,
    metadata JSONB DEFAULT '{}',
    parameters JSONB DEFAULT '{}',
    dependencies JSONB DEFAULT '[]',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Model Executions
CREATE TABLE IF NOT EXISTS model_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    execution_time_ms INTEGER,
    error_message TEXT,
    started_by UUID REFERENCES users(id) ON DELETE SET NULL,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- SIMULATION MANAGEMENT TABLES
-- ============================================================================

-- Simulations
CREATE TABLE IF NOT EXISTS simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    simulation_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'failed', 'cancelled')),
    configuration JSONB DEFAULT '{}',
    results JSONB DEFAULT '{}',
    execution_time_ms INTEGER,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- ANALYSIS MANAGEMENT TABLES
-- ============================================================================

-- Analyses
CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    analysis_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    input_data JSONB DEFAULT '{}',
    results JSONB DEFAULT '{}',
    visualizations JSONB DEFAULT '[]',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CONTEXT MANAGEMENT TABLES
-- ============================================================================

-- Personas
CREATE TABLE IF NOT EXISTS personas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    personality TEXT NOT NULL,
    expertise TEXT[] DEFAULT '{}',
    constraints TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Teams
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    personas JSONB DEFAULT '[]',
    decision_protocol TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tools
CREATE TABLE IF NOT EXISTS tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tool_type VARCHAR(100) NOT NULL,
    configuration JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- EVENT MANAGEMENT TABLES
-- ============================================================================

-- Events
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}',
    source_service VARCHAR(100),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Event Subscriptions
CREATE TABLE IF NOT EXISTS event_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_types TEXT[] DEFAULT '{}',
    webhook_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- MEMORY MANAGEMENT TABLES
-- ============================================================================

-- Memory Entries
CREATE TABLE IF NOT EXISTS memory_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    memory_type VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    importance_score DECIMAL(3,2) DEFAULT 0.5,
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- ERROR MANAGEMENT TABLES
-- ============================================================================

-- Errors
CREATE TABLE IF NOT EXISTS errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    context JSONB DEFAULT '{}',
    severity VARCHAR(20) DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'closed')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_knowledge_domain ON projects(knowledge_domain);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_tags ON projects USING GIN(tags);

-- Project members indexes
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_role ON project_members(role);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON documents((processing->>'status'));
CREATE INDEX IF NOT EXISTS idx_documents_domain_ids ON documents USING GIN(domain_ids);
CREATE INDEX IF NOT EXISTS idx_documents_tag_ids ON documents USING GIN(tag_ids);
CREATE INDEX IF NOT EXISTS idx_documents_content ON documents USING GIN(to_tsvector('english', content));

-- LLM interactions indexes
CREATE INDEX IF NOT EXISTS idx_llm_interactions_project_id ON llm_interactions(project_id);
CREATE INDEX IF NOT EXISTS idx_llm_interactions_user_id ON llm_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_interactions_provider ON llm_interactions(provider);
CREATE INDEX IF NOT EXISTS idx_llm_interactions_created_at ON llm_interactions(created_at);

-- Process indexes
CREATE INDEX IF NOT EXISTS idx_process_definitions_project_id ON process_definitions(project_id);
CREATE INDEX IF NOT EXISTS idx_process_definitions_status ON process_definitions(status);
CREATE INDEX IF NOT EXISTS idx_process_instances_project_id ON process_instances(project_id);
CREATE INDEX IF NOT EXISTS idx_process_instances_status ON process_instances(status);
CREATE INDEX IF NOT EXISTS idx_user_tasks_process_instance_id ON user_tasks(process_instance_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_assignee_id ON user_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_status ON user_tasks(status);

-- Ontology indexes
CREATE INDEX IF NOT EXISTS idx_ontology_entities_project_id ON ontology_entities(project_id);
CREATE INDEX IF NOT EXISTS idx_ontology_entities_type ON ontology_entities(type);
CREATE INDEX IF NOT EXISTS idx_ontology_relationships_project_id ON ontology_relationships(project_id);
CREATE INDEX IF NOT EXISTS idx_ontology_relationships_source ON ontology_relationships(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_ontology_relationships_target ON ontology_relationships(target_entity_id);

-- Model indexes
CREATE INDEX IF NOT EXISTS idx_models_project_id ON models(project_id);
CREATE INDEX IF NOT EXISTS idx_models_type ON models(model_type);
CREATE INDEX IF NOT EXISTS idx_models_status ON models(status);
CREATE INDEX IF NOT EXISTS idx_model_executions_model_id ON model_executions(model_id);
CREATE INDEX IF NOT EXISTS idx_model_executions_status ON model_executions(status);

-- Event indexes
CREATE INDEX IF NOT EXISTS idx_events_project_id ON events(project_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

-- Error indexes
CREATE INDEX IF NOT EXISTS idx_errors_project_id ON errors(project_id);
CREATE INDEX IF NOT EXISTS idx_errors_severity ON errors(severity);
CREATE INDEX IF NOT EXISTS idx_errors_status ON errors(status);
CREATE INDEX IF NOT EXISTS idx_errors_created_at ON errors(created_at);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'users', 'projects', 'knowledge_domains', 'knowledge_tags', 
            'documents', 'llm_providers', 'llm_templates', 'process_definitions',
            'process_instances', 'user_tasks', 'ontology_entities', 'ontology_relationships',
            'models', 'simulations', 'analyses', 'personas', 'teams', 'tools',
            'event_subscriptions', 'memory_entries', 'errors'
        )
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%s_updated_at ON %s;
            CREATE TRIGGER update_%s_updated_at 
                BEFORE UPDATE ON %s 
                FOR EACH ROW 
                EXECUTE FUNCTION update_updated_at_column();
        ', table_name, table_name, table_name, table_name);
    END LOOP;
END $$;

-- ============================================================================
-- SAMPLE DATA FOR DEVELOPMENT
-- ============================================================================

-- Insert sample users
INSERT INTO users (email, name, password_hash, role) VALUES 
    ('admin@dadms.com', 'DADMS Administrator', '$2b$10$placeholder_hash_for_development', 'admin'),
    ('user@dadms.com', 'Demo User', '$2b$10$placeholder_hash_for_development', 'user'),
    ('viewer@dadms.com', 'Demo Viewer', '$2b$10$placeholder_hash_for_development', 'viewer')
ON CONFLICT (email) DO NOTHING;

-- Insert sample projects
INSERT INTO projects (name, description, owner_id, knowledge_domain, decision_context) VALUES 
    ('Sample Decision Project', 'Example project for testing DADMS functionality', 
     (SELECT id FROM users WHERE email = 'admin@dadms.com'), 
     'business_strategy', 'Strategic decision making for business growth'),
    ('AI Implementation Strategy', 'Decision analysis for AI tool adoption', 
     (SELECT id FROM users WHERE email = 'user@dadms.com'), 
     'technology', 'Evaluating AI tools for enterprise adoption'),
    ('Risk Assessment Framework', 'Comprehensive risk analysis and mitigation', 
     (SELECT id FROM users WHERE email = 'admin@dadms.com'), 
     'risk_management', 'Developing risk assessment methodologies')
ON CONFLICT DO NOTHING;

-- Insert sample knowledge domains
INSERT INTO knowledge_domains (name, description, color) VALUES 
    ('Business Strategy', 'Strategic planning and business development', '#007acc'),
    ('Technology', 'Technology evaluation and implementation', '#4caf50'),
    ('Risk Management', 'Risk assessment and mitigation strategies', '#ff9800'),
    ('Finance', 'Financial analysis and planning', '#9c27b0')
ON CONFLICT DO NOTHING;

-- Insert sample LLM providers
INSERT INTO llm_providers (name, display_name, api_base_url, models, capabilities) VALUES 
    ('openai', 'OpenAI', 'https://api.openai.com/v1', 
     '["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"]'::jsonb,
     '["chat", "completion", "embeddings"]'),
    ('anthropic', 'Anthropic', 'https://api.anthropic.com', 
     '["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"]'::jsonb,
     '["chat", "completion"]'),
    ('ollama', 'Ollama (Local)', 'http://localhost:11434', 
     '["llama2", "mistral", "codellama"]'::jsonb,
     '["chat", "completion"]')
ON CONFLICT (name) DO NOTHING;

-- Insert sample personas
INSERT INTO personas (name, description, personality, expertise, project_id) VALUES 
    ('Strategic Advisor', 'Expert in business strategy and planning', 
     'Analytical, strategic thinker with deep business acumen. Focuses on long-term planning and competitive analysis.',
     '["business_strategy", "market_analysis", "competitive_intelligence"]',
     (SELECT id FROM projects WHERE name = 'Sample Decision Project')),
    ('Technology Expert', 'Specialist in technology evaluation and implementation',
     'Technical expert with practical experience in AI and enterprise systems. Pragmatic approach to technology adoption.',
     '["ai_technology", "enterprise_architecture", "system_integration"]',
     (SELECT id FROM projects WHERE name = 'AI Implementation Strategy'))
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETION
-- ============================================================================

-- Create migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT NOW()
);

-- Record this migration
INSERT INTO migrations (name) VALUES ('001_complete_schema.sql')
ON CONFLICT (name) DO NOTHING;

-- Verify installation
SELECT 'DADMS 2.0 Complete Database Schema Migration Applied Successfully' as status; 