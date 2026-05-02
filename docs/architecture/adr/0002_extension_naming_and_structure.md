# ADR-0002: Extension naming and manifest structure

| Status   | Authors        | Reviewers      | Issue | Decision date |
| -------- | -------------- | -------------- | ----- | ------------- |
| Proposed | @stijnvanhulle | @stijnvanhulle |       | 2026-05-02    |

## Context

Kubb's extensibility system has four distinct types: **plugin**, **adapter**, **middleware**, and **parser**. Each type plays a different role in the generation pipeline:

- **Adapter** — converts an input specification (OpenAPI, AsyncAPI, etc.) into the internal AST. There is exactly one adapter per run.
- **Plugin** — walks the AST and emits `FileNode`s. A project can use many plugins simultaneously.
- **Middleware** — post-processes `FileNode`s after all plugins complete (barrel files, manifests, etc.).
- **Parser** — converts `FileNode`s into final source strings based on file extension (e.g. `.ts`, `.tsx`).

Despite their pipeline differences, all four types share an identical metadata structure: `id`, `name`, `description`, `npmPackage`, `compatibility`, `maintainers`, `resources`, `options`, `examples`, and so on. The four JSON schemas in `schemas/` are nearly identical — the only differences are the `category` enum values and the name of the `options` item definition.

Two questions need an answer:

1. **Naming** — what is the collective term for all four types when talking to users, third-party authors, and docs?
2. **Structure** — should a package ship one `extension.yaml` file (unified), or a type-specific file (`plugin.yaml`, `adapter.yaml`, etc.)?

### Prior art

The kubb.dev docs nav currently groups the four types under **"Modules"** — a term already in conflict with JavaScript module semantics. The word **"Integrations"** is taken in the same nav for bundler integrations (Vite, Nuxt, Astro, webpack).

### Reference: VS Code extensions

VS Code is the most relevant precedent. Every VS Code extension ships a single `package.json` manifest regardless of what it contributes. The `contributes` key holds sub-objects for each contribution type (`commands`, `languages`, `themes`, `debuggers`, etc.). VS Code validates all of this through one unified JSON Schema for `package.json`.

Claude (Anthropic) follows the same pattern: MCP server packages are distributed as **Desktop Extensions** — one manifest per package.

---

## Decision

### Naming: "Extension"

The collective name for plugin, adapter, middleware, and parser is **extension**.

- User-facing: the docs nav label changes from "Modules" to "Extensions".
- Third-party guidance: "create an extension" is the top-level instruction.
- The four sub-types keep their individual names. "Extension" is the package-level concept.

### Structure: one `extension.yaml` per package

Each package ships a single file named **`extension.yaml`** at the package root. A required field `kind` declares which type the extension is:

```yaml
$schema: 'https://kubb.dev/schemas/extension.json'
kind: plugin                 # plugin | adapter | middleware | parser
type: official               # official | community | 3rd-party  (authorship)
id: plugin-client
name: Client
description: Generate type-safe HTTP clients from OpenAPI specs.
npmPackage: '@kubb/plugin-client'
category: client
repo: https://github.com/kubb-labs/plugins
maintainers:
  - name: Stijn Van Hulle
    github: stijnvanhulle
compatibility:
  kubb: '>=5.0.0'
  node: '>=22'
tags: [api-client, axios, fetch]
featured: true
icon:
  light: /img/plugin-client-light.svg
  dark: /img/plugin-client-dark.svg
resources:
  documentation: /plugins/plugin-client
  changelog: https://github.com/kubb-labs/plugins/blob/main/packages/plugin-client/CHANGELOG.md
intro: |
  Generate type-safe HTTP clients...
options: [...]
examples: [...]
```

### Field semantics

| Field | Values | Purpose |
|-------|--------|---------|
| `kind` | `plugin \| adapter \| middleware \| parser` | Extension type discriminator (new field) |
| `type` | `official \| community \| 3rd-party` | Authorship (unchanged from existing schemas) |

The `kind` field is new. The existing `type` field keeps its authorship meaning, avoiding a breaking rename.

### One kind per extension

Each `extension.yaml` declares exactly one `kind`. A package that needs to contribute multiple types (e.g. both a plugin and a parser) publishes two separate npm packages — each with its own `extension.yaml`. This enforces the single-responsibility principle that already governs the kubb package design.

