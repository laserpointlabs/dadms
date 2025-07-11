import {
    Add as AddIcon,
    CheckCircle as CheckCircleIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Error as ErrorIcon,
    PlayArrow as PlayIcon,
    Science as ScienceIcon
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    LinearProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import {
    LLMProvider,
    promptService,
    TestPromptRequest,
    TestPromptResponse
} from '../services/microservices-api';

// Types
interface TestCase {
    id: string | number;
    input: string;
    expected_output: string;
    context?: any;
}

interface Prompt {
    id: string;
    name: string;
    text: string;
    version: number;
    type?: string;
    tags?: string[];
    description?: string;
    test_cases: Array<{
        id: string;
        name: string;
        input: any;
        expected_output: any;
        enabled: boolean;
    }>;
}

// Remove the duplicate type definitions since we're importing from the API service

const PromptManagerSimple: React.FC = () => {
    // State
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
    const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
    const [testResults, setTestResults] = useState<TestPromptResponse | null>(null);
    const [testLoading, setTestLoading] = useState(false);

    // Edit/Create state
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);

    // Load prompts on mount
    useEffect(() => {
        loadPrompts();
    }, []);

    const loadPrompts = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('🔄 Loading prompts...');

            const response = await promptService.getPrompts();
            console.log('✅ Prompts loaded:', response.data.data);

            setPrompts(response.data.data);
        } catch (err) {
            console.error('❌ Failed to load prompts:', err);
            setError(err instanceof Error ? err.message : 'Failed to load prompts');
        } finally {
            setLoading(false);
        }
    };

    const openTestDialog = (prompt: Prompt) => {
        console.log('🔄 Opening test dialog for prompt:', prompt.id);

        // Clear all previous state
        setSelectedPrompt(prompt);
        setTestResults(null);
        setError(null);
        setTestLoading(false);
        setIsTestDialogOpen(true);
    };

    const closeTestDialog = () => {
        console.log('🔄 Closing test dialog');

        // Clear all state
        setIsTestDialogOpen(false);
        setSelectedPrompt(null);
        setTestResults(null);
        setError(null);
        setTestLoading(false);
    };

    const runTest = async () => {
        if (!selectedPrompt) {
            console.error('❌ No prompt selected');
            return;
        }

        console.log('🚀 Starting test for prompt:', selectedPrompt.id);

        try {
            // Clear previous results
            setTestResults(null);
            setError(null);
            setTestLoading(true);

            // Get enabled test cases
            const enabledTestCases = selectedPrompt.test_cases.filter(tc => tc.enabled);
            if (enabledTestCases.length === 0) {
                throw new Error('No enabled test cases found');
            }

            const testCaseIds = enabledTestCases.map(tc => tc.id);
            console.log('🎯 Testing with cases:', testCaseIds);

            // Prepare request
            const testRequest: TestPromptRequest = {
                test_case_ids: testCaseIds,
                llm_configs: [{
                    provider: 'openai' as LLMProvider,
                    model: 'gpt-3.5-turbo',
                    temperature: 0.7,
                    maxTokens: 1000
                }],
                enable_comparison: false
            };

            console.log('📤 Sending request:', testRequest);

            // Make API call with fresh timestamp to avoid caching
            const timestamp = Date.now();
            const response = await promptService.testPrompt(selectedPrompt.id, testRequest);

            console.log(`✅ Response received (${timestamp}):`, response.data);

            // Validate response
            if (!response.data.success) {
                const errorData = response.data as any;
                throw new Error(errorData.error || 'API returned success=false');
            }

            if (!response.data.data || !response.data.data.results) {
                throw new Error('Invalid response structure: missing results');
            }

            // Set results
            const testData = response.data.data;
            console.log('📊 Setting test results:', testData);

            setTestResults(testData);
            console.log('✅ Test completed successfully');

        } catch (err) {
            console.error('💥 Test failed:', err);
            const errorMessage = err instanceof Error ? err.message : 'Test execution failed';
            setError(errorMessage);
        } finally {
            setTestLoading(false);
        }
    };

    // CRUD Operations
    const savePrompt = async (promptData: Partial<Prompt>) => {
        try {
            setError(null);
            setSaveLoading(true);

            if (isCreating) {
                // Create new prompt
                const response = await fetch('http://localhost:3001/prompts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: promptData.name,
                        text: promptData.text,
                        description: promptData.description || '',
                        type: promptData.type || 'general',
                        tags: promptData.tags || [],
                        test_cases: promptData.test_cases || []
                    })
                });

                if (!response.ok) {
                    const errorData = await response.text();
                    throw new Error(`Failed to create prompt: ${errorData}`);
                }

                console.log('✅ Prompt created successfully');
            } else {
                // Update existing prompt
                const response = await fetch(`http://localhost:3001/prompts/${promptData.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(promptData)
                });

                if (!response.ok) {
                    const errorData = await response.text();
                    throw new Error(`Failed to update prompt: ${errorData}`);
                }

                console.log('✅ Prompt updated successfully');
            }

            // Refresh prompts list
            await loadPrompts();
            closeEditDialog();

        } catch (err) {
            console.error('💥 Save failed:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to save prompt';
            setError(errorMessage);
        } finally {
            setSaveLoading(false);
        }
    };

    const deletePrompt = async (promptId: string | number) => {
        if (!window.confirm('Are you sure you want to delete this prompt?')) {
            return;
        }

        try {
            setError(null);
            const response = await fetch(`http://localhost:3001/prompts/${promptId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Failed to delete prompt: ${errorData}`);
            }

            console.log('✅ Prompt deleted successfully');
            await loadPrompts();

        } catch (err) {
            console.error('💥 Delete failed:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete prompt';
            setError(errorMessage);
        }
    };

    const addTestCase = () => {
        if (!editingPrompt) return;

        const newTestCase = {
            id: Date.now().toString(), // Temporary ID for new test cases
            name: `Test Case ${(editingPrompt.test_cases || []).length + 1}`,
            input: {},
            expected_output: '',
            enabled: true
        };

        setEditingPrompt({
            ...editingPrompt,
            test_cases: [...(editingPrompt.test_cases || []), newTestCase]
        });
    };

    const updateTestCase = (index: number, field: string, value: any) => {
        if (!editingPrompt) return;

        const updatedTestCases = [...(editingPrompt.test_cases || [])];
        updatedTestCases[index] = { ...updatedTestCases[index], [field]: value };

        setEditingPrompt({
            ...editingPrompt,
            test_cases: updatedTestCases
        });
    };

    const removeTestCase = (index: number) => {
        if (!editingPrompt) return;

        const updatedTestCases = [...(editingPrompt.test_cases || [])];
        updatedTestCases.splice(index, 1);

        setEditingPrompt({
            ...editingPrompt,
            test_cases: updatedTestCases
        });
    };

    const openCreateDialog = () => {
        setIsCreating(true);
        setEditingPrompt({
            id: '',
            name: '',
            text: '',
            description: '',
            type: 'general',
            tags: [],
            version: 1,
            test_cases: []
        });
        setIsEditDialogOpen(true);
    };

    const openEditDialog = (prompt: Prompt) => {
        setIsCreating(false);
        setEditingPrompt({ ...prompt });
        setIsEditDialogOpen(true);
    };

    const closeEditDialog = () => {
        setIsEditDialogOpen(false);
        setEditingPrompt(null);
        setIsCreating(false);
    };

    // Render functions
    const renderPromptCard = (prompt: Prompt) => (
        <Card key={prompt.id} sx={{ mb: 2 }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="h6">{prompt.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Version {prompt.version} • {prompt.test_cases.length} test cases
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, maxWidth: 400 }}>
                            {prompt.text.substring(0, 100)}...
                        </Typography>
                    </Box>
                    <Box display="flex" gap={1}>
                        <IconButton
                            size="small"
                            onClick={() => openEditDialog(prompt)}
                            color="primary"
                        >
                            <EditIcon />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={() => deletePrompt(prompt.id)}
                            color="error"
                        >
                            <DeleteIcon />
                        </IconButton>
                        <Button
                            variant="contained"
                            startIcon={<ScienceIcon />}
                            onClick={() => openTestDialog(prompt)}
                            disabled={prompt.test_cases.length === 0}
                        >
                            Test
                        </Button>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );

    const renderTestResults = () => {
        if (!testResults) return null;

        return (
            <Box sx={{ mt: 2 }}>
                {/* Summary */}
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

                {/* Results Table */}
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Test Case</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>LLM Response</TableCell>
                                <TableCell>Score</TableCell>
                                <TableCell>Time</TableCell>
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
                                        {result.llm_response?.content || result.actual_output || result.error || 'No response'}
                                    </TableCell>
                                    <TableCell>
                                        {result.comparison_score !== undefined ?
                                            `${(result.comparison_score * 100).toFixed(1)}%` : '-'}
                                    </TableCell>
                                    <TableCell>{result.execution_time_ms}ms</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        );
    };

    const renderTestDialog = () => (
        <Dialog open={isTestDialogOpen} onClose={closeTestDialog} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center">
                    <ScienceIcon sx={{ mr: 1 }} />
                    Test Prompt: {selectedPrompt?.name}
                </Box>
            </DialogTitle>
            <DialogContent>
                {selectedPrompt && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            <strong>Prompt:</strong> {selectedPrompt.text}
                        </Typography>

                        <Typography variant="body2" sx={{ mb: 2 }}>
                            <strong>Test Cases:</strong> {selectedPrompt.test_cases.filter(tc => tc.enabled).length} enabled
                        </Typography>

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        {testLoading && (
                            <Box display="flex" justifyContent="center" p={2}>
                                <CircularProgress />
                                <Typography sx={{ ml: 2 }}>Running test...</Typography>
                            </Box>
                        )}

                        {renderTestResults()}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={closeTestDialog}>Close</Button>
                <Button
                    onClick={runTest}
                    variant="contained"
                    startIcon={<PlayIcon />}
                    disabled={testLoading || !selectedPrompt}
                >
                    Run Test
                </Button>
            </DialogActions>
        </Dialog>
    );

    // Main render
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Simple Prompt Manager
            </Typography>

            {/* Action Bar */}
            <Box display="flex" justifyContent="between" alignItems="center" sx={{ mb: 3 }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={openCreateDialog}
                    color="primary"
                >
                    Create New Prompt
                </Button>
            </Box>

            {error && !isTestDialogOpen && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box>
                    {prompts.length === 0 ? (
                        <Typography variant="body1" color="text.secondary">
                            No prompts found
                        </Typography>
                    ) : (
                        prompts.map(renderPromptCard)
                    )}
                </Box>
            )}

            {renderTestDialog()}

            {/* Edit/Create Dialog */}
            <Dialog open={isEditDialogOpen} onClose={closeEditDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {isCreating ? 'Create New Prompt' : 'Edit Prompt'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1 }}>
                        <TextField
                            label="Name"
                            fullWidth
                            margin="normal"
                            value={editingPrompt?.name || ''}
                            onChange={(e) => setEditingPrompt(prev => prev ? { ...prev, name: e.target.value } : null)}
                            required
                        />

                        <TextField
                            label="Description"
                            fullWidth
                            margin="normal"
                            multiline
                            rows={2}
                            value={editingPrompt?.description || ''}
                            onChange={(e) => setEditingPrompt(prev => prev ? { ...prev, description: e.target.value } : null)}
                        />

                        <TextField
                            label="Prompt Text"
                            fullWidth
                            margin="normal"
                            multiline
                            rows={4}
                            value={editingPrompt?.text || ''}
                            onChange={(e) => setEditingPrompt(prev => prev ? { ...prev, text: e.target.value } : null)}
                            required
                            helperText="Use {{variable}} for dynamic content"
                        />

                        <TextField
                            label="Type"
                            fullWidth
                            margin="normal"
                            value={editingPrompt?.type || 'general'}
                            onChange={(e) => setEditingPrompt(prev => prev ? { ...prev, type: e.target.value } : null)}
                        />

                        <Divider sx={{ my: 3 }} />

                        {/* Test Cases Section */}
                        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                            <Typography variant="h6">Test Cases</Typography>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={addTestCase}
                            >
                                Add Test Case
                            </Button>
                        </Box>

                        {editingPrompt?.test_cases?.map((testCase, index) => (
                            <Card key={index} sx={{ mb: 2, p: 2 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                    <Typography variant="subtitle2">Test Case {index + 1}</Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => removeTestCase(index)}
                                        color="error"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>

                                <TextField
                                    label="Input (JSON)"
                                    fullWidth
                                    margin="normal"
                                    size="small"
                                    multiline
                                    rows={3}
                                    value={typeof testCase.input === 'string' ? testCase.input : JSON.stringify(testCase.input, null, 2)}
                                    onChange={(e) => {
                                        try {
                                            // Try to parse as JSON, if it fails keep as string
                                            const parsed = JSON.parse(e.target.value);
                                            updateTestCase(index, 'input', parsed);
                                        } catch {
                                            // If not valid JSON, store as string (user might still be typing)
                                            updateTestCase(index, 'input', e.target.value);
                                        }
                                    }}
                                    required
                                    helperText='Enter JSON object, e.g., {"item": "apple"}'
                                />

                                <TextField
                                    label="Expected Output"
                                    fullWidth
                                    margin="normal"
                                    size="small"
                                    multiline
                                    rows={2}
                                    value={typeof testCase.expected_output === 'string' ? testCase.expected_output : JSON.stringify(testCase.expected_output, null, 2)}
                                    onChange={(e) => updateTestCase(index, 'expected_output', e.target.value)}
                                    required
                                />
                            </Card>
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeEditDialog}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={() => savePrompt(editingPrompt!)}
                        disabled={!editingPrompt?.name || !editingPrompt?.text || saveLoading}
                    >
                        {saveLoading ? <CircularProgress size={20} /> : (isCreating ? 'Create' : 'Save')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PromptManagerSimple;
