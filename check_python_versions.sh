#!/bin/bash
# Check Python versions available on the system
echo "🐍 Python Version Detection Script"
echo "=================================="

# Check for different Python versions
python_versions=("python3.10" "python3.11" "python3.12" "python3.13" "python3" "python")

echo "Available Python installations:"
for python_cmd in "${python_versions[@]}"; do
    if command -v "$python_cmd" &>/dev/null; then
        version=$($python_cmd --version 2>/dev/null)
        echo "✅ $python_cmd: $version"
    else
        echo "❌ $python_cmd: NOT FOUND"
    fi
done

echo ""
echo "Recommended approach for DADM:"

# Find the best Python version for DADM (3.10+)
if command -v python3.10 &>/dev/null; then
    echo "🎯 Use: python3.10 -m venv .venv"
    RECOMMENDED_PYTHON="python3.10"
elif command -v python3.11 &>/dev/null; then
    echo "🎯 Use: python3.11 -m venv .venv"
    RECOMMENDED_PYTHON="python3.11"
elif command -v python3.12 &>/dev/null; then
    echo "🎯 Use: python3.12 -m venv .venv"
    RECOMMENDED_PYTHON="python3.12"
elif command -v python3 &>/dev/null; then
    version=$(python3 --version | grep -oE '[0-9]+\.[0-9]+')
    if [[ "$version" > "3.9" ]]; then
        echo "🎯 Use: python3 -m venv .venv"
        RECOMMENDED_PYTHON="python3"
    else
        echo "⚠️  python3 version $version is too old (need 3.10+)"
    fi
else
    echo "❌ No suitable Python version found"
    exit 1
fi

echo ""
echo "Testing virtual environment creation with $RECOMMENDED_PYTHON..."
if $RECOMMENDED_PYTHON -m venv test_venv_check 2>/dev/null; then
    echo "✅ Virtual environment creation: SUCCESS"
    rm -rf test_venv_check
else
    echo "❌ Virtual environment creation: FAILED"
    echo "💡 You may need to install python3-venv package:"
    echo "   sudo apt-get install python3-venv"
fi
