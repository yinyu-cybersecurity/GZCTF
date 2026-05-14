# GZCTF Project Guidelines

## Git Workflow

After every logical change (feature, fix, refactor), commit and push immediately following atomic commit principles:

1. **Atomic commits**: Each commit should represent one cohesive change — a single feature, a single fix, or a single refactor. Do not bundle unrelated changes together.
2. **Commit immediately after completing a change**: Do not accumulate multiple changes before committing. Once a logical unit of work is done, commit it right away.
3. **Push after every commit**: Run `git push` after each commit to keep the remote branch up to date. Do not batch pushes.

### Commit message format

Use concise, descriptive messages in English following this pattern:

- `feat(scope): description` — new feature
- `fix(scope): description` — bug fix
- `refactor(scope): description` — code restructuring
- `chore(scope): description` — tooling, config, deps

### Example flow

```
# Make a change → commit → push, then next change
git add <specific files>
git commit -m "feat(screen): integrate Ctfscreen UI design with GZCTF data backend"
git push

# Another change
git add <specific files>
git commit -m "fix(screen): add demo data fallback for empty scoreboard"
git push
```

## Project Structure

- **Backend**: `src/GZCTF/` — ASP.NET Core (C#)
- **Frontend**: `src/GZCTF/ClientApp/` — React + TypeScript + Vite
- **CTF Screen**: `src/GZCTF/ClientApp/src/components/ctf-screen/` — new scoreboard display components
- **Screen Styles**: `src/GZCTF/ClientApp/src/styles/ctf-screen/` — CTF screen CSS and Tailwind utilities

## Key Conventions

- Frontend uses Mantine UI for general components; CTF screen uses Tailwind CSS + inline styles
- SignalR hub at `/hub/monitor?game={gameId}` for real-time screen data
- `useDemoScreenData` generates mock data when no real game data is available
- Never modify Ctfscreen UI component styling — only adapt data interfaces to GZCTF backend

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->
