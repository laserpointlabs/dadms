import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ScienceIcon from "@mui/icons-material/Science";
import { Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel, MenuItem, OutlinedInput, Select, TextField, Typography } from "@mui/material";
import { useState } from "react";

// Mock data for personas and tools
const MOCK_PERSONAS = [
    { id: "1", name: "Risk Analyst", tool_ids: ["2"] },
    { id: "2", name: "Process Owner", tool_ids: ["3"] },
];
const MOCK_TOOLS = [
    { id: "1", name: "Sicilab API" },
    { id: "2", name: "Calculator" },
    { id: "3", name: "AFSIM" },
];
const MOCK_MODELS = ["gpt-4", "claude-3-opus", "llama2"];
const MOCK_TAGS = ['finance', 'simulation', 'analysis', 'approval', 'external API'];

const EXAMPLE_PROMPTS = [
    {
        id: "101",
        name: "Business Decision Analysis",
        description: "Analyze business options and recommend the best course of action.",
        template: "Given the following options: {{options}}, analyze the pros and cons and recommend the best choice.",
        persona_id: "1",
        tags: ['finance', 'analysis'],
        test_cases: [
            {
                id: "tc1",
                input_context: '{"options": "Expand to Europe, Focus on US market"}',
                expected_output: "Recommend based on market analysis and risk."
            }
        ],
        approval_status: "approved"
    },
    {
        id: "102",
        name: "Mission Simulation",
        description: "Run a mission simulation using AFSIM.",
        template: "Simulate the following mission: {{mission}}.",
        persona_id: "2",
        tags: ['simulation'],
        test_cases: [
            {
                id: "tc2",
                input_context: '{"mission": "Recon over Area 51"}',
                expected_output: "Simulation results for Area 51 recon."
            }
        ],
        approval_status: "draft"
    }
];

function randomPass() { return Math.random() > 0.2; }

