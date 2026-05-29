---
argument-hint: <feature>
description: Turn a feature's spec and research into its plan.md (architecture + numbered slices) and scaffold the slice files
---

Produce the Phase 2 plan for **$ARGUMENTS** from `plans/$ARGUMENTS/spec.md` and
`plans/$ARGUMENTS/research.md`.

1. Confirm the spec exists and its acceptance criteria (`AC-N`) are clear. If not, run `/spec` first.
2. If `plans/$ARGUMENTS/research.md` is missing, copy it from `plans/templates/research.md` and
   record the key decisions first.
3. Copy `plans/templates/plan.md` to `plans/$ARGUMENTS/plan.md` and fill it: overview,
   architecture (layers and responsibilities), and a breakdown into ordered, independently
   demonstrable slices.
4. For each slice, copy `plans/templates/slice.md` to `plans/$ARGUMENTS/NNN-<slug>.md` and fill
   its Context, Goal, Prerequisites, Steps, Files touched, Verification, and Done criteria.
5. List the success criteria (all `AC-N` verified, docs updated, changeset added if needed).

This is the Phase 2 step of the `spec-driven` skill, distinct from the lightweight `plan`
output style (which produces a single inline plan with no files).
