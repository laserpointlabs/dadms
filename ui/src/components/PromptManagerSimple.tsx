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
    const [historicalResults, setHistoricalResults] = useState<TestPromptResponse | null>(null);
    const [loadingHistorical, setLoadingHistorical] = useState(false);
    const [hiddenTestResults, setHiddenTestResults] = useState<Set<string>>(new Set());

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
        setHistoricalResults(null);
        setError(null);
        setTestLoading(false);
        setLoadingHistorical(false);
        setIsTestDialogOpen(true);

        // Load existing test results
        loadHistoricalResults(prompt.id);
    };

    const closeTestDialog = () => {
        console.log('🔄 Closing test dialog');

        // Clear all state
        setIsTestDialogOpen(false);
        setSelectedPrompt(null);
        setTestResults(null);
        setHistoricalResults(null);
        setError(null);
        setTestLoading(false);
        setLoadingHistorical(false);
        setHiddenTestResults(new Set());
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

    const loadHistoricalResults = async (promptId: string) => {
        try {
            setLoadingHistorical(true);
            console.log('🔄 Loading historical test results for prompt:', promptId);

            const response = await promptService.getTestResults(promptId);

            if (response.data.success && response.data.data) {
                console.log('✅ Historical results loaded:', response.data.data);
                setHistoricalResults(response.data.data);
            } else {
                console.log('ℹ️ No historical test results found');
                setHistoricalResults(null);
            }
        } catch (err) {
            console.log('ℹ️ No historical results available:', err);
            setHistoricalResults(null);
        } finally {
            setLoadingHistorical(false);
        }
    };

    // Test result management functions
    const hideTestResult = (resultIndex: number, isHistorical: boolean) => {
        const key = `${isHistorical ? 'historical' : 'current'}-${resultIndex}`;
        setHiddenTestResults(prev => new Set(prev).add(key));
    };

    const clearAllTestResults = async () => {
        if (!selectedPrompt) return;

        if (!window.confirm('Are you sure you want to clear all test results for this prompt? This action cannot be undone.')) {
            return;
        }

        try {
            setError(null);
            console.log('🗑️ Clearing all test results for prompt:', selectedPrompt.id);

            await promptService.deleteTestResults(selectedPrompt.id);

            // Clear both current and historical results
            setTestResults(null);
            setHistoricalResults(null);
            setHiddenTestResults(new Set());

            console.log('✅ All test results cleared successfully');
        } catch (err) {
            console.error('💥 Failed to clear test results:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to clear test results';
            setError(errorMessage);
        }
    };

    // Prompt templates for common use cases
    const promptTemplates = {
        decision: {
            name: "Decision Making Prompt",
            text: "Analyze the situation: {{situation}}\n\nConsider the following options:\n{{options}}\n\nEvaluate each option based on:\n- Pros and cons\n- Risk assessment\n- Expected outcomes\n\nProvide a clear recommendation with reasoning.",
            description: "For making informed decisions between multiple options",
            type: "decision",
            test_cases: [
                {
                    id: "decision-test-1",
                    name: "Business Decision Test",
                    input: {
                        situation: "Our startup needs to choose a technology stack",
                        options: "React vs Vue.js for frontend development"
                    },
                    expected_output: "A structured analysis with recommendation",
                    enabled: true
                }
            ]
        },
        calculation: {
            name: "Calculation Prompt",
            text: "Calculate the following: {{calculation}}\n\nShow your work step by step:\n1. Identify the problem\n2. List the given values\n3. Apply the appropriate formula\n4. Perform the calculation\n5. State the final answer with units\n\nProvide only the numerical result at the end: {{result}}",
            description: "For mathematical calculations and problem solving",
            type: "calculation",
            test_cases: [
                {
                    id: "calc-test-1",
                    name: "Basic Math Test",
                    input: {
                        calculation: "What is 15% of 240?"
                    },
                    expected_output: "36",
                    enabled: true
                }
            ]
        },
        qa_focused: {
            name: "Focused Q&A Prompt",
            text: "Question: {{question}}\n\nContext: {{context}}\n\nProvide a focused, accurate answer that:\n- Directly addresses the question\n- Is based on the given context\n- Is concise but complete\n- Includes relevant details\n\nAnswer:",
            description: "For answering specific questions with focused responses",
            type: "qa",
            test_cases: [
                {
                    id: "qa-test-1",
                    name: "Context-based Question",
                    input: {
                        question: "What is the capital of France?",
                        context: "European geography and major cities"
                    },
                    expected_output: "Paris",
                    enabled: true
                }
            ]
        },
        analysis: {
            name: "Analysis Prompt",
            text: "Analyze the following {{subject}}: {{content}}\n\nProvide a comprehensive analysis including:\n- Key findings\n- Patterns or trends\n- Strengths and weaknesses\n- Implications\n- Recommendations\n\nStructure your response clearly with headers for each section.",
            description: "For analyzing data, text, or situations",
            type: "analysis",
            test_cases: [
                {
                    id: "analysis-test-1",
                    name: "Text Analysis Test",
                    input: {
                        subject: "customer feedback",
                        content: "Product is great but shipping was slow"
                    },
                    expected_output: "Structured analysis with findings and recommendations",
                    enabled: true
                }
            ]
        },
        classification: {
            name: "Classification Prompt",
            text: "Classify the following {{item}}: {{content}}\n\nAvailable categories: {{categories}}\n\nRules for classification:\n- Choose the most appropriate category\n- Provide confidence level (1-10)\n- Explain your reasoning briefly\n\nResponse format:\nCategory: [category name]\nConfidence: [1-10]\nReason: [brief explanation]",
            description: "For categorizing or classifying content",
            type: "classification",
            test_cases: [
                {
                    id: "class-test-1",
                    name: "Email Classification",
                    input: {
                        item: "email",
                        content: "Urgent: Server down, need immediate assistance",
                        categories: "urgent, normal, low-priority, spam"
                    },
                    expected_output: "Category: urgent\nConfidence: 9\nReason: Contains 'urgent' and describes critical issue",
                    enabled: true
                }
            ]
        }
    };

    const applyTemplate = (templateKey: string) => {
        const template = promptTemplates[templateKey as keyof typeof promptTemplates];
        if (template && editingPrompt) {
            setEditingPrompt({
                ...editingPrompt,
                name: template.name,
                text: template.text,
                description: template.description,
                type: template.type,
                test_cases: template.test_cases
            });
        }
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

    const renderTestResults = (results?: TestPromptResponse, isHistorical = false) => {
        const resultsData = results || testResults;
        if (!resultsData) return null;

        const titlePrefix = isHistorical ? '📚 Historical' : '🚀 Current';

        return (
            <Box sx={{ mt: 2 }}>
                {!isHistorical && (
                    <Typography variant="h6" gutterBottom color="success.main">
                        {titlePrefix} Test Results
                    </Typography>
                )}

                {/* Summary */}
                <Card sx={{ mb: 2, border: isHistorical ? '1px solid #e0e0e0' : 'none' }}>
                    <CardContent>
                        <Grid container spacing={2}>
                            <Grid item xs={3}>
                                <Typography variant="h4" color="primary">
                                    {resultsData.summary.total}
                                </Typography>
                                <Typography variant="body2">Total Tests</Typography>
                            </Grid>
                            <Grid item xs={3}>
                                <Typography variant="h4" color="success.main">
                                    {resultsData.summary.passed}
                                </Typography>
                                <Typography variant="body2">Passed</Typography>
                            </Grid>
                            <Grid item xs={3}>
                                <Typography variant="h4" color="error.main">
                                    {resultsData.summary.failed}
                                </Typography>
                                <Typography variant="body2">Failed</Typography>
                            </Grid>
                            <Grid item xs={3}>
                                <Typography variant="h4">
                                    {resultsData.summary.execution_time_ms}ms
                                </Typography>
                                <Typography variant="body2">Execution Time</Typography>
                            </Grid>
                        </Grid>

                        {resultsData.summary.avg_comparison_score !== undefined && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" gutterBottom>
                                    Average Comparison Score: {(resultsData.summary.avg_comparison_score * 100).toFixed(1)}%
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={resultsData.summary.avg_comparison_score * 100}
                                    sx={{ height: 8, borderRadius: 4 }}
                                />
                            </Box>
                        )}
                    </CardContent>
                </Card>

                {/* Results Table */}
                <TableContainer component={Paper} sx={{ border: isHistorical ? '1px solid #e0e0e0' : 'none' }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Test Case</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>LLM Response</TableCell>
                                <TableCell>Score</TableCell>
                                <TableCell>Time</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {resultsData.results
                                .map((result, index) => ({ result, index }))
                                .filter(({ index }) => !hiddenTestResults.has(`${isHistorical ? 'historical' : 'current'}-${index}`))
                                .map(({ result, index }) => (
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
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                onClick={() => hideTestResult(index, isHistorical)}
                                                color="error"
                                                title="Hide this test result"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
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

                        {/* Historical Results Section */}
                        {loadingHistorical && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="h6" gutterBottom>Loading Previous Results...</Typography>
                                <LinearProgress />
                            </Box>
                        )}

                        {historicalResults && !loadingHistorical && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" gutterBottom color="primary">
                                    📊 Previous Test Results
                                </Typography>
                                {renderTestResults(historicalResults, true)}
                                <Divider sx={{ my: 2 }} />
                            </Box>
                        )}

                        {!historicalResults && !loadingHistorical && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    ℹ️ No previous test results found
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                            </Box>
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
                {(testResults || historicalResults) && (
                    <Button
                        onClick={clearAllTestResults}
                        color="error"
                        startIcon={<DeleteIcon />}
                        disabled={testLoading}
                    >
                        Clear All Results
                    </Button>
                )}
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
                    {isCreating && (
                        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                            <Typography variant="h6" gutterBottom color="primary">
                                🚀 Quick Start Templates
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                Choose a template below to get started quickly, or create your own from scratch. Templates include example test cases and best practices.
                            </Typography>

                            <Box display="flex" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => applyTemplate('decision')}
                                    sx={{ mb: 1 }}
                                >
                                    🎯 Decision Making
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => applyTemplate('calculation')}
                                    sx={{ mb: 1 }}
                                >
                                    🧮 Calculations
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => applyTemplate('qa_focused')}
                                    sx={{ mb: 1 }}
                                >
                                    ❓ Q&A Focused
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => applyTemplate('analysis')}
                                    sx={{ mb: 1 }}
                                >
                                    📊 Analysis
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => applyTemplate('classification')}
                                    sx={{ mb: 1 }}
                                >
                                    🏷️ Classification
                                </Button>
                            </Box>

                            <Typography variant="caption" color="text.secondary">
                                💡 <strong>Tips:</strong> Use {'{'}{'{'} variable {'}'} {'}'} for dynamic content • Add test cases to validate your prompt • Consider edge cases in your testing
                            </Typography>
                        </Box>
                    )}

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
