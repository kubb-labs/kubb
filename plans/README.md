# Plans

A spec-driven workflow for larger features: write down what you are building and how you will
know it works before you write code, then implement in small, demonstrable slices. For small,
obvious changes, skip this and use the lightweight `plan` output style instead (a single inline
plan, no files).

## Layout

Each feature gets its own folder. Shared blank templates live in `templates/`.

```
plans/
├── README.md
├── templates/            # blank templates, copied per feature
│   ├── spec.md
│   ├── research.md
│   ├── plan.md
│   ├── verification.md
│   └── slice.md
└── <feature>/            # one folder per plan
    ├── spec.md
    ├── research.md
    ├── plan.md
    ├── verification.md
    └── NNN-<slug>.md      # one per slice, copied from templates/slice.md
```

## Phases

| Phase | File | Role |
| ----- | ---- | ---- |
| 0 Specify | `<feature>/spec.md` | Requirements (`FR-N`) and acceptance criteria (`AC-N`). Behavior, not code. |
| 1 Research | `<feature>/research.md` | Decisions with reasoning, open questions, operating constraints. |
| 2 Plan | `<feature>/plan.md` | Architecture and the breakdown into numbered slices. |
| Execute | `<feature>/NNN-<slug>.md` | One file per slice, copied from `templates/slice.md`. Implement one at a time, ticking Done criteria as each passes. |
| Verify | `<feature>/verification.md` | End-to-end scenarios, each mapped back to an `AC-N`. |

## How to use it

1. `/spec <feature>` creates `plans/<feature>/spec.md`.
2. `/plan <feature>` turns the spec and research into `plan.md` and scaffolds the slice files.
3. `/implement <feature>` works each `NNN-<slug>.md` slice in order, ticking its Done criteria as the slice passes.
4. `/verify <feature>` fills and runs `verification.md`.

The `spec-driven` skill explains the same flow and when to reach for it.

## Credit

The structure is adapted from [GitHub Spec Kit](https://github.com/github/spec-kit). The
`verification.md` role is Spec Kit's `quickstart.md`.
