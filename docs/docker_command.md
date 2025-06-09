# DADM Docker Command

The `docker` command allows you to manage Docker containers using Docker Compose directly from the DADM CLI. It uses the docker-compose.yml file in the docker directory.

## Usage

```
dadm docker [docker-compose-commands]
```

All arguments after `docker` are passed directly to the Docker Compose command line.

## Examples

### Start all containers

```
dadm docker up
```

### Start all containers in detached mode with build

```
dadm docker up -d --build
```

### Stop all containers

```
dadm docker down
```

### View running containers

```
dadm docker ps
```

### View container logs

```
dadm docker logs [service-name]
```

### Restart a specific service

```
dadm docker restart [service-name]
```

## Available Docker Compose Commands

The DADM Docker command supports all standard Docker Compose commands, including:

- `up`: Create and start containers
- `down`: Stop and remove containers, networks, images, and volumes
- `ps`: List containers
- `logs`: View output from containers
- `build`: Build or rebuild services
- `pull`: Pull service images
- `restart`: Restart services
- `rm`: Remove stopped containers
- `stop`: Stop services
- `start`: Start services

For more information on Docker Compose commands, see the [official Docker Compose documentation](https://docs.docker.com/compose/reference/).

## Usage Tips

1. Make sure your `docker-compose.yml` file is in the `docker` directory.
2. All commands are executed from the project root directory.
3. To see what command is being executed, check the console output.
4. If you need to access a specific container's shell, use `dadm docker exec -it <service-name> sh`