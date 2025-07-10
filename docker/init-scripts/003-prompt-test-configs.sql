-- Create tables for storing prompt test configurations
-- REQ-009: Enhanced Prompt Testing Persistence

-- Table for storing LLM configurations for each prompt
CREATE TABLE IF NOT EXISTS prompt_llm_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    prompt_version INTEGER NOT NULL,
    provider VARCHAR(100) NOT NULL,
    model VARCHAR(200) NOT NULL,
    temperature DECIMAL(3, 2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(prompt_id, prompt_version, provider, model)
);

-- Table for storing selected test cases for each prompt version
CREATE TABLE IF NOT EXISTS prompt_test_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    prompt_version INTEGER NOT NULL,
    test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    is_selected BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(prompt_id, prompt_version, test_case_id)
);

-- Table for storing test session configurations
CREATE TABLE IF NOT EXISTS test_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    prompt_version INTEGER NOT NULL,
    enable_comparison BOOLEAN DEFAULT false,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'configured' -- configured, running, completed, failed
);

-- Table for linking LLM configs to test sessions
CREATE TABLE IF NOT EXISTS test_session_llm_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_session_id UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
    llm_config_id UUID NOT NULL REFERENCES prompt_llm_configs(id) ON DELETE CASCADE,
    execution_order INTEGER DEFAULT 0,
    UNIQUE(test_session_id, llm_config_id)
);

-- Indexes for performance
CREATE INDEX idx_prompt_llm_configs_prompt ON prompt_llm_configs(prompt_id, prompt_version);
CREATE INDEX idx_prompt_test_selections_prompt ON prompt_test_selections(prompt_id, prompt_version);
CREATE INDEX idx_test_sessions_prompt ON test_sessions(prompt_id, prompt_version);
CREATE INDEX idx_test_session_llm_configs_session ON test_session_llm_configs(test_session_id); 