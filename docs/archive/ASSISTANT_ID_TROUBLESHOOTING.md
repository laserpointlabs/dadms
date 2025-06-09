# Assistant ID Troubleshooting Guide (Updated May 2025)

This document provides solutions for fixing assistant ID issues with the DADM application.

## Common Assistant ID Error

The most common error you might encounter is:

```
Error code: 404 - {'error': {'message': "No assistant found with id 'asst_XXXX'.", 'type': 'invalid_request_error', 'param': None, 'code': None}}
```

This happens when the application is using an incorrect or outdated assistant ID.

## Quick Fix: Run the Unified Assistant ID Manager

The quickest way to fix this issue is to run the unified assistant ID manager script:

```powershell
python scripts/sync_assistant_id_unified.py --repair
```

This script will:
1. Connect to OpenAI API
2. Find the correct assistant ID for your configured assistant name
3. Update the local storage file and service registry
4. Set the environment variable with the correct ID

After running the script, restart your application:

```powershell
dadm -s "OpenAI Decision Process"
```

## Additional Options

The unified assistant ID manager provides several options:

```powershell
# Only check IDs without making changes
python scripts/sync_assistant_id_unified.py --check-only

# Force a direct check with OpenAI
python scripts/sync_assistant_id_unified.py --force

# Enable verbose logging
python scripts/sync_assistant_id_unified.py --verbose
```

## Manual Fix Steps

If the automatic fixers don't work, follow these manual steps:

1. Find your current assistant ID:
   ```powershell
   # Get your API key
   echo $env:OPENAI_API_KEY 
   
   # Then use the OpenAI API directly
   curl -s https://api.openai.com/v1/assistants?limit=100 -H "Authorization: Bearer $env:OPENAI_API_KEY" | Select-String "DADM Decision Analysis Assistant" -Context 10,0
   ```

2. Update the assistant ID file manually:
   - Edit `data/assistant_id.json`
   - Replace the assistant_id value with the correct ID

3. Update the service registry:
   - Run the following to view registered services:
     ```powershell
     python -c "from config.service_registry import SERVICE_REGISTRY; print(SERVICE_REGISTRY)"
     ```
   - Update the assistant ID in the registry

4. Set the environment variable:
   ```powershell
   $env:OPENAI_ASSISTANT_ID = "asst_YourCorrectID"
   ```

5. Restart all services and the application

## Prevention Tips

To prevent assistant ID issues in the future:

1. Always use the same assistant name in your configuration
2. Don't delete assistants from the OpenAI dashboard
3. Run the sync_assistant_id.py script periodically
4. If you need to create a new assistant, run the fixer script afterward

## Automatic Prevention

The application now includes automatic assistant ID verification at startup to help prevent these issues. If you're still experiencing problems, check the following:

1. The service_registry.py file might have a hardcoded assistant ID
2. The assistant_id.json file might be corrupted or have incorrect permissions
3. Network connectivity to the OpenAI API might be interrupted

## Support

If you continue to experience issues, try the following:

1. Delete the assistant_id.json file and let the application create a new assistant
2. Check the OpenAI API logs for any rate limiting or other issues
3. Verify your OpenAI API key is valid and has sufficient permissions
4. Run the application with the `--verbose` flag for additional debugging information:
   ```powershell
   dadm -s "OpenAI Decision Process" --verbose
   ```