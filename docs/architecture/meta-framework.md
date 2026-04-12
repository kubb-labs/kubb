# Kubb as a Meta-Framework — Plugin Architecture Research

> Primary model: Astro's integration architecture, with additional ideas from Hono, Elysia, and Express.js

## Status

Draft — proposal for discussion (breaking changes accepted)

## Core Thesis

Astro is the closest meta-framework analogy to Kubb. Both are **build-time code transformation frameworks** that:

- Take an input source (Astro: `.astro`/`.md` files, Kubb: OpenAPI/AsyncAPI specs)
- Process it through a pipeline of integrations/plugins
- Output generated files (Astro: HTML/JS, Kubb: TypeScript/Zod/clients)
- Support multiple renderers for the same content (Astro: React/Vue/Svelte, Kubb: JSX/templates/strings)

This document proposes restructuring Kubb's plugin API to match Astro's integration architecture. **Breaking changes in concepts are acceptable** — the goal is the right architecture, not backward compatibility.

---

## Astro's Architecture (Reference)

### The Integration is Everything

In Astro, an integration is a single object with **namespaced lifecycle hooks**. Each hook receives a context object with utility functions — the integration doesn't return capabilities, it **calls** them:

```ts
// @astrojs/react — a complete Astro integration
export default function react(): AstroIntegration {
  return {
    name: '@astrojs/react',
    hooks: {
      'astro:config:setup'({ addRenderer, updateConfig, injectScript }) {
        // Register the React renderer (server + client entrypoints)
        addRenderer({
          name: '@astrojs/react',
          serverEntrypoint: '@astrojs/react/server.js',
          clientEntrypoint: '@astrojs/react/client.js',
        })

        // Inject the Vite plugin for JSX
        updateConfig({
          vite: { plugins: [vitePluginReact()] },
        })
      },

      'astro:build:done'({ dir, logger }) {
        logger.info(`React components built to ${dir}`)
      },
    },
  }
}
```

### Astro's Key Design Decisions

| Decision | How Astro does it |
|---|---|
| **Extension point** | Integration object with `hooks` |
| **Lifecycle** | Namespaced hooks: `astro:config:setup`, `astro:config:done`, `astro:build:start`, `astro:build:done` |
| **Capabilities** | Injected via hook context: `addRenderer()`, `updateConfig()`, `injectScript()`, `injectRoute()` |
| **Renderers** | Separate concept, registered BY integrations via `addRenderer()` |
| **Data sources** | Content Layer / Content Collections — framework-level, not integration-level |
| **Ordering** | Integrations run in config order; no explicit `pre`/`post` |
| **Cross-integration** | Integrations communicate through config mutations and shared hooks |

### Astro's Hook Lifecycle

```
1. astro:config:setup     — Integrations register renderers, inject scripts, modify config
2. astro:config:done      — Config finalized, read-only access
3. astro:server:setup     — Dev server starting (dev only)
4. astro:build:start      — Build starting
5. astro:build:setup      — Configure Vite for build
6. astro:build:generated  — Static files generated
7. astro:build:done       — Build complete, files on disk
```

Each hook receives a typed context with exactly the utilities that make sense for that phase.

---

## Concept Mapping: Astro → Kubb

| Astro Concept | Kubb Equivalent | Current Kubb | Proposed Kubb |
|---|---|---|---|
| **Integration** | **Plugin** | `createPlugin` returns object with hooks | `definePlugin` returns object with `KubbEvents` |
| **Renderer** | **Generator** | `defineGenerator` with `schema()`/`operation()` + `renderer` | Generators registered via `addGenerator()` inside `kubb:setup` |
| **Content Layer** | **Adapter** | `createAdapter` parses input → `InputNode` | Unchanged — adapters remain project-level config |
| **Content Collection** | **InputNode** | `InputNode { schemas, operations, meta }` | Unchanged — the universal AST |
| **Page/Route** | **FileNode** | `FileNode { path, sources, imports }` | Unchanged — the output unit |
| **`astro.config.mjs`** | **`kubb.config.ts`** | `defineConfig({ adapter, plugins })` | `defineConfig({ adapter, integrations })` |
| **`addRenderer()`** | **`addGenerator()`** | N/A — generators are wired externally | Events receive `addGenerator()` utility |
| **`updateConfig()`** | **`updateConfig()`** | N/A | Events receive `updateConfig()` utility |
| **`injectScript()`** | **`injectFile()`** | `this.upsertFile()` in plugin context | Events receive `injectFile()` utility |
| **`injectRoute()`** | **`injectBarrel()`** | Auto-generated from `output.barrelType` | Events receive `injectBarrel()` for custom barrel files |

---

## Proposed Architecture

### The Plugin Uses `KubbEvents`

Replace the current flat hook model (`buildStart`, `schema`, `operation`) with Astro-style namespaced events (`KubbEvents`) that receive typed context objects:

```ts
import { definePlugin } from '@kubb/core'

export default definePlugin({
  name: '@kubb/typescript',

  hooks: {
    // Phase 1: Setup — register generators, configure resolver, inject files
    'kubb:setup'({ addGenerator, setResolver, setTransformer, updateConfig, logger }) {
      setResolver({
        name(name, type) {
          return type === 'type' ? pascalCase(name) : camelCase(name)
        },
      })

      addGenerator({
        name: 'types',
        schema(node, ctx) {
          const name = ctx.resolver.name(node.name, 'type')
          const file = ctx.resolver.file({ name, extname: '.ts' })
          return (
            <File baseName={file.baseName} path={file.path}>
              <Type node={node} enumType={ctx.options.enumType} />
            </File>
          )
        },
      })
    },

    // Phase 2: Build start — initialization
    'kubb:build:start'({ config, logger }) {
      logger.info('TypeScript generation starting')
    },

    // Phase 3: Build done — post-processing
    'kubb:build:done'({ files, logger }) {
      logger.info(`Generated ${files.length} TypeScript files`)
    },
  },
})
```

### How This Differs from Astro

