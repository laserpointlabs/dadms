# Camunda Database Upgrade: H2 to PostgreSQL

## Overview

This document describes the upgrade from H2 in-memory database to PostgreSQL for the Camunda BPM platform to resolve text field size limitations.

## Problem

The original H2 database configuration had a VARCHAR(4000) limit for text fields, causing failures when AI-generated responses exceeded this limit:

```
Value too long for column "TEXT_ VARCHAR(4000)": "STRINGDECODE('### Risk Identification...' (4055)"
```

## Solution

### 1. Database Migration to PostgreSQL

**Benefits:**
- **No VARCHAR length limits** - PostgreSQL TEXT fields can store unlimited text
- **Better performance** for concurrent operations
- **Production-ready** database engine
- **Data persistence** across container restarts
- **Better transaction handling** for parallel workflows

### 2. Configuration Changes

#### docker-compose.yml Updates:
- Added PostgreSQL 15 service
- Modified Camunda service to use PostgreSQL
- Added persistent volume for database data
- Updated healthchecks and dependencies

#### Custom Camunda Docker Image:
- Created `Dockerfile.camunda` with PostgreSQL JDBC driver
- Ensures proper database connectivity

### 3. Database Schema

PostgreSQL automatically handles:
- **TEXT fields** - No size limitations (vs H2's VARCHAR(4000))
- **Concurrent access** - Better handling of parallel tasks
- **ACID compliance** - Reliable transaction processing
- **UTF-8 support** - Proper handling of international characters

## Deployment Instructions

### First Time Setup:

1. **Stop existing containers:**
   ```powershell
   cd c:\Users\JohnDeHart\Documents\dadm
   python app.py docker down
   ```

2. **Build new Camunda image:**
   ```powershell
   python app.py docker build --no-cache camunda
   ```

3. **Start services:**
   ```powershell
   python app.py docker up -d
   ```

4. **Verify services:**
   ```powershell
   python app.py docker ps
   ```

### Migration from Existing H2 Data:

If you have important process data in H2, you would need to:
1. Export data from H2 (if file-based)
2. Import into PostgreSQL
3. Update process instance references

**Note:** Since we were using H2 in-memory, no data migration is needed.

## Verification Steps

### 1. Check Database Connection:
```powershell
# Check PostgreSQL is running
python app.py docker logs postgres

# Check Camunda can connect
python app.py docker logs camunda
```

### 2. Test Long Text Fields:
```powershell
# Test with advanced workflow
python app.py -s "Advanced Decision Analysis Process"
```

### 3. Monitor for Errors:
- Check Camunda logs for database errors
- Verify all parallel tasks complete successfully
- Confirm no VARCHAR length errors

## Database Access

### Connection Details:
- **Host:** localhost (when running locally)
- **Port:** 5432
- **Database:** camunda
- **Username:** camunda
- **Password:** camunda

### Direct Database Access:
```bash
# Using psql (if installed)
psql -h localhost -p 5432 -U camunda -d camunda

# Using Docker exec
docker exec -it dadm-postgres psql -U camunda -d camunda
```

## Performance Considerations

### PostgreSQL Optimizations:
- **Shared buffers:** Default configuration suitable for development
- **Connection pooling:** Camunda handles connection management
- **Indexing:** Camunda creates necessary indexes automatically

### Monitoring:
- Database size: Monitor `/var/lib/postgresql/data` volume
- Connection count: PostgreSQL default max_connections = 100
- Query performance: Use Camunda's built-in metrics

## Troubleshooting

### Common Issues:

1. **Container won't start:**
   ```powershell
   # Check logs
   python app.py docker logs postgres
   python app.py docker logs camunda
   ```

2. **Connection refused:**
   - Verify PostgreSQL is running and healthy
   - Check network connectivity between containers
   - Verify JDBC URL format

3. **Build failures:**
   ```powershell
   # Rebuild with no cache
   python app.py docker build --no-cache
   ```

### Recovery Steps:

1. **Reset database:**
   ```powershell
   python app.py docker down -v  # Removes volumes
   python app.py docker up -d
   ```

2. **Check service health:**
   ```powershell
   python app.py docker ps
   # Look for "healthy" status
   ```

## Benefits Summary

| Aspect | H2 (Before) | PostgreSQL (After) |
|--------|-------------|-------------------|
| Text Limit | 4000 chars | Unlimited |
| Persistence | In-memory only | Persistent storage |
| Concurrency | Limited | Excellent |
| Production Use | Development only | Production ready |
| Backup/Recovery | Not available | Full support |
| Performance | Basic | Optimized |

## Next Steps

1. **Test thoroughly** with long AI responses
2. **Monitor performance** under load
3. **Consider backup strategy** for production use
4. **Document any custom configurations** needed

This upgrade resolves the text field limitation while providing a more robust foundation for the DADM system's data persistence needs.
