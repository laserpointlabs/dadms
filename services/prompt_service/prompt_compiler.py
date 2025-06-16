"""
Prompt Compilation Utilities

Handles prompt template compilation with RAG content injection and context assembly.
"""
import re
import logging
from typing import Dict, List, Any, Tuple
from datetime import datetime

from models import PromptTemplate, RAGSource, TokenInfo, CompiledPrompt

logger = logging.getLogger(__name__)

class PromptCompiler:
    """Handles prompt template compilation with RAG content injection"""
    
    # Token estimation constants (approximate)
    CHARS_PER_TOKEN = 4  # Rough estimate: 4 characters ≈ 1 token
    
    # Context window limits for different models (in tokens)
    CONTEXT_LIMITS = {
        "gpt-4": 8192,
        "gpt-4-32k": 32768,
        "gpt-4-turbo": 128000,
        "claude-3": 200000,
        "claude-3-opus": 200000,
        "default": 8192
    }
    
    def __init__(self):
        self.warning_threshold = 0.8  # Warn when using 80% of context
    
    def estimate_tokens(self, text: str) -> int:
        """
        Estimate token count for text
        
        Args:
            text: Text to estimate tokens for
            
        Returns:
            Estimated token count
        """
        if not text:
            return 0
        return max(1, len(text) // self.CHARS_PER_TOKEN)
    
    def get_context_limit_warnings(self, total_tokens: int, model: str = "default") -> List[str]:
        """
        Get warnings about context limit usage
        
        Args:
            total_tokens: Total estimated tokens
            model: Model name to check limits for
            
        Returns:
            List of warning messages
        """
        warnings = []
        limit = self.CONTEXT_LIMITS.get(model, self.CONTEXT_LIMITS["default"])
        
        usage_percent = total_tokens / limit
        
        if usage_percent > 1.0:
            warnings.append(f"⚠️ CRITICAL: Exceeds {model} context limit ({total_tokens} > {limit} tokens)")
        elif usage_percent > self.warning_threshold:
            warnings.append(f"⚠️ WARNING: Using {usage_percent:.1%} of {model} context limit ({total_tokens}/{limit} tokens)")
        elif usage_percent > 0.5:
            warnings.append(f"ℹ️ INFO: Using {usage_percent:.1%} of {model} context limit ({total_tokens}/{limit} tokens)")
        
        return warnings
    
    def format_rag_content(self, rag_contents: Dict[str, str], style: str = "documents", include_metadata: bool = True) -> str:
        """
        Format RAG content for injection into prompt
        
        Args:
            rag_contents: Dictionary of URL -> content
            style: Formatting style ('documents', 'context', 'references')
            include_metadata: Whether to include source metadata
            
        Returns:
            Formatted RAG content string
        """
        if not rag_contents:
            return ""
        
        # Filter out error content
        valid_contents = {url: content for url, content in rag_contents.items() 
                         if not content.startswith('Error:')}
        
        if not valid_contents:
            return "<!-- No valid RAG content available -->"
        
        if style == "documents":
            return self._format_as_documents(valid_contents, include_metadata)
        elif style == "context":
            return self._format_as_context(valid_contents, include_metadata)
        elif style == "references":
            return self._format_as_references(valid_contents, include_metadata)
        else:
            return self._format_as_documents(valid_contents, include_metadata)
    
    def _format_as_documents(self, contents: Dict[str, str], include_metadata: bool) -> str:
        """Format as separate documents"""
        formatted_parts = []
        
        for i, (url, content) in enumerate(contents.items(), 1):
            formatted_parts.append(f"## Reference Document {i}")
            if include_metadata:
                source_type = self._detect_source_type(url)
                formatted_parts.append(f"**Source**: {url}")
                formatted_parts.append(f"**Type**: {source_type}")
                formatted_parts.append("")
            
            formatted_parts.append(content.strip())
            formatted_parts.append("")  # Blank line between documents
        
        return "\n".join(formatted_parts)
    
    def _format_as_context(self, contents: Dict[str, str], include_metadata: bool) -> str:
        """Format as contextual information"""
        formatted_parts = ["## Contextual Information"]
        
        if include_metadata:
            formatted_parts.append(f"*The following information is provided for context (from {len(contents)} sources):*")
            formatted_parts.append("")
        
        for content in contents.values():
            formatted_parts.append(content.strip())
            formatted_parts.append("")
        
        return "\n".join(formatted_parts)
    
    def _format_as_references(self, contents: Dict[str, str], include_metadata: bool) -> str:
        """Format as reference material"""
        formatted_parts = ["## Reference Materials"]
        formatted_parts.append("")
        
        for i, (url, content) in enumerate(contents.items(), 1):
            if include_metadata:
                formatted_parts.append(f"### Reference {i}: {self._get_filename_from_url(url)}")
                formatted_parts.append(f"*Source: {url}*")
                formatted_parts.append("")
            
            formatted_parts.append(content.strip())
            formatted_parts.append("")
        
        return "\n".join(formatted_parts)
    
    def _detect_source_type(self, url: str) -> str:
        """Detect the type of source from URL"""
        if url.startswith('/'):
            return "Local file"
        elif 'github.com' in url or 'raw.githubusercontent.com' in url:
            return "GitHub repository"
        elif url.startswith(('http://', 'https://')):
            return "Remote URL"
        else:
            return "Unknown"
    
    def _get_filename_from_url(self, url: str) -> str:
        """Extract filename from URL"""
        if '/' in url:
            return url.split('/')[-1].split('?')[0]  # Remove query parameters
        return url
    
    def substitute_variables(self, template: str, variables: Dict[str, Any]) -> Tuple[str, List[str]]:
        """
        Substitute variables in template and identify any missing ones
        
        Args:
            template: Template string with {variable} placeholders
            variables: Dictionary of variable values
            
        Returns:
            Tuple of (substituted_text, missing_variables)
        """
        # Find all variables in the template
        variable_pattern = r'\{([^}]+)\}'
        template_variables = set(re.findall(variable_pattern, template))
        
        # Identify missing variables
        missing_variables = template_variables - set(variables.keys())
        
        # Substitute available variables
        result = template
        for var_name, var_value in variables.items():
            placeholder = f"{{{var_name}}}"
            result = result.replace(placeholder, str(var_value))
        
        return result, list(missing_variables)
    
    def compile_prompt(self, 
                      prompt_template: PromptTemplate, 
                      rag_contents: Dict[str, str],
                      variables: Dict[str, Any],
                      rag_injection_style: str = "documents",
                      include_metadata: bool = True) -> CompiledPrompt:
        """
        Compile a complete prompt with RAG content and variables
        
        Args:
            prompt_template: The prompt template to compile
            rag_contents: RAG content to inject
            variables: Variables to substitute
            rag_injection_style: How to format RAG content
            include_metadata: Whether to include source metadata
            
        Returns:
            Compiled prompt with all content assembled
        """
        compilation_start = datetime.now()
        
        # Format RAG content
        formatted_rag = self.format_rag_content(rag_contents, rag_injection_style, include_metadata)
        
        # Determine injection strategy
        template_text = prompt_template.template
        if "{rag_context}" in template_text:
            # Explicit RAG injection point
            template_with_rag = template_text.replace("{rag_context}", formatted_rag)
        elif formatted_rag:
            # Auto-inject at the beginning
            template_with_rag = f"{formatted_rag}\n\n---\n\n{template_text}"
        else:
            template_with_rag = template_text
        
        # Substitute variables
        final_text, missing_variables = self.substitute_variables(template_with_rag, variables)
        
        # Calculate token estimates
        prompt_tokens = self.estimate_tokens(prompt_template.template)
        rag_tokens = self.estimate_tokens(formatted_rag)
        variable_tokens = self.estimate_tokens(str(variables))
        total_tokens = self.estimate_tokens(final_text)
        
        # Generate warnings
        warnings = self.get_context_limit_warnings(total_tokens)
        if missing_variables:
            warnings.append(f"⚠️ Missing variables: {', '.join(missing_variables)}")
        
        # Count successful RAG sources
        successful_sources = []
        for url, content in rag_contents.items():
            if not content.startswith('Error:'):
                successful_sources.append({
                    "url": url,
                    "type": self._detect_source_type(url),
                    "size_chars": len(content),
                    "estimated_tokens": self.estimate_tokens(content)
                })
        
        compilation_time = (datetime.now() - compilation_start).total_seconds()
        
        # Create token info
        token_info = TokenInfo(
            estimated_tokens=total_tokens,
            character_count=len(final_text),
            token_efficiency=len(final_text) / max(total_tokens, 1)
        )
        
        # Create compiled prompt
        compiled_prompt = CompiledPrompt(
            prompt_id=prompt_template.id,
            compiled_prompt=final_text,
            template_used=prompt_template.template,
            variables_applied=variables,
            rag_content_included=len(successful_sources) > 0,
            rag_sources_used=successful_sources,
            token_info=token_info,
            compilation_metadata={
                "compilation_time_seconds": compilation_time,
                "rag_injection_style": rag_injection_style,
                "include_metadata": include_metadata,
                "total_tokens": total_tokens,
                "prompt_tokens": prompt_tokens,
                "rag_tokens": rag_tokens,
                "variable_tokens": variable_tokens,
                "warnings": warnings,
                "missing_variables": missing_variables,
                "total_rag_sources": len(rag_contents),
                "successful_rag_sources": len(successful_sources),
                "compiled_at": compilation_start.isoformat()
            }
        )
        
        return compiled_prompt