export default function PromptManager() {
    const [prompts, setPrompts] = useState<any[]>(EXAMPLE_PROMPTS);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);
    const [form, setForm] = useState<any>({ name: "", description: "", template: "", persona_id: "", tags: [], test_cases: [], approval_status: "draft" });
    const [testOpen, setTestOpen] = useState(false);
    const [testPrompt, setTestPrompt] = useState<any | null>(null);
    const [testConfig, setTestConfig] = useState({ models: [MOCK_MODELS[0]], runs: 10 });
    const [testResults, setTestResults] = useState<any[]>([]);

    // CRUD
    const handleOpen = (prompt?: any) => {
        setEditing(prompt || null);
        setForm(prompt ? { ...prompt } : { name: "", description: "", template: "", persona_id: "", tags: [], test_cases: [], approval_status: "draft" });
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

    // Copy Prompt
    const handleCopyPrompt = (prompt: any) => {
        // Deep copy prompt, new id, new test case ids, name with (Copy)
        const newPrompt = {
            ...prompt,
            id: Date.now().toString(),
            name: prompt.name + " (Copy)",
            test_cases: prompt.test_cases.map((tc: any) => ({
                ...tc,
                id: Date.now().toString() + Math.random().toString().slice(2, 8),
                input_context: tc.input_context,
                expected_output: tc.expected_output
            })),
            approval_status: "draft"
        };
        setPrompts(ps => [...ps, newPrompt]);
    };

    // Copy Test Case
    const copyTestCase = (idx: number) => setForm(f => {
        const tcs = [...f.test_cases];
        const tc = tcs[idx];
        const newTc = {
            ...tc,
            id: Date.now().toString() + Math.random().toString().slice(2, 8),
            input_context: tc.input_context,
            expected_output: tc.expected_output
        };
        tcs.splice(idx + 1, 0, newTc);
        return { ...f, test_cases: tcs };
    });

    // Test dialog
    const openTestDialog = (prompt: any) => {
        setTestPrompt(prompt);
        setTestConfig({ models: [MOCK_MODELS[0]], runs: 10 });
        setTestResults([]);
        setTestOpen(true);
    };
    const closeTestDialog = () => setTestOpen(false);
    const runProbTest = () => {
        // Simulate probabilistic test: for each model, run N times, count passes
        const results = testConfig.models.map(model => {
            let passes = 0;
            for (let i = 0; i < testConfig.runs; i++) {
                if (randomPass()) passes++;
            }
            return {
                model,
                runs: testConfig.runs,
                passes,
                percent: Math.round((passes / testConfig.runs) * 100),
            };
        });
        setTestResults(results);
    };

    // Test case management
    const addTestCase = () => setForm(f => ({ ...f, test_cases: [...(f.test_cases || []), { id: Date.now().toString(), input_context: "", expected_output: "" }] }));
    const updateTestCase = (idx: number, field: string, value: any) => setForm(f => {
        const tcs = [...f.test_cases];
        tcs[idx] = { ...tcs[idx], [field]: value };
        return { ...f, test_cases: tcs };
    });
    const removeTestCase = (idx: number) => setForm(f => {
        const tcs = [...f.test_cases];
        tcs.splice(idx, 1);
        return { ...f, test_cases: tcs };
    });

    // When persona changes, just update persona_id
    const handlePersonaChange = (personaId: string) => {
        setForm(f => ({ ...f, persona_id: personaId }));
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Prompts</Typography>
                <Button variant="contained" onClick={() => handleOpen()}>Add Prompt</Button>
            </Box>
            {prompts.map(p => (
                <Card key={p.id} sx={{ mb: 2 }}>
                    <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                                <Typography variant="subtitle1" fontWeight={600}>{p.name}</Typography>
                                <Typography variant="body2" color="text.secondary">{p.description}</Typography>
                                <Box mt={1} mb={1}>
                                    {p.persona_id && <Chip label={MOCK_PERSONAS.find(per => per.id === p.persona_id)?.name || p.persona_id} size="small" color="info" sx={{ mr: 1 }} />}
                                    {p.tags && p.tags.map((tag: string, i: number) => <Chip key={i} label={tag} size="small" color="primary" sx={{ mr: 1 }} />)}
                                </Box>
                                <Typography variant="caption" color="text.secondary">Status: {p.approval_status}</Typography>
                            </Box>
                            <Box>
                                <IconButton onClick={() => handleOpen(p)}><EditIcon /></IconButton>
                                <IconButton onClick={() => handleDelete(p.id)} color="error"><DeleteIcon /></IconButton>
                                <IconButton onClick={() => handleCopyPrompt(p)} color="info" title="Copy prompt"><ContentCopyIcon /></IconButton>
                                <Button variant="outlined" startIcon={<ScienceIcon />} onClick={() => openTestDialog(p)} sx={{ ml: 1 }}>Test</Button>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            ))}
            {/* Edit/Create Dialog */}
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>{editing ? "Edit Prompt" : "Add Prompt"}</DialogTitle>
                <DialogContent>
                    <TextField label="Name" fullWidth margin="normal" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    <TextField label="Description" fullWidth margin="normal" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                    <TextField label="Prompt Template" fullWidth margin="normal" multiline rows={3} value={form.template} onChange={e => setForm(f => ({ ...f, template: e.target.value }))} />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Persona</InputLabel>
                        <Select
                            value={form.persona_id}
                            onChange={e => handlePersonaChange(e.target.value as string)}
                            input={<OutlinedInput label="Persona" />}
                        >
                            {MOCK_PERSONAS.map(p => (
                                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
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
                    <Box mt={2} mb={1} display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2">Test Cases</Typography>
                        <Button size="small" variant="outlined" onClick={addTestCase}>Add Test Case</Button>
                    </Box>
                    {form.test_cases.map((tc: any, idx: number) => (
                        <Card key={tc.id} sx={{ mb: 2, p: 2 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="body2">Test Case {idx + 1}</Typography>
                                <Box>
                                    <IconButton size="small" onClick={() => copyTestCase(idx)} color="info" title="Copy test case"><ContentCopyIcon /></IconButton>
                                    <IconButton size="small" onClick={() => removeTestCase(idx)} color="error"><DeleteIcon /></IconButton>
                                </Box>
                            </Box>
                            <TextField label="Input Context (JSON)" fullWidth margin="normal" value={tc.input_context} onChange={e => updateTestCase(idx, "input_context", e.target.value)} />
                            <TextField label="Expected Output" fullWidth margin="normal" value={tc.expected_output} onChange={e => updateTestCase(idx, "expected_output", e.target.value)} />
                        </Card>
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
            {/* Probabilistic Test Dialog */}
            <Dialog open={testOpen} onClose={closeTestDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Probabilistic Test: {testPrompt?.name}</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Models</InputLabel>
                        <Select multiple value={testConfig.models} onChange={e => setTestConfig(cfg => ({ ...cfg, models: e.target.value }))} label="Models">
                            {MOCK_MODELS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <TextField label="Runs per Model" type="number" fullWidth margin="normal" value={testConfig.runs} onChange={e => setTestConfig(cfg => ({ ...cfg, runs: Math.max(1, parseInt(e.target.value) || 1) }))} />
                    <Button variant="contained" onClick={runProbTest} sx={{ mt: 2 }}>Run Test</Button>
                    {testResults.length > 0 && (
                        <Box mt={3}>
                            <Typography variant="subtitle2">Results</Typography>
                            {testResults.map(res => (
                                <Box key={res.model} mb={2}>
                                    <Typography variant="body2"><b>{res.model}</b>: {res.passes}/{res.runs} correct ({res.percent}%)</Typography>
                                    <Box height={8} width={"100%"} bgcolor="#eee" borderRadius={2} mt={0.5}>
                                        <Box height={8} width={`${res.percent}%`} bgcolor={res.percent >= 95 ? "#4caf50" : "#f44336"} borderRadius={2} />
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeTestDialog}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
} 