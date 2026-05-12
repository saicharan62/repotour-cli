# repotour

`repotour` is a developer onboarding CLI for building a fast mental model of an unfamiliar repository.

It answers the practical first-pass questions:

- What kind of repo is this?
- Where does execution begin?
- Which files should I read first?
- What frameworks or conventions are present?
- What changed recently?

## Usage

```bash
repotour .
repotour . --json --output profile.json
repotour ./repo --html --output report.html
repotour ./repo --interactive --output map.html
repotour ./repo --graph --focus runtime --ignore-low-signal
repotour ./repo --flow
repotour ./repo --markdown --output repotour.md
repotour serve ./repo
repotour serve facebook/react
```

## Architecture

The implementation is intentionally modular:

- `walker/` reads repository metadata and respects `.gitignore`.
- `analyzers/` enrich a shared `RepoProfile`.
- `engine/` produces the canonical `RepoProfile` JSON contract.
- `renderers/` consume `RepoProfile` and never touch the filesystem.
- `frontend/` contains the React exploration runtime.
- `cli.ts` handles command parsing, orchestration, and output.

This keeps new analyzers cheap to add and avoids coupling presentation to repository IO.

## Frontend Runtime

The long-term product boundary is:

```text
analysis engine -> RepoProfile JSON -> React UI runtime
```

The local web app is launched with:

```bash
npm --prefix frontend install
repotour serve .
```

`repotour serve` starts a local profile API and Vite-powered React explorer. Remote GitHub shorthand and URLs are cached under `~/.repotour/cache/`.

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Current v4 Scope

- Weighted language detection by lines of code
- Heuristic framework detection
- Common manifest parsing
- Likely entrypoint detection
- Shallow import graph extraction
- Git churn hotspots from the last three months
- README section extraction
- Markdown and standalone HTML renderers
- Interactive architecture graph and execution-flow explorer
- Repo zone relationships, package map, timeline signals, and ignore-first guidance
