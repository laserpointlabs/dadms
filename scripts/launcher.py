#!/usr/bin/env python3
"""
DADM Script Launcher
Simple launcher for common DADM management tasks
"""

import sys
import subprocess
from pathlib import Path

# ANSI color codes
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    CYAN = '\033[96m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header():
    print(f"{Colors.GREEN}{'=' * 60}")
    print(f"DADM Management Script Launcher")
    print(f"{'=' * 60}{Colors.ENDC}")

def print_menu():
    print(f"\n{Colors.CYAN}Available Commands:{Colors.ENDC}")
    print(f"1. {Colors.YELLOW}reset{Colors.ENDC}     - Reset databases and Docker volumes")
    print(f"2. {Colors.YELLOW}test{Colors.ENDC}      - Start services and run tests")
    print(f"3. {Colors.YELLOW}help{Colors.ENDC}      - Show this help menu")
    print(f"4. {Colors.YELLOW}quit{Colors.ENDC}      - Exit")

def run_reset_script():
    """Run the database reset script"""
    script_path = Path(__file__).parent / "reset_databases.py"
    if script_path.exists():
        subprocess.run([sys.executable, str(script_path)])
    else:
        print(f"{Colors.RED}Error: reset_databases.py not found{Colors.ENDC}")

def run_test_script():
    """Run the service test script"""
    script_path = Path(__file__).parent / "restart_and_test_services.py"
    if script_path.exists():
        subprocess.run([sys.executable, str(script_path)])
    else:
        print(f"{Colors.RED}Error: restart_and_test_services.py not found{Colors.ENDC}")

def main():
    if len(sys.argv) > 1:
        # Command line mode
        command = sys.argv[1].lower()
        
        if command == "reset":
            run_reset_script()
        elif command == "test":
            run_test_script()
        elif command in ["help", "--help", "-h"]:
            print_header()
            print_menu()
            print(f"\n{Colors.CYAN}Usage:{Colors.ENDC}")
            print(f"  python launcher.py <command>")
            print(f"  python launcher.py         (interactive mode)")
        else:
            print(f"{Colors.RED}Unknown command: {command}{Colors.ENDC}")
            print(f"Use 'python launcher.py help' to see available commands")
            sys.exit(1)
    else:
        # Interactive mode
        print_header()
        
        while True:
            print_menu()
            choice = input(f"\n{Colors.CYAN}Enter your choice (1-4 or command name): {Colors.ENDC}").strip().lower()
            
            if choice in ['1', 'reset']:
                run_reset_script()
            elif choice in ['2', 'test']:
                run_test_script()
            elif choice in ['3', 'help']:
                continue  # Menu will be shown again
            elif choice in ['4', 'quit', 'exit']:
                print(f"{Colors.GREEN}Goodbye!{Colors.ENDC}")
                break
            else:
                print(f"{Colors.RED}Invalid choice. Please try again.{Colors.ENDC}")

if __name__ == "__main__":
    main()
