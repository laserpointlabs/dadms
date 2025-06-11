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

## Camunda Service Modifications

### VARCHAR(4000) Truncation Fix

The original Camunda installation had significant limitations due to PostgreSQL's default VARCHAR(4000) column sizes, which caused data truncation in process variables, task descriptions, and other text fields. We implemented a comprehensive solution to resolve this issue.

#### Supporting Files and Their Purpose

**`Dockerfile.camunda`**
- Custom Dockerfile extending the official Camunda 7.15.0 image
- Installs PostgreSQL JDBC driver (postgresql-42.7.4.jar)
- Adds essential utilities: `wget`, `curl`, `bash`, `postgresql-client`
- Downloads and configures `wait-for-it.sh` script for database readiness checks
- Copies custom startup script with Unix line endings for Linux compatibility
- Includes custom configuration files for PostgreSQL integration

**`scripts/startup-with-migration.sh`**
- Custom startup script that orchestrates the complete initialization process
- **Database Wait**: Uses `wait-for-it.sh` to ensure PostgreSQL is ready before proceeding
- **Schema Detection**: Checks if Camunda database schema already exists
- **Migration Logic**: Applies VARCHAR(4000) to TEXT migration only when needed
- **Column Analysis**: Uses PostgreSQL system catalogs to identify affected columns
- **Safe Migration**: Creates backup functions and applies changes incrementally
- **Startup Coordination**: Starts Camunda after database is properly configured
- **Error Handling**: Provides detailed logging and graceful failure handling

**`camunda-config/bpm-platform.xml`**
- Camunda Platform configuration for PostgreSQL integration
- **Standalone Configuration**: Uses direct JDBC properties instead of JNDI datasource
- **Connection Settings**: Optimized for PostgreSQL with proper connection pooling
- **Database Properties**: Includes ping queries, timeout settings, and validation
- **Authentication**: Configured for `dadm_user`/`dadm_password` credentials
- **Schema Management**: Enables automatic schema updates and history

**`init-scripts/` Directory**
- Contains PostgreSQL initialization scripts (if any)
- Reserved for database-level setup scripts that run during PostgreSQL container startup
- Currently used for any pre-Camunda database preparation

#### Migration Process Details

The VARCHAR(4000) to TEXT migration addresses these specific issues:

1. **Affected Tables and Columns**:
   - `act_hi_taskinst.description_` - Task descriptions
   - `act_ru_task.description_` - Running task descriptions  
   - `act_hi_varinst.text_`, `act_hi_varinst.text2_` - Process variable text values
   - `act_ru_variable.text_`, `act_ru_variable.text2_` - Runtime variable text values
   - `act_hi_detail.text_`, `act_hi_detail.text2_` - Historical detail text

2. **Migration Strategy**:
   - **Detection**: Query `information_schema.columns` to identify VARCHAR(4000) columns
   - **Conversion**: ALTER TABLE statements to change VARCHAR(4000) to TEXT
   - **Validation**: Post-migration verification of column types
   - **Idempotency**: Safe to run multiple times without data loss

3. **Benefits Achieved**:
   - **No Size Limits**: TEXT columns can store up to 1GB of text data
   - **Better Performance**: PostgreSQL optimizes TEXT storage automatically
   - **Future-Proof**: Eliminates truncation issues for complex process data
   - **Thread Persistence**: Enables storage of large conversation histories

#### Line Ending Compatibility

A critical aspect of the solution involved fixing Windows/Linux line ending compatibility:

- **Problem**: Scripts created on Windows had CRLF (`\r\n`) line endings
- **Impact**: Linux containers couldn't execute scripts with Windows line endings
- **Solution**: Converted `startup-with-migration.sh` to Unix LF (`\n`) line endings
- **Verification**: Used PowerShell `Format-Hex` to confirm proper line ending format

## Services

The Docker Compose configuration includes:
- **PostgreSQL**: Database server for Camunda with custom initialization
- **Camunda**: BPM platform with PostgreSQL backend and VARCHAR fixes
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
4. Docker layer caching is enabled via `.dockerignore` and multi-stage
   builds using the `nvidia/cuda` base image. This avoids downloading
   NVIDIA components on every build.
5. Access Camunda at: http://localhost:8080/camunda
6. Monitor services via Consul at: http://localhost:8500

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

- **v0.9.0 (June 11, 2025)**: Thread persistence implementation, OpenAI URL generation, live development mounts
- **v0.8.1 (June 11, 2025)**: Camunda VARCHAR(4000) truncation fix, line ending compatibility
- **v0.8.0 (June 2025)**: PostgreSQL migration, enhanced reliability
- **v0.7.0 (May 2025)**: Enhanced JSON recommendation expansion
- **v0.6.0 (May 2025)**: Service monitoring and reliability improvements