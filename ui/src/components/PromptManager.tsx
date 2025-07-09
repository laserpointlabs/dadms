import {
    Add as AddIcon,
    Api as ApiIcon,
    CheckCircle as CheckCircleIcon,
    Code as CodeIcon,
    Computer as ComputerIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Error as ErrorIcon,
    ExpandMore as ExpandMoreIcon,
    PlayArrow as PlayIcon,
    Psychology as PsychologyIcon,
    Refresh as RefreshIcon,
    Science as ScienceIcon,
    AccountTree as WorkflowIcon
} from '@mui/icons-material';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
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
    LinearProgress,
    MenuItem,
    Paper,
    Select,
    Switch,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import {
    AvailableLLMs,
    LLMConfig,
    LLMConfigStatus,
    Prompt,
    promptService,
    TestPromptRequest,
    TestPromptResponse
} from '../services/microservices-api';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const PromptManager: React.FC = () => {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
    const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
    const [testResults, setTestResults] = useState<TestPromptResponse | null>(null);
    const [testLoading, setTestLoading] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [availableLLMs, setAvailableLLMs] = useState<AvailableLLMs>({});
    const [llmConfigStatus, setLLMConfigStatus] = useState<LLMConfigStatus>({});
    const [llmConfigs, setLLMConfigs] = useState<LLMConfig[]>([
        {
            provider: 'mock',
            model: 'mock-gpt',
            temperature: 0.7,
            maxTokens: 1000
        }
    ]);
    const [enableComparison, setEnableComparison] = useState(false);
    const [selectedTestCases, setSelectedTestCases] = useState<string[]>([]);

    useEffect(() => {
        loadPrompts();
        loadAvailableLLMs();
        loadLLMConfigStatus();
    }, []);

    const loadPrompts = async () => {
        try {
            setLoading(true);
            const response = await promptService.getPrompts();
            setPrompts(response.data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load prompts');
        } finally {
            setLoading(false);
        }
    };

    const loadAvailableLLMs = async () => {
        try {
            const response = await promptService.getAvailableLLMs();
            setAvailableLLMs(response.data.data);
        } catch (err) {
            console.error('Failed to load available LLMs:', err);
        }
    };

    const loadLLMConfigStatus = async () => {
        try {
            const response = await promptService.getLLMConfigStatus();
            setLLMConfigStatus(response.data.data);
        } catch (err) {
            console.error('Failed to load LLM configuration status:', err);
        }
    };

    const handleTest = async () => {
        if (!selectedPrompt) return;

        try {
            setTestLoading(true);

            const testRequest: TestPromptRequest = {
                test_case_ids: selectedTestCases.length > 0 ? selectedTestCases : undefined,
                llm_configs: llmConfigs,
                enable_comparison: enableComparison
            };

            const response = await promptService.testPrompt(selectedPrompt.id, testRequest);
            setTestResults(response.data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to test prompt');
        } finally {
            setTestLoading(false);
        }
    };

    const openTestDialog = (prompt: Prompt) => {
        setSelectedPrompt(prompt);
        setSelectedTestCases(prompt.test_cases?.filter(tc => tc.enabled).map(tc => tc.id) || []);
        setIsTestDialogOpen(true);
        setTestResults(null);
    };

    const openEditDialog = (prompt: Prompt) => {
        setEditingPrompt({ ...prompt });
        setIsEditDialogOpen(true);
    };

    const handleSavePrompt = async () => {
        if (!editingPrompt) return;

        try {
            setLoading(true);
            const updateRequest = {
                text: editingPrompt.text,
                type: editingPrompt.type,
                tags: editingPrompt.tags,
                test_cases: editingPrompt.test_cases.map(tc => ({
                    name: tc.name,
                    input: tc.input,
                    expected_output: tc.expected_output,
                    enabled: tc.enabled
                })),
                tool_dependencies: editingPrompt.tool_dependencies,
                workflow_dependencies: editingPrompt.workflow_dependencies,
                metadata: editingPrompt.metadata
            };

            const response = await promptService.updatePrompt(editingPrompt.id, updateRequest);

            // Update the prompts list with the updated prompt
            setPrompts(prompts.map(p => p.id === editingPrompt.id ? response.data.data : p));
            setIsEditDialogOpen(false);
            setEditingPrompt(null);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update prompt');
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePrompt = async (promptId: string) => {
        if (!window.confirm('Are you sure you want to delete this prompt?')) {
            return;
        }

        try {
            setLoading(true);
            await promptService.deletePrompt(promptId);
            setPrompts(prompts.filter(p => p.id !== promptId));
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete prompt');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEditingPrompt = (field: keyof Prompt, value: any) => {
        if (!editingPrompt) return;
        setEditingPrompt({
            ...editingPrompt,
            [field]: value
        });
    };

    const handleAddTestCase = () => {
        if (!editingPrompt) return;
        const newTestCase = {
            id: Date.now().toString(), // Temporary ID
            name: 'New Test Case',
            input: {},
            expected_output: {},
            enabled: true
        };
        setEditingPrompt({
            ...editingPrompt,
            test_cases: [...editingPrompt.test_cases, newTestCase]
        });
    };

    const handleUpdateTestCase = (index: number, field: string, value: any) => {
        if (!editingPrompt) return;
        const updatedTestCases = [...editingPrompt.test_cases];
        updatedTestCases[index] = {
            ...updatedTestCases[index],
            [field]: value
        };
        setEditingPrompt({
            ...editingPrompt,
            test_cases: updatedTestCases
        });
    };

    const handleRemoveTestCase = (index: number) => {
        if (!editingPrompt) return;
        setEditingPrompt({
            ...editingPrompt,
            test_cases: editingPrompt.test_cases.filter((_, i) => i !== index)
        });
    };

    const handleAddLLMConfig = () => {
        setLLMConfigs([
            ...llmConfigs,
            {
                provider: 'mock',
                model: 'mock-gpt',
                temperature: 0.7,
                maxTokens: 1000
            }
        ]);
    };

    const handleUpdateLLMConfig = (index: number, field: keyof LLMConfig, value: any) => {
        const updatedConfigs = [...llmConfigs];
        updatedConfigs[index] = {
            ...updatedConfigs[index],
            [field]: value
        };
        setLLMConfigs(updatedConfigs);
    };

    const handleRemoveLLMConfig = (index: number) => {
        setLLMConfigs(llmConfigs.filter((_: LLMConfig, i: number) => i !== index));
    };

    const renderTestResults = () => {
        if (!testResults) return null;

        return (
            <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Test Results
                </Typography>

                {/* Summary Card */}
                <Card sx={{ mb: 2 }}>
                    <CardContent>
                        <Grid container spacing={2}>
                            <Grid item xs={3}>
                                <Typography variant="h4" color="primary">
                                    {testResults.summary.total}
                                </Typography>
                                <Typography variant="body2">Total Tests</Typography>
                            </Grid>
                            <Grid item xs={3}>
                                <Typography variant="h4" color="success.main">
                                    {testResults.summary.passed}
                                </Typography>
                                <Typography variant="body2">Passed</Typography>
                            </Grid>
                            <Grid item xs={3}>
                                <Typography variant="h4" color="error.main">
                                    {testResults.summary.failed}
                                </Typography>
                                <Typography variant="body2">Failed</Typography>
                            </Grid>
                            <Grid item xs={3}>
                                <Typography variant="h4">
                                    {testResults.summary.execution_time_ms}ms
                                </Typography>
                                <Typography variant="body2">Execution Time</Typography>
                            </Grid>
                        </Grid>

                        {testResults.summary.avg_comparison_score !== undefined && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" gutterBottom>
                                    Average Comparison Score: {(testResults.summary.avg_comparison_score * 100).toFixed(1)}%
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={testResults.summary.avg_comparison_score * 100}
                                    sx={{ height: 8, borderRadius: 4 }}
                                />
                            </Box>
                        )}
                    </CardContent>
                </Card>

                {/* Detailed Results */}
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Test Case</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>LLM Response</TableCell>
                                <TableCell>Comparison Score</TableCell>
                                <TableCell>Execution Time</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {testResults.results.map((result, index) => (
                                <TableRow key={index}>
                                    <TableCell>{result.test_case_name}</TableCell>
                                    <TableCell>
                                        {result.passed ? (
                                            <Chip
                                                icon={<CheckCircleIcon />}
                                                label="Passed"
                                                color="success"
                                                size="small"
                                            />
                                        ) : (
                                            <Chip
                                                icon={<ErrorIcon />}
                                                label="Failed"
                                                color="error"
                                                size="small"
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {result.llm_response ? (
                                            <Box>
                                                <Typography variant="body2" noWrap>
                                                    {result.llm_response.content.substring(0, 100)}
                                                    {result.llm_response.content.length > 100 && '...'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {result.llm_response.provider}-{result.llm_response.model}
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="error">
                                                {result.error}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {result.comparison_score !== undefined ? (
                                            <Box>
                                                <Typography variant="body2">
                                                    {(result.comparison_score * 100).toFixed(1)}%
                                                </Typography>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={result.comparison_score * 100}
                                                    sx={{ height: 4, borderRadius: 2 }}
                                                />
                                            </Box>
                                        ) : (
                                            '-'
                                        )}
                                    </TableCell>
                                    <TableCell>{result.execution_time_ms}ms</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* LLM Comparisons */}
                {testResults.llm_comparisons && enableComparison && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            LLM Comparisons
                        </Typography>
                        {Object.entries(testResults.llm_comparisons).map(([providerModel, responses]) => (
                            <Accordion key={providerModel}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography>{providerModel}</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Box>
                                        {responses.map((response, index) => (
                                            <Card key={index} sx={{ mb: 1 }}>
                                                <CardContent>
                                                    <Typography variant="body2" paragraph>
                                                        {response.content}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Tokens: {response.usage?.total_tokens || 0} |
                                                        Time: {response.response_time_ms}ms
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Box>
                )}
            </Box>
        );
    };

    const renderLLMConfigDialog = () => (
        <Dialog open={isTestDialogOpen} onClose={() => setIsTestDialogOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center">
                    <ScienceIcon sx={{ mr: 1 }} />
                    Test Prompt with LLMs
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                        <Tab label="LLM Configuration" />
                        <Tab label="Test Selection" />
                        <Tab label="Results" />
                    </Tabs>

                    <TabPanel value={tabValue} index={0}>
                        <Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6">LLM Configurations</Typography>
                                <Button
                                    startIcon={<AddIcon />}
                                    onClick={handleAddLLMConfig}
                                    variant="outlined"
                                    size="small"
                                >
                                    Add LLM
                                </Button>
                            </Box>

                            {/* API Key Configuration Status */}
                            <Card sx={{ mb: 3 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        API Key Configuration Status
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Environment variables are checked first, then manual configuration
                                    </Typography>

                                    <Grid container spacing={2}>
                                        {Object.entries(llmConfigStatus).map(([provider, status]) => (
                                            <Grid item xs={12} sm={6} md={3} key={provider}>
                                                <Card
                                                    variant="outlined"
                                                    sx={{
                                                        bgcolor: status.configured ? 'success.light' : 'warning.light',
                                                        borderColor: status.configured ? 'success.main' : 'warning.main'
                                                    }}
                                                >
                                                    <CardContent sx={{ py: 2 }}>
                                                        <Box display="flex" alignItems="center" mb={1}>
                                                            {provider === 'openai' && <ApiIcon sx={{ mr: 1 }} />}
                                                            {provider === 'anthropic' && <PsychologyIcon sx={{ mr: 1 }} />}
                                                            {provider === 'local' && <ComputerIcon sx={{ mr: 1 }} />}
                                                            {provider === 'mock' && <ScienceIcon sx={{ mr: 1 }} />}
                                                            <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                                                                {provider}
                                                            </Typography>
                                                        </Box>
                                                        <Chip
                                                            label={status.configured ? 'Configured' : 'Not Configured'}
                                                            color={status.configured ? 'success' : 'warning'}
                                                            size="small"
                                                            sx={{ mb: 1 }}
                                                        />
                                                        <Typography variant="caption" display="block" color="text.secondary">
                                                            Source: {status.source}
                                                        </Typography>
                                                        <Typography variant="caption" display="block" color="text.secondary">
                                                            Models: {status.models?.length || 0}
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </CardContent>
                            </Card>

                            {llmConfigs.map((config, index) => (
                                <Card key={index} sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Typography variant="subtitle1">
                                                LLM Configuration {index + 1}
                                            </Typography>
                                            <Box>
                                                {/* Show if this provider is configured via environment */}
                                                {llmConfigStatus[config.provider]?.configured &&
                                                    llmConfigStatus[config.provider]?.source === 'environment' && (
                                                        <Chip
                                                            label="ENV KEY"
                                                            size="small"
                                                            color="success"
                                                            sx={{ mr: 1 }}
                                                        />
                                                    )}
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleRemoveLLMConfig(index)}
                                                    disabled={llmConfigs.length === 1}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        </Box>

                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <FormControl fullWidth>
                                                    <InputLabel>Provider</InputLabel>
                                                    <Select
                                                        value={config.provider}
                                                        onChange={(e) => handleUpdateLLMConfig(index, 'provider', e.target.value)}
                                                    >
                                                        <MenuItem value="openai">
                                                            <Box display="flex" alignItems="center">
                                                                <ApiIcon sx={{ mr: 1 }} />
                                                                OpenAI
                                                                {llmConfigStatus.openai?.configured && (
                                                                    <Chip label="✓" size="small" color="success" sx={{ ml: 1 }} />
                                                                )}
                                                            </Box>
                                                        </MenuItem>
                                                        <MenuItem value="anthropic">
                                                            <Box display="flex" alignItems="center">
                                                                <PsychologyIcon sx={{ mr: 1 }} />
                                                                Anthropic
                                                                {llmConfigStatus.anthropic?.configured && (
                                                                    <Chip label="✓" size="small" color="success" sx={{ ml: 1 }} />
                                                                )}
                                                            </Box>
                                                        </MenuItem>
                                                        <MenuItem value="local">
                                                            <Box display="flex" alignItems="center">
                                                                <ComputerIcon sx={{ mr: 1 }} />
                                                                Local
                                                                <Chip label="✓" size="small" color="success" sx={{ ml: 1 }} />
                                                            </Box>
                                                        </MenuItem>
                                                        <MenuItem value="mock">
                                                            <Box display="flex" alignItems="center">
                                                                <ScienceIcon sx={{ mr: 1 }} />
                                                                Mock
                                                                <Chip label="✓" size="small" color="success" sx={{ ml: 1 }} />
                                                            </Box>
                                                        </MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <FormControl fullWidth>
                                                    <InputLabel>Model</InputLabel>
                                                    <Select
                                                        value={config.model}
                                                        onChange={(e) => handleUpdateLLMConfig(index, 'model', e.target.value)}
                                                    >
                                                        {(availableLLMs[config.provider] || []).map((model) => (
                                                            <MenuItem key={model} value={model}>
                                                                {model}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <TextField
                                                    fullWidth
                                                    label="API Key"
                                                    type="password"
                                                    value={config.apiKey || ''}
                                                    onChange={(e) => handleUpdateLLMConfig(index, 'apiKey', e.target.value)}
                                                    helperText={
                                                        llmConfigStatus[config.provider]?.configured &&
                                                            llmConfigStatus[config.provider]?.source === 'environment'
                                                            ? `API key configured via ${config.provider.toUpperCase()}_API_KEY environment variable`
                                                            : `Required for ${config.provider}. Set ${config.provider.toUpperCase()}_API_KEY environment variable or enter manually.`
                                                    }
                                                    disabled={
                                                        llmConfigStatus[config.provider]?.configured &&
                                                        llmConfigStatus[config.provider]?.source === 'environment'
                                                    }
                                                />
                                            </Grid>
                                            <Grid item xs={6}>
                                                <TextField
                                                    fullWidth
                                                    label="Temperature"
                                                    type="number"
                                                    inputProps={{ min: 0, max: 2, step: 0.1 }}
                                                    value={config.temperature || 0.7}
                                                    onChange={(e) => handleUpdateLLMConfig(index, 'temperature', parseFloat(e.target.value))}
                                                />
                                            </Grid>
                                            <Grid item xs={6}>
                                                <TextField
                                                    fullWidth
                                                    label="Max Tokens"
                                                    type="number"
                                                    inputProps={{ min: 1, max: 4000, step: 1 }}
                                                    value={config.maxTokens || 1000}
                                                    onChange={(e) => handleUpdateLLMConfig(index, 'maxTokens', parseInt(e.target.value))}
                                                />
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            ))}

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={enableComparison}
                                        onChange={(e) => setEnableComparison(e.target.checked)}
                                    />
                                }
                                label="Enable LLM Comparison"
                            />
                        </Box>
                    </TabPanel>

                    <TabPanel value={tabValue} index={1}>
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Select Test Cases
                            </Typography>

                            {selectedPrompt?.test_cases?.map((testCase) => (
                                <FormControlLabel
                                    key={testCase.id}
                                    control={
                                        <Checkbox
                                            checked={selectedTestCases.includes(testCase.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedTestCases([...selectedTestCases, testCase.id]);
                                                } else {
                                                    setSelectedTestCases(selectedTestCases.filter(id => id !== testCase.id));
                                                }
                                            }}
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography variant="body2">{testCase.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {JSON.stringify(testCase.input).substring(0, 100)}...
                                            </Typography>
                                        </Box>
                                    }
                                />
                            ))}

                            {selectedPrompt?.test_cases?.length === 0 && (
                                <Alert severity="info">
                                    No test cases available. Add test cases to the prompt first.
                                </Alert>
                            )}
                        </Box>
                    </TabPanel>

                    <TabPanel value={tabValue} index={2}>
                        {testLoading && (
                            <Box display="flex" justifyContent="center" p={3}>
                                <CircularProgress />
                                <Typography sx={{ ml: 2 }}>Testing prompt with LLMs...</Typography>
                            </Box>
                        )}
                        {renderTestResults()}
                    </TabPanel>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setIsTestDialogOpen(false)}>Close</Button>
                <Button
                    onClick={handleTest}
                    variant="contained"
                    startIcon={<PlayIcon />}
                    disabled={testLoading || !selectedPrompt || selectedTestCases.length === 0}
                >
                    Run Test
                </Button>
            </DialogActions>
        </Dialog>
    );

    const renderEditDialog = () => (
        <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center">
                    <EditIcon sx={{ mr: 1 }} />
                    Edit Prompt
                </Box>
            </DialogTitle>
            <DialogContent>
                {editingPrompt && (
                    <Box sx={{ mt: 2 }}>
                        <Grid container spacing={3}>
                            {/* Prompt Text */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Prompt Text"
                                    multiline
                                    rows={4}
                                    value={editingPrompt.text}
                                    onChange={(e) => handleUpdateEditingPrompt('text', e.target.value)}
                                    helperText="Use {variable_name} for variables that will be replaced during execution"
                                />
                            </Grid>

                            {/* Type */}
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                        value={editingPrompt.type}
                                        onChange={(e) => handleUpdateEditingPrompt('type', e.target.value)}
                                    >
                                        <MenuItem value="simple">
                                            <Box display="flex" alignItems="center">
                                                <CodeIcon sx={{ mr: 1 }} />
                                                Simple
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="tool-aware">
                                            <Box display="flex" alignItems="center">
                                                <ScienceIcon sx={{ mr: 1 }} />
                                                Tool-aware
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="workflow-aware">
                                            <Box display="flex" alignItems="center">
                                                <WorkflowIcon sx={{ mr: 1 }} />
                                                Workflow-aware
                                            </Box>
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Tags */}
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Tags"
                                    value={editingPrompt.tags.join(', ')}
                                    onChange={(e) => handleUpdateEditingPrompt('tags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
                                    helperText="Comma-separated tags"
                                />
                            </Grid>

                            {/* Test Cases */}
                            <Grid item xs={12}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="h6">Test Cases</Typography>
                                    <Button
                                        startIcon={<AddIcon />}
                                        onClick={handleAddTestCase}
                                        variant="outlined"
                                        size="small"
                                    >
                                        Add Test Case
                                    </Button>
                                </Box>

                                {editingPrompt.test_cases.map((testCase, index) => (
                                    <Card key={testCase.id || index} sx={{ mb: 2 }}>
                                        <CardContent>
                                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                                <Typography variant="subtitle2">
                                                    Test Case {index + 1}
                                                </Typography>
                                                <Box>
                                                    <FormControlLabel
                                                        control={
                                                            <Switch
                                                                checked={testCase.enabled}
                                                                onChange={(e) => handleUpdateTestCase(index, 'enabled', e.target.checked)}
                                                                size="small"
                                                            />
                                                        }
                                                        label="Enabled"
                                                    />
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleRemoveTestCase(index)}
                                                        disabled={editingPrompt.test_cases.length === 1}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Box>
                                            </Box>

                                            <Grid container spacing={2}>
                                                <Grid item xs={12}>
                                                    <TextField
                                                        fullWidth
                                                        label="Test Case Name"
                                                        value={testCase.name}
                                                        onChange={(e) => handleUpdateTestCase(index, 'name', e.target.value)}
                                                        size="small"
                                                    />
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <TextField
                                                        fullWidth
                                                        label="Input (JSON)"
                                                        multiline
                                                        rows={3}
                                                        value={typeof testCase.input === 'string' ? testCase.input : JSON.stringify(testCase.input, null, 2)}
                                                        onChange={(e) => {
                                                            try {
                                                                const parsed = JSON.parse(e.target.value);
                                                                handleUpdateTestCase(index, 'input', parsed);
                                                            } catch {
                                                                handleUpdateTestCase(index, 'input', e.target.value);
                                                            }
                                                        }}
                                                        size="small"
                                                        helperText="JSON format expected"
                                                    />
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <TextField
                                                        fullWidth
                                                        label="Expected Output (JSON)"
                                                        multiline
                                                        rows={3}
                                                        value={typeof testCase.expected_output === 'string' ? testCase.expected_output : JSON.stringify(testCase.expected_output, null, 2)}
                                                        onChange={(e) => {
                                                            try {
                                                                const parsed = JSON.parse(e.target.value);
                                                                handleUpdateTestCase(index, 'expected_output', parsed);
                                                            } catch {
                                                                handleUpdateTestCase(index, 'expected_output', e.target.value);
                                                            }
                                                        }}
                                                        size="small"
                                                        helperText="JSON format expected"
                                                    />
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                ))}

                                {editingPrompt.test_cases.length === 0 && (
                                    <Alert severity="info">
                                        No test cases. Add test cases to validate your prompt's behavior.
                                    </Alert>
                                )}
                            </Grid>

                            {/* Tool Dependencies */}
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Tool Dependencies"
                                    value={editingPrompt.tool_dependencies.join(', ')}
                                    onChange={(e) => handleUpdateEditingPrompt('tool_dependencies', e.target.value.split(',').map(dep => dep.trim()).filter(dep => dep))}
                                    helperText="Comma-separated tool IDs"
                                />
                            </Grid>

                            {/* Workflow Dependencies */}
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Workflow Dependencies"
                                    value={editingPrompt.workflow_dependencies.join(', ')}
                                    onChange={(e) => handleUpdateEditingPrompt('workflow_dependencies', e.target.value.split(',').map(dep => dep.trim()).filter(dep => dep))}
                                    helperText="Comma-separated workflow IDs"
                                />
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button
                    onClick={handleSavePrompt}
                    variant="contained"
                    startIcon={<EditIcon />}
                    disabled={!editingPrompt || loading}
                >
                    Save Changes
                </Button>
            </DialogActions>
        </Dialog>
    );

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Prompt Manager</Typography>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={async () => {
                            try {
                                setLoading(true);
                                await loadPrompts();
                                await loadLLMConfigStatus();
                                setError(null);
                            } catch (err) {
                                setError('Failed to connect to microservices');
                            } finally {
                                setLoading(false);
                            }
                        }}
                        sx={{ mr: 1 }}
                    >
                        Test Connection
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => console.log('Create prompt functionality')}
                    >
                        Create Prompt
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {loading && (
                <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                </Box>
            )}

            {/* Connection Status */}
            {!loading && !error && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    ✅ Connected to microservices successfully! Found {prompts.length} prompts.
                </Alert>
            )}

            {/* Main content */}
            <Grid container spacing={3}>
                {prompts.map((prompt) => (
                    <Grid item xs={12} md={6} lg={4} key={prompt.id}>
                        <Card>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                    <Box>
                                        <Typography variant="h6" gutterBottom>
                                            {prompt.type === 'simple' && <CodeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />}
                                            {prompt.type === 'tool-aware' && <ScienceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />}
                                            {prompt.type === 'workflow-aware' && <WorkflowIcon sx={{ mr: 1, verticalAlign: 'middle' }} />}
                                            {prompt.type}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {prompt.text.substring(0, 100)}...
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <IconButton size="small" onClick={() => openEditDialog(prompt)}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleDeletePrompt(prompt.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                </Box>

                                <Box mb={2}>
                                    {prompt.tags.map((tag) => (
                                        <Chip key={tag} label={tag} size="small" sx={{ mr: 1, mb: 1 }} />
                                    ))}
                                </Box>

                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="caption" color="text.secondary">
                                        {prompt.test_cases.length} test cases
                                    </Typography>
                                    <Button
                                        startIcon={<PlayIcon />}
                                        onClick={() => openTestDialog(prompt)}
                                        variant="outlined"
                                        size="small"
                                    >
                                        Test
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Show message if no prompts */}
            {!loading && prompts.length === 0 && (
                <Box display="flex" flexDirection="column" alignItems="center" p={4}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No prompts found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Create your first prompt to get started with LLM testing
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => console.log('Create prompt functionality')}
                    >
                        Create Your First Prompt
                    </Button>
                </Box>
            )}

            {/* Dialogs */}
            {renderLLMConfigDialog()}
            {renderEditDialog()}
        </Box>
    );
};

export default PromptManager; 