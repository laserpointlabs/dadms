# Jupyter Lab Integration

## Overview

Jupyter Lab has been integrated into DADMS as a development and prototyping tool, providing an interactive environment for data analysis, model development, and computational experimentation.

## Features

- **Interactive Notebooks**: Create and run Jupyter notebooks for data analysis
- **Multi-language Support**: Python, R, and Julia kernels available
- **Real-time Collaboration**: Multiple users can work on the same notebook
- **DADMS Integration**: Access to DADMS data sources and APIs
- **Fullscreen Mode**: Toggle between embedded and fullscreen views
- **Smart Fallback**: Automatic detection of iframe blocking with new tab fallback
- **Auto-refresh**: Automatic connection status monitoring

## Architecture

### Frontend Integration
- **Location**: `/jupyter-lab` route in the DADMS UI
- **Implementation**: React component with smart iframe fallback
- **CSP Handling**: Automatic detection of iframe blocking with graceful fallback
- **Status Monitoring**: Real-time connection status checking
- **Responsive Design**: Adapts to different screen sizes

### Backend Services
- **Container**: Docker-based Jupyter Lab deployment
- **Port**: 8888 (configurable via environment variables)
- **Authentication**: Token-based authentication
- **Persistence**: Volume-mounted storage for notebooks

## Configuration

### Environment Variables
```bash
# Jupyter Lab URL (default: http://localhost:8888)
NEXT_PUBLIC_JUPYTER_LAB_URL=http://localhost:8888

# Jupyter Lab Token (default: dadms_jupyter_token)
JUPYTER_TOKEN=dadms_jupyter_token
```

### Docker Configuration
The Jupyter Lab service is defined in `dadms-infrastructure/docker-compose.yml`:

```yaml
jupyter-lab:
  image: jupyter/datascience-notebook:latest
  container_name: jupyter-lab
  environment:
    - JUPYTER_ENABLE_LAB=yes
    - JUPYTER_TOKEN=dadms_jupyter_token
    - JUPYTER_ALLOW_REMOTE_ACCESS=yes
  ports:
    - "8888:8888"
  volumes:
    - jupyter-data:/home/jovyan/work
    - ./jupyter-config:/home/jovyan/.jupyter
  command: jupyter lab --ip=0.0.0.0 --port=8888 --no-browser --allow-root --NotebookApp.token=dadms_jupyter_token
```

## Usage

### Starting Jupyter Lab
1. **Docker Compose** (Recommended):
   ```bash
   cd dadms-infrastructure
   docker-compose up jupyter-lab
   ```

2. **Manual Installation**:
   ```bash
   pip install jupyterlab
   jupyter lab --ip=0.0.0.0 --port=8888 --no-browser
   ```

### Accessing Jupyter Lab
1. Navigate to the DADMS UI
2. Click on the "Development Tools" group in the activity bar
3. Select "Jupyter Lab"
4. The interface will load in an embedded iframe

### Features Available
- **Notebook Creation**: Create new Python, R, or Julia notebooks
- **File Browser**: Navigate and manage project files
- **Terminal Access**: Built-in terminal for command-line operations
- **Extension Support**: Install additional Jupyter Lab extensions
- **Collaboration**: Real-time collaborative editing

## Development Workflow

### Data Analysis
1. Create a new notebook in Jupyter Lab
2. Import DADMS data using the provided APIs
3. Perform analysis and visualization
4. Export results back to DADMS

### Model Development
1. Develop machine learning models in notebooks
2. Test and validate models with DADMS data
3. Export trained models for use in DADMS services
4. Document model performance and parameters

### Prototyping
1. Rapidly prototype new features and algorithms
2. Test integration with DADMS services
3. Iterate on solutions before production deployment
4. Share prototypes with team members

## Security Considerations

### Authentication
- Token-based authentication prevents unauthorized access
- Tokens are configurable and should be changed in production
- CORS policies are configured for DADMS domains

### Content Security Policy (CSP) Handling
- Jupyter Lab has strict CSP policies that prevent iframe embedding
- The integration automatically detects when iframe embedding is blocked
- Graceful fallback to new tab opening when iframe fails
- Manual "Open in New Tab" button always available

### Data Access
- Jupyter Lab has access to DADMS data sources
- Implement proper data governance and access controls
- Monitor data usage and access patterns

### Network Security
- Jupyter Lab runs in a containerized environment
- Network access is restricted to necessary ports
- Health checks ensure service availability

## Troubleshooting

### Connection Issues
1. **Check Service Status**: Verify Jupyter Lab is running
   ```bash
   docker-compose ps jupyter-lab
   ```

2. **Check Logs**: Review service logs for errors
   ```bash
   docker-compose logs jupyter-lab
   ```

3. **Verify Port**: Ensure port 8888 is not blocked
   ```bash
   netstat -tulpn | grep 8888
   ```

### Performance Issues
1. **Resource Limits**: Monitor container resource usage
2. **Kernel Management**: Restart kernels if they become unresponsive
3. **Storage**: Check available disk space for notebook storage

### Extension Issues
1. **Installation**: Install required extensions manually if needed
2. **Compatibility**: Ensure extensions are compatible with the Jupyter Lab version
3. **Configuration**: Check extension configuration in the settings

## Future Enhancements

### Planned Features
- **DADMS API Integration**: Direct access to DADMS services from notebooks
- **Template Library**: Pre-built notebook templates for common tasks
- **Version Control**: Git integration for notebook versioning
- **Scheduled Execution**: Automated notebook execution
- **Result Export**: Direct export of results to DADMS services

### Advanced Integration
- **Custom Kernels**: DADMS-specific kernels with built-in APIs
- **Data Connectors**: Direct connections to DADMS data sources
- **Workflow Integration**: Seamless integration with DADMS workflows
- **Collaboration Tools**: Enhanced real-time collaboration features

## API Reference

### DADMS Integration APIs
```python
# Example: Accessing DADMS data from Jupyter Lab
import requests

# Get project data
response = requests.get('http://localhost:3001/api/projects')
projects = response.json()

# Get analysis results
response = requests.get('http://localhost:3012/api/analysis')
analysis = response.json()
```

### Configuration APIs
```python
# Example: Configuring Jupyter Lab for DADMS
from jupyter_server.auth import passwd
import os

# Set authentication token
token = os.environ.get('JUPYTER_TOKEN', 'dadms_jupyter_token')
```

## Contributing

### Development Setup
1. Clone the DADMS repository
2. Install Jupyter Lab development dependencies
3. Configure the development environment
4. Test the integration locally

### Testing
1. Run the integration tests
2. Verify iframe embedding works correctly
3. Test authentication and security features
4. Validate data access and API integration

### Documentation
1. Update this documentation for new features
2. Add code examples and tutorials
3. Document configuration changes
4. Maintain troubleshooting guides 