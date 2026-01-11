"""
BeethovenRLM - Core RLM wrapper for codebase analysis

Uses RLM (Recursive Language Model) to analyze large codebases
without hitting context limits.
"""

import os
import sys
import time
import json
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional, Any
from dotenv import load_dotenv

# Add the rlm package to path
RLM_PATH = Path(__file__).parent.parent.parent / "rlm"
if str(RLM_PATH) not in sys.path:
    sys.path.insert(0, str(RLM_PATH))

from rlm import RLM
from rlm.core.types import RLMChatCompletion

load_dotenv()


@dataclass
class QueryResult:
    """Result from an RLM query."""
    query: str
    answer: str
    execution_time: float
    iterations: int
    input_tokens: int
    output_tokens: int
    estimated_cost: float
    metadata: dict = field(default_factory=dict)


class BeethovenRLM:
    """
    RLM-powered codebase analyzer for Beethoven.
    
    Uses Claude Sonnet 4.5 via OpenRouter to recursively explore
    large codebases and answer complex questions.
    """
    
    # Default paths
    DEFAULT_PROJECT_ROOT = Path("/Users/tomas/apps/beethoven")
    DEFAULT_CACHE_DIR = Path("/Users/tomas/apps/beethoven/.rlm-cache")
    
    # File patterns to include/exclude
    INCLUDE_EXTENSIONS = {
        ".py", ".ts", ".tsx", ".js", ".jsx", ".json", ".md", 
        ".yaml", ".yml", ".toml", ".env.example", ".gitignore"
    }
    
    EXCLUDE_DIRS = {
        "node_modules", ".next", ".git", "venv", ".venv", "__pycache__",
        ".ruff_cache", "dist", "build", ".turbo", "coverage",
        "site-packages", ".beads", ".claude"
    }
    
    EXCLUDE_FILES = {
        "package-lock.json", "pnpm-lock.yaml", "yarn.lock",
        ".DS_Store", "tsconfig.tsbuildinfo"
    }
    
    def __init__(
        self,
        project_root: Optional[Path] = None,
        model: str = "anthropic/claude-sonnet-4.5",
        max_iterations: int = 15,
        verbose: bool = True,
    ):
        """
        Initialize BeethovenRLM.
        
        Args:
            project_root: Root directory of the project to analyze
            model: OpenRouter model ID to use
            max_iterations: Max RLM iterations per query
            verbose: Show detailed output
        """
        self.project_root = Path(project_root or self.DEFAULT_PROJECT_ROOT)
        self.cache_dir = self.DEFAULT_CACHE_DIR
        self.model = model
        self.max_iterations = max_iterations
        self.verbose = verbose
        
        # Ensure cache directory exists
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # API key from environment
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY not found in environment")
        
        self._rlm: Optional[RLM] = None
        self._codebase_context: Optional[str] = None
    
    def _get_rlm(self) -> RLM:
        """Get or create RLM instance."""
        if self._rlm is None:
            self._rlm = RLM(
                backend="openrouter",
                backend_kwargs={
                    "api_key": self.api_key,
                    "model_name": self.model,
                },
                environment="local",
                environment_kwargs={},
                max_depth=1,
                max_iterations=self.max_iterations,
                verbose=self.verbose,
            )
        return self._rlm
    
    def _load_codebase(self, refresh: bool = False) -> str:
        """
        Load the codebase into a context string.
        
        Caches the result for faster subsequent queries.
        """
        cache_file = self.cache_dir / "codebase_context.json"
        
        # Check cache
        if not refresh and cache_file.exists():
            try:
                with open(cache_file) as f:
                    cached = json.load(f)
                    # Check if cache is less than 1 hour old
                    if time.time() - cached.get("timestamp", 0) < 3600:
                        self._codebase_context = cached["context"]
                        return self._codebase_context
            except Exception:
                pass
        
        # Build fresh context
        files_content = []
        total_chars = 0
        file_count = 0
        
        for file_path in self._iter_files():
            try:
                content = file_path.read_text(encoding="utf-8", errors="ignore")
                rel_path = file_path.relative_to(self.project_root)
                
                # Format: === path/to/file.py ===\n<content>\n
                file_section = f"\n=== {rel_path} ===\n{content}\n"
                files_content.append(file_section)
                total_chars += len(file_section)
                file_count += 1
                
            except Exception as e:
                if self.verbose:
                    print(f"Warning: Could not read {file_path}: {e}")
        
        # Combine all files
        self._codebase_context = "".join(files_content)
        
        # Cache the result
        try:
            with open(cache_file, "w") as f:
                json.dump({
                    "timestamp": time.time(),
                    "context": self._codebase_context,
                    "file_count": file_count,
                    "total_chars": total_chars,
                }, f)
        except Exception:
            pass
        
        if self.verbose:
            print(f"📁 Loaded {file_count} files ({total_chars:,} chars)")
        
        return self._codebase_context
    
    def _iter_files(self):
        """Iterate over all relevant files in the project."""
        for path in self.project_root.rglob("*"):
            # Skip directories
            if path.is_dir():
                continue
            
            # Skip excluded directories
            if any(exc in path.parts for exc in self.EXCLUDE_DIRS):
                continue
            
            # Skip excluded files
            if path.name in self.EXCLUDE_FILES:
                continue
            
            # Only include relevant extensions
            if path.suffix not in self.INCLUDE_EXTENSIONS:
                continue
            
            yield path
    
    def query(self, question: str, refresh_cache: bool = False) -> QueryResult:
        """
        Query the codebase using RLM.
        
        Args:
            question: Natural language question about the codebase
            refresh_cache: Force refresh of codebase cache
            
        Returns:
            QueryResult with answer and metadata
        """
        # Load codebase context
        context = self._load_codebase(refresh=refresh_cache)
        
        # Build the full prompt
        prompt = f"""You are analyzing the Beethoven codebase - an AI-powered language teaching platform.

CODEBASE CONTEXT (explore this programmatically, don't try to read it all at once):
{context}

USER QUESTION:
{question}

INSTRUCTIONS:
1. Use the REPL to explore the codebase systematically
2. Search for relevant files using string operations
3. Extract and analyze relevant code sections
4. Provide a comprehensive answer with specific file references
5. Include code examples where helpful

When done, use FINAL(your_answer) to return your answer."""

        # Run RLM
        rlm = self._get_rlm()
        start_time = time.time()
        
        result: RLMChatCompletion = rlm.completion(prompt)
        
        execution_time = time.time() - start_time
        
        # Extract answer from result
        answer = result.response
        if isinstance(answer, tuple):
            # Handle FINAL_VAR case
            answer = f"[Variable: {answer[1]}] - See execution output above"
        
        # Calculate costs
        usage = result.usage_summary.model_usage_summaries.get(self.model, None)
        input_tokens = usage.total_input_tokens if usage else 0
        output_tokens = usage.total_output_tokens if usage else 0
        
        # Sonnet 4.5 pricing: $3/1M input, $15/1M output
        input_cost = (input_tokens / 1_000_000) * 3
        output_cost = (output_tokens / 1_000_000) * 15
        estimated_cost = input_cost + output_cost
        
        return QueryResult(
            query=question,
            answer=answer,
            execution_time=execution_time,
            iterations=usage.total_calls if usage else 0,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            estimated_cost=estimated_cost,
            metadata={
                "model": self.model,
                "project_root": str(self.project_root),
            }
        )
    
    async def aquery(self, question: str, refresh_cache: bool = False) -> QueryResult:
        """
        Async version of query (currently just wraps sync version).
        
        TODO: Implement true async when RLM supports it.
        """
        import asyncio
        return await asyncio.to_thread(self.query, question, refresh_cache)
    
    def get_codebase_stats(self) -> dict:
        """Get statistics about the indexed codebase."""
        context = self._load_codebase()
        
        # Count files by extension
        ext_counts = {}
        for path in self._iter_files():
            ext = path.suffix
            ext_counts[ext] = ext_counts.get(ext, 0) + 1
        
        return {
            "total_chars": len(context),
            "estimated_tokens": len(context) // 4,  # Rough estimate
            "file_counts": ext_counts,
            "project_root": str(self.project_root),
        }
