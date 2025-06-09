# Hugging Face Dependency Fix

This document explains how to fix the `ImportError: cannot import name 'cached_download' from 'huggingface_hub'` error when running the OpenAI service.

## Problem

When building or running the OpenAI service container, you may encounter this error:

```
ImportError: cannot import name 'cached_download' from 'huggingface_hub'
```

This occurs because of compatibility issues between the `sentence-transformers` library and certain versions of the `huggingface_hub` library.

## Solution

Pin the huggingface_hub package version in your requirements.txt file:

```
huggingface_hub==0.25.2
```

This version constraint ensures that a compatible version of the library is installed, avoiding the import error.

## Explanation

The `cached_download` function was deprecated in newer versions of `huggingface_hub`, but some versions of `sentence-transformers` still depend on it. By pinning to version 0.25.2, we ensure that the function is available.

## Alternative Solutions

If the simple version pinning doesn't resolve your issue, you might need to:

1. Pin specific versions of both libraries:
   ```
   sentence-transformers==2.2.2
   huggingface_hub==0.25.2
   ```

2. Install libraries in a specific order:
   ```bash
   pip install huggingface_hub==0.25.2
   pip install sentence-transformers
   ```

3. Create a simplified embedding approach that doesn't rely on Hugging Face models

## Verifying the Fix

After applying the fix, you can verify it by:

1. Rebuilding the Docker container:
   ```bash
   docker-compose build openai-service
   ```

2. Starting the service:
   ```bash
   docker-compose up openai-service
   ```

If the service starts without the import error, the fix was successful.