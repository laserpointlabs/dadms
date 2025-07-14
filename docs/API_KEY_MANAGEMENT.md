# 🔐 API Key Management & Provider Configuration

## Overview

The DADM LLM Service uses a comprehensive, secure, and extensible API key management system that follows security best practices and makes it easy to add new providers.

## 🚀 Quick Start

### 1. Run the Setup Script
```bash
cd /path/to/dadm
./setup-providers.sh
```

### 2. Configure Your Providers
The script will guide you through configuring:
- **OpenAI** (GPT-4, GPT-3.5-turbo, etc.)
- **Anthropic** (Claude 3.5 Sonnet, Haiku, etc.)
- **xAI Grok** (Grok-beta, Grok-vision)
- **Local Ollama** (llama2, mistral, codellama, etc.)

### 3. Test Configuration
```bash
# Option 1: Via setup script
./setup-providers.sh  # Choose option 6

# Option 2: Manual test
cd services/llm-service
npx ts-node src/config/providers.ts
```

## 🔧 Configuration Methods

### Method 1: Environment Variables (Recommended for Production)
```bash
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export XAI_API_KEY="xai-..."
export ENABLE_OPENAI=true
export ENABLE_ANTHROPIC=true
```

### Method 2: .env Files (Recommended for Development)
```bash
# services/llm-service/.env
OPENAI_API_KEY=sk-your-actual-key-here
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
XAI_API_KEY=xai-your-actual-key-here
ENABLE_OPENAI=true
ENABLE_ANTHROPIC=true
ENABLE_XAI_GROK=true
ENABLE_OLLAMA=true
```

### Method 3: Interactive Setup (Easiest)
```bash
./setup-providers.sh
```

## 🔒 Security Best Practices

### ✅ What the System Does Right
1. **Never commits API keys to git** (`.env` files are gitignored)
2. **Provides .env.example templates** with placeholder values
3. **Validates API keys** before enabling providers
4. **Supports environment variable override** for production
5. **Logs masked keys** (only shows first 8 and last 4 characters)
6. **Graceful degradation** when providers are unavailable

### 📋 Configuration Priority (Highest to Lowest)
1. **Environment Variables** (`process.env.OPENAI_API_KEY`)
2. **Local .env file** (`services/llm-service/.env`)
3. **Default values** (fallback configuration)

### 🛡️ Production Deployment
```bash
# Set environment variables in your deployment system
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export NODE_ENV="production"

# The system will automatically use these instead of .env files
```

## 🆕 Adding New Providers

### Step 1: Update Configuration
Edit `services/llm-service/src/config/providers.ts`:
```typescript
// Add to providers object
newprovider: {
    name: 'newprovider',
    displayName: 'New Provider',
    enabled: isProviderConfigured('newprovider', true),
    requiresApiKey: true,
    apiKey: getEnvVar('NEWPROVIDER_API_KEY'),
    baseUrl: getEnvVar('NEWPROVIDER_BASE_URL', 'https://api.newprovider.com'),
    timeout: getEnvNumber('NEWPROVIDER_TIMEOUT', 60000),
    rateLimitRPM: getEnvNumber('NEWPROVIDER_RATE_LIMIT_RPM', 1000),
    defaultModels: ['model-1', 'model-2'],
    supportedFeatures: {
        streaming: true,
        functionCalling: false,
        vision: false,
        embeddings: false
    }
}
```

### Step 2: Create Provider Class
Create `services/llm-service/src/providers/newprovider.ts`:
```typescript
import { ProviderConfig } from '../config/providers';
import { LLMProvider, ProviderRequest, ProviderResponse, Model } from '../types';

export class NewProviderProvider implements LLMProvider {
    public readonly name = 'newprovider';
    private config: ProviderConfig;

    constructor(config: ProviderConfig) {
        this.config = config;
        // Initialize your provider client here
    }

    async isAvailable(): Promise<boolean> {
        // Test provider availability
    }

    async getSupportedModels(): Promise<Model[]> {
        // Return available models
    }

    async complete(request: ProviderRequest): Promise<ProviderResponse> {
        // Implement completion logic
    }

    estimateCost(request: ProviderRequest): number {
        // Calculate estimated cost
    }
}
```

