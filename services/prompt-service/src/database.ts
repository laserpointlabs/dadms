import { Database, open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { LLMConfig, Prompt, PromptTestResult, TestPromptResponse } from './types';

export class PromptDatabase {
    private db: Database | null = null;

    async initialize(): Promise<void> {
        this.db = await open({
            filename: './data/prompts.db',
            driver: sqlite3.Database
        });

        await this.createTables();
    }

    private async createTables(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS prompts (
                id TEXT NOT NULL,
                name TEXT NOT NULL,
                version INTEGER NOT NULL,
                text TEXT NOT NULL,
                type TEXT NOT NULL CHECK (type IN ('simple', 'tool-aware', 'workflow-aware')),
                tool_dependencies TEXT NOT NULL DEFAULT '[]',
                workflow_dependencies TEXT NOT NULL DEFAULT '[]',
                tags TEXT NOT NULL DEFAULT '[]',
                created_by TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                metadata TEXT NOT NULL DEFAULT '{}',
                PRIMARY KEY (id, version)
            )
        `);

        await this.db.exec(`
      CREATE TABLE IF NOT EXISTS test_cases (
        id TEXT PRIMARY KEY,
        prompt_id TEXT NOT NULL,
        prompt_version INTEGER NOT NULL,
        name TEXT NOT NULL,
        input TEXT NOT NULL,
        expected_output TEXT NOT NULL,
        scoring_logic TEXT,
        enabled INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (prompt_id, prompt_version) REFERENCES prompts (id, version)
      )
    `);

        await this.db.exec(`
      CREATE TABLE IF NOT EXISTS test_results (
        id TEXT PRIMARY KEY,
        prompt_id TEXT NOT NULL,
        prompt_version INTEGER NOT NULL,
        test_case_id TEXT NOT NULL,
        test_case_name TEXT NOT NULL,
        test_input TEXT,
        passed INTEGER NOT NULL,
        actual_output TEXT,
        llm_response TEXT,
        expected_output TEXT,
        comparison_score REAL,
        error TEXT,
        execution_time_ms INTEGER NOT NULL,
        llm_provider TEXT NOT NULL,
        llm_model TEXT NOT NULL,
        llm_config TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (prompt_id, prompt_version) REFERENCES prompts (id, version),
        FOREIGN KEY (test_case_id) REFERENCES test_cases (id)
      )
    `);

        await this.db.exec(`
      CREATE TABLE IF NOT EXISTS test_executions (
        id TEXT PRIMARY KEY,
        prompt_id TEXT NOT NULL,
        prompt_version INTEGER NOT NULL,
        total_tests INTEGER NOT NULL,
        passed_tests INTEGER NOT NULL,
        failed_tests INTEGER NOT NULL,
        total_execution_time_ms INTEGER NOT NULL,
        avg_comparison_score REAL,
        llm_configs TEXT NOT NULL,
        enable_comparison INTEGER NOT NULL DEFAULT 0,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (prompt_id, prompt_version) REFERENCES prompts (id, version)
      )
    `);

        // Migration: Check if name column exists and add it if not
        await this.migrateDatabase();
    }

    private async migrateDatabase(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        try {
            // Check if name column exists
            const tableInfo = await this.db.all("PRAGMA table_info(prompts)");
            const hasNameColumn = tableInfo.some((col: any) => col.name === 'name');

            if (!hasNameColumn) {
                console.log('Adding name column to prompts table...');
                await this.db.exec('ALTER TABLE prompts ADD COLUMN name TEXT DEFAULT "Untitled Prompt"');

                // Update existing records to have a default name
                await this.db.exec(`
                    UPDATE prompts 
                    SET name = 'Prompt ' || substr(id, 1, 8)
                    WHERE name IS NULL OR name = ''
                `);

                console.log('Name column added successfully.');
            }

            // Check if test_input column exists in test_results table
            const testResultsTableInfo = await this.db.all("PRAGMA table_info(test_results)");
            const hasTestInputColumn = testResultsTableInfo.some((col: any) => col.name === 'test_input');

            if (!hasTestInputColumn) {
                console.log('Adding test_input column to test_results table...');
                await this.db.exec('ALTER TABLE test_results ADD COLUMN test_input TEXT');
                console.log('Test input column added successfully.');
            }
        } catch (error) {
            console.error('Migration error:', error);
            // If migration fails, we can continue with existing schema
        }
    }

    async createPrompt(prompt: Omit<Prompt, 'id' | 'created_at' | 'updated_at'>): Promise<Prompt> {
        if (!this.db) throw new Error('Database not initialized');

        const id = uuidv4();
        const now = new Date().toISOString();

        await this.db.run(`
      INSERT INTO prompts (id, name, version, text, type, tool_dependencies, workflow_dependencies, tags, created_by, created_at, updated_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            id,
            prompt.name,
            prompt.version,
            prompt.text,
            prompt.type,
            JSON.stringify(prompt.tool_dependencies || []),
            JSON.stringify(prompt.workflow_dependencies || []),
            JSON.stringify(prompt.tags || []),
            prompt.created_by,
            now,
            now,
            JSON.stringify(prompt.metadata || {})
        ]);

        // Insert test cases
        for (const testCase of prompt.test_cases) {
            await this.db.run(`
        INSERT INTO test_cases (id, prompt_id, prompt_version, name, input, expected_output, scoring_logic, enabled)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
                testCase.id,
                id,
                prompt.version,
                testCase.name,
                JSON.stringify(testCase.input),
                JSON.stringify(testCase.expected_output),
                testCase.scoring_logic || null,
                testCase.enabled ? 1 : 0
            ]);
        }

        const result = await this.getPromptById(id);
        if (!result) throw new Error('Failed to create prompt');
        return result;
    }

    async getPromptById(id: string): Promise<Prompt | null> {
        if (!this.db) throw new Error('Database not initialized');

        const promptRow = await this.db.get(`
            SELECT * FROM prompts 
            WHERE id = ? 
            ORDER BY version DESC 
            LIMIT 1
        `, [id]);
        if (!promptRow) return null;

        const testCases = await this.db.all(`
            SELECT * FROM test_cases 
            WHERE prompt_id = ? AND prompt_version = ?
        `, [id, promptRow.version]);

        return {
            id: promptRow.id,
            name: promptRow.name,
            version: promptRow.version,
            text: promptRow.text,
            type: promptRow.type,
            tool_dependencies: JSON.parse(promptRow.tool_dependencies || '[]'),
            workflow_dependencies: JSON.parse(promptRow.workflow_dependencies || '[]'),
            tags: JSON.parse(promptRow.tags || '[]'),
            created_by: promptRow.created_by,
            created_at: promptRow.created_at,
            updated_at: promptRow.updated_at,
            metadata: JSON.parse(promptRow.metadata || '{}'),
            test_cases: testCases.map((tc: any) => ({
                id: tc.id,
                name: tc.name,
                input: JSON.parse(tc.input),
                expected_output: JSON.parse(tc.expected_output),
                scoring_logic: tc.scoring_logic,
                enabled: tc.enabled === 1
            }))
        };
    }

    async getAllPrompts(): Promise<Prompt[]> {
        if (!this.db) throw new Error('Database not initialized');

        const prompts = await this.db.all(`
            SELECT * FROM prompts p1
            WHERE p1.version = (
                SELECT MAX(p2.version) 
                FROM prompts p2 
                WHERE p2.id = p1.id
            )
            ORDER BY p1.updated_at DESC
        `);
        const result: Prompt[] = [];

        for (const promptRow of prompts) {
            const testCases = await this.db.all(`
                SELECT * FROM test_cases 
                WHERE prompt_id = ? AND prompt_version = ?
            `, [promptRow.id, promptRow.version]);

            result.push({
                id: promptRow.id,
                name: promptRow.name,
                version: promptRow.version,
                text: promptRow.text,
                type: promptRow.type,
                tool_dependencies: JSON.parse(promptRow.tool_dependencies || '[]'),
                workflow_dependencies: JSON.parse(promptRow.workflow_dependencies || '[]'),
                tags: JSON.parse(promptRow.tags || '[]'),
                created_by: promptRow.created_by,
                created_at: promptRow.created_at,
                updated_at: promptRow.updated_at,
                metadata: JSON.parse(promptRow.metadata || '{}'),
                test_cases: testCases.map(tc => ({
                    id: tc.id,
                    name: tc.name,
                    input: JSON.parse(tc.input),
                    expected_output: JSON.parse(tc.expected_output),
                    scoring_logic: tc.scoring_logic,
                    enabled: tc.enabled === 1
                }))
            });
        }

        return result;
    }

    async updatePrompt(id: string, prompt: Partial<Prompt>): Promise<Prompt | null> {
        if (!this.db) throw new Error('Database not initialized');

        const existingPrompt = await this.getPromptById(id);
        if (!existingPrompt) {
            return null;
        }

        const newVersion = existingPrompt.version + 1;
        const now = new Date().toISOString();

        const updatedPrompt: Prompt = {
            ...existingPrompt,
            ...prompt,
            id: existingPrompt.id, // Ensure ID doesn't change
            version: newVersion,
            updated_at: now
        };

        // Insert new version record
        await this.db.run(`
            INSERT INTO prompts (id, name, version, text, type, tool_dependencies, workflow_dependencies, tags, created_by, created_at, updated_at, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            updatedPrompt.id,
            updatedPrompt.name,
            updatedPrompt.version,
            updatedPrompt.text,
            updatedPrompt.type,
            JSON.stringify(updatedPrompt.tool_dependencies || []),
            JSON.stringify(updatedPrompt.workflow_dependencies || []),
            JSON.stringify(updatedPrompt.tags || []),
            updatedPrompt.created_by,
            existingPrompt.created_at, // Keep original creation date
            updatedPrompt.updated_at,
            JSON.stringify(updatedPrompt.metadata || {})
        ]);

        // Insert test cases for the new version
        if (prompt.test_cases) {
            for (const testCase of prompt.test_cases) {
                // Generate new ID for the test case in the new version
                const newTestCaseId = uuidv4();

                await this.db.run(`
                    INSERT INTO test_cases (id, prompt_id, prompt_version, name, input, expected_output, scoring_logic, enabled)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    newTestCaseId,
                    id,
                    updatedPrompt.version,
                    testCase.name,
                    JSON.stringify(testCase.input),
                    JSON.stringify(testCase.expected_output),
                    testCase.scoring_logic || null,
                    testCase.enabled ? 1 : 0
                ]);
            }
        } else {
            // If no test cases provided, copy from previous version
            const previousTestCases = await this.db.all(`
                SELECT * FROM test_cases 
                WHERE prompt_id = ? AND prompt_version = ?
            `, [id, existingPrompt.version]);

            for (const testCase of previousTestCases) {
                // Generate new ID for the test case in the new version
                const newTestCaseId = uuidv4();

                await this.db.run(`
                    INSERT INTO test_cases (id, prompt_id, prompt_version, name, input, expected_output, scoring_logic, enabled)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    newTestCaseId,
                    id,
                    updatedPrompt.version,
                    testCase.name,
                    testCase.input,
                    testCase.expected_output,
                    testCase.scoring_logic,
                    testCase.enabled
                ]);
            }
        }

        return await this.getPromptById(id);
    }

    async updatePromptVersion(id: string, version: number, prompt: Partial<Prompt>): Promise<Prompt | null> {
        if (!this.db) throw new Error('Database not initialized');

        const existingPrompt = await this.getPromptByVersion(id, version);
        if (!existingPrompt) {
            return null;
        }

        const now = new Date().toISOString();
        const updatedPrompt: Prompt = {
            ...existingPrompt,
            ...prompt,
            id: existingPrompt.id, // Ensure ID doesn't change
            version: existingPrompt.version, // Keep the same version
            updated_at: now
        };

        // Update the existing version record
        await this.db.run(`
            UPDATE prompts 
            SET name = ?, text = ?, type = ?, tool_dependencies = ?, workflow_dependencies = ?, tags = ?, updated_at = ?, metadata = ?
            WHERE id = ? AND version = ?
        `, [
            updatedPrompt.name,
            updatedPrompt.text,
            updatedPrompt.type,
            JSON.stringify(updatedPrompt.tool_dependencies || []),
            JSON.stringify(updatedPrompt.workflow_dependencies || []),
            JSON.stringify(updatedPrompt.tags || []),
            updatedPrompt.updated_at,
            JSON.stringify(updatedPrompt.metadata || {}),
            id,
            version
        ]);

        // Update test cases for this version if provided
        if (prompt.test_cases) {
            // Delete existing test cases for this version
            await this.db.run('DELETE FROM test_cases WHERE prompt_id = ? AND prompt_version = ?', [id, version]);

            // Insert updated test cases
            for (const testCase of prompt.test_cases) {
                const newTestCaseId = uuidv4();

                await this.db.run(`
                    INSERT INTO test_cases (id, prompt_id, prompt_version, name, input, expected_output, scoring_logic, enabled)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    newTestCaseId,
                    id,
                    version,
                    testCase.name,
                    JSON.stringify(testCase.input),
                    JSON.stringify(testCase.expected_output),
                    testCase.scoring_logic || null,
                    testCase.enabled ? 1 : 0
                ]);
            }
        }

        return await this.getPromptByVersion(id, version);
    }

    async deletePrompt(id: string): Promise<boolean> {
        if (!this.db) throw new Error('Database not initialized');

        const result = await this.db.run('DELETE FROM prompts WHERE id = ?', [id]);
        return (result.changes || 0) > 0;
    }

    // Test Results Methods
    async saveTestResults(testResponse: TestPromptResponse, promptVersion: number, llmConfigs: LLMConfig[], createdBy: string): Promise<string> {
        if (!this.db) throw new Error('Database not initialized');

        const executionId = uuidv4();
        const now = new Date().toISOString();

        // Save test execution summary
        await this.db.run(`
            INSERT INTO test_executions (
                id, prompt_id, prompt_version, total_tests, passed_tests, failed_tests, 
                total_execution_time_ms, avg_comparison_score, llm_configs, enable_comparison, created_by, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            executionId,
            testResponse.prompt_id,
            promptVersion,
            testResponse.summary.total,
            testResponse.summary.passed,
            testResponse.summary.failed,
            testResponse.summary.execution_time_ms,
            testResponse.summary.avg_comparison_score || null,
            JSON.stringify(llmConfigs),
            testResponse.llm_comparisons ? 1 : 0,
            createdBy,
            now
        ]);

        // Save individual test results
        for (const result of testResponse.results) {
            const resultId = uuidv4();

            await this.db.run(`
                INSERT INTO test_results (
                    id, prompt_id, prompt_version, test_case_id, test_case_name, test_input, passed, 
                    actual_output, llm_response, expected_output, comparison_score, error, 
                    execution_time_ms, llm_provider, llm_model, llm_config, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                resultId,
                testResponse.prompt_id,
                promptVersion,
                result.test_case_id,
                result.test_case_name,
                (result as any).test_input ? JSON.stringify((result as any).test_input) : null,
                result.passed ? 1 : 0,
                result.actual_output ? JSON.stringify(result.actual_output) : null,
                result.llm_response ? JSON.stringify(result.llm_response) : null,
                result.expected_output ? JSON.stringify(result.expected_output) : null,
                result.comparison_score || null,
                result.error || null,
                result.execution_time_ms,
                result.llm_response?.provider || 'unknown',
                result.llm_response?.model || 'unknown',
                result.llm_response ? JSON.stringify({
                    provider: result.llm_response.provider,
                    model: result.llm_response.model,
                    temperature: llmConfigs.find(c => c.provider === result.llm_response?.provider)?.temperature,
                    maxTokens: llmConfigs.find(c => c.provider === result.llm_response?.provider)?.maxTokens
                }) : '{}',
                now
            ]);
        }

        return executionId;
    }

    async getTestResults(promptId: string, promptVersion?: number): Promise<TestPromptResponse | null> {
        if (!this.db) throw new Error('Database not initialized');

        // Get the most recent test execution or specific version
        const versionFilter = promptVersion ? 'AND prompt_version = ?' : '';
        const versionParam = promptVersion ? [promptId, promptVersion] : [promptId];

        const execution = await this.db.get(`
            SELECT * FROM test_executions 
            WHERE prompt_id = ? ${versionFilter}
            ORDER BY created_at DESC 
            LIMIT 1
        `, versionParam);

        if (!execution) return null;

        // Get test results for this execution
        const results = await this.db.all(`
            SELECT * FROM test_results 
            WHERE prompt_id = ? AND prompt_version = ?
            ORDER BY created_at ASC
        `, [promptId, execution.prompt_version]);

        // Get the prompt to get the current text
        const prompt = await this.getPromptById(promptId);
        if (!prompt) return null;

        // Convert database results to API format
        const testResults: PromptTestResult[] = results.map((row: any) => ({
            test_case_id: row.test_case_id,
            test_case_name: row.test_case_name,
            test_input: row.test_input ? JSON.parse(row.test_input) : undefined,
            passed: row.passed === 1,
            actual_output: row.actual_output ? JSON.parse(row.actual_output) : undefined,
            llm_response: row.llm_response ? JSON.parse(row.llm_response) : undefined,
            expected_output: row.expected_output ? JSON.parse(row.expected_output) : undefined,
            comparison_score: row.comparison_score,
            error: row.error,
            execution_time_ms: row.execution_time_ms
        }));

        return {
            prompt_id: promptId,
            prompt_text: prompt.text,
            results: testResults,
            llm_comparisons: execution.enable_comparison ? {} : undefined, // TODO: Implement if needed
            summary: {
                total: execution.total_tests,
                passed: execution.passed_tests,
                failed: execution.failed_tests,
                execution_time_ms: execution.total_execution_time_ms,
                avg_comparison_score: execution.avg_comparison_score
            }
        };
    }

    async getTestHistory(promptId: string): Promise<Array<{
        execution_id: string;
        prompt_version: number;
        created_at: string;
        total_tests: number;
        passed_tests: number;
        failed_tests: number;
        avg_comparison_score?: number;
    }>> {
        if (!this.db) throw new Error('Database not initialized');

        const executions = await this.db.all(`
            SELECT id as execution_id, prompt_version, created_at, total_tests, passed_tests, failed_tests, avg_comparison_score
            FROM test_executions 
            WHERE prompt_id = ?
            ORDER BY created_at DESC
        `, [promptId]);

        return executions;
    }

    async getAllVersions(promptId: string): Promise<Array<{
        version: number;
        created_at: string;
        updated_at: string;
        text: string;
        type: string;
        tags: string[];
    }>> {
        if (!this.db) throw new Error('Database not initialized');

        const versions = await this.db.all(`
            SELECT version, created_at, updated_at, text, type, tags
            FROM prompts 
            WHERE id = ?
            ORDER BY version DESC
        `, [promptId]);

        return versions.map((row: any) => ({
            version: row.version,
            created_at: row.created_at,
            updated_at: row.updated_at,
            text: row.text,
            type: row.type,
            tags: JSON.parse(row.tags || '[]')
        }));
    }

    async getPromptByVersion(id: string, version: number): Promise<Prompt | null> {
        if (!this.db) throw new Error('Database not initialized');

        const promptRow = await this.db.get(`
            SELECT * FROM prompts 
            WHERE id = ? AND version = ?
        `, [id, version]);

        if (!promptRow) return null;

        const testCases = await this.db.all(`
            SELECT * FROM test_cases 
            WHERE prompt_id = ? AND prompt_version = ?
        `, [id, version]);

        return {
            id: promptRow.id,
            name: promptRow.name,
            version: promptRow.version,
            text: promptRow.text,
            type: promptRow.type,
            tool_dependencies: JSON.parse(promptRow.tool_dependencies || '[]'),
            workflow_dependencies: JSON.parse(promptRow.workflow_dependencies || '[]'),
            tags: JSON.parse(promptRow.tags || '[]'),
            created_by: promptRow.created_by,
            created_at: promptRow.created_at,
            updated_at: promptRow.updated_at,
            metadata: JSON.parse(promptRow.metadata || '{}'),
            test_cases: testCases.map((tc: any) => ({
                id: tc.id,
                name: tc.name,
                input: JSON.parse(tc.input),
                expected_output: JSON.parse(tc.expected_output),
                scoring_logic: tc.scoring_logic,
                enabled: tc.enabled === 1
            }))
        };
    }

    async close(): Promise<void> {
        if (this.db) {
            await this.db.close();
        }
    }
} 