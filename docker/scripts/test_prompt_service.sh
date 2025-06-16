#!/bin/bash

# Test script for DADM Prompt Service in Docker
echo "🧪 Testing DADM Prompt Service in Docker"
echo "=========================================="

# Wait for services to be ready
echo "⏳ Waiting for services to start up..."
sleep 10

# Test 1: Health Check
echo "1️⃣ Testing health endpoint..."
curl -s http://localhost:5300/health | head -1
if [ $? -eq 0 ]; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
fi

# Test 2: List prompts
echo -e "\n2️⃣ Testing prompt listing..."
PROMPT_COUNT=$(curl -s http://localhost:5300/prompts | jq -r '.count // 0')
if [ "$PROMPT_COUNT" -gt 0 ]; then
    echo "✅ Found $PROMPT_COUNT prompts"
else
    echo "❌ No prompts found"
fi

# Test 3: Service discovery via Consul
echo -e "\n3️⃣ Testing Consul service discovery..."
CONSUL_SERVICE=$(curl -s http://localhost:8500/v1/health/service/dadm-prompt-service | jq -r '.[0].Service.Service // "not-found"')
if [ "$CONSUL_SERVICE" = "dadm-prompt-service" ]; then
    echo "✅ Service registered with Consul"
else
    echo "❌ Service not found in Consul"
fi

# Test 4: Test compilation (if business_analysis_prompt exists)
echo -e "\n4️⃣ Testing prompt compilation..."
COMPILE_RESULT=$(curl -s -X POST http://localhost:5300/prompt/business_analysis_prompt/compile \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "project_name": "Docker Test Project",
      "analysis_focus": "containerization and deployment"
    },
    "include_rag": true,
    "max_tokens": 2000
  }' | jq -r '.status // "failed"')

if [ "$COMPILE_RESULT" = "success" ]; then
    echo "✅ Prompt compilation successful"
else
    echo "❌ Prompt compilation failed"
fi

echo -e "\n🎉 Testing completed!"
echo "📊 View service docs at: http://localhost:5300/docs"
echo "🔍 Monitor services at: http://localhost:5200"
echo "🗂️  Consul UI at: http://localhost:8500"
