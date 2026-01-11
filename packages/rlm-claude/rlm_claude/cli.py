"""
RLM-Claude CLI - Command line interface for codebase analysis

Usage:
    rlm-claude query "How does authentication work?"
    rlm-claude generate-docs
    rlm-claude index
    rlm-claude stats
"""

import click
from pathlib import Path
from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown
from rich.table import Table

console = Console()


@click.group()
@click.option("--project", "-p", default="/Users/tomas/apps/beethoven", 
              help="Project root directory")
@click.option("--verbose/--quiet", "-v/-q", default=True,
              help="Show detailed output")
@click.pass_context
def main(ctx, project: str, verbose: bool):
    """RLM-Claude: Deep codebase analysis using Recursive Language Models."""
    ctx.ensure_object(dict)
    ctx.obj["project"] = Path(project)
    ctx.obj["verbose"] = verbose


@main.command()
@click.argument("question")
@click.option("--refresh", is_flag=True, help="Refresh codebase cache")
@click.pass_context
def query(ctx, question: str, refresh: bool):
    """Query the codebase with natural language."""
    from .core import BeethovenRLM
    
    project = ctx.obj["project"]
    verbose = ctx.obj["verbose"]
    
    console.print(f"\n🔍 [bold]Querying:[/bold] {question}\n")
    
    rlm = BeethovenRLM(
        project_root=project,
        verbose=verbose,
    )
    
    result = rlm.query(question, refresh_cache=refresh)
    
    # Display result
    console.print("\n" + "=" * 60)
    console.print(Panel(
        Markdown(result.answer),
        title="[bold green]Answer[/bold green]",
        border_style="green",
    ))
    
    # Stats table
    table = Table(title="Query Stats", show_header=False)
    table.add_row("Time", f"{result.execution_time:.2f}s")
    table.add_row("Iterations", str(result.iterations))
    table.add_row("Input Tokens", f"{result.input_tokens:,}")
    table.add_row("Output Tokens", f"{result.output_tokens:,}")
    table.add_row("Est. Cost", f"${result.estimated_cost:.4f}")
    
    console.print(table)


@main.command("generate-docs")
@click.option("--output", "-o", default=None, help="Output file path")
@click.pass_context
def generate_docs(ctx, output: str):
    """Generate CLAUDE.md documentation."""
    from .generator import ClaudeMdGenerator
    
    project = ctx.obj["project"]
    verbose = ctx.obj["verbose"]
    
    console.print("\n📝 [bold]Generating CLAUDE.md...[/bold]\n")
    console.print("[dim]This may take a few minutes and cost ~$0.50[/dim]\n")
    
    generator = ClaudeMdGenerator(
        project_root=project,
        verbose=verbose,
    )
    
    output_path = Path(output) if output else None
    content = generator.generate(output_path)
    
    console.print("\n✅ [bold green]Documentation generated![/bold green]")


@main.command()
@click.option("--force", is_flag=True, help="Force re-index")
@click.pass_context
def index(ctx, force: bool):
    """Index the codebase for faster queries."""
    from .indexer import CodebaseIndexer
    
    project = ctx.obj["project"]
    
    console.print(f"\n📁 [bold]Indexing:[/bold] {project}\n")
    
    indexer = CodebaseIndexer(project)
    idx = indexer.index(force=force)
    
    console.print(f"✅ Indexed {idx.total_files} files ({idx.total_lines:,} lines)")
    
    # Show file type breakdown
    table = Table(title="Files by Type")
    table.add_column("Extension")
    table.add_column("Count", justify="right")
    
    ext_counts = {}
    for file_info in idx.files.values():
        ext = file_info.extension
        ext_counts[ext] = ext_counts.get(ext, 0) + 1
    
    for ext, count in sorted(ext_counts.items(), key=lambda x: -x[1])[:10]:
        table.add_row(ext, str(count))
    
    console.print(table)


@main.command()
@click.pass_context
def stats(ctx):
    """Show codebase statistics."""
    from .core import BeethovenRLM
    
    project = ctx.obj["project"]
    
    rlm = BeethovenRLM(project_root=project, verbose=False)
    stats = rlm.get_codebase_stats()
    
    console.print(f"\n📊 [bold]Codebase Stats:[/bold] {project}\n")
    
    table = Table(show_header=False)
    table.add_row("Total Characters", f"{stats['total_chars']:,}")
    table.add_row("Est. Tokens", f"{stats['estimated_tokens']:,}")
    table.add_row("Est. Cost (full context)", f"${stats['estimated_tokens'] * 3 / 1_000_000:.2f}")
    
    console.print(table)
    
    # File counts
    console.print("\n[bold]Files by Extension:[/bold]")
    for ext, count in sorted(stats["file_counts"].items(), key=lambda x: -x[1])[:10]:
        console.print(f"  {ext}: {count}")


@main.command()
@click.argument("pattern")
@click.pass_context
def search(ctx, pattern: str):
    """Search for files matching a pattern."""
    from .indexer import CodebaseIndexer
    
    project = ctx.obj["project"]
    
    indexer = CodebaseIndexer(project)
    indexer.index()
    
    results = indexer.search_files(pattern)
    
    if results:
        console.print(f"\n📄 [bold]Found {len(results)} files:[/bold]\n")
        for path in results[:20]:
            console.print(f"  {path}")
        if len(results) > 20:
            console.print(f"  ... and {len(results) - 20} more")
    else:
        console.print(f"\n❌ No files matching '{pattern}'")


@main.command("find-function")
@click.argument("name")
@click.pass_context
def find_function(ctx, name: str):
    """Find which file contains a function."""
    from .indexer import CodebaseIndexer
    
    project = ctx.obj["project"]
    
    indexer = CodebaseIndexer(project)
    indexer.index()
    
    path = indexer.find_function(name)
    
    if path:
        console.print(f"\n✅ Function '{name}' found in: {path}")
    else:
        console.print(f"\n❌ Function '{name}' not found")


@main.command()
@click.pass_context
def tree(ctx):
    """Show the project file tree."""
    from .indexer import CodebaseIndexer
    
    project = ctx.obj["project"]
    
    indexer = CodebaseIndexer(project)
    indexer.index()
    
    console.print(indexer.get_file_tree(max_depth=3))


if __name__ == "__main__":
    main()
