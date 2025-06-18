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

        res.json({
            success: true,
            data: analyses,
            total: analyses.length,
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
        const analysis = analyses.find(a => a.analysis_id === id);

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
            const { stdout } = await execAsync('pgrep -f "dadm.*analysis.*daemon" | wc -l');
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

        let command;
        switch (action) {
            case 'start':
                command = 'cd /home/jdehart/dadm && /home/jdehart/dadm/.venv/bin/python -m src.core.analysis_daemon start';
                break;
            case 'stop':
                command = 'cd /home/jdehart/dadm && /home/jdehart/dadm/.venv/bin/python -m src.core.analysis_daemon stop';
                break;
            case 'restart':
                command = 'cd /home/jdehart/dadm && /home/jdehart/dadm/.venv/bin/python -m src.core.analysis_daemon restart';
                break;
            case 'status':
                command = 'cd /home/jdehart/dadm && /home/jdehart/dadm/.venv/bin/python -m src.core.analysis_daemon status';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: `Invalid action: ${action}. Valid actions: start, stop, restart, status`
                });
        }

        console.log(`Executing daemon command: ${command}`);
        const { stdout, stderr } = await execAsync(command);

        res.json({
            success: true,
            action,
            message: `Analysis daemon ${action} command executed successfully`,
            output: stdout,
            error: stderr || null
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

// Helper function to parse DADM process definitions output
function parseProcessDefinitions(output) {
    const definitions = [];
    let parsingDefinitions = false;

    for (const line of output) {
        if (line.includes('PROCESS DEFINITIONS ON CAMUNDA SERVER')) {
            parsingDefinitions = true;
            continue;
        }

        if (parsingDefinitions && line.includes('---')) {
            continue; // Skip header separator
        }

        if (parsingDefinitions && line.trim() && !line.includes('Found') && !line.includes('Name') && !line.includes('Key')) {
            // Parse process definition line
            // Format: Name    Key    Version   ID
            const parts = line.trim().split(/\s{2,}/); // Split on multiple spaces
            if (parts.length >= 4) {
                definitions.push({
                    name: parts[0]?.trim() || '',
                    key: parts[1]?.trim() || '',
                    version: parts[2]?.trim() || '',
                    id: parts[3]?.trim() || ''
                });
            }
        }
    }

    return definitions;
}

// Helper function to infer process name from task names
function inferProcessName(taskNames) {
    const taskSet = new Set(taskNames.map(name => name.toLowerCase()));

    // Check for OpenAI Decision Process tasks
    const openaiDecisionTasks = [
        'finalizdecisionframetask',
        'developinfluencediagramtask',
        'developdecisionhierarchytask',
        'categorizeissuestask',
        'enhanceissuestask',
        'raiseissuestask',
        'developvisiontask',
        'setdecisioncontexttask',
        'identifystakeholderstask'
    ];

    if (openaiDecisionTasks.some(task =>
        Array.from(taskSet).some(userTask => userTask.includes(task.slice(0, -4)))
    )) {
        return 'OpenAI Decision Process';
    }

    // Check for other known process patterns
    if (Array.from(taskSet).some(task => task.includes('echo'))) {
        return 'Echo Test Process';
    }

    if (Array.from(taskSet).some(task => task.includes('adder'))) {
        return 'Simple Adder Process';
    }

    if (Array.from(taskSet).some(task => task.includes('invoice'))) {
        return 'Invoice Receipt';
    }

    // Default fallback
    return 'Unknown Process';
}

// Helper function to get process definition name from Camunda
async function getProcessDefinitionName(processInstanceId) {
    return new Promise((resolve) => {
        try {
            const url = `http://localhost:8080/engine-rest/history/process-instance?processInstanceId=${processInstanceId}`;

            http.get(url, (response) => {
                let data = '';

                response.on('data', (chunk) => {
                    data += chunk;
                });

                response.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        if (jsonData && jsonData.length > 0) {
                            resolve({
                                name: jsonData[0].processDefinitionName || 'Unknown Process',
                                key: jsonData[0].processDefinitionKey || '',
                                version: jsonData[0].processDefinitionVersion || 1
                            });
                        } else {
                            resolve(null);
                        }
                    } catch (parseError) {
                        console.warn(`Error parsing process definition response for ${processInstanceId}:`, parseError.message);
                        resolve(null);
                    }
                });
            }).on('error', (error) => {
                console.warn(`Error fetching process definition for ${processInstanceId}:`, error.message);
                resolve(null);
            });

        } catch (error) {
            console.warn(`Error setting up request for process definition ${processInstanceId}:`, error.message);
            resolve(null);
        }
    });
}

