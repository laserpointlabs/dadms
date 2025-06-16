"""
RAG Resource Manager

Handles fetching and caching of RAG resources from remote and local sources.
"""
import os
import logging
import requests
import hashlib
import csv
import io
from typing import Dict, Optional, List, Tuple
from datetime import datetime, timedelta
from pathlib import Path
import json

from models import RAGSource

logger = logging.getLogger(__name__)

class RAGResourceManager:
    """Manages RAG resource fetching and caching"""
    
    def __init__(self, cache_dir: str = "rag_cache", cache_ttl_hours: int = 24):
        """
        Initialize RAG resource manager
        
        Args:
            cache_dir: Directory for caching remote resources
            cache_ttl_hours: Cache TTL in hours
        """
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        self.cache_ttl = timedelta(hours=cache_ttl_hours)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'DADM-Prompt-Service/1.0'
        })
        
        # Cache metadata file
        self.cache_metadata_file = self.cache_dir / "cache_metadata.json"
        self.cache_metadata = self._load_cache_metadata()
        
        logger.info(f"Initialized RAG resource manager with cache dir: {self.cache_dir}")
    
    def _load_cache_metadata(self) -> Dict:
        """Load cache metadata"""
        try:
            if self.cache_metadata_file.exists():
                with open(self.cache_metadata_file, 'r') as f:
                    return json.load(f)
        except Exception as e:
            logger.warning(f"Could not load cache metadata: {e}")
        return {}
    
    def _save_cache_metadata(self):
        """Save cache metadata"""
        try:
            with open(self.cache_metadata_file, 'w') as f:
                json.dump(self.cache_metadata, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Could not save cache metadata: {e}")
    
    def _get_cache_key(self, url: str) -> str:
        """Generate cache key for URL"""
        return hashlib.md5(url.encode()).hexdigest()
    
    def _get_cache_path(self, cache_key: str) -> Path:
        """Get cache file path"""
        return self.cache_dir / f"{cache_key}.txt"
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """Check if cached content is still valid"""
        if cache_key not in self.cache_metadata:
            return False
        
        cached_time = datetime.fromisoformat(self.cache_metadata[cache_key]['cached_at'])
        return datetime.now() - cached_time < self.cache_ttl
    
    def _fetch_remote_content(self, url: str) -> Tuple[str, bool]:
        """
        Fetch content from remote URL
        
        Returns:
            Tuple of (content, success)
        """
        try:
            logger.info(f"Fetching remote content from: {url}")
            response = self.session.get(url, timeout=30)
            
            if response.status_code == 200:
                content = response.text
                logger.info(f"Successfully fetched {len(content)} characters from {url}")
                return content, True
            else:
                logger.error(f"Failed to fetch {url}: HTTP {response.status_code}")
                return f"Error: Could not fetch content (HTTP {response.status_code})", False
                
        except requests.exceptions.Timeout:
            logger.error(f"Timeout fetching {url}")
            return "Error: Request timeout", False
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error fetching {url}: {e}")
            return f"Error: {str(e)}", False
        except Exception as e:
            logger.error(f"Unexpected error fetching {url}: {e}")
            return f"Error: {str(e)}", False
    
    def _cache_content(self, url: str, content: str, success: bool):
        """Cache content to disk"""
        try:
            cache_key = self._get_cache_key(url)
            cache_path = self._get_cache_path(cache_key)
            
            # Write content to cache file
            with open(cache_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            # Update metadata
            self.cache_metadata[cache_key] = {
                'url': url,
                'cached_at': datetime.now().isoformat(),
                'success': success,
                'size': len(content)
            }
            
            self._save_cache_metadata()
            logger.debug(f"Cached content for {url} (key: {cache_key})")
            
        except Exception as e:
            logger.error(f"Failed to cache content for {url}: {e}")
    
    def _load_cached_content(self, cache_key: str) -> Optional[str]:
        """Load content from cache"""
        try:
            cache_path = self._get_cache_path(cache_key)
            if cache_path.exists():
                with open(cache_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                logger.debug(f"Loaded cached content (key: {cache_key})")
                return content
        except Exception as e:
            logger.error(f"Failed to load cached content (key: {cache_key}): {e}")
        return None
    
    def get_rag_content(self, source: RAGSource, use_cache: bool = True) -> str:
        """
        Get content for a RAG source
        
        Args:
            source: RAG source to fetch
            use_cache: Whether to use cached content
            
        Returns:
            Content string (may include error message if fetch failed)
        """
        url = source.url
        
        # Validate file type
        if not self._is_supported_file_type(url):
            error_msg = f"Unsupported file type. Supported extensions: .md, .txt, .csv"
            logger.warning(f"Unsupported file type for {url}")
            return f"Error: {error_msg}"
        
        # Handle local files
        if not source.is_remote:
            try:
                # For local files, try to read directly
                if os.path.exists(url):
                    with open(url, 'r', encoding='utf-8') as f:
                        raw_content = f.read()
                    # Process content based on file type
                    content = self._process_file_content(raw_content, url)
                    logger.debug(f"Loaded and processed local file: {url}")
                    return content
                else:
                    logger.warning(f"Local file not found: {url}")
                    return f"Error: Local file not found: {url}"
            except Exception as e:
                logger.error(f"Error reading local file {url}: {e}")
                return f"Error reading local file: {str(e)}"
        
        # Handle remote files
        cache_key = self._get_cache_key(url)
        
        # Try cache first if enabled and valid
        if use_cache and self._is_cache_valid(cache_key):
            cached_content = self._load_cached_content(cache_key)
            if cached_content is not None:
                logger.debug(f"Using cached content for {url}")
                return cached_content
        
        # Fetch fresh content
        raw_content, success = self._fetch_remote_content(url)
        
        # Process content if fetch was successful
        if success and not raw_content.startswith("Error:"):
            processed_content = self._process_file_content(raw_content, url)
        else:
            processed_content = raw_content
        
        # Cache the processed result
        self._cache_content(url, processed_content, success)
        
        return processed_content
    
    def get_rag_contents_for_prompt(self, rag_sources: List[RAGSource], use_cache: bool = True) -> Dict[str, str]:
        """
        Get content for all RAG sources in a prompt
        
        Args:
            rag_sources: List of RAG sources
            use_cache: Whether to use cached content
            
        Returns:
            Dictionary mapping source URL to content
        """
        contents = {}
        
        for source in rag_sources:
            try:
                content = self.get_rag_content(source, use_cache)
                contents[source.url] = content
            except Exception as e:
                logger.error(f"Error getting content for {source.url}: {e}")
                contents[source.url] = f"Error: {str(e)}"
        
        return contents
    
    def validate_rag_sources(self, rag_sources: List[RAGSource]) -> List[Dict[str, str]]:
        """
        Validate RAG sources and return status info
        
        Returns:
            List of validation results with url, status, and message
        """
        results = []
        
        for source in rag_sources:
            result = {
                'url': source.url,
                'type': source.type,
                'status': 'unknown',
                'message': ''
            }
            
            try:
                if source.is_remote:
                    # Test remote connectivity
                    response = self.session.head(source.url, timeout=10)
                    if response.status_code == 200:
                        result['status'] = 'accessible'
                        result['message'] = f"Remote resource accessible (HTTP {response.status_code})"
                    else:
                        result['status'] = 'error'
                        result['message'] = f"Remote resource not accessible (HTTP {response.status_code})"
                else:
                    # Test local file
                    if os.path.exists(source.url):
                        result['status'] = 'accessible'
                        result['message'] = "Local file exists"
                    else:
                        result['status'] = 'error'
                        result['message'] = "Local file not found"
            
            except Exception as e:
                result['status'] = 'error'
                result['message'] = str(e)
            
            results.append(result)
        
        return results
    
    def clear_cache(self, url: Optional[str] = None):
        """
        Clear cache for specific URL or all cache
        
        Args:
            url: Specific URL to clear, or None to clear all
        """
        try:
            if url:
                # Clear specific URL
                cache_key = self._get_cache_key(url)
                cache_path = self._get_cache_path(cache_key)
                
                if cache_path.exists():
                    cache_path.unlink()
                
                if cache_key in self.cache_metadata:
                    del self.cache_metadata[cache_key]
                    self._save_cache_metadata()
                
                logger.info(f"Cleared cache for {url}")
            else:
                # Clear all cache
                for cache_file in self.cache_dir.glob("*.txt"):
                    cache_file.unlink()
                
                self.cache_metadata.clear()
                self._save_cache_metadata()
                
                logger.info("Cleared all cache")
        
        except Exception as e:
            logger.error(f"Error clearing cache: {e}")
    
    def get_cache_info(self) -> Dict:
        """Get information about the cache"""
        total_files = len(list(self.cache_dir.glob("*.txt")))
        total_size = sum(f.stat().st_size for f in self.cache_dir.glob("*.txt"))
        
        return {
            'cache_dir': str(self.cache_dir),
            'total_files': total_files,
            'total_size_bytes': total_size,
            'cache_metadata_entries': len(self.cache_metadata),
            'cache_ttl_hours': self.cache_ttl.total_seconds() / 3600
        }
    
    def _is_supported_file_type(self, file_path_or_url: str) -> bool:
        """
        Check if the file type is supported for RAG content
        
        Args:
            file_path_or_url: File path or URL to check
            
        Returns:
            True if file type is supported
        """
        supported_extensions = {'.md', '.txt', '.csv'}
        
        # Extract file extension
        path = file_path_or_url.lower()
        
        # Handle URLs with query parameters
        if '?' in path:
            path = path.split('?')[0]
        
        # Get file extension
        for ext in supported_extensions:
            if path.endswith(ext):
                return True
        
        return False
    
    def _process_file_content(self, content: str, file_path_or_url: str) -> str:
        """
        Process file content based on file type
        
        Args:
            content: Raw file content
            file_path_or_url: File path or URL to determine processing
            
        Returns:
            Processed content suitable for RAG injection
        """
        file_path = file_path_or_url.lower()
        
        # CSV files - convert to readable format
        if file_path.endswith('.csv'):
            return self._process_csv_content(content)
        
        # TXT and MD files - use as-is with minimal processing
        elif file_path.endswith(('.txt', '.md')):
            return self._process_text_content(content)
        
        # Default processing for other files
        return content
    
    def _process_csv_content(self, content: str) -> str:
        """
        Process CSV content to make it more readable for LLMs
        
        Args:
            content: Raw CSV content
            
        Returns:
            Formatted CSV content
        """
        try:
            # Parse CSV content
            csv_reader = csv.reader(io.StringIO(content))
            rows = list(csv_reader)
            
            if not rows:
                return "Empty CSV file"
            
            # Format as table with headers
            headers = rows[0] if rows else []
            data_rows = rows[1:] if len(rows) > 1 else []
            
            # Create formatted output
            formatted_content = "## CSV Data\n\n"
            
            if headers:
                formatted_content += "### Headers:\n"
                formatted_content += " | ".join(headers) + "\n"
                formatted_content += " | ".join(["---"] * len(headers)) + "\n"
                
                # Add data rows (limit to first 20 rows to avoid token explosion)
                max_rows = min(20, len(data_rows))
                for i, row in enumerate(data_rows[:max_rows]):
                    # Pad row to match header length
                    padded_row = row + [''] * (len(headers) - len(row))
                    formatted_content += " | ".join(padded_row[:len(headers)]) + "\n"
                
                if len(data_rows) > max_rows:
                    formatted_content += f"\n*Note: Showing first {max_rows} of {len(data_rows)} data rows*\n"
            
            return formatted_content
            
        except Exception as e:
            logger.warning(f"Failed to process CSV content: {e}")
            # Fallback to raw content with simple formatting
            lines = content.strip().split('\n')
            formatted_content = "## CSV Data (Raw)\n\n```\n"
            # Limit to first 50 lines
            for line in lines[:50]:
                formatted_content += line + "\n"
            if len(lines) > 50:
                formatted_content += f"... ({len(lines) - 50} more lines)\n"
            formatted_content += "```\n"
            return formatted_content
    
    def _process_text_content(self, content: str) -> str:
        """
        Process text/markdown content
        
        Args:
            content: Raw text content
            
        Returns:
            Processed content
        """
        # Basic processing for text files
        # Remove excessive whitespace while preserving structure
        lines = content.split('\n')
        processed_lines = []
        
        for line in lines:
            # Keep line structure but trim excessive whitespace
            processed_line = line.rstrip()
            processed_lines.append(processed_line)
        
        # Remove excessive empty lines (more than 2 consecutive)
        result_lines = []
        empty_count = 0
        
        for line in processed_lines:
            if line.strip() == '':
                empty_count += 1
                if empty_count <= 2:  # Allow up to 2 consecutive empty lines
                    result_lines.append(line)
            else:
                empty_count = 0
                result_lines.append(line)
        
        return '\n'.join(result_lines)
