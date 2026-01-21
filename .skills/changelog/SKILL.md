---
name: changelog
description: Automatically creates user-facing changelogs from git commits by analyzing commit history, categorizing changes, and transforming technical commits into clear, customer-friendly release notes. Turns hours of manual changelog writing into minutes of automated generation.
---

# Changelog and Versioning Skill

This skill transforms technical git commits into polished, user-facing changelogs that your customers and users will understand and appreciate.

## When to Use

- Preparing release notes for a new version
- Documenting changes for the website
- Creating or editing documentation pages
- Ensuring consistent writing style across content

## What It Does

1. **Scans Git History**: Analyzes commits from a specific time period or between versions.
2. **Categorizes Changes**: Groups commits into logical categories (`features`, `improvements`, `bug fixes`, `breaking changes`).
3. **Translates Technical → User-Friendly**: Converts developer commits into customer language.
4. **Formats Professionally**: Creates clean, structured changelog entries following Kubb conventions.
5. **Filters Noise**: Excludes internal commits (`refactor`, `test`, etc.).
6. **Follows Best Practices**: Applies changelog guidelines and your brand voice.

Kubb uses Changesets for version management and maintains a comprehensive changelog in `docs/changelog.md`.

## Changeset Workflow

### Creating a Changeset

For every PR with code changes, create a changeset:

```bash
pnpm changeset
```

**Interactive prompts:**
1. Select which packages are affected
2. Choose version bump type (major / minor / patch)
3. Write a concise summary of the changes

### Version Bump Types

| Type | Description |
| --- | --- |
| Major (breaking) | Changes that break existing functionality |
| Minor (feature) | New features that don't break existing functionality |
| Patch (fix) | Bug fixes and minor improvements |

## Changelog Format

The changelog follows a specific structure in `docs/changelog.md`.

- Use `##` for version headings (not `#`).
- Use `###` for change type sections with emoji prefixes.
- Use `####` for individual plugin names with links.


Change type:

| Category | Description |
| --- | --- |
| ✨ Features | New functionality and enhancements |
| 🐛 Bug Fixes | Bug fixes and corrections |
| 🚀 Breaking Changes | Changes that may require code updates |
| 📦 Dependencies | Package updates and dependency changes |


**Example:**

## 2.5.0

### ✨ Features

#### `plugin-ts`

Added support for generating union types with the new `unionType` option.

::: code-group
```typescript [Before]
// Generated separate types
export type PetDog = { type: 'dog'; bark: string }
export type PetCat = { type: 'cat'; meow: string }
```

```typescript [After]
export type Pet = PetDog | PetCat
```
:::

## Changelog Style

### Documenting Bug Fixes

When fixing bugs that affect user-facing behavior:

1. **Update relevant documentation**
  - Fix incorrect examples
  - Clarify ambiguous descriptions
  - Update troubleshooting guide if applicable

2. **Add to changelog** (via `pnpm changeset`)
  - Explain what was broken
  - Show correct usage
  - Link to relevant docs

3. **Consider migration notes**
  - If fix changes expected behavior
  - Add to migration guide with before/after examples

**Example:**

## Fixed incorrect enum type output

**Issue**: `enumType: 'asConst'` generated invalid TypeScript

**Fixed**: Now correctly generates:

```typescript
const petType = {
  Dog: 'dog',
  Cat: 'cat',
} as const
```


## Related Skills

For changelog, use these skills:

| Skill                                                      | Use For             |
|------------------------------------------------------------|---------------------|
| **[../documentation/SKILL.md](../documentation/SKILL.md)** | Documentation style |


## Checklist

- [ ] All code changes have corresponding documentation updates
- [ ] Frontmatter is complete and correct
- [ ] Changeset updated via `pnpm changeset` (for code changes)
- [ ] Changelog added or updated in `docs/changelog.md`


## Resources

- Changesets Documentation: https://github.com/changesets/changesets
- VitePress Markdown Extensions: https://vitepress.dev/guide/markdown
