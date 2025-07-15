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
const mockResults = [
    { id: "r1", docName: "UAV Spec.pdf", snippet: "...UAVs must meet ISO9001...", score: 0.92 },
    { id: "r2", docName: "Quality Policy.txt", snippet: "...quality standards for all projects...", score: 0.88 },
];

export const KnowledgeSearch: React.FC = () => {
    const [projectId, setProjectId] = useState("");
    const [domainIds, setDomainIds] = useState<string[]>([]);
    const [tagIds, setTagIds] = useState<string[]>([]);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<typeof mockResults>([]);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const handleDomainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setDomainIds(Array.from(e.target.selectedOptions).map(opt => opt.value));
    };
    const handleTagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setTagIds(Array.from(e.target.selectedOptions).map(opt => opt.value));
    };
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId && domainIds.length === 0) {
            setError("You must select at least a project or one domain to search.");
            return;
        }
        setError(null);
        setSearching(true);
        setTimeout(() => {
            setResults(mockResults);
            setSearching(false);
        }, 800);
    };
    const handleDelete = () => {
        if (deleteTarget) {
            setResults(results.filter(r => r.id !== deleteTarget));
            setDeleteTarget(null);
        }
    };

    return (
        <div>
            <form onSubmit={handleSearch} className="space-y-3 mb-6">
                <div className="text-xs text-gray-500 mb-2">
                    Project and Domain(s) are both optional, but you must select at least one to search.
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
                    <label className="block text-sm font-medium">Query</label>
                    <input type="text" className="w-full border rounded px-2 py-1" value={query} onChange={e => setQuery(e.target.value)} placeholder="Enter your question or keywords..." required />
                </div>
                {error && <div className="text-red-600 text-xs">{error}</div>}
                <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded" disabled={searching}>{searching ? "Searching..." : "Search"}</button>
            </form>
            <h3 className="text-md font-semibold mb-2">Results</h3>
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-xs text-gray-500">
                        <th className="py-1">Document</th>
                        <th className="py-1">Snippet</th>
                        <th className="py-1">Score</th>
                        <th className="py-1">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map(r => (
                        <tr key={r.id} className="border-b">
                            <td className="py-1">{r.docName}</td>
                            <td className="py-1">{r.snippet}</td>
                            <td className="py-1">{r.score.toFixed(2)}</td>
                            <td className="py-1">
                                <button className="text-red-600 text-xs" onClick={() => setDeleteTarget(r.id)}>Delete</button>
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
                        <p>Are you sure you want to delete this document?</p>
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