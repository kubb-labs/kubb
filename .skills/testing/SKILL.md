---
name: testing
description: Testing, CI, and troubleshooting guidance for running the repository's test suite and interpreting CI failures.
---

# Testing Skill

This skill helps agents advise on running tests, meeting CI requirements, and debugging test or typecheck failures.

## When to Use

- When users ask how to run tests or debug failing CI
- When explaining what checks are required before merging

## What It Does

- Describes the test runner and CI location
- Lists the commands to run locally
- Provides troubleshooting hints for common failures

## Commands to Suggest

```bash
pnpm test                 # Run all tests
pnpm test "<test name>"  # Run a specific test
```

## Pre-merge Requirements (Agent should remind)

- All tests must pass
- `pnpm typecheck` must succeed across packages
- Linting should be clean (`pnpm lint`)

## Troubleshooting Hints

- After moving files or changing imports, run `pnpm lint && pnpm typecheck`
- For flaky tests: recommend re-running CI and checking logs for environment-specific failures
