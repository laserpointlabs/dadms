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
        console.error('Command execution error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            command: `${req.body.command} ${(req.body.args || []).join(' ')}`
        });
    }
});

// Get available commands
app.get('/api/cli/commands', (req, res) => {
    res.json([
        {
            command: 'dadm',
            args: ['--help'],
            description: 'Show DADM help information',
            category: 'system'
        },
        {
            command: 'dadm',
            args: ['status'],
            description: 'Check DADM system status',
            category: 'monitor'
        },
        {
            command: 'dadm',
            args: ['analysis', 'list'],
            description: 'List all analyses',
            category: 'analysis'
        },
        {
            command: 'dadm',
            args: ['process', 'list'],
            description: 'List all processes',
            category: 'process'
        }
    ]);
});

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
        const process = spawn(command, args, {
            cwd: '/home/jdehart/dadm', // Set working directory to DADM root
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: false,
            env: { ...process.env, PATH: process.env.PATH }
        });

        process.stdout.on('data', (data) => {
            const lines = data.toString().split('\n').filter(line => line.trim());
            output.push(...lines);
            console.log('STDOUT:', data.toString());
        });

        process.stderr.on('data', (data) => {
            const lines = data.toString().split('\n').filter(line => line.trim());
            stderr.push(...lines);
            console.log('STDERR:', data.toString());
        });

        process.on('close', (code) => {
            const executionTime = Date.now() - startTime;
            console.log(`Command finished with exit code: ${code}`);

            resolve({
                output: output.length > 0 ? output : ['Command completed successfully'],
                stderr,
                exitCode: code,
                executionTime
            });
        });

        process.on('error', (error) => {
            console.error(`Command execution failed: ${error.message}`);
            reject(error);
        });

        // Set a timeout to prevent hanging commands
        setTimeout(() => {
            process.kill('SIGTERM');
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

        const process = spawn(command, args, {
            cwd: '/home/jdehart/dadm',
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: false,
            env: { ...process.env, PATH: process.env.PATH }
        });

        process.stdout.on('data', (data) => {
            const lines = data.toString().split('\n').filter(line => line.trim());
            output.push(...lines);

            // Send real-time output to client
            socket.emit('command_output', {
                executionId,
                output: lines
            });
        });

        process.stderr.on('data', (data) => {
            const lines = data.toString().split('\n').filter(line => line.trim());
            stderr.push(...lines);

            // Send real-time stderr to client
            socket.emit('command_output', {
                executionId,
                output: lines,
                isError: true
            });
        });

        process.on('close', (code) => {
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

        process.on('error', (error) => {
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
            process.kill('SIGTERM');
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
});
