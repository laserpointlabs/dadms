# Services

This document outlines how to manage services within the DADM project using Consul.

## Managing Services with Consul

Consul is used for service discovery and configuration. Services are registered with Consul, and the system uses Consul to find and communicate with these services.

### Starting Services

Services are typically started using Docker Compose, which also starts the Consul container.

1.  **Start all services (including Consul):**
    ```bash
    docker-compose -f docker/docker-compose.yml up -d
    ```
2.  **Verify Consul is running:**
    Open your browser and navigate to `http://localhost:8500/ui/dc1/services`. You should see the Consul UI.
    Alternatively, you can use a script:
    ```powershell
    # In your PowerShell terminal
    cd scripts
    .\dadm_manager.ps1
    # Select option to check service status or view Consul UI
    ```
    Or check via curl:
    ```powershell
    curl http://localhost:8500/v1/status/leader
    ```

### Stopping Services

1.  **Stop all services (including Consul) via Docker Compose:**
    ```bash
    docker-compose -f docker/docker-compose.yml down
    ```
2.  **Individual service management (if not using Docker Compose for all):**
    Services that register with Consul usually have a deregistration hook on shutdown. If a service is stopped, it should automatically deregister from Consul.
    To manually deregister a service if needed, you can use the Consul HTTP API. For example, to deregister a service named `my-service`:
    ```bash
    curl -X PUT http://localhost:8500/v1/agent/service/deregister/my-service
    ```

### Registering Services

Services are typically configured to auto-register with Consul upon startup. The `scripts/deploy_consul_services.ps1` script can also be used to register services that are running in Docker containers.

Key aspects of service registration:
-   **Service Name and ID:** Unique identifiers for the service.
-   **Address and Port:** Network location of the service.
-   **Tags:** Used for filtering and grouping, often includes `type-<service_type>`.
-   **Metadata:** Key-value pairs for additional information (e.g., version, description).
-   **Health Check:** An HTTP endpoint (e.g., `/health`) that Consul polls to determine service health.

The `services/openai_service/consul_registry.py` module provides a `ConsulServiceRegistry` class that can be used by Python-based services to interact with Consul for registration and discovery.

## Creating a New Service

Refer to the `docs/IMPLEMENTING_SERVICES.md` guide for detailed steps on creating a new service. The general process involves:

1.  **Directory Structure:**
    Create a new directory for your service under `services/` (e.g., `services/my_new_service/`).
    Include:
    *   `service.py` (or equivalent for other languages) for the main service logic.
    *   `Dockerfile` for containerization.
    *   `requirements.txt` (or equivalent) for dependencies.
    *   A health check endpoint (e.g., `/health`).
    *   (Optional) `service_config.json` if using `deploy_consul_services.ps1` for registration.

2.  **Service Implementation:**
    *   Implement the core logic of your service.
    *   Ensure it has an HTTP endpoint for health checks (e.g., `/health` returning HTTP 200 OK).
    *   Implement other necessary endpoints (e.g., `/info`, `/process`).

3.  **Consul Registration:**
    *   **Automatic Registration:** If your service is Python-based, you can use the `ConsulServiceRegistry` class from `services/openai_service/consul_registry.py` (or adapt it) to register the service with Consul on startup.
        *   The service needs to know the Consul address (usually via `CONSUL_HTTP_ADDR` environment variable).
        *   It should provide its name, port, health check path, and any relevant tags or metadata.
    *   **Manual/Scripted Registration:** For services managed by `docker-compose` and registered via `scripts/deploy_consul_services.ps1`, ensure your service's `service_config.json` (if used) or the script logic correctly defines the service parameters for Consul.

4.  **Dockerfile:**
    Create a `Dockerfile` to package your service into a container.

5.  **Docker Compose:**
    Add your new service to the `docker/docker-compose.yml` file so it can be managed alongside other services. Ensure it's on the same Docker network as Consul (`dadm-network`).

    Example entry in `docker-compose.yml`:
    ```yaml
    my_new_service:
      build: ./services/my_new_service
      container_name: dadm-my-new-service
      ports:
        - "500X:500X" # Map the service port
      environment:
        - CONSUL_HTTP_ADDR=consul:8500
        - SERVICE_HOST=my_new_service # Hostname within Docker network
        - PORT=500X
        # Add other environment variables as needed
      networks:
        - dadm-network
      depends_on:
        - consul
    ```

6.  **Testing:**
    *   Start your service (e.g., via `docker-compose up -d my_new_service`).
    *   Verify it registers correctly in the Consul UI (`http://localhost:8500`).
    *   Test its health check endpoint and other functionalities.

For more detailed guidance, consult:
-   `docs/IMPLEMENTING_SERVICES.md`
-   `docs/consul_service_discovery.md`
-   `docs/consul_service_registry.md`
-   Existing services in the `services/` directory as examples.
