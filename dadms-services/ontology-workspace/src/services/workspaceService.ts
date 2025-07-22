import { v4 as uuidv4 } from 'uuid';
import { pool } from '../database/connection';
import {
    AddOntologyRequest,
    CreateWorkspaceRequest,
    OntologyDocument,
    OntologyWorkspace,
    UpdateWorkspaceRequest,
    VisualLayout,
    WorkspaceSettings
} from '../models/workspace';

export class WorkspaceService {
    /**
     * Create a new ontology workspace
     */
    async createWorkspace(userId: string, workspaceData: CreateWorkspaceRequest): Promise<OntologyWorkspace> {
        const workspaceId = uuidv4();
        const defaultSettings: WorkspaceSettings = {
            auto_save_enabled: true,
            auto_layout_enabled: false,
            validation_on_save: true,
            default_reasoner: 'hermit',
            color_scheme: 'auto',
            grid_enabled: true,
            snap_to_grid: false,
            ...workspaceData.settings
        };

        const query = `
            INSERT INTO ontology_workspaces (id, name, description, project_id, created_by, settings)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, name, description, project_id, created_by, settings, metadata, created_at, updated_at
        `;

        const values = [
            workspaceId,
            workspaceData.name,
            workspaceData.description,
            workspaceData.project_id,
            userId,
            JSON.stringify(defaultSettings)
        ];

        try {
            const result = await pool.query(query, values);
            return this.mapRowToWorkspace(result.rows[0]);
        } catch (error) {
            console.error('Error creating workspace:', error);
            throw new Error('Failed to create ontology workspace');
        }
    }

