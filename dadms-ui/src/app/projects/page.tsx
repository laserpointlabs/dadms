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
    const [showCreateForm, setShowCreateForm] = useState(false);

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
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load projects');
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
        setShowCreateForm(false);
        await loadProjects();
        setTimeout(() => setSuccess(null), 2000);
    };

    const handleRefresh = () => {
        loadProjects();
    };

    const handleEdit = (project: Project) => {
        setEditProject(project);
        setEditForm({
            name: project.name,
            description: project.description,
            decision_context: project.decision_context,
            knowledge_domain: project.knowledge_domain,
            status: project.status,
        });
    };

    const handleUpdate = async () => {
        if (!editProject) return;
        setEditLoading(true);
        try {
            await updateProject(editProject.id, editForm);
            setSuccess('Project updated successfully!');
            setEditProject(null);
            await loadProjects();
            setTimeout(() => setSuccess(null), 2000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to update project');
        } finally {
            setEditLoading(false);
        }
    };

    const handleDelete = (project: Project) => {
        setDeleteProjectTarget(project);
    };

    const confirmDelete = async () => {
        if (!deleteProjectTarget) return;
        setDeleteLoading(true);
        try {
            await deleteProject(deleteProjectTarget.id);
            setSuccess('Project deleted successfully!');
            setDeleteProjectTarget(null);
            await loadProjects();
            setTimeout(() => setSuccess(null), 2000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to delete project');
        } finally {
            setDeleteLoading(false);
        }
    };

    // Calculate project statistics
    const stats = {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        completed: projects.filter(p => p.status === 'completed').length,
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Project Dashboard</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Manage decision analysis projects and track progress
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRefresh}
                            className="btn-secondary"
                            disabled={loading}
                            title="Refresh projects"
                        >
                            {loading ? (
                                <div className="loading-spinner" />
                            ) : (
                                '🔄'
                            )}
                            Refresh
                        </button>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="btn-primary"
                        >
                            ➕ New Project
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="card p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                📁
                            </div>
                        </div>
                    </div>
                    <div className="card p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                            </div>
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                ⚡
                            </div>
                        </div>
                    </div>
                    <div className="card p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Completed</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
                            </div>
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                ✅
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                {/* Status Messages */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2">
                            <span className="text-red-600">❌</span>
                            <span className="text-sm font-medium text-red-800">{error}</span>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                            <span className="text-green-600">✅</span>
                            <span className="text-sm font-medium text-green-800">{success}</span>
                        </div>
                    </div>
                )}

                {/* Projects List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="loading-spinner mr-3" />
                        <span className="text-gray-600">Loading projects...</span>
                    </div>
                ) : projects.length > 0 ? (
                    <ProjectList
                        projects={projects}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                            📁
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                        <p className="text-gray-600 mb-4">
                            Create your first decision analysis project to get started.
                        </p>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="btn-primary"
                        >
                            ➕ Create Project
                        </button>
                    </div>
                )}
            </div>

            {/* Create Project Modal */}
            {showCreateForm && (
                <Modal isOpen={showCreateForm} onClose={() => setShowCreateForm(false)}>
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Project</h2>
                        <CreateProject
                            onCreate={handleCreate}
                        />
                    </div>
                </Modal>
            )}

            {/* Edit Project Modal */}
            {editProject && (
                <Modal isOpen={!!editProject} onClose={() => setEditProject(null)}>
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Project</h2>
                        <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Project Name
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    value={editForm.name || ''}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    className="input min-h-[100px] resize-y"
                                    value={editForm.description || ''}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Decision Context
                                </label>
                                <textarea
                                    className="input min-h-[80px] resize-y"
                                    value={editForm.decision_context || ''}
                                    onChange={(e) => setEditForm({ ...editForm, decision_context: e.target.value })}
                                    placeholder="What decision needs to be made?"
                                    rows={2}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Knowledge Domain
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={editForm.knowledge_domain || ''}
                                        onChange={(e) => setEditForm({ ...editForm, knowledge_domain: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status
                                    </label>
                                    <select
                                        className="input"
                                        value={editForm.status || ''}
                                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'active' | 'completed' })}
                                    >
                                        {STATUS_OPTIONS.map(status => (
                                            <option key={status} value={status}>
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditProject(null)}
                                    className="btn-secondary"
                                    disabled={editLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={editLoading}
                                >
                                    {editLoading ? (
                                        <>
                                            <div className="loading-spinner" />
                                            Updating...
                                        </>
                                    ) : (
                                        'Update Project'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            {deleteProjectTarget && (
                <Modal isOpen={!!deleteProjectTarget} onClose={() => setDeleteProjectTarget(null)}>
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Project</h2>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete &ldquo;{deleteProjectTarget.name}&rdquo;? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteProjectTarget(null)}
                                className="btn-secondary"
                                disabled={deleteLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? (
                                    <>
                                        <div className="loading-spinner" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete Project'
                                )}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
} 