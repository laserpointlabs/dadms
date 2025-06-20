const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    // Determine if we're running in Docker
    const isDocker = process.env.DOCKER === 'true' ||
        process.env.NODE_ENV === 'development' && process.env.PWD?.includes('/app');

    // Use host.docker.internal for Docker containers, localhost for local development
    const target = isDocker
        ? 'http://host.docker.internal:8000'  // Docker host access
        : 'http://localhost:8000';            // Local development

    // BPMN AI service target (dedicated BPMN AI service on port 5010)
    const bpmnAiTarget = isDocker
        ? 'http://host.docker.internal:5010'  // Docker host access
        : 'http://localhost:5010';            // Local development

    console.log('Setting up proxy with target:', target, '(Docker mode:', isDocker, ')');
    console.log('Setting up BPMN AI proxy with target:', bpmnAiTarget);

    // Proxy BPMN AI requests to the dedicated BPMN AI service (port 5010)
    app.use(
        '/api/bpmn-ai',
        createProxyMiddleware({
            target: bpmnAiTarget,
            changeOrigin: true,
            timeout: 30000,
            proxyTimeout: 30000,
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
