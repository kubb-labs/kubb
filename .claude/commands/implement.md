---
argument-hint: <feature>
description: Work a feature's slices one at a time, ticking each slice's Done criteria as it passes
---

Execute the slices for **$ARGUMENTS** from `plans/$ARGUMENTS/plan.md` and its
`NNN-<slug>.md` slice files.

1. Confirm `plans/$ARGUMENTS/plan.md` and at least one slice file exist. If not, run `/plan` first.
2. Work the slices in numbered order, one at a time. For each slice: follow its Steps, then run
   its Verification commands. Keep the slice runnable before moving on.
3. When a slice's Verification passes, tick its Done criteria in that slice file (`- [ ]` to
   `- [x]`).
4. If a slice's Verification fails, fix it or stop and report; do not check unmet criteria or
   start the next slice.
5. Once every slice's Done criteria pass, run `/verify $ARGUMENTS` for the feature-level closeout.

This is the Execute step of the `spec-driven` skill.