Kubb's events need to handle **per-node generation** (schema/operation), which Astro doesn't have. In Astro, renderers handle individual component rendering. In Kubb, generators handle individual node generation. The generator IS the renderer equivalent:

| Astro | Kubb |
|---|---|
| Integration registers renderers via `addRenderer()` | Plugin registers generators via `addGenerator()` |
| Astro core calls renderer for each component | Kubb core calls generator for each schema/operation |
| Renderer has `serverEntrypoint` + `clientEntrypoint` | Generator has `schema()` + `operation()` + `operations()` |

### The Full Event Lifecycle (`KubbEvents`)

```
1. kubb:setup              — Register generators, resolver, transformer, inject config
2. kubb:config:done        — Config finalized, read-only access
3. kubb:build:start        — Build starting, adapter has parsed input
4. kubb:generate:schema    — (Generator event) Called per schema node
5. kubb:generate:operation — (Generator event) Called per operation node
6. kubb:generate:done      — (Generator event) Called after all nodes processed
7. kubb:build:done         — All plugins done, files on disk
```

Events 4–6 are **not** on the integration itself — they're on the generators that the integration registered. This matches Astro where the rendering happens inside the renderer, not the integration.

---

## What This Looks Like in Practice

### Simple Plugin (Before vs After)

**Before — Current API (6 files, 6 concepts):**

```ts
// resolvers/resolverHello.ts
export const resolverHello = defineResolver<PluginHello>(() => ({
  name: 'default',
  pluginName: 'plugin-hello',
}))

// generators/helloGenerator.tsx
export const helloGenerator = defineGenerator<PluginHello>({
  name: 'hello',
  renderer: jsxRenderer,
  schema(node, options) {
    return <File ...><Hello node={node} /></File>
  },
})

// presets.ts
export const presets = definePresets<ResolverHello>({
  default: { name: 'default', resolver: resolverHello, generators: [helloGenerator] },
})

// types.ts
export type PluginHello = PluginFactoryOptions<'plugin-hello', Options, ResolvedOptions, ...>

// plugin.ts
export const pluginHello = createPlugin<PluginHello>((options) => {
  const preset = getPreset({ preset: 'default', presets })
  const mergedGenerator = mergeGenerators(preset.generators)
  return {
    name: 'plugin-hello',
    get resolver() { return preset.resolver },
    async schema(node, options) { return mergedGenerator.schema?.call(this, node, options) },
    async buildStart() { await this.openInStudio({ ast: true }) },
  }
})
```

**After — Astro-style API (1 file, 1 concept):**

```tsx
// plugin.ts
import { definePlugin } from '@kubb/core'

export const pluginHello = definePlugin((options = {}) => ({
  name: 'plugin-hello',

  hooks: {
    'kubb:setup'({ addGenerator, logger }) {
      addGenerator({
        name: 'hello',
        schema(node, ctx) {
          const name = ctx.resolver.name(node.name, 'type')
          const file = ctx.resolver.file({ name, extname: '.ts' })
          return (
            <File baseName={file.baseName} path={file.path}>
              <File.Source name={name} isExportable>
                {`export type ${name} = { greeting: '${options.greeting ?? 'Hello'}' }`}
              </File.Source>
            </File>
          )
        },
      })
    },
  },
}))
```

### Medium Plugin — `plugin-ts` Rewritten

```tsx
import { definePlugin } from '@kubb/core'
import { jsxRenderer } from '@kubb/renderer-jsx'
import { Type } from './components/Type.tsx'

export const pluginTs = definePlugin((options = {}) => {
  const {
    output = { path: 'types', barrelType: 'named' },
    enumType = 'asConst',
    syntaxType = 'type',
  } = options

  return {
    name: 'plugin-ts',

    hooks: {
      'kubb:setup'({ addGenerator, setResolver, setTransformer, updateConfig, setRenderer }) {
        // Set JSX as the output renderer for this plugin
        setRenderer(jsxRenderer)

        // Naming conventions
        setResolver({
          name(name, type) {
            return type === 'type' ? pascalCase(name) : pascalCase(name, { isFile: type === 'file' })
          },
          // path, file, options, banner, footer — all have defaults, override only what you need
        })

        // Register the type generator
        addGenerator({
          name: 'typescript-types',
          schema(node, ctx) {
            if (!node.name) return

            const { resolver, adapter, root, options } = ctx
            const file = resolver.file({ name: node.name, extname: '.ts' })
            const imports = adapter.getImports(node, (schemaName) => ({
              name: resolver.name(schemaName, 'type'),
              path: resolver.file({ name: schemaName, extname: '.ts' }).path,
            }))

            return (
              <File
                baseName={file.baseName}
                path={file.path}
                banner={resolver.banner(adapter.inputNode)}
                footer={resolver.footer(adapter.inputNode)}
              >
                {imports.map((imp) => (
                  <File.Import key={imp.name} path={imp.path} name={imp.name} isTypeOnly />
                ))}
                <Type node={node} enumType={enumType} syntaxType={syntaxType} resolver={resolver} />
              </File>
            )
          },
        })
      },

      'kubb:build:start'({ logger, openInStudio }) {
        openInStudio({ ast: true })
      },

      'kubb:build:done'({ files, logger }) {
        logger.info(`Generated ${files.length} TypeScript type files`)
      },
    },
  }
})
```

### Complex Plugin — `plugin-client` Rewritten

