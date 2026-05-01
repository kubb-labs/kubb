# Architecture Decision Records

An Architecture Decision Record (ADR) documents a significant architectural choice made in this project. Each record captures the context that drove the decision, the decision itself, and its consequences.

ADRs create a permanent, searchable history of *why* the codebase looks the way it does, not just *what* it does.

## When to write an ADR

Write an ADR when a decision:

- Affects a public API or changes the behavior of a published package.
- Introduces a new pattern or convention that other contributors must follow.
- Resolves a non-obvious trade-off that future maintainers might otherwise reverse.
- Is difficult or costly to undo.

Do not write an ADR for routine implementation details, dependency upgrades, or bug fixes that do not change architecture.

## Structure

Each ADR uses the [Nygard template](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions):

| Section               | Purpose                                                              |
| --------------------- | -------------------------------------------------------------------- |
| **Title**             | A short, descriptive name: `ADR-NNNN: <what was decided>`.          |
| **Status**            | `Proposed`, `Accepted`, `Deprecated`, or `Superseded by ADR-XXXX`. |
| **Context**           | The problem, constraints, and background that forced the decision.   |
| **Decision**          | The specific choice made and how it is implemented.                  |
| **Rationale**         | Why this option was chosen over the alternatives.                    |
| **Consequences**      | Benefits, trade-offs, and new risks the decision introduces.         |
| **Considered options**| Other options that were evaluated and why they were not chosen.      |
| **Related ADRs**      | Links to related or superseded records.                              |

## File naming

```
docs/architecture/adr/
├── 0000_template.md        ← copy this when writing a new ADR
├── 0001_include_filter.md
└── 0002_next_decision.md
```

Use the format `NNNN_short_slug.md` where `NNNN` is a zero-padded sequential number and the slug uses underscores.

## How to create a new ADR

1. Copy `0000_template.md` and increment the number.
2. Fill in all sections.
3. Set `Status` to `Proposed` and open a pull request.
4. Change `Status` to `Accepted` once the PR is merged.

## Records

| ADR                                                          | Title                                            | Status   |
| ------------------------------------------------------------ | ------------------------------------------------ | -------- |
| [0001](./0001_include_filter.md)                             | Include filter schema scoping                    | Accepted |
| [0002](./0002_generic_agent_plugins_adapters.md)             | Generic agent for arbitrary plugins and adapters | Proposed |
