# Kubb Improvement Roadmap

## Context

This roadmap is the output of a robustness audit. I reviewed ~4 months of real-world bug reports
and feature requests filed against OpenAPI → TypeScript code generators, grouped them into
recurring themes, and checked each theme against kubb's current capabilities (core in this repo,
plugins in the `kubb-labs/plugins` repo).

The goal: find places where a real-world OpenAPI spec would produce wrong, incomplete, or missing
output from kubb today, plus feature gaps users repeatedly ask for. Each item below is a problem
kubb either does not handle or handles only partially. This is a backlog with the relevant code
locations so each item can be picked up independently.

Paths prefixed `(plugins)` live in the `kubb-labs/plugins` repo; all other paths are in this repo.

Severity legend: **P0** correctness bug (emits wrong/uncompilable code) · **P1** notable gap ·
**P2** DX/feature enhancement.

---

## Theme 1 — Parameter serialization styles (P0, biggest gap)

**Problem.** The OpenAPI `style` / `explode` fields on parameters (`deepObject`, `form`,
`spaceDelimited`, `pipeDelimited`, `simple`) are parsed but dropped — `ParameterNode` stores
only `name`, `in`, `schema`, `required`. Clients serialize every param as a plain query string,
so `deepObject` object params and array-style params generate wrong request URLs. Dot-notation /
nested query params also misgenerate.

**Where.**
- `packages/ast/src/nodes/parameter.ts` — add `style` / `explode` to the node.
- `packages/adapter-oas/src/parser.ts` (`parseParameter`) — capture `style`/`explode`.
- `(plugins) packages/plugin-client/src/utils.ts` — emit per-style serialization
  (and shared helper in `(plugins) internals/shared/src/params.ts`).

**Outcome.** Correct query/path serialization for object and array params; nested/dot-notation
params handled.

**Example.** Spec:
```yaml
- name: filter
  in: query
  style: deepObject
  explode: true
  schema: { type: object, properties: { tag: { type: string }, page: { type: integer } } }
```
Current output (wrong — flattens/JSON-stringifies):
```ts
// ?filter=[object Object]   (or filter={"tag":"x","page":1})
client.get('/pets', { params: { filter } })
```
Expected output:
```ts
// ?filter[tag]=x&filter[page]=1
client.get('/pets', { params: { 'filter[tag]': filter.tag, 'filter[page]': filter.page } })
```
And for `style: pipeDelimited` arrays → `?ids=1|2|3`; `spaceDelimited` → `?ids=1%202%203`.

---

## Theme 2 — Validation-schema (zod) correctness (P0/P1)

Several spec shapes produce broken or non-compiling zod output today.

- **Enum + `default`** (P0): enum defaults can emit non-assignable code; the enum handler does
  not consistently reconcile `default()` with `z.enum([...])`.
  `(plugins) packages/plugin-zod/src/printers/printerZod.ts` (~L189-202, L260).
- **Nullable enum drops `null`** (P1): confirm null survives end-to-end from
  `convertEnum` in `packages/adapter-oas/src/parser.ts` through the zod printer.
- **Empty-object alternative in `anyOf`/`oneOf`** (P1): empty schema in a union should not
  collapse the union to an invalid/over-permissive schema. Union handling in `parser.ts` +
  `emptySchemaType`.
- **Regex with unicode flags** (P1): pattern strings carrying `/u` (or named groups) are emitted
  raw without flag extraction. `(plugins) packages/plugin-zod/src/utils.ts` (~L221,
  `toRegExpString`).

**Examples.**

Enum + `default` — spec `{ type: string, enum: [a, b], default: a }`:
```ts
// current (non-assignable / invalid): z.enum(["a","b"]).default(a)   // `a` is undefined
// expected:
z.enum(["a", "b"]).default("a")
```

Nullable enum — spec `{ type: [string, "null"], enum: [a, b, null] }`:
```ts
// current (drops null): z.enum(["a","b"])
// expected:
z.enum(["a", "b"]).nullable()   // null preserved
```

Empty-object alternative — spec `anyOf: [ { type: object, properties: {...} }, {} ]`:
```ts
// current (union collapses to invalid/over-permissive)
// expected: empty schema becomes the configured emptySchemaType, union stays intact
z.union([z.object({ /* ... */ }), z.any()])
```

Unicode regex — spec `{ type: string, pattern: "\\p{L}+", x-flags: "u" }`:
```ts
// current (no flag → throws at runtime for \p): z.string().regex(/\p{L}+/)
// expected:
z.string().regex(/\p{L}+/u)
```

**Outcome.** Generated zod schemas compile and validate correctly for enums, nullable enums,
union-with-empty-object, and unicode patterns.

---

## Theme 3 — TypeScript output robustness (P1)

- **Stable / deterministic ordering**: output ordering currently follows spec/dedup order and can
  shift, producing churn and occasional cross-reference type errors. Introduce a stable sort of
  emitted declarations. `(plugins) packages/plugin-ts/src/generators/typeGenerator.tsx`,
  `printers/printerTs.ts`.
- **Global type name collisions**: generated types named `File`, `Blob`, `Date`, etc. silently
  shadow/conflict with TS globals. Add collision detection/renaming in the ts resolver.
  `(plugins) packages/plugin-ts/src/resolvers/`.
- **`isolatedDeclarations` support**: emit output compatible with TS `isolatedDeclarations`
  (explicit return/types, no inference-dependent exports). New option on plugin-ts.

**Examples.**

Global collision — schema named `File`:
```ts
// current (shadows global, breaks Blob/File usage elsewhere):
export type File = { id: string }
// expected (resolver renames + keeps a reference):
export type FileModel = { id: string }   // or configurable suffix
```

