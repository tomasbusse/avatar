# Ralphy Command Reference

Autonomous AI Coding Loop - runs AI agents on tasks until done.

## Quick Start for This Project

```bash
cd /Users/tomas/apps/beethoven

# Run a task file
ralphy --prd ralphy-tasks/01-category-system.md

# Run in parallel (faster)
ralphy --prd ralphy-tasks/02-seo-enhancements.md --parallel
```

## Task Files for Blog Project

| File | Status | Description |
|------|--------|-------------|
| `ralphy-tasks/01-category-system.md` | ✅ Done | Blog categories schema & UI |
| `ralphy-tasks/02-seo-enhancements.md` | Pending | JSON-LD, sitemap, metadata |
| `ralphy-tasks/03-contact-components.md` | Pending | Contact cards & floating button |
| `ralphy-tasks/04-design-polish.md` | Pending | Progress bar, share, TOC |
| `ralphy-tasks/05-grammar-content.md` | Pending | Grammar blog posts & games |
| `ralphy-tasks/06-business-content.md` | Pending | Business English content |
| `ralphy-tasks/07-related-posts.md` | Pending | Related posts & author bio |

---

## Basic Usage

```bash
# Single task
ralphy "your task description"

# Multiple tasks from file
ralphy --prd tasks.md

# Parallel execution
ralphy --prd tasks.md --parallel
```

## Setup Commands

| Command | Description |
|---------|-------------|
| `ralphy --init` | Initialize `.ralphy/` config in current project |
| `ralphy --config` | Show current configuration |
| `ralphy --add-rule "rule"` | Add a coding rule to config |

## AI Engine Selection

| Flag | Engine |
|------|--------|
| `--claude` | Claude Code (default) |
| `--opencode` | OpenCode |
| `--cursor` | Cursor Agent |
| `--codex` | Codex |
| `--qwen` | Qwen-Code |
| `--droid` | Factory Droid |
| `--model <name>` | Override model for any engine |
| `--sonnet` | Shortcut for `--claude --model sonnet` |

## Task Sources

| Flag | Description |
|------|-------------|
| `--prd <path>` | Markdown file with task list (default: PRD.md) |
| `--yaml <file>` | YAML task file |
| `--github <repo>` | Pull tasks from GitHub issues (owner/repo) |
| `--github-label <label>` | Filter GitHub issues by label |

## Execution Control

| Flag | Description |
|------|-------------|
| `--max-iterations <n>` | Max iterations per task (0 = unlimited) |
| `--max-retries <n>` | Max retries per task (default: 3) |
| `--retry-delay <n>` | Delay between retries in seconds (default: 5) |
| `--dry-run` | Show what would run without executing |

## Parallel Execution

| Flag | Description |
|------|-------------|
| `--parallel` | Run tasks in parallel using git worktrees |
| `--max-parallel <n>` | Max concurrent agents (default: 3) |
| `--no-merge` | Skip auto-merging branches after parallel run |

## Git & PR Workflow

| Flag | Description |
|------|-------------|
| `--branch-per-task` | Create isolated branch for each task |
| `--base-branch <branch>` | Base branch for PRs |
| `--create-pr` | Auto-create PR after each task |
| `--draft-pr` | Create PRs as drafts |
| `--no-commit` | Don't auto-commit changes |

## Validation Skipping

| Flag | Description |
|------|-------------|
| `--no-tests` / `--skip-tests` | Skip running tests |
| `--no-lint` / `--skip-lint` | Skip running lint |
| `--fast` | Skip both tests and lint |

## Browser Automation

| Flag | Description |
|------|-------------|
| `--browser` | Enable browser automation (agent-browser) |
| `--no-browser` | Disable browser automation |

## Other Options

| Flag | Description |
|------|-------------|
| `-v, --verbose` | Verbose output |
| `-V, --version` | Show version number |
| `-h, --help` | Display help |

---

## Examples

### Single Task
```bash
ralphy "add dark mode toggle to settings page"
```

### Multiple Tasks from PRD
```bash
ralphy --prd PLAN-vocabulary-matching-game.md
```

### Parallel with PRs
```bash
ralphy --prd tasks.md --parallel --branch-per-task --create-pr
```

### Fast Mode (skip lint/tests)
```bash
ralphy --fast "quick fix: typo in README"
```

### GitHub Issues as Tasks
```bash
ralphy --github michaelshimeles/ralphy --github-label "good first issue"
```

### Dry Run (preview)
```bash
ralphy --dry-run --prd tasks.md
```

---

## Task File Format

Create a markdown file with tasks as list items:

```markdown
# Tasks

- Add loading skeleton to dashboard
- Create error boundary component
- Add form validation to signup page
- Implement dark mode toggle
```

Or numbered:

```markdown
# Feature: User Settings

1. Add settings page route
2. Create settings form component
3. Add profile picture upload
4. Implement password change flow
```

---

## Configuration

After `ralphy --init`, edit `.ralphy/config.yaml`:

```yaml
project:
  name: "beethoven"
  language: "TypeScript"
  framework: "Next.js"

commands:
  test: "npm test"
  lint: "npm run lint"
  build: "npm run build"

rules:
  - "Use Convex for all database operations"
  - "Follow existing patterns in the codebase"
  - "Always add TypeScript types"

boundaries:
  never_touch:
    - "convex/_generated/**"
    - "*.lock"
```

---

## How It Works

1. Takes a task (single or from file)
2. Spawns Claude Code (or chosen engine)
3. Agent works on the task
4. Ralphy runs lint/tests to verify
5. If errors, feeds them back to agent
6. Loops until success or max retries
7. Moves to next task (or runs in parallel)
