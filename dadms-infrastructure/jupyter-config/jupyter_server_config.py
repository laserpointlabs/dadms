# Jupyter Lab Configuration for DADMS Integration
# This file configures Jupyter Lab to work seamlessly within the DADMS environment

c = get_config()

# Server configuration
c.ServerApp.ip = '0.0.0.0'
c.ServerApp.port = 8888
c.ServerApp.open_browser = False
c.ServerApp.allow_root = True
c.ServerApp.allow_origin = '*'
c.ServerApp.allow_credentials = True

# Security settings
c.ServerApp.token = 'dadms_jupyter_token'
c.ServerApp.password = ''
c.ServerApp.disable_check_xsrf = True

# Lab configuration
c.LabApp.collaborative = True
c.LabApp.expose_app_in_browser = True

# Kernel configuration
c.KernelManager.autorestart = True
c.KernelManager.shutdown_wait_time = 10.0

# Content security policy for iframe embedding - use proper CSP headers
c.ServerApp.trust_xheaders = True
c.ServerApp.allow_remote_access = True

# Enable extensions
c.LabApp.extensions = [
    'jupyterlab_git',
    'jupyterlab_lsp',
    'jupyterlab_code_formatter'
]

# File browser configuration
c.FileContentsManager.allow_hidden = True
c.FileContentsManager.hide_globs = ['__pycache__', '*.pyc', '.ipynb_checkpoints']

# Logging
c.Application.log_level = 'INFO'
c.ServerApp.log_level = 'INFO' 