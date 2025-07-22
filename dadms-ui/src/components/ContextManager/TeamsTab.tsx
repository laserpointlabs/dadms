import React, { useState } from 'react';
import { Modal } from '../ProjectDashboard/Modal';
import { Button, Card, Icon } from '../shared';
import { FormField, Input, Select, TextArea } from '../shared/FormField';

// Local Team type for this component
interface Team {
    id: string;
    name: string;
    description?: string;
    persona_ids: string[];
    decision_type: string;
}

const DECISION_TYPES = [
    { value: 'voting', label: 'Voting (majority)' },
    { value: 'consensus', label: 'Consensus (all agree)' },
    { value: 'moderator', label: 'Moderator decides' },
    { value: 'random', label: 'Random selection' },
];

const initialTeams: Team[] = [
    {
        id: 't1',
        name: 'AI Experts',
        description: 'LLM and AI specialists for technical decisions',
        persona_ids: ['1', '2'],
        decision_type: 'voting'
    },
    {
        id: 't2',
        name: 'Risk Assessment Team',
        description: 'Financial and operational risk evaluation',
        persona_ids: ['1'],
        decision_type: 'consensus'
    },
];

interface TeamsTabProps {
    personas: { id: string; name: string }[];
}

const TeamsTab: React.FC<TeamsTabProps> = ({ personas }) => {
    const [teams, setTeams] = useState<Team[]>(initialTeams);
    const [open, setOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [form, setForm] = useState<{
        name: string;
        description: string;
        persona_ids: string[];
        decision_type: string;
    }>({ name: '', description: '', persona_ids: [], decision_type: 'voting' });

    const handleOpen = (team?: Team) => {
        if (team) {
            setEditingTeam(team);
            setForm({
                name: team.name,
                description: team.description || '',
                persona_ids: team.persona_ids,
                decision_type: team.decision_type,
            });
        } else {
            setEditingTeam(null);
            setForm({ name: '', description: '', persona_ids: [], decision_type: 'voting' });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditingTeam(null);
    };

    const handleSave = () => {
        if (editingTeam) {
            setTeams(ts => ts.map(t => t.id === editingTeam.id ? { ...editingTeam, ...form } : t));
        } else {
            setTeams(ts => [...ts, { ...form, id: Date.now().toString() }]);
        }
        handleClose();
    };

    const handleDelete = (id: string) => {
        setTeams(ts => ts.filter(t => t.id !== id));
    };

    const getDecisionTypeLabel = (value: string) => {
        return DECISION_TYPES.find(dt => dt.value === value)?.label || value;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-theme-text-primary">Teams</h2>
                <Button variant="primary" leftIcon="add" onClick={() => handleOpen()}>
                    Add Team
                </Button>
            </div>

            {/* Teams List */}
            <div className="space-y-4">
                {teams.map(team => (
                    <Card key={team.id} variant="default" padding="md">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <Icon name="type-hierarchy" size="md" className="text-theme-accent-primary" />
                                    <div>
                                        <h3 className="text-lg font-medium text-theme-text-primary">{team.name}</h3>
                                        {team.description && (
                                            <p className="text-sm text-theme-text-secondary">{team.description}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Team Members */}
                                <div className="mb-3">
                                    <p className="text-sm text-theme-text-secondary mb-1">
                                        Members ({team.persona_ids.length}):
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {team.persona_ids.map(personaId => {
                                            const persona = personas.find(p => p.id === personaId);
                                            return persona ? (
                                                <span key={personaId} className="px-2 py-1 bg-theme-accent-primary bg-opacity-20 text-theme-accent-primary text-xs rounded">
                                                    {persona.name}
                                                </span>
                                            ) : null;
                                        })}
                                        {team.persona_ids.length === 0 && (
                                            <span className="text-theme-text-muted text-xs">No members assigned</span>
                                        )}
                                    </div>
                                </div>

                                {/* Decision Type */}
                                <div>
                                    <p className="text-sm text-theme-text-secondary mb-1">Decision Method:</p>
                                    <span className="px-2 py-1 bg-theme-accent-info bg-opacity-20 text-theme-accent-info text-xs rounded">
                                        {getDecisionTypeLabel(team.decision_type)}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 ml-4">
                                <Button
                                    variant="tertiary"
                                    size="sm"
                                    leftIcon="edit"
                                    onClick={() => handleOpen(team)}
                                >
                                    Edit
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    leftIcon="trash"
                                    onClick={() => handleDelete(team.id)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}

                {teams.length === 0 && (
                    <Card variant="outlined" padding="lg" className="text-center">
                        <Icon name="type-hierarchy" size="xl" className="text-theme-text-muted mb-4" />
                        <h3 className="text-lg font-medium text-theme-text-primary mb-2">No teams yet</h3>
                        <p className="text-theme-text-secondary mb-4">
                            Create teams of personas with specific decision-making protocols
                        </p>
                        <Button variant="primary" leftIcon="add" onClick={() => handleOpen()}>
                            Create Your First Team
                        </Button>
                    </Card>
                )}
            </div>

            {/* Edit/Create Modal */}
            <Modal isOpen={open} onClose={handleClose} title={editingTeam ? "Edit Team" : "Add Team"}>
                <div className="space-y-4">
                    <FormField label="Team Name" required>
                        <Input
                            value={form.name}
                            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Enter team name"
                        />
                    </FormField>

                    <FormField label="Description" helpText="Optional description of the team's purpose">
                        <TextArea
                            rows={2}
                            value={form.description}
                            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="Describe what this team does"
                        />
                    </FormField>

                    <FormField label="Decision Method" required>
                        <Select
                            value={form.decision_type}
                            onChange={(e) => setForm(f => ({ ...f, decision_type: e.target.value }))}
                        >
                            {DECISION_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </Select>
                    </FormField>

                    <FormField label="Team Members" helpText="Select personas to include in this team">
                        <div className="space-y-2 max-h-32 overflow-y-auto p-2 border border-theme-input-border rounded">
                            {personas.map(persona => (
                                <label key={persona.id} className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={form.persona_ids.includes(persona.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setForm(f => ({ ...f, persona_ids: [...f.persona_ids, persona.id] }));
                                            } else {
                                                setForm(f => ({ ...f, persona_ids: f.persona_ids.filter(id => id !== persona.id) }));
                                            }
                                        }}
                                        className="text-theme-accent-primary"
                                    />
                                    <span className="text-theme-text-primary">{persona.name}</span>
                                </label>
                            ))}
                        </div>
                    </FormField>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSave}>
                            {editingTeam ? "Update" : "Create"} Team
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default TeamsTab; 