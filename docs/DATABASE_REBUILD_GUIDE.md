# DADM Database Rebuild System

## Overview

The DADM Database Rebuild System provides comprehensive tools for database disaster recovery, environment setup, and maintenance. This system can quickly rebuild your database from scratch if you lose the database mount or need to set up a new environment.

## 🚀 Quick Start

### Rebuild Development Database
```bash
# Simple rebuild (most common use case)
./scripts/database_rebuild.sh rebuild

# Or using Python directly
python3 scripts/database_rebuild.py --action rebuild --environment dev
```

### Create Backup
```bash
# Create backup of current database
./scripts/database_rebuild.sh backup

# Create backup with custom filename
python3 scripts/database_rebuild.py --action backup --output my_backup.sql
```

### Restore from Backup
```bash
# Restore from backup file
./scripts/database_rebuild.sh restore backup_file.sql

# Restore to specific environment
./scripts/database_rebuild.sh restore backup_file.sql staging
```

## 🛠️ Tools Overview

### 1. Shell Script (`scripts/database_rebuild.sh`)
**Best for:** Interactive use, quick operations, safety checks

**Features:**
- ✅ User-friendly interface with colored output
- ✅ Built-in safety checks (Docker running, containers available)
- ✅ Automatic safety backups before dangerous operations
- ✅ Production environment confirmations
- ✅ Environment validation

### 2. Python Script (`scripts/database_rebuild.py`)
**Best for:** Automation, scripting, advanced operations

**Features:**
- ✅ Programmatic interface
- ✅ Detailed logging
- ✅ Error handling and rollback
- ✅ Environment-specific configurations
- ✅ Extensible for custom operations

## 📋 Available Commands

### Shell Script Commands
```bash
# Database Operations
./scripts/database_rebuild.sh rebuild [env]     # Rebuild database from scratch
./scripts/database_rebuild.sh backup [env]      # Create database backup
./scripts/database_rebuild.sh restore [file]    # Restore from backup
./scripts/database_rebuild.sh seed [env]        # Create seed data
./scripts/database_rebuild.sh verify [env]      # Verify database health

# Utility Commands
./scripts/database_rebuild.sh status [env]      # Show database status
./scripts/database_rebuild.sh help              # Show help
```

### Python Script Actions
```bash
# Core Actions
python3 scripts/database_rebuild.py --action rebuild --environment dev
python3 scripts/database_rebuild.py --action backup --environment dev
python3 scripts/database_rebuild.py --action restore --input backup.sql --environment dev
python3 scripts/database_rebuild.py --action seed --environment dev
python3 scripts/database_rebuild.py --action verify --environment dev
```

## 🌍 Environment Support

### Development (`dev`)
- **Database:** `dadm_db`
- **Container:** `dadm-postgres`
- **Features:** Includes sample data and test prompts
- **Safety:** No confirmation required for destructive operations

### Staging (`staging`)
- **Database:** `dadm_db_staging`  
- **Container:** `dadm-postgres-staging`
- **Features:** Production-like data without real user data
- **Safety:** Automatic backup before rebuild

### Production (`prod`)
- **Database:** `dadm_db_prod`
- **Container:** `dadm-postgres-prod`
- **Features:** Live production data
- **Safety:** Multiple confirmations + automatic backups

## 🗂️ Database Schema

The rebuild system creates a complete database schema including:

### Multi-Tenant Hierarchy
- **companies** - Root organizational level
- **tenants** - Isolated organizational units  
- **teams** - Functional working groups
- **projects** - Project-specific data
- **decisions** - Decision records

### Prompt Management
- **prompts** - Prompt templates and versions
- **test_cases** - Test cases for prompts
- **test_results** - Test execution results
- **prompt_llm_configs** - LLM configurations
- **prompt_test_selections** - Test case selections

### Analysis & Processing
- **analysis_metadata** - Analysis metadata
- **analysis_data** - Analysis results
- **processing_tasks** - Background processing tasks

### Data Governance
- **data_policies** - Data governance policies
- **data_lineage** - Data lineage tracking
- **quality_metrics** - Data quality metrics

## 📁 File Structure

```
dadm/
├── scripts/
│   ├── database_rebuild.py      # Main Python rebuild tool
│   ├── database_rebuild.sh      # Shell wrapper script
│   └── migrate_sqlite_to_postgresql.py  # Migration utilities
├── docker/
│   └── init-scripts/
│       ├── 001-create-databases.sql     # Database creation
│       ├── 002-create-dadm-database.sql # Schema creation
│       ├── 003-prompt-test-configs.sql  # Additional tables
│       └── 01-fix-varchar-limits.sql    # Schema fixes
└── backups/
    └── database/                # Auto-generated backups
        ├── dadm_backup_dev_20250714_140322.sql
        └── safety_backup_prod_20250714_140455.sql
```

## 🔧 Configuration

### Environment Variables
The system uses these environment variables (with defaults):

```bash
# Database Connection
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=dadm_db
POSTGRES_USER=dadm_user
POSTGRES_PASSWORD=dadm_password

# Service Configuration
PROMPT_SERVICE_PORT=3001
TOOL_SERVICE_PORT=3002
WORKFLOW_SERVICE_PORT=3003
```

### Docker Configuration
Ensure your Docker containers are properly configured:

