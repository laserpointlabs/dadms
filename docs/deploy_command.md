# DADM Deploy Command

The `deploy` command allows you to manage BPMN model deployments to a Camunda server.

## Usage

```
dadm deploy <subcommand> [options]
```

## Available Subcommands

### List Models

Lists all available BPMN models in the `camunda_models` directory.

```
dadm deploy list
```

### Deploy a Specific Model

Deploys a specific BPMN model to the Camunda server.

```
dadm deploy model <model_name> [-s <server_url>]
```

Parameters:
- `model_name`: Name of the model to deploy (with or without .bpmn extension)
- `-s, --server`: Camunda server URL (default: http://localhost:8080)

Examples:
```
dadm deploy model process_model
dadm deploy model process_model.bpmn
dadm deploy model my_process -s http://camunda-server:8080
```

### Deploy All Models

Deploys all BPMN models from the `camunda_models` directory to the Camunda server.

```
dadm deploy all [-s <server_url>]
```

Parameters:
- `-s, --server`: Camunda server URL (default: http://localhost:8080)

Example:
```
dadm deploy all -s http://camunda-server:8080
```

### Deploy Services to Consul

Registers DADM services with Consul service discovery. This command automatically discovers running Docker containers and registers them as services in Consul.

```
dadm deploy services [options]
```

Parameters:
- `--consul-url`: Consul server URL (default: http://localhost:8500)
- `--list-only`: Only list available services without registering them
- `--no-browser`: Do not open Consul UI in browser

Examples:
```
dadm deploy services
dadm deploy services --consul-url http://consul-server:8500
dadm deploy services --list-only
dadm deploy services --no-browser
```

The services command will:
1. Check if Consul is running (and start it if needed)
2. Discover running Docker containers
3. Load service configurations from the `services/` directory
4. Match services to containers
5. Register services with Consul including health checks
6. Open the Consul UI in your browser (unless `--no-browser` is specified)

**Prerequisites for services deployment:**
- Docker must be installed and running
- Service containers must be running
- Each service should have a `service_config.json` file in its folder under `services/`
- Consul will be automatically started if not running

## Usage Tips

1. **For BPMN deployment:**
   - Make sure your BPMN models are in the `camunda_models` directory.
   - The Camunda server must be running and accessible at the specified URL.
   - Models will be deployed with their filename as the deployment name.
   - Existing deployments with the same name will be updated.

2. **For services deployment:**
   - Ensure Docker is running and your service containers are started.
   - Each service should have a `service_config.json` file in its directory under `services/`.
   - Consul will be automatically started if not already running.
   - Services will be registered with health checks pointing to their health endpoints.

## Common Issues

**BPMN Deployment:**
- If you get connection errors, ensure the Camunda server is running and accessible.
- BPMN models must be valid XML files with the .bpmn extension.
- Make sure your models are properly defined with all required elements.

**Services Deployment:**
- If Docker is not found, ensure Docker is installed and added to your PATH.
- If no containers are found, make sure your services are running with `dadm docker up`.
- If services fail to register, check that the `service_config.json` files are valid.
- If health checks fail, verify the health endpoints are accessible within the Docker network.
- Use `dadm deploy services --list-only` to see available services without registering them.