### Schema

A new **`schemas/extension.json`** validates all four extension types via a `oneOf` discriminated on `kind`. The existing type-specific schemas (`schemas/plugins/plugin.json`, etc.) remain in place for strict per-type validation and backwards compatibility.

---

## Rationale

**Why "Extension" over other candidates:**

| Candidate | Reason rejected |
|-----------|----------------|
| Modules | Conflicts with JavaScript/ESM `module` concept; too generic |
| Integrations | Already used in the kubb.dev nav for bundler integrations |
| Contributions | Accurate but formal/academic; less intuitive for third-party authors |
| Add-ons | Too informal; carries a "secondary" connotation |
| Packages | Overloaded — already means npm packages and the monorepo `packages/` directory |

**Why one `extension.yaml` over type-specific files:**

The type-specific approach (`plugin.yaml`, `adapter.yaml`, etc.) is self-documenting at the filesystem level but creates four separate conventions. A third-party author must know which filename to use before they start. VS Code solved this by choosing one manifest name (`package.json`) and using fields to declare what the extension provides.

For kubb:

- **One convention to learn** — third-party authors create `extension.yaml` and set `kind`. There is nothing else to remember.
- **Discovery is simpler** — tooling checks for one filename, not four.
- **Schema URL is stable** — `$schema: 'https://kubb.dev/schemas/extension.json'` is the same for every extension, regardless of kind.

**Why `kind` for the discriminator:**

The existing `type` field already carries a clear meaning (authorship: `official | community | 3rd-party`). Reusing `type` for the kind discriminator would require a breaking rename of the authorship field across all existing YAML files and schemas. `kind` is a natural word for "what sort of thing is this" and leaves `type` untouched.

**Why one kind per extension:**

Kubb packages already follow single-responsibility: `plugin-client` generates clients, `parser-ts` parses TypeScript, `adapter-oas` adapts OpenAPI. Multi-type packages would blur these boundaries, complicate the pipeline configuration, and make the `extension.yaml` schema harder to validate. If a new package genuinely needs two roles it is a sign it should be two packages.

---

## Consequences

### Positive

- Third-party authors have a single, clear convention: `extension.yaml` + `kind` field.
- The collective term "extension" is unambiguous and matches dominant developer-tools vocabulary (VS Code, Claude, Chrome).
- One base schema (`schemas/extension.json`) validates all kinds; type-specific schemas remain for strict tooling use.
- `type` (authorship) is unchanged — no breaking rename in existing YAML files or schemas.
- The `kind` field makes the extension type explicit inside the file rather than encoding it in the filename.

### Negative

- **Migration cost** — existing per-package files must be renamed to `extension.yaml` (×10 in kubb-labs/plugins; `adapter.yaml` / `middleware.yaml` / `parser.yaml` in kubb-labs/kubb). The `$schema` URL in each file also updates from the type-specific schema to `extension.json`.
- **`package.json` `files` arrays** need updating in all affected packages.
- The `schemas/extension.json` schema requires a `oneOf` discriminator on `kind`, which is slightly more complex to author and validate than the current flat per-type schemas.
- The `modules/` directory in kubb.dev becomes `extensions/` — a rename in the fetch pipeline scripts.

---

## Considered options

### Option A: Single `extension.yaml` with unified schema (chosen)

One file per package. A `kind` field discriminates the type. One `schemas/extension.json` validates all. Type-specific schemas remain as strict-validation aliases.

Matches VS Code and Claude patterns. Simplest convention for third parties.

### Option B: Type-specific files with a shared base schema

Keep `plugin.yaml`, `adapter.yaml`, `middleware.yaml`, `parser.yaml`. Add `schemas/base/extension.json` as a shared base that the four type schemas extend via `allOf`.

Pro: filename is self-documenting; no discriminator complexity; already partially shipped.
Con: four conventions instead of one; third-party authors must know the right filename before starting.

### Option C: `extension/` folder per package

Each package ships an `extension/` directory containing the manifest plus supplementary assets.

Pro: extensible structure for future sub-files.
Con: adds directory nesting overhead for what is currently a single file; no precedent in comparable ecosystems; discoverability requires listing a directory instead of checking for a file.

---

## Related ADRs

None.
