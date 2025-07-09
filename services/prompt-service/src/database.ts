import { Database, open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { Prompt } from './types';

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
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                version INTEGER NOT NULL DEFAULT 1,
                text TEXT NOT NULL,
                type TEXT NOT NULL CHECK (type IN ('simple', 'tool-aware', 'workflow-aware')),
                tool_dependencies TEXT NOT NULL DEFAULT '[]',
                workflow_dependencies TEXT NOT NULL DEFAULT '[]',
                tags TEXT NOT NULL DEFAULT '[]',
                created_by TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                metadata TEXT NOT NULL DEFAULT '{}'
            )
        `);

        await this.db.exec(`
      CREATE TABLE IF NOT EXISTS test_cases (
        id TEXT PRIMARY KEY,
        prompt_id TEXT NOT NULL,
        name TEXT NOT NULL,
        input TEXT NOT NULL,
        expected_output TEXT NOT NULL,
        scoring_logic TEXT,
        enabled INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (prompt_id) REFERENCES prompts (id)
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
        INSERT INTO test_cases (id, prompt_id, name, input, expected_output, scoring_logic, enabled)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
                testCase.id,
                id,
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

        const promptRow = await this.db.get('SELECT * FROM prompts WHERE id = ?', [id]);
        if (!promptRow) return null;

        const testCases = await this.db.all('SELECT * FROM test_cases WHERE prompt_id = ?', [id]);

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

        const prompts = await this.db.all('SELECT * FROM prompts ORDER BY updated_at DESC');
        const result: Prompt[] = [];

        for (const promptRow of prompts) {
            const testCases = await this.db.all('SELECT * FROM test_cases WHERE prompt_id = ?', [promptRow.id]);

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

        const updatedPrompt: Prompt = {
            ...existingPrompt,
            ...prompt,
            id: existingPrompt.id, // Ensure ID doesn't change
            version: existingPrompt.version + 1,
            updated_at: new Date().toISOString()
        };

        // Update the prompt record
        await this.db.run(`
            UPDATE prompts 
            SET name = ?, version = ?, text = ?, type = ?, tool_dependencies = ?, workflow_dependencies = ?, tags = ?, updated_at = ?, metadata = ?
            WHERE id = ?
        `, [
            updatedPrompt.name,
            updatedPrompt.version,
            updatedPrompt.text,
            updatedPrompt.type,
            JSON.stringify(updatedPrompt.tool_dependencies || []),
            JSON.stringify(updatedPrompt.workflow_dependencies || []),
            JSON.stringify(updatedPrompt.tags || []),
            updatedPrompt.updated_at,
            JSON.stringify(updatedPrompt.metadata || {}),
            id
        ]);

        // Update test cases if provided
        if (prompt.test_cases) {
            // Delete existing test cases
            await this.db.run('DELETE FROM test_cases WHERE prompt_id = ?', [id]);

            // Insert updated test cases
            for (const testCase of prompt.test_cases) {
                await this.db.run(`
                    INSERT INTO test_cases (id, prompt_id, name, input, expected_output, scoring_logic, enabled)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    testCase.id,
                    id,
                    testCase.name,
                    JSON.stringify(testCase.input),
                    JSON.stringify(testCase.expected_output),
                    testCase.scoring_logic || null,
                    testCase.enabled ? 1 : 0
                ]);
            }
        }

        return await this.getPromptById(id);
    }

    async deletePrompt(id: string): Promise<boolean> {
        if (!this.db) throw new Error('Database not initialized');

        const result = await this.db.run('DELETE FROM prompts WHERE id = ?', [id]);
        return (result.changes || 0) > 0;
    }

    async close(): Promise<void> {
        if (this.db) {
            await this.db.close();
        }
    }
} 