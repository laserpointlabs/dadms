import React, { useState } from "react";

interface Domain {
    id: string;
    name: string;
}
interface Tag {
    id: string;
    name: string;
    description?: string;
    domainIds: string[];
}

const initialDomains: Domain[] = [
    { id: "1", name: "Quality" },
    { id: "2", name: "UAVs" },
];
const initialTags: Tag[] = [
    { id: "1", name: "ISO9001", description: "ISO 9001 certified", domainIds: ["1"] },
    { id: "2", name: "Fixed Wing", description: "Fixed wing UAVs", domainIds: ["2"] },
];

export const TagManagement: React.FC = () => {
    const [tags, setTags] = useState<Tag[]>(initialTags);
    const [domains] = useState<Domain[]>(initialDomains);
    const [modalOpen, setModalOpen] = useState(false);
    const [editTag, setEditTag] = useState<Tag | null>(null);
    const [form, setForm] = useState<{ name: string; description: string; domainIds: string[] }>({ name: "", description: "", domainIds: domains[0] ? [domains[0].id] : [] });
    const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);
    const [error, setError] = useState<string | null>(null);

    const openAdd = () => {
        setEditTag(null);
        setForm({ name: "", description: "", domainIds: domains[0] ? [domains[0].id] : [] });
        setModalOpen(true);
        setError(null);
    };
    const openEdit = (tag: Tag) => {
        setEditTag(tag);
        setForm({ name: tag.name, description: tag.description || "", domainIds: tag.domainIds });
        setModalOpen(true);
        setError(null);
    };
    const closeModal = () => {
        setModalOpen(false);
        setEditTag(null);
        setForm({ name: "", description: "", domainIds: domains[0] ? [domains[0].id] : [] });
        setError(null);
    };
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };
    const handleDomainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
        setForm({ ...form, domainIds: selected });
    };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            setError("Name is required");
            return;
        }
        if (!form.domainIds.length) {
            setError("At least one domain is required");
            return;
        }
        if (editTag) {
            setTags(tags.map(t => t.id === editTag.id ? { ...editTag, ...form } : t));
        } else {
            setTags([...tags, { id: Date.now().toString(), ...form }]);
        }
        closeModal();
    };
    const handleDelete = () => {
        if (deleteTarget) {
            setTags(tags.filter(t => t.id !== deleteTarget.id));
            setDeleteTarget(null);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Tags</h2>
                <button className="bg-theme-accent-primary text-theme-text-inverse px-3 py-1 rounded" onClick={openAdd}>Add Tag</button>
            </div>
            <table className="w-full mb-4">
                <thead>
                    <tr className="text-left text-xs text-gray-500">
                        <th className="py-1">Name</th>
                        <th className="py-1">Description</th>
                        <th className="py-1">Domains</th>
                        <th className="py-1">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {tags.map(tag => {
                        const domainNames = tag.domainIds.map(id => domains.find(d => d.id === id)?.name).filter(Boolean).join(", ");
                        return (
                            <tr key={tag.id} className="border-b">
                                <td className="py-2 font-medium">{tag.name}</td>
                                <td className="py-2">{tag.description}</td>
                                <td className="py-2">{domainNames}</td>
                                <td className="py-2">
                                    <button className="text-theme-accent-primary mr-2" onClick={() => openEdit(tag)}>Edit</button>
                                    <button className="text-theme-accent-error" onClick={() => setDeleteTarget(tag)}>Delete</button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {/* Modal for Add/Edit */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6 relative">
                        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={closeModal}>&times;</button>
                        <h3 className="text-lg font-semibold mb-4">{editTag ? "Edit Tag" : "Add Tag"}</h3>
                        <form onSubmit={handleSubmit} className="space-y-2">
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleFormChange}
                                placeholder="Tag Name"
                                className="w-full border rounded px-2 py-1"
                                required
                            />
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleFormChange}
                                placeholder="Description (optional)"
                                className="w-full border rounded px-2 py-1"
                                rows={2}
                            />
                            <select
                                name="domainIds"
                                value={form.domainIds}
                                onChange={handleDomainChange}
                                className="w-full border rounded px-2 py-1"
                                multiple
                                required
                            >
                                {domains.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                            {error && <div className="text-theme-accent-error text-xs">{error}</div>}
                            <button type="submit" className="bg-theme-accent-primary text-theme-text-inverse px-4 py-1 rounded">{editTag ? "Save" : "Add"}</button>
                        </form>
                    </div>
                </div>
            )}
            {/* Delete Confirmation */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-sm mx-4 p-6 relative">
                        <h3 className="text-lg font-semibold mb-4">Delete Tag?</h3>
                        <p>Are you sure you want to delete <b>{deleteTarget.name}</b>?</p>
                        <div className="flex gap-2 mt-4">
                            <button className="bg-theme-accent-error text-theme-text-inverse px-4 py-1 rounded" onClick={handleDelete}>Delete</button>
                            <button className="bg-gray-200 px-4 py-1 rounded" onClick={() => setDeleteTarget(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}; 