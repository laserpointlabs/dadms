import { v4 as uuidv4 } from 'uuid';
import { pool } from '../database/connection';
import { CreateProjectRequest, Project, ProjectListResponse, UpdateProjectRequest } from '../types/project';

export class ProjectService {
    /**
     * Create a new project
     */
    async createProject(userId: string, projectData: CreateProjectRequest): Promise<Project> {
        const projectId = uuidv4();
        const defaultSettings = {
            default_llm: 'openai/gpt-4',
            personas: [],
            tools_enabled: ['rag_search', 'web_search'],
            ...projectData.settings
        };

        const query = `
      INSERT INTO projects (id, name, description, owner_id, knowledge_domain, settings, decision_context)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, description, owner_id, status, knowledge_domain, settings, decision_context, created_at, updated_at
    `;

        const values = [
            projectId,
            projectData.name,
            projectData.description,
            userId,
            projectData.knowledge_domain,
            JSON.stringify(defaultSettings),
            projectData.decision_context || null
        ];

        try {
            const result = await pool.query(query, values);
            return this.mapRowToProject(result.rows[0]);
        } catch (error) {
            console.error('Error creating project:', error);
            throw new Error('Failed to create project');
        }
    }

    /**
     * Get projects for a user with pagination
     */
    async getUserProjects(userId: string, page = 1, limit = 10): Promise<ProjectListResponse> {
        const offset = (page - 1) * limit;

        const countQuery = 'SELECT COUNT(*) FROM projects WHERE owner_id = $1';
        const dataQuery = `
      SELECT id, name, description, owner_id, status, knowledge_domain, settings, decision_context, created_at, updated_at
      FROM projects 
      WHERE owner_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;

        try {
            const [countResult, dataResult] = await Promise.all([
                pool.query(countQuery, [userId]),
                pool.query(dataQuery, [userId, limit, offset])
            ]);

            const total = parseInt(countResult.rows[0].count);
            const projects = dataResult.rows.map(row => this.mapRowToProject(row));

            return {
                projects,
                total,
                page,
                limit
            };
        } catch (error) {
            console.error('Error fetching user projects:', error);
            throw new Error('Failed to fetch projects');
        }
    }

    /**
     * Get a single project by ID
     */
    async getProject(projectId: string, userId: string): Promise<Project | null> {
        const query = `
      SELECT id, name, description, owner_id, status, knowledge_domain, settings, decision_context, created_at, updated_at
      FROM projects 
      WHERE id = $1 AND owner_id = $2
    `;

        try {
            const result = await pool.query(query, [projectId, userId]);

            if (result.rows.length === 0) {
                return null;
            }

            return this.mapRowToProject(result.rows[0]);
        } catch (error) {
            console.error('Error fetching project:', error);
            throw new Error('Failed to fetch project');
        }
    }

    /**
     * Update a project
     */
    async updateProject(projectId: string, userId: string, updateData: UpdateProjectRequest): Promise<Project | null> {
        const fields = [];
        const values = [];
        let paramCount = 1;

        // Build dynamic update query
        if (updateData.name) {
            fields.push(`name = $${paramCount++}`);
            values.push(updateData.name);
        }
        if (updateData.description !== undefined) {
            fields.push(`description = $${paramCount++}`);
            values.push(updateData.description);
        }
        if (updateData.knowledge_domain) {
            fields.push(`knowledge_domain = $${paramCount++}`);
            values.push(updateData.knowledge_domain);
        }
        if (updateData.status) {
            fields.push(`status = $${paramCount++}`);
            values.push(updateData.status);
        }
        if (updateData.settings) {
            // Merge with existing settings
            const existingProject = await this.getProject(projectId, userId);
            if (!existingProject) return null;

            const mergedSettings = { ...existingProject.settings, ...updateData.settings };
            fields.push(`settings = $${paramCount++}`);
            values.push(JSON.stringify(mergedSettings));
        }
        if (updateData.decision_context !== undefined) {
            fields.push(`decision_context = $${paramCount++}`);
            values.push(updateData.decision_context);
        }

        if (fields.length === 0) {
            // No fields to update, return existing project
            return this.getProject(projectId, userId);
        }

        fields.push(`updated_at = NOW()`);
        values.push(projectId, userId);

        const query = `
      UPDATE projects 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount++} AND owner_id = $${paramCount++}
      RETURNING id, name, description, owner_id, status, knowledge_domain, settings, decision_context, created_at, updated_at
    `;

        try {
            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                return null;
            }

            return this.mapRowToProject(result.rows[0]);
        } catch (error) {
            console.error('Error updating project:', error);
            throw new Error('Failed to update project');
        }
    }

    /**
     * Delete a project
     */
    async deleteProject(projectId: string, userId: string): Promise<boolean> {
        const query = 'DELETE FROM projects WHERE id = $1 AND owner_id = $2';

        try {
            const result = await pool.query(query, [projectId, userId]);
            return (result.rowCount || 0) > 0;
        } catch (error) {
            console.error('Error deleting project:', error);
            throw new Error('Failed to delete project');
        }
    }

    /**
     * Map database row to Project interface
     */
    private mapRowToProject(row: any): Project {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            owner_id: row.owner_id,
            status: row.status,
            knowledge_domain: row.knowledge_domain,
            settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
            created_at: new Date(row.created_at),
            updated_at: new Date(row.updated_at),
            decision_context: row.decision_context || undefined
        };
    }
} 