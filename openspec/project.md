# Project Context

Describe your project's tech stack, conventions, and architecture here.

## Stack
- Language: C# (.NET 8) / TypeScript
- Framework: ASP.NET Core (backend) / React 19 + Mantine 9 + ECharts 6 (frontend)
- Package manager: pnpm (frontend)
- Build: Vite (frontend), dotnet build (backend)
- Routing: file-based via vite-plugin-pages
- Realtime: SignalR for live event/submission push
- i18n: i18next with multiple locales (zh-CN, en-US, etc.)

## Conventions
- Code style: oxlint for linting, prettier for formatting, strict TypeScript
- Testing: none currently configured
- API: generated via swagger-typescript-api from OpenAPI spec
- CSS: CSS Modules with Mantine components
