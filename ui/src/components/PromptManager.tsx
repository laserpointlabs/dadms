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
    Finding,
    LLMConfig,
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
    const [testResults, setTestResults] = useState<TestPromptResponse | null>(null);
    const [testLoading, setTestLoading] = useState(false);
    const [findings, setFindings] = useState<Finding[]>([]);
    const [tabValue, setTabValue] = useState(0);
    const [availableLLMs, setAvailableLLMs] = useState<AvailableLLMs>({});
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

                            {llmConfigs.map((config, index) => (
                                <Card key={index} sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Typography variant="subtitle1">
                                                LLM Configuration {index + 1}
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleRemoveLLMConfig(index)}
                                                disabled={llmConfigs.length === 1}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
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
                                                            </Box>
                                                        </MenuItem>
                                                        <MenuItem value="anthropic">
                                                            <Box display="flex" alignItems="center">
                                                                <PsychologyIcon sx={{ mr: 1 }} />
                                                                Anthropic
                                                            </Box>
                                                        </MenuItem>
                                                        <MenuItem value="local">
                                                            <Box display="flex" alignItems="center">
                                                                <ComputerIcon sx={{ mr: 1 }} />
                                                                Local
                                                            </Box>
                                                        </MenuItem>
                                                        <MenuItem value="mock">
                                                            <Box display="flex" alignItems="center">
                                                                <ScienceIcon sx={{ mr: 1 }} />
                                                                Mock
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
                                                    helperText="Required for OpenAI and Anthropic"
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

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Prompt Manager</Typography>
                <Box>
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
                                        <IconButton size="small" onClick={() => console.log('Edit prompt')}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => console.log('Delete prompt')}>
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

            {/* Dialogs */}
            {renderLLMConfigDialog()}
        </Box>
    );
};

export default PromptManager; 