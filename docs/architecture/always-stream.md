# Unify to Always-Stream

This document describes the plan to remove the dual `inputNode` / `inputStreamNode` code paths and always use streaming for OpenAPI spec processing, regardless of spec size.

## Current State

Two mutually exclusive code paths exist in `KubbDriver.ts`, gated by `STREAM_SCHEMA_THRESHOLD = 100`:

- **Eager** (`inputNode`): `adapter.parse()` returns `SchemaNode[]` / `OperationNode[]` in memory. Plugins run sequentially via `runAstPlugin()`.
- **Streaming** (`inputStreamNode`): `adapter.stream()` returns `AsyncIterable`s. A single-pass fan-out dispatches each node to all plugins concurrently via `runStreamPlugins()`.

The threshold check happens in `KubbDriver.#registerAdapter()`. Below 100 schemas, the eager path is used. Above 100, the streaming path kicks in.

## Motivation

- **One code path to maintain.** `runAstPlugin()` (~90 lines) and `runStreamPlugins()` (~150 lines) are structurally different. Removing one eliminates a class of "works in path A but not path B" bugs.
- **Consistent behavior.** Plugin authors do not need to worry about execution order differences between small and large specs.
- **Future-proof.** Optimizations like `optionsAreStatic` only need to exist in one place.

## Key Constraint: `inputNode.schemas` Usage in Plugins

After auditing the plugins repo, `inputNode.schemas` is used in 4 ways:

| Usage | Plugins | What it actually needs |
|---|---|---|
| `ast.findCircularSchemas(inputNode.schemas)` | faker (2x), zod (2x) | Schema name-to-refs graph (not full nodes) |
| `resolveSchemaRef(node, inputNode.schemas)` | faker (1x) | Name-to-schema lookup map |
| `inputNode.schemas.filter(s => isEnum(s))` | ts (2x) | Set of enum schema names |
| `resolver.resolveBanner(inputNode, ...)` | all plugins (36x) | Only `meta.title` / `meta.version` |

Additionally, `inputNode.meta?.baseURL` is accessed directly by plugin-client (3x) and plugin-mcp uses `.meta?.title`/`.meta?.version`.

None of these require the full `SchemaNode[]` array at generator call-time. They can all be pre-computed during the adapter's `stream()` pre-scan and stored on `InputMeta`.

## Solution: Enrich `InputMeta` During Adapter Pre-scan

The adapter's `stream()` already does a pre-scan for discriminator maps. Extend this to also compute:

```typescript
export type InputMeta = {
  /**
   * API title from `info.title` in the source document.
   */
  title?: string
  /**
   * API description from `info.description` in the source document.
   */
  description?: string
  /**
   * API version string from `info.version` in the source document.
   */
  version?: string
  /**
   * Resolved base URL from the first server entry in the source document.
   */
  baseURL?: string
  /**
   * Names of schemas that participate in a circular reference chain.
   * Computed once during the adapter pre-scan — use this instead of calling
   * `findCircularSchemas` per generator call.
   *
   * @example Wrap a circular schema in z.lazy()
   * ```ts
   * const circular = new Set(meta.circularNames)
   * if (circular.has(schema.name)) { ... }
   * ```
   */
  circularNames: readonly string[]
  /**
   * Names of schemas whose type is `enum`.
   * Computed once during the adapter pre-scan — use this instead of filtering
   * `inputNode.schemas` per generator call.
   *
   * @example Check if a referenced schema is an enum
   * `const isEnum = meta.enumNames.includes(schemaName)`
   */
  enumNames: readonly string[]
}
```

Both `circularNames` and `enumNames` are plain `string[]` arrays, so `InputMeta` is fully JSON-serializable. No `Set`, no `Map`, no deep objects. `document` is intentionally omitted -- the OAS adapter already exposes `adapter.document` directly, so adding it here would force it into serialization for every consumer.

During the pre-scan in `adapter.stream()`:

```typescript
const collectedNodes: ast.SchemaNode[] = []
const enumNames: string[] = []
for (const [name, schema] of Object.entries(schemas)) {
  const node = _preParser({ schema, name }, parserOptions)
  collectedNodes.push(node)
  if (ast.narrowSchema(node, ast.schemaTypes.enum) && node.name) {
    enumNames.push(node.name)
  }
}
const circularNames = [...ast.findCircularSchemas(collectedNodes)]
```

