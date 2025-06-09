# Azure OpenAI Integration for RAG Operations

This document explains how to use Azure OpenAI with the RAG file management system in DADM.

## Overview

DADM supports both OpenAI and Azure OpenAI for RAG operations, providing a consistent interface for managing files regardless of the backend service used.

## Key Features

- **Azure-Compatible RAG Manager**: Specialized file manager for Azure OpenAI
- **Configuration Options**: Azure-specific settings in `openai_config.py`  
- **Dual Deployment Support**: Run the same code on either OpenAI or Azure OpenAI
- **Azure Best Practices**: Follows Microsoft's recommended patterns for Azure OpenAI

## Configuration

Configure Azure OpenAI in `config/openai_config.py`:

```python
# Azure OpenAI Configuration
USE_AZURE_OPENAI = True  # Set to True to use Azure OpenAI instead of OpenAI
AZURE_OPENAI_API_KEY = os.environ.get("AZURE_OPENAI_API_KEY", "")
AZURE_OPENAI_ENDPOINT = os.environ.get("AZURE_OPENAI_ENDPOINT", "")
AZURE_OPENAI_API_VERSION = "2023-12-01"
AZURE_OPENAI_DEPLOYMENT = os.environ.get("AZURE_OPENAI_DEPLOYMENT", "")
```

## Azure Best Practices

When working with Azure OpenAI for RAG operations, follow these best practices:

1. **Use Environment Variables**:
   - Store Azure OpenAI API keys and endpoints in environment variables
   - Do not hardcode sensitive information in your code

2. **Implement Rate Limiting**:
   - Azure OpenAI has specific rate limits that differ from OpenAI
   - Use exponential backoff for retries when limits are hit

3. **Manage Resources Efficiently**:
   - Clean up unused files regularly to manage costs
   - Use file deduplication to avoid redundant storage costs

4. **Optimize Deployment Selection**:
   - Use appropriate model deployments for your use case
   - Consider using different deployments for different capabilities

5. **Use Microsoft Entra ID (Azure AD) Authentication**:
   - For production workloads, use Microsoft Entra ID instead of API keys
   - Implement role-based access control (RBAC)

6. **Track Azure OpenAI Usage**:
   - Monitor your usage and quotas
   - Set up alerts for quota approaching limits

7. **Follow Regional Data Compliance**:
   - Ensure your Azure OpenAI resources are in compliant regions
   - Review data residency requirements for your use case

## Using the Azure RAG File Manager

### Basic Usage

```python
from src.azure_rag_file_manager import AzureRAGFileManager

# Initialize the Azure RAG file manager
azure_file_manager = AzureRAGFileManager()

# Upload files from a directory
file_ids = azure_file_manager.upload_files_from_directory()

# Associate files with an assistant
for file_id in file_ids:
    azure_file_manager.associate_file_with_assistant(file_id, assistant_id)
```

### Advanced Usage

```python
# Upload specific files with a pattern
pdf_file_ids = azure_file_manager.upload_files_from_directory(
    file_pattern="*.pdf",
    purpose="assistants"
)

# Sync files to keep Azure OpenAI up to date
new, updated, unchanged = azure_file_manager.sync_files()
print(f"Synced files: {new} new, {updated} updated, {unchanged} unchanged")

# Check file versions
files_info = azure_file_manager.list_files()
for file_info in files_info:
    print(f"File: {file_info['path']}, Version: {file_info['version']}")
```

## Comparing OpenAI and Azure OpenAI

| Feature | OpenAI | Azure OpenAI |
|---------|--------|--------------|
| Authentication | API Key | API Key or Microsoft Entra ID |
| Rate Limits | Per organization | Per deployment |
| File Storage | Global | Regional |
| Compliance | OpenAI's policies | Azure compliance controls |
| Models | All OpenAI models | Deployed models only |
| Billing | OpenAI account | Azure subscription |

## Switching Between OpenAI and Azure OpenAI

To switch between OpenAI and Azure OpenAI, simply change the configuration:

```python
# In config/openai_config.py
USE_AZURE_OPENAI = True  # Switch to Azure OpenAI
```

The appropriate client will be selected automatically based on this setting.

## Best Practices for Production Deployment

For production deployments with Azure OpenAI:

1. **Use Microsoft Entra ID Authentication**:
   ```python
   from azure.identity import DefaultAzureCredential
   from openai import AzureOpenAI
   
   client = AzureOpenAI(
       azure_endpoint=endpoint,
       azure_ad_token_provider=DefaultAzureCredential(),
       api_version=api_version
   )
   ```

2. **Implement Proper Error Handling**:
   ```python
   try:
       response = client.files.create(...)
   except openai.RateLimitError:
       # Implement exponential backoff
   except openai.APIError as e:
       # Handle API errors appropriately
   ```

3. **Set Up Monitoring and Logging**:
   ```python
   import logging
   
   logging.basicConfig(level=logging.INFO)
   logger = logging.getLogger("azure_rag")
   
   # Add Azure Application Insights monitoring
   ```

4. **Use Azure Key Vault**:
   ```python
   from azure.keyvault.secrets import SecretClient
   from azure.identity import DefaultAzureCredential
   
   # Get secrets from Azure Key Vault
   key_vault_url = "https://your-key-vault.vault.azure.net/"
   credential = DefaultAzureCredential()
   client = SecretClient(vault_url=key_vault_url, credential=credential)
   api_key = client.get_secret("AZURE-OPENAI-API-KEY").value
   ```

5. **Implement Health Checks**:
   ```python
   def check_azure_openai_health():
       try:
           # Simple API call to check health
           response = client.models.list()
           return True
       except Exception as e:
           logger.error(f"Azure OpenAI health check failed: {e}")
           return False
   ```