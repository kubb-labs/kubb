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

For wording and release-note conventions, follow the `changelog` skill. For the surrounding
PR checklist, follow the `pr` skill.
