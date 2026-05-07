# ADR-0002: Extension naming and manifest structure

| Status   | Authors        | Reviewers      | Issue | Decision date |
| -------- | -------------- | -------------- | ----- | ------------- |
| Accepted | @stijnvanhulle | @stijnvanhulle |       | 2026-05-02    |

## Context

Kubb's extensibility system has four types: `plugin`, `adapter`, `middleware`, and `parser`. Each one fills a different slot in the generation pipeline.

- `adapter`: turns an input spec (OpenAPI, AsyncAPI, and so on) into the internal AST. One adapter per run.
- `plugin`: walks the AST and emits `FileNode`s. A project can run many plugins at once.
- `middleware`: post-processes `FileNode`s after all plugins finish (barrel files, manifests, and similar).
- `parser`: turns `FileNode`s into source strings based on file extension (`.ts`, `.tsx`).

The four types share the same metadata structure even though their pipeline roles differ. The four JSON schemas in `schemas/` are nearly identical; only the `category` enum values and the name of the `options` item definition change. This leaves two open questions: what is the collective term for all four types, and should a package ship one unified manifest or a type-specific file?

"Modules" conflicts with JavaScript module semantics and says nothing about the package-level role. VS Code sets the closest precedent: every extension ships a single `package.json` regardless of what it contributes, with a `contributes` key holding sub-objects for each contribution type.

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

"Extension" is the term VS Code, Chrome, and Claude already use for the same idea. Inside Kubb it has no other meaning, so it carries no overload. The other candidates either clash with JavaScript semantics or describe the wrong scope.

One `extension.yaml` with a `kind` field means third-party authors create one file and set one field. Tooling looks for one filename. Type-specific filenames like `plugin.yaml` or `adapter.yaml` would force authors to know the right name up front and would create four conventions instead of one.

The existing `type` field already means authorship (`official | community | 3rd-party`). Reusing it as the kind discriminator would force a breaking rename across every existing YAML file. `kind` leaves `type` alone.

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

One file per package, one `kind` field, one `schemas/extension.json`. The simplest convention for third parties, and it matches VS Code and Claude.

**Option B: Type-specific files with a shared base schema**

Keep `plugin.yaml`, `adapter.yaml`, and so on. Filenames are self-documenting and there is no discriminator. Rejected because it creates four conventions and forces authors to pick the right filename before they start.

**Option C: `extension/` folder per package**

Leaves room for future sub-files, but adds directory nesting around a single file. No comparable ecosystem does this.

## Related ADRs

None.
