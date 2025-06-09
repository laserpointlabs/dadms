# RAG File Management in DADM

This document explains the file management system used for Retrieval-Augmented Generation (RAG) in the DADM application.

## Overview

The DADM application uses OpenAI Assistants with file attachments to provide context for decision analysis. The file management system ensures that:

1. Files are not uploaded multiple times unnecessarily
2. Files are properly associated with assistants
3. File changes are tracked with versioning
4. Metadata about files is persisted between sessions

## Components

### RAGFileManager

The `RAGFileManager` class (`src/rag_file_manager.py`) is the core component of the file management system. It provides:

- **Deduplication**: Each file is hashed to avoid uploading the same content multiple times
- **Versioning**: When files change, a new version is uploaded and tracked
- **Assistant associations**: Files are linked to the assistants that use them
- **Metadata persistence**: File information is stored in a JSON file

### Integration with AssistantManager

The `AssistantManager` class uses `RAGFileManager` to:

- Upload files from the data directory
- Track which files are associated with each assistant
- Avoid redundant uploads of unchanged files

## How It Works

### File Hashing

When a file is uploaded, its SHA-256 hash is calculated and stored. Before uploading a file, the system checks:

1. Is this file path already in our metadata?
2. If yes, has the content changed since last upload?

Only if the file is new or its content has changed will it be uploaded to OpenAI.

### Metadata Storage

The system stores metadata in a JSON file in the data directory. This metadata includes:

- File paths and their corresponding OpenAI file IDs
- Content hashes for change detection
- Version numbers for tracking changes
- Assistant associations
- Timestamps of uploads

### File-Assistant Associations

The system tracks which files are associated with which assistants. This enables:

- Filtering files by assistant
- Avoiding duplicate associations
- Cleaning up files when assistants are deleted

## Usage

### Basic Usage

The file management happens automatically when you initialize an `AssistantManager`:

```python
from src.openai_assistant import AssistantManager

# Initialize with a data directory
assistant = AssistantManager(data_dir="path/to/data")

# Files are automatically uploaded and associated with the assistant
```

### Manual File Management

You can also use the `RAGFileManager` directly:

```python
from src.rag_file_manager import RAGFileManager

# Initialize the file manager
file_manager = RAGFileManager(data_dir="path/to/data")

# Upload all files in a directory
file_ids = file_manager.upload_files_from_directory()

# Check which files are associated with an assistant
assistant_files = file_manager.get_file_ids_for_assistant("assistant_id")

# Refresh changed files
new, updated, unchanged = file_manager.sync_files()
```

## Testing

You can test the file management system with the included test script:

```bash
python scripts/test_rag_files.py --refresh
```

Options:
- `--list` or `-l`: List files registered with the file manager
- `--refresh` or `-r`: Refresh all files in the data directory
- `--data-dir` or `-d`: Specify a custom data directory
- `--assistant` or `-a`: Test with AssistantManager integration

## Troubleshooting

### Missing Files

If files aren't appearing in the assistant, check:

1. The files exist in the specified data directory
2. The metadata file isn't corrupt
3. The assistant ID is correctly tracked

### Duplicate Uploads

If files are being uploaded multiple times:

1. Ensure the metadata file is being persisted between runs
2. Check if file paths are consistent (relative vs. absolute)
3. Verify the hashing function is working correctly

You can reset the system by deleting the metadata file, but this will cause all files to be re-uploaded.