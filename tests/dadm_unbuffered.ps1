# DADM Unbuffered Runner for PowerShell
# This script runs DADM with unbuffered output for proper file redirection

param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Arguments
)

# Set environment variables for unbuffered output
$env:PYTHONUNBUFFERED = "1"
$env:PYTHONIOENCODING = "utf-8"

# Run DADM with unbuffered Python
& python -u -m src.app @Arguments
