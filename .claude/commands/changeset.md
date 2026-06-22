---
argument-hint: [patch|minor|major]
description: Create a Changeset for the current changes with the right semver bump
---

!`git diff --stat HEAD`

Create a Changeset for the changes above.

1. Determine which workspace packages are affected.
2. Choose the bump type from `$ARGUMENTS` (default `patch` when empty): `patch` for fixes,
   `minor` for backwards-compatible features, `major` for breaking changes.
3. Add a markdown file under `.changeset/` with the correct frontmatter and a concise,
   user-facing summary of what changed and why.
4. Never list `@internals/*` packages in the frontmatter. They are private and excluded from
   releases by the changeset `ignore` config, so a changeset that bumps one fails
   `changeset version`. Reference them in the summary text when relevant, but do not give them a
   `patch`, `minor`, or `major` bump.

For wording and release-note conventions, follow the `changelog` skill. For the surrounding
PR checklist, follow the `pr` skill.
