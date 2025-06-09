# DADM Codex Deployment Guide

## 🎯 Optimized for Linux/Codex (No Conda)

Since you mentioned not using conda on the Codex server, here's the streamlined deployment approach:

## 📁 Files for Linux Deployment

### Primary Setup Script
**Use: `setup_linux.sh`** - Optimized for Linux with venv-only
- ✅ No conda dependencies
- ✅ Uses built-in Python venv
- ✅ Faster setup process
- ✅ Fewer external dependencies

### Fallback Option
**Alternative: `setup.sh`** - Original script (works but includes conda checks)
- ⚠️ Contains conda logic (unused on Codex)
- ✅ Still works with venv as fallback

## 🚀 Quick Deployment Steps for Codex

### On Linux/Codex Server:
```bash
# 1. Make setup script executable
chmod +x setup_linux.sh

# 2. Run optimized setup
./setup_linux.sh

# 3. Verify installation
source .venv/bin/activate
dadm --help
dadm-deploy-bpmn --help
```

### For Windows Testing (Git Bash/PowerShell):
```bash
# PowerShell approach
setup_windows.bat

# Git Bash approach (if the fixed script works)
./setup_linux.sh  # Now handles both Windows and Linux paths
```

**Note**: The `setup_linux.sh` script now automatically detects whether you're on Windows (uses `.venv/Scripts/activate`) or Linux (uses `.venv/bin/activate`).

## 🔧 Manual Setup (if script fails)

```bash
# 1. Check Python version
python3 --version  # Should be 3.10+

# 2. Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 3. Upgrade pip
python -m pip install --upgrade pip

# 4. Install dependencies
pip install -r requirements.txt

# 5. Install project
pip install -e .

# 6. Test installation
python -c "import src; import scripts; import config; print('Success!')"
```

## ✅ Pre-Deployment Checklist

- [ ] Python 3.10+ available on Codex (use `./check_python_versions.sh` to verify)
- [ ] `venv` module available (built into Python)
- [ ] `pip` available
- [ ] Project files uploaded to Codex
- [ ] `setup_linux.sh` has execute permissions

### 🐍 Python Version Requirements

**Important**: Virtual environments use the same Python version that creates them. You cannot install Python 3.10 "inside" a venv.

**Solutions if Python 3.10+ is not available on Codex:**
```bash
# Check available versions first
./check_python_versions.sh

# Install Python 3.10 on Ubuntu/Debian (if needed)
sudo apt install python3.10 python3.10-venv

# The setup script will auto-detect the best Python version
./setup_linux.sh
```

See `PYTHON_VERSION_GUIDE.md` for detailed version management instructions.

## 🐧 Why This Setup is Perfect for Linux

1. **No External Dependencies**: Only uses Python built-ins
2. **Faster**: No conda installation or environment creation
3. **Simpler**: Fewer moving parts
4. **Standard**: Uses Python's recommended venv approach
5. **Portable**: Works on any Linux distribution with Python 3.10+

## 📋 Testing on Codex

Once deployed, test with:
```bash
# Activate environment
source .venv/bin/activate

# Run tests
python -m unittest discover -s tests

# Test entry points
dadm --help
dadm-deploy-bpmn --help

# Deactivate when done
deactivate
```

## 🎉 Expected Result

After running `setup_linux.sh`, you should see:
```
✅ Python version check
✅ Virtual environment created
✅ Dependencies installed  
✅ Project installed in development mode
✅ Entry points available
✅ All modules importable
```

Your DADM project will be ready to use on Codex with a clean, venv-based setup! 🚀
