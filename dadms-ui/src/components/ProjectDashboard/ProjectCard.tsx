import { Project } from '../../types/project';

interface ProjectCardProps {
    project: Project;
    onSelect?: (id: string) => void;
    onEdit?: (project: Project) => void;
    onDelete?: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect, onEdit, onDelete }) => (
    <div
        className="border rounded-lg p-4 shadow hover:bg-gray-50 cursor-pointer transition relative"
        onClick={() => onSelect?.(project.id)}
    >
        <h3 className="text-lg font-bold mb-1">{project.name}</h3>
        <p className="text-sm text-gray-600 mb-2">{project.description}</p>
        <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{project.knowledge_domain}</span>
            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">{project.status}</span>
        </div>
        <div className="mt-2 text-xs text-gray-400">Created: {new Date(project.created_at).toLocaleString()}</div>
        {(onEdit || onDelete) && (
            <div className="absolute top-2 right-2 flex gap-1">
                {onEdit && (
                    <button
                        className="text-blue-600 hover:underline text-xs px-2 py-1 bg-blue-50 rounded"
                        onClick={e => { e.stopPropagation(); onEdit(project); }}
                    >
                        Edit
                    </button>
                )}
                {onDelete && (
                    <button
                        className="text-red-600 hover:underline text-xs px-2 py-1 bg-red-50 rounded"
                        onClick={e => { e.stopPropagation(); onDelete(project); }}
                    >
                        Delete
                    </button>
                )}
            </div>
        )}
    </div>
); 