# BPMN Model Deployment Script

This script allows you to deploy BPMN models from the `camunda_models` folder to a Camunda server.

## Prerequisites

- Python 3.6 or higher
- Required Python packages: `requests`, `colorama`

Install required packages:

```bash
pip install -r requirements.txt
```

## Usage

### Deploy a Single Model

To deploy a specific BPMN model:

```bash
python scripts/deploy_bpmn.py -m model_name.bpmn -s http://localhost:8080
```

You can omit the `.bpmn` extension if you want:

```bash
python scripts/deploy_bpmn.py -m model_name -s http://localhost:8080
```

### Deploy All Models

To deploy all BPMN models in the `camunda_models` folder:

```bash
python scripts/deploy_bpmn.py -a -s http://localhost:8080
```

or

```bash
python scripts/deploy_bpmn.py --all -s http://localhost:8080
```

### Specify a Different Server

By default, the script uses `http://localhost:8080` as the Camunda server URL. You can specify a different server:

```bash
python deploy_bpmn.py -m model_name -s http://your-camunda-server:8080
```

## Output

The script provides detailed output about the deployment process:

- Whether each model was successfully deployed
- The deployment ID
- Information about deployed process definitions
- A summary of successful and failed deployments

## Troubleshooting

If you encounter issues:

1. Make sure your Camunda server is running
2. Verify you're using the correct server URL
3. Check that your BPMN models are valid
4. Ensure you have network connectivity to the Camunda server

## Example

```bash
python deploy_bpmn.py -m openai_decision_process -s http://localhost:8080
```
