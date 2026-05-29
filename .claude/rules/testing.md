---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
---

# Testing

How to write, run, and debug tests in this repo (Vitest).

## Authoring

- Colocate tests next to source as `*.test.ts` or `*.test.tsx` in `src`
- Test one behavior per case and name it for the expected outcome ("returns X when Y")
- Keep tests isolated and repeatable: no shared mutable state, clean up side effects in `afterEach`
- Mock external dependencies (network, filesystem, time), not internal modules
- Spy per test with `using _ = vi.spyOn(...)`, not module-level `vi.mock` + `beforeEach(mockReset)`
- Use `vi.useFakeTimers()` and `vi.setSystemTime()` for time-dependent logic
- Assert on public behavior and output, not private implementation details
- Keep unit tests fast, and reserve `pnpm test:bench` for performance-sensitive code

## Assertions

- Primitives (number, string, boolean, `null`, `undefined`): use `toBe()`
- Whole object/array/complex value: prefer `toStrictEqual(literal)` (or `toEqual`) with an explicit
  literal. It states the expected result inline and catches extra or undefined keys
- Specific behavior: use focused matchers (`toBe`, `toHaveLength`, `toContain`, single-field
  `toEqual`) or `toMatchObject({ ... })` for a partial shape. Don't snapshot these
- Large generated output only (e.g. generated source files): reserve `toMatchInlineSnapshot()` /
  `toMatchFileSnapshot()`, where a hand-maintained literal is impractical

## Running and CI

- Run all with `pnpm test`, a single test with `pnpm test "<name>"`, benchmarks with `pnpm test:bench`
- Before merging: tests pass, `pnpm typecheck` succeeds across packages, `pnpm lint` is clean
- After moving files or changing imports, run `pnpm lint && pnpm typecheck`
- For flaky tests, re-run CI and check logs for environment-specific failures
