#!/usr/bin/env python3
"""
Daemon Manager

Utilities for managing background daemon processes including PID file management,
process monitoring, and graceful shutdown handling.
"""
import os
import sys
import json
import signal
import subprocess
import time
import logging
from pathlib import Path
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class DaemonManager:
    """
    Manager for background daemon processes
    """
    
    def __init__(self, name: str, storage_dir: Optional[str] = None):
        """
        Initialize daemon manager
        
        Args:
            name: Name of the daemon
            storage_dir: Storage directory for PID and config files
        """
        self.name = name
        
        # Set up storage directories
        if storage_dir:
            self.storage_dir = Path(storage_dir)
        else:
            self.storage_dir = Path("data") / "analysis_storage"
        
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        
        # PID and config file paths
        self.pid_file = self.storage_dir / f"{self.name}.pid"
        self.config_file = self.storage_dir / f"{self.name}.config"
        self.log_dir = Path("logs")
        self.log_dir.mkdir(exist_ok=True)
        
    def is_running(self) -> bool:
        """
        Check if daemon is currently running
        
        Returns:
            bool: True if daemon is running
        """
        if not self.pid_file.exists():
            return False
        
        try:
            with open(self.pid_file, 'r') as f:
                pid = int(f.read().strip())
            
            # Check if process exists (works on both Windows and Unix)
            if sys.platform == "win32":
                import psutil
                return psutil.pid_exists(pid)
            else:
                os.kill(pid, 0)  # Signal 0 doesn't kill, just checks existence
                return True
                
        except (FileNotFoundError, ValueError, ProcessLookupError, ImportError):
            # Clean up stale PID file
            if self.pid_file.exists():
                self.pid_file.unlink()
            return False
    
    def get_pid(self) -> Optional[int]:
        """
        Get the PID of the running daemon
        
        Returns:
            int: PID if daemon is running, None otherwise
        """
        if not self.is_running():
            return None
        
        try:
            with open(self.pid_file, 'r') as f:
                return int(f.read().strip())
        except (FileNotFoundError, ValueError):
            return None
    
    def get_config(self) -> Dict[str, Any]:
        """
        Get daemon configuration
        
        Returns:
            dict: Configuration dictionary
        """
        if not self.config_file.exists():
            return {}
        
        try:
            with open(self.config_file, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}
    
    def save_config(self, config: Dict[str, Any]):
        """
        Save daemon configuration
        
        Args:
            config: Configuration dictionary
        """
        with open(self.config_file, 'w') as f:
            json.dump(config, f, indent=2)
    
    def start_detached(
        self,
        script_path: str,
        args: list,
        log_file: Optional[str] = None
    ) -> bool:
        """
        Start daemon in detached mode
        
        Args:
            script_path: Path to the daemon script
            args: Command line arguments
            log_file: Log file path (optional)
        
        Returns:
            bool: True if started successfully
        """
        if self.is_running():
            logger.warning(f"Daemon {self.name} is already running")
            return False
        
        # Set up log file
        if not log_file:
            log_file = self.log_dir / f"{self.name}.log"
        else:
            log_file = Path(log_file)
        
        log_file.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            # Prepare command
            cmd = [sys.executable, script_path] + args
            
            # Start process in detached mode
            if sys.platform == "win32":
                # Windows: Use subprocess with detached process
                process = subprocess.Popen(
                    cmd,
                    stdout=open(log_file, 'w'),
                    stderr=subprocess.STDOUT,
                    stdin=subprocess.DEVNULL,
                    creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP
                )
            else:
                # Unix: Use subprocess with session ID
                process = subprocess.Popen(
                    cmd,
                    stdout=open(log_file, 'w'),
                    stderr=subprocess.STDOUT,
                    stdin=subprocess.DEVNULL,
                    start_new_session=True
                )
            
            # Save PID
            with open(self.pid_file, 'w') as f:
                f.write(str(process.pid))
            
            # Give process time to start
            time.sleep(1)
            
            # Verify it's still running
            if self.is_running():
                logger.info(f"Daemon {self.name} started successfully with PID {process.pid}")
                return True
            else:
                logger.error(f"Daemon {self.name} failed to start")
                return False
                
        except Exception as e:
            logger.error(f"Failed to start daemon {self.name}: {e}")
            return False
    
    def stop(self) -> bool:
        """
        Stop the running daemon
        
        Returns:
            bool: True if stopped successfully
        """
        if not self.is_running():
            logger.warning(f"Daemon {self.name} is not running")
            return True
        
        pid = self.get_pid()
        if not pid:
            return False
        
        try:
            if sys.platform == "win32":
                # Windows: Use taskkill
                subprocess.run(['taskkill', '/F', '/PID', str(pid)], 
                             check=True, capture_output=True)
            else:
                # Unix: Send SIGTERM, then SIGKILL if needed
                os.kill(pid, signal.SIGTERM)
                
                # Wait for graceful shutdown
                for _ in range(10):
                    if not self.is_running():
                        break
                    time.sleep(1)
                
                # Force kill if still running
                if self.is_running():
                    os.kill(pid, signal.SIGKILL)
            
            # Clean up PID file
            if self.pid_file.exists():
                self.pid_file.unlink()
            
            logger.info(f"Daemon {self.name} stopped successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to stop daemon {self.name}: {e}")
            return False
    
    def restart(self, script_path: str, args: list) -> bool:
        """
        Restart the daemon
        
        Args:
            script_path: Path to the daemon script
            args: Command line arguments
        
        Returns:
            bool: True if restarted successfully
        """
        logger.info(f"Restarting daemon {self.name}")
        
        # Stop if running
        if self.is_running():
            if not self.stop():
                return False
        
        # Wait a moment
        time.sleep(2)
        
        # Start again
        return self.start_detached(script_path, args)
    
    def get_status(self) -> Dict[str, Any]:
        """
        Get daemon status information
        
        Returns:
            dict: Status information
        """
        status = {
            'name': self.name,
            'running': self.is_running(),
            'pid': self.get_pid(),
            'config': self.get_config(),
            'pid_file': str(self.pid_file),
            'config_file': str(self.config_file)
        }
        
        # Add process information if running
        if status['running'] and status['pid']:
            try:
                if sys.platform == "win32":
                    import psutil
                    process = psutil.Process(status['pid'])
                    status['cpu_percent'] = process.cpu_percent()
                    status['memory_info'] = process.memory_info()._asdict()
                    status['create_time'] = process.create_time()
                else:
                    # Basic Unix process info
                    import psutil
                    process = psutil.Process(status['pid'])
                    status['cpu_percent'] = process.cpu_percent()
                    status['memory_info'] = process.memory_info()._asdict()
                    status['create_time'] = process.create_time()
            except (ImportError, Exception):
                # psutil not available or process not accessible
                pass
        
        return status
    
    def cleanup(self):
        """Clean up daemon files if process is not running"""
        if not self.is_running():
            if self.pid_file.exists():
                self.pid_file.unlink()
                logger.info(f"Cleaned up stale PID file for {self.name}")
