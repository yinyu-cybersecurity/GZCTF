# Repository Guidelines

## Project Structure & Module Organization
This repository is a fork of GZCTF for team-specific secondary development of a self-hosted CTF platform. Core code lives under `src/`. `src/GZCTF` is the main ASP.NET Core app: backend API/controllers, SignalR hubs, EF Core models/migrations, storage, and services. `src/GZCTF/ClientApp` is the Vite + React frontend, with pages in `src/pages`, shared UI in `src/components`, hooks in `src/hooks`, and locale files in `src/locales`. `src/GZCTF.Test` contains unit tests; `src/GZCTF.Integration.Test` contains API, repository, and database integration tests. `src/GZCTF.AppHost` provides local distributed dependencies such as PostgreSQL, Redis, and MinIO.

## Build, Test, and Development Commands
Run commands from `src/` unless noted.

- `dotnet restore`: restore solution dependencies.
- `dotnet build -c Release`: build backend and frontend-integrated web app.
- `dotnet run --project GZCTF/GZCTF.csproj`: run the main site locally.
- `dotnet run --project GZCTF.AppHost/GZCTF.AppHost.csproj`: start the Aspire app host with local infra.
- `dotnet test GZCTF.Test/GZCTF.Test.csproj -c Release`: run xUnit unit tests.
- `GZCTF_INTEGRATION_TEST_MODE=local dotnet test GZCTF.Integration.Test/GZCTF.Integration.Test.csproj -c Release`: run local-mode integration tests.
- `pnpm --dir GZCTF/ClientApp dev`: run the frontend dev server.
- `pnpm --dir GZCTF/ClientApp build`, `lint`, `check`, `prettier`: build, lint, type-check, and format frontend code.

## Coding Style & Naming Conventions
Backend C# uses space indentation, Allman braces, `var` only when the type is obvious, PascalCase for public members and constants, and `_camelCase` for private/internal fields. Keep nullable annotations enabled and prefer small repository/service methods. Frontend uses 2-space indentation, single quotes, no semicolons, 120-column width, sorted imports via Prettier, and Oxlint for linting. Keep React files aligned with existing page/component naming such as `GameController.cs`, `ScoreboardCalculationTests.cs`, and `pages/admin/...`.

## Testing Guidelines
Tests use xUnit with Coverlet coverage in CI. Name test files `*Tests.cs` and group them by concern: `UnitTests/*`, `Tests/Api/*`, `Tests/Repository/*`, `Tests/Database/*`. Integration tests share `IntegrationTestCollection`; do not make them rely on parallel execution. Run targeted tests before opening a PR, and include both unit and integration coverage for behavior changes.

## Commit & Pull Request Guidelines
Follow the existing Conventional Commit style: `feat:`, `fix(game):`, `style(recent_game):`, `chore(deps):`, `release:`. Keep scopes short and meaningful. Make small, atomic commits as work is completed, and push them promptly instead of batching large unrelated changes. Pull requests should explain the platform change, link the relevant issue, list commands/tests run, and include screenshots for UI/admin dashboard changes. Avoid mixing unrelated refactors with feature work.
