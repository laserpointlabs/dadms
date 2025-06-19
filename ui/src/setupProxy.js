const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    // Only proxy API calls, not webpack hot module replacement files
    app.use(
        '/api',
        createProxyMiddleware({
            target: 'http://localhost:8000',
            changeOrigin: true,
        })
    );
};
