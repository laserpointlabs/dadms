# Python Version Management for DADM on Codex

## 🐍 Understanding Python and Virtual Environments

**Important**: Virtual environments (venv) cannot install different Python versions. They use the Python version that creates them.

## 🎯 Solutions for Python 3.10+ on Codex

### Option 1: Use System Python (Recommended)
Most modern Linux systems have Python 3.10+ available:

```bash
# Check available Python versions
./check_python_versions.sh

# Use the improved setup script (auto-detects best Python version)
chmod +x setup_linux.sh
./setup_linux.sh
```

### Option 2: Install Python 3.10+ on Codex (If Needed)

#### On Ubuntu/Debian:
```bash
# Update package list
sudo apt update

# Install Python 3.10
sudo apt install python3.10 python3.10-venv python3.10-dev

# Verify installation
python3.10 --version
```

#### On CentOS/RHEL/Fedora:
```bash
# Install Python 3.10
sudo dnf install python3.10 python3.10-venv

# Or on older systems:
sudo yum install python3.10 python3.10-venv

# Verify installation
python3.10 --version
```

### Option 3: Using pyenv (Advanced)

If you have pyenv installed on Codex:

```bash
# Install Python 3.10.12
pyenv install 3.10.12

# Set as local version for DADM project
cd /path/to/dadm
pyenv local 3.10.12

# Now use setup script
./setup_linux.sh
```

## 🔧 Updated Setup Script Features

The `setup_linux.sh` script now:
- ✅ **Auto-detects** the best Python version (3.10+)
- ✅ **Prioritizes** specific versions (python3.10, python3.11, etc.)
- ✅ **Falls back** to python3 if it's 3.10+
- ✅ **Provides clear error messages** if no suitable version is found

## 📋 Version Priority Order

The script checks in this order:
1. `python3.10` (ideal for DADM requirements)
2. `python3.11` (compatible)
3. `python3.12` (compatible)
4. `python3.13` (compatible)
5. `python3` (if version >= 3.10)

## 🚀 Quick Deployment Commands

```bash
# 1. Check what Python versions are available
./check_python_versions.sh

# 2. Run the improved setup (auto-detects best Python)
chmod +x setup_linux.sh
./setup_linux.sh

# 3. Verify the environment
source .venv/bin/activate
python --version  # Should show 3.10+
```

## 🔍 Troubleshooting

### If no Python 3.10+ is found:
```bash
# Check what's available
python3 --version
python3.8 --version  # Might be too old
python3.9 --version  # Might be too old

# Install newer Python (Ubuntu example)
sudo apt install python3.10 python3.10-venv
```

### If venv creation fails:
```bash
# Install venv module
sudo apt install python3.10-venv

# Or for general python3
sudo apt install python3-venv
```

## ✅ Expected Result

After successful setup, you should see:
```
✅ Using Python: python3.10 (Python 3.10.12)
✅ Virtual environment created with Python 3.10
✅ All dependencies installed
✅ DADM ready to use
```

This ensures your DADM project runs with the exact Python version requirements on Codex! 🎯
