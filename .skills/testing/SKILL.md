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

## Assertion style

Prefer `toStrictEqual` (or `toEqual`) with an explicit literal for whole-value
assertions. It states the expected result inline, catches extra or `undefined`
keys, and never drifts silently when someone runs `vitest -u`.

- Use `toStrictEqual(literal)` to assert a complete returned object/array.
- Use focused matchers (`toBe`, `toHaveLength`, `toContain`, single-field
  `toEqual`) for specific behavioral checks — don't snapshot those.
- Reserve `toMatchInlineSnapshot` / `toMatchFileSnapshot` for large generated
  output (e.g. generated source files) where hand-maintaining a literal is
  impractical — not for small/medium structured values.

## Pre-merge Requirements (Agent should remind)

- All tests must pass
- `pnpm typecheck` must succeed across packages
- Linting should be clean (`pnpm lint`)

## Troubleshooting Hints

- After moving files or changing imports, run `pnpm lint && pnpm typecheck`
- For flaky tests: recommend re-running CI and checking logs for environment-specific failures
