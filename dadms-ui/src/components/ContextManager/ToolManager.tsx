import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel, MenuItem, OutlinedInput, Select, TextField, Typography } from "@mui/material";
import { useState } from "react";

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
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Tools</Typography>
                <Button variant="contained" onClick={() => handleOpen()}>Add Tool</Button>
            </Box>
            {tools.map(t => (
                <Card key={t.id} sx={{ mb: 2 }}>
                    <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                                <Typography variant="subtitle1" fontWeight={600}>{t.name}</Typography>
                                <Typography variant="body2" color="text.secondary">{t.description}</Typography>
                                {t.api_spec && <Typography variant="caption" color="text.secondary">API: {t.api_spec}</Typography>}
                                <Box mt={1}>
                                    {t.tags.map((tag, i) => <Chip key={i} label={tag} size="small" color="primary" sx={{ mr: 1 }} />)}
                                </Box>
                            </Box>
                            <Box>
                                <IconButton onClick={() => handleOpen(t)}><EditIcon /></IconButton>
                                <IconButton onClick={() => handleDelete(t.id)} color="error"><DeleteIcon /></IconButton>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            ))}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{editing ? "Edit Tool" : "Add Tool"}</DialogTitle>
                <DialogContent>
                    <TextField label="Name" fullWidth margin="normal" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    <TextField label="Description" fullWidth margin="normal" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                    <TextField label="API Spec (optional)" fullWidth margin="normal" value={form.api_spec} onChange={e => setForm(f => ({ ...f, api_spec: e.target.value }))} />
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
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
} 