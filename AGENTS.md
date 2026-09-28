# Agent routing — Mini Reading Tracker

## Project context

- Requirements: `docs/README.reading-tracker.pdf`. The PDF defines the minimum deliverable; user-requested extensions are allowed. JWT authentication is an approved extension, not an implemented feature.
- Frontend: `bookmg-repo-fe`, Vue 3 + Vite. Backend: `bookmg-repo-be`, Node.js + Express 5 + MySQL through Sequelize 6 and `mysql2`.
- Keep JavaScript ES modules. TypeScript examples in imported skills do not authorize a TypeScript migration.
- Read `README.md`, the relevant source files, and the applicable skills before editing. Inspect the actual implementation rather than assuming planned features exist.
- Write all skills, agent instructions, and their supporting instruction files in English.

## Skill routing

Skills are installed locally in `.agents/skills/`. Open the referenced `SKILL.md` when its task applies; follow its relevant reference links. Do not load every skill for every task.

For project implementation, reviews, tests, and deployment, start with
[bookmg-project-flow](.agents/skills/bookmg-project-flow/SKILL.md).

| Task | Additional skill entrypoints |
| --- | --- |
| Vue components, reactivity, composables, frontend integration | [vue-best-practices](.agents/skills/vue-best-practices/SKILL.md) |
| Visual design, responsive layout, interaction and accessibility | [frontend-design](.agents/skills/frontend-design/SKILL.md) plus Vue guidance for implementation |
| Express APIs, middleware, validation, errors, external API integration | [nodejs-backend-patterns](.agents/skills/nodejs-backend-patterns/SKILL.md) |
| JWT, registration/login/logout, protected routes, roles, ownership checks | [auth-implementation-patterns](.agents/skills/auth-implementation-patterns/SKILL.md) plus backend guidance; Vue guidance when changing the client |
| Vue component tests and browser/E2E tests | [vue-testing-best-practices](.agents/skills/vue-testing-best-practices/SKILL.md) |
| MySQL models, constraints, migrations, transactions, backend tests, deployment | Project flow; backend or auth guidance only when those concerns apply |
| Branches, staging, commits, pull requests, reviews, merges | [bookmg-git-workflow](.agents/skills/bookmg-git-workflow/SKILL.md); [conventional-commit](.agents/skills/conventional-commit/SKILL.md) when preparing commit messages |
| GitHub Actions and CI checks | [bookmg-git-workflow](.agents/skills/bookmg-git-workflow/SKILL.md) and [github-actions-templates](.agents/skills/github-actions-templates/SKILL.md) |

User instructions take precedence over these project conventions. Apply imported skills within the existing stack and task scope. Their suggestions for dependency injection, TypeScript, extra frameworks, infrastructure, or dependencies are not automatic requirements.
If an imported skill mentions an uninstalled skill, use the existing project guidance and tools; install additional skills only when requested or needed for an authorized task.
The imported Conventional Commit skill's automatic commit step does not grant permission to commit. Apply the user's authorized Git scope and the project Git workflow. GitHub Actions examples must use the project's Node 22 runtime and existing scripts, not the template's older versions or nonexistent scripts.

## Working roles

These roles describe responsibilities, not a requirement to spawn agents. Use delegation only when authorized. If parallel work is requested, agree on the API contract first and assign separate files.

- **Backend:** Express APIs, Sequelize/MySQL, Open Library proxy, JWT and authorization, backend checks, deployment configuration.
- **Frontend:** Vue components, UX, client validation and API integration, frontend checks.
- **Reviewer / QA:** assignment coverage, business rules, auth and ownership boundaries, regression checks, live browser evidence.

Reuse existing code and dependencies. Keep changes focused; avoid speculative abstractions or an unused administration system. Trace callers before changing shared behavior. Preserve unrelated user changes and do not commit or push unless requested.

## Verification

- Backend database connection: `npm run db:check` in `bookmg-repo-be`; requires configured `.env` and an existing MySQL database. It does not validate business behavior.
- Frontend build: `npm run build` in `bookmg-repo-fe`.
- Existing frontend/backend proxy check: `npm run check:api` in `bookmg-repo-fe`.
- Add targeted runnable checks for new business logic and security boundaries. Use the existing Node test runner for backend tests where practical; add Vue test dependencies only when component tests need them.
- Report what actually passed, failed, or could not run. Do not treat a missing database configuration as a passing connection check.

## Live browser access

- Use `mcp__playwright` browser tools first for live website inspection and interaction. The expected session is the user's real Edge Default profile through extension mode.
- List tabs and reuse the intended tab. For a supplied URL, select its tab or navigate to that exact URL; verify the final URL/title and report redirects. Read `browser_snapshot`; use `browser_find` and screenshots when useful.
- Keep interactions within the requested scope. Publishing, sending messages, deleting live data, purchases, and marking external work complete require authorization for those actions.
- If authentication blocks access, ask the user to sign in on the real Edge tab and retry. If the bridge is unavailable, ask the user to open Edge and enable Playwright MCP Bridge; do not silently switch to a sandboxed profile.
- If connection behavior is unexpected, verify `--extension --browser msedge`. A closed transport after a configuration change requires a new Codex session or restart.
- Never inspect or expose `PLAYWRIGHT_MCP_EXTENSION_TOKEN`, cookies, or secrets. Redact sensitive URLs, account identifiers, and personal data before printing or saving browser evidence.

## Skill sources

- Vue implementation/testing: `vuejs-ai/skills`.
- Node backend/auth: `wshobson/agents`.
- Frontend design: `anthropics/skills`.
- Commit messages: `github/awesome-copilot`.
- GitHub Actions: `wshobson/agents`.
- Project and Git workflows: maintained in this repository. Keep imported skills upstream-compatible; put project-specific overrides here or in project workflows.
