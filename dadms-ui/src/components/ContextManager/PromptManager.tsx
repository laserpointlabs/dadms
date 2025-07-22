import { useState } from "react";
import { Modal } from '../ProjectDashboard/Modal';
import { Button, Card, Icon } from '../shared';
import { FormField, Input, Select, TextArea } from '../shared/FormField';

// Mock data for personas and tools
const MOCK_PERSONAS = [
    { id: "1", name: "Risk Analyst" },
    { id: "2", name: "Process Owner" },
];
const MOCK_TAGS = ['finance', 'simulation', 'analysis', 'approval', 'external API'];

interface Prompt {
    id: string;
    name: string;
    description: string;
    template: string;
    persona_id: string;
    tags: string[];
    approval_status: 'draft' | 'approved' | 'rejected';
}

const EXAMPLE_PROMPTS: Prompt[] = [
    {
        id: "101",
        name: "Business Decision Analysis",
        description: "Analyze business options and recommend the best course of action.",
        template: "Given the following options: {{options}}, analyze the pros and cons and recommend the best choice.",
        persona_id: "1",
        tags: ['finance', 'analysis'],
        approval_status: 'approved'
    },
    {
        id: "102",
        name: "Risk Assessment",
        description: "Evaluate potential risks and mitigation strategies.",
        template: "Assess the risks associated with {{scenario}} and provide mitigation recommendations.",
        persona_id: "1",
        tags: ['finance', 'analysis'],
        approval_status: 'draft'
    }
];

export default function PromptManager() {
    const [prompts, setPrompts] = useState<Prompt[]>(EXAMPLE_PROMPTS);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Prompt | null>(null);
    const [form, setForm] = useState<Omit<Prompt, "id">>({
        name: "",
        description: "",
        template: "",
        persona_id: "",
        tags: [],
        approval_status: "draft"
    });

    const handleOpen = (prompt?: Prompt) => {
        setEditing(prompt || null);
        setForm(prompt ? { ...prompt } : {
            name: "",
            description: "",
            template: "",
            persona_id: "",
            tags: [],
            approval_status: "draft"
        });
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleSave = () => {
        if (editing) {
            setPrompts(ps => ps.map(p => p.id === editing.id ? { ...editing, ...form } : p));
        } else {
            setPrompts(ps => [...ps, { ...form, id: Date.now().toString() }]);
        }
        setOpen(false);
    };

    const handleDelete = (id: string) => setPrompts(ps => ps.filter(p => p.id !== id));

    const handleCopyPrompt = (prompt: Prompt) => {
        const newPrompt = {
            ...prompt,
            id: Date.now().toString(),
            name: prompt.name + " (Copy)",
            approval_status: "draft" as const
        };
        setPrompts(ps => [...ps, newPrompt]);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'text-theme-accent-success';
            case 'rejected': return 'text-theme-accent-error';
            default: return 'text-theme-accent-warning';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-theme-text-primary">Prompts</h2>
                <Button variant="primary" leftIcon="add" onClick={() => handleOpen()}>
                    Add Prompt
                </Button>
            </div>

            {/* Prompts List */}
            <div className="space-y-4">
                {prompts.map(prompt => (
                    <Card key={prompt.id} variant="default" padding="md">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <Icon name="file-text" size="md" className="text-theme-accent-primary" />
                                    <div>
                                        <h3 className="text-lg font-medium text-theme-text-primary">{prompt.name}</h3>
                                        <p className="text-sm text-theme-text-secondary">{prompt.description}</p>
                                    </div>
                                </div>

                                {/* Template Preview */}
                                <div className="mb-3">
                                    <p className="text-sm text-theme-text-secondary mb-1">Template:</p>
                                    <div className="bg-theme-bg-secondary p-3 rounded text-sm text-theme-text-primary font-mono">
                                        {prompt.template.length > 150
                                            ? `${prompt.template.substring(0, 150)}...`
                                            : prompt.template
                                        }
                                    </div>
                                </div>

                                {/* Persona & Tags */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {prompt.persona_id && (
                                        <span className="px-2 py-1 bg-theme-accent-info bg-opacity-20 text-theme-accent-info text-xs rounded">
                                            {MOCK_PERSONAS.find(p => p.id === prompt.persona_id)?.name || 'Unknown Persona'}
                                        </span>
                                    )}
                                    {prompt.tags.map((tag, i) => (
                                        <span key={i} className="px-2 py-1 bg-theme-accent-secondary bg-opacity-20 text-theme-accent-secondary text-xs rounded">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Status */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-theme-text-secondary">Status:</span>
                                    <span className={`text-sm font-medium capitalize ${getStatusColor(prompt.approval_status)}`}>
                                        {prompt.approval_status}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 ml-4">
                                <Button
                                    variant="tertiary"
                                    size="sm"
                                    leftIcon="edit"
                                    onClick={() => handleOpen(prompt)}
                                >
                                    Edit
                                </Button>
                                <Button
                                    variant="tertiary"
                                    size="sm"
                                    leftIcon="copy"
                                    onClick={() => handleCopyPrompt(prompt)}
                                >
                                    Copy
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    leftIcon="trash"
                                    onClick={() => handleDelete(prompt.id)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}

                {prompts.length === 0 && (
                    <Card variant="outlined" padding="lg" className="text-center">
                        <Icon name="file-text" size="xl" className="text-theme-text-muted mb-4" />
                        <h3 className="text-lg font-medium text-theme-text-primary mb-2">No prompts yet</h3>
                        <p className="text-theme-text-secondary mb-4">
                            Create reusable prompt templates for consistent AI interactions
                        </p>
                        <Button variant="primary" leftIcon="add" onClick={() => handleOpen()}>
                            Create Your First Prompt
                        </Button>
                    </Card>
                )}
            </div>

            {/* Edit/Create Modal */}
            <Modal isOpen={open} onClose={handleClose} title={editing ? "Edit Prompt" : "Add Prompt"}>
                <div className="space-y-4">
                    <FormField label="Name" required>
                        <Input
                            value={form.name}
                            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Enter prompt name"
                        />
                    </FormField>

                    <FormField label="Description" required>
                        <Input
                            value={form.description}
                            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="Describe what this prompt does"
                        />
                    </FormField>

                    <FormField label="Prompt Template" required helpText="Use {{variable}} for dynamic content">
                        <TextArea
                            rows={4}
                            value={form.template}
                            onChange={(e) => setForm(f => ({ ...f, template: e.target.value }))}
                            placeholder="Enter your prompt template with {{variables}}"
                        />
                    </FormField>

                    <FormField label="Persona">
                        <Select
                            value={form.persona_id}
                            onChange={(e) => setForm(f => ({ ...f, persona_id: e.target.value }))}
                        >
                            <option value="">Select a persona...</option>
                            {MOCK_PERSONAS.map(persona => (
                                <option key={persona.id} value={persona.id}>{persona.name}</option>
                            ))}
                        </Select>
                    </FormField>

                    <FormField label="Tags" helpText="Comma-separated tags">
                        <Input
                            value={form.tags.join(", ")}
                            onChange={(e) => setForm(f => ({ ...f, tags: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
                            placeholder="e.g., analysis, finance, decision-making"
                        />
                    </FormField>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSave}>
                            {editing ? "Update" : "Create"} Prompt
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
} 