'use client';

import { useEffect, useState } from 'react';
import { usePanel } from '../contexts/PanelStateContext';
import { fetchProjects } from '../services/projectApi';
import { Project } from '../types/services/project';

// Define project object types that can be associated with projects
interface ProjectObject {
    id: string;
    name: string;
    type: 'ontology' | 'knowledge' | 'data_model' | 'model' | 'simulation' | 'process' | 'thread';
    status?: string;
    lastModified?: string;
}

interface TreeNode {
    id: string;
    name: string;
    type: 'project' | 'folder' | 'object';
    icon: string;
    expanded?: boolean;
    children?: TreeNode[];
    href?: string;
    project?: Project;
    object?: ProjectObject;
}

// Mock data for project objects - in real implementation, this would come from APIs
const getMockProjectObjects = (projectId: string): ProjectObject[] => {
    const mockObjects: Record<string, ProjectObject[]> = {
        'default': [
            { id: 'ont-1', name: 'Decision Ontology', type: 'ontology', status: 'active' },
            { id: 'know-1', name: 'Requirements Document', type: 'knowledge', status: 'active' },
            { id: 'know-2', name: 'Technical Specifications', type: 'knowledge', status: 'active' },
            { id: 'dm-1', name: 'Decision Model', type: 'data_model', status: 'draft' },
            { id: 'model-1', name: 'Analysis Model', type: 'model', status: 'active' },
            { id: 'sim-1', name: 'Scenario Simulation', type: 'simulation', status: 'completed' },
            { id: 'proc-1', name: 'Approval Process', type: 'process', status: 'active' },
            { id: 'thread-1', name: 'Main Analysis Thread', type: 'thread', status: 'active' },
        ]
    };
    return mockObjects[projectId] || mockObjects['default'];
};

const getIconForType = (type: string): string => {
    const iconMap: Record<string, string> = {
        project: 'project',
        ontology: 'type-hierarchy',
        knowledge: 'library-books',
        data_model: 'file',
        model: 'beaker',
        simulation: 'pulse',
        process: 'graph',
        thread: 'list-tree',
        folder: 'folder',
        object: 'file'
    };
    return iconMap[type] || 'file';
};

const getObjectFolderName = (type: string): string => {
    const folderNames: Record<string, string> = {
        ontology: 'Ontologies',
        knowledge: 'Knowledge',
        data_model: 'Data Models',
        model: 'Models',
        simulation: 'Simulations',
        process: 'Processes',
        thread: 'Threads'
    };
    return folderNames[type] || 'Objects';
};

