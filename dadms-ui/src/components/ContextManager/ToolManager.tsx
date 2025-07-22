import { useState } from "react";
import { Modal } from '../ProjectDashboard/Modal';
import { Button, Card, Icon } from '../shared';
import { FormField, Input, TextArea } from '../shared/FormField';

interface Tool {
    id: string;
    name: string;
    description: string;
    api_spec?: string;
    tags: string[];
}

const MOCK_TAGS = ['finance', 'simulation', 'analysis', 'approval', 'external API'];

const MOCK_TOOLS: Tool[] = [
    { id: "1", name: "Sicilab API", description: "Scientific simulation API.", api_spec: "OpenAPI 3.0", tags: ['simulation', 'external API'] },
    { id: "2", name: "Calculator", description: "Basic math operations.", tags: ['analysis'] },
];

export default function ToolManager() {
    const [tools, setTools] = useState<Tool[]>(MOCK_TOOLS);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Tool | null>(null);
    const [form, setForm] = useState<Omit<Tool, "id">>({ name: "", description: "", api_spec: "", tags: [] });

    const handleOpen = (tool?: Tool) => {
        setEditing(tool || null);
        setForm(tool ? { ...tool } : { name: "", description: "", api_spec: "", tags: [] });
        setOpen(true);
    };
    const handleClose = () => setOpen(false);

    const handleSave = () => {
        if (editing) {
            setTools(ts => ts.map(t => t.id === editing.id ? { ...editing, ...form } : t));
        } else {
            setTools(ts => [...ts, { ...form, id: Date.now().toString() }]);
        }
        setOpen(false);
    };
    const handleDelete = (id: string) => setTools(ts => ts.filter(t => t.id !== id));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-theme-text-primary">Tools</h2>
                <Button variant="primary" leftIcon="add" onClick={() => handleOpen()}>
                    Add Tool
                </Button>
            </div>

            {/* Tools List */}
            <div className="space-y-4">
                {tools.map(tool => (
                    <Card key={tool.id} variant="default" padding="md">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <Icon name="extensions" size="md" className="text-theme-accent-primary" />
                                    <div>
                                        <h3 className="text-lg font-medium text-theme-text-primary">{tool.name}</h3>
                                        <p className="text-sm text-theme-text-secondary">{tool.description}</p>
                                    </div>
                                </div>

                                {/* API Spec */}
                                {tool.api_spec && (
                                    <div className="mb-3">
                                        <p className="text-sm text-theme-text-secondary mb-1">API Specification:</p>
                                        <span className="px-2 py-1 bg-theme-accent-info bg-opacity-20 text-theme-accent-info text-xs rounded">
                                            {tool.api_spec}
                                        </span>
                                    </div>
                                )}

                                {/* Tags */}
                                {tool.tags.length > 0 && (
                                    <div>
                                        <p className="text-sm text-theme-text-secondary mb-1">Tags:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {tool.tags.map((tag, i) => (
                                                <span key={i} className="px-2 py-1 bg-theme-accent-secondary bg-opacity-20 text-theme-accent-secondary text-xs rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 ml-4">
                                <Button
                                    variant="tertiary"
                                    size="sm"
                                    leftIcon="edit"
                                    onClick={() => handleOpen(tool)}
                                >
                                    Edit
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    leftIcon="trash"
                                    onClick={() => handleDelete(tool.id)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}

                {tools.length === 0 && (
                    <Card variant="outlined" padding="lg" className="text-center">
                        <Icon name="extensions" size="xl" className="text-theme-text-muted mb-4" />
                        <h3 className="text-lg font-medium text-theme-text-primary mb-2">No tools yet</h3>
                        <p className="text-theme-text-secondary mb-4">
                            Add API integrations and tools for your personas to use
                        </p>
                        <Button variant="primary" leftIcon="add" onClick={() => handleOpen()}>
                            Add Your First Tool
                        </Button>
                    </Card>
                )}
            </div>

            {/* Edit/Create Modal */}
            <Modal isOpen={open} onClose={handleClose} title={editing ? "Edit Tool" : "Add Tool"}>
                <div className="space-y-4">
                    <FormField label="Name" required>
                        <Input
                            value={form.name}
                            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Enter tool name"
                        />
                    </FormField>

                    <FormField label="Description" required>
                        <TextArea
                            rows={2}
                            value={form.description}
                            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="Describe what this tool does"
                        />
                    </FormField>

                    <FormField label="API Specification" helpText="Optional API spec format or version">
                        <Input
                            value={form.api_spec || ''}
                            onChange={(e) => setForm(f => ({ ...f, api_spec: e.target.value }))}
                            placeholder="e.g., OpenAPI 3.0, REST API"
                        />
                    </FormField>

                    <FormField label="Tags" helpText="Comma-separated tags for categorization">
                        <Input
                            value={form.tags.join(", ")}
                            onChange={(e) => setForm(f => ({ ...f, tags: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
                            placeholder="e.g., simulation, analysis, external API"
                        />
                    </FormField>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSave}>
                            {editing ? "Update" : "Create"} Tool
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
} 