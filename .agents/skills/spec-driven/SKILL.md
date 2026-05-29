---
name: spec-driven
description: "Drive a spec-driven workflow for a larger feature: specify requirements and acceptance criteria, research decisions, plan numbered slices, implement, then verify. Use for multi-step features that need a reviewable paper trail. Skip it for small, obvious changes."
---

# Spec-driven development

A structured workflow for features big enough to warrant a paper trail. Each feature gets its
own folder `plans/<feature>/`. Blank templates live in `plans/templates/`, and the `/spec`,
`/plan`, and `/verify` commands copy them in. For small, obvious changes, use the lightweight
`plan` output style instead (a single inline plan, no files).

## Phases

1. **Specify** (`plans/<feature>/spec.md`): capture requirements (`FR-N`) and acceptance
   criteria (`AC-N`). Describe behavior and outcomes, not code. Run `/spec <feature>`.
2. **Research** (`plans/<feature>/research.md`): record decisions with their reasoning, open
   questions, and operating constraints.
3. **Plan** (`plans/<feature>/plan.md`): the architecture and a breakdown into numbered slices,
   each demonstrable on its own. Run `/plan <feature>`. Scaffold each slice from
   `plans/templates/slice.md` into `plans/<feature>/NNN-<slug>.md`.
4. **Execute** (`plans/<feature>/NNN-<slug>.md`): implement one slice at a time, ticking each
   slice's Done criteria as its verification passes, and keep each slice runnable. Run
   `/implement <feature>`.
5. **Verify** (`plans/<feature>/verification.md`): walk end-to-end scenarios, each mapped back
   to an `AC-N`. Run `/verify <feature>`.

## Rules

- Write the spec before the plan, and the plan before code.
- Every acceptance criterion (`AC-N`) must have a matching verification scenario.
- Keep slices small and independently demonstrable, one concern each.
- See `plans/README.md` for the file roles and the per-feature layout.
