# Kubb Improvement Roadmap

## Context

This roadmap is a prioritized backlog of correctness fixes and feature work for kubb. Each item
describes a real OpenAPI shape that kubb handles wrongly, incompletely, or not at all today, plus
recurring feature gaps. Items are grouped by theme and include the current behavior, the proposed
approach, the affected code, a before/after example, and acceptance criteria so each can be picked
up independently.

Paths prefixed `(plugins)` live in the `kubb-labs/plugins` repo; all other paths are in this repo
(`kubb-labs/kubb`). Generation flows OpenAPI → `@kubb/adapter-oas` (parse to AST) →
`@kubb/ast` nodes → plugins (`@kubb/plugin-*`) generators/printers → files. Most correctness
issues are best fixed at the adapter/AST layer so every plugin benefits.

Severity legend: **P0** correctness bug (emits wrong or non-compiling code) · **P1** notable gap ·
**P2** DX/feature enhancement.

---

## Theme 1 — Parameter serialization styles (P0, biggest gap)

**Current behavior.** `ParameterNode` (`packages/ast/src/nodes/parameter.ts`) stores only `name`,
`in`, `schema`, and `required`. The adapter reads parameters in `parseParameter`
(`packages/adapter-oas/src/parser.ts`) but discards the OpenAPI `style` and `explode` fields.
Client plugins therefore serialize every parameter as a plain `key=value` query entry. Object
parameters and array parameters that rely on a non-default style produce incorrect request URLs.

**Proposed approach.**
1. Extend `ParameterNode` with optional `style` (`'form' | 'spaceDelimited' | 'pipeDelimited' |
   'deepObject' | 'simple' | 'label' | 'matrix'`) and `explode: boolean`, defaulting per the
   OpenAPI spec (query/cookie → `form`+`explode:true`; path/header → `simple`+`explode:false`).
2. Capture both in `parseParameter`.
3. Add a shared serializer in `(plugins) internals/shared/src/params.ts` that turns a
   `(name, value, style, explode)` tuple into the correct query/path fragments, and call it from
   `(plugins) packages/plugin-client/src/utils.ts` when building the request.

**Example.** Spec:
```yaml
- name: filter
  in: query
  style: deepObject
  explode: true
  schema: { type: object, properties: { tag: { type: string }, page: { type: integer } } }
```
Current output (wrong — flattens / stringifies the object):
```ts
// ?filter=[object Object]   (or filter={"tag":"x","page":1})
client.get('/pets', { params: { filter } })
```
Expected output:
```ts
// ?filter[tag]=x&filter[page]=1
client.get('/pets', { params: { 'filter[tag]': filter.tag, 'filter[page]': filter.page } })
```
Array styles to cover: `form`+`explode:false` → `?ids=1,2,3`; `pipeDelimited` → `?ids=1|2|3`;
`spaceDelimited` → `?ids=1%202%203`; `simple` path param → `/items/1,2,3`.

**Acceptance criteria.** A fixture exercising each style generates the matching URL; a unit test
asserts the serialized request (not only the snapshot); existing default-style output is unchanged.

---

## Theme 2 — Validation-schema (zod) correctness (P0/P1)

The zod plugin emits broken or non-compiling output for several common schema shapes.

### 2a. Enum with a `default` value (P0)
**Current.** The enum handler in `(plugins) packages/plugin-zod/src/printers/printerZod.ts`
(~L189-202) emits `z.enum([...])`, and the `default` modifier (~L260) appends `.default(value)`.
For string enums the default is emitted without quoting in some paths, producing a reference to an
undefined identifier.
**Fix.** Quote/serialize the default as a literal that matches the enum member type.
```ts
// spec: { type: string, enum: [a, b], default: a }
// current: z.enum(["a","b"]).default(a)     // `a` is not defined
// expected: z.enum(["a","b"]).default("a")
```

### 2b. Nullable enum drops `null` (P1)
**Current.** `convertEnum` (`packages/adapter-oas/src/parser.ts`) strips `null` out of the value
list; if the schema is also nullable, the emitted schema loses the `null` branch.
**Fix.** When `null` appears in the enum or the type union includes `"null"`, retain it and append
`.nullable()` (or include `z.null()` in a union).
```ts
// spec: { type: [string,"null"], enum: [a, b, null] }
// current: z.enum(["a","b"])
// expected: z.enum(["a","b"]).nullable()
```

