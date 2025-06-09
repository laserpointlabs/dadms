# Moving Configuration Files Out of the Data Directory

To address the issue where configuration files like `assistant_id.json` and `rag_file_metadata.json` were being uploaded to OpenAI as assistant files, we have made the following changes:

## New File Locations

- **Old Location**: `data/assistant_id.json` → **New Location**: `config/metadata/assistant_id.json`
- **Old Location**: `data/meta.json` → **New Location**: `config/metadata/rag_file_metadata.json`

## Migration Script

We have provided a migration script to help move your existing files to the new locations:

```bash
python scripts/move_metadata_files.py
```

This script will:
1. Create the `config/metadata` directory if it doesn't exist
2. Copy configuration files from the old location to the new location
3. Create backups of the original files with a `.bak` extension

## Code Changes

The following classes have been updated to use the new file locations:

1. **AssistantIDManager**
   - Now looks for the assistant ID file in `config/metadata`
   - Maintains backward compatibility by checking the old location if the file isn't found in the new location

2. **RAGFileManager**
   - Now stores metadata in `config/metadata/rag_file_metadata.json`
   - Actual files for upload still remain in the `data` directory
   - Maintains backward compatibility for existing deployments

3. **Utility Scripts**
   - The `manage_assistant.py` script has been updated to use the new locations
   - Added backward compatibility to ensure seamless transition

## Benefit

This change ensures that only actual content files (PDFs, documents, etc.) are stored in the `data` directory and uploaded to OpenAI, while configuration and metadata files are kept separate. This prevents unintended uploads of configuration data and keeps your OpenAI assistant clean.