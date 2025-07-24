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
c.KernelManager.kernel_spec_manager_class = 'jupyter_client.kernelspec.KernelSpecManager'

# Kernel startup configuration
c.KernelManager.default_kernel_name = 'python3'
c.KernelManager.kernel_cmd = ['python', '-m', 'ipykernel_launcher', '-f', '{connection_file}']

# Memory and resource limits
c.KernelManager.max_kernels = 10
c.KernelManager.kernel_timeout = 60

# API and remote access configuration
c.ServerApp.trust_xheaders = True
c.ServerApp.allow_remote_access = True

# CORS configuration for API access
c.ServerApp.allow_origin = '*'
c.ServerApp.allow_credentials = True

# Identity provider configuration (for token auth)
c.IdentityProvider.token = 'dadms_jupyter_token'

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