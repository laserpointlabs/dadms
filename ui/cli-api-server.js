/**
 * DADM CLI API Server
 * 
 * This server provides a REST API interface to the DADM (Decision Analysis Decision Management) system.
 * It handles process management, analysis data retrieval, and system management functions.
 * 
 * Configuration:
 * The server uses environment variables for configuration to make it portable across different systems:
 * 
 * - DADM_ROOT: Root directory of the DADM installation (default: parent directory of this script)
 * - UI_ROOT: Root directory of the UI (default: directory containing this script)
 * - DADM_VENV_PATH: Path to Python virtual environment (default: DADM_ROOT/.venv)
 * - DADM_LOGS_DIR: Directory for log files (default: DADM_ROOT/logs)
 * - DADM_DATA_DIR: Directory containing analysis database (default: DADM_ROOT/data/analysis_storage)
 * 
 * Example usage with custom paths:
 * DADM_ROOT=/opt/dadm DADM_DATA_DIR=/var/dadm/data node cli-api-server.js
 */

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const WebSocket = require('ws');
const axios = require('axios');
const { Client } = require('pg');
const { Server } = require('socket.io');
const http = require('http');
const https = require('https');

// Configuration - Use environment variables with fallbacks
// This makes the server portable and not tied to specific user directories
const CONFIG = {
    // Determine DADM root directory - assume UI is in a subdirectory of DADM
    DADM_ROOT: process.env.DADM_ROOT || path.resolve(__dirname, '..'),
    UI_ROOT: process.env.UI_ROOT || __dirname,
    VENV_PATH: process.env.DADM_VENV_PATH || path.resolve(__dirname, '..', '.venv'),
    LOGS_DIR: process.env.DADM_LOGS_DIR || path.resolve(__dirname, '..', 'logs'),
    DATA_DIR: process.env.DADM_DATA_DIR || path.resolve(__dirname, '..', 'data', 'analysis_storage')
};

// Optional: Verify critical paths exist (log warnings, don't fail)
try {
    if (!require('fs').existsSync(CONFIG.DADM_ROOT)) {
        console.warn(`⚠️  DADM root directory not found: ${CONFIG.DADM_ROOT}`);
    }
    if (!require('fs').existsSync(CONFIG.DATA_DIR)) {
        console.warn(`⚠️  Data directory not found: ${CONFIG.DATA_DIR}`);
    }

    console.log(`📁 DADM Configuration:
   DADM Root: ${CONFIG.DADM_ROOT}
   UI Root: ${CONFIG.UI_ROOT}
   Virtual Env: ${CONFIG.VENV_PATH}
   Logs: ${CONFIG.LOGS_DIR}
   Data: ${CONFIG.DATA_DIR}`);
} catch (err) {
    console.warn('⚠️  Error checking configuration paths:', err.message);
}

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

        const result = await executeCommand('dadm', ['--list'], CONFIG.DADM_ROOT);
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

