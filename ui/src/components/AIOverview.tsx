import {
    CheckCircle,
    Error,
    FilterList,
    Info,
    PowerSettingsNew,
    Refresh,
    SmartToy,
    Warning
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
    FormControl,
    FormControlLabel,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Switch,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,

    Tabs,
    Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import type { Agent, Finding } from '../services/microservices-api';
import { aiOversightService } from '../services/microservices-api';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
};

const AIOverview: React.FC = () => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [findings, setFindings] = useState<Finding[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [tabValue, setTabValue] = useState(0);
    const [filterLevel, setFilterLevel] = useState<string>('all');
    const [filterEntityType, setFilterEntityType] = useState<string>('all');
    const [filterResolved, setFilterResolved] = useState<boolean>(false);

    const loadAgents = async () => {
        try {
            setLoading(true);
            const response = await aiOversightService.getAgents();
            setAgents(response.data.data);
        } catch (err) {
            setError('Failed to load agents');
            console.error('Error loading agents:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadFindings = useCallback(async () => {
        try {
            setLoading(true);
            const filters: any = {};
            if (filterLevel !== 'all') filters.level = filterLevel;
            if (filterEntityType !== 'all') filters.entity_type = filterEntityType;
            filters.resolved = filterResolved;

            const response = await aiOversightService.getFindings(filters);
            setFindings(response.data.data);
        } catch (err) {
            setError('Failed to load findings');
            console.error('Error loading findings:', err);
        } finally {
            setLoading(false);
        }
    }, [filterLevel, filterEntityType, filterResolved]);

    useEffect(() => {
        loadAgents();
        loadFindings();
    }, [loadFindings]);

    const handleToggleAgent = async (agent: Agent) => {
        try {
            setLoading(true);
            if (agent.enabled) {
                await aiOversightService.disableAgent(agent.id);
                setSuccess(`Agent ${agent.name} disabled`);
            } else {
                await aiOversightService.enableAgent(agent.id);
                setSuccess(`Agent ${agent.name} enabled`);
            }
            await loadAgents();
        } catch (err) {
            setError(`Failed to toggle agent ${agent.name}`);
            console.error('Error toggling agent:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleResolveFinding = async (finding: Finding) => {
        try {
            setLoading(true);
            await aiOversightService.resolveFinding(finding.finding_id);
            setSuccess('Finding resolved successfully');
            await loadFindings();
        } catch (err) {
            setError('Failed to resolve finding');
            console.error('Error resolving finding:', err);
        } finally {
            setLoading(false);
        }
    };

    const getFindingIcon = (level: string) => {
        switch (level) {
            case 'error': return <Error color="error" />;
            case 'warning': return <Warning color="warning" />;
            case 'suggestion': return <Info color="info" />;
            default: return <Info color="info" />;
        }
    };

    const getFindingColor = (level: string) => {
        switch (level) {
            case 'error': return 'error';
            case 'warning': return 'warning';
            case 'suggestion': return 'info';
            default: return 'default';
        }
    };

    const getEntityIcon = (entityType: string) => {
        switch (entityType) {
            case 'prompt': return '📝';
            case 'tool': return '🔧';
            case 'workflow': return '🔄';
            default: return '📋';
        }
    };

    const filteredFindings = findings.filter(finding => {
        if (filterLevel !== 'all' && finding.level !== filterLevel) return false;
        if (filterEntityType !== 'all' && finding.entity_type !== filterEntityType) return false;
        if (filterResolved && !finding.resolved) return false;
        if (!filterResolved && finding.resolved) return false;
        return true;
    });

    const findingStats = {
        total: findings.length,
        error: findings.filter(f => f.level === 'error' && !f.resolved).length,
        warning: findings.filter(f => f.level === 'warning' && !f.resolved).length,
        suggestion: findings.filter(f => f.level === 'suggestion' && !f.resolved).length,
        resolved: findings.filter(f => f.resolved).length,
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">AI Oversight & Findings</Typography>
                <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={() => { loadAgents(); loadFindings(); }}
                >
                    Refresh
                </Button>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={2.4}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary">
                                {findingStats.total}
                            </Typography>
                            <Typography variant="body2">Total Findings</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="error.main">
                                {findingStats.error}
                            </Typography>
                            <Typography variant="body2">Errors</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="warning.main">
                                {findingStats.warning}
                            </Typography>
                            <Typography variant="body2">Warnings</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="info.main">
                                {findingStats.suggestion}
                            </Typography>
                            <Typography variant="body2">Suggestions</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="success.main">
                                {findingStats.resolved}
                            </Typography>
                            <Typography variant="body2">Resolved</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                    <Tab label={`Findings (${filteredFindings.length})`} />
                    <Tab label={`Agents (${agents.length})`} />
                </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
                {/* Findings Tab */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Filter Findings</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth>
                                <InputLabel>Level</InputLabel>
                                <Select
                                    value={filterLevel}
                                    onChange={(e) => setFilterLevel(e.target.value)}
                                >
                                    <MenuItem value="all">All Levels</MenuItem>
                                    <MenuItem value="error">Error</MenuItem>
                                    <MenuItem value="warning">Warning</MenuItem>
                                    <MenuItem value="suggestion">Suggestion</MenuItem>
                                    <MenuItem value="info">Info</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth>
                                <InputLabel>Entity Type</InputLabel>
                                <Select
                                    value={filterEntityType}
                                    onChange={(e) => setFilterEntityType(e.target.value)}
                                >
                                    <MenuItem value="all">All Types</MenuItem>
                                    <MenuItem value="prompt">Prompt</MenuItem>
                                    <MenuItem value="tool">Tool</MenuItem>
                                    <MenuItem value="workflow">Workflow</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={filterResolved}
                                        onChange={(e) => setFilterResolved(e.target.checked)}
                                    />
                                }
                                label="Show Resolved Only"
                            />
                        </Grid>
                    </Grid>
                    <Button
                        variant="contained"
                        startIcon={<FilterList />}
                        onClick={loadFindings}
                        sx={{ mt: 2 }}
                    >
                        Apply Filters
                    </Button>
                </Box>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Level</TableCell>
                                <TableCell>Entity</TableCell>
                                <TableCell>Agent</TableCell>
                                <TableCell>Message</TableCell>
                                <TableCell>Timestamp</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredFindings.map((finding) => (
                                <TableRow key={finding.finding_id}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            {getFindingIcon(finding.level)}
                                            <Chip
                                                label={finding.level}
                                                color={getFindingColor(finding.level) as any}
                                                size="small"
                                                sx={{ ml: 1 }}
                                            />
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <span style={{ marginRight: 8 }}>
                                                {getEntityIcon(finding.entity_type)}
                                            </span>
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {finding.entity_type}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {finding.entity_id.substring(0, 8)}...
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={finding.agent_name}
                                            variant="outlined"
                                            size="small"
                                            icon={<SmartToy />}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2">
                                                {finding.message}
                                            </Typography>
                                            {finding.suggested_action && (
                                                <Typography variant="caption" color="text.secondary">
                                                    Suggested: {finding.suggested_action}
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption">
                                            {new Date(finding.timestamp).toLocaleString()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {!finding.resolved && (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<CheckCircle />}
                                                onClick={() => handleResolveFinding(finding)}
                                            >
                                                Resolve
                                            </Button>
                                        )}
                                        {finding.resolved && (
                                            <Chip
                                                label="Resolved"
                                                color="success"
                                                size="small"
                                                icon={<CheckCircle />}
                                            />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {filteredFindings.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" color="text.secondary">
                            No findings match your criteria
                        </Typography>
                    </Box>
                )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                {/* Agents Tab */}
                <Typography variant="h6" sx={{ mb: 2 }}>AI Agents</Typography>
                <Grid container spacing={3}>
                    {agents.map((agent) => (
                        <Grid item xs={12} md={6} lg={4} key={agent.id}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                                            {agent.name}
                                        </Typography>
                                        <Chip
                                            label={agent.enabled ? 'Enabled' : 'Disabled'}
                                            color={agent.enabled ? 'success' : 'default'}
                                            size="small"
                                            icon={<PowerSettingsNew />}
                                        />
                                    </Box>

                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {agent.description}
                                    </Typography>

                                    <Typography variant="body2" sx={{ mb: 2 }}>
                                        <strong>Event Types:</strong>
                                    </Typography>
                                    <Box sx={{ mb: 2 }}>
                                        {agent.event_types.map((eventType, index) => (
                                            <Chip
                                                key={index}
                                                label={eventType}
                                                size="small"
                                                variant="outlined"
                                                sx={{ mr: 0.5, mb: 0.5 }}
                                            />
                                        ))}
                                    </Box>

                                    {Object.keys(agent.config).length > 0 && (
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            <strong>Configuration:</strong> {Object.keys(agent.config).length} setting(s)
                                        </Typography>
                                    )}
                                </CardContent>
                                <CardActions>
                                    <Button
                                        size="small"
                                        variant={agent.enabled ? 'outlined' : 'contained'}
                                        color={agent.enabled ? 'error' : 'success'}
                                        startIcon={<PowerSettingsNew />}
                                        onClick={() => handleToggleAgent(agent)}
                                        disabled={loading}
                                    >
                                        {agent.enabled ? 'Disable' : 'Enable'}
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {agents.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" color="text.secondary">
                            No AI agents available
                        </Typography>
                    </Box>
                )}
            </TabPanel>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            )}

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

export default AIOverview; 