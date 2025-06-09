#!/usr/bin/env python3
"""
Unbuffered wrapper for DADM to ensure proper output when redirected to files.
This script forces Python to run in unbuffered mode and ensures all output
is written immediately to the file.
"""
import sys
import os
import subprocess

def main():
    """Run DADM with unbuffered output"""
    # Get the project root directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Set environment variables for unbuffered output
    env = os.environ.copy()
    env['PYTHONUNBUFFERED'] = '1'
    env['PYTHONIOENCODING'] = 'utf-8'
    
    # Build the command to run DADM
    dadm_args = sys.argv[1:]  # Get all arguments passed to this script
    
    # Run the DADM application with unbuffered output
    cmd = [sys.executable, '-u', '-m', 'src.app'] + dadm_args
    
    try:
        # Use subprocess with unbuffered output
        process = subprocess.Popen(
            cmd,
            cwd=script_dir,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=0  # Unbuffered
        )
        
        # Read and immediately output each line
        while True:
            line = process.stdout.readline()
            if not line:
                break
            print(line, end='', flush=True)
        
        # Wait for process to complete
        return_code = process.wait()
        return return_code
        
    except KeyboardInterrupt:
        print("\nProcess interrupted by user", flush=True)
        return 1
    except Exception as e:
        print(f"Error running DADM: {e}", flush=True)
        return 1

if __name__ == "__main__":
    sys.exit(main())
