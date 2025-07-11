import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { LLMConfig, Prompt, PromptTestResult } from './types';

export class PostgresPromptDatabase {
    private pool: Pool;

    constructor() {
        // Use environment variables for configuration
        this.pool = new Pool({
            host: process.env.POSTGRES_HOST || 'localhost',
            port: parseInt(process.env.POSTGRES_PORT || '5432'),
            database: process.env.POSTGRES_DB || 'dadm_db',
            user: process.env.POSTGRES_USER || 'dadm_user',
            password: process.env.POSTGRES_PASSWORD || 'dadm_password',
        });
    }

    async initialize(): Promise<void> {
        try {
            // Test connection
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            console.log('PostgreSQL database connected successfully');
        } catch (error) {
            console.error('Failed to connect to PostgreSQL:', error);
            throw error;
        }
    }

    async createPrompt(prompt: Omit<Prompt, 'id' | 'created_at' | 'updated_at'>): Promise<Prompt> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const id = uuidv4();
            const now = new Date().toISOString();
            const tenantId = '00000000-0000-0000-0000-000000000002'; // Default tenant for now

            // Insert prompt
            const promptResult = await client.query(`
                INSERT INTO prompts (id, tenant_id, version, name, text, type, tool_dependencies, 
                                   workflow_dependencies, tags, created_by, created_at, updated_at, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING *
            `, [
                id,
                tenantId,
                prompt.version,
                prompt.name,
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
                await client.query(`
                    INSERT INTO test_cases (id, prompt_id, prompt_version, name, input, 
                                          expected_output, scoring_logic, enabled)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [
                    testCase.id,
                    id,
                    prompt.version,
                    testCase.name,
                    JSON.stringify(testCase.input),
                    JSON.stringify(testCase.expected_output),
                    testCase.scoring_logic || null,
                    testCase.enabled
                ]);
            }

            await client.query('COMMIT');

            const result = await this.getPromptById(id);
            if (!result) throw new Error('Failed to create prompt');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getPromptById(id: string): Promise<Prompt | null> {
        const promptResult = await this.pool.query(`
            SELECT * FROM prompts 
            WHERE id = $1 
            ORDER BY version DESC 
            LIMIT 1
        `, [id]);

        if (promptResult.rows.length === 0) return null;

        const promptRow = promptResult.rows[0];
        const testCasesResult = await this.pool.query(`
            SELECT * FROM test_cases 
            WHERE prompt_id = $1 AND prompt_version = $2
        `, [id, promptRow.version]);

        return {
            id: promptRow.id,
            name: promptRow.name,
            version: promptRow.version,
            text: promptRow.text,
            type: promptRow.type,
            tool_dependencies: typeof promptRow.tool_dependencies === 'string'
                ? JSON.parse(promptRow.tool_dependencies)
                : promptRow.tool_dependencies,
            workflow_dependencies: typeof promptRow.workflow_dependencies === 'string'
                ? JSON.parse(promptRow.workflow_dependencies)
                : promptRow.workflow_dependencies,
            tags: typeof promptRow.tags === 'string'
                ? JSON.parse(promptRow.tags)
                : promptRow.tags,
            created_by: promptRow.created_by,
            created_at: promptRow.created_at,
            updated_at: promptRow.updated_at,
            metadata: typeof promptRow.metadata === 'string'
                ? JSON.parse(promptRow.metadata)
                : promptRow.metadata,
            test_cases: testCasesResult.rows.map((tc: any) => ({
                id: tc.id,
                name: tc.name,
                input: typeof tc.input === 'string' ? JSON.parse(tc.input) : tc.input,
                expected_output: typeof tc.expected_output === 'string'
                    ? JSON.parse(tc.expected_output)
                    : tc.expected_output,
                scoring_logic: tc.scoring_logic,
                enabled: tc.enabled
            }))
        };
    }

    async getAllPrompts(): Promise<Prompt[]> {
        const promptsResult = await this.pool.query(`
            SELECT * FROM prompts p1
            WHERE p1.version = (
                SELECT MAX(p2.version) 
                FROM prompts p2 
                WHERE p2.id = p1.id
            )
            ORDER BY p1.updated_at DESC
        `);

        const prompts: Prompt[] = [];

        for (const promptRow of promptsResult.rows) {
            const testCasesResult = await this.pool.query(`
                SELECT * FROM test_cases 
                WHERE prompt_id = $1 AND prompt_version = $2
            `, [promptRow.id, promptRow.version]);

            prompts.push({
                id: promptRow.id,
                name: promptRow.name,
                version: promptRow.version,
                text: promptRow.text,
                type: promptRow.type,
                tool_dependencies: typeof promptRow.tool_dependencies === 'string'
                    ? JSON.parse(promptRow.tool_dependencies)
                    : promptRow.tool_dependencies,
                workflow_dependencies: typeof promptRow.workflow_dependencies === 'string'
                    ? JSON.parse(promptRow.workflow_dependencies)
                    : promptRow.workflow_dependencies,
                tags: typeof promptRow.tags === 'string'
                    ? JSON.parse(promptRow.tags)
                    : promptRow.tags,
                created_by: promptRow.created_by,
                created_at: promptRow.created_at,
                updated_at: promptRow.updated_at,
                metadata: typeof promptRow.metadata === 'string'
                    ? JSON.parse(promptRow.metadata)
                    : promptRow.metadata,
                test_cases: testCasesResult.rows.map(tc => ({
                    id: tc.id,
                    name: tc.name,
                    input: typeof tc.input === 'string' ? JSON.parse(tc.input) : tc.input,
                    expected_output: typeof tc.expected_output === 'string'
                        ? JSON.parse(tc.expected_output)
                        : tc.expected_output,
                    scoring_logic: tc.scoring_logic,
                    enabled: tc.enabled
                }))
            });
        }

        return prompts;
    }

    async updatePrompt(id: string, prompt: Partial<Prompt>): Promise<Prompt | null> {
        const existingPrompt = await this.getPromptById(id);
        if (!existingPrompt) {
            return null;
        }

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const newVersion = existingPrompt.version + 1;
            const now = new Date().toISOString();
            const tenantId = '00000000-0000-0000-0000-000000000002'; // Default tenant

            const updatedPrompt: Prompt = {
                ...existingPrompt,
                ...prompt,
                id: existingPrompt.id,
                version: newVersion,
                updated_at: now
            };

            // Insert new version
            await client.query(`
                INSERT INTO prompts (id, tenant_id, version, name, text, type, tool_dependencies, 
                                   workflow_dependencies, tags, created_by, created_at, updated_at, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            `, [
                updatedPrompt.id,
                tenantId,
                updatedPrompt.version,
                updatedPrompt.name,
                updatedPrompt.text,
                updatedPrompt.type,
                JSON.stringify(updatedPrompt.tool_dependencies || []),
                JSON.stringify(updatedPrompt.workflow_dependencies || []),
                JSON.stringify(updatedPrompt.tags || []),
                updatedPrompt.created_by,
                existingPrompt.created_at,
                updatedPrompt.updated_at,
                JSON.stringify(updatedPrompt.metadata || {})
            ]);

            // Insert test cases for new version with new IDs
            for (const testCase of updatedPrompt.test_cases) {
                // Generate new ID for test case in new version
                const newTestCaseId = uuidv4();
                await client.query(`
                    INSERT INTO test_cases (id, prompt_id, prompt_version, name, input, 
                                          expected_output, scoring_logic, enabled)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [
                    newTestCaseId,
                    updatedPrompt.id,
                    updatedPrompt.version,
                    testCase.name,
                    JSON.stringify(testCase.input),
                    JSON.stringify(testCase.expected_output),
                    testCase.scoring_logic || null,
                    testCase.enabled
                ]);
            }

            await client.query('COMMIT');
            return updatedPrompt;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async deletePrompt(id: string): Promise<boolean> {
        const result = await this.pool.query('DELETE FROM prompts WHERE id = $1', [id]);
        return (result.rowCount ?? 0) > 0;
    }

    async deletePromptVersion(id: string, version: number): Promise<boolean> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Check how many versions exist
            const versionCount = await client.query(
                'SELECT COUNT(DISTINCT version) as count FROM prompts WHERE id = $1::uuid',
                [id]
            );

            const count = parseInt(versionCount.rows[0].count);

            if (count === 0) {
                // Prompt doesn't exist
                await client.query('ROLLBACK');
                return false;
            }

            if (count <= 1) {
                // If only one version exists, delete the entire prompt
                // First delete related data
                await client.query('DELETE FROM test_cases WHERE prompt_id = $1::uuid', [id]);
                await client.query('DELETE FROM test_results WHERE prompt_id = $1::uuid', [id]);
                await client.query('DELETE FROM prompt_llm_configs WHERE prompt_id = $1::uuid', [id]);
                await client.query('DELETE FROM prompt_test_selections WHERE prompt_id = $1::uuid', [id]);

                // Then delete the prompt
                const deleteResult = await client.query('DELETE FROM prompts WHERE id = $1::uuid', [id]);
                await client.query('COMMIT');
                return (deleteResult.rowCount ?? 0) > 0;
            } else {
                // Delete the specific version
                const deleteResult = await client.query(
                    'DELETE FROM prompts WHERE id = $1::uuid AND version = $2',
                    [id, version]
                );

                if ((deleteResult.rowCount ?? 0) === 0) {
                    // Version doesn't exist
                    await client.query('ROLLBACK');
                    return false;
                }

                // Delete associated test cases for this version
                await client.query(
                    'DELETE FROM test_cases WHERE prompt_id = $1::uuid AND prompt_version = $2',
                    [id, version]
                );

                // Delete test results for this version
                await client.query(
                    'DELETE FROM test_results WHERE prompt_id = $1::uuid AND prompt_version = $2',
                    [id, version]
                );

                // Delete test configurations for this version
                await client.query(
                    'DELETE FROM prompt_llm_configs WHERE prompt_id = $1::uuid AND prompt_version = $2',
                    [id, version]
                );
                await client.query(
                    'DELETE FROM prompt_test_selections WHERE prompt_id = $1::uuid AND prompt_version = $2',
                    [id, version]
                );

                await client.query('COMMIT');
                return true;
            }
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error in deletePromptVersion:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async deleteAllPromptVersions(id: string): Promise<boolean> {
        // This is essentially the same as deletePrompt
        return this.deletePrompt(id);
    }

    async saveTestResults(
        promptId: string,
        promptVersion: number,
        results: PromptTestResult[],
        llmConfigs: LLMConfig[],
        enableComparison: boolean,
        userId: string
    ): Promise<void> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const now = new Date();
            const tenantId = '00000000-0000-0000-0000-000000000002'; // Default tenant

            // Save individual test results
            for (const result of results) {
                const llmConfig = llmConfigs[0]; // Use first config for now

                await client.query(`
                    INSERT INTO test_results (id, tenant_id, test_case_id, prompt_id, prompt_version,
                                            execution_time, actual_output, score, passed, llm_config, error_message)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                `, [
                    uuidv4(),
                    tenantId,
                    result.test_case_id,
                    promptId,
                    promptVersion,
                    now,
                    result.actual_output || '',
                    result.comparison_score,
                    result.passed,
                    llmConfig,
                    result.error || null
                ]);
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Failed to save test results:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async getPromptVersions(id: string): Promise<any[]> {
        const result = await this.pool.query(`
            SELECT version, created_at, updated_at, text, type, tags 
            FROM prompts 
            WHERE id = $1 
            ORDER BY version DESC
        `, [id]);

        return result.rows.map(row => ({
            version: row.version,
            created_at: row.created_at,
            updated_at: row.updated_at,
            text: row.text,
            type: row.type,
            tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags
        }));
    }

    async getPromptByVersion(id: string, version: number): Promise<Prompt | null> {
        const promptResult = await this.pool.query(`
            SELECT * FROM prompts 
            WHERE id = $1 AND version = $2
        `, [id, version]);

        if (promptResult.rows.length === 0) return null;

        const promptRow = promptResult.rows[0];
        const testCasesResult = await this.pool.query(`
            SELECT * FROM test_cases 
            WHERE prompt_id = $1 AND prompt_version = $2
        `, [id, version]);

        return {
            id: promptRow.id,
            name: promptRow.name,
            version: promptRow.version,
            text: promptRow.text,
            type: promptRow.type,
            tool_dependencies: typeof promptRow.tool_dependencies === 'string'
                ? JSON.parse(promptRow.tool_dependencies)
                : promptRow.tool_dependencies,
            workflow_dependencies: typeof promptRow.workflow_dependencies === 'string'
                ? JSON.parse(promptRow.workflow_dependencies)
                : promptRow.workflow_dependencies,
            tags: typeof promptRow.tags === 'string'
                ? JSON.parse(promptRow.tags)
                : promptRow.tags,
            created_by: promptRow.created_by,
            created_at: promptRow.created_at,
            updated_at: promptRow.updated_at,
            metadata: typeof promptRow.metadata === 'string'
                ? JSON.parse(promptRow.metadata)
                : promptRow.metadata,
            test_cases: testCasesResult.rows.map(tc => ({
                id: tc.id,
                name: tc.name,
                input: typeof tc.input === 'string' ? JSON.parse(tc.input) : tc.input,
                expected_output: typeof tc.expected_output === 'string'
                    ? JSON.parse(tc.expected_output)
                    : tc.expected_output,
                scoring_logic: tc.scoring_logic,
                enabled: tc.enabled
            }))
        };
    }

    async getAllVersions(id: string): Promise<any[]> {
        // Alias for getPromptVersions
        return this.getPromptVersions(id);
    }

    async getTestResults(promptId: string, version?: number): Promise<any[]> {
        let query = `
            SELECT tr.*, tc.name as test_case_name
            FROM test_results tr
            JOIN test_cases tc ON tr.test_case_id = tc.id
            WHERE tr.prompt_id = $1
        `;
        const params: any[] = [promptId];

        if (version !== undefined) {
            query += ' AND tr.prompt_version = $2';
            params.push(version);
        }

        query += ' ORDER BY tr.execution_time DESC LIMIT 100';

        const result = await this.pool.query(query, params);

        return result.rows.map(row => ({
            id: row.id,
            test_case_id: row.test_case_id,
            test_case_name: row.test_case_name,
            execution_time: row.execution_time,
            actual_output: row.actual_output,
            score: row.score,
            passed: row.passed,
            llm_config: row.llm_config,
            error_message: row.error_message
        }));
    }

    async getTestHistory(promptId: string): Promise<any[]> {
        const query = `
            SELECT 
                CONCAT(tr.prompt_id, '-', tr.prompt_version, '-', to_char(tr.execution_time, 'YYYYMMDDHH24MISS')) as execution_id,
                tr.prompt_version,
                MIN(tr.execution_time) as created_at,
                COUNT(DISTINCT tr.test_case_id) as total_tests,
                SUM(CASE WHEN tr.passed THEN 1 ELSE 0 END) as passed_tests,
                SUM(CASE WHEN NOT tr.passed THEN 1 ELSE 0 END) as failed_tests,
                AVG(tr.score) as avg_comparison_score,
                SUM(EXTRACT(EPOCH FROM (tr.execution_time - tr.execution_time)) * 1000) as total_execution_time_ms
            FROM test_results tr
            WHERE tr.prompt_id = $1
            GROUP BY tr.prompt_id, tr.prompt_version, to_char(tr.execution_time, 'YYYYMMDDHH24MISS')
            ORDER BY MIN(tr.execution_time) DESC
            LIMIT 30
        `;

        const result = await this.pool.query(query, [promptId]);

        return result.rows.map(row => ({
            execution_id: row.execution_id,
            prompt_version: row.prompt_version,
            created_at: row.created_at,
            total_tests: parseInt(row.total_tests),
            passed_tests: parseInt(row.passed_tests),
            failed_tests: parseInt(row.failed_tests),
            avg_comparison_score: row.avg_comparison_score ? parseFloat(row.avg_comparison_score) : null,
            total_execution_time_ms: parseInt(row.total_execution_time_ms || '0')
        }));
    }

    async updatePromptVersion(id: string, version: number, updates: Partial<Prompt>): Promise<Prompt | null> {
        // For now, we don't allow updating specific versions
        // Instead, we create a new version
        if (version !== undefined) {
            // Get the specific version
            const existingPrompt = await this.getPromptByVersion(id, version);
            if (!existingPrompt) return null;

            // Create a new version with the updates
            return this.updatePrompt(id, updates);
        }

        // Update latest version
        return this.updatePrompt(id, updates);
    }

    // Test configuration methods
    async savePromptLLMConfigs(promptId: string, version: number, llmConfigs: any[]): Promise<void> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Delete existing configs for this prompt version
            await client.query(
                'DELETE FROM prompt_llm_configs WHERE prompt_id = $1 AND prompt_version = $2',
                [promptId, version]
            );

            // Insert new configs
            for (const config of llmConfigs) {
                await client.query(`
                    INSERT INTO prompt_llm_configs 
                    (prompt_id, prompt_version, provider, model, temperature, max_tokens)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [promptId, version, config.provider, config.model, config.temperature, config.maxTokens]);
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getPromptLLMConfigs(promptId: string, version: number): Promise<any[]> {
        const result = await this.pool.query(`
            SELECT id, provider, model, temperature, max_tokens as "maxTokens", is_active
            FROM prompt_llm_configs
            WHERE prompt_id = $1 AND prompt_version = $2 AND is_active = true
            ORDER BY created_at
        `, [promptId, version]);

        return result.rows.map(row => ({
            provider: row.provider,
            model: row.model,
            temperature: row.temperature,
            maxTokens: row.maxTokens
        }));
    }

    async savePromptTestSelections(promptId: string, version: number, testCaseIds: string[]): Promise<void> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Delete existing selections
            await client.query(
                'DELETE FROM prompt_test_selections WHERE prompt_id = $1 AND prompt_version = $2',
                [promptId, version]
            );

            // Insert new selections
            for (const testCaseId of testCaseIds) {
                await client.query(`
                    INSERT INTO prompt_test_selections 
                    (prompt_id, prompt_version, test_case_id, is_selected)
                    VALUES ($1, $2, $3, true)
                `, [promptId, version, testCaseId]);
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getPromptTestSelections(promptId: string, version: number): Promise<string[]> {
        const result = await this.pool.query(`
            SELECT test_case_id 
            FROM prompt_test_selections
            WHERE prompt_id = $1 AND prompt_version = $2 AND is_selected = true
        `, [promptId, version]);

        return result.rows.map(row => row.test_case_id);
    }

    async deleteTestResults(promptId: string, version?: number): Promise<boolean> {
        try {
            let query = 'DELETE FROM test_results WHERE prompt_id = $1::uuid';
            const params: any[] = [promptId];

            if (version !== undefined) {
                query += ' AND prompt_version = $2';
                params.push(version);
            }

            const result = await this.pool.query(query, params);
            return (result.rowCount ?? 0) > 0;
        } catch (error) {
            console.error('Error deleting test results:', error);
            throw error;
        }
    }

    async close(): Promise<void> {
        await this.pool.end();
    }
} 