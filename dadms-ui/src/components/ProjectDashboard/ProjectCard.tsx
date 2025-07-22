import React from 'react';
import { Project } from '../../types/services/project';
import { Icon } from '../shared/Icon';

interface ProjectCardProps {
    project: Project;
    onSelect?: (id: string) => void;
    onEdit?: (project: Project) => void;
    onDelete?: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect, onEdit, onDelete }) => {
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active': return 'text-theme-accent-success';
            case 'completed': return 'text-theme-accent-info';
            case 'on_hold': return 'text-theme-accent-warning';
            case 'cancelled': return 'text-theme-accent-error';
            default: return 'text-theme-text-muted';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active': return 'circle-filled';
            case 'completed': return 'check-circle';
            case 'on_hold': return 'warning';
            case 'cancelled': return 'error';
            default: return 'circle-filled';
        }
    };

    return (
        <div
            className="bg-theme-surface border border-theme-border rounded-lg p-6 cursor-pointer transition-all duration-200 hover:border-theme-accent-primary hover:shadow-lg group"
            onClick={() => onSelect?.(project.id)}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Icon
                            name={getStatusIcon(project.status)}
                            size="sm"
                            className={getStatusColor(project.status)}
                        />
                        <h3 className="text-lg font-semibold text-theme-text-primary truncate group-hover:text-theme-accent-primary transition-colors">
                            {project.name}
                        </h3>
                    </div>
                    <span className={`${getStatusColor(project.status)} text-xs font-medium`}>
                        {project.status.toUpperCase().replace('_', ' ')}
                    </span>
                </div>
                {(onEdit || onDelete) && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onEdit && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(project);
                                }}
                                className="p-2 hover:bg-theme-surface-hover rounded-md transition-colors"
                                aria-label="Edit project"
                                title="Edit project"
                            >
                                <Icon name="edit" size="sm" className="text-theme-text-secondary hover:text-theme-text-primary" />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(project);
                                }}
                                className="p-2 hover:bg-theme-accent-error hover:bg-opacity-20 rounded-md transition-colors"
                                aria-label="Delete project"
                                title="Delete project"
                            >
                                <Icon name="trash" size="sm" className="text-theme-text-secondary hover:text-theme-accent-error" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Description */}
            <p className="text-theme-text-secondary text-sm mb-4 line-clamp-2">
                {project.description || 'No description available'}
            </p>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                    <span className="text-theme-text-muted">Created</span>
                    <div className="text-theme-text-secondary font-medium">
                        {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                </div>
                <div>
                    <span className="text-theme-text-muted">Updated</span>
                    <div className="text-theme-text-secondary font-medium">
                        {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                </div>
            </div>

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
                <div className="mt-4 pt-4 border-t border-theme-border">
                    <div className="flex flex-wrap gap-1">
                        {project.tags.slice(0, 3).map((tag, index) => (
                            <span
                                key={index}
                                className="px-2 py-1 bg-theme-accent-primary bg-opacity-20 text-theme-accent-primary rounded text-xs"
                            >
                                {tag}
                            </span>
                        ))}
                        {project.tags.length > 3 && (
                            <span className="px-2 py-1 bg-theme-surface-hover text-theme-text-muted rounded text-xs">
                                +{project.tags.length - 3} more
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}; 