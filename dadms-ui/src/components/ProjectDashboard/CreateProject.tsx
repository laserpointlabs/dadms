import { useState } from 'react';
import { CreateProjectRequest } from '../../types/project';

interface CreateProjectProps {
    onCreate: (data: CreateProjectRequest) => Promise<void>;
}

export const CreateProject: React.FC<CreateProjectProps> = ({ onCreate }) => {
    const [form, setForm] = useState<CreateProjectRequest>({
        name: '',
        description: '',
        knowledge_domain: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await onCreate(form);
            setForm({ name: '', description: '', knowledge_domain: '' });
        } catch (err: any) {
            setError(err.message || 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-2 bg-white p-4 rounded shadow mb-6">
            <h2 className="text-lg font-semibold">Create New Project</h2>
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
            <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-1 rounded disabled:opacity-50"
                disabled={loading}
            >
                {loading ? 'Creating...' : 'Create Project'}
            </button>
            {error && <div className="text-red-600 text-sm">{error}</div>}
        </form>
    );
}; 