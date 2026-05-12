# repotour

> **Get oriented in any codebase in minutes, not days.**

`repotour` is a developer onboarding CLI that builds a fast, accurate mental model of any unfamiliar repository. Point it at a local directory or a GitHub URL and it answers the first-pass questions every developer asks:

- What kind of project is this?
- Where does execution begin?
- Which files should I read first?
- What frameworks, patterns, and conventions are present?
- What has been changing recently — and where is the churn?

---

## Table of Contents

- [The Problem](#the-problem)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Output Modes](#output-modes)
- [Architecture](#architecture)
- [Frontend Explorer](#frontend-explorer)
- [Development](#development)
- [Requirements](#requirements)
- [License](#license)

---

## The Problem

Joining a new project — or reviewing a third-party library — means spending hours reading files, tracing imports, and piecing together an architecture picture that should have been documented but wasn't. Onboarding is slow, orientation is manual, and the knowledge gap costs real time.

`repotour` automates the first pass. It walks the repository, enriches a canonical profile with language detection, framework heuristics, entrypoint analysis, import graph extraction, and git churn signals — then renders that profile into a readable, navigable output in whatever format you need.

---

## Features

| Feature | Description |
|---|---|
| **Language detection** | Weighted by lines of code, not file count |
| **Framework detection** | Heuristic-based identification of frameworks and conventions |
| **Entrypoint analysis** | Likely entry files surfaced with confidence reasoning |
| **Import graph** | Shallow dependency graph showing how modules relate |
| **Git churn hotspots** | Files with the most change activity over the last 3 months |
| **README extraction** | Key sections parsed and summarised |
| **Guided reading order** | Ranked list of files to read for fastest orientation |
| **Ignore-first guidance** | Low-signal paths flagged so you can skip them |
| **Multiple output formats** | Terminal, Markdown, JSON, HTML, interactive graph |
| **Interactive web explorer** | React-powered architecture and execution-flow explorer |
| **Remote GitHub support** | Analyse any public repo without cloning manually |

---

## Installation

```bash
npm install -g repotour
```

> Requires Node.js ≥ 20.

To verify:

```bash
repotour --version
```

---

## Usage

```bash
# Analyse the current directory (terminal output)
repotour .

# Analyse a local repository
repotour ./path/to/repo

# Output a JSON profile
repotour . --json --output profile.json

# Output a standalone HTML report
repotour ./repo --html --output report.html

# Launch the interactive architecture graph
repotour ./repo --interactive --output map.html

# Focus the graph on the runtime zone and suppress low-signal nodes
repotour ./repo --graph --focus runtime --ignore-low-signal

# Trace execution flow from the entrypoint
repotour ./repo --flow

# Output a Markdown summary
repotour ./repo --markdown --output repotour.md

# Launch the local interactive web explorer (local path)
repotour serve ./repo

# Launch the local interactive web explorer (GitHub shorthand — no manual clone needed)
repotour serve facebook/react
```

---

## Output Modes

| Flag | Output |
|---|---|
| *(none)* | Pretty-printed terminal summary |
| `--json` | Machine-readable `RepoProfile` JSON |
| `--markdown` | Markdown document with full profile |
| `--html` | Standalone HTML report |
| `--interactive` | Self-contained interactive HTML graph |
| `--graph` | Architecture zone graph (filterable with `--focus` and `--ignore-low-signal`) |
| `--flow` | Execution-flow trace from detected entrypoint |
| `serve` | Local web server + React explorer UI |

All file outputs accept `--output <path>`.

---

## Architecture

`repotour` is intentionally modular so that new analysis capabilities are cheap to add without touching presentation logic.

```
repotour ./repo
     │
     ▼
┌──────────┐       ┌────────────┐       ┌───────────────┐
│  walker  │────▶ |  analyzers │────▶ │    engine     │
│          │       │            │       │  (RepoProfile)│
└──────────┘       └────────────┘       └───────┬───────┘
                                                │
                              ┌─────────────────▼ ──────────────────┐
                              │            renderers                │
                              │  terminal │ markdown │ html │ graph │
                              └─────────────────────────────────────┘
```

**`walker/`** — Traverses the repository filesystem and respects `.gitignore`. Produces the raw file inventory.

**`analyzers/`** — A collection of independent enrichers (language, framework, entrypoint, imports, git, README) that each contribute to a shared `RepoProfile`.

**`engine/`** — Orchestrates the analyzers and produces the canonical `RepoProfile` JSON contract. This is the single source of truth passed downstream.

**`renderers/`** — Consume `RepoProfile` and produce output. They never touch the filesystem or know anything about how the profile was generated.

**`frontend/`** — A Vite-powered React application that provides the interactive exploration runtime, served by `repotour serve`.

**`cli.ts`** — Entry point. Handles argument parsing, orchestration, and output routing via `commander`.

This separation means the analysis engine and all UI representations are fully decoupled. The long-term product boundary is:

```
analysis engine → RepoProfile JSON → React UI runtime
```

---

## Frontend Explorer

The interactive explorer provides a live, navigable view of the repository's architecture zones, package relationships, execution flow, and timeline signals.

**Start it locally:**

```bash
# Install frontend dependencies (first time only)
npm --prefix frontend install

# Analyse a local repo and launch the explorer
repotour serve .

# Analyse a public GitHub repo (cached under ~/.repotour/cache/)
repotour serve owner/repo
```

`repotour serve` starts a local profile API and launches the Vite-powered React explorer in your browser. Remote GitHub repositories are fetched and cached under `~/.repotour/cache/` so subsequent runs are instant.

---

## Development

```bash
# Install dependencies
npm install

# Run in development mode (no build step)
npm run dev -- .

# Type-check the codebase
npm run typecheck

# Run tests
npm test

# Build the distributable
npm run build

# Build the frontend
npm run build:frontend

# Start the frontend dev server
npm run frontend:dev
```

Tests use [Vitest](https://vitest.dev/). The build pipeline uses [tsup](https://tsup.egoist.dev/) and outputs ESM with type declarations.

---

## Requirements

- **Node.js** ≥ 20
- **npm** ≥ 8
- **Git** (in `PATH`) — required for churn analysis and remote repo support

---

## License

MIT © [saicharan62](https://github.com/saicharan62)
