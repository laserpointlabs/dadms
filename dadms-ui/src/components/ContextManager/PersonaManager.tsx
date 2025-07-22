import { Dispatch, SetStateAction, useState } from "react";
import { Modal } from '../ProjectDashboard/Modal';
import { Button, Card, Icon } from '../shared';
import { FormField, Input, Select, TextArea } from '../shared/FormField';

interface Persona {
    id: string;
    name: string;
    role: string;
    expertise: string[];
    guidelines: string;
    tags: string[];
    tool_ids: string[];
}

const MOCK_TAGS = ['finance', 'simulation', 'analysis', 'approval', 'external API'];
const MOCK_TOOLS = [
    { id: "1", name: "Sicilab API" },
    { id: "2", name: "Calculator" },
    { id: "3", name: "AFSIM" },
];

interface PersonaManagerProps {
    personas: Persona[];
    setPersonas: Dispatch<SetStateAction<Persona[]>>;
}

export default function PersonaManager({ personas, setPersonas }: PersonaManagerProps) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Persona | null>(null);
    const [form, setForm] = useState<Omit<Persona, "id">>({ name: "", role: "", expertise: [], guidelines: "", tags: [], tool_ids: [] });

    const handleOpen = (persona?: Persona) => {
        setEditing(persona || null);
        setForm(persona ? { ...persona } : { name: "", role: "", expertise: [], guidelines: "", tags: [], tool_ids: [] });
        setOpen(true);
    };
    const handleClose = () => setOpen(false);

    const handleSave = () => {
        if (editing) {
            setPersonas(ps => ps.map(p => p.id === editing.id ? { ...editing, ...form } : p));
        } else {
            setPersonas(ps => [...ps, { ...form, id: Date.now().toString() }]);
        }
        setOpen(false);
    };
    const handleDelete = (id: string) => setPersonas(ps => ps.filter(p => p.id !== id));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-theme-text-primary">Personas</h2>
                <Button variant="primary" leftIcon="add" onClick={() => handleOpen()}>
                    Add Persona
                </Button>
            </div>

            {/* Personas List */}
            <div className="space-y-4">
                {personas.map(persona => (
                    <Card key={persona.id} variant="default" padding="md">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <Icon name="robot" size="md" className="text-theme-accent-primary" />
                                    <div>
                                        <h3 className="text-lg font-medium text-theme-text-primary">{persona.name}</h3>
                                        <p className="text-sm text-theme-text-secondary">Role: {persona.role}</p>
                                    </div>
                                </div>

                                {/* Expertise */}
                                {persona.expertise.length > 0 && (
                                    <div className="mb-3">
                                        <p className="text-sm text-theme-text-secondary mb-1">Expertise:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {persona.expertise.map((skill, i) => (
                                                <span key={i} className="px-2 py-1 bg-theme-accent-primary bg-opacity-20 text-theme-accent-primary text-xs rounded">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Guidelines */}
                                <div className="mb-3">
                                    <p className="text-sm text-theme-text-secondary mb-1">Guidelines:</p>
                                    <p className="text-sm text-theme-text-primary">{persona.guidelines}</p>
                                </div>

                                {/* Tags */}
                                {persona.tags.length > 0 && (
                                    <div className="mb-3">
                                        <p className="text-sm text-theme-text-secondary mb-1">Tags:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {persona.tags.map((tag, i) => (
                                                <span key={i} className="px-2 py-1 bg-theme-accent-secondary bg-opacity-20 text-theme-accent-secondary text-xs rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Tools */}
                                {persona.tool_ids.length > 0 && (
                                    <div>
                                        <p className="text-sm text-theme-text-secondary mb-1">Tools:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {persona.tool_ids.map((toolId, i) => {
                                                const tool = MOCK_TOOLS.find(t => t.id === toolId);
                                                return tool ? (
                                                    <span key={i} className="px-2 py-1 bg-theme-accent-info bg-opacity-20 text-theme-accent-info text-xs rounded">
                                                        {tool.name}
                                                    </span>
                                                ) : null;
                                            })}
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
                                    onClick={() => handleOpen(persona)}
                                >
                                    Edit
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    leftIcon="trash"
                                    onClick={() => handleDelete(persona.id)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}

                {personas.length === 0 && (
                    <Card variant="outlined" padding="lg" className="text-center">
                        <Icon name="robot" size="xl" className="text-theme-text-muted mb-4" />
                        <h3 className="text-lg font-medium text-theme-text-primary mb-2">No personas yet</h3>
                        <p className="text-theme-text-secondary mb-4">
                            Create AI personas to define specific roles and expertise areas
                        </p>
                        <Button variant="primary" leftIcon="add" onClick={() => handleOpen()}>
                            Create Your First Persona
                        </Button>
                    </Card>
                )}
            </div>

            {/* Edit/Create Modal */}
            <Modal isOpen={open} onClose={handleClose} title={editing ? "Edit Persona" : "Add Persona"}>
                <div className="space-y-4">
                    <FormField label="Name" required>
                        <Input
                            value={form.name}
                            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Enter persona name"
                        />
                    </FormField>

                    <FormField label="Role" required>
                        <Input
                            value={form.role}
                            onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                            placeholder="Enter role or job title"
                        />
                    </FormField>

                    <FormField label="Expertise" helpText="Comma-separated skills and areas of expertise">
                        <Input
                            value={form.expertise.join(", ")}
                            onChange={(e) => setForm(f => ({ ...f, expertise: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
                            placeholder="e.g., Risk Analysis, Financial Modeling"
                        />
                    </FormField>

                    <FormField label="Guidelines" required>
                        <TextArea
                            rows={3}
                            value={form.guidelines}
                            onChange={(e) => setForm(f => ({ ...f, guidelines: e.target.value }))}
                            placeholder="Describe how this persona should behave and make decisions"
                        />
                    </FormField>

                    <FormField label="Tags">
                        <Select value={""} onChange={() => { }}>
                            <option value="">Select tags...</option>
                            {MOCK_TAGS.map(tag => (
                                <option key={tag} value={tag}>{tag}</option>
                            ))}
                        </Select>
                    </FormField>

                    <FormField label="Tools">
                        <Select value={""} onChange={() => { }}>
                            <option value="">Select tools...</option>
                            {MOCK_TOOLS.map(tool => (
                                <option key={tool.id} value={tool.id}>{tool.name}</option>
                            ))}
                        </Select>
                    </FormField>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSave}>
                            {editing ? "Update" : "Create"} Persona
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
} 