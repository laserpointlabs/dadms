import { Project } from '../../types/project';

interface ProjectCardProps {
    project: Project;
    onSelect?: (id: string) => void;
    onEdit?: (project: Project) => void;
    onDelete?: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect, onEdit, onDelete }) => {
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active': return 'badge-success';
            case 'completed': return 'badge-primary';
            case 'on_hold': return 'badge-warning';
            case 'cancelled': return 'badge-error';
            default: return 'badge-gray';
        }
    };

    const getStatusIndicator = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active': return 'status-active';
            case 'completed': return 'status-inactive';
            case 'on_hold': return 'status-warning';
            case 'cancelled': return 'status-error';
            default: return 'status-inactive';
        }
    };

    return (
        <div
            className="card p-6 cursor-pointer transition-all duration-200 hover:border-blue-200 group"
            onClick={() => onSelect?.(project.id)}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`status-indicator ${getStatusIndicator(project.status)}`} />
                        <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                            {project.name}
                        </h3>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {project.description}
                    </p>
                </div>

                {/* Action Buttons */}
                {(onEdit || onDelete) && (
                    <div className="flex gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onEdit && (
                            <button
                                className="btn-secondary text-xs px-3 py-1.5"
                                onClick={e => { e.stopPropagation(); onEdit(project); }}
                                title="Edit project"
                            >
                                Edit
                            </button>
                        )}
                        {onDelete && (
                            <button
                                className="text-red-600 hover:text-red-700 text-xs px-3 py-1.5 border border-red-200 hover:border-red-300 rounded-md transition-colors"
                                onClick={e => { e.stopPropagation(); onDelete(project); }}
                                title="Delete project"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Decision Context */}
            {project.decision_context && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                        <div className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0">
                            ⚡
                        </div>
                        <div>
                            <div className="text-xs font-medium text-amber-800 mb-1">Decision Context</div>
                            <div className="text-sm text-amber-700 leading-relaxed">
                                {project.decision_context}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Metadata */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="badge badge-primary">
                        {project.knowledge_domain}
                    </span>
                    <span className={`badge ${getStatusColor(project.status)}`}>
                        {project.status}
                    </span>
                </div>

                <div className="text-xs text-gray-500">
                    Created {new Date(project.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    })}
                </div>
            </div>

            {/* Progress Indicator (if needed) */}
            {project.status === 'active' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>75%</span> {/* This would come from actual project data */}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                        <div className="bg-blue-600 h-1 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                </div>
            )}
        </div>
    );
}; 