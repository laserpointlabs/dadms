# DADM OpenAI Assistant Integration - Updated File Structure

This documentation describes the updated file structure for DADM's OpenAI integration, focusing on the separation of content files and metadata files.

## File Structure

The DADM OpenAI integration now uses the following file structure:

```
dadm/
├── config/
│   ├── metadata/
│   │   ├── assistant_id.json     # Stores the assistant ID for persistence
│   │   └── rag_file_metadata.json # Tracks file uploads and associations
│   └── openai_config.py          # OpenAI API configuration
├── data/
│   ├── document1.pdf             # Content files for RAG
│   ├── document2.docx            # Content files for RAG
│   └── ...
├── src/
│   ├── openai_assistant.py       # Main OpenAI integration
│   ├── assistant_id_manager.py   # Handles assistant ID persistence
│   └── rag_file_manager.py       # Manages file uploads and attachments
└── scripts/
    ├── move_metadata_files.py    # Script to move metadata files to config/metadata
    └── manage_assistant.py       # CLI script for assistant management
```

## Key Changes

The main change is that configuration and metadata files have been moved from the `data` directory to the `config/metadata` directory. This prevents these files from being accidentally uploaded to OpenAI as assistant files.

**Old Structure:**
- `data/assistant_id.json` - Stored assistant ID information
- `data/meta.json` - Stored file upload metadata

**New Structure:**
- `config/metadata/assistant_id.json` - Stores assistant ID information
- `config/metadata/rag_file_metadata.json` - Stores file upload metadata (renamed for clarity)

## Configuration Files

### assistant_id.json

This file stores the OpenAI Assistant ID and related metadata:

```json
{
  "assistant_id": "asst_abc123...",
  "name": "DADM Decision Analysis Assistant",
  "last_used": "2025-05-25T14:30:45.123456"
}
```

### rag_file_metadata.json

This file tracks uploaded files and their associations with assistants:

```json
{
  "files": {
    "data/document1.pdf": {
      "file_id": "file_abc123...",
      "hash": "sha256:...",
      "timestamp": "2025-05-25T14:30:45.123456",
      "version": 1
    }
  },
  "assistants": {
    "asst_abc123...": ["file_abc123..."]
  },
  "file_id_to_path": {
    "file_abc123...": "data/document1.pdf"
  },
  "last_updated": "2025-05-25T14:30:45.123456"
}
```

## Migration

If you're upgrading from a previous version of DADM, you can use the provided migration script to move your metadata files to the new location:

```bash
python scripts/move_metadata_files.py
```

This script will:
1. Create the `config/metadata` directory if it doesn't exist
2. Copy your existing metadata files to the new location
3. Create backups of the original files with a `.bak` extension

## Backward Compatibility

The code has been updated to maintain backward compatibility:

1. If a file is not found in the new location, the system will check the old location
2. If a file is found in the old location, a message will be logged recommending migration
3. The migration script will not delete original files, allowing for a smooth transition

This ensures that existing deployments will continue to work while encouraging migration to the new structure.