"use client";
import { Delete, Info, PlayArrow, Refresh, Schema, Settings, Visibility, Warning } from '@mui/icons-material';
import {
    Alert,
    Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, FormControlLabel, IconButton, InputLabel, MenuItem, Paper, Select, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography
} from '@mui/material';
import Grid from '@mui/material/Grid';
import React, { useCallback, useEffect, useState } from 'react';

// Mock types
interface ProcessInstance {
    id: string;
    processDefinitionKey: string;
    processDefinitionName?: string;
    processDefinitionVersion?: number;
    startTime: string;
    endTime?: string;
    state?: string;
    status: string;
    isActive: boolean;
    businessKey?: string;
}

interface ProcessDefinition {
    id: string;
    key: string;
    name: string;
    version: number;
    resource: string;
    deploymentId: string;
}

interface GroupedProcessDefinitions {
    [key: string]: ProcessDefinition[];
}

interface ProcessCounts {
    active: number;
    total: number;
    completed: number;
}

const MOCK_DEFINITIONS: GroupedProcessDefinitions = {
    'invoice': [
        { id: 'def1', key: 'invoice', name: 'Invoice Process', version: 1, resource: 'invoice.bpmn', deploymentId: 'dep1' },
        { id: 'def2', key: 'invoice', name: 'Invoice Process', version: 2, resource: 'invoice.bpmn', deploymentId: 'dep2' },
    ],
    'approval': [
        { id: 'def3', key: 'approval', name: 'Approval Process', version: 1, resource: 'approval.bpmn', deploymentId: 'dep3' },
    ]
};

const MOCK_INSTANCES: ProcessInstance[] = [
    { id: 'inst1', processDefinitionKey: 'invoice', processDefinitionName: 'Invoice Process', processDefinitionVersion: 2, startTime: new Date().toISOString(), status: 'ACTIVE', isActive: true, businessKey: 'INV-001' },
    { id: 'inst2', processDefinitionKey: 'approval', processDefinitionName: 'Approval Process', processDefinitionVersion: 1, startTime: new Date(Date.now() - 3600000).toISOString(), endTime: new Date().toISOString(), status: 'COMPLETED', isActive: false, businessKey: 'APP-123' },
];

const MOCK_COUNTS: ProcessCounts = { active: 1, total: 2, completed: 1 };

