---
name: deslop
description: Remove AI-generated code slop from a branch or diff. Use after writing or generating code to strip unnecessary comments, defensive checks, `any` casts, and style that does not match the surrounding file. For prose and markdown, use the humanizer skill instead.
---

# Deslop

Remove AI-generated code slop introduced in a branch so the diff reads like a human wrote it and
matches the surrounding file and this repo's conventions.

## When to use

- After writing or generating a batch of code, before opening a PR.
- When a diff shows the tells of AI generation: over-commenting, defensive scaffolding, or style
  that fights the existing file.
- Prose and user-facing markdown are out of scope. Run the `humanizer` skill over those instead.

## What to remove

- Comments a human would not add: restating what the code already says, or inconsistent with the
  comment density of the rest of the file.
- Defensive checks and `try/catch` blocks abnormal for the area, especially on trusted or
  already-validated code paths. The `security` rule puts validation at trust boundaries, not in
  internal code.
- Casts to `any` used only to bypass a type error. Fix the type instead.
- Deep nesting that early returns would flatten.
- Naming, import, or export style inconsistent with the file and the `code-style` rule.

## Guardrails

- Keep behavior unchanged unless you are fixing a clear bug.
- Prefer minimal, surgical edits over broad rewrites.
- Never remove a check that guards a real trust boundary or real error handling. When unsure
  whether a check is slop or load-bearing, leave it.
- Do not weaken types, lint rules, or tests to make the edit pass. Fix the root cause.
- After editing, run `pnpm format && pnpm lint:fix` and let the tests pass.
- Report a 1-3 sentence summary of what changed.

## Related skills

| Skill | Use for |
| --- | --- |
| [humanizer](../humanizer/SKILL.md) | Removing AI tells from prose and user-facing markdown |