export default function ProjectTreeView() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [treeData, setTreeData] = useState<TreeNode[]>([]);

    // Use persistent panel state for tree expansion
    const treePanel = usePanel('project-tree');

    // Load projects on mount
    useEffect(() => {
        const loadProjects = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await fetchProjects();
                const projectsList = response.items || [];
                setProjects(projectsList);
                if (projectsList.length > 0) {
                    setSelectedProject(projectsList[0]);
                }
            } catch (error) {
                console.error('Failed to load projects:', error);
                setError('Failed to load projects');
                setProjects([]);
            } finally {
                setLoading(false);
            }
        };

        loadProjects();
    }, []);

    // Build tree data when projects or selected project changes
    useEffect(() => {
        if (!selectedProject) {
            setTreeData([]);
            return;
        }

        const projectObjects = getMockProjectObjects(selectedProject.id);

        // Group objects by type
        const groupedObjects: Record<string, ProjectObject[]> = {};
        projectObjects.forEach(obj => {
            if (!groupedObjects[obj.type]) {
                groupedObjects[obj.type] = [];
            }
            groupedObjects[obj.type].push(obj);
        });

        // Create tree structure
        const projectNode: TreeNode = {
            id: selectedProject.id,
            name: selectedProject.name,
            type: 'project',
            icon: getIconForType('project'),
            expanded: expandedNodes.has(selectedProject.id),
            project: selectedProject,
            children: []
        };

        // Add object type folders as children
        Object.entries(groupedObjects).forEach(([type, objects]) => {
            const folderId = `${selectedProject.id}-${type}`;
            const folderNode: TreeNode = {
                id: folderId,
                name: getObjectFolderName(type),
                type: 'folder',
                icon: getIconForType('folder'),
                expanded: expandedNodes.has(folderId),
                children: objects.map(obj => ({
                    id: `${selectedProject.id}-${obj.id}`,
                    name: obj.name,
                    type: 'object',
                    icon: getIconForType(obj.type),
                    object: obj
                }))
            };
            projectNode.children!.push(folderNode);
        });

        setTreeData([projectNode]);
    }, [selectedProject, expandedNodes]);

    const toggleNode = (nodeId: string) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(nodeId)) {
            newExpanded.delete(nodeId);
        } else {
            newExpanded.add(nodeId);
        }
        setExpandedNodes(newExpanded);
    };

    const handleNodeClick = (node: TreeNode) => {
        if (node.type === 'project' || node.type === 'folder') {
            toggleNode(node.id);
        } else if (node.type === 'object' && node.object) {
            // Handle object selection - could navigate to object detail view
            console.log('Selected object:', node.object);
        }
    };

    const handleProjectChange = (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            setSelectedProject(project);
            setExpandedNodes(new Set([projectId])); // Auto-expand the project
        }
    };

    const renderTreeNode = (node: TreeNode, level: number = 0) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes.has(node.id);
        const indent = level * 20;

        return (
            <div key={node.id}>
                <div
                    className="tree-node"
                    style={{ paddingLeft: `${indent + 8}px` }}
                    onClick={() => handleNodeClick(node)}
                >
                    <div className="tree-node-content">
                        {hasChildren && (
                            <i
                                className={`codicon codicon-chevron-${isExpanded ? 'down' : 'right'} tree-node-chevron`}
                            />
                        )}
                        <i className={`codicon codicon-${node.icon} tree-node-icon`} />
                        <span className="tree-node-label">{node.name}</span>
                        {node.object?.status && (
                            <span className={`tree-node-status status-${node.object.status}`}>
                                {node.object.status}
                            </span>
                        )}
                    </div>
                </div>
                {hasChildren && isExpanded && (
                    <div className="tree-node-children">
                        {node.children!.map(child => renderTreeNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="tree-loading">
                <div className="loading-spinner" />
                <span>Loading projects...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="tree-error">
                <i className="codicon codicon-error" />
                <p>Error loading projects</p>
                <p className="error-detail">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="tree-action-button"
                >
                    <i className="codicon codicon-refresh" />
                    Retry
                </button>
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="tree-empty">
                <i className="codicon codicon-folder" />
                <p>No projects found</p>
                <p>Create a project to get started</p>
            </div>
        );
    }

    return (
        <div className="project-tree-view">
            {/* Project Selector */}
            <div className="project-selector">
                <select
                    value={selectedProject?.id || ''}
                    onChange={(e) => handleProjectChange(e.target.value)}
                    className="project-select"
                >
                    {projects.map(project => (
                        <option key={project.id} value={project.id}>
                            {project.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Tree View */}
            <div className="tree-container">
                {treeData.map(node => renderTreeNode(node))}
            </div>

            {/* Actions */}
            <div className="tree-actions">
                <button
                    className="tree-action-button"
                    title="Create new object"
                    onClick={() => console.log('Create new object')}
                >
                    <i className="codicon codicon-add" />
                </button>
                <button
                    className="tree-action-button"
                    title="Refresh tree"
                    onClick={() => window.location.reload()}
                >
                    <i className="codicon codicon-refresh" />
                </button>
                <button
                    className="tree-action-button"
                    title="Collapse all"
                    onClick={() => setExpandedNodes(new Set())}
                >
                    <i className="codicon codicon-collapse-all" />
                </button>
            </div>
        </div>
    );
} 