#!/usr/bin/env python3
"""Simple environment cleanup utility.

This script stops running Docker services, removes volumes/images,
and clears Neo4j and Qdrant databases using ``reset_databases.py``.
"""
from pathlib import Path
import subprocess
import sys


def main() -> None:
    project_root = Path(__file__).resolve().parents[1]
    reset_script = project_root / "scripts" / "reset_databases.py"
    if not reset_script.exists():
        print("reset_databases.py not found")
        sys.exit(1)

    cmd = [sys.executable, str(reset_script), "--skip-confirmation"]
    subprocess.run(cmd, check=True)
    print("Environment cleanup complete.")


if __name__ == "__main__":
    main()
