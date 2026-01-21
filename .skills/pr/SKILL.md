---
name: pr
description: Rules and checklist for preparing PRs, creating changesets, and releasing packages in the monorepo.
---

# PR Skill

This skill instructs agents on PR preconditions, changeset usage, and reviewer expectations.

## When to Use

- When a user asks how to prepare a PR or what checks are required before merging
- When guiding contributors to create changesets or update the changelog

## What It Does

- Enforces the PR checklist: `format, lint, typecheck, tests`
- Instructs on creating and using changesets for version bumps
- Describes release/merge expectations and documentation updates

## Commands to Suggest

```bash
pnpm format && pnpm lint:fix
pnpm typecheck
pnpm test
pnpm changeset
```

## Checklist

- [ ] CI green (unit tests, linters, typechecks)
- [ ] Documentation updated if public behavior changed
- [ ] No secrets in the PR
- [ ] Appropriate version bump via changeset

## Related Skills

| Skill                                   | Use For                          |
|-----------------------------------------|----------------------------------|
| **[../changelog/SKILL.md](../changelog/SKILL.md)** | Update changelogs and changesets |

