-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ontology Workspaces table
CREATE TABLE IF NOT EXISTS ontology_workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_id UUID NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    settings JSONB DEFAULT '{
        "auto_save_enabled": true,
        "auto_layout_enabled": false,
        "validation_on_save": true,
        "default_reasoner": "hermit",
        "color_scheme": "auto",
        "grid_enabled": true,
        "snap_to_grid": false
    }'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT workspace_name_unique_per_project UNIQUE (project_id, name)
);

-- Ontology Documents table
CREATE TABLE IF NOT EXISTS ontology_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    iri VARCHAR(512),
    format VARCHAR(50) NOT NULL CHECK (format IN ('owl_xml', 'turtle', 'rdf_xml', 'json_ld', 'n_triples', 'n_quads', 'robot')),
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    version VARCHAR(50) DEFAULT '1.0.0',
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'validating', 'valid', 'invalid', 'publishing', 'published')),
    visual_layout JSONB DEFAULT '{
        "elements": [],
        "layout_algorithm": "hierarchical",
        "viewport": {"zoom": 1.0, "center": {"x": 400, "y": 300}},
        "groups": []
    }'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_ontology_workspace FOREIGN KEY (workspace_id) REFERENCES ontology_workspaces(id) ON DELETE CASCADE,
    
    -- Unique constraint for names within workspace
    CONSTRAINT ontology_name_unique_per_workspace UNIQUE (workspace_id, name)
);

-- Comments table for collaboration
CREATE TABLE IF NOT EXISTS ontology_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    content TEXT NOT NULL,
    element_iri VARCHAR(512),
    parent_comment_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_comment_workspace FOREIGN KEY (workspace_id) REFERENCES ontology_workspaces(id) ON DELETE CASCADE,
    CONSTRAINT fk_parent_comment FOREIGN KEY (parent_comment_id) REFERENCES ontology_comments(id) ON DELETE CASCADE
);

-- Discussions table
CREATE TABLE IF NOT EXISTS ontology_discussions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'resolved')),
    element_iri VARCHAR(512),
    participants JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_discussion_workspace FOREIGN KEY (workspace_id) REFERENCES ontology_workspaces(id) ON DELETE CASCADE
);

-- Validation History table
CREATE TABLE IF NOT EXISTS ontology_validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ontology_id UUID NOT NULL,
    reasoner_used VARCHAR(50) NOT NULL,
    is_valid BOOLEAN NOT NULL,
    validation_result JSONB NOT NULL,
    error_count INTEGER DEFAULT 0,
    warning_count INTEGER DEFAULT 0,
    timestamp TIMESTAMP DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_validation_ontology FOREIGN KEY (ontology_id) REFERENCES ontology_documents(id) ON DELETE CASCADE
);

-- Change History table for tracking modifications
CREATE TABLE IF NOT EXISTS ontology_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL,
    ontology_id UUID,
    user_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'move', 'style_change')),
    element_id VARCHAR(512),
    before_state JSONB,
    after_state JSONB,
    description TEXT,
    timestamp TIMESTAMP DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_change_workspace FOREIGN KEY (workspace_id) REFERENCES ontology_workspaces(id) ON DELETE CASCADE,
    CONSTRAINT fk_change_ontology FOREIGN KEY (ontology_id) REFERENCES ontology_documents(id) ON DELETE CASCADE
);

-- Active Sessions table for real-time collaboration
CREATE TABLE IF NOT EXISTS active_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    joined_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP DEFAULT NOW(),
    cursor_position JSONB,
    current_element VARCHAR(512),
    
    -- Foreign key constraints
    CONSTRAINT fk_session_workspace FOREIGN KEY (workspace_id) REFERENCES ontology_workspaces(id) ON DELETE CASCADE,
    
    -- Unique active session per user per workspace
    CONSTRAINT active_session_unique UNIQUE (workspace_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workspaces_project_id ON ontology_workspaces(project_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_created_by ON ontology_workspaces(created_by);
CREATE INDEX IF NOT EXISTS idx_workspaces_created_at ON ontology_workspaces(created_at);

CREATE INDEX IF NOT EXISTS idx_ontologies_workspace_id ON ontology_documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ontologies_status ON ontology_documents(status);
CREATE INDEX IF NOT EXISTS idx_ontologies_format ON ontology_documents(format);
CREATE INDEX IF NOT EXISTS idx_ontologies_iri ON ontology_documents(iri);

CREATE INDEX IF NOT EXISTS idx_comments_workspace_id ON ontology_comments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_comments_element_iri ON ontology_comments(element_iri);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON ontology_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_discussions_workspace_id ON ontology_discussions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_discussions_status ON ontology_discussions(status);

CREATE INDEX IF NOT EXISTS idx_validations_ontology_id ON ontology_validations(ontology_id);
CREATE INDEX IF NOT EXISTS idx_validations_timestamp ON ontology_validations(timestamp);

CREATE INDEX IF NOT EXISTS idx_changes_workspace_id ON ontology_changes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_changes_ontology_id ON ontology_changes(ontology_id);
CREATE INDEX IF NOT EXISTS idx_changes_timestamp ON ontology_changes(timestamp);

CREATE INDEX IF NOT EXISTS idx_sessions_workspace_id ON active_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON active_sessions(last_active);

-- Update trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to relevant tables
DROP TRIGGER IF EXISTS update_workspaces_updated_at ON ontology_workspaces;
CREATE TRIGGER update_workspaces_updated_at 
    BEFORE UPDATE ON ontology_workspaces 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ontologies_updated_at ON ontology_documents;
CREATE TRIGGER update_ontologies_updated_at 
    BEFORE UPDATE ON ontology_documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON ontology_comments;
CREATE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON ontology_comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_discussions_updated_at ON ontology_discussions;
CREATE TRIGGER update_discussions_updated_at 
    BEFORE UPDATE ON ontology_discussions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to cleanup old sessions (call periodically)
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions(inactive_threshold INTERVAL DEFAULT '1 hour')
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM active_sessions 
    WHERE last_active < (NOW() - inactive_threshold);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for development
INSERT INTO ontology_workspaces (name, description, project_id, created_by) VALUES 
    ('Sample Ontology Workspace', 'Example workspace for testing ontology features', 
     '456e7890-e12b-34d5-a678-901234567000', 'admin@dadms.com')
ON CONFLICT (project_id, name) DO NOTHING; 