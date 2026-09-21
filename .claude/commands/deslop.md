---
argument-hint: [path]
description: Remove AI-generated code slop from the current branch's changes
---

!`git diff --stat HEAD`

Remove AI-generated code slop from the changes on this branch.

1. Review the branch's changes: the diff against the default branch, narrowed to `$ARGUMENTS`
   when a path or glob is given.
2. Strip the AI tells: unnecessary or inconsistent comments, defensive checks and `try/catch` on
   trusted code paths, `any` casts that only dodge a type error, and deep nesting that early
   returns would flatten.
3. Keep behavior unchanged unless fixing a clear bug. Make minimal, surgical edits and do not
   weaken types, lint rules, or tests.
4. Run `pnpm format && pnpm lint:fix` and report a 1-3 sentence summary.

Follow the `deslop` skill for the full checklist. For prose and user-facing markdown, use the
`humanizer` skill instead.
