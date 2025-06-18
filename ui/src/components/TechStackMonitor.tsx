import {
    CheckCircle,
    Error,
    ExpandMore,
    OpenInNew,
    Refresh,
    Warning
} from '@mui/icons-material';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Card,
    CardContent,
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
import { Area, AreaChart, CartesianGrid, Line, LineChart, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';

interface ServiceMetrics {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_io: {
        bytes_sent: number;
        bytes_recv: number;
    };
    uptime: string;
    response_time: number;
    requests_per_minute: number;
}

interface ServiceStatus {
    name: string;
    status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown';
    url: string;
    version: string;
    description: string;
    metrics: ServiceMetrics;
    dependencies: string[];
    health_checks: {
        endpoint: string;
        status: 'pass' | 'fail';
        response_time: number;
        last_check: string;
    }[];
}

interface ProcessInfo {
    instance_id: string;
    definition_key: string;
    status: 'active' | 'completed' | 'failed' | 'suspended';
    start_time: string;
    end_time?: string;
    duration?: number;
    variables: { [key: string]: any };
    activities: {
        id: string;
        name: string;
        status: 'active' | 'completed' | 'failed';
        start_time: string;
        end_time?: string;
    }[];
}

const TechStackMonitor: React.FC = () => {
    const [services, setServices] = useState<ServiceStatus[]>([]);
    const [processes, setProcesses] = useState<ProcessInfo[]>([]);
    const [performanceData, setPerformanceData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchSystemData = async () => {
        setLoading(true);
        try {
            // Mock data - replace with actual API calls
            const mockServices: ServiceStatus[] = [
                {
                    name: 'Camunda BPM',
                    status: 'healthy',
                    url: 'http://localhost:8080',
                    version: '7.19.0',
                    description: 'BPMN Process Engine',
                    metrics: {
                        cpu_usage: 15.2,
                        memory_usage: 512,
                        disk_usage: 2.1,
                        network_io: { bytes_sent: 1024000, bytes_recv: 2048000 },
                        uptime: '2h 30m',
                        response_time: 45,
                        requests_per_minute: 12
                    },
                    dependencies: ['PostgreSQL'],
                    health_checks: [
                        { endpoint: '/engine-rest/engine', status: 'pass', response_time: 45, last_check: '2 minutes ago' },
                        { endpoint: '/health', status: 'pass', response_time: 12, last_check: '1 minute ago' }
                    ]
                },
                {
                    name: 'OpenAI Service',
                    status: 'healthy',
                    url: 'http://localhost:5001',
                    version: '1.0.0',
                    description: 'AI Assistant Integration Service',
                    metrics: {
                        cpu_usage: 8.7,
                        memory_usage: 256,
                        disk_usage: 0.5,
                        network_io: { bytes_sent: 512000, bytes_recv: 128000 },
                        uptime: '2h 30m',
                        response_time: 120,
                        requests_per_minute: 3
                    },
                    dependencies: ['OpenAI API'],
                    health_checks: [
                        { endpoint: '/health', status: 'pass', response_time: 23, last_check: '1 minute ago' },
                        { endpoint: '/verify_assistant_config', status: 'pass', response_time: 120, last_check: '5 minutes ago' }
                    ]
                },
                {
                    name: 'Neo4j Database',
                    status: 'healthy',
                    url: 'bolt://localhost:7687',
                    version: '5.12.0',
                    description: 'Graph Database for Knowledge Management',
                    metrics: {
                        cpu_usage: 12.3,
                        memory_usage: 1024,
                        disk_usage: 5.7,
                        network_io: { bytes_sent: 256000, bytes_recv: 512000 },
                        uptime: '2h 30m',
                        response_time: 8,
                        requests_per_minute: 15
                    },
                    dependencies: [],
                    health_checks: [
                        { endpoint: 'CALL dbms.ping()', status: 'pass', response_time: 8, last_check: '1 minute ago' }
                    ]
                },
                {
                    name: 'Qdrant Vector DB',
                    status: 'degraded',
                    url: 'http://localhost:6333',
                    version: '1.4.0',
                    description: 'Vector Database for Semantic Search',
                    metrics: {
                        cpu_usage: 25.1,
                        memory_usage: 768,
                        disk_usage: 3.2,
                        network_io: { bytes_sent: 128000, bytes_recv: 64000 },
                        uptime: '2h 30m',
                        response_time: 250,
                        requests_per_minute: 8
                    },
                    dependencies: [],
                    health_checks: [
                        { endpoint: '/health', status: 'fail', response_time: 250, last_check: '30 seconds ago' },
                        { endpoint: '/collections', status: 'pass', response_time: 180, last_check: '2 minutes ago' }
                    ]
                },
                {
                    name: 'PostgreSQL',
                    status: 'healthy',
                    url: 'postgresql://localhost:5432',
                    version: '14.9',
                    description: 'Primary Database for Camunda and Application Data',
                    metrics: {
                        cpu_usage: 6.8,
                        memory_usage: 384,
                        disk_usage: 12.4,
                        network_io: { bytes_sent: 1536000, bytes_recv: 768000 },
                        uptime: '2h 30m',
                        response_time: 15,
                        requests_per_minute: 45
                    },
                    dependencies: [],
                    health_checks: [
                        { endpoint: 'SELECT 1', status: 'pass', response_time: 15, last_check: '1 minute ago' }
                    ]
                },
                {
                    name: 'Consul Service Registry',
                    status: 'healthy',
                    url: 'http://localhost:8500',
                    version: '1.16.1',
                    description: 'Service Discovery and Configuration',
                    metrics: {
                        cpu_usage: 3.2,
                        memory_usage: 128,
                        disk_usage: 0.8,
                        network_io: { bytes_sent: 64000, bytes_recv: 32000 },
                        uptime: '2h 30m',
                        response_time: 12,
                        requests_per_minute: 20
                    },
                    dependencies: [],
                    health_checks: [
                        { endpoint: '/v1/status/leader', status: 'pass', response_time: 12, last_check: '1 minute ago' }
                    ]
                }
            ];

            const mockProcesses: ProcessInfo[] = [
                {
                    instance_id: 'proc_12345',
                    definition_key: 'openai_decision_test',
                    status: 'active',
                    start_time: '2025-06-17T10:30:00Z',
                    variables: { decision_topic: 'investment', requester: 'user123' },
                    activities: [
                        { id: 'start', name: 'Start Event', status: 'completed', start_time: '2025-06-17T10:30:00Z', end_time: '2025-06-17T10:30:01Z' },
                        { id: 'analyze', name: 'AI Analysis Task', status: 'active', start_time: '2025-06-17T10:30:01Z' }
                    ]
                },
                {
                    instance_id: 'proc_12344',
                    definition_key: 'echo_test_process',
                    status: 'completed',
                    start_time: '2025-06-17T10:25:00Z',
                    end_time: '2025-06-17T10:26:30Z',
                    duration: 90,
                    variables: { message: 'test message' },
                    activities: [
                        { id: 'start', name: 'Start Event', status: 'completed', start_time: '2025-06-17T10:25:00Z', end_time: '2025-06-17T10:25:01Z' },
                        { id: 'echo', name: 'Echo Task', status: 'completed', start_time: '2025-06-17T10:25:01Z', end_time: '2025-06-17T10:26:29Z' },
                        { id: 'end', name: 'End Event', status: 'completed', start_time: '2025-06-17T10:26:29Z', end_time: '2025-06-17T10:26:30Z' }
                    ]
                }
            ];

            // Generate mock performance data
            const mockPerformanceData = Array.from({ length: 30 }, (_, i) => ({
                time: new Date(Date.now() - (29 - i) * 60000).toLocaleTimeString(),
                cpu: Math.random() * 30 + 10,
                memory: Math.random() * 1000 + 500,
                network: Math.random() * 100 + 20,
                requests: Math.random() * 50 + 10
            }));

            setServices(mockServices);
            setProcesses(mockProcesses);
            setPerformanceData(mockPerformanceData);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Failed to fetch system data:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchSystemData();
        const interval = setInterval(fetchSystemData, 15000); // Update every 15 seconds
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'success';
            case 'degraded': return 'warning';
            case 'unhealthy': return 'error';
            default: return 'default';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <CheckCircle color="success" />;
            case 'degraded': return <Warning color="warning" />;
            case 'unhealthy': return <Error color="error" />;
            default: return <Warning color="disabled" />;
        }
    };

    if (loading) {
        return (
            <Box sx={{ width: '100%', mt: 2 }}>
                <LinearProgress />
                <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading system monitoring data...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Tech Stack Monitor
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={fetchSystemData}
                    disabled={loading}
                >
                    Refresh
                </Button>
            </Box>

            <Grid container spacing={3}>
                {/* Service Status Overview */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Service Status Overview
                        </Typography>
                        <Grid container spacing={2}>
                            {services.map((service) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={service.name}>
                                    <Card variant="outlined" sx={{ height: '100%' }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                {getStatusIcon(service.status)}
                                                <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 'bold' }}>
                                                    {service.name}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                label={service.status}
                                                color={getStatusColor(service.status) as any}
                                                size="small"
                                                sx={{ mb: 1 }}
                                            />
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                {service.description}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                v{service.version} | {service.metrics.uptime}
                                            </Typography>
                                            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                                                <Tooltip title={`Open ${service.name}`}>
                                                    <IconButton size="small" onClick={() => window.open(service.url, '_blank')}>
                                                        <OpenInNew fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Grid>

                {/* Performance Metrics */}
                <Grid item xs={12} lg={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            System Performance
                        </Typography>
                        <Box sx={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="time" />
                                    <YAxis />
                                    <RechartsTooltip />
                                    <Line type="monotone" dataKey="cpu" stroke="#2196f3" name="CPU %" />
                                    <Line type="monotone" dataKey="requests" stroke="#4caf50" name="Requests/min" />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>

                {/* Memory Usage */}
                <Grid item xs={12} lg={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Memory Usage
                        </Typography>
                        <Box sx={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="time" />
                                    <YAxis />
                                    <RechartsTooltip />
                                    <Area type="monotone" dataKey="memory" stroke="#ff9800" fill="#ff9800" fillOpacity={0.3} name="Memory (MB)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>

                {/* Active Processes */}
                <Grid item xs={12} lg={8}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Active Processes
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Instance ID</TableCell>
                                        <TableCell>Process</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Started</TableCell>
                                        <TableCell>Duration</TableCell>
                                        <TableCell>Current Activity</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {processes.map((process) => {
                                        const currentActivity = process.activities.find(a => a.status === 'active');
                                        return (
                                            <TableRow key={process.instance_id}>
                                                <TableCell>{process.instance_id}</TableCell>
                                                <TableCell>{process.definition_key}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={process.status}
                                                        color={
                                                            process.status === 'active' ? 'primary' :
                                                                process.status === 'completed' ? 'success' :
                                                                    process.status === 'failed' ? 'error' : 'default'
                                                        }
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>{new Date(process.start_time).toLocaleTimeString()}</TableCell>
                                                <TableCell>
                                                    {process.duration
                                                        ? `${process.duration}s`
                                                        : `${Math.floor((Date.now() - new Date(process.start_time).getTime()) / 1000)}s`
                                                    }
                                                </TableCell>
                                                <TableCell>{currentActivity?.name || 'N/A'}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* Service Details */}
                <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Service Health Checks
                        </Typography>
                        <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                            {services.map((service) => (
                                <Accordion key={service.name} sx={{ mb: 1 }}>
                                    <AccordionSummary expandIcon={<ExpandMore />}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                            {getStatusIcon(service.status)}
                                            <Typography sx={{ ml: 1 }}>{service.name}</Typography>
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Box>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Health Checks:
                                            </Typography>
                                            {service.health_checks.map((check, index) => (
                                                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography variant="body2">{check.endpoint}</Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Chip
                                                            label={check.status}
                                                            color={check.status === 'pass' ? 'success' : 'error'}
                                                            size="small"
                                                            sx={{ mr: 1 }}
                                                        />
                                                        <Typography variant="caption">{check.response_time}ms</Typography>
                                                    </Box>
                                                </Box>
                                            ))}

                                            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                                Resource Usage:
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2">CPU:</Typography>
                                                    <Typography variant="body2">{service.metrics.cpu_usage}%</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2">Memory:</Typography>
                                                    <Typography variant="body2">{service.metrics.memory_usage}MB</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2">Response Time:</Typography>
                                                    <Typography variant="body2">{service.metrics.response_time}ms</Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
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

export default TechStackMonitor;
