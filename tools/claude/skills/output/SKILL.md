---
name: output
description: Import and use Kubb's generated code (types, clients, hooks, schemas, mocks). Use when writing app or test code that consumes a Kubb build.
---

# Output Skill

This skill instructs agents on importing and using the code Kubb generates from an OpenAPI/Swagger
spec.

## When to Use

- Writing application code that calls the generated client or hooks
- Writing tests that use the generated mocks or schemas
- Wiring generated files into an app

## What It Does

- Explains where generated code lands
- Shows how to discover the real exports and a plugin's options
- Lists the rules for keeping generated code in sync

## Where output lands

Kubb writes generated code under the `output.path` from `kubb.config.ts` (for example `./src/gen`),
organized into the folders each plugin sets through its own `output.path` (for example `models`,
`clients`, `hooks`). Generated files carry a `Do not edit manually` banner and are rewritten on
every `kubb generate`, so change them by editing the spec or config and regenerating.

Export names derive from the spec's `operationId` and schema names. Casing and grouping are
configurable, so read the generated files for the exact names and signatures rather than assuming
them.

## Find what was generated

Inspect the real output instead of guessing:

1. Read `kubb.config.ts` for the top-level `output.path` and each plugin's `output.path`.
2. List the output directory for the actual file and export names.
3. Read an installed plugin's `extension.yaml` (`node_modules/@kubb/plugin-<name>/extension.yaml`)
   for its options, defaults and dependencies. It ships with the package, so it matches the
   installed version. Use it as the source of truth rather than assuming an option name.

Import from a folder's `index.ts` when `output.barrel` is set, otherwise import the file directly.

## Rules

- Never edit files under `output.path`. Edit the spec or config and rerun `kubb generate`.
- Import generated code instead of copying it, so a regenerate keeps callers in sync.
- Configure the runtime client once. The client functions and framework hooks share it.
- Typecheck after regenerating so a spec change that broke a call site shows up.

## Related Skills

| Skill | Use For |
| --- | --- |
| **[../config/SKILL.md](../config/SKILL.md)** | Authoring `kubb.config.ts` and picking plugins |
