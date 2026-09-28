---
name: bookmg-project-flow
description: Implement, review, test, or deploy the Mini Reading Tracker in this workspace, applying its assignment requirements, Vue/Express/MySQL stack, Sequelize data rules, and planned JWT authentication.
---

# Mini Reading Tracker project flow

Read the root `AGENTS.md` for skill routing and `README.md` for current setup. Read
`docs/README.reading-tracker.pdf` when establishing requirements or checking coverage.
The assignment is the minimum; implement additional features when requested. Keep
skill and agent instructions in English.

## Stack and current boundaries

- Keep Vue 3 + Vite, Express 5, JavaScript ES modules, MySQL, Sequelize 6 and `mysql2`.
- Reuse `bookmg-repo-be/src/database.js` for ORM connections. Environment loading is provided by Node's `--env-file`; no additional dotenv package is needed for the current scripts.
- Inspect current source and dependencies before planning changes. Installed Sequelize does not imply that models, migrations, authentication, or business APIs already exist.
- Frontend dev requests use relative `/api` paths through the Vite proxy. Production needs its own API routing configuration.

## Assignment behavior

- Search by book title or author with pagination. Show cover, title, authors, year, and whether a book is already in the user's shelf.
- Book details include description, page count, subjects, and publication information when available. Handle missing Open Library fields explicitly rather than inventing metadata.
- Shelf entries support want-to-read, reading, and finished states, progress, integer ratings from 1 to 5 or no rating, short notes, status filters, summary counts, and removal with confirmation.
- All Open Library requests go through the backend. Use backend HTTP requests and handle upstream errors/timeouts; the frontend must not call Open Library directly.
- Shelf data is persisted in MySQL. Provide loading, empty, and error states on the client; validate inputs on the backend and return a consistent error format.
- Preserve the assignment's public HTTPS deployment, usable sample data, documented frontend/backend URLs, and seven-day availability requirement.

## Sequelize and business invariants

- Define models and associations for the actual feature. Use ORM operations for normal CRUD; avoid a generic repository layer or a second database connection helper.
- Represent schema changes reproducibly with migrations when introducing persisted business tables. Do not run destructive `sync({ force: true })` or uncontrolled schema alteration against an existing database.
- Enforce duplicate shelf entries with a database unique constraint and translate its violation to HTTP 409. For a single-user shelf use the stable Open Library work identifier; once users are introduced, uniqueness is per `(user_id, work_id)`.
- Progress must be an integer from zero through the known total page count. Decide and document how unknown page counts behave; never produce a division-by-zero percentage or infer completion from an unknown total.
- When progress equals a known positive total, mark the entry finished. Record the first reading-start date and the completion date when entering their respective states. Keep related state/date/progress changes atomic.
- Validate ratings, statuses, notes, identifiers, and writable fields at the API boundary. Do not pass an unchecked request body directly into model creation or updates.
- Use transactions for operations that must succeed together. Test constraints and persistence with an isolated test database, not the user's live shelf.

## JWT extension and authorization

JWT is the user's chosen authentication approach. Load the routed auth skill when implementing or reviewing it. The assignment itself does not require login.

- Hash passwords with a maintained password-hashing library; never store plaintext. Verify tokens with a fixed algorithm allowlist, expiration, and configured issuer/audience when used. Keep signing secrets server-side in environment configuration.
- Derive user identity from verified authentication. Scope shelf reads, writes, deletion, and statistics by the authenticated user; never trust a body/query `user_id` as proof of ownership.
- Apply role checks at the backend for features that actually need them. Client route guards are UX aids, not authorization. Do not add admin endpoints without a defined product purpose.
- Decide and document token transport, lifetime, logout, and whether refresh tokens are needed. With HttpOnly cookies, configure Secure/SameSite appropriately and protect state-changing requests from CSRF; account for the actual deployment origins.
- Return appropriate 401/403 responses, avoid leaking password/token data, and rate-limit authentication attempts. Restrict registration fields so clients cannot assign privileged roles.
- Provide a documented demo access path if login is introduced, so reviewers can still exercise the required features.

## Checks and delivery

Use the verification commands in root `AGENTS.md`. Add checks for observable behavior,
especially duplicate entries, invalid progress/ratings, automatic completion, JWT
rejection, and cross-user access. Run checks relevant to the changed code.

Use the configured Playwright MCP Edge session for live UI checks. Follow the root
browser rules and redact evidence; never invent test results.

Deploy to the user's chosen platform when deployment is requested. Confirm that the
public frontend reaches the backend and that the backend reaches MySQL; verify HTTPS,
sample data, and a persistence flow. Keep credentials out of Git. Update README with
setup, API documentation, database relationships, deployment steps, and limitations.
Do not assume authorization to publish merely because deployment is required by the
assignment.
