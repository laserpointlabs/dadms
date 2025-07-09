import {
    Add,
    AutoAwesome,
    Build,
    CheckCircle,
    Code,
    Delete,
    Edit,
    Error,
    ExpandMore,
    Help,
    HelpOutline,
    Info,
    LightbulbOutlined,
    PlayArrow,
    Psychology,
    Refresh,
    Visibility,
    Warning,
} from '@mui/icons-material';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import type { CreatePromptRequest, Finding, Prompt, TestCase, TestResult, TestSummary } from '../services/microservices-api';
import { aiOversightService, promptService } from '../services/microservices-api';

interface PromptManagerProps {
    onSelectPrompt?: (prompt: Prompt) => void;
}

// Example prompts and templates
const PROMPT_EXAMPLES = {
    simple: [
        {
            title: "Data Analysis Request",
            text: "Analyze the following dataset and provide key insights: {data}\n\nPlease focus on:\n1. Trends and patterns\n2. Anomalies or outliers\n3. Actionable recommendations",
            tags: ["analysis", "data", "insights"],
            description: "A general-purpose prompt for data analysis tasks"
        },
        {
            title: "Code Review Assistant",
            text: "Review the following code and provide feedback:\n\n{code}\n\nPlease check for:\n- Code quality and best practices\n- Potential bugs or security issues\n- Performance optimizations\n- Documentation completeness",
            tags: ["code", "review", "quality"],
            description: "Perfect for automated code review processes"
        },
        {
            title: "Meeting Summary Generator",
            text: "Create a concise summary of the following meeting transcript:\n\n{transcript}\n\nInclude:\n- Key decisions made\n- Action items assigned\n- Next steps and deadlines",
            tags: ["meeting", "summary", "productivity"],
            description: "Summarize meeting notes and extract action items"
        }
    ],
    "tool-aware": [
        {
            title: "Performance Analysis with Tools",
            text: "Analyze the system performance data using available monitoring tools: {metrics}\n\nUse performance-analyzer tool to:\n1. Identify bottlenecks\n2. Calculate efficiency metrics\n3. Generate optimization recommendations\n\nProvide both automated analysis and human-readable summary.",
            tags: ["performance", "tools", "monitoring"],
            description: "Integrates with performance monitoring tools",
            tool_dependencies: ["performance-analyzer", "metrics-processor"]
        },
        {
            title: "Document Processing Pipeline",
            text: "Process the uploaded document using text analysis tools: {document}\n\nWorkflow:\n1. Extract text using OCR if needed\n2. Perform sentiment analysis\n3. Extract key entities and topics\n4. Generate structured summary\n\nReturn results in JSON format with confidence scores.",
            tags: ["document", "nlp", "processing"],
            description: "Multi-tool document analysis pipeline",
            tool_dependencies: ["ocr-service", "sentiment-analyzer", "entity-extractor"]
        }
    ],
    "workflow-aware": [
        {
            title: "Multi-Stage Data Pipeline",
            text: "Execute a comprehensive data processing workflow:\n\nInput: {raw_data}\n\nStages:\n1. Data validation and cleaning\n2. Feature engineering\n3. Model training/inference\n4. Results validation\n5. Report generation\n\nEach stage should validate inputs and provide progress updates.",
            tags: ["workflow", "data", "pipeline"],
            description: "Complex multi-stage data processing",
            workflow_dependencies: ["data-processing-workflow"]
        }
    ]
};

const TEST_CASE_EXAMPLES = [
    {
        name: "Basic functionality test",
        input: { data: "Sample dataset with 100 rows and 5 columns" },
        expected_output: { insights: "Key trends identified", recommendations: "3 actionable items" },
        description: "Tests basic prompt functionality with typical input"
    },
    {
        name: "Edge case - empty input",
        input: { data: "" },
        expected_output: { error: "No data provided" },
        description: "Tests how prompt handles empty or null inputs"
    },
    {
        name: "Large dataset test",
        input: { data: "Large dataset with 10,000 rows and 50 columns" },
        expected_output: { insights: "Comprehensive analysis", performance: "< 30 seconds" },
        description: "Tests prompt performance with large inputs"
    }
];

