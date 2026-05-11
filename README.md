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
repotour ./repo --html --output report.html
repotour ./repo --markdown --output repotour.md
```

## Architecture

The implementation is intentionally modular:

- `walker/` reads repository metadata and respects `.gitignore`.
- `analyzers/` enrich a shared `RepoProfile`.
- `renderers/` consume `RepoProfile` and never touch the filesystem.
- `cli.ts` handles command parsing, orchestration, and output.

This keeps new analyzers cheap to add and avoids coupling presentation to repository IO.

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Current v1 Scope

- Weighted language detection by lines of code
- Heuristic framework detection
- Common manifest parsing
- Likely entrypoint detection
- Shallow import graph extraction
- Git churn hotspots from the last three months
- README section extraction
- Markdown and standalone HTML renderers
