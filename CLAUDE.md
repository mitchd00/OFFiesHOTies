# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Status

This repository is currently empty — it contains only `README.md` (which holds just the project title `OFFiesHOTies`) and a single initial commit. There is no source code, build system, dependency manifest, test suite, lint configuration, or CI setup yet.

When adding the first real code:

- Update this file with build/test/lint commands and architectural notes once they exist. Do not document tooling that has not actually been added.
- Choose and commit a language/toolchain manifest (e.g. `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`) before writing application code, so future sessions can detect the stack.
- The default development branch for Claude-authored work in this repo is `claude/add-claude-documentation-6KE7O` (per the active task); confirm the intended long-lived branch (likely `main`) with the user before opening PRs against anything else.

## Conventions Already in Effect

- GitHub MCP tooling in this environment is scoped to `mitchd00/offieshoties` — do not attempt operations against other repositories.
- Push with `git push -u origin <branch>`; after pushing, open a draft PR if one does not already exist.
