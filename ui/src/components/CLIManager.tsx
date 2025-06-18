import {
    ExpandMore,
    Info,
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
        description: string;
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

const commandTemplates: CommandTemplate[] = [
    {
        id: 'start-process',
        name: 'Start BPMN Process',
        description: 'Start a specific BPMN process with optional variables',
        command: 'dadm --start-process "{processName}" {variables}',
        category: 'process',
        parameters: [
            {
                name: 'processName',
                type: 'select',
                required: true,
                options: ['OpenAI Decision Tester', 'Advanced Decision Process', 'Echo Test Process'],
                description: 'Name of the BPMN process to start'
            },
            {
                name: 'variables',
                type: 'text',
                required: false,
                description: 'JSON variables to pass to the process (e.g., {"key": "value"})'
            },
            {
                name: 'timeout',
                type: 'number',
                required: false,
                default: 600,
                description: 'Timeout in seconds'
            }
        ]
    },
    {
        id: 'analysis-daemon-start',
        name: 'Start Analysis Daemon',
        description: 'Start the background analysis processing daemon',
        command: 'dadm analysis daemon --detach {options}',
        category: 'analysis',
        parameters: [
            {
                name: 'interval',
                type: 'number',
                required: false,
                default: 30,
                description: 'Processing interval in seconds'
            },
            {
                name: 'batchSize',
                type: 'number',
                required: false,
                default: 10,
                description: 'Number of tasks to process per batch'
            },
            {
                name: 'noVectorStore',
                type: 'boolean',
                required: false,
                description: 'Disable vector store processing'
            },
            {
                name: 'noGraphDb',
                type: 'boolean',
                required: false,
                description: 'Disable graph database processing'
            }
        ]
    },
    {
        id: 'analysis-list',
        name: 'List Analysis Data',
        description: 'List recent analysis runs with filtering options',
        command: 'dadm analysis list {filters}',
        category: 'analysis',
        parameters: [
            {
                name: 'limit',
                type: 'number',
                required: false,
                default: 10,
                description: 'Maximum number of results'
            },
            {
                name: 'threadId',
                type: 'text',
                required: false,
                description: 'Filter by thread ID'
            },
            {
                name: 'processId',
                type: 'text',
                required: false,
                description: 'Filter by process instance ID'
            },
            {
                name: 'detailed',
                type: 'boolean',
                required: false,
                description: 'Show detailed information'
            }
        ]
    },
    {
        id: 'deploy-bpmn',
        name: 'Deploy BPMN Models',
        description: 'Deploy BPMN models to Camunda server',
        command: 'dadm deploy {target}',
        category: 'deploy',
        parameters: [
            {
                name: 'target',
                type: 'select',
                required: true,
                options: ['all', 'specific'],
                description: 'Deploy all models or specify a model'
            },
            {
                name: 'modelName',
                type: 'text',
                required: false,
                description: 'Specific model name (if target is "specific")'
            }
        ]
    },
    {
        id: 'docker-up',
        name: 'Start Docker Services',
        description: 'Start DADM Docker services',
        command: 'dadm docker up {options}',
        category: 'docker',
        parameters: [
            {
                name: 'detached',
                type: 'boolean',
                required: false,
                default: true,
                description: 'Run in detached mode (-d)'
            },
            {
                name: 'build',
                type: 'boolean',
                required: false,
                description: 'Rebuild images before starting (--build)'
            }
        ]
    },
    {
        id: 'docker-down',
        name: 'Stop Docker Services',
        description: 'Stop DADM Docker services',
        command: 'dadm docker down',
        category: 'docker'
    },
    {
        id: 'monitor-process',
        name: 'Monitor Process Execution',
        description: 'Monitor a specific process instance',
        command: 'python scripts/monitor_process_execution.py {options}',
        category: 'monitor',
        parameters: [
            {
                name: 'processInstanceId',
                type: 'text',
                required: true,
                description: 'Process instance ID to monitor'
            },
            {
                name: 'interval',
                type: 'number',
                required: false,
                default: 5,
                description: 'Monitoring interval in seconds'
            },
            {
                name: 'verbose',
                type: 'boolean',
                required: false,
                description: 'Enable verbose output'
            }
        ]
    }
];

const CLIManager: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [executions, setExecutions] = useState<CommandExecution[]>([]);
    const [openDialog, setOpenDialog] = useState<string | null>(null);
    const [helpDialog, setHelpDialog] = useState<string | null>(null);
    const [parameterValues, setParameterValues] = useState<{ [key: string]: any }>({});

    // WebSocket listeners for real-time command output
    useEffect(() => {
        // Listen for command output updates
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

        // Listen for command completion
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

        // Subscribe to WebSocket events
        webSocketService.on('command_output', handleCommandOutput);
        webSocketService.on('command_completed', handleCommandCompleted);

        // Cleanup on unmount
        return () => {
            webSocketService.off('command_output', handleCommandOutput);
            webSocketService.off('command_completed', handleCommandCompleted);
        };
    }, []);

    const categories = ['all', 'process', 'analysis', 'deploy', 'docker', 'monitor'];

    const filteredCommands = selectedCategory === 'all'
        ? commandTemplates
        : commandTemplates.filter(cmd => cmd.category === selectedCategory);

    const handleExecuteCommand = async (template: CommandTemplate) => {
        // Build command with parameters
        let command = template.command;
        const params = template.parameters || [];

        // Replace placeholders with actual values
        params.forEach(param => {
            const value = parameterValues[param.name];
            if (value !== undefined && value !== '') {
                let replacement = '';
                switch (param.name) {
                    case 'variables':
                        replacement = value ? `--variables '${value}'` : '';
                        break;
                    case 'timeout':
                        replacement = value ? `--timeout ${value}` : '';
                        break;
                    case 'interval':
                        replacement = value ? `--interval ${value}` : '';
                        break;
                    case 'batchSize':
                        replacement = value ? `--batch-size ${value}` : '';
                        break;
                    case 'noVectorStore':
                        replacement = value ? '--no-vector-store' : '';
                        break;
                    case 'noGraphDb':
                        replacement = value ? '--no-graph-db' : '';
                        break;
                    case 'limit':
                        replacement = value ? `--limit ${value}` : '';
                        break;
                    case 'threadId':
                        replacement = value ? `--thread-id ${value}` : '';
                        break;
                    case 'processId':
                        replacement = value ? `--process-id ${value}` : '';
                        break;
                    case 'detailed':
                        replacement = value ? '--detailed' : '';
                        break;
                    case 'detached':
                        replacement = value ? '-d' : '';
                        break;
                    case 'build':
                        replacement = value ? '--build' : '';
                        break;
                    case 'processInstanceId':
                        replacement = value ? `--process-instance ${value}` : '';
                        break;
                    case 'verbose':
                        replacement = value ? '--verbose' : '';
                        break;
                    default:
                        replacement = value;
                }
                command = command.replace(`{${param.name}}`, replacement);
            } else {
                command = command.replace(`{${param.name}}`, '');
            }
        });

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

        try {
            // Parse the command to extract the base command and arguments
            const commandParts = command.trim().split(/\s+/);
            const baseCommand = commandParts[0]; // e.g., 'dadm'
            const args = commandParts.slice(1); // e.g., ['analysis', 'run', '--config', 'file.yaml']

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
            // Handle command execution errors
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
        // Reset parameter values
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
                    ? { ...exec, status: 'failed', output: [...exec.output, 'Command terminated by user.'], endTime: new Date() }
                    : exec
            )
        );
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    CLI Command Manager
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Connection Status */}
                    <Chip
                        label={webSocketService.getConnectionStatus().connected ? 'Real-time Connected' : 'API Mode'}
                        color={webSocketService.getConnectionStatus().connected ? 'success' : 'warning'}
                        variant="outlined"
                        size="small"
                    />

                    {/* Refresh Button */}
                    <Tooltip title="Refresh commands">
                        <IconButton onClick={() => window.location.reload()}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

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

            <Grid container spacing={3}>
                {/* Command Templates */}
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
                                            <Typography variant="h6">
                                                {template.name}
                                            </Typography>
                                            <Chip
                                                label={template.category}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {template.description}
                                        </Typography>
                                        <Typography variant="body2" fontFamily="monospace" sx={{ bgcolor: 'background.default', p: 1, borderRadius: 1 }}>
                                            {template.command}
                                        </Typography>
                                    </CardContent>
                                    <CardActions>
                                        <Button
                                            variant="contained"
                                            startIcon={<PlayArrow />}
                                            onClick={() => openCommandDialog(template.id)}
                                            size="small"
                                        >
                                            Execute
                                        </Button>
                                        <Tooltip title="View command details">
                                            <IconButton
                                                size="small"
                                                onClick={() => setHelpDialog(template.id)}
                                            >
                                                <Info />
                                            </IconButton>
                                        </Tooltip>
                                    </CardActions>
                                </Card>
                            ))}
                        </Box>
                    </Paper>
                </Grid>

                {/* Command Executions */}
                <Grid item xs={12} lg={6}>
                    <Paper sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                Command History
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<Refresh />}
                                size="small"
                                onClick={() => setExecutions([])}
                            >
                                Clear History
                            </Button>
                        </Box>

                        <Box sx={{ maxHeight: '70vh', overflow: 'auto' }}>
                            {executions.length === 0 ? (
                                <Alert severity="info">No commands executed yet</Alert>
                            ) : (
                                executions.map(execution => (
                                    <Accordion key={execution.id} sx={{ mb: 1 }}>
                                        <AccordionSummary expandIcon={<ExpandMore />}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                <Chip
                                                    label={execution.status}
                                                    color={
                                                        execution.status === 'completed' ? 'success' :
                                                            execution.status === 'failed' ? 'error' : 'warning'
                                                    }
                                                    size="small"
                                                    sx={{ mr: 2 }}
                                                />
                                                <Typography variant="body2" fontFamily="monospace" sx={{ flexGrow: 1 }}>
                                                    {execution.command.length > 50
                                                        ? execution.command.substring(0, 50) + '...'
                                                        : execution.command}
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
                                            <Box>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                    Started: {execution.startTime.toLocaleTimeString()}
                                                    {execution.endTime && ` | Ended: ${execution.endTime.toLocaleTimeString()}`}
                                                </Typography>
                                                <Box
                                                    sx={{
                                                        bgcolor: 'background.default',
                                                        p: 2,
                                                        borderRadius: 1,
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.875rem',
                                                        maxHeight: '300px',
                                                        overflow: 'auto',
                                                        whiteSpace: 'pre-wrap'
                                                    }}
                                                >
                                                    {execution.output.join('\n')}
                                                </Box>
                                            </Box>
                                        </AccordionDetails>
                                    </Accordion>
                                ))
                            )}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Command Parameter Dialog */}
            {openDialog && (
                <Dialog open={true} onClose={() => setOpenDialog(null)} maxWidth="md" fullWidth>
                    {(() => {
                        const template = commandTemplates.find(t => t.id === openDialog);
                        if (!template) return null;

                        return (
                            <>
                                <DialogTitle>
                                    Execute: {template.name}
                                </DialogTitle>
                                <DialogContent>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {template.description}
                                    </Typography>

                                    {template.parameters && template.parameters.length > 0 && (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                                            {template.parameters.map(param => (
                                                <Box key={param.name}>
                                                    {param.type === 'text' && (
                                                        <TextField
                                                            fullWidth
                                                            label={param.name}
                                                            helperText={param.description}
                                                            required={param.required}
                                                            value={parameterValues[param.name] || ''}
                                                            onChange={(e) => handleParameterChange(param.name, e.target.value)}
                                                        />
                                                    )}
                                                    {param.type === 'number' && (
                                                        <TextField
                                                            fullWidth
                                                            type="number"
                                                            label={param.name}
                                                            helperText={param.description}
                                                            required={param.required}
                                                            value={parameterValues[param.name] || param.default || ''}
                                                            onChange={(e) => handleParameterChange(param.name, parseInt(e.target.value) || param.default)}
                                                        />
                                                    )}
                                                    {param.type === 'select' && (
                                                        <FormControl fullWidth required={param.required}>
                                                            <InputLabel>{param.name}</InputLabel>
                                                            <Select
                                                                value={parameterValues[param.name] || ''}
                                                                label={param.name}
                                                                onChange={(e) => handleParameterChange(param.name, e.target.value)}
                                                            >
                                                                {param.options?.map(option => (
                                                                    <MenuItem key={option} value={option}>{option}</MenuItem>
                                                                ))}
                                                            </Select>
                                                            {param.description && (
                                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                                                    {param.description}
                                                                </Typography>
                                                            )}
                                                        </FormControl>
                                                    )}
                                                    {param.type === 'boolean' && (
                                                        <FormControlLabel
                                                            control={
                                                                <Switch
                                                                    checked={parameterValues[param.name] || false}
                                                                    onChange={(e) => handleParameterChange(param.name, e.target.checked)}
                                                                />
                                                            }
                                                            label={
                                                                <Box>
                                                                    <Typography variant="body1">{param.name}</Typography>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {param.description}
                                                                    </Typography>
                                                                </Box>
                                                            }
                                                        />
                                                    )}
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={() => setOpenDialog(null)}>Cancel</Button>
                                    <Button
                                        variant="contained"
                                        onClick={() => handleExecuteCommand(template)}
                                        startIcon={<PlayArrow />}
                                    >
                                        Execute Command
                                    </Button>
                                </DialogActions>
                            </>
                        );
                    })()}
                </Dialog>
            )}

            {/* Help Dialog */}
            {helpDialog && (
                <Dialog
                    open={!!helpDialog}
                    onClose={() => setHelpDialog(null)}
                    maxWidth="md"
                    fullWidth
                >
                    {(() => {
                        const template = commandTemplates.find(t => t.id === helpDialog);
                        if (!template) return null;

                        return (
                            <>
                                <DialogTitle>
                                    Command Help: {template.name}
                                </DialogTitle>
                                <DialogContent>
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 600 }}>
                                            Description
                                        </Typography>
                                        <Typography variant="body1" paragraph sx={{ color: 'text.primary', lineHeight: 1.6 }}>
                                            {template.description}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 600 }}>
                                            Command Template
                                        </Typography>
                                        <Paper sx={{
                                            p: 2,
                                            bgcolor: 'background.paper',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            boxShadow: 1
                                        }}>
                                            <Typography
                                                variant="body2"
                                                component="code"
                                                sx={{
                                                    fontFamily: 'monospace',
                                                    color: 'text.primary',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500
                                                }}
                                            >
                                                {template.command}
                                            </Typography>
                                        </Paper>
                                    </Box>

                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 600 }}>
                                            Category
                                        </Typography>
                                        <Chip
                                            label={template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                                            color="primary"
                                            variant="outlined"
                                        />
                                    </Box>

                                    {template.parameters && template.parameters.length > 0 && (
                                        <Box sx={{ mb: 3 }}>
                                            <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 600 }}>
                                                Parameters
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                {template.parameters.map((param) => (
                                                    <Paper
                                                        key={param.name}
                                                        sx={{
                                                            p: 2,
                                                            bgcolor: 'background.paper',
                                                            border: '1px solid',
                                                            borderColor: 'divider',
                                                            boxShadow: 1
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                            <Typography
                                                                variant="subtitle2"
                                                                sx={{
                                                                    fontWeight: 'bold',
                                                                    color: 'text.primary'
                                                                }}
                                                            >
                                                                {param.name}
                                                            </Typography>
                                                            <Chip
                                                                label={param.type}
                                                                size="small"
                                                                color="secondary"
                                                            />
                                                            {param.required && (
                                                                <Chip
                                                                    label="Required"
                                                                    size="small"
                                                                    color="error"
                                                                />
                                                            )}
                                                            {param.default !== undefined && (
                                                                <Chip
                                                                    label={`Default: ${param.default}`}
                                                                    size="small"
                                                                    color="info"
                                                                />
                                                            )}
                                                        </Box>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: 'text.primary',
                                                                lineHeight: 1.5
                                                            }}
                                                        >
                                                            {param.description}
                                                        </Typography>
                                                        {param.options && (
                                                            <Box sx={{ mt: 1 }}>
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{
                                                                        color: 'text.primary',
                                                                        fontWeight: 500
                                                                    }}
                                                                >
                                                                    Options: {param.options.join(', ')}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Paper>
                                                ))}
                                            </Box>
                                        </Box>
                                    )}

                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 600 }}>
                                            Usage Examples
                                        </Typography>
                                        <Paper sx={{
                                            p: 2,
                                            bgcolor: 'background.paper',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            boxShadow: 1
                                        }}>
                                            <Typography variant="body2" component="div" sx={{ color: 'text.primary' }}>
                                                <Typography component="strong" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                                                    Basic usage:
                                                </Typography>
                                                <br />
                                                <Box
                                                    component="code"
                                                    sx={{
                                                        fontFamily: 'monospace',
                                                        backgroundColor: 'rgba(0,0,0,0.1)',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        color: 'text.primary',
                                                        fontSize: '0.875rem',
                                                        display: 'inline-block',
                                                        mt: 0.5
                                                    }}
                                                >
                                                    {template.command.replace(/\{[^}]+\}/g, '')}
                                                </Box>
                                                <br /><br />
                                                <Typography component="strong" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                                                    With parameters:
                                                </Typography>
                                                <br />
                                                <Box
                                                    component="code"
                                                    sx={{
                                                        fontFamily: 'monospace',
                                                        backgroundColor: 'rgba(0,0,0,0.1)',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        color: 'text.primary',
                                                        fontSize: '0.875rem',
                                                        display: 'inline-block',
                                                        mt: 0.5
                                                    }}
                                                >
                                                    {template.command.replace(/\{([^}]+)\}/g, (match, param) => {
                                                        if (param === 'options') return '--option value';
                                                        return `--${param.replace(/[{}]/g, '')} value`;
                                                    })}
                                                </Box>
                                            </Typography>
                                        </Paper>
                                    </Box>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={() => setHelpDialog(null)}>
                                        Close
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={() => {
                                            setHelpDialog(null);
                                            openCommandDialog(template.id);
                                        }}
                                        startIcon={<PlayArrow />}
                                    >
                                        Execute Command
                                    </Button>
                                </DialogActions>
                            </>
                        );
                    })()}
                </Dialog>
            )}
        </Box>
    );
};

export default CLIManager;