### Step 3: Register in Router
Edit `services/llm-service/src/router.ts`:
```typescript
import { NewProviderProvider } from './providers/newprovider';

// Add to initializeProviders() switch statement
case 'newprovider':
    provider = new NewProviderProvider(providerConfig);
    break;
```

### Step 4: Update Environment Template
Add to `services/llm-service/.env.example`:
```bash
# New Provider Configuration
NEWPROVIDER_API_KEY=your_newprovider_api_key_here
NEWPROVIDER_BASE_URL=https://api.newprovider.com
ENABLE_NEWPROVIDER=true
```

### Step 5: Update Setup Script
Add configuration section to `setup-providers.sh`:
```bash
configure_newprovider() {
    local env_file="$LLM_SERVICE_DIR/.env"
    
    echo -e "\n${BLUE}🔐 New Provider Configuration${NC}"
    echo "Get your API key from: https://newprovider.com/api-keys"
    
    read -p "Enter New Provider API Key: " newprovider_key
    if [[ -n "$newprovider_key" ]]; then
        update_env_var "$env_file" "NEWPROVIDER_API_KEY" "$newprovider_key"
        update_env_var "$env_file" "ENABLE_NEWPROVIDER" "true"
        print_success "New Provider configuration updated"
    fi
}
```

## 📊 Current Provider Support

| Provider | Status | Models | Features |
|----------|--------|--------|----------|
| **OpenAI** | ✅ Production Ready | GPT-4o, GPT-4, GPT-3.5-turbo | Vision, Functions, Embeddings |
| **Anthropic** | ✅ Production Ready | Claude 3.5 Sonnet, Haiku, Opus | Vision, Analysis |
| **xAI Grok** | 🧪 Beta | Grok-beta, Grok-vision | Real-time, Reasoning |
| **Local Ollama** | ✅ Production Ready | Llama2, Mistral, CodeLlama | No API key needed |

## 🔍 Troubleshooting

### Provider Not Available
```bash
# Check configuration
./setup-providers.sh  # Choose option 5

# Check logs
cd services/llm-service
npm run dev  # Look for provider initialization messages
```

### API Key Issues
```bash
# Verify API key format
echo $OPENAI_API_KEY | wc -c  # Should be 51+ characters for OpenAI

# Test API key manually
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
```

### Environment Variable Problems
```bash
# Check if variables are loaded
cd services/llm-service
node -e "require('dotenv').config(); console.log(process.env.OPENAI_API_KEY?.slice(0,8) + '...')"
```

## 🔄 Migration from Old System

### For OpenAI Users
```bash
# Old way (deprecated)
OPENAI_API_KEY=sk-... npm run dev

# New way
./setup-providers.sh  # Configure once
npm run dev           # Works automatically
```

### For Multi-Provider Users
```bash
# Now supported out of the box
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
ENABLE_OPENAI=true
ENABLE_ANTHROPIC=true
```

## 🎯 Best Practices Summary

1. **Development**: Use `.env` files and the setup script
2. **Production**: Use environment variables
3. **Security**: Never commit API keys to git
4. **Testing**: Use the built-in configuration validation
5. **Scaling**: Add new providers using the established pattern
6. **Monitoring**: Check provider availability in the UI

## 📞 Support

If you encounter issues:
1. Run `./setup-providers.sh` and choose "Test configuration"
2. Check the LLM service logs for errors
3. Verify API keys are valid and have sufficient credits
4. Ensure network connectivity to provider APIs

---

**Created:** July 14, 2025  
**Last Updated:** July 14, 2025  
**Version:** 1.0.0
