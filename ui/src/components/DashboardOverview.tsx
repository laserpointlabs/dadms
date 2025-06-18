import { CheckCircle, Error, Refresh, Warning } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Grid,
    LinearProgress,
    Paper,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface SystemStatus {
    services: {
        [key: string]: {
            status: 'healthy' | 'unhealthy' | 'unknown';
            uptime?: string;
            version?: string;
            url?: string;
        };
    };
    processes: {
        active: number;
        completed: number;
        failed: number;
    };
    analysis: {
        daemon_running: boolean;
        total_analyses: number;
        pending_tasks: number;
    };
}

const DashboardOverview: React.FC = () => {
    const [status, setStatus] = useState<SystemStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchSystemStatus = async () => {
        setLoading(true);
        try {
            // Mock data - replace with actual API calls
            const mockStatus: SystemStatus = {
                services: {
                    camunda: { status: 'healthy', uptime: '2h 30m', version: '7.19.0', url: 'http://localhost:8080' },
                    openai_service: { status: 'healthy', uptime: '2h 30m', version: '1.0.0', url: 'http://localhost:5001' },
                    neo4j: { status: 'healthy', uptime: '2h 30m', version: '5.x', url: 'bolt://localhost:7687' },
                    qdrant: { status: 'healthy', uptime: '2h 30m', version: '1.4.x', url: 'http://localhost:6333' },
                    postgresql: { status: 'healthy', uptime: '2h 30m', version: '14.x', url: 'postgresql://localhost:5432' },
                    consul: { status: 'healthy', uptime: '2h 30m', version: '1.16.x', url: 'http://localhost:8500' },
                },
                processes: {
                    active: 3,
                    completed: 147,
                    failed: 2,
                },
                analysis: {
                    daemon_running: true,
                    total_analyses: 1247,
                    pending_tasks: 5,
                },
            };

            setStatus(mockStatus);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Failed to fetch system status:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchSystemStatus();
        const interval = setInterval(fetchSystemStatus, 30000); // Update every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'success';
            case 'unhealthy': return 'error';
            default: return 'warning';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <CheckCircle />;
            case 'unhealthy': return <Error />;
            default: return <Warning />;
        }
    };

    if (loading && !status) {
        return (
            <Box sx={{ width: '100%', mt: 2 }}>
                <LinearProgress />
                <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading system status...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    System Dashboard
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={fetchSystemStatus}
                    disabled={loading}
                >
                    Refresh
                </Button>
            </Box>

            <Grid container spacing={3}>
                {/* Service Status */}
                <Grid item xs={12} lg={8}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Service Status
                        </Typography>
                        <Grid container spacing={2}>
                            {status && Object.entries(status.services).map(([service, info]) => (
                                <Grid item xs={12} sm={6} md={4} key={service}>
                                    <Card variant="outlined">
                                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                {getStatusIcon(info.status)}
                                                <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 'bold' }}>
                                                    {service.charAt(0).toUpperCase() + service.slice(1).replace('_', ' ')}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                label={info.status}
                                                color={getStatusColor(info.status) as any}
                                                size="small"
                                                sx={{ mb: 1 }}
                                            />
                                            {info.uptime && (
                                                <Typography variant="body2" color="text.secondary">
                                                    Uptime: {info.uptime}
                                                </Typography>
                                            )}
                                            {info.version && (
                                                <Typography variant="body2" color="text.secondary">
                                                    Version: {info.version}
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Grid>

                {/* Quick Stats */}
                <Grid item xs={12} lg={4}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Process Statistics
                                </Typography>
                                {status && (
                                    <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2">Active Processes</Typography>
                                            <Typography variant="body2" fontWeight="bold" color="primary.main">
                                                {status.processes.active}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2">Completed</Typography>
                                            <Typography variant="body2" fontWeight="bold" color="success.main">
                                                {status.processes.completed}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2">Failed</Typography>
                                            <Typography variant="body2" fontWeight="bold" color="error.main">
                                                {status.processes.failed}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}
                            </Paper>
                        </Grid>

                        <Grid item xs={12}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Analysis System
                                </Typography>
                                {status && (
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Chip
                                                label={status.analysis.daemon_running ? "Daemon Running" : "Daemon Stopped"}
                                                color={status.analysis.daemon_running ? "success" : "error"}
                                                size="small"
                                            />
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2">Total Analyses</Typography>
                                            <Typography variant="body2" fontWeight="bold">
                                                {status.analysis.total_analyses}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2">Pending Tasks</Typography>
                                            <Typography variant="body2" fontWeight="bold" color="warning.main">
                                                {status.analysis.pending_tasks}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>
                </Grid>

                {/* System Alerts */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            System Alerts
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {status && status.analysis.pending_tasks > 10 && (
                                <Alert severity="warning">
                                    High number of pending analysis tasks ({status.analysis.pending_tasks}). Consider checking daemon status.
                                </Alert>
                            )}
                            {status && status.processes.failed > 0 && (
                                <Alert severity="error">
                                    {status.processes.failed} process(es) have failed. Review logs for details.
                                </Alert>
                            )}
                            {status && Object.values(status.services).some(s => s.status !== 'healthy') && (
                                <Alert severity="warning">
                                    Some services are not healthy. Check service status above.
                                </Alert>
                            )}
                            {status && Object.values(status.services).every(s => s.status === 'healthy') && status.analysis.daemon_running && (
                                <Alert severity="success">
                                    All systems operational. DADM is ready for analysis workflows.
                                </Alert>
                            )}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
        </Box>
    );
};

export default DashboardOverview;
