import { useState } from 'react';
import { CreateProjectRequest } from '../../types/project';

interface CreateProjectProps {
    onCreate: (data: CreateProjectRequest) => void;
}

export const CreateProject: React.FC<CreateProjectProps> = ({ onCreate }) => {
    const [form, setForm] = useState<CreateProjectRequest>({
        name: '',
        description: '',
        knowledge_domain: '',
        decision_context: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onCreate(form);
        setForm({ name: '', description: '', knowledge_domain: '', decision_context: '' });
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="mb-6 space-y-2">
            <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Project Name"
                className="w-full border rounded px-2 py-1"
                required
            />
            <input
                name="knowledge_domain"
                value={form.knowledge_domain}
                onChange={handleChange}
                placeholder="Knowledge Domain"
                className="w-full border rounded px-2 py-1"
                required
            />
            <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Description"
                className="w-full border rounded px-2 py-1"
                rows={2}
            />
            <textarea
                name="decision_context"
                value={form.decision_context}
                onChange={handleChange}
                placeholder="Decision Context (e.g. What is this project trying to decide? Who are the stakeholders? Constraints?)"
                className="w-full border rounded px-2 py-1 bg-yellow-50 border-yellow-300"
                rows={3}
                required
            />
            <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
                disabled={loading}
            >
                {loading ? 'Creating...' : 'Create Project'}
            </button>
        </form>
    );
}; 