```tsx
import { definePlugin } from '@kubb/core'
import { jsxRenderer } from '@kubb/renderer-jsx'
import { FunctionClient } from './components/FunctionClient.tsx'
import { ClassClient } from './components/ClassClient.tsx'

export const pluginClient = definePlugin((options = {}) => {
  const {
    output = { path: 'clients', barrelType: 'named' },
    clientType = 'function',
    client = 'axios',
  } = options

  return {
    name: 'plugin-client',

    // Dependencies — like Astro integration ordering but explicit
    dependencies: ['plugin-ts'],

    hooks: {
      'kubb:setup'({ addGenerator, setResolver, setRenderer, injectFile, logger }) {
        setRenderer(jsxRenderer)

        setResolver({
          name(name, type) {
            return type === 'type' ? pascalCase(name) : camelCase(name, { isFile: type === 'file' })
          },
        })

        // Conditionally register generators based on options
        if (clientType === 'function') {
          addGenerator({
            name: 'function-client',
            operation(node, ctx) {
              const name = ctx.resolver.name(node.operationId, 'function')
              const file = ctx.resolver.file({ name, extname: '.ts' })
              return (
                <File baseName={file.baseName} path={file.path}>
                  <FunctionClient node={node} options={ctx.options} />
                </File>
              )
            },
          })
        } else if (clientType === 'class') {
          addGenerator({
            name: 'class-client',
            operation(node, ctx) {
              const name = ctx.resolver.name(node.operationId, 'function')
              const file = ctx.resolver.file({ name, extname: '.ts' })
              return (
                <File baseName={file.baseName} path={file.path}>
                  <ClassClient node={node} options={ctx.options} />
                </File>
              )
            },
          })
        }

        // Inject bundled client file (like Astro's injectScript)
        if (client === 'fetch') {
          injectFile({
            baseName: 'fetch.ts',
            path: '.kubb/fetch.ts',
            content: fetchClientSource,
          })
        }
      },

      'kubb:build:start'({ getPlugin, logger }) {
        const tsPlugin = getPlugin('plugin-ts')
        if (!tsPlugin) {
          logger.warn('plugin-client requires plugin-ts to be installed')
        }
      },
    },
  }
})
```

### How `@astrojs/react` Maps to `@kubb/plugin-ts`

Side-by-side comparison of the exact same pattern:

```ts
// @astrojs/react — Astro integration
export default function react(): AstroIntegration {
  return {
    name: '@astrojs/react',
    hooks: {
      'astro:config:setup'({ addRenderer, updateConfig }) {
        addRenderer({
          name: '@astrojs/react',
          serverEntrypoint: '@astrojs/react/server.js',
          clientEntrypoint: '@astrojs/react/client.js',
        })
        updateConfig({ vite: { plugins: [vitePluginReact()] } })
      },
    },
  }
}

// @kubb/plugin-ts — Kubb integration (proposed)
export default function typescript(): KubbIntegration {
  return {
    name: '@kubb/typescript',
    hooks: {
      'kubb:setup'({ addGenerator, setResolver, setRenderer }) {
        setRenderer(jsxRenderer)
        setResolver({ name: (n, t) => t === 'type' ? pascalCase(n) : camelCase(n) })
        addGenerator({
          name: 'types',
          schema(node, ctx) { /* generate TypeScript type for this schema */ },
        })
      },
    },
  }
}
```

The structural parallel is 1:1:
- `addRenderer()` → `addGenerator()` — register processing logic
- `updateConfig()` → `setResolver()` / `setRenderer()` — configure processing options
- `astro:config:setup` → `kubb:setup` — setup phase before build
- `astro:build:done` → `kubb:build:done` — cleanup after build

---

## Breaking Changes Required

### 1. `createPlugin` → `definePlugin`

**Breaking:** Rename and restructure the plugin factory.

```ts
// Before
export const pluginTs = createPlugin<PluginTs>((options) => ({
  name: 'plugin-ts',
  get resolver() { return preset.resolver },
  async schema(node, options) { return mergedGenerator.schema?.call(this, node, options) },
  async buildStart() { /* ... */ },
}))

// After
export const pluginTs = definePlugin((options = {}) => ({
  name: 'plugin-ts',
  hooks: {
    'kubb:setup'({ addGenerator, setResolver }) { /* ... */ },
    'kubb:build:start'({ logger }) { /* ... */ },
    'kubb:build:done'({ files }) { /* ... */ },
  },
}))
```

**What changes:**
- `schema()`, `operation()`, `operations()` move from the plugin object into generators registered via `addGenerator()`
- `resolver` / `transformer` properties become `setResolver()` / `setTransformer()` calls inside `kubb:setup`
- `buildStart` / `buildEnd` become `kubb:build:start` / `kubb:build:done` events
- The `this` context is replaced by the event context parameter (no more binding issues)

### 2. Generators Are Registered, Not Wired

**Breaking:** Generators are no longer merged externally and passed to the plugin. They're registered from within the `kubb:setup` event.

```ts
// Before
const preset = getPreset({ preset: compatibilityPreset, presets, ... })
const mergedGenerator = mergeGenerators(preset.generators)
return {
  async schema(node, opts) { return mergedGenerator.schema?.call(this, node, opts) },
}

// After
'kubb:setup'({ addGenerator }) {
  addGenerator(typeGenerator)
  addGenerator(enumGenerator)
  // Merging happens inside the framework, not the plugin
}
```

**What changes in core:**
- `PluginDriver` stores generators per-plugin
- `build.ts` calls generators in registration order for each node
- `mergeGenerators` becomes an internal implementation detail
- `defineGenerator` still exists — generators are still typed objects — but they're consumed via `addGenerator()`

### 3. Resolver as a Setup Call

**Breaking:** The resolver is set during setup, not returned as a property.

```ts
// Before
get resolver() { return preset.resolver }

// After
'kubb:setup'({ setResolver }) {
  setResolver({
    name(name, type) { /* custom naming */ },
    // Everything else uses defaults
  })
}
```