// Helper function to parse DADM analysis list output into structured data
async function parseAnalysisListOutput(output) {
    const analyses = [];
    let currentAnalysis = null;

    for (const line of output) {
        if (line.startsWith('[') && line.includes('] Analysis ID:')) {
            // Start of new analysis entry
            if (currentAnalysis) {
                analyses.push(currentAnalysis);
            }

            const match = line.match(/\[(\d+)\] Analysis ID: (.+)/);
            if (match) {
                currentAnalysis = {
                    analysis_id: match[2],
                    metadata: {
                        analysis_id: match[2],
                        task_name: '',
                        service: '',
                        created_at: '',
                        status: '',
                        thread_id: '',
                        process_id: '',
                        tags: [],
                        openai_thread: '',
                        openai_assistant: ''
                    }
                };
            }
        } else if (currentAnalysis && line.trim()) {
            // Parse analysis details
            if (line.includes('Task:')) {
                currentAnalysis.metadata.task_name = line.split('Task:')[1]?.trim() || '';
            } else if (line.includes('Service:')) {
                currentAnalysis.metadata.service = line.split('Service:')[1]?.trim() || '';
            } else if (line.includes('Created:')) {
                currentAnalysis.metadata.created_at = line.split('Created:')[1]?.trim() || '';
            } else if (line.includes('Status:')) {
                currentAnalysis.metadata.status = line.split('Status:')[1]?.trim() || '';
            } else if (line.includes('Thread ID:')) {
                currentAnalysis.metadata.thread_id = line.split('Thread ID:')[1]?.trim() || '';
            } else if (line.includes('Process ID:')) {
                currentAnalysis.metadata.process_id = line.split('Process ID:')[1]?.trim() || '';
            } else if (line.includes('Tags:')) {
                const tagsStr = line.split('Tags:')[1]?.trim() || '';
                currentAnalysis.metadata.tags = tagsStr.split(',').map(tag => tag.trim()).filter(tag => tag);
            } else if (line.includes('OpenAI Thread:')) {
                currentAnalysis.metadata.openai_thread = line.split('OpenAI Thread:')[1]?.trim() || '';
            } else if (line.includes('OpenAI Assistant:')) {
                currentAnalysis.metadata.openai_assistant = line.split('OpenAI Assistant:')[1]?.trim() || '';
            }
        }
    }

    // Don't forget the last analysis
    if (currentAnalysis) {
        analyses.push(currentAnalysis);
    }

    // Get real process definition names from Camunda for each unique process ID
    const uniqueProcessIds = [...new Set(analyses.map(a => a.metadata.process_id).filter(id => id))];
    const processDefinitions = {};

    for (const processId of uniqueProcessIds) {
        const definition = await getProcessDefinitionName(processId);
        if (definition) {
            processDefinitions[processId] = definition;
        }
    }

    // Add real process names to each analysis
    analyses.forEach(analysis => {
        const processId = analysis.metadata.process_id;
        const definition = processDefinitions[processId];
        if (definition) {
            analysis.metadata.process_name = `${definition.name} (v${definition.version})`;
            analysis.metadata.process_definition_key = definition.key;
            analysis.metadata.process_definition_version = definition.version;
        } else {
            analysis.metadata.process_name = 'Unknown Process';
        }
    });

    return analyses;
}

