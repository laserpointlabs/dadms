# Docker Configuration

This folder contains Docker-related configuration files for the DADM project.

## Files

- `docker-compose.yml` - The main Docker Compose configuration file for running all DADM services
- `Dockerfile.camunda` - Custom Dockerfile for Camunda container with PostgreSQL support

## Database Migration (PostgreSQL)

As of June 5, 2025, DADM has been migrated from H2 to PostgreSQL for improved scalability and performance:

### PostgreSQL Benefits
- **No VARCHAR(4000) limitations**: Handle larger process definitions and data
- **Better performance**: Optimized for concurrent operations and larger datasets
- **ACID compliance**: Robust transaction handling for critical business processes
- **Scalability**: Support for production workloads and multiple users

### Database Configuration
The PostgreSQL service is configured with:
- **Database**: `camunda`
- **User/Password**: `camunda/camunda`
- **Port**: `5432`
- **Authentication**: Trust method for local connections, MD5 for host connections
- **Health Checks**: Automatic readiness verification

### Migration Details
- All 48 Camunda tables successfully migrated to PostgreSQL
- Enhanced data types (e.g., `bytea` instead of VARCHAR limitations)
- Improved container startup with wait-for-it script for database readiness
- Automatic schema creation and initialization

## Services

The Docker Compose configuration includes:
- **PostgreSQL**: Database server for Camunda
- **Camunda**: BPM platform with PostgreSQL backend
- **Consul**: Service discovery and configuration
- **Neo4j**: Graph database for knowledge representation
- **Qdrant**: Vector database for semantic search
- **OpenAI Service**: AI-powered decision analysis
- **Echo Service**: Test and validation service
- **Service Monitor**: Health monitoring and recovery

## Getting Started

1. Ensure Docker and Docker Compose are installed
2. Set required environment variables (see main README.md)
3. Run: `docker-compose up -d --build`
4. Access Camunda at: http://localhost:8080/camunda
5. Monitor services via Consul at: http://localhost:8500

## Troubleshooting

### PostgreSQL Connection Issues
If you encounter database connection problems:

1. **Check PostgreSQL health**:
   ```powershell
   docker logs dadm-postgres
   ```

2. **Verify database creation**:
   ```powershell
   docker exec dadm-postgres psql -U camunda -c "\l"
   ```

3. **Test connectivity**:
   ```powershell
   docker exec dadm-camunda pg_isready -h postgres -p 5432 -U camunda
   ```

### Container Startup Issues
If containers fail to start:

1. **Check for port conflicts**: Ensure ports 5432, 8080, 8500, etc. are not in use
2. **Verify Docker resources**: Ensure sufficient memory and disk space
3. **Clean rebuild**: Remove volumes and rebuild:
   ```powershell
   docker-compose down -v
   docker-compose up -d --build
   ```

### Data Migration Issues
If migration from H2 to PostgreSQL fails:

1. **Remove old volumes**:
   ```powershell
   docker volume rm docker_postgres_data
   ```

2. **Check environment variables** in docker-compose.yml
3. **Verify PostgreSQL authentication settings**

## Version History

- **v0.8.0 (June 2025)**: PostgreSQL migration, enhanced reliability
- **v0.7.0 (May 2025)**: Enhanced JSON recommendation expansion
- **v0.6.0 (May 2025)**: Service monitoring and reliability improvements