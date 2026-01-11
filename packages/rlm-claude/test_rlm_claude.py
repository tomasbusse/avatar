#!/usr/bin/env python3
"""
Test RLM-Claude integration

Run with:
    cd /Users/tomas/apps/beethoven/packages/rlm-claude
    uv run python test_rlm_claude.py
"""

import sys
from pathlib import Path

# Add packages to path
sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parent.parent / "rlm"))

from rlm_claude import BeethovenRLM, CodebaseIndexer, ask_rlm_sync


def test_indexer():
    """Test the codebase indexer."""
    print("\n" + "=" * 60)
    print("📁 Testing CodebaseIndexer...")
    print("=" * 60)
    
    indexer = CodebaseIndexer(Path("/Users/tomas/apps/beethoven"))
    idx = indexer.index()
    
    print(f"✅ Indexed {idx.total_files} files")
    print(f"   Lines: {idx.total_lines:,}")
    print(f"   Size: {idx.total_bytes / 1024 / 1024:.1f} MB")
    
    # Test search
    results = indexer.search_files("main.py")
    print(f"\n🔍 Files matching 'main.py': {len(results)}")
    for r in results[:5]:
        print(f"   - {r}")
    
    # Test function lookup
    func_file = indexer.find_function("completion")
    if func_file:
        print(f"\n🔍 Function 'completion' found in: {func_file}")
    
    return True


def test_rlm_query():
    """Test a simple RLM query."""
    print("\n" + "=" * 60)
    print("🔍 Testing RLM Query...")
    print("=" * 60)
    
    # Use sync version for simplicity
    question = "What are the main Python files in the agent folder and what do they do?"
    
    print(f"Question: {question}\n")
    
    rlm = BeethovenRLM(verbose=True)
    result = rlm.query(question)
    
    print("\n" + "-" * 40)
    print("ANSWER:")
    print("-" * 40)
    print(result.answer[:1000] + "..." if len(result.answer) > 1000 else result.answer)
    
    print(f"\n⏱️  Time: {result.execution_time:.2f}s")
    print(f"💰 Cost: ${result.estimated_cost:.4f}")
    print(f"📊 Tokens: {result.input_tokens:,} in / {result.output_tokens:,} out")
    
    return True


def test_convenience_function():
    """Test the ask_rlm_sync convenience function."""
    print("\n" + "=" * 60)
    print("🚀 Testing ask_rlm_sync()...")
    print("=" * 60)
    
    answer = ask_rlm_sync("What is the main entry point for the Beethoven agent?")
    print(f"\nAnswer: {answer[:500]}...")
    
    return True


if __name__ == "__main__":
    print("🎵 RLM-Claude Integration Tests")
    print("=" * 60)
    
    # Run tests
    tests = [
        ("Indexer", test_indexer),
        ("RLM Query", test_rlm_query),  # Costs ~$0.05
    ]
    
    results = []
    for name, test_fn in tests:
        try:
            success = test_fn()
            results.append((name, "✅" if success else "❌"))
        except Exception as e:
            print(f"\n❌ {name} failed: {e}")
            results.append((name, "❌"))
    
    print("\n" + "=" * 60)
    print("RESULTS:")
    for name, status in results:
        print(f"  {status} {name}")
    
    print("\n💡 To test RLM queries (costs ~$0.05), uncomment the test in main")
