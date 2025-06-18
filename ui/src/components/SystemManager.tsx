import {
    CheckCircle,
    Error,
    PlayArrow,
    Refresh,
    Stop,
    Warning
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
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
    Tooltip,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface SystemStatus {
    success: boolean;
    timestamp: string;
    services: {
        backend: {
            name: string;
            status: string;
            port: number;
            uptime: number;
            pm2: any;
        };
        analysisDaemon: {
            name: string;
            status: string;
        };
    };
    docker: Array<{
        name: string;
        status: string;
        image: string;
        ports: string;
    }>;
    system: {
        memory?: {
            total: number;
            used: number;
            free: number;
            available: number;
        };
        loadAverage?: string;
    };
}

const SystemManager: React.FC = () => {
    const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchSystemStatus = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}/api/system/status`
            );
            const data = await response.json();

            if (data.success) {
                setSystemStatus(data);
                setError(null);
            } else {
                setError(data.error || 'Failed to fetch system status');
            }
        } catch (err) {
            setError('Failed to connect to backend');
            console.error('Error fetching system status:', err);
        } finally {
            setLoading(false);
        }
    };

    const executeAction = async (service: 'backend' | 'daemon', action: string) => {
        try {
            setActionLoading(`${service}-${action}`);
            const response = await fetch(
                `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}/api/system/${service}/${action}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            const result = await response.json();

            if (result.success) {
                console.log(`${service} ${action} successful:`, result.output);
                // Refresh status after action
                setTimeout(fetchSystemStatus, 1000);
            } else {
                console.error(`${service} ${action} failed:`, result.error);
                setError(`Failed to ${action} ${service}: ${result.error}`);
            }
        } catch (err) {
            console.error(`Error executing ${service} ${action}:`, err);
            setError(`Failed to ${action} ${service}`);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'running':
            case 'online':
                return <CheckCircle color="success" />;
            case 'stopped':
            case 'offline':
                return <Stop color="error" />;
            case 'stopping':
            case 'starting':
                return <Warning color="warning" />;
            default:
                return <Error color="error" />;
        }
    };

    const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
        switch (status.toLowerCase()) {
            case 'running':
            case 'online':
                return 'success';
            case 'stopped':
            case 'offline':
                return 'error';
            case 'stopping':
            case 'starting':
                return 'warning';
            default:
                return 'default';
        }
    };

    const formatUptime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hours}h ${minutes}m ${secs}s`;
    };

    const formatMemory = (mb: number): string => {
        if (mb > 1024) {
            return `${(mb / 1024).toFixed(1)} GB`;
        }
        return `${mb} MB`;
    };

    useEffect(() => {
        fetchSystemStatus();
        const interval = setInterval(fetchSystemStatus, 10000); // Refresh every 10 seconds
        return () => clearInterval(interval);
    }, []);

    if (loading && !systemStatus) {
        return (
            <Box>
                <Typography variant="h4" gutterBottom>
                    System Management
                </Typography>
                <LinearProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    System Management
                </Typography>
                <Tooltip title="Refresh Status">
                    <IconButton onClick={fetchSystemStatus} disabled={loading}>
                        <Refresh />
                    </IconButton>
                </Tooltip>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Services Status */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader title="Services" />
                        <CardContent>
                            {systemStatus?.services && (
                                <Box sx={{ mb: 2 }}>
                                    {/* Backend Service */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {getStatusIcon(systemStatus.services.backend.status)}
                                            <Typography variant="body1">
                                                {systemStatus.services.backend.name}
                                            </Typography>
                                            <Chip
                                                label={systemStatus.services.backend.status}
                                                color={getStatusColor(systemStatus.services.backend.status)}
                                                size="small"
                                            />
                                            {systemStatus.services.backend.status === 'running' && (
                                                <Typography variant="body2" color="text.secondary">
                                                    Port: {systemStatus.services.backend.port} |
                                                    Uptime: {formatUptime(systemStatus.services.backend.uptime)}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button
                                                size="small"
                                                startIcon={<PlayArrow />}
                                                onClick={() => executeAction('backend', 'start')}
                                                disabled={actionLoading === 'backend-start' || systemStatus.services.backend.status === 'running'}
                                                variant="outlined"
                                                color="success"
                                            >
                                                Start
                                            </Button>
                                            <Button
                                                size="small"
                                                startIcon={<Stop />}
                                                onClick={() => executeAction('backend', 'stop')}
                                                disabled={actionLoading === 'backend-stop' || systemStatus.services.backend.status === 'stopped'}
                                                variant="outlined"
                                                color="error"
                                            >
                                                Stop
                                            </Button>
                                            <Button
                                                size="small"
                                                startIcon={<Refresh />}
                                                onClick={() => executeAction('backend', 'restart')}
                                                disabled={actionLoading === 'backend-restart'}
                                                variant="outlined"
                                            >
                                                Restart
                                            </Button>
                                        </Box>
                                    </Box>

                                    {/* Analysis Daemon */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {getStatusIcon(systemStatus.services.analysisDaemon.status)}
                                            <Typography variant="body1">
                                                {systemStatus.services.analysisDaemon.name}
                                            </Typography>
                                            <Chip
                                                label={systemStatus.services.analysisDaemon.status}
                                                color={getStatusColor(systemStatus.services.analysisDaemon.status)}
                                                size="small"
                                            />
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button
                                                size="small"
                                                startIcon={<PlayArrow />}
                                                onClick={() => executeAction('daemon', 'start')}
                                                disabled={actionLoading === 'daemon-start' || systemStatus.services.analysisDaemon.status === 'running'}
                                                variant="outlined"
                                                color="success"
                                            >
                                                Start
                                            </Button>
                                            <Button
                                                size="small"
                                                startIcon={<Stop />}
                                                onClick={() => executeAction('daemon', 'stop')}
                                                disabled={actionLoading === 'daemon-stop' || systemStatus.services.analysisDaemon.status === 'stopped'}
                                                variant="outlined"
                                                color="error"
                                            >
                                                Stop
                                            </Button>
                                            <Button
                                                size="small"
                                                startIcon={<Refresh />}
                                                onClick={() => executeAction('daemon', 'restart')}
                                                disabled={actionLoading === 'daemon-restart'}
                                                variant="outlined"
                                            >
                                                Restart
                                            </Button>
                                        </Box>
                                    </Box>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* System Resources */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader title="System Resources" />
                        <CardContent>
                            {systemStatus?.system && (
                                <Box>
                                    {systemStatus.system.memory && (
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" gutterBottom>
                                                Memory Usage
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={(systemStatus.system.memory.used / systemStatus.system.memory.total) * 100}
                                                    sx={{ flexGrow: 1, height: 8 }}
                                                />
                                                <Typography variant="body2" color="text.secondary">
                                                    {((systemStatus.system.memory.used / systemStatus.system.memory.total) * 100).toFixed(1)}%
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatMemory(systemStatus.system.memory.used)} / {formatMemory(systemStatus.system.memory.total)} used
                                            </Typography>
                                        </Box>
                                    )}
                                    {systemStatus.system.loadAverage && (
                                        <Box>
                                            <Typography variant="body2" gutterBottom>
                                                Load Average: {systemStatus.system.loadAverage}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Docker Containers */}
                <Grid item xs={12}>
                    <Card>
                        <CardHeader title="Docker Containers" />
                        <CardContent>
                            {systemStatus?.docker && systemStatus.docker.length > 0 ? (
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Container</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Image</TableCell>
                                                <TableCell>Ports</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {systemStatus.docker.map((container, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                            {container.name}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={container.status.split(' ')[0]}
                                                            color={container.status.includes('Up') ? 'success' : 'error'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {container.image}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                            {container.ports || 'None'}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Typography color="text.secondary">
                                    No Docker containers found or Docker not available
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {systemStatus && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    Last updated: {new Date(systemStatus.timestamp).toLocaleString()}
                </Typography>
            )}
        </Box>
    );
};

export default SystemManager;
