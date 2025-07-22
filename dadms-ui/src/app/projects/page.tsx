'use client';

import { useEffect, useState } from 'react';
import { CreateProject } from '../../components/ProjectDashboard/CreateProject';
import { Modal } from '../../components/ProjectDashboard/Modal';
import { ProjectList } from '../../components/ProjectDashboard/ProjectList';
import { Alert, AlertDialog, Button, Card, Icon, SkeletonList } from '../../components/shared';
import { PageContent, PageLayout } from '../../components/shared/PageLayout';
import { createProject, deleteProject, fetchProjects, updateProject } from '../../services/projectApi';
import { CreateProjectRequest, Project, ProjectStatus, UpdateProjectRequest } from '../../types/services/project';

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

    const STATUS_OPTIONS: ProjectStatus[] = [
        ProjectStatus.Active,
        ProjectStatus.Completed,
    ];

    // Calculate project statistics
    const stats = {
        total: projects.length,
        active: projects.filter(p => p.status === ProjectStatus.Active).length,
        completed: projects.filter(p => p.status === ProjectStatus.Completed).length,
        onHold: projects.filter(p => p.status === ProjectStatus.OnHold).length
    };

    const loadProjects = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchProjects();
            setProjects(data.items); // Changed from data.projects to data.items
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
            decisionContext: project.decisionContext,
            knowledgeDomain: project.knowledgeDomain,
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

    const pageActions = (
        <>
            <Button
                variant="tertiary"
                leftIcon="refresh"
                onClick={handleRefresh}
                disabled={loading}
                loading={loading}
            >
                Refresh
            </Button>
            <Button
                variant="primary"
                leftIcon="add"
                onClick={() => setShowCreateForm(true)}
            >
                New Project
            </Button>
        </>
    );

    return (
        <PageLayout
            title="Project Dashboard"
            subtitle="Manage decision analysis projects and track progress"
            icon="project"
            actions={pageActions}
            status={{
                text: `${stats.active} Active Projects`,
                type: 'active'
            }}
        >
            <PageContent spacing="lg">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card padding="sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-theme-text-secondary">Total Projects</p>
                                <p className="text-2xl font-bold text-theme-text-primary">{stats.total}</p>
                            </div>
                            <div className="w-12 h-12 bg-theme-accent-primary bg-opacity-20 rounded-lg flex items-center justify-center">
                                <Icon name="folder" size="lg" className="text-theme-accent-primary" />
                            </div>
                        </div>
                    </Card>
                    <Card padding="sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-theme-text-secondary">Active Projects</p>
                                <p className="text-2xl font-bold text-theme-text-primary">{stats.active}</p>
                            </div>
                            <div className="w-12 h-12 bg-theme-accent-success bg-opacity-20 rounded-lg flex items-center justify-center">
                                <Icon name="check-circle" size="lg" className="text-theme-accent-success" />
                            </div>
                        </div>
                    </Card>
                    <Card padding="sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-theme-text-secondary">Completed</p>
                                <p className="text-2xl font-bold text-theme-text-primary">{stats.completed}</p>
                            </div>
                            <div className="w-12 h-12 bg-theme-accent-info bg-opacity-20 rounded-lg flex items-center justify-center">
                                <Icon name="circle-filled" size="lg" className="text-theme-accent-info" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Status Messages */}
                {(error || success) && (
                    <div className="space-y-3">
                        {error && (
                            <Alert
                                variant="error"
                                title="Error"
                                onClose={() => setError(null)}
                            >
                                {error}
                            </Alert>
                        )}
                        {success && (
                            <Alert
                                variant="success"
                                title="Success"
                                onClose={() => setSuccess(null)}
                            >
                                {success}
                            </Alert>
                        )}
                    </div>
                )}

                {/* Main Content */}
                {loading ? (
                    <SkeletonList items={6} />
                ) : projects.length > 0 ? (
                    <ProjectList projects={projects} onEdit={handleEdit} onDelete={handleDelete} />
                ) : (
                    <Card variant="default" padding="lg" className="text-center">
                        <Icon name="folder" size="xl" className="text-theme-text-muted mb-4" />
                        <h3 className="text-lg font-medium text-theme-text-primary mb-2">No projects yet</h3>
                        <p className="text-theme-text-secondary mb-4">
                            Get started by creating your first decision analysis project
                        </p>
                        <Button variant="primary" leftIcon="add" onClick={() => setShowCreateForm(true)}>
                            Create Your First Project
                        </Button>
                    </Card>
                )}
            </PageContent>

            {/* Create Project Modal */}
            <Modal isOpen={showCreateForm} onClose={() => setShowCreateForm(false)} title="Create New Project">
                <CreateProject
                    onSubmit={async (data) => {
                        await handleCreate(data);
                        setShowCreateForm(false);
                    }}
                    onCancel={() => setShowCreateForm(false)}
                />
            </Modal>

            {/* Edit Project Modal */}
            <Modal isOpen={!!editProject} onClose={() => setEditProject(null)} title="Edit Project">
                {editProject && (
                    <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-theme-text-secondary mb-1">Name</label>
                            <input
                                type="text"
                                value={editForm.name || ''}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="w-full px-3 py-2 bg-theme-input-bg border border-theme-input-border rounded-md text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-accent-primary"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-text-secondary mb-1">Status</label>
                            <select
                                value={editForm.status || ProjectStatus.Active}
                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as ProjectStatus })}
                                className="w-full px-3 py-2 bg-theme-input-bg border border-theme-input-border rounded-md text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-accent-primary"
                            >
                                {STATUS_OPTIONS.map((status) => (
                                    <option key={status} value={status} className="bg-theme-input-bg text-theme-text-primary">
                                        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-text-secondary mb-1">Knowledge Domain</label>
                            <input
                                type="text"
                                value={editForm.knowledgeDomain || ''}
                                onChange={(e) => setEditForm({ ...editForm, knowledgeDomain: e.target.value })}
                                className="w-full px-3 py-2 bg-theme-input-bg border border-theme-input-border rounded-md text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-accent-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-text-secondary mb-1">Description</label>
                            <textarea
                                value={editForm.description || ''}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                className="w-full px-3 py-2 bg-theme-input-bg border border-theme-input-border rounded-md text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-accent-primary"
                                rows={3}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-text-secondary mb-1">Decision Context</label>
                            <textarea
                                value={editForm.decisionContext || ''}
                                onChange={(e) => setEditForm({ ...editForm, decisionContext: e.target.value })}
                                className="w-full px-3 py-2 bg-theme-input-bg border border-theme-input-border rounded-md text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-accent-primary"
                                rows={3}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="secondary" onClick={() => setEditProject(null)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" loading={editLoading}>
                                Save Changes
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Delete Confirmation */}
            <AlertDialog
                open={!!deleteProjectTarget}
                onClose={() => setDeleteProjectTarget(null)}
                onConfirm={() => deleteProjectTarget && handleDelete(deleteProjectTarget)}
                title="Delete Project"
                description={`Are you sure you want to delete "${deleteProjectTarget?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="error"
            />
        </PageLayout>
    );
} 