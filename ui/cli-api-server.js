const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const https = require('https');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server: 'DADM CLI API'
    });
});

// Execute CLI command endpoint
app.post('/api/cli/execute', async (req, res) => {
    try {
        const { command, args = [] } = req.body;

        if (!command) {
            return res.status(400).json({ error: 'Command is required' });
        }

        console.log(`Executing command: ${command} ${args.join(' ')}`);

        const result = await executeCommand(command, args);

        res.json({
            success: true,
            command: `${command} ${args.join(' ')}`,
            output: result.output,
            stderr: result.stderr,
            exitCode: result.exitCode,
            executionTime: result.executionTime
        });

    } catch (error) {
        console.error('Command execution failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// CLI commands endpoint
app.get('/api/cli/commands', (req, res) => {
    res.json([
        {
            name: 'list-processes',
            description: 'List all processes',
            category: 'process'
        }
    ]);
});

// Process definitions endpoint
app.get('/api/process/definitions', async (req, res) => {
    try {
        console.log('Fetching process definitions via DADM CLI...');

        const result = await executeCommand('dadm', ['--list']);
        const processDefinitions = parseProcessDefinitions(result.output);

        res.json({
            success: true,
            data: processDefinitions,
            raw_output: result.output
        });

    } catch (error) {
        console.error('Failed to fetch process definitions:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Analysis API endpoints
app.get('/api/analysis/list', async (req, res) => {
    try {
        console.log('Fetching analysis data via DADM CLI...');

        // Use DADM CLI to get real analysis data
        const { limit = 10, detailed = false } = req.query;
        const args = ['analysis', 'list'];

        if (limit) args.push('--limit', limit.toString());
        if (detailed === 'true') args.push('--detailed');

        const result = await executeCommand('dadm', args);

        // Parse the output to extract structured data
        const analyses = await parseAnalysisListOutput(result.output);

        // Enrich with process definition details from Camunda
        const enrichedAnalyses = await enrichAnalysisWithProcessDefinitions(analyses);

        res.json({
            success: true,
            data: enrichedAnalyses,
            total: enrichedAnalyses.length,
            raw_output: result.output
        });

    } catch (error) {
        console.error('Failed to fetch analysis data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/analysis/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Fetching analysis details for ID: ${id}`);

        // Use DADM CLI to get specific analysis data
        const result = await executeCommand('dadm', ['analysis', 'list', '--detailed']);

        // Parse and find the specific analysis
        const analyses = await parseAnalysisListOutput(result.output);
        const enrichedAnalyses = await enrichAnalysisWithProcessDefinitions(analyses);
        const analysis = enrichedAnalyses.find(a => a.analysis_id === id);

        if (!analysis) {
            return res.status(404).json({
                success: false,
                error: 'Analysis not found'
            });
        }

        res.json({
            success: true,
            data: analysis
        });

    } catch (error) {
        console.error('Failed to fetch analysis details:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Delete analyses by process instance ID
app.delete('/api/analysis/process/:processInstanceId', async (req, res) => {
    try {
        const { processInstanceId } = req.params;
        console.log(`Deleting all analyses for process instance: ${processInstanceId}`);

        // Use SQLite to delete analyses for this process instance
        const sqlite3 = require('sqlite3').verbose();
        const dbPath = '/home/jdehart/dadm/data/analysis_storage/analysis_data.db';

        // First, get the analysis IDs to delete
        const getAnalysisIds = () => {
            return new Promise((resolve, reject) => {
                const db = new sqlite3.Database(dbPath);
                db.all(
                    "SELECT analysis_id FROM analysis_metadata WHERE process_instance_id = ?",
                    [processInstanceId],
                    (err, rows) => {
                        db.close();
                        if (err) {
                            reject(err);
                        } else {
                            resolve(rows.map(row => row.analysis_id));
                        }
                    }
                );
            });
        };

        // Delete from all tables
        const deleteAnalyses = (analysisIds) => {
            return new Promise((resolve, reject) => {
                if (analysisIds.length === 0) {
                    resolve({ deletedCount: 0 });
                    return;
                }

                const db = new sqlite3.Database(dbPath);
                const placeholders = analysisIds.map(() => '?').join(',');

                db.serialize(() => {
                    // Delete from processing_tasks first (foreign key constraint)
                    db.run(`DELETE FROM processing_tasks WHERE analysis_id IN (${placeholders})`, analysisIds);

                    // Delete from analysis_data
                    db.run(`DELETE FROM analysis_data WHERE analysis_id IN (${placeholders})`, analysisIds);

                    // Delete from analysis_metadata
                    db.run(
                        `DELETE FROM analysis_metadata WHERE analysis_id IN (${placeholders})`,
                        analysisIds,
                        function (err) {
                            db.close();
                            if (err) {
                                reject(err);
                            } else {
                                resolve({ deletedCount: this.changes });
                            }
                        }
                    );
                });
            });
        };

        const analysisIds = await getAnalysisIds();
        const result = await deleteAnalyses(analysisIds);

        res.json({
            success: true,
            message: `Deleted ${result.deletedCount} analyses for process instance ${processInstanceId}`,
            processInstanceId,
            deletedAnalysisIds: analysisIds
        });

    } catch (error) {
        console.error('Failed to delete analyses:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// System Management Endpoints

// Get system status
app.get('/api/system/status', async (req, res) => {
    try {
        const { exec } = require('child_process');
        const util = require('util');
        const execAsync = util.promisify(exec);

        // Get PM2 status
        let pm2Status = [];
        try {
            const { stdout } = await execAsync('pm2 jlist');
            pm2Status = JSON.parse(stdout);
        } catch (error) {
            console.log('PM2 not available or no processes running');
        }

        // Get Docker status
        let dockerStatus = [];
        try {
            const { stdout } = await execAsync('docker ps --format "{{.Names}}\t{{.Status}}\t{{.Image}}\t{{.Ports}}"');
            dockerStatus = stdout.trim().split('\n').filter(line => line).map(line => {
                const [name, status, image, ports] = line.split('\t');
                return { name, status, image, ports };
            });
        } catch (error) {
            console.log('Docker not available or no containers running');
        }

        // Get analysis daemon status
        let analysisDaemonStatus = 'stopped';
        try {
            const { stdout } = await execAsync('pgrep -f "analysis_processing_daemon.py" | wc -l');
            analysisDaemonStatus = parseInt(stdout.trim()) > 0 ? 'running' : 'stopped';
        } catch (error) {
            analysisDaemonStatus = 'unknown';
        }

        // Get system resource usage
        let systemResources = {};
        try {
            const [memInfo, cpuInfo] = await Promise.all([
                execAsync('free -m | grep "Mem:"'),
                execAsync('top -bn1 | grep "load average"')
            ]);

            const memLine = memInfo.stdout.trim().split(/\s+/);
            systemResources = {
                memory: {
                    total: parseInt(memLine[1]),
                    used: parseInt(memLine[2]),
                    free: parseInt(memLine[3]),
                    available: parseInt(memLine[6])
                },
                loadAverage: cpuInfo.stdout.match(/load average: ([\d.]+)/)?.[1] || 'unknown'
            };
        } catch (error) {
            console.log('Could not get system resources');
        }

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            services: {
                backend: {
                    name: 'DADM Backend API',
                    status: 'running',
                    port: PORT,
                    uptime: process.uptime(),
                    pm2: pm2Status.find(p => p.name === 'dadm-backend') || null
                },
                analysisDaemon: {
                    name: 'Analysis Daemon',
                    status: analysisDaemonStatus
                }
            },
            docker: dockerStatus,
            system: systemResources
        });
    } catch (error) {
        console.error('Failed to get system status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Control PM2 backend service
app.post('/api/system/backend/:action', async (req, res) => {
    try {
        const { action } = req.params;
        const { exec } = require('child_process');
        const util = require('util');
        const execAsync = util.promisify(exec);

        let command;
        switch (action) {
            case 'start':
                command = 'cd /home/jdehart/dadm/ui && pm2 start ecosystem.config.js';
                break;
            case 'stop':
                command = 'pm2 stop dadm-backend';
                break;
            case 'restart':
                command = 'pm2 restart dadm-backend';
                break;
            case 'reload':
                command = 'pm2 reload dadm-backend';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: `Invalid action: ${action}. Valid actions: start, stop, restart, reload`
                });
        }

        console.log(`Executing PM2 command: ${command}`);
        const { stdout, stderr } = await execAsync(command);

        res.json({
            success: true,
            action,
            message: `Backend ${action} command executed successfully`,
            output: stdout,
            error: stderr || null
        });
    } catch (error) {
        console.error(`Failed to ${req.params.action} backend:`, error);
        res.status(500).json({
            success: false,
            error: error.message,
            stderr: error.stderr || null
        });
    }
});

// Control analysis daemon
app.post('/api/system/daemon/:action', async (req, res) => {
    try {
        const { action } = req.params;
        const { exec } = require('child_process');
        const util = require('util');
        const execAsync = util.promisify(exec);

        let result;
        switch (action) {
            case 'start':
                const startCommand = 'cd /home/jdehart/dadm && nohup /home/jdehart/dadm/.venv/bin/python scripts/analysis_processing_daemon.py > /home/jdehart/dadm/logs/daemon-start.log 2>&1 & echo $!';
                result = await execAsync(startCommand);
                break;
            case 'stop':
                // Use a simpler, more direct approach
                try {
                    const killResult = await execAsync('pkill -9 -f "analysis_processing_daemon.py"');
                    // Wait a moment and verify
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    try {
                        const checkResult = await execAsync('pgrep -f "analysis_processing_daemon.py"');
                        if (checkResult.stdout.trim()) {
                            result = { stdout: 'Daemon stop attempted but process may still be running', stderr: '' };
                        } else {
                            result = { stdout: 'Daemon stopped successfully', stderr: '' };
                        }
                    } catch (e) {
                        result = { stdout: 'Daemon stopped successfully', stderr: '' };
                    }
                } catch (killError) {
                    // Try to check if process was already stopped
                    try {
                        await execAsync('pgrep -f "analysis_processing_daemon.py"');
                        result = { stdout: 'Failed to stop daemon process', stderr: killError.message };
                    } catch (e) {
                        result = { stdout: 'No daemon process found to stop', stderr: '' };
                    }
                }
                break;
            case 'restart':
                // Stop first, then start
                try {
                    await execAsync('pkill -f "analysis_processing_daemon.py"');
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                } catch (e) {
                    // Process might not be running, that's ok
                }
                const restartCommand = 'cd /home/jdehart/dadm && nohup /home/jdehart/dadm/.venv/bin/python scripts/analysis_processing_daemon.py > /home/jdehart/dadm/logs/daemon-restart.log 2>&1 & echo $!';
                result = await execAsync(restartCommand);
                break;
            case 'status':
                try {
                    const statusResult = await execAsync('pgrep -f "analysis_processing_daemon.py"');
                    result = { stdout: statusResult.stdout.trim() ? 'running' : 'stopped', stderr: '' };
                } catch (e) {
                    result = { stdout: 'stopped', stderr: '' };
                }
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: `Invalid action: ${action}. Valid actions: start, stop, restart, status`
                });
        }

        console.log(`Daemon ${action} completed successfully`);
        res.json({
            success: true,
            action,
            message: `Analysis daemon ${action} command executed successfully`,
            output: result.stdout || '',
            error: result.stderr || null
        });
    } catch (error) {
        console.error(`Failed to ${req.params.action} analysis daemon:`, error);
        res.status(500).json({
            success: false,
            error: error.message,
            stderr: error.stderr || null
        });
    }
});

// Get Docker container status
app.get('/api/system/docker', async (req, res) => {
    try {
        const { exec } = require('child_process');
        const util = require('util');
        const execAsync = util.promisify(exec);

        const { stdout } = await execAsync('docker ps --format "json" | jq -s "."');
        const containers = JSON.parse(stdout);

        res.json({
            success: true,
            containers: containers.map(container => ({
                id: container.ID,
                name: container.Names,
                image: container.Image,
                status: container.Status,
                ports: container.Ports,
                created: container.CreatedAt
            }))
        });
    } catch (error) {
        console.error('Failed to get Docker status:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            containers: []
        });
    }
});

// Helper function to parse analysis list output from DADM CLI
async function parseAnalysisListOutput(output) {
    try {
        // First try to see if it's already JSON
        if (output.trim().startsWith('[') || output.trim().startsWith('{')) {
            return JSON.parse(output);
        }

        // Parse the detailed text output
        const lines = output.split('\n').filter(line => line.trim());
        const analyses = [];
        let currentAnalysis = null;

        for (const line of lines) {
            const trimmedLine = line.trim();

            // Match analysis entries like "[1] Analysis ID: ca11ab83-8aed-4787-8375-d53e59545c7b"
            const analysisMatch = trimmedLine.match(/^\[(\d+)\]\s*Analysis ID:\s*([a-f0-9-]{36})/);
            if (analysisMatch) {
                // Save previous analysis if exists
                if (currentAnalysis) {
                    analyses.push(currentAnalysis);
                }

                // Start new analysis
                currentAnalysis = {
                    analysis_id: analysisMatch[2],
                    order: parseInt(analysisMatch[1]),
                    task: '',
                    service: '',
                    created_at: '',
                    status: 'unknown',
                    thread_id: '',
                    process_id: '',
                    tags: [],
                    openai_thread: '',
                    openai_assistant: ''
                };
            }
            // Parse subsequent fields
            else if (currentAnalysis && trimmedLine.includes(':')) {
                const parts = trimmedLine.split(':');
                const key = parts[0].trim();
                const value = parts.slice(1).join(':').trim();

                switch (key) {
                    case 'Task':
                        currentAnalysis.task = value;
                        break;
                    case 'Service':
                        currentAnalysis.service = value;
                        break;
                    case 'Created':
                        currentAnalysis.created_at = value;
                        break;
                    case 'Status':
                        currentAnalysis.status = value;
                        break;
                    case 'Thread ID':
                        currentAnalysis.thread_id = value;
                        break;
                    case 'Process ID':
                        currentAnalysis.process_id = value;
                        break;
                    case 'Tags':
                        currentAnalysis.tags = value.split(',').map(tag => tag.trim());
                        break;
                    case 'OpenAI Thread':
                        currentAnalysis.openai_thread = value;
                        break;
                    case 'OpenAI Assistant':
                        currentAnalysis.openai_assistant = value;
                        break;
                }
            }
        }

        // Add the last analysis
        if (currentAnalysis) {
            analyses.push(currentAnalysis);
        }

        // If no structured data found, try to get from database directly
        if (analyses.length === 0) {
            return await getAnalysisFromDatabase();
        }

        return analyses;
    } catch (error) {
        console.error('Error parsing analysis output:', error);
        // Fallback to database query
        return await getAnalysisFromDatabase();
    }
}

// Helper function to get analysis data from SQLite database
async function getAnalysisFromDatabase() {
    return new Promise((resolve, reject) => {
        const sqlite3 = require('sqlite3').verbose();
        const path = require('path');
        const dbPath = path.join('/home/jdehart/dadm/data/analysis_storage', 'analysis_data.db');

        // Check if database exists
        const fs = require('fs');
        if (!fs.existsSync(dbPath)) {
            console.log('Analysis database not found, returning empty results');
            resolve([]);
            return;
        }

        const db = new sqlite3.Database(dbPath);

        db.all(`
            SELECT 
                am.analysis_id,
                am.process_instance_id,
                am.status,
                am.created_at,
                am.completed_at,
                ad.data_type,
                ad.data_content
            FROM analysis_metadata am
            LEFT JOIN analysis_data ad ON am.analysis_id = ad.analysis_id
            ORDER BY am.created_at DESC
            LIMIT 50
        `, [], (err, rows) => {
            db.close();

            if (err) {
                console.error('Database query error:', err);
                resolve([]);
                return;
            }

            // Group by analysis_id and structure the data
            const analysisMap = new Map();

            rows.forEach(row => {
                if (!analysisMap.has(row.analysis_id)) {
                    analysisMap.set(row.analysis_id, {
                        analysis_id: row.analysis_id,
                        process_instance_id: row.process_instance_id,
                        status: row.status,
                        created_at: row.created_at,
                        completed_at: row.completed_at,
                        data: []
                    });
                }

                if (row.data_type && row.data_content) {
                    analysisMap.get(row.analysis_id).data.push({
                        type: row.data_type,
                        content: row.data_content
                    });
                }
            });

            resolve(Array.from(analysisMap.values()));
        });
    });
}

// Helper function to parse process definitions from DADM CLI output
function parseProcessDefinitions(output) {
    // This is a placeholder implementation
    // You might need to adjust this based on the actual output format of 'dadm --list'
    try {
        const lines = output.split('\n').filter(line => line.trim());
        return lines.map(line => ({
            id: line.trim(),
            name: line.trim(),
            category: 'process'
        }));
    } catch (error) {
        console.error('Failed to parse process definitions:', error);
        return [];
    }
}

// Helper function to execute shell commands
async function executeCommand(command, args = []) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const { spawn } = require('child_process');

        const child = spawn(command, args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('close', (code) => {
            const executionTime = Date.now() - startTime;
            resolve({
                output: stdout,
                stderr: stderr,
                exitCode: code,
                executionTime: executionTime
            });
        });

        child.on('error', (error) => {
            reject(error);
        });
    });
}

// Auto-start analysis daemon on server startup
async function autoStartDaemon() {
    try {
        console.log('🔍 Checking analysis daemon status...');

        // Check if daemon is already running
        const checkCommand = "pgrep -f 'analysis_processing_daemon.py'";
        const checkResult = await executeCommand('bash', ['-c', checkCommand]);

        if (checkResult.exitCode === 0) {
            console.log('✅ Analysis daemon is already running');
            return;
        }

        console.log('🚀 Starting analysis daemon...');

        // Start the daemon using the same method as the API
        const startCommand = `cd /home/jdehart/dadm && nohup /home/jdehart/dadm/.venv/bin/python scripts/analysis_processing_daemon.py > logs/daemon-autostart.log 2>&1 & echo $!`;
        const startResult = await executeCommand('bash', ['-c', startCommand]);

        if (startResult.exitCode === 0 && startResult.output.trim()) {
            const pid = startResult.output.trim();
            console.log(`✅ Analysis daemon started successfully with PID: ${pid}`);
        } else {
            console.log(`⚠️  Failed to start analysis daemon. Exit code: ${startResult.exitCode}`);
            if (startResult.stderr) {
                console.log(`   Error: ${startResult.stderr}`);
            }
        }

    } catch (error) {
        console.log(`⚠️  Error checking/starting daemon: ${error.message}`);
    }
}

// Helper function to get process definition details from Camunda
async function getProcessDefinitionFromCamunda(processInstanceId) {
    try {
        // First, try to get the active process instance
        let instanceResponse = await fetch(`http://localhost:8080/engine-rest/process-instance/${processInstanceId}`);
        let processInstance = null;

        if (instanceResponse.ok) {
            processInstance = await instanceResponse.json();
        } else {
            // If not found, check the history
            const historyResponse = await fetch(`http://localhost:8080/engine-rest/history/process-instance?processInstanceId=${processInstanceId}`);
            if (historyResponse.ok) {
                const historyInstances = await historyResponse.json();
                if (historyInstances && historyInstances.length > 0) {
                    const historyInstance = historyInstances[0];
                    // For history instances, we already have the process definition details
                    return {
                        name: historyInstance.processDefinitionName || historyInstance.processDefinitionKey || 'Unknown Process',
                        version: historyInstance.processDefinitionVersion || 1,
                        key: historyInstance.processDefinitionKey || processInstanceId,
                        deploymentId: null
                    };
                }
            }
        }

        // If we have an active instance, get the process definition
        if (processInstance) {
            const processDefinitionId = processInstance.definitionId;
            const defResponse = await fetch(`http://localhost:8080/engine-rest/process-definition/${processDefinitionId}`);
            if (defResponse.ok) {
                const processDefinition = await defResponse.json();
                return {
                    name: processDefinition.name || processDefinition.key || 'Unknown Process',
                    version: processDefinition.version || 1,
                    key: processDefinition.key || processInstanceId,
                    deploymentId: processDefinition.deploymentId
                };
            }
        }
    } catch (error) {
        console.log(`Could not fetch process definition for instance ${processInstanceId}:`, error.message);
    }

    // Fallback
    return {
        name: 'Unknown Process',
        version: 1,
        key: processInstanceId,
        deploymentId: null
    };
}

// Helper function to enrich analysis data with process definition details
async function enrichAnalysisWithProcessDefinitions(analyses) {
    const enrichedAnalyses = [];

    for (const analysis of analyses) {
        if (analysis.process_id) {
            const processDefinition = await getProcessDefinitionFromCamunda(analysis.process_id);
            enrichedAnalyses.push({
                ...analysis,
                process_definition: processDefinition
            });
        } else {
            enrichedAnalyses.push({
                ...analysis,
                process_definition: {
                    name: 'Unknown Process',
                    version: 1,
                    key: analysis.process_id || 'unknown',
                    deploymentId: null
                }
            });
        }
    }

    return enrichedAnalyses;
}

// Start server
server.listen(PORT, async () => {
    console.log(`🚀 DADM CLI API Server running on port ${PORT}`);
    console.log(`🔌 WebSocket server running on port ${PORT}`);
    console.log(`📡 Accepting connections from http://localhost:3000`);
    console.log('');

    // Auto-start the analysis daemon
    await autoStartDaemon();

    console.log('');
    console.log('Available endpoints:');
    console.log(`  GET    http://localhost:${PORT}/api/health`);
    console.log(`  POST   http://localhost:${PORT}/api/cli/execute`);
    console.log(`  GET    http://localhost:${PORT}/api/cli/commands`);
    console.log(`  GET    http://localhost:${PORT}/api/analysis/list`);
    console.log(`  GET    http://localhost:${PORT}/api/analysis/:id`);
    console.log(`  DELETE http://localhost:${PORT}/api/analysis/process/:processInstanceId`);
    console.log(`  GET    http://localhost:${PORT}/api/process/definitions`);
    console.log(`  GET    http://localhost:${PORT}/api/system/status`);
    console.log(`  POST   http://localhost:${PORT}/api/system/backend/:action`);
    console.log(`  POST   http://localhost:${PORT}/api/system/daemon/:action`);
    console.log(`  GET    http://localhost:${PORT}/api/system/docker`);
});
