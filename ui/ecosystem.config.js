module.exports = {
    apps: [
        {
            name: 'dadm-backend',
            script: 'cli-api-server.js',
            cwd: '/home/jdehart/dadm/ui',
            instances: 1,
            exec_mode: 'fork',
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 8000
            },
            env_development: {
                NODE_ENV: 'development',
                PORT: 8000
            },
            error_file: '/home/jdehart/dadm/logs/dadm-backend-error.log',
            out_file: '/home/jdehart/dadm/logs/dadm-backend-out.log',
            log_file: '/home/jdehart/dadm/logs/dadm-backend-combined.log',
            time: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
        },
        {
            name: 'dadm-analysis-daemon',
            script: '/home/jdehart/dadm/.venv/bin/python',
            args: ['scripts/analysis_processing_daemon.py'],
            cwd: '/home/jdehart/dadm',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '2G',
            env: {
                PYTHONPATH: '/home/jdehart/dadm/src:/home/jdehart/dadm',
                DADM_ENV: 'production'
            },
            env_development: {
                PYTHONPATH: '/home/jdehart/dadm/src:/home/jdehart/dadm',
                DADM_ENV: 'development'
            },
            error_file: '/home/jdehart/dadm/logs/dadm-analysis-daemon-error.log',
            out_file: '/home/jdehart/dadm/logs/dadm-analysis-daemon-out.log',
            log_file: '/home/jdehart/dadm/logs/dadm-analysis-daemon-combined.log',
            time: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
        }
    ]
};