const ProcessManager: React.FC = () => {
    const [processInstances, setProcessInstances] = useState<ProcessInstance[]>(MOCK_INSTANCES);
    const [groupedProcessDefinitions, setGroupedProcessDefinitions] = useState<GroupedProcessDefinitions>(MOCK_DEFINITIONS);
    const [counts, setCounts] = useState<ProcessCounts>(MOCK_COUNTS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedInstance, setSelectedInstance] = useState<ProcessInstance | null>(null);
    const [startDialogOpen, setStartDialogOpen] = useState(false);
    const [selectedDefinition, setSelectedDefinition] = useState<ProcessDefinition | null>(null);
    const [startVariables, setStartVariables] = useState('{}');
    const [selectedVersions, setSelectedVersions] = useState<{ [key: string]: string }>({});
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Placeholder fetch functions
    const fetchProcessInstances = useCallback(async () => {
        // TODO: Replace with real API call
        setProcessInstances(MOCK_INSTANCES);
        setCounts(MOCK_COUNTS);
    }, []);

    const fetchProcessDefinitions = useCallback(async () => {
        // TODO: Replace with real API call
        setGroupedProcessDefinitions(MOCK_DEFINITIONS);
    }, []);

    const handleRefresh = useCallback(async () => {
        setLoading(true);
        await Promise.all([fetchProcessInstances(), fetchProcessDefinitions()]);
        setLoading(false);
    }, [fetchProcessInstances, fetchProcessDefinitions]);

    useEffect(() => {
        handleRefresh();
    }, [handleRefresh]);

    // Auto-refresh effect
    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(() => {
                fetchProcessInstances();
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh, fetchProcessInstances]);

    const getStatusColor = (status: string, isActive: boolean) => {
        if (isActive) return 'success';
        if (status === 'COMPLETED') return 'info';
        if (status === 'EXTERNALLY_TERMINATED' || status === 'INTERNALLY_TERMINATED') return 'error';
        return 'default';
    };

    const formatDateTime = (dateTime: string | undefined) => {
        if (!dateTime) return 'N/A';
        return new Date(dateTime).toLocaleString();
    };

    const getDuration = (startTime: string, endTime?: string) => {
        const start = new Date(startTime);
        const end = endTime ? new Date(endTime) : new Date();
        const durationMs = end.getTime() - start.getTime();
        const seconds = Math.floor(durationMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Process Management
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                color="primary"
                            />
                        }
                        label="Auto-refresh (5s)"
                    />
                    <Button
                        variant="contained"
                        startIcon={<Refresh />}
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                </Box>
            </Box>
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Active Processes
                            </Typography>
                            <Typography variant="h4" color="success.main">
                                {counts.active}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Processes
                            </Typography>
                            <Typography variant="h4">
                                {counts.total}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Available Definitions
                            </Typography>
                            <Typography variant="h4" color="primary.main">
                                {Object.keys(groupedProcessDefinitions).length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            {/* Process Definitions Section */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <Settings sx={{ mr: 1 }} />
                    Process Definitions
                </Typography>
                <Grid container spacing={2}>
                    {Object.entries(groupedProcessDefinitions).map(([key, definitions]) => {
                        const selectedVersion = selectedVersions[key] || definitions[0]?.id || '';
                        const selectedDefinition = definitions.find(def => def.id === selectedVersion) || definitions[0];
                        return (
                            <Grid item xs={12} sm={6} md={4} key={key}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle1" noWrap>
                                            {selectedDefinition?.name || key}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Key: {key}
                                        </Typography>
                                        <Box sx={{ mt: 1, mb: 2 }}>
                                            <FormControl size="small" fullWidth>
                                                <InputLabel>Version</InputLabel>
                                                <Select
                                                    value={selectedVersion}
                                                    label="Version"
                                                    onChange={(e) => setSelectedVersions(prev => ({
                                                        ...prev,
                                                        [key]: e.target.value
                                                    }))}
                                                >
                                                    {definitions.map((def) => (
                                                        <MenuItem key={def.id} value={def.id}>
                                                            v{def.version} {def.version === Math.max(...definitions.map(d => d.version)) && '(latest)'}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    startIcon={<PlayArrow />}
                                                    onClick={() => {
                                                        setSelectedDefinition(selectedDefinition);
                                                        setStartDialogOpen(true);
                                                    }}
                                                    disabled={!selectedDefinition}
                                                >
                                                    Start Process
                                                </Button>
                                                <IconButton size="small" color="primary" title="View process documentation">
                                                    <Info />
                                                </IconButton>
                                                <IconButton size="small" color="primary" title="View process model">
                                                    <Schema />
                                                </IconButton>
                                            </Box>
                                            <IconButton size="small" color="error" title="Delete process definition">
                                                <Delete />
                                            </IconButton>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            </Paper>
            {/* Process Instances Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Instance ID</TableCell>
                            <TableCell>Process Name</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Start Time</TableCell>
                            <TableCell>Duration</TableCell>
                            <TableCell>Business Key</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {processInstances.map((instance) => (
                            <TableRow key={instance.id}>
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                        {instance.id.substring(0, 8)}...
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {instance.processDefinitionName || instance.processDefinitionKey}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        v{instance.processDefinitionVersion}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={instance.isActive ? 'ACTIVE' : (instance.state || 'COMPLETED')}
                                        color={getStatusColor(instance.status, instance.isActive)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {formatDateTime(instance.startTime)}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {getDuration(instance.startTime, instance.endTime)}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {instance.businessKey || 'N/A'}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Tooltip title="View Details">
                                        <IconButton size="small">
                                            <Visibility />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={instance.isActive ? "Terminate Process" : "Delete Process Instance"}>
                                        <IconButton size="small" color="error" onClick={() => {
                                            setSelectedInstance(instance);
                                            setDeleteDialogOpen(true);
                                        }}>
                                            <Delete />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>
                    <Warning color="warning" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {selectedInstance?.isActive ? 'Terminate Process Instance' : 'Delete Process Instance'}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to {selectedInstance?.isActive ? 'terminate' : 'delete'} process instance{' '}
                        <strong>{selectedInstance?.id}</strong>?
                        <br />
                        <br />
                        {selectedInstance?.isActive
                            ? 'This action cannot be undone and will stop all active tasks in this process.'
                            : 'This action will permanently remove this process instance from the system.'
                        }
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button color="error" variant="contained">
                        {selectedInstance?.isActive ? 'Terminate' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Start Process Dialog */}
            <Dialog open={startDialogOpen} onClose={() => setStartDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Start Process: {selectedDefinition?.name || selectedDefinition?.key}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Enter initial variables for the process (JSON format):
                    </DialogContentText>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        label="Process Variables (JSON)"
                        value={startVariables}
                        onChange={(e) => setStartVariables(e.target.value)}
                        placeholder='{"key": "value", "number": 42}'
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStartDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="primary">
                        Start Process
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProcessManager; 