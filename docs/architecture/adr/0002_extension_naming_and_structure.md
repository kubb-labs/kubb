# ADR-0002: Extension naming and manifest structure

| Status   | Authors        | Reviewers      | Issue | Decision date |
| -------- | -------------- | -------------- | ----- | ------------- |
| Proposed | @stijnvanhulle | @stijnvanhulle |       | 2026-05-02    |

## Context

Kubb's extensibility system has four distinct types: `plugin`, `adapter`, `middleware`, and `parser`. Each type plays a different role in the generation pipeline:

- `adapter`: converts an input specification (OpenAPI, AsyncAPI, etc.) into the internal AST. There is exactly one adapter per run.
- `plugin`: walks the AST and emits `FileNode`s. A project can use many plugins simultaneously.
- `middleware`: post-processes `FileNode`s after all plugins complete (barrel files, manifests, etc.).
- `parser`: converts `FileNode`s into final source strings based on file extension (`.ts`, `.tsx`).

All four types share the same metadata structure despite their different pipeline roles. The four JSON schemas in `schemas/` are nearly identical; the only differences are the `category` enum values and the name of the `options` item definition. This raises two questions: what is the collective term for all four types, and should a package ship one unified manifest file or a type-specific file?

The term "modules" conflicts with JavaScript module semantics and does not describe the package-level role clearly. VS Code is the most relevant precedent: every extension ships a single `package.json` manifest regardless of what it contributes, with a `contributes` key holding sub-objects for each contribution type.

## Decision

The collective name for plugin, adapter, middleware, and parser is **extension**. The four sub-types keep their individual names; "extension" is the package-level concept.

Each package ships a single file named `extension.yaml` at the package root. A required `kind` field declares which type the extension is:

```yaml
$schema: 'https://kubb.dev/schemas/extension.json'
kind: plugin                 # plugin | adapter | middleware | parser
type: official               # official | community | 3rd-party
id: plugin-client
name: Client
description: Generate type-safe HTTP clients from OpenAPI specs.
npmPackage: '@kubb/plugin-client'
```

| Field | Values | Purpose |
|-------|--------|---------|
| `kind` | `plugin \| adapter \| middleware \| parser` | Extension type discriminator (new field) |
| `type` | `official \| community \| 3rd-party` | Authorship (unchanged) |

Each `extension.yaml` declares exactly one `kind`. A package that needs to contribute multiple types publishes two separate npm packages, each with its own `extension.yaml`.

A new `schemas/extension.json` validates all four extension types via a `oneOf` discriminated on `kind`. The existing type-specific schemas remain for strict per-type validation.

## Rationale

"Extension" matches dominant developer-tools vocabulary (VS Code, Chrome, Claude) and is unambiguous within the kubb ecosystem. Other candidates conflict with JavaScript semantics or carry the wrong connotation.

One `extension.yaml` with a `kind` field means third-party authors create one file and set one field. Tooling checks for one filename. Type-specific filenames (`plugin.yaml`, `adapter.yaml`) require authors to know the right name before starting and create four conventions instead of one.

The existing `type` field already means authorship (`official | community | 3rd-party`). Reusing it for the kind discriminator would require a breaking rename across all existing YAML files. `kind` leaves `type` untouched.

## Consequences

### Positive

- Third-party authors have one convention: `extension.yaml` + `kind`.
- One base schema validates all kinds; type-specific schemas remain for strict tooling use.
- `type` (authorship) is unchanged; no breaking rename in existing files.

### Negative

- Existing per-package files must be renamed to `extension.yaml` and their `$schema` URLs updated.
- `package.json` `files` arrays need updating in all affected packages.
- The `schemas/extension.json` schema requires a `oneOf` discriminator, which is slightly more complex than flat per-type schemas.

## Considered options

**Option A: Single `extension.yaml` with unified schema (chosen)**

One file per package, one `kind` field, one `schemas/extension.json`. Simplest convention for third parties; matches VS Code and Claude patterns.

**Option B: Type-specific files with a shared base schema**

Keep `plugin.yaml`, `adapter.yaml`, etc. Self-documenting filenames, no discriminator complexity. Rejected because it creates four conventions and requires authors to know the right filename upfront.

**Option C: `extension/` folder per package**

Extensible structure for future sub-files, but adds directory nesting for a single file with no precedent in comparable ecosystems.

## Related ADRs

None.
