# Kubb Improvement Roadmap

## Context

This roadmap is a prioritized backlog of correctness fixes and feature work for kubb. Each item
describes a real OpenAPI shape that kubb handles wrongly, incompletely, or not at all today, plus
recurring feature gaps. The backlog is informed by a year of real-world OpenAPI → TypeScript
generation pain points, each one verified against kubb's current code before inclusion. Items are
grouped by theme and include the current behavior, the proposed approach, the affected code, a
before/after example, and acceptance criteria so each can be picked up independently.

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

### 2e. Format/pattern escaping and constraint chains (P1)
**Current.** Patterns with regex wildcards/anchors are not always escaped correctly, and chained
constraints from combined keywords (e.g. `maxLength` + `enum`, `pattern` + string-format,
`minimum` + `multipleOf`) can emit modifier chains that do not type-check.
**Fix.** Normalize pattern escaping and emit constraint modifiers in a valid, deduplicated order.
```ts
// spec: { type: string, format: email, pattern: "^.+@.+$" }
// expected: z.string().email().regex(/^.+@.+$/)   // both kept, valid chain
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

### 3d. Combined-type grouping and union de-duplication (P1)
**Current.** Intersections combined with arrays can drop parentheses (`A & B[]` instead of the
intended `(A & B)[]`), and union de-duplication can corrupt inline (anonymous) member types or
produce duplicate type names for `prefixItems`/`items` tuples.
**Fix.** Group composite types with parentheses when wrapping in arrays; de-duplicate unions by
structural identity, not name, and keep inline members intact.
```ts
// current:  type Pets = Pet & Tagged[]
// expected: type Pets = (Pet & Tagged)[]
```

**Acceptance criteria.** Snapshot stability test; a fixture with a `File`/`Blob` schema; a
type-check pass with `isolatedDeclarations: true` enabled on the generated output; fixtures for
intersection-array and de-duplication of an inline union.

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

### 4e. `allOf` merging and `required` propagation (P1)
**Current.** `allOf` is flattened only for keyword-only fragments; when it combines a `$ref` with
an inline object that adds `required: [...]`, the parser builds an intersection and synthesizes the
required members separately rather than applying `required` to the referenced properties
(`packages/adapter-oas/src/parser.ts` `convertAllOf`, `resolvers.ts` `flattenSchema`). Edge cases
(e.g. `discriminatedUnion` over `allOf` inheritance) can produce unusable or circular output.
**Fix.** When all `allOf` members resolve to objects, deep-merge properties and unify `required`
onto the merged shape; only fall back to an intersection when members are non-objects.
```ts
// spec: allOf: [ { $ref: Base }, { required: [id] } ]   where Base has optional `id`
// expected: id becomes required on the merged type/schema (not a synthetic extra member)
```

### 4f. `propertyNames` constraint (P1)
**Current.** JSON Schema `propertyNames` is ignored entirely; `additionalProperties` maps to an
index signature / `.catchall()` with `string` keys regardless. (`patternProperties` *is* handled.)
**Fix.** When `propertyNames` constrains keys to an enum/const, emit a keyed `Record`
(`Record<'a' | 'b', V>`) in plugin-ts and the matching zod shape.
```ts
// spec: { type: object, propertyNames: { enum: [a, b] }, additionalProperties: { type: number } }
// current:  { [key: string]: number }
// expected: Record<'a' | 'b', number>
```

**Acceptance criteria.** Fixtures for escaped ref names, numeric/boolean discriminants, a multi-file
mapping, an `allOf`+`required` merge, and a `propertyNames` enum; correct resolution verified by
snapshot + type-check.

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
- **Acronym casing preservation.** Casing normalization (`internals/utils/src/casing.ts`,
  `toCamelOrPascal`) only preserves standalone all-uppercase runs; acronyms embedded in mixed-case
  identifiers (`HTTPCode`, `userID`) get re-cased. Add an option to preserve known acronyms when
  deriving operation/type/schema names.
  ```ts
  // current:  HttpCode / UserId
  // expected (preserve mode): HTTPCode / UserID
  ```
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

## Theme 7 — Request/response bodies & content types (P1)

### 7a. Binary content-type detection beyond the happy path
**Current.** Binary detection (`packages/adapter-oas/src/dialect.ts` `isBinary`) recognizes
`format: binary` and 3.1 `contentMediaType: 'application/octet-stream'` on string schemas, but not
`application/octet-stream` without `contentMediaType`, `*/*`, `application/zip`/other binary media
types, or `format: binary` reached through a `$ref`.
**Fix.** Treat the response/request as binary (`Blob`/`File`/`ReadableStream`) when the media type
is a known binary type or `*/*`, and resolve `format: binary` through refs.
```ts
// response content: { "application/octet-stream": { schema: { $ref: FileRef } } }
// current:  parsed as JSON object
// expected: Blob
```

### 7b. multipart/form-data correctness
**Current.** FormData building in `(plugins) packages/plugin-client/src/utils.ts` mishandles some
shapes — nested JSON objects can be coerced to `Blob`, arrays of objects may not serialize, and
readonly/enums in the multipart schema can leak in.
**Fix.** Serialize each part by its schema (append objects as JSON blobs or repeated fields per
`style`), keep array items as repeated parts, and strip readOnly props from request parts.

### 7c. Empty / non-JSON bodies
**Current.** Empty response bodies, `text/plain`, and empty arrays are not always handled; a
no-content (204) or empty body can lead to parse errors downstream, and empty JSON arrays may be
dropped from request payloads.
**Fix.** Emit `void`/`undefined` response types for no-content statuses, respect `text/plain` as a
string body, and always send an explicitly-provided empty array.

### 7d. SSE / streaming responses
**Current.** `text/event-stream` is unsupported — `getMediaType('text/event-stream')` returns
`null`, so SSE/streaming endpoints are treated as plain text
(`packages/adapter-oas/src/resolvers.ts`, media-type union in `packages/ast/src/signature.ts`).
**Fix.** Recognize `text/event-stream` (and chunked/streaming bodies) as a media type, model it on
the response node, and generate a streaming-aware client return type
(`ReadableStream` / async iterator of typed events). Larger effort; coordinate with the query
plugins so hooks expose the stream rather than a single payload.

**Acceptance criteria.** Fixtures for octet-stream-via-ref, `*/*`, a multipart upload with
object+array parts, a 204/empty/text-plain response, and an SSE endpoint; client request/response
assertions (not only snapshots).

---

## Theme 8 — Mock data (faker) constraint coverage (P1)

**Current.** `(plugins) packages/plugin-faker/src/printers/printerFaker.ts` honors `min`/`max` and
`uniqueItems`, but ignores `multipleOf`, `exclusiveMinimum`/`exclusiveMaximum`, and
`minLength`/`maxLength` as independent constraints, so generated mock data can violate the schema
(and then fail the very zod schemas kubb also generates).
**Fix.** Map the full numeric/string/array constraint set onto the faker calls.
```ts
// spec: { type: integer, minimum: 0, exclusiveMaximum: 100, multipleOf: 5 }
// current:  faker.number.int({ min: 0, max: 100 })
// expected: faker.number.int({ min: 0, max: 95, multipleOf: 5 })
```

**Acceptance criteria.** A fixture per constraint; generated mock values validate against the
corresponding generated zod schema in a round-trip test.

---

## Theme 9 — Query-plugin depth (P2)

Enhancements to the react-query / vue-query / swr plugins (`(plugins) packages/plugin-react-query`,
`plugin-vue-query`, `plugin-swr`, shared in `(plugins) internals/tanstack-query`):

- **Infinite query options**: generate correct `infiniteQueryOptions` including page-param wiring
  and a stable `queryKey` that is not mutated between pages.
- **queryKey correctness**: include path + query params (and operationId) deterministically so keys
  are unique and invalidation-friendly.
- **Invalidation helpers**: emit per-operation key factories / invalidate helpers.
- **Optimistic updates & cancellation**: scaffolding/option hooks for `onMutate`/rollback and
  request cancellation.
- **Framework reactivity**: vue-query should accept `MaybeRefOrGetter` inputs and avoid
  double-unwrapping reactive refs; keep up with TanStack v5 option-type drift.

**Acceptance criteria.** Per-feature fixtures + type-check against the targeted TanStack/SWR
versions; queryKey snapshot stability.

---

## Theme 10 — Robustness & error reporting on malformed specs (P1)

**Current.** Validation is non-fatal by default and ref-resolution failures are swallowed
(`packages/adapter-oas/src/factory.ts` `validateDocument`, `parser.ts` `convertRef` bare `catch`),
so a bad `$ref` or a property with no `type` silently yields `any`/`null` or an opaque crash with
no pointer to the offending location. Generic crash reports are the single highest-volume issue
class for tools in this space.
**Fix.** Add a structured diagnostics path: collect parse-time problems with their JSON-pointer
location and a clear message, surface them (warn or fail per a `strict` option) instead of throwing
raw stack traces, and never silently emit `any` for an unresolved ref without a diagnostic.
```
✖ adapter-oas: unresolved $ref "#/components/schemas/Animal" at paths./pets.get.responses.200
  (no schema with that name was found)
```

**Acceptance criteria.** Fixtures with an unresolved ref, a property with no `type`, and an invalid
document each produce an actionable diagnostic (and fail under `strict`) rather than a raw crash;
no unhandled exception escapes the adapter.

---

## Suggested sequencing

1. **P0 correctness first**: Theme 1 (param styles), Theme 2a/2b (enum default + nullable),
   Theme 4a (`$ref` escaping). These fix wrong output on common specs.
2. **P1 robustness**: rest of Theme 2/3/4 (unions, regex/format chains, stable ordering, combined
   types, global collisions, discriminators, `allOf` merge, `propertyNames`), Theme 7 (bodies &
   content types), Theme 8 (faker constraints), and Theme 10 (diagnostics on malformed specs).
3. **P2 DX**: Theme 5 (validation/warnings, presets, transforms, acronym casing, CLI) and Theme 9
   (query-plugin depth).
4. **P2 initiatives**: Theme 6 new plugins, Theme 7d SSE/streaming, and `$dynamicRef` support.

## Verification approach (per item)

- Add a minimal OpenAPI fixture under `(plugins) schemas/` reproducing the bad or missing output,
  plus a snapshot test in `(plugins) tests/3.0.x/` (and a 3.1 fixture where the feature is
  3.1-specific).
- Run `pnpm test` (vitest snapshots), `pnpm typecheck` (proves generated output compiles), and
  `pnpm build`.
- For client serialization (Theme 1), assert the emitted request URL/body in a unit test, not only
  the snapshot.