const PromptManager: React.FC<PromptManagerProps> = ({ onSelectPrompt }) => {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [testDialogOpen, setTestDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [helpDialogOpen, setHelpDialogOpen] = useState(false);
    const [examplesDialogOpen, setExamplesDialogOpen] = useState(false);
    const [testResults, setTestResults] = useState<{ results: TestResult[]; summary: TestSummary } | null>(null);
    const [findings, setFindings] = useState<Finding[]>([]);
    const [exampleMenuAnchor, setExampleMenuAnchor] = useState<null | HTMLElement>(null);
    const [formData, setFormData] = useState<CreatePromptRequest>({
        text: '',
        type: 'simple',
        test_cases: [],
        tool_dependencies: [],
        workflow_dependencies: [],
        tags: [],
        metadata: {},
    });

    // Load prompts on component mount
    useEffect(() => {
        loadPrompts();
        loadFindings();
    }, []);

    const loadPrompts = async () => {
        try {
            setLoading(true);
            const response = await promptService.getPrompts();
            setPrompts(response.data.data);
        } catch (err) {
            setError('Failed to load prompts');
            console.error('Error loading prompts:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadFindings = async () => {
        try {
            const response = await aiOversightService.getFindings({ entity_type: 'prompt', resolved: false });
            setFindings(response.data.data);
        } catch (err) {
            console.error('Error loading findings:', err);
        }
    };

    const handleCreatePrompt = async () => {
        try {
            setLoading(true);
            const response = await promptService.createPrompt(formData);
            setPrompts([...prompts, response.data.data]);
            setSuccess('Prompt created successfully');
            setDialogOpen(false);
            resetForm();
            await loadFindings(); // Refresh findings after creation
        } catch (err) {
            setError('Failed to create prompt');
            console.error('Error creating prompt:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePrompt = async () => {
        if (!selectedPrompt) return;
        try {
            setLoading(true);
            const response = await promptService.updatePrompt(selectedPrompt.id, formData);
            setPrompts(prompts.map(p => p.id === selectedPrompt.id ? response.data.data : p));
            setSuccess('Prompt updated successfully');
            setDialogOpen(false);
            resetForm();
            await loadFindings(); // Refresh findings after update
        } catch (err) {
            setError('Failed to update prompt');
            console.error('Error updating prompt:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePrompt = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this prompt?')) return;
        try {
            setLoading(true);
            await promptService.deletePrompt(id);
            setPrompts(prompts.filter(p => p.id !== id));
            setSuccess('Prompt deleted successfully');
            await loadFindings(); // Refresh findings after deletion
        } catch (err) {
            setError('Failed to delete prompt');
            console.error('Error deleting prompt:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleTestPrompt = async (prompt: Prompt) => {
        try {
            setLoading(true);
            const response = await promptService.testPrompt(prompt.id);
            setTestResults(response.data.data);
            setTestDialogOpen(true);
        } catch (err) {
            setError('Failed to test prompt');
            console.error('Error testing prompt:', err);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            text: '',
            type: 'simple',
            test_cases: [],
            tool_dependencies: [],
            workflow_dependencies: [],
            tags: [],
            metadata: {},
        });
        setSelectedPrompt(null);
    };

    const openEditDialog = (prompt: Prompt) => {
        setSelectedPrompt(prompt);
        setFormData({
            text: prompt.text,
            type: prompt.type,
            test_cases: prompt.test_cases,
            tool_dependencies: prompt.tool_dependencies,
            workflow_dependencies: prompt.workflow_dependencies,
            tags: prompt.tags,
            metadata: prompt.metadata,
        });
        setDialogOpen(true);
    };

    const openViewDialog = (prompt: Prompt) => {
        setSelectedPrompt(prompt);
        setViewDialogOpen(true);
    };

    const addTestCase = () => {
        const newTestCase: Omit<TestCase, 'id'> = {
            name: '',
            input: {},
            expected_output: {},
            enabled: true,
        };
        setFormData({
            ...formData,
            test_cases: [...(formData.test_cases || []), newTestCase],
        });
    };

    const addExampleTestCase = (example: any) => {
        const newTestCase: Omit<TestCase, 'id'> = {
            name: example.name,
            input: example.input,
            expected_output: example.expected_output,
            enabled: true,
        };
        setFormData({
            ...formData,
            test_cases: [...(formData.test_cases || []), newTestCase],
        });
    };

    const updateTestCase = (index: number, field: keyof TestCase, value: any) => {
        const updatedTestCases = [...(formData.test_cases || [])];
        updatedTestCases[index] = { ...updatedTestCases[index], [field]: value };
        setFormData({ ...formData, test_cases: updatedTestCases });
    };

    const removeTestCase = (index: number) => {
        const updatedTestCases = [...(formData.test_cases || [])];
        updatedTestCases.splice(index, 1);
        setFormData({ ...formData, test_cases: updatedTestCases });
    };

    const loadExample = (example: any) => {
        setFormData({
            text: example.text,
            type: formData.type,
            test_cases: [],
            tool_dependencies: example.tool_dependencies || [],
            workflow_dependencies: example.workflow_dependencies || [],
            tags: example.tags,
            metadata: { example: true, description: example.description },
        });
        setExampleMenuAnchor(null);
    };

    const getPromptFindings = (promptId: string) => {
        return findings.filter(f => f.entity_id === promptId);
    };

    const getFindingIcon = (level: string) => {
        switch (level) {
            case 'error': return <Error color="error" />;
            case 'warning': return <Warning color="warning" />;
            case 'suggestion': return <Info color="info" />;
            default: return <Info color="info" />;
        }
    };

    const getFindingColor = (level: string) => {
        switch (level) {
            case 'error': return 'error';
            case 'warning': return 'warning';
            case 'suggestion': return 'info';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h4">Prompt Management</Typography>
                    <Tooltip title="Get help using the Prompt Manager">
                        <IconButton onClick={() => setHelpDialogOpen(true)} sx={{ ml: 1 }}>
                            <HelpOutline color="primary" />
                        </IconButton>
                    </Tooltip>
                </Box>
                <Box>
                    <Tooltip title="View examples and templates">
                        <Button
                            variant="outlined"
                            startIcon={<LightbulbOutlined />}
                            onClick={() => setExamplesDialogOpen(true)}
                            sx={{ mr: 1 }}
                        >
                            Examples
                        </Button>
                    </Tooltip>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={() => { loadPrompts(); loadFindings(); }}
                        sx={{ mr: 1 }}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => { resetForm(); setDialogOpen(true); }}
                    >
                        Create Prompt
                    </Button>
                </Box>
            </Box>

            {/* Help Banner */}
            <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                    <strong>Quick Start:</strong> Create prompts to define AI instructions, add test cases to validate behavior,
                    and monitor AI agent findings for quality improvement.
                    <Button size="small" onClick={() => setHelpDialogOpen(true)} sx={{ ml: 1 }}>
                        Learn More
                    </Button>
                </Typography>
            </Alert>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            )}

            <Grid container spacing={3}>
                {prompts.map((prompt) => {
                    const promptFindings = getPromptFindings(prompt.id);
                    return (
                        <Grid item xs={12} md={6} lg={4} key={prompt.id}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                                            Prompt v{prompt.version}
                                        </Typography>
                                        <Chip
                                            label={prompt.type}
                                            size="small"
                                            color={prompt.type === 'simple' ? 'default' : 'primary'}
                                            icon={prompt.type === 'simple' ? <Psychology /> : prompt.type === 'tool-aware' ? <Build /> : <AutoAwesome />}
                                        />
                                    </Box>

                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {prompt.text.length > 100 ? `${prompt.text.substring(0, 100)}...` : prompt.text}
                                    </Typography>

                                    <Box sx={{ mb: 2 }}>
                                        {prompt.tags.map((tag, index) => (
                                            <Chip
                                                key={index}
                                                label={tag}
                                                size="small"
                                                variant="outlined"
                                                sx={{ mr: 0.5, mb: 0.5 }}
                                            />
                                        ))}
                                    </Box>

                                    <Typography variant="caption" color="text.secondary">
                                        Created: {new Date(prompt.created_at).toLocaleDateString()}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                        Test Cases: {prompt.test_cases.length}
                                    </Typography>

                                    {promptFindings.length > 0 && (
                                        <Alert severity="warning" sx={{ mt: 2 }}>
                                            {promptFindings.length} AI finding(s) - Click view for details
                                        </Alert>
                                    )}
                                </CardContent>
                                <CardActions>
                                    <Tooltip title="View prompt details and AI findings">
                                        <Button
                                            size="small"
                                            startIcon={<Visibility />}
                                            onClick={() => openViewDialog(prompt)}
                                        >
                                            View
                                        </Button>
                                    </Tooltip>
                                    <Tooltip title="Edit prompt text and settings">
                                        <Button
                                            size="small"
                                            startIcon={<Edit />}
                                            onClick={() => openEditDialog(prompt)}
                                        >
                                            Edit
                                        </Button>
                                    </Tooltip>
                                    <Tooltip title="Run test cases to validate prompt">
                                        <Button
                                            size="small"
                                            startIcon={<PlayArrow />}
                                            onClick={() => handleTestPrompt(prompt)}
                                            disabled={prompt.test_cases.length === 0}
                                        >
                                            Test
                                        </Button>
                                    </Tooltip>
                                    <Button
                                        size="small"
                                        startIcon={<Delete />}
                                        onClick={() => handleDeletePrompt(prompt.id)}
                                        color="error"
                                    >
                                        Delete
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {selectedPrompt ? 'Edit Prompt' : 'Create New Prompt'}
                        <Tooltip title="Use examples and templates to get started quickly">
                            <Button
                                size="small"
                                startIcon={<LightbulbOutlined />}
                                onClick={(e) => setExampleMenuAnchor(e.currentTarget)}
                                sx={{ ml: 2 }}
                            >
                                Load Example
                            </Button>
                        </Tooltip>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 1 }}>
                        <TextField
                            fullWidth
                            label="Prompt Text"
                            multiline
                            rows={4}
                            value={formData.text}
                            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                            placeholder="Enter your prompt instructions here. Use {variable} syntax for dynamic inputs."
                        />
                        <Tooltip title="Write clear, specific instructions. Use {variable} syntax for dynamic inputs like {data}, {text}, etc.">
                            <IconButton sx={{ ml: 1 }}>
                                <HelpOutline />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            >
                                <MenuItem value="simple">Simple - Basic AI prompt</MenuItem>
                                <MenuItem value="tool-aware">Tool-Aware - Uses external tools</MenuItem>
                                <MenuItem value="workflow-aware">Workflow-Aware - Part of complex workflow</MenuItem>
                            </Select>
                        </FormControl>
                        <Tooltip title="Simple: Basic AI prompt. Tool-Aware: Uses external services. Workflow-Aware: Part of multi-step process.">
                            <IconButton sx={{ ml: 1 }}>
                                <HelpOutline />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <TextField
                            fullWidth
                            label="Tags (comma-separated)"
                            value={formData.tags?.join(', ') || ''}
                            onChange={(e) => setFormData({
                                ...formData,
                                tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag),
                            })}
                            placeholder="analysis, data, insights"
                        />
                        <Tooltip title="Add tags to categorize and search prompts easily. Use descriptive keywords.">
                            <IconButton sx={{ ml: 1 }}>
                                <HelpOutline />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography>Test Cases ({formData.test_cases?.length || 0})</Typography>
                                <Tooltip title="Test cases validate prompt behavior with different inputs">
                                    <IconButton size="small" sx={{ ml: 1 }}>
                                        <HelpOutline fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                <Typography variant="body2">
                                    Test cases help validate your prompt works correctly with different inputs.
                                    Include typical cases, edge cases, and error scenarios.
                                </Typography>
                            </Alert>

                            <Box sx={{ mb: 2 }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={(e) => {
                                        const menu = document.createElement('div');
                                        // This would be better implemented as a proper menu
                                        TEST_CASE_EXAMPLES.forEach((example, i) => {
                                            const btn = document.createElement('button');
                                            btn.innerText = example.name;
                                            btn.onclick = () => addExampleTestCase(example);
                                            menu.appendChild(btn);
                                        });
                                    }}
                                    sx={{ mr: 1 }}
                                >
                                    Add Example Test Case
                                </Button>
                            </Box>

                            {formData.test_cases?.map((testCase, index) => (
                                <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                                    <TextField
                                        fullWidth
                                        label="Test Case Name"
                                        value={testCase.name}
                                        onChange={(e) => updateTestCase(index, 'name', e.target.value)}
                                        sx={{ mb: 1 }}
                                        placeholder="Descriptive name for this test"
                                    />
                                    <TextField
                                        fullWidth
                                        label="Input (JSON)"
                                        multiline
                                        rows={2}
                                        value={JSON.stringify(testCase.input, null, 2)}
                                        onChange={(e) => {
                                            try {
                                                const input = JSON.parse(e.target.value);
                                                updateTestCase(index, 'input', input);
                                            } catch (err) {
                                                // Invalid JSON, ignore
                                            }
                                        }}
                                        sx={{ mb: 1 }}
                                        placeholder='{"data": "sample input"}'
                                    />
                                    <TextField
                                        fullWidth
                                        label="Expected Output (JSON)"
                                        multiline
                                        rows={2}
                                        value={JSON.stringify(testCase.expected_output, null, 2)}
                                        onChange={(e) => {
                                            try {
                                                const output = JSON.parse(e.target.value);
                                                updateTestCase(index, 'expected_output', output);
                                            } catch (err) {
                                                // Invalid JSON, ignore
                                            }
                                        }}
                                        sx={{ mb: 1 }}
                                        placeholder='{"result": "expected output"}'
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={testCase.enabled}
                                                onChange={(e) => updateTestCase(index, 'enabled', e.target.checked)}
                                            />
                                        }
                                        label="Enabled"
                                    />
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        onClick={() => removeTestCase(index)}
                                        sx={{ ml: 2 }}
                                    >
                                        Remove
                                    </Button>
                                </Box>
                            ))}
                            <Button variant="outlined" onClick={addTestCase}>
                                Add Test Case
                            </Button>
                        </AccordionDetails>
                    </Accordion>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={selectedPrompt ? handleUpdatePrompt : handleCreatePrompt}
                        variant="contained"
                        disabled={!formData.text.trim()}
                    >
                        {selectedPrompt ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Example Menu */}
            <Menu
                anchorEl={exampleMenuAnchor}
                open={Boolean(exampleMenuAnchor)}
                onClose={() => setExampleMenuAnchor(null)}
            >
                {PROMPT_EXAMPLES[formData.type]?.map((example, index) => (
                    <MenuItem key={index} onClick={() => loadExample(example)}>
                        <ListItemIcon>
                            <Code />
                        </ListItemIcon>
                        <ListItemText
                            primary={example.title}
                            secondary={example.description}
                        />
                    </MenuItem>
                ))}
            </Menu>

            {/* Help Dialog */}
            <Dialog open={helpDialogOpen} onClose={() => setHelpDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Help sx={{ mr: 1 }} />
                        Prompt Manager Help
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="h6" gutterBottom>Getting Started</Typography>
                    <Typography paragraph>
                        The Prompt Manager helps you create, test, and manage AI prompts for your workflows.
                        Prompts define how AI should respond to different inputs and scenarios.
                    </Typography>

                    <Typography variant="h6" gutterBottom>Prompt Types</Typography>
                    <List>
                        <ListItem>
                            <ListItemIcon><Psychology /></ListItemIcon>
                            <ListItemText
                                primary="Simple Prompts"
                                secondary="Basic AI instructions for straightforward tasks like text analysis or generation."
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon><Build /></ListItemIcon>
                            <ListItemText
                                primary="Tool-Aware Prompts"
                                secondary="Prompts that can use external tools and services for enhanced capabilities."
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon><AutoAwesome /></ListItemIcon>
                            <ListItemText
                                primary="Workflow-Aware Prompts"
                                secondary="Part of complex multi-step workflows with dependencies and state management."
                            />
                        </ListItem>
                    </List>

                    <Typography variant="h6" gutterBottom>Best Practices</Typography>
                    <List>
                        <ListItem>
                            <ListItemText
                                primary="Use Clear Instructions"
                                secondary="Write specific, actionable instructions. Avoid ambiguity."
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Include Examples"
                                secondary="Show the AI what good output looks like with examples."
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Test Thoroughly"
                                secondary="Create test cases for typical inputs, edge cases, and error scenarios."
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Monitor AI Findings"
                                secondary="Review AI agent suggestions for prompt improvements."
                            />
                        </ListItem>
                    </List>

                    <Typography variant="h6" gutterBottom>Variable Syntax</Typography>
                    <Typography paragraph>
                        Use curly braces for dynamic inputs: <code>{`{data}`}</code>, <code>{`{text}`}</code>, <code>{`{user_input}`}</code>
                    </Typography>

                    <Typography variant="h6" gutterBottom>Test Cases</Typography>
                    <Typography paragraph>
                        Test cases validate your prompt behavior. Include:
                    </Typography>
                    <List>
                        <ListItem>• Typical use cases with expected inputs</ListItem>
                        <ListItem>• Edge cases (empty input, very large input)</ListItem>
                        <ListItem>• Error scenarios (invalid format, missing data)</ListItem>
                        <ListItem>• Performance tests (response time, quality)</ListItem>
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setHelpDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Examples Dialog */}
            <Dialog open={examplesDialogOpen} onClose={() => setExamplesDialogOpen(false)} maxWidth="lg" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LightbulbOutlined sx={{ mr: 1 }} />
                        Prompt Examples & Templates
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" gutterBottom>
                        Browse these examples to get started quickly or learn best practices:
                    </Typography>

                    {Object.entries(PROMPT_EXAMPLES).map(([type, examples]) => (
                        <Box key={type} sx={{ mb: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ textTransform: 'capitalize' }}>
                                {type.replace('-', ' ')} Prompts
                            </Typography>
                            <Grid container spacing={2}>
                                {examples.map((example, index) => (
                                    <Grid item xs={12} md={6} key={index}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="subtitle1" gutterBottom>
                                                    {example.title}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    {example.description}
                                                </Typography>
                                                <Box sx={{ mb: 1 }}>
                                                    {example.tags.map((tag, i) => (
                                                        <Chip key={i} label={tag} size="small" sx={{ mr: 0.5 }} />
                                                    ))}
                                                </Box>
                                                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                                                    {example.text.length > 100 ? `${example.text.substring(0, 100)}...` : example.text}
                                                </Typography>
                                            </CardContent>
                                            <CardActions>
                                                <Button
                                                    size="small"
                                                    onClick={() => {
                                                        loadExample(example);
                                                        setExamplesDialogOpen(false);
                                                        setDialogOpen(true);
                                                    }}
                                                >
                                                    Use Template
                                                </Button>
                                            </CardActions>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    ))}

                    <Alert severity="info" sx={{ mt: 3 }}>
                        <Typography variant="body2">
                            <strong>Tip:</strong> You can also access examples while creating prompts using the "Load Example" button.
                        </Typography>
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setExamplesDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Prompt Details</DialogTitle>
                <DialogContent>
                    {selectedPrompt && (
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Prompt v{selectedPrompt.version}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                {selectedPrompt.text}
                            </Typography>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Type: {selectedPrompt.type}
                            </Typography>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Tags: {selectedPrompt.tags.join(', ')}
                            </Typography>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Created: {new Date(selectedPrompt.created_at).toLocaleString()}
                            </Typography>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Updated: {new Date(selectedPrompt.updated_at).toLocaleString()}
                            </Typography>

                            {getPromptFindings(selectedPrompt.id).length > 0 && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="h6" sx={{ mb: 2 }}>AI Findings</Typography>
                                    {getPromptFindings(selectedPrompt.id).map((finding) => (
                                        <Alert
                                            key={finding.finding_id}
                                            severity={getFindingColor(finding.level) as any}
                                            icon={getFindingIcon(finding.level)}
                                            sx={{ mb: 1 }}
                                        >
                                            <strong>{finding.agent_name}:</strong> {finding.message}
                                            {finding.suggested_action && (
                                                <Typography variant="body2" sx={{ mt: 1 }}>
                                                    <strong>Suggested Action:</strong> {finding.suggested_action}
                                                </Typography>
                                            )}
                                        </Alert>
                                    ))}
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Test Results Dialog */}
            <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Test Results</DialogTitle>
                <DialogContent>
                    {testResults && (
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Test Summary
                            </Typography>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={3}>
                                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="h4" color="primary">
                                            {testResults.summary.total}
                                        </Typography>
                                        <Typography variant="body2">Total Tests</Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={3}>
                                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="h4" color="success.main">
                                            {testResults.summary.passed}
                                        </Typography>
                                        <Typography variant="body2">Passed</Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={3}>
                                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="h4" color="error.main">
                                            {testResults.summary.failed}
                                        </Typography>
                                        <Typography variant="body2">Failed</Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={3}>
                                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="h4">
                                            {testResults.summary.execution_time_ms}ms
                                        </Typography>
                                        <Typography variant="body2">Execution Time</Typography>
                                    </Paper>
                                </Grid>
                            </Grid>

                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Test Details
                            </Typography>
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Test Case</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Execution Time</TableCell>
                                            <TableCell>Result</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {testResults.results.map((result) => (
                                            <TableRow key={result.test_case_id}>
                                                <TableCell>{result.test_case_id}</TableCell>
                                                <TableCell>
                                                    {result.passed ? (
                                                        <Chip
                                                            icon={<CheckCircle />}
                                                            label="Passed"
                                                            color="success"
                                                            size="small"
                                                        />
                                                    ) : (
                                                        <Chip
                                                            icon={<Error />}
                                                            label="Failed"
                                                            color="error"
                                                            size="small"
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell>{result.execution_time_ms}ms</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {JSON.stringify(result.actual_output)}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTestDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setError(null)} severity="error">
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!success}
                autoHideDuration={6000}
                onClose={() => setSuccess(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSuccess(null)} severity="success">
                    {success}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default PromptManager; 