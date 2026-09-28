---
name: bookmg-git-workflow
description: Manage branches, commits, pull requests, reviews, merges, or GitHub Actions for bookmg-workspace using its GitHub Flow and Conventional Commits conventions. Use for repository workflow tasks, not ordinary source edits that do not involve Git operations.
---

# Bookmg Git workflow

Read root `AGENTS.md` and inspect `git status`, the current branch, remote, and diff
before Git mutations. Preserve unrelated changes. All workflow instructions, branch
names, commit messages, and PR descriptions are written in English.

## Branches

- `main` is the stable integration and deployment branch.
- Use a short-lived branch per coherent task: `feat/book-search`, `feat/jwt-auth`, `fix/reading-progress`, `docs/api-reference`, `chore/project-setup`, or `ci/github-actions`.
- Start new work from an up-to-date `main` when the worktree is clean. Use a fast-forward-only update so divergent history is visible. Do not discard or automatically stash user changes to switch branches.
- For existing uncommitted work on `main`, create the task branch at the current commit, keeping those changes. Do not pull into that dirty worktree before preserving the work.
- Do not introduce `develop` or release branches unless the release process actually needs them.

## Commits and authorization

- Read the relevant working and staged diffs before staging. Stage explicit paths or reviewed hunks for one logical change; exclude `.env`, credentials, browser logs, and generated artifacts.
- Run checks appropriate to that change. A commit should leave the affected feature usable; keep code and necessary tests together.
- Use Conventional Commits: `type(scope): imperative summary`. Types include `feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, and `chore`; scope is optional. Examples: `chore(db): configure Sequelize connection`, `feat(auth): add JWT login`.
- The imported `conventional-commit` skill helps format messages. Its automatic commit instructions never expand the user's authorization.
- Commit, push, open PRs, merge, and change repository settings only within the Git actions the user has authorized. Reuse authorization already provided; do not ask again for the same scope.
- Before pushing, check the destination remote and branch. Push the task branch, not directly to `main`.
- Do not amend others' commits, rewrite shared history, force-push, reset destructively, or delete unmerged work without explicit authorization for that action.

## Pull requests and merges

- Target `main`; one PR should address one coherent change. Use an English Conventional Commit title suitable for squash merging.
- Use `.github/pull_request_template.md`. Describe the problem and resulting behavior, relevant checks, and material limitations. Link an issue when one exists; do not create an issue solely to satisfy a template.
- Inspect the full PR diff and actual CI results. Fix failed checks and resolve review discussions before merging. Local checks do not prove GitHub Actions passed.
- Use squash merge to keep `main` readable, then delete the merged task branch and fast-forward the local `main` when the worktree is clean.
- For a solo repository, require PRs and checks but do not mandate approval from another person. Add reviewer requirements when another reviewer is available.

## CI and GitHub settings

- `.github/workflows/ci.yml` runs on PRs targeting `main` and pushes to `main`. Its stable required check name is `Build and API checks`.
- CI installs from both lockfiles, builds the Vue frontend, and runs the existing frontend-to-backend proxy test on Node 22. It uses explicit test URLs and does not need a developer's `.env` or production database credentials.
- Extend CI with isolated MySQL integration tests once database business logic exists. Never point CI tests at the user's working database.
- Keep token permissions minimal, set timeouts, and cancel superseded runs. Use maintained action versions; re-check official releases before updating them.
- When authorized and supported by the repository plan, protect `main`: require PRs, the existing CI check, and resolved conversations; block force-pushes and deletion. Configure squash merging and automatic deletion of merged branches.
- Inspect current repository settings before changing them. Do not change visibility or subscription to unlock protection. If authentication or plan limits block a setting, report the exact unresolved step after completing the local configuration.

Sources: [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow)
and [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