```yaml
# docker-compose.yml example
services:
  dadm-postgres:
    image: postgres:15
    container_name: dadm-postgres
    environment:
      POSTGRES_DB: dadm_db
      POSTGRES_USER: dadm_user
      POSTGRES_PASSWORD: dadm_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/init-scripts:/docker-entrypoint-initdb.d
```

## 🚨 Disaster Recovery Scenarios

### Scenario 1: Lost Database Mount
```bash
# 1. Restore PostgreSQL container
docker-compose up -d dadm-postgres

# 2. Rebuild database from scratch
./scripts/database_rebuild.sh rebuild

# 3. Restore from backup if available
./scripts/database_rebuild.sh restore latest_backup.sql

# 4. Verify database health
./scripts/database_rebuild.sh verify
```

### Scenario 2: Corrupted Database
```bash
# 1. Create backup of current state (if possible)
./scripts/database_rebuild.sh backup

# 2. Rebuild from scratch
./scripts/database_rebuild.sh rebuild

# 3. Restore from known good backup
./scripts/database_rebuild.sh restore good_backup.sql
```

### Scenario 3: New Environment Setup
```bash
# 1. Set up new environment
./scripts/database_rebuild.sh rebuild staging

# 2. Verify setup
./scripts/database_rebuild.sh verify staging

# 3. Create initial backup
./scripts/database_rebuild.sh backup staging
```

## 🔒 Safety Features

### Automatic Backups
- **Before Rebuild:** Creates safety backup (non-dev environments)
- **Before Restore:** Creates current state backup
- **Scheduled:** Can be integrated with cron for regular backups

### Confirmation Prompts
- **Production Operations:** Requires explicit "yes" confirmation
- **Destructive Operations:** Shows warnings and requires confirmation
- **Safety Checks:** Validates Docker and container status

### Rollback Capability
- **Failed Operations:** Automatic rollback on errors
- **Safety Backups:** Can restore from automatically created backups
- **Version Control:** Schema scripts are version controlled

## 📊 Monitoring & Verification

### Health Checks
```bash
# Check database health
./scripts/database_rebuild.sh verify

# Check specific environment
./scripts/database_rebuild.sh verify prod

# Get detailed status
./scripts/database_rebuild.sh status
```

### Log Monitoring
```bash
# Check rebuild logs
tail -f logs/database_rebuild.log

# Monitor service logs
tail -f services/logs/prompt-service.log
```

## 🔧 Troubleshooting

### Common Issues

**1. Docker Container Not Running**
```bash
# Check container status
docker ps | grep postgres

# Start container
docker-compose up -d dadm-postgres

# Check logs
docker logs dadm-postgres
```

**2. Connection Refused**
```bash
# Check PostgreSQL is accepting connections
docker exec dadm-postgres pg_isready -U dadm_user

# Check port availability
netstat -an | grep :5432
```

**3. Permission Errors**
```bash
# Fix script permissions
chmod +x scripts/database_rebuild.sh

# Check PostgreSQL permissions
docker exec dadm-postgres psql -U dadm_user -c "\du"
```

**4. Schema Errors**
```bash
# Check schema script syntax
docker exec dadm-postgres psql -U dadm_user -d dadm_db -c "\d"

# Manually run schema scripts
docker exec dadm-postgres psql -U dadm_user -d dadm_db -f /docker-entrypoint-initdb.d/002-create-dadm-database.sql
```

### Recovery Commands

**Emergency Database Reset:**
```bash
# Complete reset (DANGEROUS)
docker-compose down
docker volume rm dadm_postgres_data
docker-compose up -d
./scripts/database_rebuild.sh rebuild
```

**Restore from Backup:**
```bash
# Find available backups
ls -la backups/database/

# Restore specific backup
./scripts/database_rebuild.sh restore backups/database/dadm_backup_dev_20250714_140322.sql
```

## 📈 Best Practices

### Regular Maintenance
1. **Daily Backups:** Set up automated daily backups
2. **Weekly Verification:** Run health checks weekly
3. **Monthly Rebuilds:** Test rebuild process monthly (dev environment)
4. **Quarterly Reviews:** Review and update schema scripts

### Development Workflow
1. **Feature Branches:** Test schema changes in dev environment
2. **Migration Scripts:** Update init scripts for schema changes
3. **Testing:** Verify rebuild process works after changes
4. **Documentation:** Update this guide when adding new features

### Production Safety
1. **Backup Before Changes:** Always backup before updates
2. **Staged Rollouts:** Test in staging before production
3. **Rollback Plans:** Have rollback procedures ready
4. **Monitoring:** Monitor database health after changes

## 🤝 Contributing

To extend the database rebuild system:

1. **Add New Environments:** Update `environments` dict in `database_rebuild.py`
2. **New Schema Scripts:** Add scripts to `docker/init-scripts/`
3. **Custom Seed Data:** Extend `create_seed_data()` method
4. **Additional Checks:** Add validation to `verify_database_health()`

## 📞 Support

For issues with the database rebuild system:

1. **Check Logs:** Review script output and PostgreSQL logs
2. **Verify Environment:** Ensure Docker and containers are running
3. **Run Health Check:** Use verify command to diagnose issues
4. **Emergency Recovery:** Use disaster recovery procedures above

---

**Remember:** The database rebuild system is designed to be safe and reliable, but always test in development environments first and maintain regular backups! 