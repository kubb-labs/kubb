# Kubb v5 — @kubb/agent Changes for Studio Support

This document covers the changes needed in the `@kubb/agent` package (`packages/agent/`) to fully support Kubb Studio's v5 migration.

## Generic Agent Design

The agent does not have any context about the options of a plugin or adapter. We ship default plugins and a default adapter (`@kubb/adapter-oas`), but the Kubb community can write their own plugins and adapters. Those third-party plugins and adapters must be secure and defined in the Docker image, which exposes what is possible to set as options in Kubb Studio.

What we want is a **generic agent that can work with kubb with any plugins and any adapter** — without the agent itself knowing the specific option shapes ahead of time.

### Implications for the agent

- **No hard-coded plugin/adapter option types.** `JSONKubbConfig` should treat plugin and adapter `options` as opaque `object`/`unknown` blobs. The agent must not import plugin packages just to type their options.
- **Discovery happens in the Docker image, not the agent.** The set of available plugins and adapters — and the JSON schema of their options that Studio renders forms from — is determined by what is installed in the Docker image. The agent only resolves and forwards what is already present.
- **Trust boundary is the image.** Because the image author chose which plugins/adapters to install, anything the agent loads via `resolvePlugins`/`resolveAdapter` is implicitly trusted. The agent should not download or `npm install` plugins at runtime.
- **Schema surfacing.** Each plugin/adapter ships its own option schema (e.g. via the `plugin-*.yaml` / `adapter-*.yaml` files in `schemas/`). Studio reads those schemas — served by the agent from the installed packages — to render UI. The agent's job is to enumerate installed plugins/adapters and serve their schemas, not to hard-code them.
- **Forward, don't validate option contents.** The agent passes Studio's `options` blob straight to the plugin/adapter factory. Validation against the plugin's own schema is the plugin's responsibility, not the agent's.

This generic design is the reason Step 1's `JSONKubbConfig.adapter` block stays minimal and open-ended, and the reason `resolvePlugins`/`resolveAdapter` work off package names alone rather than a curated allow-list.

See [ADR-0002](./adr/0002_kubb_agent.md) for the full decision record.

## Affected Files

| File | Change |
|------|--------|
| `server/types/agent.ts` | Extend `JSONKubbConfig` to expose adapter/middleware options; align `KubbHooks` data tuples |
| `server/utils/resolvePlugins.ts` | Verify v5 plugin package names resolve; add `@kubb/renderer-jsx` warning |
| `server/utils/mergePlugins.ts` | Verify deep merge handles `barrel` object and v5 plugin option shapes |
| `server/utils/connectStudio.ts` | Pass `adapter`/`middleware` from disk config; add v4 `barrelType` deprecation warning |
| `server/utils/generate.ts` | Pass `adapter` and `middleware` from merged config to `createKubb()` |
| `server/utils/ws.ts` | Confirm `Map→Record` conversion; remove unnecessary `FileNode` double-cast |

---

## Step 1 — Extend `server/types/agent.ts`

### Extended `JSONKubbConfig`

Currently `JSONKubbConfig` only carries `plugins` and `input`. In v5 the studio UI may want to configure top-level adapter settings (e.g. which server to use, content-type selection). Extend the type to support an optional `adapter` block:

```ts
// Current
export type JSONKubbConfig = {
  plugins?: Array<{ name: string; options: object }>
  input?: string  // sandbox only
}

// Proposed v5 extension
export type JSONKubbConfig = {
  plugins?: Array<{ name: string; options: object }>
  input?: string  // sandbox only
  /** Adapter-level overrides sent from Studio UI */
  adapter?: {
    serverIndex?: number
    serverVariables?: Record<string, string>
    contentType?: string
    validate?: boolean
  }
}
```

This allows Studio to expose server selection and content-type controls without touching the underlying `kubb.config.ts` on disk.

### `KubbHooks` subset — align data shapes with `ws.ts`

Cross-check the locally defined `KubbHooks` event tuple shapes against what `setupEventsStream()` in `ws.ts` actually emits.
Each event carries a single `ctx` object, mirroring the `[ctx: KubbXxxContext]` style used in `@kubb/core`:

