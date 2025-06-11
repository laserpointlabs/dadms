#!/usr/bin/env python3
"""
Test script to verify virtual environment path detection logic
"""
import os

print("Testing virtual environment path detection...")

# Create a test venv structure
if not os.path.exists(".test_venv"):
    os.makedirs(".test_venv/Scripts", exist_ok=True)
    with open(".test_venv/Scripts/activate", "w") as f:
        f.write("# Windows activate script")

# Test the detection logic (same as in setup_linux.sh)
if os.path.exists(".test_venv/Scripts/activate"):
    print("✅ Windows path detected: .test_venv/Scripts/activate")
    venv_type = "Windows"
elif os.path.exists(".test_venv/bin/activate"):
    print("✅ Linux path detected: .test_venv/bin/activate")
    venv_type = "Linux"
else:
    print("❌ No activate script found")
    venv_type = "Unknown"

print(f"Virtual environment type: {venv_type}")

# Clean up
if os.path.exists(".test_venv"):
    import shutil
    shutil.rmtree(".test_venv")
    print("Cleaned up test environment")

print("Detection logic test completed!")
