"""
RAG Resource Manager

Handles fetching and caching of RAG resources from remote and local sources.
"""
import os
import logging
import requests
import hashlib
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
        
        # Handle local files
        if not source.is_remote:
            try:
                # For local files, try to read directly
                if os.path.exists(url):
                    with open(url, 'r', encoding='utf-8') as f:
                        content = f.read()
                    logger.debug(f"Loaded local file: {url}")
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
        content, success = self._fetch_remote_content(url)
        
        # Cache the result
        self._cache_content(url, content, success)
        
        return content
    
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
