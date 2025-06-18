const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
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
        const analyses = parseAnalysisListOutput(result.output);

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
        const analyses = parseAnalysisListOutput(result.output);
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

// Helper function to parse DADM analysis list output into structured data
function parseAnalysisListOutput(output) {
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
    console.log(`  GET  http://localhost:${PORT}/api/health`);
    console.log(`  POST http://localhost:${PORT}/api/cli/execute`);
    console.log(`  GET  http://localhost:${PORT}/api/cli/commands`);
    console.log(`  GET  http://localhost:${PORT}/api/analysis/list`);
    console.log(`  GET  http://localhost:${PORT}/api/analysis/:id`);
});