**What changes in core:**
- `defineResolver` still exists for creating resolver objects
- `setResolver()` in the event context merges user overrides with defaults (like `getPreset`'s `withFallback`)
- If `setResolver()` is never called, the default resolver is used automatically

### 4. `pre`/`post` → `dependencies`

**Breaking:** Replace `pre`/`post` arrays with a single `dependencies` array for clearer semantics.

```ts
// Before
pre: ['plugin-ts', 'plugin-zod'],
post: ['plugin-barrel'],

// After
dependencies: ['plugin-ts', 'plugin-zod'],
// "run after" semantics (like npm dependencies — I depend on these)
```

**Why:** Astro doesn't have explicit ordering — integrations run in config array order. But Kubb needs ordering for cross-plugin dependencies (e.g., `plugin-client` needs `plugin-ts` types). A single `dependencies` array is clearer than separate `pre`/`post`.

### 5. `this` Context → Event Parameters

**Breaking:** Replace `this`-based context with parameter-based context (like Astro hooks receive `{ config, logger }`).

```ts
// Before (this-based)
async buildStart() {
  await this.openInStudio({ ast: true })
  this.warn('Something happened')
  const tsPlugin = this.getPlugin('plugin-ts')
}

// After (parameter-based)
'kubb:build:start'({ openInStudio, logger, getPlugin }) {
  openInStudio({ ast: true })
  logger.warn('Something happened')
  const tsPlugin = getPlugin('plugin-ts')
}
```

**Why remove `this` and use events/parameters instead?**

The `this`-based pattern creates several concrete problems in the current codebase:

**1. `.call(this, ...)` is required everywhere — and it's error-prone**

Today, every plugin hook uses TypeScript's `this` parameter typing (`this: PluginContext<T>`), which means the framework must `.call(this, ...)` every time it invokes a hook. Look at what this looks like in practice:

```ts
// packages/plugin-ts/src/plugin.ts — current code (simplified)
async schema(this: GeneratorContext<PluginTs>, node: SchemaNode, options: ResolvedOptions) {
  return mergedGenerator.schema?.call(this, node, options)  // must forward `this`
},
async operation(this: GeneratorContext<PluginTs>, node: OperationNode, options: ResolvedOptions) {
  return mergedGenerator.operation?.call(this, node, options)  // must forward `this`
},
```

```ts
// packages/core/src/defineGenerator.ts — current code
const result = await gen.schema.call(this, node, options)   // must bind `this`
const result = await gen.operation.call(this, node, options) // must bind `this`
```

Every layer that delegates to another function must manually forward the `this` context. If you forget `.call(this, ...)` and write `mergedGenerator.schema(node, options)` instead, `this` becomes `undefined` at runtime — a silent bug that TypeScript cannot catch at compile time because `.call()` is a runtime binding.

In the Astro model, context flows as a regular parameter — no binding required:

```ts
// After: just pass ctx forward, or destructure what you need
schema(node, ctx) {
  return delegateToHelper(node, ctx)  // no .call() needed, just a normal argument
}
```

**2. `this` makes function extraction and composition harder**

With `this`-based context, you can't easily extract a hook handler to a separate function:

```ts
// This BREAKS — `this` is lost when extracting to a standalone function
const handleSchema = (node, options) => {
  this.resolver.default(node.name, 'type')  // ❌ `this` is undefined (arrow fn has no own `this`)
}

// You'd need this verbose workaround:
const handleSchema = function(this: GeneratorContext<PluginTs>, node, options) {
  this.resolver.default(node.name, 'type')  // current API: resolver.default() is the naming method
}
// And then: schema: handleSchema  (only works because .call() is done by the framework)
```

With parameter-based context, any function shape works:

```ts
// Extract freely — ctx is just data
const handleSchema = (node, ctx) => {
  ctx.resolver.name(node.name, 'type')  // ✅ works
}

// Compose naturally
const withLogging = (handler) => (node, ctx) => {
  ctx.logger.info(`Processing ${node.name}`)
  return handler(node, ctx)
}
```

**3. `this` typing requires the global `Kubb.PluginContext` namespace hack**

Kubb currently uses `declare global { namespace Kubb { interface PluginContext {} } }` so that `inject()` can augment the `this` type across plugins. This is a fragile pattern — it's a global mutation of types that makes it hard to reason about what `this` actually contains at any given point.

In the Astro model, cross-plugin capabilities are explicit:

```ts
'kubb:build:start'({ getPlugin }) {
  const tsPlugin = getPlugin('plugin-ts')  // Explicit, typed, no global namespace
}
```

**4. Astro solved this already — their hooks receive exactly what's available at each lifecycle stage**

Astro's `astro:config:setup` receives `{ addRenderer, updateConfig, injectScript }` — you can see exactly what you can do at that point. Astro's `astro:build:done` receives `{ dir, logger }` — different context for a different phase.

With `this`-based context, every hook sees the same monolithic `PluginContext<T>` type, even though some properties (like `adapter`, `inputNode`) are only available after the adapter has run. This is why `PluginContext` currently has a union type:

```ts
// Current: PluginContext is a union — adapter may or may not exist
type PluginContext = {
  config: Config
  root: string
  // ...
} & (
  | { inputNode: InputNode; adapter: Adapter }     // after adapter runs
  | { inputNode?: never; adapter?: never }          // before adapter runs
)
```

With namespaced events, each event's context type only includes what's actually available:

```ts
// kubb:setup — no adapter yet, but you can register generators
type KubbSetupContext = { addGenerator, setResolver, setRenderer, config, logger }

// kubb:generate:schema — adapter has run, everything is available
type GeneratorContext = { resolver, adapter, inputNode, options, root, logger }
```

**Summary:** The move from `this` to event parameters is not cosmetic — it eliminates `.call()` bugs, enables natural function composition, removes global type namespace hacks, and lets each event expose exactly the right context for its lifecycle phase. This is the same conclusion Astro reached when designing their integration API.

### 6. Config: `plugins` → `integrations`

**Optional:** Rename `plugins` to `integrations` in `kubb.config.ts` to match Astro terminology.

```ts
// Before
export default defineConfig({
  plugins: [pluginTs(), pluginZod()],
})

// After
export default defineConfig({
  integrations: [typescript(), zod(), client()],
})
```

This is cosmetic but signals the architectural shift. Could also keep `plugins` as an alias during migration.

---

## The New Event Context API (`KubbEvents`)

### `kubb:setup` Context

The most important event — where integrations configure everything:

```ts
type KubbSetupContext = {
  // Register a generator (like Astro's addRenderer)
  addGenerator(generator: Generator): void

  // Set the resolver for this plugin (naming + paths)
  setResolver(resolver: Partial<Resolver>): void

  // Set the AST transformer for this plugin
  setTransformer(visitor: Visitor): void

  // Set the output renderer for this plugin (JSX, templates, etc.)
  setRenderer(renderer: RendererFactory): void

  // Inject a file into the output (like Astro's injectScript)
  injectFile(file: { baseName: string; path: string; content: string }): void

  // Inject a barrel/index file
  injectBarrel(options: { type: 'named' | 'default'; path: string }): void

  // Modify the build config
  updateConfig(config: Partial<Config>): void

  // Read-only access to current config
  config: Config

  // Plugin options (from user)
  options: ResolvedOptions

  // Logger
  logger: Logger
}
```

### `kubb:build:start` Context

```ts
type KubbBuildStartContext = {
  config: Config
  adapter: Adapter
  inputNode: InputNode
  logger: Logger
  openInStudio(options?: DevtoolsOptions): Promise<void>
  getPlugin(name: string): Plugin | undefined
}
```

### `kubb:build:done` Context

```ts
type KubbBuildDoneContext = {
  files: FileNode[]
  config: Config
  logger: Logger
  outputDir: string
}
```

### Generator Context (passed to `schema()`/`operation()`)

```ts
type GeneratorContext = {
  // The resolved resolver for this plugin
  resolver: {
    name(name: string, type?: string): string
    file(params: { name: string; extname: string }): FileNode
    path(params: ResolverPathParams): string
    banner(inputNode: InputNode | null): string | undefined
    footer(inputNode: InputNode | null): string | undefined
  }

  // The adapter
  adapter: Adapter

  // Plugin options
  options: ResolvedOptions

  // Output root
  root: string

  // File utilities
  emitFile(...files: FileNode[]): Promise<void>

  // Cross-plugin access
  getPlugin(name: string): Plugin | undefined

  // Logger
  logger: Logger
}
```

---

## The Build Pipeline (Updated)

```
1. Parse config
   └── Resolve integrations (topological sort by `dependencies`)

2. Run adapter
   └── adapter.parse(input) → InputNode

3. For each integration:
   └── Call 'kubb:setup' event
       ├── addGenerator() → register generators
       ├── setResolver() → configure naming
       ├── setTransformer() → configure AST transforms
       ├── setRenderer() → configure output format
       └── injectFile() → add static files

4. Finalize config
   └── Call 'kubb:config:done' event (read-only)

5. Build
   └── Call 'kubb:build:start' event
   └── For each integration:
       └── For each registered generator:
           ├── Walk AST with transformer applied
           ├── For each schema → generator.schema(node, ctx)
           ├── For each operation → generator.operation(node, ctx)
           └── After all ops → generator.operations(nodes, ctx)
       └── Apply renderer to generator output → FileNode[]
       └── Generate barrel files

6. Post-process
   └── FileProcessor: parse → format → lint → write
   └── Call 'kubb:build:done' event
```

### Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                        kubb.config.ts                          │
│  adapter: adapterOas()                                         │
│  input:   { path: './openapi.yaml' }                          │
│  integrations: [ typescript(), zod(), client() ]               │
└──────────────┬─────────────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────────────┐
│                     Adapter Layer                               │
│  (= Astro Content Layer)                                       │
│  adapterOas / adapterAsyncApi / adapterDrizzle                 │
│  Input Source → parse() → InputNode (AST)                      │
└──────────────┬─────────────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────────────┐
│                  Integration Layer                              │
│  (= Astro Integration)                                         │
│                                                                │
│  typescript()                                                  │
│    └── kubb:setup → addGenerator('types')                      │
│                   → setResolver(pascalCase)                     │
│                   → setRenderer(jsxRenderer)                    │
│                                                                │
│  zod()                                                         │
│    └── kubb:setup → addGenerator('zod-schemas')                │
│                   → setResolver(camelCase + 'Schema' suffix)   │
│                   → setRenderer(jsxRenderer)                    │
│                                                                │
│  client()                                                      │
│    └── kubb:setup → addGenerator('function-client')            │
│                   → injectFile('fetch.ts')                     │
│    dependencies: ['plugin-ts']                                 │
│                                                                │
└──────────────┬─────────────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────────────┐
│                   Generator Layer                               │
│  (= Astro Renderer)                                            │
│                                                                │
│  For each node in InputNode:                                   │
│    transformer.visit(node) → transformed node                  │
│    resolver.resolveOptions(node) → include/exclude check       │
│    generator.schema(node, ctx) → JSX element                   │
│    renderer.render(element) → FileNode[]                       │
│                                                                │
└──────────────┬─────────────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────────────┐
│                    Output Layer                                 │
│  FileProcessor → Parser → Formatter → Linter → Storage         │
└────────────────────────────────────────────────────────────────┘
```

---

## Migration Path

### Phase 1: Introduce `definePlugin` with `KubbEvents`

Add the new `definePlugin` function alongside existing `createPlugin`. Both work during a transition period.

```ts
// New API
export const pluginTs = definePlugin((options) => ({
  name: 'plugin-ts',
  hooks: {
    'kubb:setup'({ addGenerator, setResolver }) { /* ... */ },
  },
}))

// Old API still works
export const pluginTsLegacy = createPlugin<PluginTs>((options) => ({
  name: 'plugin-ts',
  get resolver() { return preset.resolver },
  async schema(node, opts) { return merged.schema?.call(this, node, opts) },
}))
```

**Core changes:**
- Add `definePlugin` function that creates plugins in the new format
- `PluginDriver` detects hook-style vs legacy-style plugins
- Both formats produce the same internal `Plugin` object

### Phase 2: Migrate Built-in Plugins

Rewrite Kubb's built-in plugins to use the new API:

| Plugin | Status | Key changes |
|---|---|---|
| `plugin-ts` | Migrate | `resolverTs` + `typeGenerator` → `kubb:setup` with `setResolver()` + `addGenerator()` |
| `plugin-zod` | Migrate | `resolverZod` + `zodGenerator` → `kubb:setup` with `setResolver()` + `addGenerator()` |
| `plugin-client` | Migrate | Dynamic generator selection in `kubb:setup` based on `clientType` option |
| `plugin-react-query` | Migrate | Multiple generators: query, mutation, infinite, suspense |
| `plugin-faker` | Migrate | Single generator, simple migration |
| `plugin-msw` | Migrate | Single generator, simple migration |

### Phase 3: Deprecate Old API

- `createPlugin` → deprecated, points to `definePlugin`
- `definePresets` → internal (no longer exported from `@kubb/core`)
- `mergeGenerators` → internal (no longer exported from `@kubb/core`)
- `getPreset` → internal (no longer exported from `@kubb/core`)
- `defineResolver` → still public (for creating resolver objects, used with `setResolver()`)
- `defineGenerator` → still public (for creating generator objects, used with `addGenerator()`)

### Phase 4: Remove Legacy Support

Remove `createPlugin` and the flat hook model. All plugins use the `KubbEvents` API.

---

## What About Presets?

Presets (`definePresets`, `getPreset`) currently bundle resolver + generators + transformer into named configurations. In the Astro model, this responsibility shifts to the integration itself:

```ts
// Before: presets are a separate public concept
export const presets = definePresets<ResolverTs>({
  default: { resolver: resolverTs, generators: [typeGenerator], printer: printerTs },
  kubbV4: { resolver: resolverTsLegacy, generators: [typeGeneratorLegacy], printer: printerTs },
})

// After: presets are internal to the plugin
export const pluginTs = definePlugin((options = {}) => {
  const { compatibilityPreset = 'default' } = options

  return {
    name: 'plugin-ts',
    hooks: {
      'kubb:setup'(ctx) {
        if (compatibilityPreset === 'kubbV4') {
          ctx.setResolver(resolverTsLegacy)
          ctx.addGenerator(typeGeneratorLegacy)
        } else {
          ctx.setResolver(resolverTs)
          ctx.addGenerator(typeGenerator)
        }
      },
    },
  }
})
```

The preset logic becomes a simple `if/else` inside the setup event. No separate `definePresets`, `getPreset`, or `withFallback` needed.

---

## What About Renderers?

Renderers (`createRenderer`, `jsxRenderer`) remain a separate concept — just like Astro separates integrations from renderers. But they're set from within the plugin:

```ts
// Astro: integration registers renderer
'astro:config:setup'({ addRenderer }) {
  addRenderer({ serverEntrypoint: 'react/server.js' })
}

// Kubb: integration sets renderer
'kubb:setup'({ setRenderer }) {
  setRenderer(jsxRenderer)
}
```

Custom renderers are still created with `createRenderer`:

```ts
import { createRenderer } from '@kubb/core'

export const handlebarsRenderer = createRenderer(() => ({
  async render(element) { /* ... */ },
  get files() { return collectedFiles },
  unmount() { /* ... */ },
}))

// Used in a plugin:
'kubb:setup'({ setRenderer, addGenerator }) {
  setRenderer(handlebarsRenderer)
  addGenerator({
    name: 'templates',
    schema(node, ctx) {
      const file = ctx.resolver.file({ name: node.name, extname: '.ts' })
      return {
        template: '{{#each properties}}  {{name}}: {{type}};\n{{/each}}',
        data: { properties: node.properties },
        file: { baseName: file.baseName, path: file.path },
      }
    },
  })
}
```

---

## Summary: What Changes

### Public API Changes

| Current API | New API | Status |
|---|---|---|
| `createPlugin()` | `definePlugin()` | **Breaking** — new function signature with `KubbEvents` |
| `defineResolver()` | `defineResolver()` | **Unchanged** — still creates resolver objects |
| `defineGenerator()` | `defineGenerator()` | **Unchanged** — still creates generator objects |
| `definePresets()` | (removed from public API) | **Breaking** — becomes internal |
| `mergeGenerators()` | (removed from public API) | **Breaking** — becomes internal |
| `getPreset()` | (removed from public API) | **Breaking** — becomes internal |
| `createRenderer()` | `createRenderer()` | **Unchanged** |
| `createAdapter()` | `createAdapter()` | **Unchanged** |
| `defineConfig()` | `defineConfig()` | **Changed** — `plugins` → `integrations` (alias kept) |

### Concept Changes

| Current Concept | New Concept | What happened |
|---|---|---|
| Plugin with flat hooks | Integration with `KubbEvents` (namespaced events) | Restructured |
| 6 separate primitives | 1 primary primitive (`definePlugin`) | Simplified |
| `this`-based context | Parameter-based context | Replaced |
| External generator wiring | `addGenerator()` in setup event | Astro-style registration |
| External resolver wiring | `setResolver()` in setup event | Astro-style configuration |
| Preset bundles | Internal plugin logic | Absorbed into plugin |
| `pre`/`post` ordering | `dependencies` array | Simplified |

### File Structure Changes (per plugin)

```
# Before (6 files)
plugin-ts/
├── resolvers/resolverTs.ts       # defineResolver
├── generators/typeGenerator.tsx   # defineGenerator
├── presets.ts                     # definePresets
├── types.ts                       # PluginFactoryOptions
├── plugin.ts                      # createPlugin + getPreset + mergeGenerators
└── components/Type.tsx            # React component

# After (3 files)
plugin-ts/
├── plugin.ts                      # definePlugin (hooks: setup + build)
├── generators/typeGenerator.tsx   # defineGenerator (reusable, but registered in setup)
└── components/Type.tsx            # React component (unchanged)
```

---

## Open Questions

1. **Should `kubb:setup` context include access to the adapter?** The adapter is parsed before plugins run. Generators receive it via `ctx.adapter`, but should the setup event also have it for conditional generator registration?

2. **How do multiple generators from the same plugin interact?** When a plugin registers 3 generators that all handle `schema`, should they run in registration order (like Astro's renderer priority) or in parallel?

3. **Should generators be typed per-plugin?** Currently `defineGenerator<PluginTs>` ties a generator to a plugin's options type. In the new model, the generator context is provided by the framework. Should generators be generic or plugin-specific?

4. **What happens to `inject()`?** Currently plugins can inject context that other plugins consume via `this.getInjected()`. In the Astro model, cross-integration communication happens through config mutations. Should Kubb keep `inject()` or move to a shared config/registry pattern?

5. **Should barrel file generation be explicit?** Currently barrel files are auto-generated from `output.barrelType`. In the Astro model, this could become an explicit `injectBarrel()` call in `kubb:build:done`, giving integrations full control over index files.

6. **Should the factory pattern be optional?** For simple plugins with no options:

```ts
// With factory (options)
export const pluginHello = definePlugin((options) => ({ name: 'plugin-hello', hooks: { ... } }))

// Without factory (no options)
export const pluginHello = definePlugin({ name: 'plugin-hello', hooks: { ... } })
```

---

## Ideas from Other Frameworks

Beyond Astro, three server-side frameworks — **Hono**, **Elysia**, and **Express.js** — each tackle extensibility with distinct philosophies. This section pulls the most relevant ideas for Kubb's plugin system.

### Express.js — The Original Middleware Chain

Express established the `(req, res, next)` middleware pattern: functions that receive context, can transform it, and call `next()` to continue the chain.

```ts
// Express middleware
app.use((req, res, next) => {
  req.startTime = Date.now()  // enrich context
  next()                       // pass to next middleware
})

app.use((req, res, next) => {
  // downstream middleware sees req.startTime
  res.on('finish', () => console.log(`${Date.now() - req.startTime}ms`))
  next()
})
```

**Key ideas for Kubb:**

| Express Pattern | Kubb Equivalent | Relevance |
|---|---|---|
| `app.use(middleware)` — sequential chain | Plugins run in config array order | ✅ Already proposed: plugins execute in declaration order |
| `next()` — explicit pass to next handler | Not needed — Kubb events are parallel, not serial pipelines | ❌ Not applicable: Kubb plugins don't intercept each other's output |
| `req` object accumulates state across middleware | Event context accumulates registered generators | ✅ Already proposed: `kubb:setup` context collects `addGenerator()` calls |
| Error middleware `(err, req, res, next)` | Plugin error events | 🔶 Idea: add `kubb:error` event for plugin-level error handling |

**What to take:** Express's simplicity of "just a function that receives context" reinforces the events-with-parameters model. Express's sequential `next()` chain doesn't fit Kubb's parallel plugin model, but the concept of **enriching a shared context object** is exactly what `kubb:setup` does.

**What to skip:** Express's mutable `req`/`res` objects are a known pain point for typing. Kubb should keep context objects **typed per-event-phase** (as proposed) rather than a single mutable bag.

### Hono — Typed Context & Factory Pattern

Hono modernizes Express's middleware with TypeScript-first typed context and the `createFactory` / `createMiddleware` pattern:

```ts
// Hono: Typed middleware factory
import { createFactory } from 'hono/factory'

type Env = {
  Variables: {
    resolver: { name: (n: string) => string }
    generator: GeneratorConfig
  }
}

const factory = createFactory<Env>()

// Plugin as a middleware factory — returns typed middleware
function typescriptPlugin(options: TsOptions) {
  return factory.createMiddleware(async (c, next) => {
    c.set('resolver', createResolver(options))
    c.set('generator', createGenerator(options))
    await next()
  })
}

// Downstream handlers see typed variables
app.use(typescriptPlugin({ enumType: 'enum' }))
app.get('/', (c) => {
  const resolver = c.var.resolver  // fully typed
})
```

**Key ideas for Kubb:**

| Hono Pattern | Kubb Equivalent | Relevance |
|---|---|---|
| `createFactory<Env>()` — typed factory with environment | `definePlugin<Options>()` — typed plugin factory | ✅ Direct parallel: both create type-safe plugin constructors |
| `c.set('key', value)` — enrich context with typed variables | `addGenerator()`, `setResolver()` — register capabilities in setup | ✅ Same concept: plugins enrich a shared typed context |
| `c.var.key` — access typed variables downstream | `ctx.resolver`, `ctx.options` — access in generator events | ✅ Same concept: downstream events receive typed context |
| Onion model (`before next()` / `after next()`) | `kubb:build:start` / `kubb:build:done` events | ✅ Structural match: setup → process → teardown lifecycle |
| `createMiddleware(handler)` — factory returns typed function | `definePlugin(factory)` — factory returns typed plugin | ✅ Same ergonomics: function-returning-function for options |

**What to take:** Hono's `createFactory<Env>()` pattern is the strongest validation of our `definePlugin` factory approach. The idea that a **factory creates a typed scope**, and variables set within that scope are available downstream with full type inference, maps perfectly to how Kubb plugins register generators in `kubb:setup` and those generators receive typed context.

**What to consider:** Hono's onion model (code runs before AND after `next()`) could inspire a wrapper concept:

```ts
// Hypothetical: a plugin that wraps the entire generation phase
definePlugin((options) => {
  let start: number
  return {
    name: 'plugin-metrics',
    hooks: {
      'kubb:build:start'({ logger }) {
        start = Date.now()
        logger.info('Build starting')
        // kubb:build:start runs before generation
      },
      'kubb:build:done'({ files, logger }) {
        // kubb:build:done runs after generation — `start` is in closure scope
        logger.info(`Generated ${files.length} files in ${Date.now() - start}ms`)
      },
    },
  }
})
```

This already works with our proposed `KubbEvents` — `kubb:build:start` IS the "before" phase and `kubb:build:done` IS the "after" phase, achieving the same wrap-around effect as Hono's onion model without the `next()` complexity.

### Elysia — Plugin-as-Instance & Decorator Pattern

Elysia takes the most radical approach: every Elysia instance IS a plugin. Plugins compose via `.use()` with automatic type merging:

```ts
// Elysia: Plugin-as-instance with .use() composition
import { Elysia } from 'elysia'

const authPlugin = new Elysia({ name: 'auth' })
  .decorate('currentUser', null as User | null)
  .onBeforeHandle(({ currentUser }) => {
    if (!currentUser) throw new Error('Unauthorized')
  })

const dbPlugin = new Elysia({ name: 'db' })
  .decorate('db', createDatabase())

const app = new Elysia()
  .use(authPlugin)     // Types from auth merged into app
  .use(dbPlugin)       // Types from db merged into app
  .get('/', ({ currentUser, db }) => {
    // Both `currentUser` and `db` are fully typed here
    return db.users.find(currentUser.id)
  })
```

**Key ideas for Kubb:**

| Elysia Pattern | Kubb Equivalent | Relevance |
|---|---|---|
| `.decorate('key', value)` — add typed properties to context | `addGenerator()`, `setResolver()` — register typed capabilities | ✅ Same concept: plugins contribute typed pieces to a shared context |
| `.use(plugin)` — compose plugins with automatic type merging | `integrations: [pluginTs(), pluginZod()]` — config-level composition | ✅ Same concept but declarative vs chained |
| Lifecycle hooks: `onBeforeHandle` / `onAfterHandle` | `kubb:build:start` / `kubb:build:done` events | ✅ Same lifecycle phases, different naming convention |
| Plugin scoping: `global` / `scoped` / `local` | Not currently proposed | 🔶 Idea: plugin scope could control which downstream plugins see registered generators |
| Plugin deduplication via `name` + `seed` | Plugin deduplication via `name` | ✅ Already proposed: plugins identified by unique name |
| End-to-end type inference across `.use()` chain | Type inference across plugin dependencies | 🔶 Idea: `getPlugin('plugin-ts')` could return fully typed plugin interface |

**What to take:** Elysia's `.decorate()` pattern — where a plugin adds typed properties that downstream code can access — is conceptually identical to what `addGenerator()` and `setResolver()` do in `kubb:setup`. The key insight is that **the act of registering a capability should automatically make it available and typed for consumers**.

Elysia's **plugin scoping** (global/scoped/local) is worth considering. In Kubb, if `plugin-client` registers a generator, should `plugin-zod` be able to see it? Currently no — generators are plugin-scoped. Elysia's explicit scoping model could be useful if we ever need cross-plugin generator sharing.

**What to skip:** Elysia's `.use()` chaining pattern is elegant for request handlers but doesn't fit Kubb's declarative config model. `kubb.config.ts` with an `integrations` array (Astro's approach) is cleaner for a build-time tool.

### Comparison: Four Approaches to Plugin Context

| Dimension | Express | Hono | Elysia | Astro (proposed for Kubb) |
|---|---|---|---|---|
| **How plugins receive context** | `(req, res, next)` args | `(c, next)` typed context | `.decorate()` + hook args | Event params: `({ addGenerator, logger })` |
| **How plugins contribute state** | Mutate `req` object | `c.set('key', value)` | `.decorate('key', value)` | `addGenerator()`, `setResolver()` |
| **Type safety** | Weak (retrofitted) | Strong (factory-based) | Strongest (end-to-end inference) | Strong (per-event typed context) |
| **Execution model** | Sequential chain + `next()` | Onion model + `next()` | Lifecycle hooks (before/after) | Lifecycle events (namespaced phases) |
| **Plugin composition** | `app.use(fn)` | `app.use(fn)` | `.use(instance)` with type merge | `integrations: [plugin()]` in config |
| **Error handling** | Error middleware `(err, req, res, next)` | `.onError` hook | `onError` lifecycle hook | Could add `kubb:error` event |

### Synthesis: What Kubb Should Take from Each

**From Express:**
- ✅ Simplicity of "events receive context as parameters" (not `this`)
- ✅ Plugins run in declaration order (already in our proposal)
- 🔶 Consider a `kubb:error` event for plugin-level error handling

**From Hono:**
- ✅ `createFactory<Env>()` validates our `definePlugin<Options>()` factory pattern
- ✅ Typed variables set in middleware are available downstream — matches `addGenerator()` → `ctx.resolver` flow
- ✅ The onion model (before/after) maps directly to `kubb:build:start` / `kubb:build:done`

**From Elysia:**
- ✅ `.decorate()` pattern validates `addGenerator()` / `setResolver()` as typed context enrichment
- ✅ Plugin deduplication by name (already proposed)
- 🔶 Plugin scoping (global/scoped/local) could be valuable for cross-plugin generator visibility
- 🔶 End-to-end type inference across plugin chain (advanced TypeScript, similar to what `getPlugin()` needs)

**From Astro (primary model):**
- ✅ Namespaced lifecycle events with phase-specific typed context
- ✅ `addRenderer()` / `addGenerator()` pattern for capability registration
- ✅ Config-level declarative composition (`integrations` array)
- ✅ No `this` binding — pure parameter injection

### Event-Based vs Pipeline-Based: The Key Question

Express and Hono use a **sequential pipeline** — each middleware calls `next()` to continue. Elysia uses **lifecycle hooks** — `onBeforeHandle`, `onAfterHandle`. Astro uses **namespaced hooks** — `astro:config:setup`, `astro:build:done`.

For Kubb, the **event-based model** (`KubbEvents`, Astro/Elysia style) is the right choice over a pipeline model (Express/Hono):

1. **No sequential dependency:** Kubb plugins don't intercept each other's output. `plugin-ts` and `plugin-zod` both read the same `InputNode` and produce independent files. There's no "pass to next handler" concept.

2. **Parallel by nature:** Multiple generators can process the same schema node independently. A pipeline forces serial execution; events allow parallel execution.

3. **Phase-specific context:** Each event phase has different available data. `kubb:setup` has `addGenerator()` but no `inputNode`. `kubb:generate:schema` has `inputNode` and `resolver` but no `addGenerator()`. Namespaced events make this explicit.

4. **Matches the mental model:** Kubb users think "when a schema is processed, generate a TypeScript type" — that's an event subscription (`kubb:generate:schema`), not a middleware pipeline.

The events should be **synchronous-first with async support**, matching Astro's pattern — most events don't need to be async, but `kubb:build:done` might need to write additional files:

```ts
hooks: {
  // Sync event — most common
  'kubb:setup'({ addGenerator, setResolver }) {
    setResolver({ name: pascalCase })
    addGenerator({ name: 'types', schema(node, ctx) { ... } })
  },

  // Async event — when needed
  async 'kubb:build:done'({ files, logger }) {
    await writeCustomManifest(files)
    logger.info('Manifest written')
  },
}
```
