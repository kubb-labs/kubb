---
argument-hint: <feature>
description: Draft or refine the Phase 0 spec (requirements + acceptance criteria) for a feature
---

Write the specification for: **$ARGUMENTS**

Copy `plans/templates/spec.md` to `plans/$ARGUMENTS/spec.md` and fill it in.

1. Restate the problem, who it is for, and the intended outcome.
2. List functional requirements as `FR-N` (behavior, not implementation).
3. Define acceptance criteria as `AC-N`, each observable and testable, mapped to an `FR-N`.
4. Note the main entities/data and what is explicitly out of scope.

Keep it implementation-free. Ask for any missing decisions rather than guessing. This is the
Phase 0 step of the `spec-driven` skill.
