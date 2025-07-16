import { Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, InputLabel, List, ListItem, ListItemText, MenuItem, OutlinedInput, Select, TextField, Typography } from '@mui/material';
import React, { useState } from 'react';
// Local Team type for this component
interface Team {
    id: string;
    name: string;
    description?: string;
    persona_ids: string[];
    uses_moderator: boolean;
    moderator_id?: string;
    decision_type: string;
}

const DECISION_TYPES = [
    { value: 'voting', label: 'Voting (majority/plurality)' },
    { value: 'moderator', label: 'Moderator decides' },
    { value: 'third_party', label: 'Third party decides' },
    { value: 'consensus', label: 'Consensus (all must agree)' },
    { value: 'random', label: 'Random/Lottery' },
];

const initialTeams: Team[] = [
    { id: 't1', name: 'AI Experts', description: 'LLM and AI specialists', persona_ids: ['1', '2'], uses_moderator: false, decision_type: 'voting' },
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
        uses_moderator: boolean;
        moderator_id?: string;
        decision_type: string;
    }>({ name: '', description: '', persona_ids: [], uses_moderator: false, moderator_id: undefined, decision_type: 'voting' });

    const handleOpen = (team?: Team) => {
        if (team) {
            setEditingTeam(team);
            setForm({
                name: team.name,
                description: team.description || '',
                persona_ids: team.persona_ids,
                uses_moderator: team.uses_moderator || false,
                moderator_id: team.moderator_id,
                decision_type: team.decision_type || 'voting',
            });
        } else {
            setEditingTeam(null);
            setForm({ name: '', description: '', persona_ids: [], uses_moderator: false, moderator_id: undefined, decision_type: 'voting' });
        }
        setOpen(true);
    };
    const handleClose = () => setOpen(false);

    const handleSave = () => {
        if (editingTeam) {
            setTeams(ts => ts.map(t => t.id === editingTeam.id ? { ...editingTeam, ...form } : t));
        } else {
            setTeams(ts => [...ts, { id: Date.now().toString(), ...form }]);
        }
        setOpen(false);
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Teams</Typography>
                <Button variant="contained" onClick={() => handleOpen()}>Create Team</Button>
            </Box>
            <List>
                {teams.map(team => (
                    <ListItem key={team.id}>
                        <ListItemText
                            primary={team.name}
                            secondary={<>
                                {team.description && <>{team.description}<br /></>}
                                <b>Decision Type:</b> {DECISION_TYPES.find(dt => dt.value === team.decision_type)?.label || team.decision_type}<br />
                                {team.uses_moderator && team.moderator_id && (
                                    <>
                                        <b>Moderator:</b> {personas.find(p => p.id === team.moderator_id)?.name || team.moderator_id}<br />
                                    </>
                                )}
                            </>}
                        />
                        <Box>
                            {team.persona_ids.map((pid: string) => {
                                const persona = personas.find(p => p.id === pid);
                                return persona ? <Chip key={pid} label={persona.name} sx={{ mr: 1 }} /> : null;
                            })}
                        </Box>
                        <Button size="small" onClick={() => handleOpen(team)} sx={{ ml: 2 }}>Edit</Button>
                    </ListItem>
                ))}
            </List>
            {/* Dialog for create/edit team */}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{editingTeam ? 'Edit Team' : 'Create Team'}</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Name"
                        fullWidth
                        margin="normal"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    />
                    <TextField
                        label="Description"
                        fullWidth
                        margin="normal"
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Personas</InputLabel>
                        <Select
                            multiple
                            value={form.persona_ids}
                            onChange={e => setForm(f => ({ ...f, persona_ids: e.target.value as string[] }))}
                            input={<OutlinedInput label="Personas" />}
                            renderValue={(selected) => (selected as string[]).map(pid => personas.find(p => p.id === pid)?.name || pid).join(", ")}
                        >
                            {personas.map(p => (
                                <MenuItem key={p.id} value={p.id}>
                                    {p.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={form.uses_moderator}
                                onChange={e => setForm(f => ({ ...f, uses_moderator: e.target.checked, moderator_id: e.target.checked ? f.moderator_id : undefined }))}
                            />
                        }
                        label="Team employs a moderator"
                        sx={{ mt: 2 }}
                    />
                    {form.uses_moderator && (
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Moderator Persona</InputLabel>
                            <Select
                                value={form.moderator_id || ''}
                                onChange={e => setForm(f => ({ ...f, moderator_id: e.target.value as string }))}
                                input={<OutlinedInput label="Moderator Persona" />}
                            >
                                {personas.map(p => (
                                    <MenuItem key={p.id} value={p.id}>
                                        {p.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Decision Agreement Type</InputLabel>
                        <Select
                            value={form.decision_type}
                            onChange={e => setForm(f => ({ ...f, decision_type: e.target.value as string }))}
                            input={<OutlinedInput label="Decision Agreement Type" />}
                        >
                            {DECISION_TYPES.map(dt => (
                                <MenuItem key={dt.value} value={dt.value}>{dt.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button color="primary" variant="contained" onClick={handleSave}>Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TeamsTab; 