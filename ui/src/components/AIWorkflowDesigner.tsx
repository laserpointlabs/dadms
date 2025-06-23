import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';

interface WorkflowData {
    name: string;
    bpmn_xml: string;
    description: string;
}

interface AIWorkflowDesignerProps {
    onWorkflowGenerated?: (workflow: WorkflowData) => void;
    onWorkflowSaved?: (workflow: WorkflowData) => void;
    initialWorkflow?: WorkflowData;
}

interface BPMNGenerationResponse {
    success: boolean;
    bpmn_xml: string;
    explanation: string;
    elements_created: string[];
    suggestions: string[];
    confidence_score: number;
    validation_errors: string[];
    examples_used: string[];
    complexity_level: string;
    generation_time: number;
    error?: string;
}

const AIWorkflowDesigner: React.FC<AIWorkflowDesignerProps> = ({
    onWorkflowGenerated,
    onWorkflowSaved,
    initialWorkflow
}) => {
    const [workflowName, setWorkflowName] = useState(initialWorkflow?.name || '');
    const [workflowDescription, setWorkflowDescription] = useState(initialWorkflow?.description || '');
    const [userInput, setUserInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [generatedWorkflow, setGeneratedWorkflow] = useState<BPMNGenerationResponse | null>(null);
    const [selectedSuggestion, setSelectedSuggestion] = useState<BPMNGenerationResponse | null>(null);
    const [templateName, setTemplateName] = useState('advanced_generation');
    const [complexityLevel, setComplexityLevel] = useState('moderate');
    const [includeExamples, setIncludeExamples] = useState(true);

    // Load BPMN XML from sessionStorage on mount
    useEffect(() => {
        const saved = sessionStorage.getItem('currentBpmnModel');
        if (saved) {
            // If you have a function to load into the canvas, call it here
            // For now, set as generatedWorkflow for display
            setGeneratedWorkflow((prev) => prev ? { ...prev, bpmn_xml: saved } : {
                success: true,
                bpmn_xml: saved,
                explanation: '',
                elements_created: [],
                suggestions: [],
                confidence_score: 1,
                validation_errors: [],
                examples_used: [],
                complexity_level: 'moderate',
                generation_time: 0
            });
        }
    }, []);

    const generateWorkflow = useCallback(async () => {
        if (!userInput.trim()) {
            setError('Please enter a description of the workflow you want to create.');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('/api/enhanced-bpmn-ai/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_input: userInput,
                    context: {
                        workflow_name: workflowName,
                        workflow_description: workflowDescription
                    },
                    template_name: templateName,
                    complexity_preference: complexityLevel,
                    include_examples: includeExamples,
                    max_examples: 3
                }),
            });

            if (!response.ok) {
                const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                console.error(errorMessage);
                throw new window.Error(errorMessage);
            }

            const result: BPMNGenerationResponse = await response.json();

            if (result.success) {
                setGeneratedWorkflow(result);
                setSelectedSuggestion(result);
                setSuccess('Workflow generated successfully!');

                // Persist BPMN XML to sessionStorage
                sessionStorage.setItem('currentBpmnModel', result.bpmn_xml);

                // Call the callback with generated workflow
                if (onWorkflowGenerated) {
                    onWorkflowGenerated({
                        name: workflowName || 'Generated Workflow',
                        bpmn_xml: result.bpmn_xml,
                        description: workflowDescription || result.explanation
                    });
                }
            } else {
                throw result.error || 'Failed to generate workflow';
            }
        } catch (err: unknown) {
            console.error('Error generating workflow:', err);
            setError(err instanceof window.Error ? err.message : 'Failed to generate workflow');
        } finally {
            setIsGenerating(false);
        }
    }, [userInput, workflowName, workflowDescription, templateName, complexityLevel, includeExamples, onWorkflowGenerated]);

    const saveWorkflow = useCallback(async () => {
        if (!selectedSuggestion) {
            setError('No workflow to save. Please generate a workflow first.');
            return;
        }

        try {
            const response = await fetch('/api/enhanced-bpmn-ai/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: workflowName,
                    bpmn_xml: selectedSuggestion.bpmn_xml,
                    description: workflowDescription
                }),
            });

            if (!response.ok) {
                const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                console.error(errorMessage);
                throw new window.Error(errorMessage);
            }

            const result = await response.json();

            if (result.success) {
                setSuccess('Workflow saved successfully!');
                if (onWorkflowSaved) {
                    onWorkflowSaved({
                        name: workflowName,
                        bpmn_xml: selectedSuggestion.bpmn_xml,
                        description: workflowDescription
                    });
                }
            } else {
                throw result.error || 'Failed to save workflow';
            }
        } catch (err: unknown) {
            console.error('Error saving workflow:', err);
            setError(err instanceof window.Error ? err.message : 'Failed to save workflow');
        }
    }, [selectedSuggestion, workflowName, workflowDescription, onWorkflowSaved]);

    const parseBPMNToComponents = useCallback((bpmnXml: string) => {
        // This function would parse the BPMN XML and extract components
        // For now, we'll just set the generated workflow
        console.log('Parsing BPMN XML:', bpmnXml.substring(0, 200) + '...');
    }, []);

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
            <Typography variant="h4" gutterBottom>
                AI Workflow Designer
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Workflow Configuration
                </Typography>

                <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
                    <TextField
                        label="Workflow Name"
                        value={workflowName}
                        onChange={(e) => setWorkflowName(e.target.value)}
                        fullWidth
                        placeholder="Enter workflow name"
                    />

                    <TextField
                        label="Workflow Description"
                        value={workflowDescription}
                        onChange={(e) => setWorkflowDescription(e.target.value)}
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Describe the workflow purpose"
                    />
                </Box>

                <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
                    <FormControl fullWidth>
                        <InputLabel>Template</InputLabel>
                        <Select
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            label="Template"
                        >
                            <MenuItem value="basic_generation">Basic Generation</MenuItem>
                            <MenuItem value="advanced_generation">Advanced Generation</MenuItem>
                            <MenuItem value="decision_process">Decision Process</MenuItem>
                            <MenuItem value="approval_workflow">Approval Workflow</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>Complexity Level</InputLabel>
                        <Select
                            value={complexityLevel}
                            onChange={(e) => setComplexityLevel(e.target.value)}
                            label="Complexity Level"
                        >
                            <MenuItem value="simple">Simple</MenuItem>
                            <MenuItem value="moderate">Moderate</MenuItem>
                            <MenuItem value="complex">Complex</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Generate Workflow
                </Typography>

                <TextField
                    label="Describe your workflow"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Describe the business process you want to model (e.g., 'Create an approval workflow for expense reports')"
                    sx={{ mb: 2 }}
                />

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                    <Button
                        variant="contained"
                        onClick={generateWorkflow}
                        disabled={isGenerating || !userInput.trim()}
                        startIcon={isGenerating ? <CircularProgress size={20} /> : null}
                    >
                        {isGenerating ? 'Generating...' : 'Generate Workflow'}
                    </Button>

                    {selectedSuggestion && (
                        <Button
                            variant="outlined"
                            onClick={saveWorkflow}
                            disabled={!workflowName.trim()}
                        >
                            Save Workflow
                        </Button>
                    )}
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}
            </Paper>

            {generatedWorkflow && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Generated Workflow
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Generation Details
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                            <Chip label={`Complexity: ${generatedWorkflow.complexity_level}`} size="small" />
                            <Chip label={`Confidence: ${(generatedWorkflow.confidence_score * 100).toFixed(1)}%`} size="small" />
                            <Chip label={`Time: ${generatedWorkflow.generation_time.toFixed(2)}s`} size="small" />
                            <Chip label={`Elements: ${generatedWorkflow.elements_created.length}`} size="small" />
                        </Box>
                    </Box>

                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>Workflow Explanation</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                {generatedWorkflow.explanation}
                            </Typography>
                        </AccordionDetails>
                    </Accordion>

                    {generatedWorkflow.suggestions.length > 0 && (
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography>Suggestions</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box component="ul" sx={{ pl: 2 }}>
                                    {generatedWorkflow.suggestions.map((suggestion, index) => (
                                        <Typography component="li" key={index} variant="body2">
                                            {suggestion}
                                        </Typography>
                                    ))}
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    )}

                    {generatedWorkflow.examples_used.length > 0 && (
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography>Examples Used</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {generatedWorkflow.examples_used.map((example, index) => (
                                        <Chip key={index} label={example} size="small" variant="outlined" />
                                    ))}
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    )}

                    {generatedWorkflow.validation_errors.length > 0 && (
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography color="warning.main">Validation Issues ({generatedWorkflow.validation_errors.length})</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box component="ul" sx={{ pl: 2 }}>
                                    {generatedWorkflow.validation_errors.map((error, index) => (
                                        <Typography component="li" key={index} variant="body2" color="warning.main">
                                            {error}
                                        </Typography>
                                    ))}
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    )}

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" gutterBottom>
                        Generated BPMN XML
                    </Typography>
                    <TextField
                        value={generatedWorkflow.bpmn_xml}
                        multiline
                        rows={8}
                        fullWidth
                        variant="outlined"
                        InputProps={{
                            readOnly: true,
                        }}
                        sx={{
                            '& .MuiInputBase-input': {
                                fontFamily: 'monospace',
                                fontSize: '0.875rem',
                            },
                        }}
                    />
                </Paper>
            )}
        </Box>
    );
};

export default AIWorkflowDesigner; 