`collectedNodes` is discarded after this block. Only the two name arrays survive into `InputMeta`, keeping memory proportional to schema count rather than schema size.

## Banner/Footer: `InputNode` to `InputMeta`

`resolveBanner`/`resolveFooter` only use `node?.meta?.title` and `node?.meta?.version`. Change their signature:

```typescript
// Before
resolveBanner(node: InputNode | null, context: ResolveBannerContext): string | undefined

// After
resolveBanner(meta: InputMeta | undefined, context: ResolveBannerContext): string | undefined
```

Also change the public `output.banner` / `output.footer` function callback:

```typescript
// Before
banner?: string | ((node?: InputNode) => string)

// After
banner?: string | ((meta?: InputMeta) => string)
```

## Replacing `context.inputNode` with `context.meta`

In `defineGenerator.ts`, replace `inputNode: InputNode` with `meta: InputMeta` on `GeneratorContext`. Plugin migration:

| Before | After |
|---|---|
| `ast.findCircularSchemas(inputNode.schemas)` | `new Set(meta.circularNames)` |
| `resolveSchemaRef(node, inputNode.schemas)` | adapter inlines top-level refs before yielding -- `ref` nodes no longer reach generators as top-level schemas |
| `inputNode.schemas.filter(s => isEnum).map(s => s.name)` | `meta.enumNames` |
| `inputNode.meta?.baseURL` | `meta.baseURL` |
| `resolver.resolveBanner(inputNode, ...)` | `resolver.resolveBanner(meta, ...)` |

## `openInStudio`: Keep Using `parse()` Lazily

When `config.devtools` is set and `openInStudio()` is called, lazy-call `adapter.parse()` to get the full `InputNode`. This is a rare devtools-only path that does not affect the streaming generation pipeline:

```typescript
openInStudio(options?: DevtoolsOptions) {
  if (!driver.config.devtools || driver.#studioIsOpen) return
  const input = driver.inputNode ?? await driver.adapter!.parse(source)
  return openInStudioFn(input, studioUrl, options)
}
```

## `collectUsedSchemaNames` in Streaming

Port the pruning logic from `runAstPlugin()` into `runStreamPlugins()`:

1. Pre-scan operations (first pass of `operationsIterable`) to determine included operations per plugin.
2. Compute `allowedSchemaNames` per plugin using `collectUsedSchemaNames`.
3. Skip non-allowed schemas during schema fan-out.

The adapter caches the parsed document, so re-iterating `operationsIterable` is cheap.

## Phased Implementation

### Phase 1: Enrich `InputMeta`

- Add `circularNames` and `enumNames` to `InputMeta` type in `@kubb/ast`.
- In `adapter.stream()`, compute both during the existing pre-scan loop. Discard the temporary `SchemaNode[]` after computing `circularNames`.
- In `adapter.parse()`, compute from the full `SchemaNode[]` already in memory and store on `meta`.
- Both fields are `readonly string[]` -- fully JSON-serializable, no `Set`, no `Map`.

### Phase 2: Change Banner/Footer Signature

- Change `resolveBanner`/`resolveFooter` from `InputNode | null` to `InputMeta | undefined`.
- Change `output.banner`/`output.footer` function callback from `InputNode` to `InputMeta`.
- Update all 36 call sites in the plugins repo.

### Phase 3: Replace `context.inputNode` with `context.meta`

- Change `GeneratorContext.inputNode` to `GeneratorContext.meta: InputMeta`.
- Update `KubbDriver.getContext()` getter.
- Migrate plugin-faker (circular + adapter-level ref inlining), plugin-ts (enumNames), plugin-zod (circular), plugin-client (baseURL), plugin-mcp (title/version).

### Phase 4: `openInStudio` Lazy Parse Fallback

- When devtools is enabled, lazy-call `adapter.parse()` on demand.
- No change to the streaming generation path.

### Phase 5: Port `collectUsedSchemaNames` to Streaming

- Pre-scan operations, compute `allowedSchemaNames` per plugin.
- Skip non-allowed schemas during schema dispatch.

### Phase 6: Always Stream, Remove Eager Path

- Remove `STREAM_SCHEMA_THRESHOLD` and `count()` call.
- Always call `adapter.stream()` (fallback: wrap `parse()` result in single-yield `AsyncIterable`).
- Delete `runAstPlugin()` from `createKubb.ts`.
- Remove `inputNode` property from `KubbDriver` (keep only for lazy devtools).
- Update tests.
