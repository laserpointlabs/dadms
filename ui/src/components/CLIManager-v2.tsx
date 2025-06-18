import {
    ExpandMore,
    PlayArrow,
    Refresh,
    Stop
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
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Switch,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { cliService } from '../services/api';
import webSocketService from '../services/websocket';

interface CommandTemplate {
    id: string;
    name: string;
    description: string;
    command: string;
    category: 'process' | 'analysis' | 'deploy' | 'docker' | 'monitor';
    parameters?: Array<{
        name: string;
        type: 'text' | 'select' | 'boolean' | 'number';
        required: boolean;
        options?: string[];
        default?: any;
        description?: string;
    }>;
}

interface CommandExecution {
    id: string;
    command: string;
    status: 'running' | 'completed' | 'failed';
    output: string[];
    startTime: Date;
    endTime?: Date;
}

const CLIManager: React.FC = () => {
    const [executions, setExecutions] = useState<CommandExecution[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [openDialog, setOpenDialog] = useState<string | null>(null);
    const [helpDialog, setHelpDialog] = useState<string | null>(null);
    const [parameterValues, setParameterValues] = useState<{ [key: string]: any }>({});
    const [commandMode, setCommandMode] = useState<'template' | 'freeform'>('template');
    const [freeformCommand, setFreeformCommand] = useState('');

    // Command templates with flexible parameter support
    const commandTemplates: CommandTemplate[] = [
        {
            id: 'dadm-help',
            name: 'DADM Help',
            description: 'Show DADM help information and available commands',
            command: 'dadm --help',
            category: 'process'
        },
        {
            id: 'analysis-list',
            name: 'List Analysis Data',
            description: 'Display recent analysis runs with key information',
            command: 'dadm analysis list',
            category: 'analysis',
            parameters: [
                {
                    name: 'limit',
                    type: 'number',
                    required: false,
                    description: 'Number of recent analyses to show (default: 10)'
                },
                {
                    name: 'thread-id',
                    type: 'text',
                    required: false,
                    description: 'Filter by specific thread ID'
                },
                {
                    name: 'session-id',
                    type: 'text',
                    required: false,
                    description: 'Filter by specific session ID'
                },
                {
                    name: 'process-id',
                    type: 'text',
                    required: false,
                    description: 'Filter by specific process instance ID'
                },
                {
                    name: 'service',
                    type: 'text',
                    required: false,
                    description: 'Filter by source service'
                },
                {
                    name: 'tags',
                    type: 'text',
                    required: false,
                    description: 'Filter by tags (space-separated)'
                },
                {
                    name: 'detailed',
                    type: 'boolean',
                    required: false,
                    description: 'Show detailed information for each analysis'
                },
                {
                    name: 'get-openai-url',
                    type: 'boolean',
                    required: false,
                    description: 'Generate OpenAI Playground URL for the process (requires --process-id)'
                },
                {
                    name: 'storage-dir',
                    type: 'text',
                    required: false,
                    description: 'Storage directory for analysis data'
                }
            ]
        },
        {
            id: 'analysis-status',
            name: 'Analysis Status',
            description: 'Show analysis system status',
            command: 'dadm analysis status',
            category: 'analysis'
        },
        {
            id: 'analysis-daemon',
            name: 'Start Analysis Daemon',
            description: 'Start analysis processing daemon',
            command: 'dadm analysis daemon',
            category: 'analysis'
        }
    ];

    // WebSocket listeners for real-time command output
    useEffect(() => {
        const handleCommandOutput = (data: any) => {
            setExecutions(prev =>
                prev.map(exec =>
                    exec.id === data.executionId
                        ? {
                            ...exec,
                            output: [...exec.output, ...data.output]
                        }
                        : exec
                )
            );
        };

        const handleCommandCompleted = (data: any) => {
            setExecutions(prev =>
                prev.map(exec =>
                    exec.id === data.executionId
                        ? {
                            ...exec,
                            status: data.success ? 'completed' : 'failed',
                            output: [...exec.output, '', `Command ${data.success ? 'completed' : 'failed'}.`],
                            endTime: new Date()
                        }
                        : exec
                )
            );
        };

        webSocketService.on('command_output', handleCommandOutput);
        webSocketService.on('command_completed', handleCommandCompleted);

        return () => {
            webSocketService.off('command_output', handleCommandOutput);
            webSocketService.off('command_completed', handleCommandCompleted);
        };
    }, []);

    const categories = ['all', 'process', 'analysis', 'deploy', 'docker', 'monitor'];

    const filteredCommands = selectedCategory === 'all'
        ? commandTemplates
        : commandTemplates.filter(cmd => cmd.category === selectedCategory);

    const handleExecuteCommand = async (template?: CommandTemplate) => {
        let command = '';

        if (commandMode === 'freeform') {
            command = freeformCommand.trim();
            if (!command) {
                alert('Please enter a command');
                return;
            }
        } else if (template) {
            // Build command with parameters for template mode
            command = template.command;
            const params = template.parameters || [];

            // Build arguments array
            const args: string[] = [];

            params.forEach(param => {
                const value = parameterValues[param.name];
                if (value !== undefined && value !== '') {
                    if (param.type === 'boolean' && value) {
                        args.push(`--${param.name}`);
                    } else if (param.type !== 'boolean') {
                        if (param.name === 'tags' && typeof value === 'string') {
                            // Handle space-separated tags
                            args.push(`--${param.name}`);
                            args.push(...value.split(' ').filter(tag => tag.trim()));
                        } else {
                            args.push(`--${param.name}`);
                            args.push(value.toString());
                        }
                    }
                }
            });

            // Combine base command with arguments
            if (args.length > 0) {
                command = `${command} ${args.join(' ')}`;
            }
        } else {
            return;
        }

        // Clean up extra spaces
        command = command.replace(/\s+/g, ' ').trim();

        const execution: CommandExecution = {
            id: Date.now().toString(),
            command,
            status: 'running',
            output: [`Starting command: ${command}`, ''],
            startTime: new Date()
        };

        setExecutions(prev => [execution, ...prev]);
        setOpenDialog(null);
        setParameterValues({});
        setFreeformCommand('');

        try {
            // Parse the command to extract the base command and arguments
            const commandParts = command.trim().split(/\s+/);
            const baseCommand = commandParts[0];
            const args = commandParts.slice(1);

            console.log('Executing command:', baseCommand, 'with args:', args);

            // Execute via REST API for reliable command execution
            const response = await cliService.executeCommand(baseCommand, args);

            console.log('API response:', response);

            // Update execution with API response
            setExecutions(prev =>
                prev.map(exec =>
                    exec.id === execution.id
                        ? {
                            ...exec,
                            status: response.data.success ? 'completed' : 'failed',
                            output: [
                                ...exec.output,
                                '=== Command Output ===',
                                ...(Array.isArray(response.data.output)
                                    ? response.data.output
                                    : [response.data.output || 'Command completed successfully']
                                ),
                                ...(response.data.stderr && response.data.stderr.length > 0
                                    ? ['', '=== Error Output ===', ...response.data.stderr]
                                    : []
                                ),
                                '',
                                `Exit code: ${response.data.exitCode || 0}`,
                                `Execution time: ${response.data.executionTime || 'N/A'}ms`
                            ],
                            endTime: new Date()
                        }
                        : exec
                )
            );

        } catch (error: any) {
            console.error('Command execution failed:', error);

            setExecutions(prev =>
                prev.map(exec =>
                    exec.id === execution.id
                        ? {
                            ...exec,
                            status: 'failed',
                            output: [
                                ...exec.output,
                                '=== Command Failed ===',
                                `Error: ${error.response?.data?.message || error.message || 'Unknown error occurred'}`,
                                ...(error.response?.data?.stderr
                                    ? ['', 'stderr:', ...error.response.data.stderr]
                                    : []
                                ),
                                '',
                                `Exit code: ${error.response?.data?.exitCode || 1}`
                            ],
                            endTime: new Date()
                        }
                        : exec
                )
            );
        }
    };

    const openCommandDialog = (templateId: string) => {
        setOpenDialog(templateId);
        setParameterValues({});
    };

    const handleParameterChange = (paramName: string, value: any) => {
        setParameterValues(prev => ({
            ...prev,
            [paramName]: value
        }));
    };

    const stopExecution = (executionId: string) => {
        setExecutions(prev =>
            prev.map(exec =>
                exec.id === executionId && exec.status === 'running'
                    ? { ...exec, status: 'failed', output: [...exec.output, 'Execution stopped by user'], endTime: new Date() }
                    : exec
            )
        );
    };

    const renderParameterInput = (param: any) => {
        switch (param.type) {
            case 'boolean':
                return (
                    <FormControlLabel
                        control={
                            <Switch
                                checked={parameterValues[param.name] || false}
                                onChange={(e) => handleParameterChange(param.name, e.target.checked)}
                            />
                        }
                        label={param.description || param.name}
                    />
                );
            case 'select':
                return (
                    <FormControl fullWidth>
                        <InputLabel>{param.name}</InputLabel>
                        <Select
                            value={parameterValues[param.name] || ''}
                            label={param.name}
                            onChange={(e) => handleParameterChange(param.name, e.target.value)}
                        >
                            {param.options?.map((option: string) => (
                                <MenuItem key={option} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                );
            default:
                return (
                    <TextField
                        fullWidth
                        label={param.name}
                        type={param.type === 'number' ? 'number' : 'text'}
                        value={parameterValues[param.name] || ''}
                        onChange={(e) => handleParameterChange(param.name, e.target.value)}
                        helperText={param.description}
                        placeholder={param.default ? `Default: ${param.default}` : ''}
                    />
                );
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    CLI Command Manager
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                        label={webSocketService.getConnectionStatus().connected ? 'Real-time Connected' : 'API Mode'}
                        color={webSocketService.getConnectionStatus().connected ? 'success' : 'warning'}
                        variant="outlined"
                        size="small"
                    />

                    <Tooltip title="Refresh commands">
                        <IconButton onClick={() => window.location.reload()}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Command Mode Toggle */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h6">Command Mode:</Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={commandMode === 'freeform'}
                            onChange={(e) => setCommandMode(e.target.checked ? 'freeform' : 'template')}
                        />
                    }
                    label={commandMode === 'freeform' ? 'Free-form Command' : 'Template Mode'}
                />
            </Box>

            {/* Freeform Command Input */}
            {commandMode === 'freeform' && (
                <Box sx={{ mb: 3 }}>
                    <TextField
                        fullWidth
                        label="Enter DADM Command"
                        placeholder="e.g., dadm analysis list --limit 5 --detailed"
                        value={freeformCommand}
                        onChange={(e) => setFreeformCommand(e.target.value)}
                        variant="outlined"
                        multiline
                        rows={2}
                        helperText="Enter any DADM command with its arguments. Examples: 'dadm --help', 'dadm analysis list --limit 10 --thread-id abc123'"
                    />
                    <Box sx={{ mt: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<PlayArrow />}
                            onClick={() => handleExecuteCommand()}
                            disabled={!freeformCommand.trim()}
                        >
                            Execute Command
                        </Button>
                    </Box>
                </Box>
            )}

            {/* Template Mode */}
            {commandMode === 'template' && (
                <>
                    {/* Category Filter */}
                    <Box sx={{ mb: 3 }}>
                        <FormControl sx={{ minWidth: 200 }}>
                            <InputLabel>Category</InputLabel>
                            <Select
                                value={selectedCategory}
                                label="Category"
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                {categories.map(cat => (
                                    <MenuItem key={cat} value={cat}>
                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Command Templates Grid */}
                    <Grid container spacing={3}>
                        <Grid item xs={12} lg={6}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Available Commands
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {filteredCommands.map(template => (
                                        <Card key={template.id} variant="outlined">
                                            <CardContent>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                    <Typography variant="h6" component="h3">
                                                        {template.name}
                                                    </Typography>
                                                    <Chip
                                                        label={template.category}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </Box>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    {template.description}
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 2, bgcolor: 'background.default', p: 1, borderRadius: 1 }}>
                                                    {template.command}
                                                </Typography>
                                            </CardContent>
                                            <CardActions>
                                                <Button
                                                    size="small"
                                                    startIcon={<PlayArrow />}
                                                    onClick={() => template.parameters && template.parameters.length > 0 ? openCommandDialog(template.id) : handleExecuteCommand(template)}
                                                    variant="contained"
                                                >
                                                    {template.parameters && template.parameters.length > 0 ? 'Configure & Execute' : 'Execute'}
                                                </Button>
                                            </CardActions>
                                        </Card>
                                    ))}
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </>
            )}

            {/* Command History */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                Command History
                            </Typography>
                            <Button
                                size="small"
                                onClick={() => setExecutions([])}
                                disabled={executions.length === 0}
                            >
                                Clear History
                            </Button>
                        </Box>

                        {executions.length === 0 ? (
                            <Alert severity="info">
                                No commands executed yet. Use the command forms above to execute DADM commands.
                            </Alert>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {executions.map(execution => (
                                    <Accordion key={execution.id}>
                                        <AccordionSummary expandIcon={<ExpandMore />}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                                <Chip
                                                    label={execution.status}
                                                    color={
                                                        execution.status === 'completed' ? 'success' :
                                                            execution.status === 'failed' ? 'error' : 'warning'
                                                    }
                                                    size="small"
                                                />
                                                <Typography sx={{ fontFamily: 'monospace', flexGrow: 1 }}>
                                                    {execution.command}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {execution.startTime.toLocaleTimeString()}
                                                </Typography>
                                                {execution.status === 'running' && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            stopExecution(execution.id);
                                                        }}
                                                    >
                                                        <Stop />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <Box
                                                sx={{
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.875rem',
                                                    bgcolor: 'background.default',
                                                    p: 2,
                                                    borderRadius: 1,
                                                    maxHeight: 400,
                                                    overflow: 'auto',
                                                    whiteSpace: 'pre-line'
                                                }}
                                            >
                                                {execution.output.join('\n')}
                                            </Box>
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Parameter Configuration Dialog */}
            <Dialog
                open={!!openDialog}
                onClose={() => setOpenDialog(null)}
                maxWidth="md"
                fullWidth
            >
                {(() => {
                    const template = commandTemplates.find(t => t.id === openDialog);
                    if (!template) return null;

                    return (
                        <>
                            <DialogTitle>
                                Configure: {template.name}
                            </DialogTitle>
                            <DialogContent>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    {template.description}
                                </Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 3, bgcolor: 'background.default', p: 1, borderRadius: 1 }}>
                                    {template.command}
                                </Typography>

                                <Grid container spacing={2}>
                                    {template.parameters?.map(param => (
                                        <Grid item xs={12} sm={6} key={param.name}>
                                            {renderParameterInput(param)}
                                        </Grid>
                                    ))}
                                </Grid>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setOpenDialog(null)}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<PlayArrow />}
                                    onClick={() => handleExecuteCommand(template)}
                                >
                                    Execute Command
                                </Button>
                            </DialogActions>
                        </>
                    );
                })()}
            </Dialog>
        </Box>
    );
};

export default CLIManager;
