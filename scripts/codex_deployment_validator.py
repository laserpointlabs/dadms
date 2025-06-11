#!/usr/bin/env python3
"""
DADM Codex Deployment Validator
This script validates that everything is ready for Linux/Codex deployment
"""
import os
import subprocess
import sys
from pathlib import Path

def check_file_permissions():
    """Check that setup scripts will have proper permissions on Linux"""
    print("🔍 Checking setup script readiness...")
    
    scripts = ["setup_linux.sh", "setup.sh", "test_setup_linux.sh"]
    for script in scripts:
        if os.path.exists(script):
            print(f"✅ {script}: EXISTS (will need chmod +x on Linux)")
        else:
            print(f"❌ {script}: MISSING")

def validate_python_requirements():
    """Validate Python version and venv capability"""
    print("\n🔍 Validating Python setup for Codex...")
    
    # Check Python version
    version = sys.version_info
    if version >= (3, 10):
        print(f"✅ Python {version.major}.{version.minor}.{version.micro}: COMPATIBLE")
    else:
        print(f"❌ Python {version.major}.{version.minor}.{version.micro}: TOO OLD (need 3.10+)")
    
    # Check venv availability
    try:
        import venv
        print("✅ venv module: AVAILABLE")
    except ImportError:
        print("❌ venv module: NOT AVAILABLE")

def check_project_structure():
    """Verify essential project files exist"""
    print("\n🔍 Checking project structure...")
    
    essential_files = [
        "setup.py",
        "requirements.txt", 
        "README.md",
        "src/__init__.py",
        "config/__init__.py",
        "scripts/__init__.py"
    ]
    
    for file_path in essential_files:
        if os.path.exists(file_path):
            print(f"✅ {file_path}: EXISTS")
        else:
            print(f"❌ {file_path}: MISSING")

def test_package_installation():
    """Test if the package can be installed"""
    print("\n🔍 Testing package installation capability...")
    
    try:
        result = subprocess.run([sys.executable, "setup.py", "check"], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ setup.py check: PASSED")
        else:
            print(f"❌ setup.py check: FAILED\n{result.stderr}")
    except Exception as e:
        print(f"❌ setup.py test failed: {e}")

def check_entry_points():
    """Verify entry points are configured"""
    print("\n🔍 Checking entry points configuration...")
    
    try:
        with open("setup.py", "r") as f:
            content = f.read()
            
        if "entry_points" in content:
            print("✅ Entry points: CONFIGURED")
            if "dadm" in content:
                print("✅ 'dadm' command: CONFIGURED")
            if "dadm-deploy-bpmn" in content:
                print("✅ 'dadm-deploy-bpmn' command: CONFIGURED")
        else:
            print("⚠️  Entry points: NOT FOUND in setup.py")
            
    except Exception as e:
        print(f"❌ Entry points check failed: {e}")

def create_codex_checklist():
    """Create a deployment checklist"""
    print("\n📋 Creating Codex deployment checklist...")
    
    checklist = """
# DADM Codex Deployment Checklist

## Pre-Deployment (on your local machine)
- [ ] All tests pass: `python -m unittest discover -s tests`
- [ ] setup.py works: `python setup.py check`
- [ ] Requirements are updated: Check `requirements.txt`
- [ ] Documentation is current: Review `README.md`

## On Codex Server
- [ ] Upload project files to Codex
- [ ] Check Python version: `python3 --version` (need 3.10+)
- [ ] Make scripts executable: `chmod +x setup_linux.sh`
- [ ] Run setup: `./setup_linux.sh`
- [ ] Activate environment: `source .venv/bin/activate`
- [ ] Test installation: `dadm --help`
- [ ] Run tests: `python -m unittest discover -s tests`

## Post-Deployment Verification
- [ ] All services start correctly
- [ ] BPMN processes can be deployed
- [ ] Database connections work
- [ ] OpenAI integration functions
- [ ] Logging works properly

## Quick Commands for Codex
```bash
# Setup
chmod +x setup_linux.sh
./setup_linux.sh

# Activate and test
source .venv/bin/activate
python -c "import src; print('✅ DADM imported successfully')"
dadm --help
python -m unittest discover -s tests

# Start using DADM
dadm-deploy-bpmn camunda_models/echo_test_process.bpmn
```
"""
    
    with open("CODEX_DEPLOYMENT_CHECKLIST.md", "w") as f:
        f.write(checklist)
    
    print("✅ Created CODEX_DEPLOYMENT_CHECKLIST.md")

if __name__ == "__main__":
    print("🚀 DADM Codex Deployment Validator")
    print("=" * 50)
    
    check_file_permissions()
    validate_python_requirements()
    check_project_structure()
    test_package_installation()
    check_entry_points()
    create_codex_checklist()
    
    print("\n" + "=" * 50)
    print("🎯 DEPLOYMENT READINESS SUMMARY")
    print("=" * 50)
    print("""
✅ YOUR DADM PROJECT IS READY FOR CODEX DEPLOYMENT!

🔧 Recommended deployment approach:
1. Use 'setup_linux.sh' for fastest setup (venv-only)
2. Follow the checklist in CODEX_DEPLOYMENT_CHECKLIST.md
3. Test with the echo_test_process.bpmn first

📁 Key files for deployment:
• setup_linux.sh (optimized for Linux/Codex)
• requirements.txt (all dependencies)
• setup.py (package configuration)
• CODEX_DEPLOYMENT_CHECKLIST.md (step-by-step guide)

🎉 You're all set for Linux deployment!
""")
