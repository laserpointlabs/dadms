const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    // Determine if we're running in Docker
    const isDocker = process.env.DOCKER === 'true' ||
        process.env.NODE_ENV === 'development' && process.env.PWD?.includes('/app');

    // Use host.docker.internal for Docker containers, localhost for local development
    const target = isDocker
        ? 'http://host.docker.internal:8000'  // Docker host access
        : 'http://localhost:8000';            // Local development

    console.log('Setting up proxy with target:', target, '(Docker mode:', isDocker, ')');

    // Only proxy API calls, not webpack hot module replacement files
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
