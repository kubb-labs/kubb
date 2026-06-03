---
'@kubb/core': minor
'@kubb/cli': minor
'@kubb/adapter-oas': minor
---

Render build diagnostics in the oxlint style and add a suggested fix.

`Diagnostic` gains a `help` field with a suggested fix. The three converted throw sites set it, and the CLI renders a diagnostic as:

```
× @kubb/plugin-zod(KUBB_REF_NOT_FOUND): Could not find a definition for Pet.
  at #/components/schemas/Pet
  help: Add the schema under components.schemas, or fix the $ref.
  docs: https://kubb.dev/docs/5.x/reference/diagnostics/kubb-ref-not-found
```

The `docs:` link is derived from the code and points at the diagnostics reference on kubb.dev. A failed run also prints an `Environment:` row (Node version, Kubb version, platform, cwd) in the summary box. `getDiagnosticInfo` is exported from `@kubb/core`.
