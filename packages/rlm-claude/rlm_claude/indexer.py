"""
CodebaseIndexer - Smart indexing for efficient RLM queries

Creates structured indexes of the codebase for faster exploration:
- File tree with metadata
- Function/class index
- Import graph
- Search index
"""

import os
import re
import json
import hashlib
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import Optional, List, Dict, Set
from datetime import datetime


@dataclass
class FileInfo:
    """Information about a single file."""
    path: str
    extension: str
    size_bytes: int
    line_count: int
    last_modified: str
    content_hash: str
    
    # Code-specific metadata
    imports: List[str] = field(default_factory=list)
    exports: List[str] = field(default_factory=list)
    functions: List[str] = field(default_factory=list)
    classes: List[str] = field(default_factory=list)
    
    # Summary
    first_lines: str = ""  # First ~10 lines for quick preview


@dataclass 
class CodebaseIndex:
    """Complete index of the codebase."""
    project_root: str
    indexed_at: str
    total_files: int
    total_lines: int
    total_bytes: int
    
    files: Dict[str, FileInfo] = field(default_factory=dict)
    
    # Aggregated indexes
    imports_graph: Dict[str, List[str]] = field(default_factory=dict)
    function_index: Dict[str, str] = field(default_factory=dict)  # func_name -> file_path
    class_index: Dict[str, str] = field(default_factory=dict)
    
    def to_dict(self) -> dict:
        """Convert to JSON-serializable dict."""
        return {
            "project_root": self.project_root,
            "indexed_at": self.indexed_at,
            "total_files": self.total_files,
            "total_lines": self.total_lines,
            "total_bytes": self.total_bytes,
            "files": {k: asdict(v) for k, v in self.files.items()},
            "imports_graph": self.imports_graph,
            "function_index": self.function_index,
            "class_index": self.class_index,
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "CodebaseIndex":
        """Load from dict."""
        files = {k: FileInfo(**v) for k, v in data.get("files", {}).items()}
        return cls(
            project_root=data["project_root"],
            indexed_at=data["indexed_at"],
            total_files=data["total_files"],
            total_lines=data["total_lines"],
            total_bytes=data["total_bytes"],
            files=files,
            imports_graph=data.get("imports_graph", {}),
            function_index=data.get("function_index", {}),
            class_index=data.get("class_index", {}),
        )


class CodebaseIndexer:
    """
    Indexes a codebase for efficient RLM exploration.
    """
    
    # File patterns
    INCLUDE_EXTENSIONS = {
        ".py", ".ts", ".tsx", ".js", ".jsx", ".json", ".md",
        ".yaml", ".yml", ".toml", ".env.example"
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
        project_root: Path,
        cache_dir: Optional[Path] = None,
    ):
        self.project_root = Path(project_root)
        self.cache_dir = cache_dir or (self.project_root / ".rlm-cache")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        self._index: Optional[CodebaseIndex] = None
    
    def index(self, force: bool = False) -> CodebaseIndex:
        """
        Index the codebase.
        
        Args:
            force: Force re-indexing even if cache exists
            
        Returns:
            CodebaseIndex with all file metadata
        """
        cache_file = self.cache_dir / "codebase_index.json"
        
        # Check cache
        if not force and cache_file.exists():
            try:
                with open(cache_file) as f:
                    self._index = CodebaseIndex.from_dict(json.load(f))
                    return self._index
            except Exception:
                pass
        
        # Build new index
        files: Dict[str, FileInfo] = {}
        total_lines = 0
        total_bytes = 0
        
        function_index: Dict[str, str] = {}
        class_index: Dict[str, str] = {}
        imports_graph: Dict[str, List[str]] = {}
        
        for file_path in self._iter_files():
            try:
                rel_path = str(file_path.relative_to(self.project_root))
                content = file_path.read_text(encoding="utf-8", errors="ignore")
                lines = content.split("\n")
                
                # Basic metadata
                file_info = FileInfo(
                    path=rel_path,
                    extension=file_path.suffix,
                    size_bytes=len(content.encode("utf-8")),
                    line_count=len(lines),
                    last_modified=datetime.fromtimestamp(
                        file_path.stat().st_mtime
                    ).isoformat(),
                    content_hash=hashlib.md5(content.encode()).hexdigest()[:8],
                    first_lines="\n".join(lines[:10]),
                )
                
                # Parse code structure based on extension
                if file_path.suffix == ".py":
                    file_info.imports = self._extract_python_imports(content)
                    file_info.functions = self._extract_python_functions(content)
                    file_info.classes = self._extract_python_classes(content)
                    
                elif file_path.suffix in {".ts", ".tsx", ".js", ".jsx"}:
                    file_info.imports = self._extract_js_imports(content)
                    file_info.exports = self._extract_js_exports(content)
                    file_info.functions = self._extract_js_functions(content)
                    file_info.classes = self._extract_js_classes(content)
                
                files[rel_path] = file_info
                total_lines += len(lines)
                total_bytes += file_info.size_bytes
                
                # Build function/class indexes
                for func in file_info.functions:
                    function_index[func] = rel_path
                for cls in file_info.classes:
                    class_index[cls] = rel_path
                
                # Build imports graph
                if file_info.imports:
                    imports_graph[rel_path] = file_info.imports
                    
            except Exception as e:
                print(f"Warning: Could not index {file_path}: {e}")
        
        # Create index
        self._index = CodebaseIndex(
            project_root=str(self.project_root),
            indexed_at=datetime.now().isoformat(),
            total_files=len(files),
            total_lines=total_lines,
            total_bytes=total_bytes,
            files=files,
            imports_graph=imports_graph,
            function_index=function_index,
            class_index=class_index,
        )
        
        # Cache the index
        try:
            with open(cache_file, "w") as f:
                json.dump(self._index.to_dict(), f, indent=2)
        except Exception:
            pass
        
        return self._index
    
    def _iter_files(self):
        """Iterate over all relevant files."""
        for path in self.project_root.rglob("*"):
            if path.is_dir():
                continue
            if any(exc in path.parts for exc in self.EXCLUDE_DIRS):
                continue
            if path.name in self.EXCLUDE_FILES:
                continue
            if path.suffix not in self.INCLUDE_EXTENSIONS:
                continue
            yield path
    
    # === Python Parsing ===
    
    def _extract_python_imports(self, content: str) -> List[str]:
        """Extract import statements from Python code."""
        imports = []
        
        # import x, from x import y
        import_pattern = r'^(?:from\s+(\S+)\s+)?import\s+(.+)$'
        for match in re.finditer(import_pattern, content, re.MULTILINE):
            if match.group(1):
                imports.append(match.group(1))
            else:
                # Handle "import a, b, c"
                for name in match.group(2).split(","):
                    name = name.strip().split(" as ")[0].strip()
                    if name:
                        imports.append(name)
        
        return imports[:50]  # Limit
    
    def _extract_python_functions(self, content: str) -> List[str]:
        """Extract function names from Python code."""
        pattern = r'^(?:async\s+)?def\s+(\w+)\s*\('
        matches = re.findall(pattern, content, re.MULTILINE)
        return matches[:100]
    
    def _extract_python_classes(self, content: str) -> List[str]:
        """Extract class names from Python code."""
        pattern = r'^class\s+(\w+)\s*[:\(]'
        matches = re.findall(pattern, content, re.MULTILINE)
        return matches[:50]
    
    # === JavaScript/TypeScript Parsing ===
    
    def _extract_js_imports(self, content: str) -> List[str]:
        """Extract imports from JS/TS code."""
        imports = []
        
        # import ... from "..."
        pattern = r'import\s+.*?\s+from\s+["\']([^"\']+)["\']'
        imports.extend(re.findall(pattern, content))
        
        # require("...")
        pattern = r'require\s*\(\s*["\']([^"\']+)["\']\s*\)'
        imports.extend(re.findall(pattern, content))
        
        return imports[:50]
    
    def _extract_js_exports(self, content: str) -> List[str]:
        """Extract exports from JS/TS code."""
        exports = []
        
        # export function/const/class name
        pattern = r'export\s+(?:default\s+)?(?:function|const|class|let|var)\s+(\w+)'
        exports.extend(re.findall(pattern, content))
        
        # export { name }
        pattern = r'export\s*\{([^}]+)\}'
        for match in re.findall(pattern, content):
            for name in match.split(","):
                name = name.strip().split(" as ")[0].strip()
                if name:
                    exports.append(name)
        
        return exports[:50]
    
    def _extract_js_functions(self, content: str) -> List[str]:
        """Extract function names from JS/TS code."""
        functions = []
        
        # function name() or async function name()
        pattern = r'(?:async\s+)?function\s+(\w+)\s*\('
        functions.extend(re.findall(pattern, content))
        
        # const name = () => or const name = function
        pattern = r'(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>|function)'
        functions.extend(re.findall(pattern, content))
        
        return functions[:100]
    
    def _extract_js_classes(self, content: str) -> List[str]:
        """Extract class names from JS/TS code."""
        pattern = r'class\s+(\w+)\s*(?:extends|implements|{)'
        matches = re.findall(pattern, content)
        return matches[:50]
    
    # === Query Helpers ===
    
    def get_file_tree(self, max_depth: int = 3) -> str:
        """Get a tree representation of the codebase."""
        if not self._index:
            self.index()
        
        lines = [f"📁 {self._index.project_root}"]
        
        # Group by directory
        dirs: Dict[str, List[str]] = {}
        for path in sorted(self._index.files.keys()):
            parts = path.split("/")
            dir_path = "/".join(parts[:-1]) if len(parts) > 1 else "."
            if dir_path not in dirs:
                dirs[dir_path] = []
            dirs[dir_path].append(parts[-1])
        
        # Build tree (simplified)
        for dir_path in sorted(dirs.keys()):
            depth = dir_path.count("/") + 1
            if depth <= max_depth:
                indent = "  " * depth
                lines.append(f"{indent}📂 {dir_path}/")
                for filename in dirs[dir_path][:10]:  # Max 10 files per dir
                    lines.append(f"{indent}  📄 {filename}")
                if len(dirs[dir_path]) > 10:
                    lines.append(f"{indent}  ... and {len(dirs[dir_path]) - 10} more")
        
        return "\n".join(lines)
    
    def search_files(self, pattern: str) -> List[str]:
        """Search for files matching a pattern."""
        if not self._index:
            self.index()
        
        results = []
        pattern_lower = pattern.lower()
        
        for path in self._index.files:
            if pattern_lower in path.lower():
                results.append(path)
        
        return results
    
    def find_function(self, name: str) -> Optional[str]:
        """Find which file contains a function."""
        if not self._index:
            self.index()
        return self._index.function_index.get(name)
    
    def find_class(self, name: str) -> Optional[str]:
        """Find which file contains a class."""
        if not self._index:
            self.index()
        return self._index.class_index.get(name)
