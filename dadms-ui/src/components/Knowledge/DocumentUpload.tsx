import React, { useState } from "react";

const initialProjects = [
    { id: "p1", name: "Decision Analysis" },
    { id: "p2", name: "UAV Evaluation" },
];
const initialDomains = [
    { id: "1", name: "Quality" },
    { id: "2", name: "UAVs" },
];
const initialTags = [
    { id: "1", name: "ISO9001" },
    { id: "2", name: "Fixed Wing" },
];

interface UploadedFile {
    id: string;
    name: string;
    projectId?: string;
    domainIds?: string[];
    tagIds: string[];
    file: File;
}

export const DocumentUpload: React.FC = () => {
    const [projectId, setProjectId] = useState<string>("");
    const [domainIds, setDomainIds] = useState<string[]>([]);
    const [tagIds, setTagIds] = useState<string[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<UploadedFile | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };
    const handleDomainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setDomainIds(Array.from(e.target.selectedOptions).map(opt => opt.value));
    };
    const handleTagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setTagIds(Array.from(e.target.selectedOptions).map(opt => opt.value));
    };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId && domainIds.length === 0) {
            setError("You must select at least a project or one domain.");
            return;
        }
        if (!file) {
            setError("A file is required.");
            return;
        }
        setUploaded([
            ...uploaded,
            {
                id: Date.now().toString(),
                name: file.name,
                projectId: projectId || undefined,
                domainIds: domainIds.length > 0 ? domainIds : undefined,
                tagIds,
                file,
            },
        ]);
        setFile(null);
        setDomainIds([]);
        setTagIds([]);
        setProjectId("");
        setError(null);
    };

    const handleDelete = () => {
        if (deleteTarget) {
            setUploaded(uploaded.filter(f => f.id !== deleteTarget.id));
            setDeleteTarget(null);
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit} className="space-y-3 mb-6">
                <div className="text-xs text-gray-500 mb-2">
                    Project and Domain(s) are both optional, but you must select at least one.
                </div>
                <div>
                    <label className="block text-sm font-medium">Project</label>
                    <select className="w-full border rounded px-2 py-1" value={projectId} onChange={e => setProjectId(e.target.value)}>
                        <option value="">-- None --</option>
                        {initialProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium">Domains</label>
                    <select className="w-full border rounded px-2 py-1" value={domainIds} onChange={handleDomainChange} multiple>
                        {initialDomains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium">Tags</label>
                    <select className="w-full border rounded px-2 py-1" value={tagIds} onChange={handleTagChange} multiple>
                        {initialTags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium">File</label>
                    <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} className="w-full" required />
                </div>
                {error && <div className="text-red-600 text-xs">{error}</div>}
                <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">Upload</button>
            </form>
            <h3 className="text-md font-semibold mb-2">Uploaded Files</h3>
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-xs text-gray-500">
                        <th className="py-1">Name</th>
                        <th className="py-1">Project</th>
                        <th className="py-1">Domains</th>
                        <th className="py-1">Tags</th>
                        <th className="py-1">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {uploaded.map(f => (
                        <tr key={f.id} className="border-b">
                            <td className="py-1">{f.name}</td>
                            <td className="py-1">{f.projectId ? initialProjects.find(p => p.id === f.projectId)?.name : "--"}</td>
                            <td className="py-1">{f.domainIds ? f.domainIds.map(id => initialDomains.find(d => d.id === id)?.name).filter(Boolean).join(", ") : "--"}</td>
                            <td className="py-1">{f.tagIds.map(id => initialTags.find(t => t.id === id)?.name).filter(Boolean).join(", ")}</td>
                            <td className="py-1">
                                <button className="text-red-600 text-xs" onClick={() => setDeleteTarget(f)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {/* Delete Confirmation */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-sm mx-4 p-6 relative">
                        <h3 className="text-lg font-semibold mb-4">Delete Document?</h3>
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