| Event | `data` shape |
|-------|--------------|
| `kubb:plugin:start` | `[ctx: { plugin: { name: string } }]` |
| `kubb:plugin:end` | `[ctx: { plugin: { name: string }; duration: number; success: boolean }]` |
| `kubb:files:processing:start` | `[ctx: { total: number }]` |
| `kubb:file:processing:update` | `[ctx: { file: string; processed: number; total: number; percentage: number }]` |
| `kubb:files:processing:end` | `[ctx: { total: number }]` |
| `kubb:generation:start` | `[ctx: { name?: string; plugins: number }]` |
| `kubb:generation:end` | `[ctx: { config: Config; files: FileNode[]; sources: Record<string, string> }]` |
| `kubb:info` | `[ctx: { message: string; info?: string }]` |
| `kubb:success` | `[ctx: { message: string; info?: string }]` |
| `kubb:warn` | `[ctx: { message: string; info?: string }]` |
| `kubb:error` | `[ctx: { message: string; stack?: string }]` |

---

## Step 2 — Update `server/utils/connectStudio.ts`

### Pass `adapter` and `middleware` from disk config

When building the final config for `generate()`, the agent currently spreads the disk config and overrides `plugins`. In v5 the disk config may also carry `adapter`, `middleware`, and `parsers` fields that must be preserved:

```ts
// Current (incomplete for v5)
const finalConfig = {
  ...config,
  root,
  input: isSandbox ? { data: patch?.input ?? '' } : undefined,
  storage: effectiveWrite ? fsStorage() : memoryStorage(),
  plugins,
}

// v5 — also pass adapter override from studio JSON
const finalConfig = {
  ...config,           // carries disk adapter, middleware, parsers
  root,
  input: isSandbox ? { data: patch?.input ?? '' } : undefined,
  storage: effectiveWrite ? fsStorage() : memoryStorage(),
  plugins,
  // Merge adapter options from studio JSON if provided
  adapter: patch?.adapter
    ? mergeAdapterOptions(config.adapter, patch.adapter)
    : config.adapter,
}
```

Implement a `mergeAdapterOptions(disk, studio)` helper that deep-merges studio overrides onto the disk adapter options.

### Deprecation warning for v4 `barrelType`

Add a startup check when loading the disk config:

```ts
for (const plugin of config.plugins ?? []) {
  if ((plugin.options as any)?.barrelType !== undefined) {
    logger.warn(
      `Plugin "${plugin.name}" uses deprecated "barrelType". Migrate to "barrel: { type }" for kubb v5.`
    )
  }
}
```

---

## Step 3 — Update `server/utils/generate.ts`

The `createKubb()` call must forward the full v5 config including `adapter`, `middleware`, and `parsers`:

```ts
// v5 createKubb signature
const kubb = createKubb({
  ...finalConfig,
  // adapter: adapterOas({ ... })  ← comes from disk config or studio override
  // middleware: [middlewareBarrel()]  ← comes from disk config
  // parsers: [parserTs]  ← comes from disk config (defaults applied by createKubb)
}, { hooks })
```

No structural change is needed if `finalConfig` already spreads the disk config correctly (Step 2). Confirm that `createKubb` defaults the adapter to `adapterOas()` and parsers to `[parserTs]` when not provided — so sandbox mode (no disk config) still works without requiring an explicit adapter.

---

## Step 4 — Verify `server/utils/resolvePlugins.ts`

1. **Plugin package names** — v5 plugins live in `kubb-labs/plugins`. Confirm camelCase heuristic resolves correctly:
   - `@kubb/plugin-ts` → `pluginTs` ✓
   - `@kubb/plugin-react-query` → `pluginReactQuery` ✓
   - `@kubb/plugin-vue-query` → `pluginVueQuery` ✓
   - `@kubb/plugin-mcp` → `pluginMcp` ✓

2. **`@kubb/renderer-jsx` peer** — required by all v5 plugins but not imported by the agent. If it is not resolvable, emit a clear warning on startup:
   ```ts
   try { await import('@kubb/renderer-jsx') } catch {
     logger.warn('Missing peer dependency @kubb/renderer-jsx — install it alongside kubb plugins.')
   }
   ```

