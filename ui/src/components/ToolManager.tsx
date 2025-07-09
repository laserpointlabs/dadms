import {
    Add,
    CheckCircle,
    Delete,
    Edit,
    Error,
    HealthAndSafety,
    PlayArrow,
    Refresh,
    Visibility,
    Warning,
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    Paper,
    Snackbar,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import type { CreateToolRequest, Finding, Tool } from '../services/microservices-api';
import { aiOversightService, toolService } from '../services/microservices-api';

interface ToolManagerProps {
    onSelectTool?: (tool: Tool) => void;
}

const ToolManager: React.FC<ToolManagerProps> = ({ onSelectTool }) => {
    const [tools, setTools] = useState<Tool[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [testDialogOpen, setTestDialogOpen] = useState(false);
    const [testInput, setTestInput] = useState('{}');
    const [testResult, setTestResult] = useState<any>(null);
    const [findings, setFindings] = useState<Finding[]>([]);
    const [formData, setFormData] = useState<CreateToolRequest>({
        name: '',
        description: '',
        endpoint: '',
        capabilities: [],
        version: '1.0.0',
        metadata: {},
    });

    useEffect(() => {
        loadTools();
        loadFindings();
    }, []);

    const loadTools = async () => {
        try {
            setLoading(true);
            const response = await toolService.getTools();
            setTools(response.data.data);
        } catch (err) {
            setError('Failed to load tools');
            console.error('Error loading tools:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadFindings = async () => {
        try {
            const response = await aiOversightService.getFindings({ entity_type: 'tool', resolved: false });
            setFindings(response.data.data);
        } catch (err) {
            console.error('Error loading findings:', err);
        }
    };

    const handleCreateTool = async () => {
        try {
            setLoading(true);
            const response = await toolService.registerTool(formData);
            setTools([...tools, response.data.data]);
            setSuccess('Tool registered successfully');
            setDialogOpen(false);
            resetForm();
            await loadFindings();
        } catch (err) {
            setError('Failed to register tool');
            console.error('Error registering tool:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTool = async () => {
        if (!selectedTool) return;
        try {
            setLoading(true);
            const response = await toolService.updateTool(selectedTool.id, formData);
            setTools(tools.map(t => t.id === selectedTool.id ? response.data.data : t));
            setSuccess('Tool updated successfully');
            setDialogOpen(false);
            resetForm();
            await loadFindings();
        } catch (err) {
            setError('Failed to update tool');
            console.error('Error updating tool:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTool = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this tool?')) return;
        try {
            setLoading(true);
            await toolService.deleteTool(id);
            setTools(tools.filter(t => t.id !== id));
            setSuccess('Tool deleted successfully');
            await loadFindings();
        } catch (err) {
            setError('Failed to delete tool');
            console.error('Error deleting tool:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleHealthCheck = async (tool: Tool) => {
        try {
            setLoading(true);
            await toolService.healthCheckTool(tool.id);
            setSuccess(`Health check completed for ${tool.name}`);
            await loadTools(); // Refresh to get updated status
        } catch (err) {
            setError(`Health check failed for ${tool.name}`);
            console.error('Error checking tool health:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleTestTool = async (tool: Tool) => {
        try {
            setLoading(true);
            const input = JSON.parse(testInput);
            const response = await toolService.invokeTool(tool.id, input);
            setTestResult(response.data.data);
            setTestDialogOpen(true);
        } catch (err) {
            setError('Failed to test tool');
            console.error('Error testing tool:', err);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            endpoint: '',
            capabilities: [],
            version: '1.0.0',
            metadata: {},
        });
        setSelectedTool(null);
    };

    const openEditDialog = (tool: Tool) => {
        setSelectedTool(tool);
        setFormData({
            name: tool.name,
            description: tool.description,
            endpoint: tool.endpoint,
            capabilities: tool.capabilities,
            version: tool.version,
            metadata: tool.metadata,
        });
        setDialogOpen(true);
    };

    const openViewDialog = (tool: Tool) => {
        setSelectedTool(tool);
        setViewDialogOpen(true);
    };

    const openTestDialog = (tool: Tool) => {
        setSelectedTool(tool);
        setTestInput('{}');
        setTestResult(null);
        setTestDialogOpen(true);
    };

    const getToolFindings = (toolId: string) => {
        return findings.filter(f => f.entity_id === toolId);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'success';
            case 'unhealthy': return 'error';
            default: return 'warning';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <CheckCircle color="success" />;
            case 'unhealthy': return <Error color="error" />;
            default: return <Warning color="warning" />;
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Tool Management</Typography>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={() => { loadTools(); loadFindings(); }}
                        sx={{ mr: 1 }}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => { resetForm(); setDialogOpen(true); }}
                    >
                        Register Tool
                    </Button>
                </Box>
            </Box>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            )}

            <Grid container spacing={3}>
                {tools.map((tool) => {
                    const toolFindings = getToolFindings(tool.id);
                    return (
                        <Grid item xs={12} md={6} lg={4} key={tool.id}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                                            {tool.name}
                                        </Typography>
                                        <Tooltip title={`Status: ${tool.status}`}>
                                            <span>{getStatusIcon(tool.status)}</span>
                                        </Tooltip>
                                    </Box>

                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {tool.description}
                                    </Typography>

                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        <strong>Endpoint:</strong> {tool.endpoint}
                                    </Typography>

                                    <Typography variant="body2" sx={{ mb: 2 }}>
                                        <strong>Version:</strong> {tool.version}
                                    </Typography>

                                    <Box sx={{ mb: 2 }}>
                                        {tool.capabilities.map((capability, index) => (
                                            <Chip
                                                key={index}
                                                label={capability}
                                                size="small"
                                                variant="outlined"
                                                sx={{ mr: 0.5, mb: 0.5 }}
                                            />
                                        ))}
                                    </Box>

                                    <Typography variant="caption" color="text.secondary">
                                        Created: {new Date(tool.created_at).toLocaleDateString()}
                                    </Typography>

                                    {toolFindings.length > 0 && (
                                        <Alert severity="warning" sx={{ mt: 2 }}>
                                            {toolFindings.length} AI finding(s) - Click view for details
                                        </Alert>
                                    )}
                                </CardContent>
                                <CardActions>
                                    <Button
                                        size="small"
                                        startIcon={<Visibility />}
                                        onClick={() => openViewDialog(tool)}
                                    >
                                        View
                                    </Button>
                                    <Button
                                        size="small"
                                        startIcon={<Edit />}
                                        onClick={() => openEditDialog(tool)}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        size="small"
                                        startIcon={<PlayArrow />}
                                        onClick={() => openTestDialog(tool)}
                                    >
                                        Test
                                    </Button>
                                    <Button
                                        size="small"
                                        startIcon={<HealthAndSafety />}
                                        onClick={() => handleHealthCheck(tool)}
                                    >
                                        Health
                                    </Button>
                                    <Button
                                        size="small"
                                        startIcon={<Delete />}
                                        onClick={() => handleDeleteTool(tool.id)}
                                        color="error"
                                    >
                                        Delete
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedTool ? 'Edit Tool' : 'Register New Tool'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Tool Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        sx={{ mb: 2, mt: 1 }}
                    />

                    <TextField
                        fullWidth
                        label="Description"
                        multiline
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label="Endpoint URL"
                        value={formData.endpoint}
                        onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label="Version"
                        value={formData.version}
                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label="Capabilities (comma-separated)"
                        value={formData.capabilities.join(', ')}
                        onChange={(e) => setFormData({
                            ...formData,
                            capabilities: e.target.value.split(',').map(cap => cap.trim()).filter(cap => cap),
                        })}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label="Metadata (JSON)"
                        multiline
                        rows={4}
                        value={JSON.stringify(formData.metadata, null, 2)}
                        onChange={(e) => {
                            try {
                                const metadata = JSON.parse(e.target.value);
                                setFormData({ ...formData, metadata });
                            } catch (err) {
                                // Invalid JSON, ignore
                            }
                        }}
                        sx={{ mb: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={selectedTool ? handleUpdateTool : handleCreateTool}
                        variant="contained"
                        disabled={!formData.name.trim() || !formData.endpoint.trim()}
                    >
                        {selectedTool ? 'Update' : 'Register'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Tool Details</DialogTitle>
                <DialogContent>
                    {selectedTool && (
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                {selectedTool.name}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                {selectedTool.description}
                            </Typography>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Status: <Chip label={selectedTool.status} color={getStatusColor(selectedTool.status) as any} size="small" />
                            </Typography>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Endpoint: {selectedTool.endpoint}
                            </Typography>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Version: {selectedTool.version}
                            </Typography>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Capabilities: {selectedTool.capabilities.join(', ')}
                            </Typography>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Created: {new Date(selectedTool.created_at).toLocaleString()}
                            </Typography>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Updated: {new Date(selectedTool.updated_at).toLocaleString()}
                            </Typography>

                            {Object.keys(selectedTool.metadata).length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                        Metadata:
                                    </Typography>
                                    <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                                        <pre>{JSON.stringify(selectedTool.metadata, null, 2)}</pre>
                                    </Paper>
                                </Box>
                            )}

                            {getToolFindings(selectedTool.id).length > 0 && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="h6" sx={{ mb: 2 }}>AI Findings</Typography>
                                    {getToolFindings(selectedTool.id).map((finding) => (
                                        <Alert
                                            key={finding.finding_id}
                                            severity={finding.level === 'error' ? 'error' : finding.level === 'warning' ? 'warning' : 'info'}
                                            sx={{ mb: 1 }}
                                        >
                                            <strong>{finding.agent_name}:</strong> {finding.message}
                                            {finding.suggested_action && (
                                                <Typography variant="body2" sx={{ mt: 1 }}>
                                                    <strong>Suggested Action:</strong> {finding.suggested_action}
                                                </Typography>
                                            )}
                                        </Alert>
                                    ))}
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Test Dialog */}
            <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Test Tool</DialogTitle>
                <DialogContent>
                    {selectedTool && (
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Testing: {selectedTool.name}
                            </Typography>
                            <TextField
                                fullWidth
                                label="Input (JSON)"
                                multiline
                                rows={6}
                                value={testInput}
                                onChange={(e) => setTestInput(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            <Button
                                variant="contained"
                                onClick={() => handleTestTool(selectedTool)}
                                disabled={loading}
                                sx={{ mb: 2 }}
                            >
                                Run Test
                            </Button>
                            {testResult && (
                                <Box>
                                    <Typography variant="h6" sx={{ mb: 1 }}>
                                        Test Result:
                                    </Typography>
                                    <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                                        <pre>{JSON.stringify(testResult, null, 2)}</pre>
                                    </Paper>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTestDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setError(null)} severity="error">
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!success}
                autoHideDuration={6000}
                onClose={() => setSuccess(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSuccess(null)} severity="success">
                    {success}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ToolManager; 