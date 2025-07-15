import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel, MenuItem, OutlinedInput, Select, TextField, Typography } from "@mui/material";
import { useState } from "react";

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

const MOCK_PERSONAS: Persona[] = [
    { id: "1", name: "Risk Analyst", role: "Analyst", expertise: ["Risk", "Finance"], guidelines: "Be thorough and cautious.", tags: ['finance', 'analysis'], tool_ids: ["2"] },
    { id: "2", name: "Mission Simulation Expert", role: "Simulation Expert", expertise: ["Simulation", "Mission Planning"], guidelines: "Use all available simulation tools.", tags: ['simulation'], tool_ids: ["1", "3"] },
];

export default function PersonaManager() {
    const [personas, setPersonas] = useState<Persona[]>(MOCK_PERSONAS);
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
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Personas</Typography>
                <Button variant="contained" onClick={() => handleOpen()}>Add Persona</Button>
            </Box>
            {personas.map(p => (
                <Card key={p.id} sx={{ mb: 2 }}>
                    <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                                <Typography variant="subtitle1" fontWeight={600}>{p.name}</Typography>
                                <Typography variant="body2" color="text.secondary">Role: {p.role}</Typography>
                                <Box mt={1} mb={1}>
                                    {p.expertise.map((e, i) => <Chip key={i} label={e} size="small" sx={{ mr: 1 }} />)}
                                </Box>
                                <Typography variant="body2">Guidelines: {p.guidelines}</Typography>
                                <Box mt={1}>
                                    {p.tags.map((tag, i) => <Chip key={i} label={tag} size="small" color="primary" sx={{ mr: 1 }} />)}
                                </Box>
                                <Box mt={1}>
                                    {p.tool_ids.map((tid, i) => <Chip key={i} label={MOCK_TOOLS.find(t => t.id === tid)?.name || tid} size="small" color="secondary" sx={{ mr: 1 }} />)}
                                </Box>
                            </Box>
                            <Box>
                                <IconButton onClick={() => handleOpen(p)}><EditIcon /></IconButton>
                                <IconButton onClick={() => handleDelete(p.id)} color="error"><DeleteIcon /></IconButton>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            ))}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{editing ? "Edit Persona" : "Add Persona"}</DialogTitle>
                <DialogContent>
                    <TextField label="Name" fullWidth margin="normal" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    <TextField label="Role" fullWidth margin="normal" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
                    <TextField label="Expertise (comma separated)" fullWidth margin="normal" value={form.expertise.join(", ")} onChange={e => setForm(f => ({ ...f, expertise: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))} />
                    <TextField label="Guidelines" fullWidth margin="normal" multiline rows={2} value={form.guidelines} onChange={e => setForm(f => ({ ...f, guidelines: e.target.value }))} />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Tags</InputLabel>
                        <Select
                            multiple
                            value={form.tags}
                            onChange={e => setForm(f => ({ ...f, tags: e.target.value as string[] }))}
                            input={<OutlinedInput label="Tags" />}
                            renderValue={(selected) => (selected as string[]).join(", ")}
                        >
                            {MOCK_TAGS.map(tag => (
                                <MenuItem key={tag} value={tag}>
                                    {tag}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Tools</InputLabel>
                        <Select
                            multiple
                            value={form.tool_ids}
                            onChange={e => setForm(f => ({ ...f, tool_ids: e.target.value as string[] }))}
                            input={<OutlinedInput label="Tools" />}
                            renderValue={(selected) => (selected as string[]).map(tid => MOCK_TOOLS.find(t => t.id === tid)?.name || tid).join(", ")}
                        >
                            {MOCK_TOOLS.map(tool => (
                                <MenuItem key={tool.id} value={tool.id}>
                                    {tool.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
} 