---

## Step 5 — Verify `server/utils/mergePlugins.ts`

Confirm the deep merge handles all v5 plugin option shapes correctly:

| Option | v4 shape | v5 shape | Merge concern |
|--------|----------|----------|---------------|
| `barrel` | `barrelType: 'named'` (string) | `barrel: { type: 'named' }` (object) | Object replace, not string concat |
| `barrel: false` | n/a | `barrel: false` | Must not be overwritten by disk default |
| `coercion` (plugin-zod) | n/a | `{ dates?: boolean; strings?: boolean }` (object) | Object replace |
| `infinite` (react/vue-query) | n/a | `{ queryParam, nextParam, initialPageParam }` or `false` | `false` opt-out must survive merge |
| `query`/`mutation` | n/a | `{ methods, importPath }` or `false` | Same |
| `client` | `{ importPath }` | `{ client, dataReturnType, baseURL, bundle, … }` | Object replace |

Add focused tests for the `barrel: false`, `infinite: false`, `query: false`, and `mutation: false` opt-out cases to confirm they are not silently overwritten by a deep merge with a disk config that enables them.

---

## Step 6 — Confirm `server/utils/ws.ts`

1. **`kubb:generation:end` sources** — confirm the `Map<string, string> → Record<string, string>` conversion runs before `JSON.stringify`.
2. **`FileNode` cast** — if `safeBuild()` already returns `FileNode[]`, remove the `as unknown as FileNode[]` double-cast.

---

## V5 Full Config Format Reference

For context, the disk `kubb.config.ts` the agent loads can now use any of these top-level fields:

```ts
import { defineConfig } from 'kubb'
import { adapterOas } from '@kubb/adapter-oas'
import { middlewareBarrel } from '@kubb/middleware-barrel'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  root: '.',
  input: { path: './openapi.yaml' },
  output: {
    path: './src/gen',
    clean: true,
    format: 'prettier',          // 'auto' | 'prettier' | 'biome' | 'oxfmt' | false
    lint: 'eslint',              // 'auto' | 'eslint' | 'biome' | 'oxlint' | false
    barrel: { type: 'named' },  // root barrel; requires middlewareBarrel()
  },
  adapter: adapterOas({
    validate: true,
    serverIndex: 0,              // which server object to use
    serverVariables: { env: 'prod' },
    contentType: 'application/json',
    discriminator: 'strict',     // 'strict' | 'inherit'
    dateType: 'string',          // 'date' | 'string'
    integerType: 'number',       // 'number' | 'bigint'  (v5 default is 'bigint')
    unknownType: 'unknown',      // 'unknown' | 'any'
    emptySchemaType: 'object',
  }),
  middleware: [middlewareBarrel()],  // generates index barrel files
  plugins: [ pluginTs({ … }) ],
  hooks: { done: 'prettier --write src/gen' },
  devtools: { studioUrl: 'https://studio.kubb.dev' },
})

// defineConfig also accepts an array for multiple specs:
export default defineConfig([
  { name: 'v1', input: { path: './v1.yaml' }, … },
  { name: 'v2', input: { path: './v2.yaml' }, … },
])
```

**Agent impact:** when the disk config is an array, `loadConfig` returns the first entry. Consider adding support for a `name` selector so Studio can target a specific config in a multi-config setup.

---

## Verification

1. `vitest run` inside `packages/agent/` — all tests pass
2. Start agent against a v5 `kubb.config.ts` with `adapter`, `middleware`, and multiple plugins — confirm `ConnectedMessage` carries the correct config shape
3. Trigger generation from Studio — confirm all `kubb:` events stream and `kubb:generation:end` delivers `FileNode[]` with `Record<string, string>` sources
4. Test `barrel: false`, `infinite: false`, and `query: false` opt-outs survive `mergePlugins`
5. Confirm `@kubb/renderer-jsx` missing-peer warning appears when the package is not installed
6. Confirm array `defineConfig` emits a clear warning/selection prompt rather than silently using index 0