### 2c. Empty-object alternative in `anyOf`/`oneOf` (P1)
**Current.** An empty schema (`{}`) inside a union collapses the union to an over-permissive or
invalid result.
**Fix.** Map the empty branch to the configured `emptySchemaType` and keep the union intact.
```ts
// spec: anyOf: [ { type: object, properties: {...} }, {} ]
// expected: z.union([z.object({ /* ... */ }), z.any()])
```

### 2d. Regex with unicode flags (P1)
**Current.** Pattern strings are emitted raw via `toRegExpString`
(`(plugins) packages/plugin-zod/src/utils.ts` ~L221); patterns using unicode property escapes
(`\p{...}`) throw at runtime because the `u` flag is missing.
**Fix.** Detect unicode constructs (or read a flags hint) and emit the `u` flag.
```ts
// spec: { type: string, pattern: "\\p{L}+" }
// current: z.string().regex(/\p{L}+/)   // throws: invalid escape
// expected: z.string().regex(/\p{L}+/u)
```

**Acceptance criteria.** A fixture per sub-item; generated schemas type-check and validate the
intended inputs/outputs; snapshots updated.

---

## Theme 3 — TypeScript output robustness (P1)

### 3a. Stable / deterministic ordering
**Current.** Declaration order follows discovery/deduplication order in
`(plugins) packages/plugin-ts/src/generators/typeGenerator.tsx`, so unrelated spec edits reorder
output and occasionally break forward references.
**Fix.** Sort emitted declarations by a deterministic key before printing; two runs over the same
spec must produce byte-identical files.

### 3b. Global type-name collisions
**Current.** A schema named `File`, `Blob`, `Date`, etc. emits `export type File = ...`, shadowing
the TS global and breaking later uses of the real global.
**Fix.** Detect collisions with global lib types in the ts resolver
(`(plugins) packages/plugin-ts/src/resolvers/`) and rename with a configurable suffix.
```ts
// current:  export type File = { id: string }
// expected: export type FileModel = { id: string }
```

### 3c. `isolatedDeclarations` support
**Current.** Exported helpers that rely on type inference fail under TS `isolatedDeclarations`
(error TS9007).
**Fix.** Add a plugin-ts option that emits explicit type annotations on exported values.
```ts
// current:  export const petKeys = makeKeys('pet')
// expected: export const petKeys: PetKeys = makeKeys('pet')
```

**Acceptance criteria.** Snapshot stability test; a fixture with a `File`/`Blob` schema; a
type-check pass with `isolatedDeclarations: true` enabled on the generated output.

---

## Theme 4 — Reference & discriminator handling (P1)

### 4a. `$ref` names containing `/` or `~` (P0)
**Current.** `packages/adapter-oas/src/refs.ts` only applies `decodeURIComponent`, so JSON Pointer
escape sequences are mishandled and the ref resolves to the wrong schema or none.
**Fix.** Apply JSON Pointer unescaping (`~1` → `/`, `~0` → `~`) on decode and the inverse on
encode.
```
// #/components/schemas/Foo~1Bar  ==  schema "Foo/Bar"
```

### 4b. Non-string discriminator tags (P1)
**Current.** `packages/adapter-oas/src/discriminator.ts` coerces discriminant values to strings.
**Fix.** Preserve the underlying type (integer/boolean) of the discriminator property.
```ts
// discriminator on integer `version`
// current:  { version: "1" }
// expected: type Shape = ({ version: 1 } & V1) | ({ version: 2 } & V2)
```

### 4c. Discriminator `mapping` across multiple files (P1)
**Current.** `mapping` entries that reference external documents are ignored.
**Fix.** Resolve external mapping targets via the bundler before discriminator inference.

### 4d. `$dynamicRef` / `$dynamicAnchor` (P2, larger)
**Current.** JSON Schema 2020-12 dynamic anchors are unsupported.
**Fix.** Scope a resolution strategy in `packages/adapter-oas/src/` (refs + parser); likely a
multi-pass resolve that records dynamic anchors and binds them at use sites.