// Command execution function
function executeCommand(command, args = []) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const output = [];
        const stderr = [];

        // Build the full command
        const fullCommand = `${command} ${args.join(' ')}`;
        console.log(`Executing command: ${fullCommand}`);

        // Execute the actual command using child_process
        const childProcess = spawn(command, args, {
            cwd: '/home/jdehart/dadm', // Set working directory to DADM root
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: false,
            env: { ...process.env, PATH: process.env.PATH }
        });

        childProcess.stdout.on('data', (data) => {
            const lines = data.toString().split('\n').filter(line => line.trim());
            output.push(...lines);
            console.log('STDOUT:', data.toString());
        });

        childProcess.stderr.on('data', (data) => {
            const lines = data.toString().split('\n').filter(line => line.trim());
            stderr.push(...lines);
            console.log('STDERR:', data.toString());
        });

        childProcess.on('close', (code) => {
            const executionTime = Date.now() - startTime;
            console.log(`Command finished with exit code: ${code}`);

            resolve({
                output: output.length > 0 ? output : ['Command completed successfully'],
                stderr,
                exitCode: code,
                executionTime
            });
        });

        childProcess.on('error', (error) => {
            console.error(`Command execution failed: ${error.message}`);
            reject(error);
        });

        // Set a timeout to prevent hanging commands
        setTimeout(() => {
            childProcess.kill('SIGTERM');
            reject(new Error('Command execution timeout'));
        }, 30000); // 30 second timeout
    });
}

// WebSocket command execution with streaming
function executeCommandWithStreaming(command, args = [], executionId, socket) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const output = [];
        const stderr = [];

        console.log(`Streaming command: ${command} ${args.join(' ')}`);

        const childProcess = spawn(command, args, {
            cwd: '/home/jdehart/dadm',
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: false,
            env: { ...process.env, PATH: process.env.PATH }
        });

        childProcess.stdout.on('data', (data) => {
            const lines = data.toString().split('\n').filter(line => line.trim());
            output.push(...lines);

            // Send real-time output to client
            socket.emit('command_output', {
                executionId,
                output: lines
            });
        });

        childProcess.stderr.on('data', (data) => {
            const lines = data.toString().split('\n').filter(line => line.trim());
            stderr.push(...lines);

            // Send real-time stderr to client
            socket.emit('command_output', {
                executionId,
                output: lines,
                isError: true
            });
        });

        childProcess.on('close', (code) => {
            const executionTime = Date.now() - startTime;

            // Send completion notification
            socket.emit('command_completed', {
                executionId,
                success: code === 0,
                exitCode: code,
                executionTime
            });

            resolve({
                output,
                stderr,
                exitCode: code,
                executionTime
            });
        });

        childProcess.on('error', (error) => {
            console.error(`Streaming command failed: ${error.message}`);

            socket.emit('command_completed', {
                executionId,
                success: false,
                error: error.message
            });

            reject(error);
        });

        // Timeout handling
        setTimeout(() => {
            childProcess.kill('SIGTERM');
            reject(new Error('Command execution timeout'));
        }, 30000);
    });
}

// WebSocket handling
io.on('connection', (socket) => {
    console.log('Client connected to WebSocket');

    socket.on('execute_command_with_id', async (data) => {
        const { executionId, command, args = [] } = data;

        try {
            await executeCommandWithStreaming(command, args, executionId, socket);
        } catch (error) {
            console.error('WebSocket command execution failed:', error);
            socket.emit('command_completed', {
                executionId,
                success: false,
                error: error.message
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected from WebSocket');
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 DADM CLI API Server running on port ${PORT}`);
    console.log(`🔌 WebSocket server running on port ${PORT}`);
    console.log(`📡 Accepting connections from http://localhost:3000`);
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