// Get all process definition versions grouped by key
app.get('/api/process/definitions/all-versions', async (req, res) => {
    try {
        console.log('Fetching all process definition versions...');

        const response = await fetch('http://localhost:8080/engine-rest/process-definition');
        if (!response.ok) {
            throw new Error(`Camunda API error: ${response.status}`);
        }

        const definitions = await response.json();

        // Group by key and keep all versions
        const groupedDefinitions = {};
        definitions.forEach(def => {
            if (!groupedDefinitions[def.key]) {
                groupedDefinitions[def.key] = [];
            }
            groupedDefinitions[def.key].push(def);
        });

        // Sort versions in descending order (highest version first)
        Object.keys(groupedDefinitions).forEach(key => {
            groupedDefinitions[key].sort((a, b) => b.version - a.version);
        });

        res.json({
            success: true,
            data: groupedDefinitions,
            total: Object.keys(groupedDefinitions).length
        });

    } catch (error) {
        console.error('Failed to fetch all process definition versions:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Process management endpoints

// Get all process instances (active and history)
app.get('/api/process/instances', async (req, res) => {
    try {
        console.log('Fetching all process instances...');

        // Get active process instances
        const activeResponse = await fetch('http://localhost:8080/engine-rest/process-instance');
        let activeInstances = [];
        if (activeResponse.ok) {
            activeInstances = await activeResponse.json();
        }

        // Get process instance history
        const historyResponse = await fetch('http://localhost:8080/engine-rest/history/process-instance');
        let historyInstances = [];
        if (historyResponse.ok) {
            historyInstances = await historyResponse.json();
        }

        // Enrich active instances with additional data
        const enrichedActiveInstances = [];
        for (const instance of activeInstances) {
            try {
                // Get process definition details
                const defResponse = await fetch(`http://localhost:8080/engine-rest/process-definition/${instance.definitionId}`);
                let processDefinition = {};
                if (defResponse.ok) {
                    processDefinition = await defResponse.json();
                }

                // Try to get start time from history (it might be there even for active processes)
                const historyDetailResponse = await fetch(`http://localhost:8080/engine-rest/history/process-instance?processInstanceId=${instance.id}`);
                let historyDetail = {};
                if (historyDetailResponse.ok) {
                    const historyDetails = await historyDetailResponse.json();
                    if (historyDetails.length > 0) {
                        historyDetail = historyDetails[0];
                    }
                }

                enrichedActiveInstances.push({
                    ...instance,
                    processDefinitionKey: processDefinition.key || instance.definitionId?.split(':')[0] || 'Unknown',
                    processDefinitionName: processDefinition.name || processDefinition.key || 'Unknown Process',
                    processDefinitionVersion: processDefinition.version || 1,
                    startTime: historyDetail.startTime || new Date().toISOString(),
                    status: 'active',
                    isActive: true
                });
            } catch (err) {
                console.log(`Error enriching active instance ${instance.id}:`, err.message);
                // Fallback with minimal data
                enrichedActiveInstances.push({
                    ...instance,
                    processDefinitionKey: instance.definitionId?.split(':')[0] || 'Unknown',
                    processDefinitionName: 'Unknown Process',
                    processDefinitionVersion: 1,
                    startTime: new Date().toISOString(),
                    status: 'active',
                    isActive: true
                });
            }
        }

        // Combine and enrich data
        const allInstances = [
            ...enrichedActiveInstances,
            ...historyInstances
                .filter(hist => !activeInstances.find(active => active.id === hist.id))
                .map(instance => ({
                    ...instance,
                    status: instance.state || 'completed',
                    isActive: false
                }))
        ];

        // Sort by start time (newest first)
        allInstances.sort((a, b) => {
            const aTime = new Date(a.startTime || 0);
            const bTime = new Date(b.startTime || 0);
            return bTime - aTime;
        });

        res.json({
            success: true,
            data: allInstances,
            counts: {
                active: enrichedActiveInstances.length,
                total: allInstances.length,
                completed: historyInstances.length
            }
        });

    } catch (error) {
        console.error('Failed to fetch process instances:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get process definition list
app.get('/api/process/definitions/list', async (req, res) => {
    try {
        console.log('Fetching process definitions list...');

        const response = await fetch('http://localhost:8080/engine-rest/process-definition');
        if (!response.ok) {
            throw new Error(`Camunda API error: ${response.status}`);
        }

        const definitions = await response.json();

        // Group by key and get latest version of each
        const latestDefinitions = {};
        definitions.forEach(def => {
            if (!latestDefinitions[def.key] || def.version > latestDefinitions[def.key].version) {
                latestDefinitions[def.key] = def;
            }
        });

        res.json({
            success: true,
            data: Object.values(latestDefinitions),
            total: Object.keys(latestDefinitions).length
        });

    } catch (error) {
        console.error('Failed to fetch process definitions:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Kill/delete a process instance
app.delete('/api/process/instances/:instanceId', async (req, res) => {
    try {
        const { instanceId } = req.params;
        const { reason = 'Deleted via DADM UI' } = req.body;

        console.log(`Attempting to delete process instance: ${instanceId}`);

        // First try to delete an active process instance
        const deleteResponse = await fetch(`http://localhost:8080/engine-rest/process-instance/${instanceId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reason: reason,
                skipCustomListeners: false,
                skipIoMappings: false
            })
        });

        if (deleteResponse.ok) {
            res.json({
                success: true,
                message: `Process instance ${instanceId} terminated successfully`,
                instanceId: instanceId
            });
        } else if (deleteResponse.status === 404) {
            // If not found as active instance, try to delete from history
            console.log(`Process instance ${instanceId} not active, attempting to delete from history...`);

            const historyDeleteResponse = await fetch(`http://localhost:8080/engine-rest/history/process-instance/${instanceId}`, {
                method: 'DELETE'
            });

            if (historyDeleteResponse.ok) {
                res.json({
                    success: true,
                    message: `Historical process instance ${instanceId} deleted successfully`,
                    instanceId: instanceId
                });
            } else if (historyDeleteResponse.status === 404) {
                res.status(404).json({
                    success: false,
                    error: `Process instance ${instanceId} not found in active or historical data`
                });
            } else {
                const historyErrorData = await historyDeleteResponse.text();
                res.status(historyDeleteResponse.status).json({
                    success: false,
                    error: `Failed to delete historical process instance: ${historyErrorData}`
                });
            }
        } else {
            const errorData = await deleteResponse.text();
            res.status(deleteResponse.status).json({
                success: false,
                error: `Failed to delete process instance: ${errorData}`
            });
        }

    } catch (error) {
        console.error('Failed to delete process instance:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start a new process instance - will start external task worker in background
app.post('/api/process/instances/start', async (req, res) => {
    try {
        const { processDefinitionKey, processDefinitionId, variables = {} } = req.body;

        if (!processDefinitionKey && !processDefinitionId) {
            return res.status(400).json({
                success: false,
                error: 'Either processDefinitionKey or processDefinitionId is required'
            });
        }

        console.log(`Starting process instance: ${processDefinitionId || processDefinitionKey}`);

        let processDef;
        let startEndpoint;

        if (processDefinitionId) {
            // Use specific process definition ID
            const processDefResponse = await fetch(`http://localhost:8080/engine-rest/process-definition/${processDefinitionId}`);
            if (!processDefResponse.ok) {
                throw new Error(`Process definition not found: ${processDefinitionId}`);
            }
            processDef = await processDefResponse.json();
            startEndpoint = `http://localhost:8080/engine-rest/process-definition/${processDefinitionId}/start`;
        } else {
            // Use process definition key (latest version)
            const processDefResponse = await fetch(`http://localhost:8080/engine-rest/process-definition/key/${processDefinitionKey}`);
            if (!processDefResponse.ok) {
                throw new Error(`Process definition not found: ${processDefinitionKey}`);
            }
            processDef = await processDefResponse.json();
            startEndpoint = `http://localhost:8080/engine-rest/process-definition/key/${processDefinitionKey}/start`;
        }

        const processName = processDef.name || processDef.key;

        // Prepare variables in Camunda format
        const camundaVariables = {};
        if (Object.keys(variables).length > 0) {
            Object.entries(variables).forEach(([key, value]) => {
                camundaVariables[key] = { value: value };
            });
        }

        // Start the process instance via Camunda REST API
        const startResponse = await fetch(startEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                variables: camundaVariables
            })
        });

        if (!startResponse.ok) {
            const errorData = await startResponse.text();
            throw new Error(`Failed to start process instance: ${errorData}`);
        }

        const processInstance = await startResponse.json();
        const processInstanceId = processInstance.id;

        console.log(`✅ Started process instance: ${processInstanceId} (${processName} v${processDef.version})`);
        console.log(`📋 Variables:`, variables);

        // Start external task worker in background for this process
        startBackgroundWorker(processInstanceId, processDef.key);

        console.log(`🔄 Background external task worker started for process instance`);

        res.json({
            success: true,
            data: {
                processDefinitionKey: processDefinitionKey || processDef.key,
                processName,
                processInstanceId,
                variables,
                status: 'started',
                analysisInfo: 'Process started with background external task worker'
            },
            message: `Process ${processName} started successfully`,
            executionSummary: 'Process instance created and background external task worker started'
        });

    } catch (error) {
        console.error('Failed to start process:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get process instance details
app.get('/api/process/instances/:instanceId', async (req, res) => {
    try {
        const { instanceId } = req.params;

        // Try active instances first
        let response = await fetch(`http://localhost:8080/engine-rest/process-instance/${instanceId}`);
        let processInstance = null;
        let isActive = true;

        if (response.ok) {
            processInstance = await response.json();
        } else {
            // Check history
            response = await fetch(`http://localhost:8080/engine-rest/history/process-instance/${instanceId}`);
            if (response.ok) {
                processInstance = await response.json();
                isActive = false;
            }
        }

        if (!processInstance) {
            return res.status(404).json({
                success: false,
                error: `Process instance ${instanceId} not found`
            });
        }

        res.json({
            success: true,
            data: {
                ...processInstance,
                isActive
            }
        });

    } catch (error) {
        console.error('Failed to fetch process instance details:', error);
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

        const result = await executeCommand('dadm', args, CONFIG.DADM_ROOT);

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

// Direct PostgreSQL analysis endpoint
app.get('/api/analysis/direct', async (req, res) => {
    const client = new Client({
        host: 'localhost',  // Docker container is exposed on localhost
        port: 5432,
        database: 'dadm_db',
        user: 'dadm_user',
        password: 'dadm_password'
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL for direct analysis query');

        const { limit = 50, offset = 0, status, service, thread_id, process_id } = req.query;

        // Build the query
        let query = `
            SELECT 
                am.analysis_id,
                am.thread_id,
                am.session_id,
                am.process_instance_id,
                am.task_name,
                am.source_service,
                am.status,
                am.created_at,
                am.updated_at,
                am.tags,
                ad.input_data,
                ad.output_data
            FROM analysis_metadata am
            LEFT JOIN analysis_data ad ON am.analysis_id = ad.analysis_id
            WHERE 1=1
        `;

        const params = [];
        let paramIndex = 1;

        // Add filters
        if (status) {
            query += ` AND am.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (service) {
            query += ` AND am.source_service = $${paramIndex}`;
            params.push(service);
            paramIndex++;
        }

        if (thread_id) {
            query += ` AND am.thread_id = $${paramIndex}`;
            params.push(thread_id);
            paramIndex++;
        }

        if (process_id) {
            query += ` AND am.process_instance_id = $${paramIndex}`;
            params.push(process_id);
            paramIndex++;
        }

        // Add ordering and pagination
        query += ` ORDER BY am.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await client.query(query, params);

        await client.end();

        res.json({
            success: true,
            data: result.rows,
            total: result.rowCount,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('PostgreSQL direct query error:', error);
        if (client) {
            try {
                await client.end();
            } catch (closeError) {
                console.error('Error closing PostgreSQL client:', closeError);
            }
        }
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get unique OpenAI thread combinations for Thread Context Viewer
app.get('/api/analysis/threads', async (req, res) => {
    try {
        console.log('Fetching unique OpenAI thread combinations...');

        // Get analysis data first
        const result = await executeCommand('dadm', ['analysis', 'list', '--detailed'], CONFIG.DADM_ROOT);
        const analyses = await parseAnalysisListOutput(result.output);

        // Enrich with process definitions like we do for analysis list
        const enrichedAnalyses = await enrichAnalysisWithProcessDefinitions(analyses);

        // Extract unique combinations of openai_assistant and openai_thread
        const threadCombinations = new Map();

        enrichedAnalyses.forEach(analysis => {
            if (analysis.openai_thread && analysis.openai_assistant) {
                const key = `${analysis.openai_assistant}_${analysis.openai_thread}`;
                if (!threadCombinations.has(key)) {
                    threadCombinations.set(key, {
                        openai_thread: analysis.openai_thread,
                        openai_assistant: analysis.openai_assistant,
                        analysis_ids: [analysis.analysis_id],
                        created_at: analysis.created_at,
                        status: analysis.status,
                        process_definition: analysis.process_definition || null
                    });
                } else {
                    // Add to existing combination
                    const existing = threadCombinations.get(key);
                    existing.analysis_ids.push(analysis.analysis_id);
                    // Update to most recent creation date
                    if (new Date(analysis.created_at) > new Date(existing.created_at)) {
                        existing.created_at = analysis.created_at;
                        existing.status = analysis.status;
                    }
                }
            }
        });

        // Convert to array and add metadata
        const uniqueThreads = Array.from(threadCombinations.values()).map(thread => ({
            id: thread.openai_thread,
            openai_thread: thread.openai_thread,
            openai_assistant: thread.openai_assistant,
            name: thread.process_definition?.name || 'Unknown Process',
            status: thread.status === 'completed' ? 'completed' : 'active',
            created_at: thread.created_at,
            last_activity: thread.created_at,
            analysis_count: thread.analysis_ids.length,
            analysis_ids: thread.analysis_ids,
            process_definition: thread.process_definition
        }));

        // Sort by creation date (most recent first)
        uniqueThreads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        res.json({
            success: true,
            data: uniqueThreads,
            total: uniqueThreads.length
        });

    } catch (error) {
        console.error('Failed to fetch thread combinations:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get OpenAI thread context from OpenAI API
app.get('/api/analysis/threads/:threadId/context', async (req, res) => {
    try {
        const { threadId } = req.params;
        console.log(`Fetching OpenAI thread context for: ${threadId}`);

        // Check if OpenAI API key is available
        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({
                success: false,
                error: 'OpenAI API key not configured'
            });
        }

        // Fetch thread messages from OpenAI
        const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
            }
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const threadData = await response.json();

        // Also get thread metadata
        const threadMetaResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}`, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
            }
        });

        let threadMetadata = {};
        if (threadMetaResponse.ok) {
            threadMetadata = await threadMetaResponse.json();
        }

        // Format the response
        const formattedData = {
            thread_id: threadId,
            created_at: threadMetadata.created_at ? new Date(threadMetadata.created_at * 1000).toISOString() : null,
            metadata: threadMetadata.metadata || {},
            messages: threadData.data || [],
            message_count: threadData.data ? threadData.data.length : 0,
            status: 'active'
        };

        res.json({
            success: true,
            data: formattedData
        });

    } catch (error) {
        console.error('Failed to fetch OpenAI thread context:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Send message to OpenAI thread and get assistant response
app.post('/api/openai/chat', async (req, res) => {
    try {
        const { message, threadId, assistantId } = req.body;

        if (!message || !threadId || !assistantId) {
            return res.status(400).json({
                success: false,
                error: 'Message, threadId, and assistantId are required'
            });
        }

        console.log(`Sending message to OpenAI thread ${threadId} with assistant ${assistantId}`);

        // Check if OpenAI API key is available
        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({
                success: false,
                error: 'OpenAI API key not configured'
            });
        }

        // Add message to thread
        const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({
                role: 'user',
                content: message
            })
        });

        if (!messageResponse.ok) {
            throw new Error(`Failed to add message: ${messageResponse.status} ${messageResponse.statusText}`);
        }

        const messageData = await messageResponse.json();

        // Create a run with the assistant
        const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({
                assistant_id: assistantId
            })
        });

        if (!runResponse.ok) {
            throw new Error(`Failed to create run: ${runResponse.status} ${runResponse.statusText}`);
        }

        const runData = await runResponse.json();

        // Poll for run completion
        let run = runData;
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds max

        while (run.status === 'queued' || run.status === 'in_progress') {
            if (attempts >= maxAttempts) {
                throw new Error('Run timeout - assistant took too long to respond');
            }

            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

            const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                    'OpenAI-Beta': 'assistants=v2'
                }
            });

            if (!statusResponse.ok) {
                throw new Error(`Failed to check run status: ${statusResponse.status} ${statusResponse.statusText}`);
            }

            run = await statusResponse.json();
            attempts++;
        }

        if (run.status !== 'completed') {
            throw new Error(`Run failed with status: ${run.status}`);
        }

        // Get the latest messages to find the assistant's response
        const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages?limit=10`, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
            }
        });

        if (!messagesResponse.ok) {
            throw new Error(`Failed to get messages: ${messagesResponse.status} ${messagesResponse.statusText}`);
        }

        const messagesData = await messagesResponse.json();

        // Find the most recent assistant message
        const assistantMessage = messagesData.data.find(msg => msg.role === 'assistant' && msg.run_id === run.id);

        if (!assistantMessage) {
            throw new Error('No assistant response found');
        }

        // Extract text content from the assistant message
        let responseText = '';
        if (assistantMessage.content && assistantMessage.content.length > 0) {
            for (const content of assistantMessage.content) {
                if (content.type === 'text' && content.text) {
                    responseText += content.text.value;
                }
            }
        }

        res.json({
            success: true,
            data: {
                userMessage: {
                    id: messageData.id,
                    content: message,
                    timestamp: new Date(messageData.created_at * 1000).toISOString()
                },
                assistantMessage: {
                    id: assistantMessage.id,
                    content: responseText,
                    timestamp: new Date(assistantMessage.created_at * 1000).toISOString()
                },
                runId: run.id
            }
        });

    } catch (error) {
        console.error('Failed to send message to OpenAI:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// OpenAI standalone chat endpoint (creates a new thread with default assistant)
app.post('/api/openai/chat/standalone', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        console.log(`Sending standalone message to OpenAI`);

        // Check if OpenAI API key is available
        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({
                success: false,
                error: 'OpenAI API key not configured'
            });
        }

        // Get the default assistant ID from environment or from existing threads
        let assistantId = process.env.OPENAI_ASSISTANT_ID;

        if (!assistantId) {
            console.log('OPENAI_ASSISTANT_ID not set, trying to get assistant ID from existing threads...');

            try {
                // Get assistant ID from the first available thread
                const result = await executeCommand('dadm', ['analysis', 'list', '--detailed'], CONFIG.DADM_ROOT);
                const analyses = await parseAnalysisListOutput(result.output);
                const analysisWithAssistant = analyses.find(a => a.openai_assistant);

                if (analysisWithAssistant) {
                    assistantId = analysisWithAssistant.openai_assistant;
                    console.log(`Using assistant ID from existing thread: ${assistantId}`);
                }
            } catch (error) {
                console.error('Failed to get assistant ID from threads:', error);
            }
        }

        if (!assistantId) {
            return res.status(500).json({
                success: false,
                error: 'No assistant ID available. Please set OPENAI_ASSISTANT_ID environment variable or create an analysis with an OpenAI assistant first.'
            });
        }

        // Create a new thread for this standalone conversation
        const threadResponse = await fetch('https://api.openai.com/v1/threads', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({})
        });

        if (!threadResponse.ok) {
            throw new Error(`Failed to create thread: ${threadResponse.status} ${threadResponse.statusText}`);
        }

        const threadData = await threadResponse.json();
        const threadId = threadData.id;

        console.log(`Created new thread ${threadId} for standalone chat`);

        // Add message to thread
        const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({
                role: 'user',
                content: message
            })
        });

        if (!messageResponse.ok) {
            throw new Error(`Failed to add message: ${messageResponse.status} ${messageResponse.statusText}`);
        }

        const messageData = await messageResponse.json();

        // Create run with the assistant
        const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({
                assistant_id: assistantId
            })
        });

        if (!runResponse.ok) {
            throw new Error(`Failed to create run: ${runResponse.status} ${runResponse.statusText}`);
        }

        const runData = await runResponse.json();

        // Poll for run completion
        let run = runData;
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds max

        while (run.status === 'queued' || run.status === 'in_progress') {
            if (attempts >= maxAttempts) {
                throw new Error('Run timeout - assistant took too long to respond');
            }

            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

            const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                    'OpenAI-Beta': 'assistants=v2'
                }
            });

            if (!statusResponse.ok) {
                throw new Error(`Failed to check run status: ${statusResponse.status} ${statusResponse.statusText}`);
            }

            run = await statusResponse.json();
            attempts++;
        }

        if (run.status !== 'completed') {
            throw new Error(`Run failed with status: ${run.status}`);
        }

        // Get the latest messages to find the assistant's response
        const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages?limit=10`, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
            }
        });

        if (!messagesResponse.ok) {
            throw new Error(`Failed to get messages: ${messagesResponse.status} ${messagesResponse.statusText}`);
        }

        const messagesData = await messagesResponse.json();

        // Find the most recent assistant message
        const assistantMessage = messagesData.data.find(msg => msg.role === 'assistant' && msg.run_id === run.id);

        if (!assistantMessage) {
            throw new Error('No assistant response found');
        }

        // Extract text content from the assistant message
        let responseText = '';
        if (assistantMessage.content && assistantMessage.content.length > 0) {
            for (const content of assistantMessage.content) {
                if (content.type === 'text' && content.text) {
                    responseText += content.text.value;
                }
            }
        }

        res.json({
            success: true,
            data: {
                userMessage: {
                    id: messageData.id,
                    content: message,
                    timestamp: new Date(messageData.created_at * 1000).toISOString()
                },
                assistantMessage: {
                    id: assistantMessage.id,
                    content: responseText,
                    timestamp: new Date(assistantMessage.created_at * 1000).toISOString()
                },
                threadId: threadId,
                assistantId: assistantId,
                runId: run.id
            }
        });

    } catch (error) {
        console.error('Failed to send standalone message to OpenAI:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get analysis by ID (moved here to avoid conflicts with thread routes)
app.get('/api/analysis/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Fetching analysis details for ID: ${id}`);

        // Use DADM CLI to get specific analysis data
        const result = await executeCommand('dadm', ['analysis', 'list', '--detailed'], CONFIG.DADM_ROOT);

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
        const dbPath = path.join(CONFIG.DATA_DIR, 'analysis_data.db');

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
                command = `cd ${CONFIG.UI_ROOT} && pm2 start ecosystem.config.js`;
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
                const startCommand = `cd ${CONFIG.DADM_ROOT} && nohup ${CONFIG.VENV_PATH}/bin/python scripts/analysis_processing_daemon.py > ${CONFIG.LOGS_DIR}/daemon-start.log 2>&1 & echo $!`;
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
                const restartCommand = `cd ${CONFIG.DADM_ROOT} && nohup ${CONFIG.VENV_PATH}/bin/python scripts/analysis_processing_daemon.py > ${CONFIG.LOGS_DIR}/daemon-restart.log 2>&1 & echo $!`;
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

// Get process definition documentation
app.get('/api/process/definitions/:id/documentation', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Fetching documentation for process definition: ${id}`);

        // Get the BPMN XML from Camunda
        const response = await fetch(`http://localhost:8080/engine-rest/process-definition/${id}/xml`);
        if (!response.ok) {
            throw new Error(`Camunda API error: ${response.status}`);
        }

        const xmlData = await response.json();
        const bpmnXml = xmlData.bpmn20Xml;

        // Parse the XML to extract documentation
        const documentationExtractor = (xml) => {
            const processMatch = xml.match(/<bpmn:process[^>]*name="([^"]*)"[^>]*>/);
            const processName = processMatch ? processMatch[1] : 'Unknown Process';

            // Extract only process-level documentation (not from tasks)
            // Look for <bpmn:documentation> that comes directly after <bpmn:process> opening tag
            // but before any other BPMN elements like <bpmn:startEvent>, <bpmn:serviceTask>, etc.
            const processDocPattern = /<bpmn:process[^>]*>([\s\S]*?)<bpmn:documentation>([\s\S]*?)<\/bpmn:documentation>([\s\S]*?)(?=<bpmn:(?:startEvent|endEvent|serviceTask|userTask|scriptTask|sequenceFlow|parallelGateway|exclusiveGateway))/;
            const processDocMatch = xml.match(processDocPattern);

            let processDocumentation = '';
            if (processDocMatch) {
                // Check that the documentation appears before any BPMN elements (not inside a task)
                const beforeDoc = processDocMatch[1];
                const afterDoc = processDocMatch[3];

                // If there are no BPMN elements between process start and documentation, it's process-level
                if (!beforeDoc.includes('<bpmn:') || beforeDoc.trim() === '') {
                    processDocumentation = processDocMatch[2].trim();
                }
            }

            return {
                processName,
                processDocumentation: processDocumentation || 'No documentation available for this process.'
            };
        };

        const documentation = documentationExtractor(bpmnXml);

        res.json({
            success: true,
            data: {
                processDefinitionId: id,
                ...documentation
            }
        });

    } catch (error) {
        console.error('Failed to fetch process documentation:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get process definition XML (BPMN model)
app.get('/api/process/definitions/:id/xml', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Getting BPMN XML for process definition: ${id}`);

        // Get the BPMN XML from Camunda
        const response = await fetch(`http://localhost:8080/engine-rest/process-definition/${id}/xml`);

        if (!response.ok) {
            return res.status(404).json({
                success: false,
                error: 'Process definition not found or no XML available'
            });
        }

        const xmlData = await response.json();
        const bpmnXml = xmlData.bpmn20Xml;

        // Return the raw BPMN XML
        res.set('Content-Type', 'application/xml');
        res.send(bpmnXml);

    } catch (error) {
        console.error('Failed to fetch process XML:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Delete a process definition
app.delete('/api/process/definitions/:definitionId', async (req, res) => {
    try {
        const { definitionId } = req.params;
        console.log(`Attempting to delete process definition: ${definitionId}`);

        // Get process definition details first
        const defResponse = await fetch(`http://localhost:8080/engine-rest/process-definition/${definitionId}`);
        if (!defResponse.ok) {
            return res.status(404).json({
                success: false,
                error: 'Process definition not found'
            });
        }

        const processDefinition = await defResponse.json();
        const deploymentId = processDefinition.deploymentId;

        if (!deploymentId) {
            return res.status(400).json({
                success: false,
                error: 'Process definition has no deployment ID'
            });
        }

        // Delete the deployment (this removes the process definition)
        const deleteResponse = await fetch(`http://localhost:8080/engine-rest/deployment/${deploymentId}?cascade=true`, {
            method: 'DELETE'
        });

        if (deleteResponse.ok) {
            res.json({
                success: true,
                message: `Process definition ${processDefinition.name || processDefinition.key} deleted successfully`,
                data: { definitionId, deploymentId, name: processDefinition.name, key: processDefinition.key }
            });
        } else {
            const errorData = await deleteResponse.text();
            res.status(deleteResponse.status).json({
                success: false,
                error: `Failed to delete process definition: ${errorData}`
            });
        }

    } catch (error) {
        console.error('Failed to delete process definition:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get comprehensive troubleshooting details for a process instance
app.get('/api/process/instances/:instanceId/troubleshoot', async (req, res) => {
    try {
        const { instanceId } = req.params;
        console.log(`Fetching troubleshooting details for process instance: ${instanceId}`);

        const troubleshootData = {
            processInstance: null,
            activityInstances: [],
            variableHistory: [],
            incidentHistory: [],
            externalTaskLogs: [],
            userTaskHistory: [],
            jobLogs: [],
            isActive: false
        };

        // 1. Get process instance details
        let response = await fetch(`http://localhost:8080/engine-rest/process-instance/${instanceId}`);
        if (response.ok) {
            troubleshootData.processInstance = await response.json();
            troubleshootData.isActive = true;
        } else {
            // Check history for completed instances
            response = await fetch(`http://localhost:8080/engine-rest/history/process-instance/${instanceId}`);
            if (response.ok) {
                troubleshootData.processInstance = await response.json();
                troubleshootData.isActive = false;
            }
        }

        if (!troubleshootData.processInstance) {
            return res.status(404).json({
                success: false,
                error: `Process instance ${instanceId} not found`
            });
        }

        // 2. Get activity instance history (execution path)
        try {
            response = await fetch(`http://localhost:8080/engine-rest/history/activity-instance?processInstanceId=${instanceId}&sortBy=startTime&sortOrder=asc`);
            if (response.ok) {
                troubleshootData.activityInstances = await response.json();
            }
        } catch (error) {
            console.error('Failed to fetch activity instances:', error);
        }

        // 3. Get variable history
        try {
            response = await fetch(`http://localhost:8080/engine-rest/history/variable-instance?processInstanceId=${instanceId}&sortBy=time&sortOrder=asc`);
            if (response.ok) {
                troubleshootData.variableHistory = await response.json();
            }
        } catch (error) {
            console.error('Failed to fetch variable history:', error);
        }

        // 4. Get incident history (errors/problems)
        try {
            response = await fetch(`http://localhost:8080/engine-rest/history/incident?processInstanceId=${instanceId}`);
            if (response.ok) {
                troubleshootData.incidentHistory = await response.json();
            }
        } catch (error) {
            console.error('Failed to fetch incident history:', error);
        }

        // 5. Get external task logs
        try {
            response = await fetch(`http://localhost:8080/engine-rest/history/external-task-log?processInstanceId=${instanceId}&sortBy=timestamp&sortOrder=asc`);
            if (response.ok) {
                troubleshootData.externalTaskLogs = await response.json();
            }
        } catch (error) {
            console.error('Failed to fetch external task logs:', error);
        }

        // 6. Get user task history
        try {
            response = await fetch(`http://localhost:8080/engine-rest/history/task?processInstanceId=${instanceId}&sortBy=startTime&sortOrder=asc`);
            if (response.ok) {
                troubleshootData.userTaskHistory = await response.json();
            }
        } catch (error) {
            console.error('Failed to fetch user task history:', error);
        }

        // 7. Get job logs (for async operations, timers, etc.)
        try {
            response = await fetch(`http://localhost:8080/engine-rest/history/job-log?processInstanceId=${instanceId}&sortBy=timestamp&sortOrder=asc`);
            if (response.ok) {
                troubleshootData.jobLogs = await response.json();
            }
        } catch (error) {
            console.error('Failed to fetch job logs:', error);
        }        // 8. Try to get analysis data from our database
        try {
            const sqlite3 = require('sqlite3').verbose();
            const dbPath = path.join(CONFIG.DATA_DIR, 'analysis_data.db');
            const db = new sqlite3.Database(dbPath);

            const query = `
                SELECT 
                    id, 
                    analysis_type,
                    analysis_data,
                    created_at,
                    metadata
                FROM analysis_data 
                WHERE JSON_EXTRACT(metadata, '$.process_instance_id') = ?
                ORDER BY created_at ASC
            `;

            troubleshootData.analysisData = await new Promise((resolve, reject) => {
                db.all(query, [instanceId], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        const analysisRecords = rows.map(record => ({
                            id: record.id,
                            type: record.analysis_type,
                            data: JSON.parse(record.analysis_data),
                            createdAt: record.created_at,
                            metadata: JSON.parse(record.metadata || '{}')
                        }));
                        resolve(analysisRecords);
                    }
                });
            });

            db.close();
        } catch (error) {
            console.error('Failed to fetch analysis data:', error);
            troubleshootData.analysisData = [];
        }

        res.json({
            success: true,
            data: troubleshootData
        });

    } catch (error) {
        console.error('Failed to fetch troubleshooting data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Function to start a background external task worker for a specific process
async function startBackgroundWorker(processInstanceId, processKey) {
    try {
        console.log(`Starting background worker for process instance: ${processInstanceId}`);

        // Use Python to run the external task worker in background
        const pythonPath = path.join(CONFIG.DADM_ROOT, '.venv', 'bin', 'python');
        const workerScript = path.join(CONFIG.DADM_ROOT, 'src', 'app.py');

        const args = [
            workerScript,
            '--monitor-only',  // Don't start a new process, just monitor
            '--timeout', '120'  // 2 minute timeout
        ];

        // Start the worker in background
        const { spawn } = require('child_process');
        const worker = spawn(pythonPath, args, {
            cwd: CONFIG.DADM_ROOT,
            detached: true,
            stdio: 'ignore'
        });

        // Detach the worker so it runs independently
        worker.unref();

        console.log(`Background worker started with PID: ${worker.pid}`);
        return worker.pid;
    } catch (error) {
        console.error('Failed to start background worker:', error);
        throw error;
    }
}

// Special command execution function for shell commands that need proper quoting
async function executeCommandWithShell(command, args = []) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const { exec } = require('child_process');

        // Build the full command string with proper shell escaping
        const fullCommand = `${command} ${args.join(' ')}`;
        console.log(`Executing shell command: ${fullCommand}`);

        const child = exec(fullCommand, {
            cwd: CONFIG.DADM_ROOT
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
        const dbPath = path.join(CONFIG.DATA_DIR, 'analysis_data.db');

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
async function executeCommand(command, args = [], cwd = null) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const { spawn } = require('child_process');

        const options = {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true
        };

        if (cwd) {
            options.cwd = cwd;
        }

        const child = spawn(command, args, options);

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
        const startCommand = `cd ${CONFIG.DADM_ROOT} && nohup ${CONFIG.VENV_PATH}/bin/python scripts/analysis_processing_daemon.py > logs/daemon-autostart.log 2>&1 & echo $!`;
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
    console.log(`  GET    http://localhost:${PORT}/api/process/definitions/list`);
    console.log(`  GET    http://localhost:${PORT}/api/process/definitions/all-versions`);
    console.log(`  GET    http://localhost:${PORT}/api/process/definitions/:id/documentation`);
    console.log(`  GET    http://localhost:${PORT}/api/process/instances`);
    console.log(`  GET    http://localhost:${PORT}/api/process/instances/:instanceId`);
    console.log(`  POST   http://localhost:${PORT}/api/process/instances/start`);
    console.log(`  DELETE http://localhost:${PORT}/api/process/instances/:instanceId`);
    console.log(`  GET    http://localhost:${PORT}/api/system/status`);
    console.log(`  POST   http://localhost:${PORT}/api/system/backend/:action`);
    console.log(`  POST   http://localhost:${PORT}/api/system/daemon/:action`);
    console.log(`  GET    http://localhost:${PORT}/api/system/docker`);
    console.log(`  GET    http://localhost:${PORT}/api/analysis/threads`);
    console.log(`  GET    http://localhost:${PORT}/api/analysis/threads/:threadId/context`);
    console.log(`  POST   http://localhost:${PORT}/api/openai/chat`);
    console.log(`  POST   http://localhost:${PORT}/api/openai/chat/standalone`);
    console.log(`  GET    http://localhost:${PORT}/api/process/instances`);
    console.log(`  GET    http://localhost:${PORT}/api/process/definitions/list`);
    console.log(`  GET    http://localhost:${PORT}/api/analysis/direct`);
});