    /**
     * Get workspaces with optional filtering
     */
    async getWorkspaces(
        filters: {
            project_id?: string;
            name_contains?: string;
            created_by?: string;
        } = {},
        pagination: { limit?: number; offset?: number } = {}
    ): Promise<{ workspaces: OntologyWorkspace[]; total: number }> {
        const { limit = 20, offset = 0 } = pagination;

        let whereConditions: string[] = [];
        let queryParams: any[] = [];
        let paramIndex = 1;

        if (filters.project_id) {
            whereConditions.push(`project_id = $${paramIndex++}`);
            queryParams.push(filters.project_id);
        }

        if (filters.name_contains) {
            whereConditions.push(`name ILIKE $${paramIndex++}`);
            queryParams.push(`%${filters.name_contains}%`);
        }

        if (filters.created_by) {
            whereConditions.push(`created_by = $${paramIndex++}`);
            queryParams.push(filters.created_by);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const countQuery = `SELECT COUNT(*) FROM ontology_workspaces ${whereClause}`;
        const dataQuery = `
            SELECT id, name, description, project_id, created_by, settings, metadata, created_at, updated_at
            FROM ontology_workspaces 
            ${whereClause}
            ORDER BY created_at DESC 
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        try {
            const [countResult, dataResult] = await Promise.all([
                pool.query(countQuery, queryParams),
                pool.query(dataQuery, [...queryParams, limit, offset])
            ]);

            const total = parseInt(countResult.rows[0].count);
            const workspaces = dataResult.rows.map(row => this.mapRowToWorkspace(row));

            return { workspaces, total };
        } catch (error) {
            console.error('Error fetching workspaces:', error);
            throw new Error('Failed to fetch workspaces');
        }
    }

    /**
     * Get a single workspace by ID
     */
    async getWorkspace(workspaceId: string): Promise<OntologyWorkspace | null> {
        const query = `
            SELECT id, name, description, project_id, created_by, settings, metadata, created_at, updated_at
            FROM ontology_workspaces 
            WHERE id = $1
        `;

        try {
            const result = await pool.query(query, [workspaceId]);

            if (result.rows.length === 0) {
                return null;
            }

            return this.mapRowToWorkspace(result.rows[0]);
        } catch (error) {
            console.error('Error fetching workspace:', error);
            throw new Error('Failed to fetch workspace');
        }
    }

    /**
     * Update a workspace
     */
    async updateWorkspace(workspaceId: string, updateData: UpdateWorkspaceRequest): Promise<OntologyWorkspace | null> {
        const fields: string[] = [];
        const values: any[] = [];
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
        if (updateData.settings) {
            // Merge with existing settings
            const existingWorkspace = await this.getWorkspace(workspaceId);
            if (!existingWorkspace) return null;

            const mergedSettings = { ...existingWorkspace.settings, ...updateData.settings };
            fields.push(`settings = $${paramCount++}`);
            values.push(JSON.stringify(mergedSettings));
        }

        if (fields.length === 0) {
            // No fields to update, return existing workspace
            return this.getWorkspace(workspaceId);
        }

        fields.push(`updated_at = NOW()`);
        values.push(workspaceId);

        const query = `
            UPDATE ontology_workspaces 
            SET ${fields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING id, name, description, project_id, created_by, settings, metadata, created_at, updated_at
        `;

        try {
            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                return null;
            }

            return this.mapRowToWorkspace(result.rows[0]);
        } catch (error) {
            console.error('Error updating workspace:', error);
            throw new Error('Failed to update workspace');
        }
    }

    /**
     * Delete a workspace
     */
    async deleteWorkspace(workspaceId: string): Promise<boolean> {
        const query = 'DELETE FROM ontology_workspaces WHERE id = $1';

        try {
            const result = await pool.query(query, [workspaceId]);
            return (result.rowCount || 0) > 0;
        } catch (error) {
            console.error('Error deleting workspace:', error);
            throw new Error('Failed to delete workspace');
        }
    }

    /**
     * Add ontology to workspace
     */
    async addOntology(workspaceId: string, ontologyData: AddOntologyRequest): Promise<OntologyDocument> {
        const ontologyId = uuidv4();

        const query = `
            INSERT INTO ontology_documents (id, workspace_id, name, description, iri, format, content, version)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, workspace_id, name, description, iri, format, content, version, status, visual_layout, metadata, created_at, updated_at
        `;

        const content = ontologyData.content ? JSON.parse(ontologyData.content) : {};

        const values = [
            ontologyId,
            workspaceId,
            ontologyData.name,
            ontologyData.description,
            ontologyData.iri,
            ontologyData.format || 'turtle',
            JSON.stringify(content),
            '1.0.0'
        ];

        try {
            const result = await pool.query(query, values);
            return this.mapRowToOntology(result.rows[0]);
        } catch (error) {
            console.error('Error adding ontology:', error);
            throw new Error('Failed to add ontology to workspace');
        }
    }

    /**
     * Get ontologies in workspace
     */
    async getOntologies(workspaceId: string): Promise<OntologyDocument[]> {
        const query = `
            SELECT id, workspace_id, name, description, iri, format, content, version, status, visual_layout, metadata, created_at, updated_at
            FROM ontology_documents 
            WHERE workspace_id = $1
            ORDER BY created_at DESC
        `;

        try {
            const result = await pool.query(query, [workspaceId]);
            return result.rows.map(row => this.mapRowToOntology(row));
        } catch (error) {
            console.error('Error fetching ontologies:', error);
            throw new Error('Failed to fetch ontologies');
        }
    }

    /**
     * Get a single ontology by ID
     */
    async getOntology(workspaceId: string, ontologyId: string): Promise<OntologyDocument | null> {
        const query = `
            SELECT id, workspace_id, name, description, iri, format, content, version, status, visual_layout, metadata, created_at, updated_at
            FROM ontology_documents 
            WHERE id = $1 AND workspace_id = $2
        `;

        try {
            const result = await pool.query(query, [ontologyId, workspaceId]);

            if (result.rows.length === 0) {
                return null;
            }

            return this.mapRowToOntology(result.rows[0]);
        } catch (error) {
            console.error('Error fetching ontology:', error);
            throw new Error('Failed to fetch ontology');
        }
    }

    /**
 * Update ontology content or metadata
 */
    async updateOntology(
        workspaceId: string,
        ontologyId: string,
        updateData: {
            name?: string;
            description?: string;
            content?: Record<string, any>;
            visual_layout?: VisualLayout;
            status?: string;
        }
    ): Promise<OntologyDocument | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (updateData.name) {
            fields.push(`name = $${paramCount++}`);
            values.push(updateData.name);
        }
        if (updateData.description !== undefined) {
            fields.push(`description = $${paramCount++}`);
            values.push(updateData.description);
        }
        if (updateData.content) {
            fields.push(`content = $${paramCount++}`);
            values.push(JSON.stringify(updateData.content));
        }
        if (updateData.visual_layout) {
            fields.push(`visual_layout = $${paramCount++}`);
            values.push(JSON.stringify(updateData.visual_layout));
        }
        if (updateData.status) {
            fields.push(`status = $${paramCount++}`);
            values.push(updateData.status);
        }

        if (fields.length === 0) {
            return this.getOntology(workspaceId, ontologyId);
        }

        fields.push(`updated_at = NOW()`);
        values.push(ontologyId, workspaceId);

        const query = `
            UPDATE ontology_documents 
            SET ${fields.join(', ')}
            WHERE id = $${paramCount++} AND workspace_id = $${paramCount++}
            RETURNING id, workspace_id, name, description, iri, format, content, version, status, visual_layout, metadata, created_at, updated_at
        `;

        try {
            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                return null;
            }

            return this.mapRowToOntology(result.rows[0]);
        } catch (error) {
            console.error('Error updating ontology:', error);
            throw new Error('Failed to update ontology');
        }
    }

    /**
     * Delete ontology from workspace
     */
    async deleteOntology(workspaceId: string, ontologyId: string): Promise<boolean> {
        const query = 'DELETE FROM ontology_documents WHERE id = $1 AND workspace_id = $2';

        try {
            const result = await pool.query(query, [ontologyId, workspaceId]);
            return (result.rowCount || 0) > 0;
        } catch (error) {
            console.error('Error deleting ontology:', error);
            throw new Error('Failed to delete ontology');
        }
    }

    /**
     * Map database row to OntologyWorkspace interface
     */
    private mapRowToWorkspace(row: any): OntologyWorkspace {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            project_id: row.project_id,
            created_by: row.created_by,
            settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
            metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
            created_at: row.created_at,
            updated_at: row.updated_at
        };
    }

    /**
     * Map database row to OntologyDocument interface
     */
    private mapRowToOntology(row: any): OntologyDocument {
        return {
            id: row.id,
            workspace_id: row.workspace_id,
            name: row.name,
            description: row.description,
            iri: row.iri,
            format: row.format,
            content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content,
            version: row.version,
            status: row.status,
            visual_layout: typeof row.visual_layout === 'string' ? JSON.parse(row.visual_layout) : row.visual_layout,
            metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
            created_at: row.created_at,
            updated_at: row.updated_at
        };
    }
} 