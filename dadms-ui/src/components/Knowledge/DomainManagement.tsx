import React, { useState } from "react";

interface Domain {
    id: string;
    name: string;
    description?: string;
}

const initialDomains: Domain[] = [
    { id: "1", name: "Quality", description: "Quality standards and info" },
    { id: "2", name: "UAVs", description: "Approved UAVs and specs" },
];

export const DomainManagement: React.FC = () => {
    const [domains, setDomains] = useState<Domain[]>(initialDomains);
    const [modalOpen, setModalOpen] = useState(false);
    const [editDomain, setEditDomain] = useState<Domain | null>(null);
    const [form, setForm] = useState<{ name: string; description: string }>({ name: "", description: "" });
    const [deleteTarget, setDeleteTarget] = useState<Domain | null>(null);
    const [error, setError] = useState<string | null>(null);

    const openAdd = () => {
        setEditDomain(null);
        setForm({ name: "", description: "" });
        setModalOpen(true);
        setError(null);
    };
    const openEdit = (domain: Domain) => {
        setEditDomain(domain);
        setForm({ name: domain.name, description: domain.description || "" });
        setModalOpen(true);
        setError(null);
    };
    const closeModal = () => {
        setModalOpen(false);
        setEditDomain(null);
        setForm({ name: "", description: "" });
        setError(null);
    };
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            setError("Name is required");
            return;
        }
        if (editDomain) {
            setDomains(domains.map(d => d.id === editDomain.id ? { ...editDomain, ...form } : d));
        } else {
            setDomains([...domains, { id: Date.now().toString(), ...form }]);
        }
        closeModal();
    };
    const handleDelete = () => {
        if (deleteTarget) {
            setDomains(domains.filter(d => d.id !== deleteTarget.id));
            setDeleteTarget(null);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Domains</h2>
                <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={openAdd}>Add Domain</button>
            </div>
            <table className="w-full mb-4">
                <thead>
                    <tr className="text-left text-xs text-gray-500">
                        <th className="py-1">Name</th>
                        <th className="py-1">Description</th>
                        <th className="py-1">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {domains.map(domain => (
                        <tr key={domain.id} className="border-b">
                            <td className="py-2 font-medium">{domain.name}</td>
                            <td className="py-2">{domain.description}</td>
                            <td className="py-2">
                                <button className="text-blue-600 mr-2" onClick={() => openEdit(domain)}>Edit</button>
                                <button className="text-red-600" onClick={() => setDeleteTarget(domain)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {/* Modal for Add/Edit */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6 relative">
                        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={closeModal}>&times;</button>
                        <h3 className="text-lg font-semibold mb-4">{editDomain ? "Edit Domain" : "Add Domain"}</h3>
                        <form onSubmit={handleSubmit} className="space-y-2">
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleFormChange}
                                placeholder="Domain Name"
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
                            {error && <div className="text-red-600 text-xs">{error}</div>}
                            <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">{editDomain ? "Save" : "Add"}</button>
                        </form>
                    </div>
                </div>
            )}
            {/* Delete Confirmation */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-sm mx-4 p-6 relative">
                        <h3 className="text-lg font-semibold mb-4">Delete Domain?</h3>
                        <p>Are you sure you want to delete <b>{deleteTarget.name}</b>?</p>
                        <div className="flex gap-2 mt-4">
                            <button className="bg-red-600 text-white px-4 py-1 rounded" onClick={handleDelete}>Delete</button>
                            <button className="bg-gray-200 px-4 py-1 rounded" onClick={() => setDeleteTarget(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}; 