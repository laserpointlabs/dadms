'use client';

import { useEffect, useState } from 'react';
import { CreateProject } from '../../components/ProjectDashboard/CreateProject';
import { Modal } from '../../components/ProjectDashboard/Modal';
import { ProjectList } from '../../components/ProjectDashboard/ProjectList';
import { createProject, deleteProject, fetchProjects, updateProject } from '../../services/projectApi';
import { CreateProjectRequest, Project, UpdateProjectRequest } from '../../types/project';

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [editProject, setEditProject] = useState<Project | null>(null);
    const [deleteProjectTarget, setDeleteProjectTarget] = useState<Project | null>(null);
    const [editForm, setEditForm] = useState<UpdateProjectRequest>({});
    const [editLoading, setEditLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const STATUS_OPTIONS: Array<'active' | 'completed'> = [
        'active',
        'completed',
    ];

    const loadProjects = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchProjects();
            setProjects(data.projects);
        } catch (err: any) {
            setError(err.message || 'Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProjects();
    }, []);

    const handleCreate = async (data: CreateProjectRequest) => {
        await createProject(data);
        setSuccess('Project created successfully!');
        await loadProjects();
        setTimeout(() => setSuccess(null), 2000);
    };

    const handleRefresh = () => {
        loadProjects();
    };

    const handleSelect = (id: string) => {
        // Placeholder for future navigation to project details
        alert(`Project ID: ${id}`);
    };

    const handleEdit = (project: Project) => {
        setEditProject(project);
        setEditForm({
            name: project.name,
            description: project.description,
            knowledge_domain: project.knowledge_domain,
            status: project.status,
        });
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editProject) return;
        setEditLoading(true);
        try {
            const formToSend: UpdateProjectRequest = {
                ...editForm,
            };
            await updateProject(editProject.id, formToSend);
            setSuccess('Project updated successfully!');
            setEditProject(null);
            await loadProjects();
            setTimeout(() => setSuccess(null), 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to update project');
        } finally {
            setEditLoading(false);
        }
    };

    const handleDelete = (project: Project) => {
        setDeleteProjectTarget(project);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteProjectTarget) return;
        setDeleteLoading(true);
        try {
            await deleteProject(deleteProjectTarget.id);
            setSuccess('Project deleted successfully!');
            setDeleteProjectTarget(null);
            await loadProjects();
            setTimeout(() => setSuccess(null), 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to delete project');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleModalClose = () => {
        setEditProject(null);
        setDeleteProjectTarget(null);
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Projects</h1>
                <div className="flex gap-2 items-center">
                    <a
                        href="http://localhost:3001/api-docs"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline text-sm"
                    >
                        API Docs
                    </a>
                    <button
                        onClick={handleRefresh}
                        className="ml-2 px-2 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300"
                        title="Refresh"
                    >
                        Refresh
                    </button>
                </div>
            </div>
            <CreateProject onCreate={handleCreate} />
            {success && <div className="text-green-600 mb-2">{success}</div>}
            {loading ? (
                <div>Loading projects...</div>
            ) : error ? (
                <div className="text-red-600">{error}</div>
            ) : projects.length === 0 ? (
                <div className="text-gray-500 text-center py-8">No projects found. Create your first project above!</div>
            ) : (
                <ProjectList
                    projects={projects}
                    onSelect={handleSelect}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}
            {/* Edit Modal */}
            <Modal isOpen={!!editProject} onClose={handleModalClose} title="Edit Project">
                {editProject && (
                    <form onSubmit={handleEditSubmit} className="space-y-2">
                        <input
                            name="name"
                            value={editForm.name || ''}
                            onChange={handleEditChange}
                            placeholder="Project Name"
                            className="w-full border rounded px-2 py-1"
                            required
                        />
                        <input
                            name="knowledge_domain"
                            value={editForm.knowledge_domain || ''}
                            onChange={handleEditChange}
                            placeholder="Knowledge Domain"
                            className="w-full border rounded px-2 py-1"
                            required
                        />
                        <textarea
                            name="description"
                            value={editForm.description || ''}
                            onChange={handleEditChange}
                            placeholder="Description"
                            className="w-full border rounded px-2 py-1"
                            rows={2}
                        />
                        <select
                            name="status"
                            value={editForm.status || 'active'}
                            onChange={e => setEditForm({ ...editForm, status: e.target.value as 'active' | 'completed' })}
                            className="w-full border rounded px-2 py-1"
                            required
                        >
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                            ))}
                        </select>
                        <div className="text-xs text-gray-500 mt-2">
                            <div><b>Owner:</b> {editProject.owner_id}</div>
                            <div><b>Created:</b> {new Date(editProject.created_at).toLocaleString()}</div>
                            <div><b>Updated:</b> {new Date(editProject.updated_at).toLocaleString()}</div>
                        </div>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-1 rounded disabled:opacity-50"
                            disabled={editLoading}
                        >
                            {editLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                )}
            </Modal>
            {/* Delete Confirmation Modal */}
            <Modal isOpen={!!deleteProjectTarget} onClose={handleModalClose} title="Delete Project?">
                {deleteProjectTarget && (
                    <div>
                        <p>Are you sure you want to delete <b>{deleteProjectTarget.name}</b>? This action cannot be undone.</p>
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={handleDeleteConfirm}
                                className="bg-red-600 text-white px-4 py-1 rounded disabled:opacity-50"
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? 'Deleting...' : 'Delete'}
                            </button>
                            <button
                                onClick={handleModalClose}
                                className="bg-gray-200 px-4 py-1 rounded"
                                disabled={deleteLoading}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
} 