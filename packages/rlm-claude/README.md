# RLM-Claude: Deep Codebase Analysis for Beethoven

Recursive Language Model integration for analyzing large codebases and generating documentation.

## Features

- **Deep codebase analysis** - Query millions of tokens of code without context limits
- **CLAUDE.md generation** - Auto-generate comprehensive project documentation
- **Agent integration** - Call RLM from the Beethoven voice agent
- **CLI tools** - Quick queries from terminal

## Installation

```bash
cd /Users/tomas/apps/beethoven/packages/rlm-claude
uv sync
```

## Usage

### CLI Queries
```bash
# Simple query
python -m rlm_claude query "How does the voice pipeline work?"

# Generate CLAUDE.md
python -m rlm_claude generate-docs

# Index codebase (creates cache)
python -m rlm_claude index
```

### Python API
```python
from rlm_claude import BeethovenRLM

rlm = BeethovenRLM()

# Query the codebase
result = rlm.query("Explain the authentication flow")
print(result.answer)

# Generate documentation
docs = rlm.generate_claude_md()
```

### From Beethoven Agent
```python
from rlm_claude import BeethovenRLM

# In your agent code
async def handle_deep_question(question: str):
    rlm = BeethovenRLM()
    result = await rlm.aquery(question)
    return result.answer
```

## Architecture

```
User Query
    │
    ▼
┌─────────────────┐
│  BeethovenRLM   │  ← Orchestrates analysis
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   RLM Core      │  ← Recursive exploration
│  (Sonnet 4.5)   │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌────────┐
│ REPL  │ │ Cache  │
│ Env   │ │ Index  │
└───────┘ └────────┘
```

## Cost Estimates

| Task | Tokens | Est. Cost |
|------|--------|-----------|
| Simple query | ~10K | $0.05 |
| Complex analysis | ~50K | $0.20 |
| Full CLAUDE.md gen | ~100K | $0.50 |
