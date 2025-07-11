import {
    Add as AddIcon,
    CheckCircle as CheckCircleIcon,
    ContentCopy as ContentCopyIcon,
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
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    LinearProgress,
    MenuItem,
    Paper,
    Select,
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

interface LLMConfig {
    provider: LLMProvider;
    model: string;
    temperature: number;
    maxTokens: number;
}

interface OllamaModel {
    name: string;
    size: number;
    digest: string;
    modified_at: string;
}

interface LLMStatus {
    provider: string;
    available: boolean;
    models?: string[] | OllamaModel[];
    error?: string;
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

    // LLM Configuration state
    const [llmConfig, setLlmConfig] = useState<LLMConfig>({
        provider: 'openai' as LLMProvider,
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1000
    });
    const [llmStatus, setLlmStatus] = useState<Record<string, LLMStatus>>({});
    const [loadingLlmStatus, setLoadingLlmStatus] = useState(false);

    // Load prompts on mount
    useEffect(() => {
        loadPrompts();
        checkLlmStatus();
    }, []);

    const checkLlmStatus = async () => {
        setLoadingLlmStatus(true);
        const status: Record<string, LLMStatus> = {};

        try {
            // Check OpenAI status
            console.log('🔄 Checking OpenAI status...');
            try {
                const openaiResponse = await fetch('http://localhost:3002/health');
                if (openaiResponse.ok) {
                    status.openai = {
                        provider: 'openai',
                        available: true,
                        models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo']
                    };
                    console.log('✅ OpenAI service available');
                } else {
                    throw new Error('OpenAI service not responding');
                }
            } catch (err) {
                console.log('❌ OpenAI service unavailable:', err);
                status.openai = {
                    provider: 'openai',
                    available: false,
                    error: 'Service unavailable'
                };
            }

            // Check Ollama status and get models (direct connection to Ollama)
            console.log('🔄 Checking Ollama status...');
            try {
                // Try direct connection to Ollama first
                const ollamaHealthResponse = await fetch('http://localhost:11434/api/tags');
                if (ollamaHealthResponse.ok) {
                    const modelsData = await ollamaHealthResponse.json();
                    status.ollama = {
                        provider: 'ollama',
                        available: true,
                        models: modelsData.models.map((model: any) => `ollama/${model.name}`) || []
                    };
                    console.log('✅ Ollama service available with models:', modelsData.models.map((model: any) => `ollama/${model.name}`));
                } else {
                    // Fallback to microservice proxy
                    console.log('🔄 Trying Ollama via microservice proxy...');
                    const proxyHealthResponse = await fetch('http://localhost:3004/health');
                    if (proxyHealthResponse.ok) {
                        const modelsResponse = await fetch('http://localhost:3004/models');
                        if (modelsResponse.ok) {
                            const proxyModelsData = await modelsResponse.json();
                            status.ollama = {
                                provider: 'ollama',
                                available: true,
                                models: proxyModelsData.data?.models || []
                            };
                            console.log('✅ Ollama service available via proxy with models:', proxyModelsData.data?.models);
                        } else {
                            throw new Error('Could not fetch Ollama models via proxy');
                        }
                    } else {
                        throw new Error('Ollama service not responding on port 11434 or 3004');
                    }
                }
            } catch (err) {
                console.log('❌ Ollama service unavailable:', err);
                status.ollama = {
                    provider: 'ollama',
                    available: false,
                    error: 'Service unavailable'
                };
            }

        } catch (err) {
            console.error('💥 Error checking LLM status:', err);
        } finally {
            setLlmStatus(status);
            setLoadingLlmStatus(false);
        }
    };

    const getAvailableModels = (): string[] => {
        const currentStatus = llmStatus[llmConfig.provider];
        if (!currentStatus?.available || !currentStatus.models) {
            return [];
        }

        // All models are now returned as strings (Ollama models are prefixed with 'ollama/')
        return currentStatus.models as string[];
    };

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

            // Prepare request - convert ollama provider to local for backend
            const backendConfig = { ...llmConfig };
            if (llmConfig.provider === 'ollama') {
                backendConfig.provider = 'local' as LLMProvider;
            }

            const testRequest: TestPromptRequest = {
                test_case_ids: testCaseIds,
                llm_configs: [backendConfig],
                enable_comparison: false
            };

            console.log('📤 Sending request:', testRequest);
            console.log('🔧 Original config:', llmConfig);
            console.log('🔧 Backend config:', backendConfig);

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
        if (!window.confirm('Are you sure you want to delete this prompt? This will also delete all associated test results.')) {
            return;
        }

        try {
            setError(null);

            // First, clear all test results for this prompt
            console.log('🗑️ Clearing test results before deleting prompt:', promptId);
            try {
                await promptService.deleteTestResults(promptId.toString());
                console.log('✅ Test results cleared successfully');
            } catch (testResultsError) {
                console.log('ℹ️ No test results to clear or already cleared:', testResultsError);
                // Continue with prompt deletion even if test results clearing fails
            }

            // Now delete the prompt
            console.log('🗑️ Deleting prompt:', promptId);
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

    const copyPrompt = async (prompt: Prompt) => {
        try {
            setError(null);

            // Create a copy with modified name and new test case IDs
            const copiedPrompt = {
                ...prompt,
                name: `${prompt.name} (Copy)`,
                id: '', // Will be assigned by backend
                version: 1, // Reset version for new prompt
                test_cases: prompt.test_cases.map((testCase, index) => ({
                    ...testCase,
                    id: `copy-${Date.now()}-${index}`, // Generate new unique IDs
                    name: testCase.name || `Test Case ${index + 1}`
                }))
            };

            console.log('📋 Creating copy of prompt:', prompt.id);

            const response = await fetch('http://localhost:3001/prompts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: copiedPrompt.name,
                    text: copiedPrompt.text,
                    description: copiedPrompt.description || '',
                    type: copiedPrompt.type || 'simple',
                    tags: copiedPrompt.tags || [],
                    test_cases: copiedPrompt.test_cases || []
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Failed to copy prompt: ${errorData}`);
            }

            console.log('✅ Prompt copied successfully');
            await loadPrompts();

        } catch (err) {
            console.error('💥 Copy failed:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to copy prompt';
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
            type: "simple",
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
            type: "simple",
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
            type: "simple",
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
            type: "simple",
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
            type: "simple",
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
        },
        workflow_yesno: {
            name: "Workflow Yes/No Decision",
            text: "Task: {{task}}\n\nContext: {{context}}\n\nEvaluate the situation and make a binary decision.\n\nDecision Rules:\n✅ Answer YES only if: {{yes_criteria}}\n❌ Answer NO if: {{no_criteria}}\n\nImportant: You must answer with EXACTLY one word: either 'YES' or 'NO'\n\nStep-by-step evaluation:\n1. Check if the situation meets the YES criteria\n2. If ALL YES criteria are met, answer YES\n3. If ANY NO criteria are met, answer NO\n4. If in doubt, answer NO (fail-safe)\n\nDecision:",
            description: "Binary decision point for BPMN workflow routing",
            type: "tool-aware",
            test_cases: [
                {
                    id: "yesno-test-1",
                    name: "Approval Decision - YES Case",
                    input: {
                        task: "Approve expense report",
                        context: "Employee submitted $150 dinner expense with receipt. Amount is $150 which is under the $200 limit and receipt is provided.",
                        yes_criteria: "Amount is under $200 AND receipt is provided",
                        no_criteria: "Amount is $200 or more OR no receipt is provided"
                    },
                    expected_output: "YES",
                    enabled: true
                },
                {
                    id: "yesno-test-2",
                    name: "Approval Decision - NO Case (Over Limit)",
                    input: {
                        task: "Approve expense report",
                        context: "Employee submitted $250 dinner expense with receipt. Amount is $250 which exceeds the $200 limit.",
                        yes_criteria: "Amount is under $200 AND receipt is provided",
                        no_criteria: "Amount is $200 or more OR no receipt is provided"
                    },
                    expected_output: "NO",
                    enabled: true
                },
                {
                    id: "yesno-test-3",
                    name: "Approval Decision - NO Case (No Receipt)",
                    input: {
                        task: "Approve expense report",
                        context: "Employee submitted $120 dinner expense without receipt. Amount is under $200 but no receipt was provided.",
                        yes_criteria: "Amount is under $200 AND receipt is provided",
                        no_criteria: "Amount is $200 or more OR no receipt is provided"
                    },
                    expected_output: "NO",
                    enabled: true
                }
            ]
        },
        workflow_multichoice: {
            name: "Workflow Multi-Choice Router",
            text: "Situation: {{situation}}\n\nContext: {{context}}\n\nAvailable options:\nA) {{option_a}}\nB) {{option_b}}\nC) {{option_c}}\nD) {{option_d}}\nREDO) {{redo_condition}}\nRETURN) {{return_condition}}\n\nInstructions:\n- Choose the most appropriate option (A, B, C, D, REDO, or RETURN)\n- If none fit perfectly, use REDO to retry with more information\n- Use RETURN to go back to previous workflow step\n\nRespond with only the letter/word (A, B, C, D, REDO, or RETURN):\n\nChoice:",
            description: "Multi-choice decision with workflow control options",
            type: "tool-aware",
            test_cases: [
                {
                    id: "multi-test-1",
                    name: "Document Processing Route",
                    input: {
                        situation: "Document needs processing",
                        context: "PDF document with clear text and valid format",
                        option_a: "Send to automatic OCR processing",
                        option_b: "Send to manual review",
                        option_c: "Archive document",
                        option_d: "Request additional information",
                        redo_condition: "Document format unclear",
                        return_condition: "Document incomplete"
                    },
                    expected_output: "A",
                    enabled: true
                }
            ]
        },
        workflow_confidence: {
            name: "Confidence-Based Decision",
            text: "Task: {{task}}\n\nData: {{data}}\n\nAnalyze the available information and provide:\n1. Your assessment\n2. Confidence level (0-100)\n3. Decision based on confidence threshold\n\nConfidence Threshold: {{threshold}}%\n\nResponse Format:\nAssessment: [your analysis]\nConfidence: [0-100]\nDecision: [YES if confidence >= threshold, NO if below]\n\nResponse:",
            description: "Decision based on AI confidence level with threshold",
            type: "tool-aware",
            test_cases: [
                {
                    id: "confidence-test-1",
                    name: "Data Quality Check",
                    input: {
                        task: "Verify data quality for processing",
                        data: "Customer record: Name filled, Email valid, Phone number present, Address complete",
                        threshold: "80"
                    },
                    expected_output: "Assessment: All required fields present and valid\nConfidence: 95\nDecision: YES",
                    enabled: true
                }
            ]
        },
        workflow_priority: {
            name: "Workflow Priority Router",
            text: "Item: {{item}}\n\nContext: {{context}}\n\nEvaluate priority level based on:\n- Urgency: {{urgency_factors}}\n- Impact: {{impact_factors}}\n- Dependencies: {{dependencies}}\n\nPriority Levels:\nCRITICAL: Immediate action required, system-breaking\nHIGH: Action needed within 24 hours\nMEDIUM: Action needed within 1 week\nLOW: Can be handled in regular cycle\nDEFER: Can be postponed indefinitely\n\nRespond with only the priority level:\n\nPriority:",
            description: "Routes items based on calculated priority levels",
            type: "workflow-aware",
            test_cases: [
                {
                    id: "priority-test-1",
                    name: "Support Ticket Priority",
                    input: {
                        item: "Customer support ticket",
                        context: "Production system error affecting 50+ users",
                        urgency_factors: "Multiple users affected, production down",
                        impact_factors: "Revenue loss, customer satisfaction impact",
                        dependencies: "No workarounds available"
                    },
                    expected_output: "CRITICAL",
                    enabled: true
                }
            ]
        },
        workflow_validation: {
            name: "Workflow Data Validator",
            text: "Validation Task: {{validation_task}}\n\nData to validate: {{data}}\n\nValidation Rules:\n{{validation_rules}}\n\nCheck each rule and provide:\n1. PASS/FAIL for each rule\n2. Overall validation result\n3. Required actions if failed\n\nResponse Format:\nRule Checks:\n- Rule 1: [PASS/FAIL] - [reason]\n- Rule 2: [PASS/FAIL] - [reason]\n\nOverall Result: [VALID/INVALID]\nAction Required: [CONTINUE/FIX/REJECT]\nDetails: [explanation if needed]\n\nValidation:",
            description: "Validates data against rules for workflow progression",
            type: "tool-aware",
            test_cases: [
                {
                    id: "validation-test-1",
                    name: "Form Data Validation",
                    input: {
                        validation_task: "Validate user registration form",
                        data: "Email: user@example.com, Password: 12345, Age: 25",
                        validation_rules: "Email must contain @ symbol, Password must be 8+ characters, Age must be 18+"
                    },
                    expected_output: "Rule Checks:\n- Rule 1: PASS - Email contains @ symbol\n- Rule 2: FAIL - Password only 5 characters\n- Rule 3: PASS - Age is 25\n\nOverall Result: INVALID\nAction Required: FIX\nDetails: Password too short",
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
                            onClick={() => copyPrompt(prompt)}
                            color="info"
                            title="Copy prompt"
                        >
                            <ContentCopyIcon />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={() => openEditDialog(prompt)}
                            color="primary"
                            title="Edit prompt"
                        >
                            <EditIcon />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={() => deletePrompt(prompt.id)}
                            color="error"
                            title="Delete prompt"
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

                        {/* LLM Configuration Section */}
                        <Card sx={{ mb: 2, p: 2, bgcolor: 'background.paper' }}>
                            <Typography variant="h6" gutterBottom color="primary">
                                🤖 LLM Configuration
                            </Typography>

                            {loadingLlmStatus && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2">Checking LLM availability...</Typography>
                                    <LinearProgress />
                                </Box>
                            )}

                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Provider</InputLabel>
                                        <Select
                                            value={llmConfig.provider}
                                            onChange={(e) => {
                                                const newProvider = e.target.value as LLMProvider;
                                                const availableModels = llmStatus[newProvider]?.models;
                                                let defaultModel = '';

                                                if (newProvider === 'openai') {
                                                    defaultModel = 'gpt-3.5-turbo';
                                                } else if (newProvider === ('ollama' as LLMProvider) && availableModels && availableModels.length > 0) {
                                                    // For Ollama, models are already prefixed with 'ollama/'
                                                    defaultModel = availableModels[0] as string;
                                                }

                                                setLlmConfig(prev => ({
                                                    ...prev,
                                                    provider: newProvider,
                                                    model: defaultModel
                                                }));
                                            }}
                                            label="Provider"
                                        >
                                            <MenuItem value="openai" disabled={!llmStatus.openai?.available}>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Box
                                                        sx={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: '50%',
                                                            bgcolor: llmStatus.openai?.available ? 'success.main' : 'error.main'
                                                        }}
                                                    />
                                                    OpenAI {!llmStatus.openai?.available && '(unavailable)'}
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="ollama" disabled={!llmStatus.ollama?.available}>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Box
                                                        sx={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: '50%',
                                                            bgcolor: llmStatus.ollama?.available ? 'success.main' : 'error.main'
                                                        }}
                                                    />
                                                    Ollama {!llmStatus.ollama?.available && '(unavailable)'}
                                                </Box>
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Model</InputLabel>
                                        <Select
                                            value={llmConfig.model}
                                            onChange={(e) => setLlmConfig(prev => ({ ...prev, model: e.target.value }))}
                                            label="Model"
                                            disabled={!llmStatus[llmConfig.provider]?.available}
                                        >
                                            {getAvailableModels().map((model) => (
                                                <MenuItem key={model} value={model}>
                                                    {model}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={6}>
                                    <TextField
                                        label="Temperature"
                                        type="number"
                                        size="small"
                                        fullWidth
                                        value={llmConfig.temperature}
                                        onChange={(e) => setLlmConfig(prev => ({
                                            ...prev,
                                            temperature: Math.max(0, Math.min(2, parseFloat(e.target.value) || 0))
                                        }))}
                                        inputProps={{ min: 0, max: 2, step: 0.1 }}
                                        helperText="0.0 = deterministic, 2.0 = very creative"
                                    />
                                </Grid>

                                <Grid item xs={6}>
                                    <TextField
                                        label="Max Tokens"
                                        type="number"
                                        size="small"
                                        fullWidth
                                        value={llmConfig.maxTokens}
                                        onChange={(e) => setLlmConfig(prev => ({
                                            ...prev,
                                            maxTokens: Math.max(1, parseInt(e.target.value) || 1000)
                                        }))}
                                        inputProps={{ min: 1, max: 8000 }}
                                        helperText="Maximum response length"
                                    />
                                </Grid>
                            </Grid>

                            {/* Status indicators */}
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Provider Status:
                                </Typography>
                                {Object.entries(llmStatus).map(([provider, status]) => (
                                    <Chip
                                        key={provider}
                                        label={`${provider}: ${status.available ? 'Available' : 'Unavailable'}`}
                                        color={status.available ? 'success' : 'error'}
                                        size="small"
                                        sx={{ ml: 1, mb: 1 }}
                                    />
                                ))}
                                <Button
                                    size="small"
                                    onClick={checkLlmStatus}
                                    sx={{ ml: 1 }}
                                    disabled={loadingLlmStatus}
                                >
                                    Refresh Status
                                </Button>
                            </Box>
                        </Card>

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

                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }} color="primary">
                                🔄 BPMN Workflow Templates
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => applyTemplate('workflow_yesno')}
                                    sx={{ mb: 1 }}
                                    color="secondary"
                                >
                                    ✅ Yes/No Decision
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => applyTemplate('workflow_multichoice')}
                                    sx={{ mb: 1 }}
                                    color="secondary"
                                >
                                    🔀 Multi-Choice Router
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => applyTemplate('workflow_confidence')}
                                    sx={{ mb: 1 }}
                                    color="secondary"
                                >
                                    🎯 Confidence-Based
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => applyTemplate('workflow_priority')}
                                    sx={{ mb: 1 }}
                                    color="secondary"
                                >
                                    ⚡ Priority Router
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => applyTemplate('workflow_validation')}
                                    sx={{ mb: 1 }}
                                    color="secondary"
                                >
                                    ✔️ Data Validator
                                </Button>
                            </Box>

                            <Typography variant="caption" color="text.secondary">
                                💡 <strong>Tips:</strong> Use {'{'}{'{'} variable {'}'} {'}'} for dynamic content • Add test cases to validate your prompt • Consider edge cases in your testing • Workflow templates provide structured outputs for BPMN routing
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

                        <FormControl fullWidth margin="normal" required>
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={editingPrompt?.type || 'simple'}
                                onChange={(e) => setEditingPrompt(prev => prev ? { ...prev, type: e.target.value } : null)}
                                label="Type"
                            >
                                <MenuItem value="simple">
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Simple</Typography>
                                        <Typography variant="caption" color="text.secondary">Basic prompts for straightforward tasks</Typography>
                                    </Box>
                                </MenuItem>
                                <MenuItem value="tool-aware">
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Tool-Aware</Typography>
                                        <Typography variant="caption" color="text.secondary">Prompts that can use tools and perform validations</Typography>
                                    </Box>
                                </MenuItem>
                                <MenuItem value="workflow-aware">
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Workflow-Aware</Typography>
                                        <Typography variant="caption" color="text.secondary">Complex prompts for orchestrating workflows and routing</Typography>
                                    </Box>
                                </MenuItem>
                            </Select>
                        </FormControl>

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
