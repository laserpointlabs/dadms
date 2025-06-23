const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    // Determine if we're running in Docker
    const isDocker = process.env.DOCKER === 'true' ||
        process.env.NODE_ENV === 'development' && process.env.PWD?.includes('/app');

    // Use proper Docker networking - services can communicate by container name
    const target = isDocker
        ? 'http://host.docker.internal:8000'  // Docker host access for main API
        : 'http://localhost:8000';            // Local development

    // BPMN AI service target - use container name for Docker networking
    const bpmnAiTarget = isDocker
        ? 'http://dadm-bpmn-ai-service:5010'  // Docker container name
        : 'http://localhost:5011';            // Local development (mapped port)

    console.log('Setting up proxy with target:', target, '(Docker mode:', isDocker, ')');
    console.log('Setting up BPMN AI proxy with target:', bpmnAiTarget);

    // Proxy BPMN AI requests to the dedicated BPMN AI service (port 5010)
    app.use(
        '/api/bpmn-ai',
        createProxyMiddleware({
            target: bpmnAiTarget,
            changeOrigin: true,
            timeout: 120000,        // 2 minutes timeout
            proxyTimeout: 120000,   // 2 minutes proxy timeout
            logLevel: 'debug',
            onError: (err, req, res) => {
                console.error('BPMN AI Proxy error:', err);
                console.error('BPMN AI Target was:', bpmnAiTarget);
                res.status(500).send('BPMN AI service unavailable');
            }
        })
    );

    // Proxy all other API calls to port 8000
    app.use(
        '/api',
        createProxyMiddleware({
            target: target,
            changeOrigin: true,
            timeout: 30000, // 30 second timeout
            proxyTimeout: 30000,
            logLevel: 'debug', // Add logging for debugging
            onError: (err, req, res) => {
                console.error('Proxy error:', err);
                console.error('Target was:', target);
                res.status(500).send('Proxy error');
            }
        })
    );
};
