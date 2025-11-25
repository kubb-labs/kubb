# Agents

Purpose

This repository uses automated agents (AI assistants, Dependabot, CI bots, etc.) to help with code, documentation, and dependency management. This document explains which agents are commonly used, how their contributions should be reviewed, and the expectations for maintainers when accepting changes produced by an agent.

Which agents we use

- GitHub Dependabot: automatic dependency updates.
- GitHub Actions: CI/CD workflows and automated release workflows.
- AI assistants (Copilot / copilot): used by contributors when drafting code or docs. These are not autonomous contributors — humans are ultimately responsible for content.
- Other bots (labeler, stale bot, etc.) as configured in .github/workflows or .github/*.

How we treat agent contributions

- Treat agent-generated content like any other contribution: review for correctness, security, license, and style.
- For dependency updates (Dependabot): verify CI passes, review changelog / release notes for breaking changes, and run a local smoke test if necessary.
- For AI-assisted code or docs: ensure a human reviewer validates the changes. Do not accept changes that introduce unclear intent, security issues, or licensing problems.

Review checklist for agent-created PRs

- Does CI pass? (unit tests, linters, type checks)
- Is the change small and well-scoped?
- Are there any secrets, tokens, or sensitive data accidentally added?
- Are dependency updates pinned to safe versions and tested?
- Documentation: is the content accurate, and does it match the repository's docs conventions?
- If AI-assisted: check for hallucinated facts, incorrect code assumptions, or missing context.

Security and secrets

- Agents must never commit secrets or credentials.
- If an agent PR contains secrets, immediately close the PR and rotate any exposed secrets.
- Use repository secrets and Actions masked variables for CI.

When to approve and merge

- Approve only when the review checklist is satisfied.
- Prefer squash merging small, single-purpose agent PRs.
- For larger updates, consider a staged roll-out or an incremental approach.

Questions

If you have questions about an agent's change or want to adjust repository agent settings, open an issue or contact the maintainers.
