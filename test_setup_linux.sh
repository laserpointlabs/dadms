#!/bin/bash
# Linux Compatibility Test Script for setup.sh
# This script can be run on Linux to verify setup.sh works correctly

echo "🐧 Testing setup.sh Linux Compatibility"
echo "========================================"

# Test 1: Check bash syntax
echo "🔍 Checking bash syntax..."
if bash -n setup.sh; then
    echo "✅ Bash syntax check: PASSED"
else
    echo "❌ Bash syntax check: FAILED"
    exit 1
fi

# Test 2: Check required commands availability
echo ""
echo "🔍 Checking required commands..."
commands=("python3" "pip")

for cmd in "${commands[@]}"; do
    if command -v "$cmd" &>/dev/null; then
        echo "✅ $cmd: AVAILABLE"
    else
        echo "❌ $cmd: NOT AVAILABLE"
    fi
done

# Test 3: Check venv availability (built into Python)
echo ""
echo "🔍 Checking venv availability..."
if python3 -c "import venv" 2>/dev/null; then
    echo "✅ venv module: AVAILABLE (built into Python)"
else
    echo "❌ venv module: NOT AVAILABLE"
fi

# Test 4: Test Python version check (from setup.sh)
echo ""
echo "🔍 Testing Python version detection..."
if command -v python3 &>/dev/null; then
    python_version=$(python3 --version)
    echo "✅ Python detected: $python_version"
else
    echo "❌ Python3 not found"
fi

# Test 5: Test virtual environment creation (dry run)
echo ""
echo "🔍 Testing venv virtual environment creation (dry run)..."
if command -v python3 &>/dev/null && python3 -c "import venv" 2>/dev/null; then
    echo "✅ Can create venv with: python3 -m venv .venv"
    echo "✅ Can activate with: source .venv/bin/activate"
else
    echo "❌ Cannot create venv - python3 or venv module not available"
fi

echo ""
echo "📋 Linux Compatibility Test Complete"
echo "======================================"
echo "If all checks show ✅ or ⚠️ (warnings), setup.sh should work on Linux"