isolatedDeclarations — exported helper inferring its type:
```ts
// current (fails isolatedDeclarations: error TS9007):
export const petKeys = makeKeys('pet')
// expected (explicit type annotation emitted):
export const petKeys: PetKeys = makeKeys('pet')
```

Stable ordering: two runs over the same spec must produce byte-identical files (sort
declarations by a deterministic key, not discovery order).

**Outcome.** Output typechecks under stricter tsconfig settings and avoids global shadowing.

---

## Theme 4 — Reference & discriminator handling (P1)

- **`$ref` names with `/` or `~`** (P0): JSON Pointer escaping (`~0`→`~`, `~1`→`/`) must be applied
  on both encode and decode; today only `decodeURIComponent` is used.
  `packages/adapter-oas/src/refs.ts`.
- **Non-string discriminator tags** (P1): discriminator currently assumes string tags
  (filters to string/number/boolean defaulting to string). Support numeric/boolean discriminants
  faithfully. `packages/adapter-oas/src/discriminator.ts`.
- **Discriminator `mapping` across multiple files** (P1): mapping values referencing external
  documents are ignored; resolve them via the bundler before discriminator inference.
- **`$dynamicRef` / `$dynamicAnchor`** (P2): JSON Schema 2020-12 anchors are unsupported. Scope a
  resolution strategy in `packages/adapter-oas/src/` (refs/parser). Larger effort.

**Examples.**

`$ref` with escaped chars — `#/components/schemas/Foo~1Bar` (= `Foo/Bar`):
```ts
// current (decodes URI only, mishandles ~1): resolves to wrong/undefined schema
// expected (JSON Pointer unescape ~1→/, ~0→~): resolves to schema "Foo/Bar"
```

Non-string discriminator — `discriminator: { propertyName: version }`, `version: { type: integer }`:
```ts
// current (coerced to string literal): version: "1"
// expected:
type Shape = ({ version: 1 } & V1) | ({ version: 2 } & V2)
```

**Outcome.** Specs using special-char ref names, non-string discriminants, cross-file mappings,
and (eventually) dynamic anchors generate correctly.

---

## Theme 5 — Config & DX (P2)

- **Plugin option validation / conflict warnings**: options are typed but never validated at
  runtime; conflicting plugin keys fail silently. Add a validation pass + warnings in
  `packages/core/src/createKubb.ts` / `definePlugin.ts`.
- **Surface post-process/format errors**: formatting/lint errors in the
  `kubb:format:start`/`kubb:format:end` hooks should not be swallowed. `createKubb.ts`.
- **Presets API**: ship reusable config bundles (e.g. "react-query + zod + client") so users
  don't hand-wire every plugin. New concept in `packages/core`.
- **Bulk spec/schema/operation transforms**: today only an AST `transformer` (visitor) exists.
  Add ergonomic bulk hooks (rename schema keys, patch operations, patch whole spec) earlier in
  the pipeline. `packages/core/src/defineMiddleware.ts` + adapter parse stage.
- **CLI niceties**: flag to hide the ASCII logo; "compact comments" output mode.
  `packages/cli`, plugin printers.

**Examples.**

Conflict warning:
```
⚠ plugin-zod: option `mini` and `inferred` both set — `inferred` is ignored in mini mode.
```

Presets — instead of hand-wiring plugins:
```ts
export default defineConfig({
  input: { path: 'openapi.yaml' },
  presets: [reactQueryPreset({ client: 'fetch' })], // expands to plugin-ts + plugin-zod + plugin-client + plugin-react-query
})
```

Bulk transform:
```ts
transforms: {
  schemas: { name: (n) => n.replace(/Dto$/, '') },   // rename schema keys
  operations: (op) => ({ ...op, operationId: camel(op.operationId) }),
}
```

**Outcome.** Fewer silent misconfigurations, reusable presets, and richer pre-generation
spec patching.

---

## Theme 6 — New generators (P2, larger initiatives)

These are recurring feature requests with no current kubb equivalent. Each is a new package under
`(plugins) packages/` following the existing plugin pattern
(`plugin.ts` + `types.ts` + `resolvers/` + `generators/*.tsx` + `printers/`):

- **Valibot plugin** (`@kubb/plugin-valibot`) — validation-schema alternative to zod; mirror the
  zod plugin's structure and config surface.
- **TanStack Start plugin** — server/client integration on top of the shared tanstack-query
  internals (`(plugins) internals/tanstack-query`).
- **RTK Query plugin** — Redux Toolkit Query endpoints/hooks.

**Example** (valibot, mirroring the zod output for `{ type: object, properties: { id: { type: string } } }`):
```ts
import * as v from 'valibot'
export const petSchema = v.object({ id: v.string() })
export type Pet = v.InferOutput<typeof petSchema>
```

**Outcome.** Broader ecosystem coverage matching common user stacks.

---

## Suggested sequencing

1. **P0 correctness first**: Theme 1 (param styles), Theme 2 enum/default + nullable, Theme 4
   `$ref` escaping. These fix wrong output on common specs.
2. **P1 robustness**: rest of Theme 2/3/4 (unions, regex, stable ordering, global collisions,
   discriminators).
3. **P2 DX**: Theme 5 (validation/warnings, presets, transforms, CLI).
4. **P2 initiatives**: Theme 6 new plugins, and `$dynamicRef` support.

## Verification approach (per item, when implemented)

- Add a minimal OpenAPI fixture under `(plugins) schemas/` reproducing the bad/missing output,
  plus a snapshot test in `(plugins) tests/3.0.x/` (and a 3.1 fixture where the feature is
  3.1-specific).
- Run `pnpm test` (vitest snapshots), `pnpm typecheck` (proves generated output compiles),
  and `pnpm build`.
- For client serialization (Theme 1), assert the emitted request URL/body in a unit test, not
  just the snapshot.