**Acceptance criteria.** Fixtures for escaped ref names, numeric/boolean discriminants, and a
multi-file mapping; correct resolution verified by snapshot + type-check.

---

## Theme 5 — Configuration & DX (P2)

- **Option validation / conflict warnings.** Plugin options are typed but never validated at
  runtime; conflicting options fail silently. Add a validation pass in
  `packages/core/src/createKubb.ts` / `definePlugin.ts` that emits actionable warnings, e.g.:
  ```
  ⚠ plugin-zod: `mini` and `inferred` both set — `inferred` is ignored in mini mode.
  ```
- **Surface post-process / format errors.** Errors thrown inside the `kubb:format:start` /
  `kubb:format:end` hooks are currently swallowed; propagate them (with the offending file) so a
  failed format/lint step fails the run instead of silently producing unformatted output.
  `packages/core/src/createKubb.ts`.
- **Presets API.** Ship reusable config bundles so users don't hand-wire every plugin. New concept
  in `packages/core`:
  ```ts
  export default defineConfig({
    input: { path: 'openapi.yaml' },
    presets: [reactQueryPreset({ client: 'fetch' })], // expands to plugin-ts + plugin-zod + plugin-client + plugin-react-query
  })
  ```
- **Bulk spec/schema/operation transforms.** Today only an AST `transformer` (visitor) exists. Add
  ergonomic hooks that run earlier in the pipeline:
  ```ts
  transforms: {
    schemas: { name: (n) => n.replace(/Dto$/, '') },   // rename schema keys
    operations: (op) => ({ ...op, operationId: camel(op.operationId) }),
  }
  ```
  `packages/core/src/defineMiddleware.ts` + the adapter parse stage.
- **CLI niceties.** A flag to hide the ASCII logo, and a "compact comments" output mode.
  `packages/cli` + plugin printers.

**Acceptance criteria.** Each item has a focused unit test (warning emitted, error propagated,
preset expands to the expected plugin set, transform applied before generation, CLI flag honored).

---

## Theme 6 — New generators (P2, larger initiatives)

Net-new packages under `(plugins) packages/`, following the existing plugin layout
(`plugin.ts` + `types.ts` + `resolvers/` + `generators/*.tsx` + `printers/`):

- **`@kubb/plugin-valibot`** — a validation-schema generator alternative to zod, mirroring the zod
  plugin's structure, naming resolver, and config surface:
  ```ts
  import * as v from 'valibot'
  export const petSchema = v.object({ id: v.string() })
  export type Pet = v.InferOutput<typeof petSchema>
  ```
- **TanStack Start plugin** — server/client integration built on the shared tanstack-query
  internals (`(plugins) internals/tanstack-query`).
- **RTK Query plugin** — Redux Toolkit Query endpoints and hooks.

**Acceptance criteria.** Each new plugin ships with examples under `(plugins) examples/`, a test
suite under `(plugins) tests/3.0.x/`, and parity coverage with the closest existing plugin.

---

## Suggested sequencing

1. **P0 correctness first**: Theme 1 (param styles), Theme 2a/2b (enum default + nullable),
   Theme 4a (`$ref` escaping). These fix wrong output on common specs.
2. **P1 robustness**: rest of Theme 2/3/4 (unions, regex, stable ordering, global collisions,
   discriminators).
3. **P2 DX**: Theme 5 (validation/warnings, presets, transforms, CLI).
4. **P2 initiatives**: Theme 6 new plugins, and `$dynamicRef` support.

## Verification approach (per item)

- Add a minimal OpenAPI fixture under `(plugins) schemas/` reproducing the bad or missing output,
  plus a snapshot test in `(plugins) tests/3.0.x/` (and a 3.1 fixture where the feature is
  3.1-specific).
- Run `pnpm test` (vitest snapshots), `pnpm typecheck` (proves generated output compiles), and
  `pnpm build`.
- For client serialization (Theme 1), assert the emitted request URL/body in a unit test, not only
  the snapshot.
