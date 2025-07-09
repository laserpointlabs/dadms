import {
    Add as AddIcon,
    Api as ApiIcon,
    CheckCircle as CheckCircleIcon,
    Code as CodeIcon,
    Computer as ComputerIcon,
    ContentCopy as CopyIcon,
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
    const [editingVersion, setEditingVersion] = useState<number | null>(null); // Track which version is being edited
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
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
    const [renderCounter, setRenderCounter] = useState(0);
    const [testHistory, setTestHistory] = useState<Array<{
        execution_id: string;
        prompt_version: number;
        created_at: string;
        total_tests: number;
        passed_tests: number;
        failed_tests: number;
        avg_comparison_score?: number;
    }>>([]);

    // Version management state
    const [selectedVersions, setSelectedVersions] = useState<{ [promptId: string]: number }>({});
    const [promptVersions, setPromptVersions] = useState<{
        [promptId: string]: Array<{
            version: number;
            created_at: string;
            updated_at: string;
            text: string;
            type: string;
            tags: string[];
        }>
    }>({});
    const [versionedPrompts, setVersionedPrompts] = useState<{ [key: string]: Prompt }>({});

    // Test results detail view state
    const [selectedTestResult, setSelectedTestResult] = useState<any>(null);
    const [testResultDetailOpen, setTestResultDetailOpen] = useState(false);

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

            // Load versions for each prompt
            for (const prompt of response.data.data) {
                await loadPromptVersions(prompt.id);
            }
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
        const displayPrompt = getDisplayPrompt(prompt);
        setSelectedPrompt(displayPrompt);
        setSelectedTestCases(displayPrompt.test_cases?.filter(tc => tc.enabled).map(tc => tc.id) || []);
        setIsTestDialogOpen(true);

        // Load previous test results for the selected version
        loadPreviousTestResults(displayPrompt.id);
    };

    const loadPreviousTestResults = async (promptId: string) => {
        try {
            const response = await promptService.getTestResults(promptId);
            setTestResults(response.data.data);
        } catch (err) {
            // If no previous results found, that's okay - just leave testResults as null
            console.log('No previous test results found for prompt:', promptId);
            setTestResults(null);
        }

        // Also load test history
        loadTestHistory(promptId);
    };

    const loadTestHistory = async (promptId: string) => {
        try {
            const response = await promptService.getTestHistory(promptId);
            setTestHistory(response.data.data);
        } catch (err) {
            console.error('Failed to load test history:', err);
            setTestHistory([]);
        }
    };

    const loadTestResultsForVersion = async (promptId: string, version: number) => {
        try {
            setTestLoading(true);
            const response = await promptService.getTestResults(promptId, version);
            setTestResults(response.data.data);
        } catch (err) {
            console.error(`Failed to load test results for version ${version}:`, err);
            setError('Failed to load test results for selected version');
        } finally {
            setTestLoading(false);
        }
    };

    // Version management functions
    const loadPromptVersions = async (promptId: string) => {
        try {
            const response = await promptService.getPromptVersions(promptId);
            setPromptVersions(prev => ({
                ...prev,
                [promptId]: response.data.data
            }));

            // Set default selected version to the latest if not already set
            if (!selectedVersions[promptId] && response.data.data.length > 0) {
                setSelectedVersions(prev => ({
                    ...prev,
                    [promptId]: response.data.data[0].version
                }));
            }
        } catch (err) {
            console.error('Failed to load prompt versions:', err);
        }
    };

    const handleVersionChange = async (promptId: string, version: number) => {
        try {
            setSelectedVersions(prev => ({
                ...prev,
                [promptId]: version
            }));

            // Load the specific version data
            const response = await promptService.getPromptByVersion(promptId, version);
            setVersionedPrompts(prev => ({
                ...prev,
                [`${promptId}-${version}`]: response.data.data
            }));
        } catch (err) {
            console.error(`Failed to load prompt version ${version}:`, err);
            setError('Failed to load selected prompt version');
        }
    };

    const getDisplayPrompt = (prompt: Prompt): Prompt => {
        const selectedVersion = selectedVersions[prompt.id];
        if (selectedVersion && selectedVersion !== prompt.version) {
            const versionedPrompt = versionedPrompts[`${prompt.id}-${selectedVersion}`];
            return versionedPrompt || prompt;
        }
        return prompt;
    };

    const openEditDialog = (prompt: Prompt) => {
        const displayPrompt = getDisplayPrompt(prompt);
        setEditingPrompt(displayPrompt);
        setEditingVersion(selectedVersions[prompt.id] || displayPrompt.version); // Set the version being edited
        setIsEditDialogOpen(true);
    };

    const openCreateDialog = () => {
        const newPrompt: Prompt = {
            id: '', // Will be set by backend
            name: '',
            version: 1,
            text: '',
            type: 'simple',
            test_cases: [],
            tool_dependencies: [],
            workflow_dependencies: [],
            tags: [],
            created_by: 'testuser', // You might want to get this from auth context
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            metadata: {}
        };
        console.log('Opening create dialog with new prompt:', newPrompt);
        setEditingPrompt(newPrompt);
        setIsCreateDialogOpen(true);
    };

    const handleCloseCreateDialog = () => {
        setIsCreateDialogOpen(false);
        setEditingPrompt(null);
        setError(null);
    };

    const handleCreatePrompt = async () => {
        if (!editingPrompt) {
            console.error('Cannot create prompt: editingPrompt is null');
            return;
        }

        try {
            setLoading(true);
            const createRequest = {
                name: editingPrompt.name || 'Untitled Prompt',
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

            const response = await promptService.createPrompt(createRequest);
            const newPrompt = response.data.data;

            // Add the new prompt to the beginning of the prompts list
            setPrompts([newPrompt, ...prompts]);

            // Load versions for the new prompt (will be version 1)
            await loadPromptVersions(newPrompt.id);

            setIsCreateDialogOpen(false);
            setEditingPrompt(null);
            setError(null);
        } catch (err) {
            console.error('Error creating prompt:', err);
            setError(err instanceof Error ? err.message : 'Failed to create prompt');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePrompt = async () => {
        if (!editingPrompt) return;

        try {
            setLoading(true);
            const updateRequest = {
                name: editingPrompt.name,
                text: editingPrompt.text,
                type: editingPrompt.type,
                tags: editingPrompt.tags,
                test_cases: editingPrompt.test_cases.map(tc => ({
                    id: tc.id,
                    name: tc.name,
                    input: tc.input,
                    expected_output: tc.expected_output,
                    enabled: tc.enabled,
                    scoring_logic: tc.scoring_logic
                })),
                tool_dependencies: editingPrompt.tool_dependencies,
                workflow_dependencies: editingPrompt.workflow_dependencies,
                metadata: editingPrompt.metadata
            };

            let response: any;
            let updatedPrompt: Prompt;

            // Check if we're editing a specific version or creating a new version
            const isEditingSpecificVersion = editingVersion !== null && selectedVersions[editingPrompt.id] !== undefined;

            if (isEditingSpecificVersion) {
                // Update the specific version in place
                response = await promptService.updatePromptVersion(editingPrompt.id, editingVersion!, updateRequest);
                updatedPrompt = response.data.data;

                // Update the cached versioned prompt
                setVersionedPrompts(prev => ({
                    ...prev,
                    [`${editingPrompt.id}-${editingVersion}`]: updatedPrompt
                }));

                // If we're editing the latest version, also update the main prompts list
                const currentLatestVersion = Math.max(...(promptVersions[editingPrompt.id] || []).map(v => v.version), editingPrompt.version);
                if (editingVersion === currentLatestVersion) {
                    setPrompts(prompts.map(p => p.id === editingPrompt.id ? updatedPrompt : p));
                }
            } else {
                // Create new version (default behavior)
                response = await promptService.updatePrompt(editingPrompt.id, updateRequest);
                updatedPrompt = response.data.data;

                // Update the prompts list with the new version
                setPrompts(prompts.map(p => p.id === editingPrompt.id ? updatedPrompt : p));

                // Clear selected version to show the new latest version
                setSelectedVersions(prev => {
                    const updated = { ...prev };
                    delete updated[editingPrompt.id];
                    return updated;
                });
            }

            // Reload versions for this prompt
            await loadPromptVersions(editingPrompt.id);

            setIsEditDialogOpen(false);
            setEditingPrompt(null);
            setEditingVersion(null);
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

            // Clean up version-related state for deleted prompt
            setSelectedVersions(prev => {
                const updated = { ...prev };
                delete updated[promptId];
                return updated;
            });

            setPromptVersions(prev => {
                const updated = { ...prev };
                delete updated[promptId];
                return updated;
            });

            setVersionedPrompts(prev => {
                const updated = { ...prev };
                Object.keys(updated).forEach(key => {
                    if (key.startsWith(`${promptId}-`)) {
                        delete updated[key];
                    }
                });
                return updated;
            });

            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete prompt');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEditingPrompt = (field: keyof Prompt, value: any) => {
        console.log('Updating field:', field, 'with value:', value, 'current editingPrompt:', editingPrompt);
        if (!editingPrompt) {
            console.error('editingPrompt is null, cannot update field:', field);
            return;
        }
        setEditingPrompt({
            ...editingPrompt,
            [field]: value
        });
    };

    const handleAddTestCase = () => {
        console.log('handleAddTestCase called');
        console.log('editingPrompt:', editingPrompt);
        console.log('editingPrompt.test_cases:', editingPrompt?.test_cases);

        if (!editingPrompt) {
            console.error('No editingPrompt found in handleAddTestCase');
            return;
        }

        const newTestCase = {
            id: Date.now().toString(), // Temporary ID
            name: 'New Test Case',
            input: {},
            expected_output: {},
            enabled: true
        };

        // Ensure test_cases is an array
        const currentTestCases = editingPrompt.test_cases || [];

        console.log('Adding new test case:', newTestCase);
        console.log('Current test cases:', currentTestCases);

        setEditingPrompt({
            ...editingPrompt,
            test_cases: [...currentTestCases, newTestCase]
        });

        console.log('Test case added successfully');
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

        const testCase = editingPrompt.test_cases[index];
        const confirmMessage = `Are you sure you want to delete test case "${testCase.name}"?\n\nThis action cannot be undone.`;

        if (window.confirm(confirmMessage)) {
            setEditingPrompt({
                ...editingPrompt,
                test_cases: editingPrompt.test_cases.filter((_, i) => i !== index)
            });
        }
    };

    const getExampleTestCase = (exampleType: 'text-analysis' | 'data-processing' | 'math-calculation' | 'data-transformation') => {
        const examples = {
            'text-analysis': {
                name: 'Sentiment Analysis Example',
                prompt_text: 'Analyze the sentiment of the following text: "{text}". Respond with a JSON object containing "sentiment" (positive/negative/neutral) and "confidence" (0-1 scale).',
                input: { text: 'This product is absolutely amazing! I love it.' },
                expected_output: {
                    sentiment: 'positive',
                    confidence: 0.95,
                    reasoning: 'The text contains highly positive words like "absolutely amazing" and "love it"'
                }
            },
            'data-processing': {
                name: 'Data Processing Example',
                prompt_text: 'Given the following array of numbers: {numbers}, calculate and return a JSON object with the sum, average, count, minimum, and maximum values.',
                input: { numbers: [1, 2, 3, 4, 5] },
                expected_output: {
                    sum: 15,
                    average: 3,
                    count: 5,
                    min: 1,
                    max: 5
                }
            },
            'math-calculation': {
                name: 'Math Calculation Example',
                prompt_text: 'Solve this mathematical problem: "{operation}". Provide the result and a brief explanation of how you calculated it. Return as JSON with "result" and "explanation" fields.',
                input: { operation: 'Calculate 15% of 200' },
                expected_output: {
                    result: 30,
                    explanation: 'To calculate 15% of 200: 200 × 0.15 = 30',
                    steps: ['Convert percentage to decimal: 15% = 0.15', 'Multiply: 200 × 0.15 = 30']
                }
            },
            'data-transformation': {
                name: 'Data Transformation Example',
                prompt_text: 'Transform the following user data: {users}. Extract just the names into an array and calculate the average age. Return as JSON with "names" array and "average_age" number.',
                input: { users: [{ 'name': 'John', 'age': 30 }, { 'name': 'Jane', 'age': 25 }] },
                expected_output: {
                    names: ['John', 'Jane'],
                    average_age: 27.5,
                    total_users: 2
                }
            }
        };
        return examples[exampleType];
    };

    const handleUseExample = (index: number, exampleType: 'text-analysis' | 'data-processing' | 'math-calculation' | 'data-transformation') => {
        if (!editingPrompt) {
            console.error('No editingPrompt found');
            return;
        }

        console.log('handleUseExample called with:', { index, exampleType });
        console.log('Current editingPrompt.test_cases:', editingPrompt.test_cases);

        const example = getExampleTestCase(exampleType);
        console.log('Example data:', example);

        // Update all test case fields in a single state update
        const updatedTestCases = [...editingPrompt.test_cases];
        console.log('Before update - test case at index:', updatedTestCases[index]);

        updatedTestCases[index] = {
            ...updatedTestCases[index],
            name: example.name,
            input: example.input,
            expected_output: example.expected_output
        };

        console.log('After update - test case at index:', updatedTestCases[index]);
        console.log('Full updated test cases:', updatedTestCases);

        // Force immediate state update
        const newEditingPrompt = {
            ...editingPrompt,
            test_cases: updatedTestCases
        };

        setEditingPrompt(newEditingPrompt);

        // Force re-render by incrementing counter
        setRenderCounter(prev => prev + 1);

        console.log('State update called with:', newEditingPrompt);

        // Show suggested prompt text immediately (no setTimeout to avoid stale closure)
        const shouldUpdatePrompt = window.confirm(
            `Test case populated with ${example.name}!\n\n` +
            `Input: ${JSON.stringify(example.input, null, 2)}\n\n` +
            `Expected Output: ${JSON.stringify(example.expected_output, null, 2)}\n\n` +
            `Suggested prompt text for this example:\n"${example.prompt_text}"\n\n` +
            `Would you like to update the prompt text with this suggestion?`
        );

        if (shouldUpdatePrompt) {
            // Update prompt text without affecting test cases
            setEditingPrompt(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    text: example.prompt_text
                };
            });
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            // You could add a toast notification here
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
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
                                <TableCell sx={{ maxWidth: 300 }}>LLM Response</TableCell>
                                <TableCell>Comparison Score</TableCell>
                                <TableCell>Execution Time</TableCell>
                                <TableCell>Actions</TableCell>
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
                                    <TableCell sx={{ maxWidth: 300 }}>
                                        {result.llm_response ? (
                                            <Box>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 3,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        wordBreak: 'break-word'
                                                    }}
                                                >
                                                    {result.llm_response.content}
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
                                    <TableCell>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => {
                                                setSelectedTestResult(result);
                                                setTestResultDetailOpen(true);
                                            }}
                                        >
                                            View Details
                                        </Button>
                                    </TableCell>
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

                {/* Test Result Detail Dialog */}
                <Dialog
                    open={testResultDetailOpen}
                    onClose={() => setTestResultDetailOpen(false)}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: { maxHeight: '80vh' }
                    }}
                >
                    <DialogTitle>
                        Test Result Details: {selectedTestResult?.test_case_name}
                    </DialogTitle>
                    <DialogContent>
                        {selectedTestResult && (
                            <Box>
                                {/* Status */}
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Status
                                    </Typography>
                                    <Chip
                                        icon={selectedTestResult.passed ? <CheckCircleIcon /> : <ErrorIcon />}
                                        label={selectedTestResult.passed ? "Passed" : "Failed"}
                                        color={selectedTestResult.passed ? "success" : "error"}
                                        size="small"
                                    />
                                </Box>

                                {/* LLM Response */}
                                {selectedTestResult.llm_response && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="h6" gutterBottom>
                                            LLM Response
                                        </Typography>
                                        <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                {selectedTestResult.llm_response.content}
                                            </Typography>
                                        </Paper>
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                            Provider: {selectedTestResult.llm_response.provider} |
                                            Model: {selectedTestResult.llm_response.model} |
                                            Tokens: {selectedTestResult.llm_response.usage?.total_tokens || 0} |
                                            Time: {selectedTestResult.llm_response.response_time_ms}ms
                                        </Typography>
                                    </Box>
                                )}

                                {/* Test Input */}
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Test Input
                                    </Typography>
                                    <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                                        {selectedTestResult.test_input ? (
                                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                {JSON.stringify(selectedTestResult.test_input, null, 2)}
                                            </pre>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                Test input data not available
                                            </Typography>
                                        )}
                                    </Paper>
                                </Box>

                                {/* Expected Output */}
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Expected Output
                                    </Typography>
                                    <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                            {JSON.stringify(selectedTestResult.expected_output, null, 2)}
                                        </pre>
                                    </Paper>
                                </Box>

                                {/* Actual Output */}
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Actual Output
                                    </Typography>
                                    <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                            {selectedTestResult.actual_output}
                                        </Typography>
                                    </Paper>
                                </Box>

                                {/* Comparison Score */}
                                {selectedTestResult.comparison_score !== undefined && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Comparison Score
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography variant="h4" color="primary">
                                                {(selectedTestResult.comparison_score * 100).toFixed(1)}%
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={selectedTestResult.comparison_score * 100}
                                                sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                                            />
                                        </Box>
                                    </Box>
                                )}

                                {/* Error (if any) */}
                                {selectedTestResult.error && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Error
                                        </Typography>
                                        <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                                            <Typography variant="body2">
                                                {selectedTestResult.error}
                                            </Typography>
                                        </Paper>
                                    </Box>
                                )}

                                {/* Execution Time */}
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Execution Time
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedTestResult.execution_time_ms}ms
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setTestResultDetailOpen(false)}>Close</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        );
    };

    const renderTestHistory = () => {
        if (testHistory.length === 0) return null;

        return (
            <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Test History
                </Typography>
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Version</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Total</TableCell>
                                <TableCell>Passed</TableCell>
                                <TableCell>Failed</TableCell>
                                <TableCell>Avg Score</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {testHistory.map((execution) => (
                                <TableRow key={execution.execution_id} hover>
                                    <TableCell>
                                        <Chip
                                            label={`v${execution.prompt_version}`}
                                            size="small"
                                            color="primary"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {new Date(execution.created_at).toLocaleDateString()}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(execution.created_at).toLocaleTimeString()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{execution.total_tests}</TableCell>
                                    <TableCell>
                                        <Typography color="success.main">
                                            {execution.passed_tests}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography color="error.main">
                                            {execution.failed_tests}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {execution.avg_comparison_score ? (
                                            <Typography variant="body2">
                                                {(execution.avg_comparison_score * 100).toFixed(1)}%
                                            </Typography>
                                        ) : (
                                            '-'
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => selectedPrompt && loadTestResultsForVersion(selectedPrompt.id, execution.prompt_version)}
                                            disabled={testLoading}
                                        >
                                            View Results
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
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
                                <Box display="flex" alignItems="center">
                                    <Typography variant="h6">LLM Configurations</Typography>
                                    <IconButton
                                        size="small"
                                        sx={{ ml: 0.5 }}
                                        title="Configure different LLM providers to test your prompts. Set API keys via environment variables (OPENAI_API_KEY, ANTHROPIC_API_KEY) for security, or enter them manually here."
                                    >
                                        <ScienceIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Box>
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
                        {renderTestHistory()}
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
        <Dialog open={isEditDialogOpen} onClose={closeEditDialog} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center">
                    <EditIcon sx={{ mr: 1 }} />
                    Edit Prompt
                    {editingVersion && (
                        <Chip
                            label={`Version ${editingVersion}`}
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1 }}
                        />
                    )}
                </Box>
            </DialogTitle>
            <DialogContent>
                {editingPrompt && (
                    <Box sx={{ mt: 2 }}>
                        <Grid container spacing={3}>
                            {/* Prompt Name */}
                            <Grid item xs={8}>
                                <Box display="flex" alignItems="center" mb={1}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                        Prompt Name
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        sx={{ ml: 0.5 }}
                                        title="Give your prompt a clear, descriptive name that explains its purpose. This helps you find and organize prompts later."
                                    >
                                        <ScienceIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Box>
                                <TextField
                                    fullWidth
                                    label="Prompt Name"
                                    value={editingPrompt.name || ''}
                                    onChange={(e) => handleUpdateEditingPrompt('name', e.target.value)}
                                    helperText="A descriptive name to identify this prompt"
                                />
                            </Grid>

                            {/* Prompt ID (read-only) */}
                            <Grid item xs={4}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Prompt ID
                                    </Typography>
                                    <Box display="flex" alignItems="center">
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', mr: 1 }}>
                                            {editingPrompt.id}
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            onClick={() => copyToClipboard(editingPrompt.id)}
                                            title="Copy ID"
                                        >
                                            <CopyIcon sx={{ fontSize: '16px' }} />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </Grid>

                            {/* Prompt Text */}
                            <Grid item xs={12}>
                                <Box display="flex" alignItems="center" mb={1}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                        Prompt Text
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        sx={{ ml: 0.5 }}
                                        title="Write your AI prompt here. Use {variable_name} syntax for dynamic values that will be replaced at runtime. Be clear and specific about what you want the AI to do."
                                    >
                                        <ScienceIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Box>
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
                                <Box display="flex" alignItems="center" mb={1}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                        Prompt Type
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        sx={{ ml: 0.5 }}
                                        title="Simple: Basic prompts • Tool-aware: Integrates with analysis tools • Workflow-aware: Part of complex workflows"
                                    >
                                        <ScienceIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Box>
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
                                <Box display="flex" alignItems="center" mb={1}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                        Tags
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        sx={{ ml: 0.5 }}
                                        title="Add tags to organize and categorize your prompts. Use comma-separated values like: analysis, data, optimization"
                                    >
                                        <ScienceIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Box>
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
                                    <Box display="flex" alignItems="center">
                                        <Typography variant="h6">Test Cases</Typography>
                                        <IconButton
                                            size="small"
                                            sx={{ ml: 0.5 }}
                                            title="Test cases validate your prompt's behavior with real input/output examples. Click example buttons below to populate with complete working examples including suggested prompt text that uses the input variables."
                                        >
                                            <ScienceIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Box>
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
                                    <Card key={`edit-card-${testCase.id || index}-${renderCounter}`} sx={{ mb: 2 }}>
                                        <CardContent>
                                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                                        Test Case {index + 1}: {testCase.name}
                                                    </Typography>
                                                    <Box display="flex" alignItems="center" mt={0.5}>
                                                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                                            ID: {testCase.id || 'new'}
                                                        </Typography>
                                                        {testCase.id && (
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => copyToClipboard(testCase.id)}
                                                                title="Copy test case ID"
                                                                sx={{ ml: 0.5, p: 0.25 }}
                                                            >
                                                                <CopyIcon sx={{ fontSize: '10px' }} />
                                                            </IconButton>
                                                        )}
                                                    </Box>
                                                </Box>
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
                                                        title="Delete test case"
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
                                                <Grid item xs={12}>
                                                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Use Example:
                                                        </Typography>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() => handleUseExample(index, 'text-analysis')}
                                                        >
                                                            Text Analysis
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() => handleUseExample(index, 'data-processing')}
                                                        >
                                                            Data Processing
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() => handleUseExample(index, 'math-calculation')}
                                                        >
                                                            Math
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() => handleUseExample(index, 'data-transformation')}
                                                        >
                                                            Data Transform
                                                        </Button>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <TextField
                                                        key={`edit-input-${index}-${renderCounter}`}
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
                                                        key={`edit-output-${index}-${renderCounter}`}
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
                                <Box display="flex" alignItems="center" mb={1}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                        Tool Dependencies
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        sx={{ ml: 0.5 }}
                                        title="List tools this prompt depends on. Use comma-separated tool IDs. Leave empty if no tools are required."
                                    >
                                        <ScienceIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Box>
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
                                <Box display="flex" alignItems="center" mb={1}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                        Workflow Dependencies
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        sx={{ ml: 0.5 }}
                                        title="List workflows this prompt depends on. Use comma-separated workflow IDs. Leave empty if no workflows are required."
                                    >
                                        <ScienceIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Box>
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
                <Button onClick={closeEditDialog}>Cancel</Button>
                <Button
                    onClick={handleSavePrompt}
                    variant="contained"
                    startIcon={<EditIcon />}
                    disabled={!editingPrompt || loading}
                >
                    {editingVersion && selectedVersions[editingPrompt?.id || ''] !== undefined
                        ? `Update Version ${editingVersion}`
                        : 'Create New Version'}
                </Button>
            </DialogActions>
        </Dialog>
    );

    const closeEditDialog = () => {
        setIsEditDialogOpen(false);
        setEditingPrompt(null);
        setEditingVersion(null);
        setError(null);
    };

    const renderCreateDialog = () => {
        console.log('Rendering create dialog. isCreateDialogOpen:', isCreateDialogOpen, 'editingPrompt:', editingPrompt, 'loading:', loading);

        return (
            <Dialog open={isCreateDialogOpen} onClose={handleCloseCreateDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box display="flex" alignItems="center">
                        <AddIcon sx={{ mr: 1 }} />
                        Create New Prompt
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Grid container spacing={3}>
                            {/* Prompt Name */}
                            <Grid item xs={12}>
                                <Box display="flex" alignItems="center" mb={1}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                        Prompt Name
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        sx={{ ml: 0.5 }}
                                        title="Give your prompt a clear, descriptive name that explains its purpose. This helps you find and organize prompts later."
                                    >
                                        <ScienceIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Box>
                                <TextField
                                    fullWidth
                                    label="Prompt Name"
                                    value={editingPrompt?.name || ''}
                                    onChange={(e) => {
                                        console.log('Name field onChange:', e.target.value);
                                        handleUpdateEditingPrompt('name', e.target.value);
                                    }}
                                    helperText="A descriptive name to identify this prompt"
                                    disabled={false}
                                />
                            </Grid>

                            {/* Prompt Text */}
                            <Grid item xs={12}>
                                <Box display="flex" alignItems="center" mb={1}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                        Prompt Text
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        sx={{ ml: 0.5 }}
                                        title="Write your AI prompt here. Use {variable_name} syntax for dynamic values that will be replaced at runtime. Be clear and specific about what you want the AI to do."
                                    >
                                        <ScienceIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Box>
                                <TextField
                                    fullWidth
                                    label="Prompt Text"
                                    multiline
                                    rows={4}
                                    value={editingPrompt?.text || ''}
                                    onChange={(e) => {
                                        console.log('Text field onChange:', e.target.value);
                                        handleUpdateEditingPrompt('text', e.target.value);
                                    }}
                                    helperText="Use {variable_name} for variables that will be replaced during execution"
                                    disabled={false}
                                />
                            </Grid>

                            {/* Type */}
                            <Grid item xs={6}>
                                <Box display="flex" alignItems="center" mb={1}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                        Prompt Type
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        sx={{ ml: 0.5 }}
                                        title="Simple: Basic prompts • Tool-aware: Integrates with analysis tools • Workflow-aware: Part of complex workflows"
                                    >
                                        <ScienceIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Box>
                                <FormControl fullWidth>
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                        value={editingPrompt?.type || 'simple'}
                                        onChange={(e) => {
                                            console.log('Type field onChange:', e.target.value);
                                            handleUpdateEditingPrompt('type', e.target.value);
                                        }}
                                        disabled={false}
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
                                <Box display="flex" alignItems="center" mb={1}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                        Tags
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        sx={{ ml: 0.5 }}
                                        title="Add tags to organize and categorize your prompts. Use comma-separated values like: analysis, data, optimization"
                                    >
                                        <ScienceIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Box>
                                <TextField
                                    fullWidth
                                    label="Tags"
                                    value={editingPrompt?.tags?.join(', ') || ''}
                                    onChange={(e) => {
                                        console.log('Tags field onChange:', e.target.value);
                                        handleUpdateEditingPrompt('tags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag));
                                    }}
                                    helperText="Comma-separated tags"
                                    disabled={false}
                                />
                            </Grid>

                            {/* Test Cases */}
                            <Grid item xs={12}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Box display="flex" alignItems="center">
                                        <Typography variant="h6">Test Cases</Typography>
                                        <IconButton
                                            size="small"
                                            sx={{ ml: 0.5 }}
                                            title="Test cases validate your prompt's behavior with real input/output examples. Click example buttons below to populate with complete working examples including suggested prompt text that uses the input variables."
                                        >
                                            <ScienceIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Box>
                                    <Button
                                        startIcon={<AddIcon />}
                                        onClick={handleAddTestCase}
                                        variant="outlined"
                                        size="small"
                                    >
                                        Add Test Case
                                    </Button>
                                </Box>

                                {editingPrompt?.test_cases?.map((testCase, index) => (
                                    <Card key={`create-card-${testCase.id || index}-${renderCounter}`} sx={{ mb: 2 }}>
                                        <CardContent>
                                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                                        Test Case {index + 1}: {testCase.name}
                                                    </Typography>
                                                </Box>
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
                                                        title="Delete test case"
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
                                                <Grid item xs={12}>
                                                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Use Example:
                                                        </Typography>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() => handleUseExample(index, 'text-analysis')}
                                                        >
                                                            Text Analysis
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() => handleUseExample(index, 'data-processing')}
                                                        >
                                                            Data Processing
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() => handleUseExample(index, 'math-calculation')}
                                                        >
                                                            Math
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() => handleUseExample(index, 'data-transformation')}
                                                        >
                                                            Data Transform
                                                        </Button>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <TextField
                                                        key={`create-input-${index}-${renderCounter}`}
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
                                                        key={`create-output-${index}-${renderCounter}`}
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

                                {(!editingPrompt?.test_cases || editingPrompt.test_cases.length === 0) && (
                                    <Alert severity="info">
                                        No test cases. Add test cases to validate your prompt's behavior.
                                    </Alert>
                                )}
                            </Grid>

                            {/* Tool Dependencies */}
                            <Grid item xs={6}>
                                <Box display="flex" alignItems="center" mb={1}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                        Tool Dependencies
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        sx={{ ml: 0.5 }}
                                        title="List tools this prompt depends on. Use comma-separated tool IDs. Leave empty if no tools are required."
                                    >
                                        <ScienceIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Box>
                                <TextField
                                    fullWidth
                                    label="Tool Dependencies"
                                    value={editingPrompt?.tool_dependencies?.join(', ') || ''}
                                    onChange={(e) => {
                                        console.log('Tool Dependencies onChange:', e.target.value);
                                        handleUpdateEditingPrompt('tool_dependencies', e.target.value.split(',').map(dep => dep.trim()).filter(dep => dep));
                                    }}
                                    helperText="Comma-separated tool IDs"
                                    disabled={false}
                                />
                            </Grid>

                            {/* Workflow Dependencies */}
                            <Grid item xs={6}>
                                <Box display="flex" alignItems="center" mb={1}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                        Workflow Dependencies
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        sx={{ ml: 0.5 }}
                                        title="List workflows this prompt depends on. Use comma-separated workflow IDs. Leave empty if no workflows are required."
                                    >
                                        <ScienceIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Box>
                                <TextField
                                    fullWidth
                                    label="Workflow Dependencies"
                                    value={editingPrompt?.workflow_dependencies?.join(', ') || ''}
                                    onChange={(e) => {
                                        console.log('Workflow Dependencies onChange:', e.target.value);
                                        handleUpdateEditingPrompt('workflow_dependencies', e.target.value.split(',').map(dep => dep.trim()).filter(dep => dep));
                                    }}
                                    helperText="Comma-separated workflow IDs"
                                    disabled={false}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCreateDialog}>Cancel</Button>
                    <Button
                        onClick={() => {
                            console.log('Create button clicked, editingPrompt:', editingPrompt, 'loading:', loading);
                            handleCreatePrompt();
                        }}
                        variant="contained"
                        startIcon={<AddIcon />}
                        disabled={!editingPrompt || loading}
                    >
                        Create Prompt
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    const renderHelpDialog = () => (
        <Dialog open={isHelpDialogOpen} onClose={() => setIsHelpDialogOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center">
                    <ScienceIcon sx={{ mr: 1 }} />
                    Prompt Manager Help Guide
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Welcome to the Prompt Manager!
                    </Typography>
                    <Typography variant="body1" paragraph>
                        The Prompt Manager helps you create, test, and manage AI prompts for your workflows.
                        Here's how to get started:
                    </Typography>

                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                        🚀 Creating Prompts
                    </Typography>
                    <Typography variant="body2" paragraph>
                        • Click "Create Prompt" to start building a new prompt<br />
                        • Give it a descriptive name to identify it later<br />
                        • Write your prompt text using {`{variable_name}`} for dynamic values<br />
                        • Choose the appropriate type: Simple, Tool-aware, or Workflow-aware<br />
                        • Add relevant tags for organization
                    </Typography>

                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                        🧪 Test Cases
                    </Typography>
                    <Typography variant="body2" paragraph>
                        • Add test cases to validate your prompt's behavior<br />
                        • Each test case should have sample input and expected output<br />
                        • Use JSON format for structured data<br />
                        • Enable/disable test cases as needed<br />
                        • Test cases help ensure your prompts work consistently
                    </Typography>

                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                        🤖 LLM Testing
                    </Typography>
                    <Typography variant="body2" paragraph>
                        • Click "Test" on any prompt to run it with real LLMs<br />
                        • Configure multiple LLM providers (OpenAI, Anthropic, etc.)<br />
                        • Set API keys via environment variables for security<br />
                        • Compare responses across different models<br />
                        • View execution times and response quality scores
                    </Typography>

                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                        🔧 Prompt Types
                    </Typography>
                    <Typography variant="body2" paragraph>
                        • <strong>Simple:</strong> Basic prompts for general use<br />
                        • <strong>Tool-aware:</strong> Prompts that integrate with analysis tools<br />
                        • <strong>Workflow-aware:</strong> Prompts designed for complex workflows
                    </Typography>

                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                        💡 Pro Tips
                    </Typography>
                    <Typography variant="body2" paragraph>
                        • Use descriptive names and tags for easy searching<br />
                        • Start with simple test cases and gradually add complexity<br />
                        • Test with multiple LLMs to ensure robustness<br />
                        • Keep prompt text focused and clear<br />
                        • Review test results to refine your prompts
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setIsHelpDialogOpen(false)} variant="contained">
                    Got it!
                </Button>
            </DialogActions>
        </Dialog>
    );

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center">
                    <Typography variant="h4">Prompt Manager</Typography>
                    <IconButton
                        size="small"
                        onClick={() => setIsHelpDialogOpen(true)}
                        sx={{ ml: 1 }}
                        title="Learn how to use the Prompt Manager"
                    >
                        <ScienceIcon />
                    </IconButton>
                </Box>
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
                        onClick={openCreateDialog}
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
                <Alert severity="success" sx={{ mb: 2 }} action={
                    <IconButton
                        size="small"
                        color="inherit"
                        title="Each prompt card shows: Name & ID (click to copy), Type badge, Preview text, Tags, Test case count, Edit/Delete buttons, and Test button"
                    >
                        <ScienceIcon />
                    </IconButton>
                }>
                    ✅ Connected to microservices successfully! Found {prompts.length} prompts.
                </Alert>
            )}

            {/* Main content */}
            <Grid container spacing={3}>
                {prompts.map((prompt) => {
                    const displayPrompt = getDisplayPrompt(prompt);
                    const versions = promptVersions[prompt.id] || [];
                    const selectedVersion = selectedVersions[prompt.id] || prompt.version;

                    return (
                        <Grid item xs={12} md={6} lg={4} key={prompt.id}>
                            <Card>
                                <CardContent>
                                    {/* Header with name and actions */}
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                        <Box flexGrow={1}>
                                            <Box display="flex" alignItems="center" mb={1}>
                                                {displayPrompt.type === 'simple' && <CodeIcon sx={{ mr: 1, color: 'primary.main' }} />}
                                                {displayPrompt.type === 'tool-aware' && <ScienceIcon sx={{ mr: 1, color: 'warning.main' }} />}
                                                {displayPrompt.type === 'workflow-aware' && <WorkflowIcon sx={{ mr: 1, color: 'success.main' }} />}
                                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                    {displayPrompt.name || 'Unnamed Prompt'}
                                                </Typography>
                                            </Box>

                                            {/* ID display with copy functionality */}
                                            <Box display="flex" alignItems="center" mb={1}>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                                    ID: {prompt.id.substring(0, 8)}...
                                                </Typography>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => copyToClipboard(prompt.id)}
                                                    title="Copy full ID"
                                                    sx={{ ml: 0.5, p: 0.25 }}
                                                >
                                                    <CopyIcon sx={{ fontSize: '12px' }} />
                                                </IconButton>
                                            </Box>

                                            {/* Type badge and Version selector */}
                                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                <Chip
                                                    label={displayPrompt.type}
                                                    size="small"
                                                    sx={{
                                                        textTransform: 'capitalize',
                                                        bgcolor: displayPrompt.type === 'simple' ? 'primary.light' :
                                                            displayPrompt.type === 'tool-aware' ? 'warning.light' : 'success.light'
                                                    }}
                                                />

                                                {/* Version selector */}
                                                {versions.length > 1 && (
                                                    <FormControl size="small" sx={{ minWidth: 80 }}>
                                                        <Select
                                                            value={selectedVersion}
                                                            onChange={(e) => handleVersionChange(prompt.id, e.target.value as number)}
                                                            displayEmpty
                                                            sx={{
                                                                height: 24,
                                                                fontSize: '0.75rem',
                                                                '& .MuiSelect-select': {
                                                                    py: 0.5,
                                                                    px: 1
                                                                }
                                                            }}
                                                        >
                                                            {versions.map((version) => (
                                                                <MenuItem key={version.version} value={version.version}>
                                                                    v{version.version}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                )}

                                                {/* Current version indicator if only one version */}
                                                {versions.length <= 1 && (
                                                    <Chip
                                                        label={`v${displayPrompt.version}`}
                                                        size="small"
                                                        variant="outlined"
                                                        color="primary"
                                                    />
                                                )}
                                            </Box>

                                            {/* Prompt text preview */}
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                {displayPrompt.text.length > 100 ? `${displayPrompt.text.substring(0, 100)}...` : displayPrompt.text}
                                            </Typography>
                                        </Box>

                                        {/* Action buttons */}
                                        <Box>
                                            <IconButton size="small" onClick={() => openEditDialog(prompt)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleDeletePrompt(prompt.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    {/* Tags */}
                                    <Box mb={2}>
                                        {displayPrompt.tags.map((tag) => (
                                            <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
                                        ))}
                                    </Box>

                                    {/* Test cases info and actions */}
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {displayPrompt.test_cases.length} test case{displayPrompt.test_cases.length !== 1 ? 's' : ''}
                                            </Typography>
                                            {displayPrompt.test_cases.length > 0 && (
                                                <Typography variant="caption" display="block" color="text.secondary">
                                                    {displayPrompt.test_cases.filter(tc => tc.enabled).length} enabled
                                                </Typography>
                                            )}
                                        </Box>
                                        <Button
                                            startIcon={<PlayIcon />}
                                            onClick={() => openTestDialog(prompt)}
                                            variant="outlined"
                                            size="small"
                                            disabled={displayPrompt.test_cases.length === 0}
                                        >
                                            Test
                                        </Button>
                                    </Box>

                                    {/* Version and metadata */}
                                    <Box mt={1} pt={1} borderTop="1px solid" borderColor="divider">
                                        <Typography variant="caption" color="text.secondary">
                                            v{displayPrompt.version} • Created by {displayPrompt.created_by} • {new Date(displayPrompt.created_at).toLocaleDateString()}
                                            {selectedVersion !== prompt.version && (
                                                <Typography component="span" sx={{ ml: 1, color: 'warning.main', fontWeight: 'bold' }}>
                                                    (Viewing older version)
                                                </Typography>
                                            )}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
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
                        onClick={openCreateDialog}
                    >
                        Create Your First Prompt
                    </Button>
                </Box>
            )}

            {/* Dialogs */}
            {renderLLMConfigDialog()}
            {renderEditDialog()}
            {renderCreateDialog()}
            {renderHelpDialog()}
        </Box>
    );
};

export default PromptManager; 