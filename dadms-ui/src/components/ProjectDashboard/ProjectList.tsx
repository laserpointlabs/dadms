import { Project } from '../../types/services/project';
import { ProjectCard } from './ProjectCard';

interface ProjectListProps {
    projects: Project[];
    onSelect?: (id: string) => void;
    onEdit?: (project: Project) => void;
    onDelete?: (project: Project) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelect, onEdit, onDelete }) => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
            <ProjectCard
                key={project.id}
                project={project}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        ))}
    </div>
); 