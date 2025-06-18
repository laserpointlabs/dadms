import { CheckCircle, Error, Warning } from '@mui/icons-material';
import { Box, Card, CardContent, CardHeader, Grid, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';

interface SystemStatus {
    services: {
        backend: { status: string; uptime: number };
        analysisDaemon: { status: string };
    };
    docker: Array<{ name: string; status: string }>;
    system: {
        memory?: { used: number; total: number };
        loadAverage?: string;
    };
}

const SystemStatusWidget: React.FC = () => {
    const [status, setStatus] = useState<SystemStatus | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStatus = async () => {
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}/api/system/status`
            );
            const data = await response.json();
            if (data.success) {
                setStatus(data);
            }
        } catch (error) {
            console.error('Failed to fetch system status:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'running':
            case 'online':
                return <CheckCircle color="success" fontSize="small" />;
            case 'stopped':
            case 'offline':
                return <Error color="error" fontSize="small" />;
            default:
                return <Warning color="warning" fontSize="small" />;
        }
    };

    const getDockerHealth = () => {
        if (!status?.docker) return 'unknown';
        const total = status.docker.length;
        const healthy = status.docker.filter(c =>
            c.status.includes('Up') && !c.status.includes('unhealthy')
        ).length;
        return `${healthy}/${total}`;
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <Card>
                <CardHeader title="System Status" />
                <CardContent>
                    <Typography color="text.secondary">Loading...</Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader title="System Status" />
            <CardContent>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            {getStatusIcon(status?.services?.backend?.status || 'unknown')}
                            <Typography variant="body2">Backend API</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            {getStatusIcon(status?.services?.analysisDaemon?.status || 'unknown')}
                            <Typography variant="body2">Analysis Daemon</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Docker: {getDockerHealth()} healthy
                        </Typography>
                        {status?.system?.memory && (
                            <Typography variant="body2" color="text.secondary">
                                Memory: {((status.system.memory.used / status.system.memory.total) * 100).toFixed(0)}%
                            </Typography>
                        )}
                        {status?.system?.loadAverage && (
                            <Typography variant="body2" color="text.secondary">
                                Load: {status.system.loadAverage}
                            </Typography>
                        )}
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default SystemStatusWidget;
