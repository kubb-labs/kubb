# Astro-Style Plugin Architecture — Implementation Steps

This directory contains one markdown file per migration step. Each step is scoped to be implementable as a single small PR.

## Steps

| Step | File | Description | Status |
|------|------|-------------|--------|
| 1 | [01-define-plugin.md](./01-define-plugin.md) | Introduce `definePlugin` with `KubbEvents` | ✅ Done |
| 2 | [02-generator-registration.md](./02-generator-registration.md) | Generators registered via `addGenerator()` in setup | Pending |
| 3 | [03-resolver-as-setup-call.md](./03-resolver-as-setup-call.md) | Resolver configured via `setResolver()` in setup | Pending |
| 4 | [04-this-to-params.md](./04-this-to-params.md) | Replace `this` context with parameter context | Pending |
| 5 | [05-dependencies.md](./05-dependencies.md) | Replace `pre`/`post` with `dependencies` | Pending |
| 6 | [06-migrate-plugins.md](./06-migrate-plugins.md) | Migrate all built-in plugins to `definePlugin` | Pending |
| 7 | [07-deprecate-legacy.md](./07-deprecate-legacy.md) | Deprecate `createPlugin` and internalize presets | Pending |

## Dependency Graph

```
Step 1: definePlugin ─────────────────┬──────────────────┐
         │                            │                  │
Step 2: addGenerator()                │           Step 5: dependencies
         │                            │
Step 3: setResolver()                 │
         │                            │
Step 4: this → params                 │
         │                            │
         └──────────── Step 6: Migrate plugins ──────────┘
                              │
                       Step 7: Deprecate legacy
```

## How to Use

Each step file contains:
- **Goal** — what the step achieves
- **Scope** — which files change
- **What Changes** — code examples (before/after)
- **What Does NOT Change** — explicit boundaries
- **Acceptance Criteria** — checklist for the PR
- **Test Plan** — what tests to add/verify
- **Size Estimate** — rough line count

Steps 1–5 can be developed independently (they only add new code to core). Step 6 is the main migration effort, split into sub-PRs per plugin. Step 7 is cleanup.
