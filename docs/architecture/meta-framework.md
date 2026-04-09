# Kubb as a Meta-Framework — Plugin-First Design

## Status

Draft — proposal for discussion

## Core Thesis

Kubb is already a **plugin orchestration platform** — not "a generator with plugins." The plugin is the primary interface. Every other concept (adapters, generators, resolvers, renderers, transformers, presets) exists to serve the plugin.

This is the same architectural insight behind every successful meta-framework:

| Meta-framework | Primary extension point | Everything else serves it |
|---|---|---|
| **Vite** | Plugin (with hooks: `resolveId`, `transform`, `load`) | Dev server, bundler, HMR |
| **Astro** | Integration (with hooks: `astro:config:setup`, `astro:build:*`) | Renderers, islands, routing |
| **Nuxt** | Module (with hooks: `modules:done`, `build:before`) | Auto-imports, composables, layers |
| **Kubb** | **Plugin** (with hooks: `buildStart`, `schema`, `operation`, `operations`, `buildEnd`) | Adapters, AST, generators, resolvers, renderers |

The difference: Vite, Astro, and Nuxt make their plugin the **only** thing you need to learn. In Kubb today, you need to learn six separate concepts (`createPlugin`, `defineResolver`, `defineGenerator`, `definePresets`, `mergeGenerators`, `createRenderer`) before writing a single line of generation logic.

**The goal is to make the Kubb plugin the single entry point — just as a Vite plugin is a single object with hooks.**

---

## How Kubb Plugins Already Work

Before proposing changes, let's be precise about the current architecture — because the plugin is already the center.

### The Plugin is the Orchestrator

Every Kubb plugin is a single object returned by `createPlugin`. It has lifecycle hooks and AST hooks:

```ts
// packages/plugin-ts/src/plugin.ts (simplified)
export const pluginTs = createPlugin<PluginTs>((options) => {
  const preset = getPreset({ preset: options.compatibilityPreset, presets, ... })
  const mergedGenerator = mergeGenerators(preset.generators)

  return {
    name: 'plugin-ts',
    get resolver() { return preset.resolver },
    get transformer() { return preset.transformer },
    get options() { return { output, enumType, ... } },

    // Lifecycle hooks
    async buildStart() { await this.openInStudio({ ast: true }) },

    // AST hooks — these ARE the generation logic
    async schema(node, options) { return mergedGenerator.schema?.call(this, node, options) },
    async operation(node, options) { return mergedGenerator.operation?.call(this, node, options) },
    async operations(nodes, options) { return mergedGenerator.operations?.call(this, nodes, options) },
  }
})
```

### The Build Pipeline Drives Plugins

The build pipeline in `build.ts` treats plugins as the unit of execution:

```
For each plugin in config.plugins:
  1. plugin.buildStart()
  2. Walk InputNode (AST):
     - For each schema:  plugin.schema(node, resolvedOptions)
     - For each operation: plugin.operation(node, resolvedOptions)
     - After all operations: plugin.operations(allNodes, options)
  3. Generate barrel files
  4. plugin.buildEnd()
```

### Plugin Context: Everything a Plugin Needs

Inside any hook, `this` gives the plugin access to everything:

```ts
// this = PluginContext inside hooks
this.config        // Full kubb.config.ts
this.root          // Output root directory
this.adapter       // The adapter (e.g., adapterOas)
this.inputNode     // The parsed AST
this.plugin        // The plugin instance itself
this.resolver      // Naming + path resolution
this.driver        // Access all other plugins
this.getPlugin()   // Cross-plugin communication
this.upsertFile()  // Write files
this.warn()        // Diagnostic logging
```

### What Sits Below Plugins Today

| Concept | Purpose | How plugin uses it |
|---|---|---|
| **Generator** | Defines `schema()` / `operation()` / `operations()` handlers | Merged into plugin's hooks via `mergeGenerators` |
| **Resolver** | Naming conventions, path resolution, include/exclude | Exposed as `this.resolver` in plugin context |
| **Transformer** | AST visitor that transforms nodes before generators see them | Applied automatically during AST walk |
| **Preset** | Bundles resolver + generators + transformer | Selected in plugin factory, provides defaults |
| **Renderer** | Converts generator output (JSX) into `FileNode[]` | Set per-generator, called by `applyHookResult` |

**The problem:** These are all internal to the plugin, but they are defined *externally* and wired together manually.

---

## The Meta-Framework Analogy

### How Vite Does It

A Vite plugin is **one object with hooks**. Everything is inline:

```ts
// A complete Vite plugin — one object, no external wiring
export default function myVitePlugin(options) {
  return {
    name: 'my-plugin',
    enforce: 'pre',                          // Ordering (like Kubb's `pre`)

    resolveId(id) { /* resolve module */ },   // Like Kubb's resolver
    load(id) { /* load module content */ },   // Like Kubb's adapter
    transform(code, id) { /* transform */ },  // Like Kubb's generator

    configResolved(config) { /* lifecycle */ }, // Like Kubb's buildStart
    buildEnd() { /* cleanup */ },              // Like Kubb's buildEnd
  }
}
```

Notice: there's no `defineTransformer`, no `defineLoader`, no `createResolver`. It's all in one place. Advanced users can extract logic into helpers, but the **plugin contract is a single flat object**.

### How Astro Does It

Astro integrations are plugin objects with lifecycle hooks:

```ts
// A complete Astro integration
export default function myAstroIntegration(options) {
  return {
    name: 'my-integration',
    hooks: {
      'astro:config:setup'({ addRenderer, updateConfig }) {
        addRenderer({ name: 'react', ... })   // Register a renderer
        updateConfig({ vite: { ... } })        // Modify config
      },
      'astro:build:start'({ buildConfig }) { /* ... */ },
      'astro:build:done'({ dir, routes }) { /* ... */ },
    }
  }
}
```

The key insight: Astro's `addRenderer` is **called from within the plugin**, not defined separately. The plugin is the composition root.

### The Kubb Equivalent

What if Kubb plugins worked the same way — where generators, resolvers, and renderers are defined **inside the plugin** rather than wired together externally?

---

## Proposal: Plugin-First Architecture

### Design Principle

> **The plugin is the only API surface a developer needs to learn.** Generators, resolvers, transformers, and renderers are implementation details that live inside the plugin — not separate top-level concepts.

### Approach 1: Inline Everything in the Plugin

The most direct approach. The plugin object contains all generation logic directly, just like a Vite plugin contains `resolveId`, `load`, and `transform` inline.

```ts
import { createPlugin } from '@kubb/core'
import { jsxRenderer, File } from '@kubb/renderer-jsx'

export const pluginHello = createPlugin((options = {}) => {
  const { output = { path: 'hello', barrelType: 'named' } } = options

  return {
    name: 'plugin-hello',
    renderer: jsxRenderer,
    options: { output },

    schema(node, options) {
      const name = this.resolver.default(node.name, 'type')
      const file = this.resolver.resolveFile(
        { name, extname: '.ts' },
        { root: this.root, output: options.output },
      )
      return (
        <File baseName={file.baseName} path={file.path}>
          <File.Source name={name} isExportable isIndexable>
            {`export type ${name} = { id: string }`}
          </File.Source>
        </File>
      )
    },

    operation(node, options) {
      const name = this.resolver.default(node.operationId, 'function')
      const file = this.resolver.resolveFile(
        { name, extname: '.ts', tag: node.tags[0] },
        { root: this.root, output: options.output },
      )
      return (
        <File baseName={file.baseName} path={file.path}>
          <File.Source name={name} isExportable isIndexable>
            {`export function ${name}() { /* ${node.method} ${node.path} */ }`}
          </File.Source>
        </File>
      )
    },
  }
})
```

**What's different from today:**

1. **No separate `defineGenerator`** — `schema()` and `operation()` are directly on the plugin.
2. **No separate `defineResolver`** — the default resolver is auto-injected. Custom resolvers are specified as `resolve: { ... }` on the plugin object.
3. **No `definePresets` or `mergeGenerators`** — for simple plugins, there's nothing to merge.
4. **Renderer is on the plugin** — not on each generator separately.

**This is what plugins already almost do.** Look at the current `plugin-ts`:

```ts
// Current: plugin delegates to merged generators
async schema(node, options) {
  return mergedGenerator.schema?.call(this, node, options)
}
```

The proposal removes the indirection — the plugin's `schema()` IS the generator.

### Approach 2: Plugin with Composable Generators

For plugins that need multiple generators (e.g., `plugin-client` generates both function-style and class-style clients), the plugin accepts a `generators` array — but it's still all inside the plugin:

```ts
import { createPlugin, defineGenerator } from '@kubb/core'
import { jsxRenderer, File } from '@kubb/renderer-jsx'

// Generators are still definable — but they're consumed BY the plugin
const functionClientGenerator = defineGenerator({
  name: 'function-client',
  renderer: jsxRenderer,
  operation(node, options) {
    return <File ...><FunctionClient node={node} /></File>
  },
})

const classClientGenerator = defineGenerator({
  name: 'class-client',
  renderer: jsxRenderer,
  operation(node, options) {
    return <File ...><ClassClient node={node} /></File>
  },
})

export const pluginClient = createPlugin((options = {}) => {
  const { clientType = 'function', output = { path: 'clients' } } = options

  return {
    name: 'plugin-client',
    pre: ['plugin-ts'],
    options: { output, clientType },

    // Pick generators based on options — composition happens HERE, inside the plugin
    generators: [
      clientType === 'function' ? functionClientGenerator : classClientGenerator,
    ],
  }
})
```

**What's different:**

- Generators still exist as a concept, but they're an **implementation detail** of the plugin.
- The plugin is the composition root — it decides which generators to use.
- `mergeGenerators` becomes an internal detail of the build pipeline, not something the plugin author calls.
- No preset wiring needed — the plugin directly declares its generators.

**This matches how Astro integrations work:** the integration hook calls `addRenderer(reactRenderer)` directly, rather than having renderers defined externally and wired through a preset.

### Approach 3: Plugin as the Complete Unit (Recommended)

Combine approaches 1 and 2 into a unified model where the plugin is the complete unit of code generation:

```ts
import { createPlugin, defineGenerator } from '@kubb/core'
import { jsxRenderer, File } from '@kubb/renderer-jsx'

export const pluginTs = createPlugin((options = {}) => {
  const {
    output = { path: 'types', barrelType: 'named' },
    enumType = 'asConst',
    syntaxType = 'type',
  } = options

  return {
    name: 'plugin-ts',
    options: { output, enumType, syntaxType },

    // Renderer: project-wide default from config, or override per-plugin
    renderer: jsxRenderer,

    // Resolver: inline overrides for naming (defaults auto-injected)
    resolve: {
      name(name, type) {
        // PascalCase for types, camelCase for everything else
        return type === 'type' ? pascalCase(name) : camelCase(name)
      },
    },

    // Transformer: optional AST visitor applied before generation
    transformer: {
      schema(node) {
        // Example: skip deprecated schemas
        if (node.deprecated) return null
        return undefined // default behavior
      },
    },

    // --- Generation logic (inline for simple plugins) ---

    schema(node, options) {
      const name = this.resolver.default(node.name, 'type')
      const file = this.resolver.resolveFile(
        { name, extname: '.ts' },
        { root: this.root, output: options.output },
      )
      return (
        <File baseName={file.baseName} path={file.path}>
          <File.Source name={name} isExportable isIndexable>
            <Type node={node} enumType={options.enumType} />
          </File.Source>
        </File>
      )
    },

    // --- OR: composable generators (for complex plugins) ---

    // generators: [typeGenerator, enumGenerator, declarationGenerator],

    // --- Lifecycle ---

    async buildStart() {
      await this.openInStudio({ ast: true })
    },
  }
})
```

**The key design decisions:**

1. **`schema()`, `operation()`, `operations()`** can be defined inline on the plugin (simple path) OR delegated to a `generators` array (advanced path). Both use the same hook signatures.

2. **`resolve`** is an inline object for name/path overrides. Defaults (`camelCase` for files, `PascalCase` for types, standard path resolution) are auto-injected. No need for `defineResolver` unless you want a fully custom resolver.

3. **`transformer`** is an inline visitor object. No need for `composeTransformers` unless combining multiple visitors.

4. **`renderer`** is declared on the plugin. Falls back to the project-wide renderer in `kubb.config.ts`. Falls back to `jsxRenderer` if neither is set.

5. **`generators`** is the escape hatch for multi-generator plugins. When present, `schema()`/`operation()`/`operations()` on the plugin are ignored — the generators take over.

---

## How This Maps to Meta-Framework Patterns

### Pattern 1: Plugin Hooks = Vite Plugin Hooks

Just as Vite plugins have `resolveId`, `transform`, and `load`, Kubb plugins have `schema`, `operation`, and `operations`. These are **the generation logic**. Everything else is configuration.

| Vite Plugin Hook | Kubb Plugin Hook | Purpose |
|---|---|---|
| `resolveId(id)` | `resolve.name(name, type)` | Resolve identifiers |
| `load(id)` | (adapter) | Load input data |
| `transform(code, id)` | `schema(node, opts)` / `operation(node, opts)` | Transform input → output |
| `configResolved(config)` | `buildStart()` | Lifecycle: init |
| `buildEnd()` | `buildEnd()` | Lifecycle: cleanup |

### Pattern 2: Plugin Composition = Astro Integrations

Astro integrations call `addRenderer(reactRenderer)` from inside the plugin. Similarly, Kubb plugins should compose their generators internally:

```ts
// Astro pattern:
export default function astroReact() {
  return {
    name: '@astrojs/react',
    hooks: {
      'astro:config:setup'({ addRenderer }) {
        addRenderer(reactRenderer)  // Composition inside the plugin
      }
    }
  }
}

// Kubb equivalent:
export const pluginClient = createPlugin((options) => ({
  name: 'plugin-client',
  generators: [                    // Composition inside the plugin
    functionClientGenerator,
    operationsGenerator,
  ],
}))
```

### Pattern 3: Cross-Plugin Communication = Nuxt Module Hooks

Nuxt modules communicate through hooks and auto-imports. Kubb plugins communicate through `inject()` and `getPlugin()`:

```ts
// Nuxt pattern:
export default defineNuxtModule({
  setup(options, nuxt) {
    nuxt.hook('components:dirs', (dirs) => {
      dirs.push({ path: resolve('./components') })
    })
  }
})

// Kubb equivalent:
export const pluginTs = createPlugin((options) => ({
  name: 'plugin-ts',
  inject() {
    return {
      getTypeName: (name) => this.resolver.default(name, 'type'),
    }
  },
}))

// Another plugin consumes the injected context:
export const pluginClient = createPlugin((options) => ({
  name: 'plugin-client',
  pre: ['plugin-ts'],
  operation(node, options) {
    const typeName = this.getTypeName(node.operationId)  // From plugin-ts
    // ...
  },
}))
```

### Pattern 4: Adapter = Data Source Layer

In Next.js, `getServerSideProps` fetches data. In Kubb, the adapter parses the spec. Both are **data source layers** that feed into the rendering/generation layer:

```ts
// Next.js pattern:
export async function getServerSideProps(context) {
  const data = await fetchAPI('/products')
  return { props: { products: data } }
}

// Kubb equivalent:
// kubb.config.ts
export default defineConfig({
  adapter: adapterOas({ dateType: 'date' }),   // Data source
  input: { path: './openapi.yaml' },           // Data location
  plugins: [pluginTs()],                        // Rendering/generation
})
```

The adapter is **not a plugin concern** — it's a project-level configuration, just like data fetching is not a component concern in Next.js.

---

## What Changes in Practice

### For Simple Plugin Authors (New Developers)

**Before (6 concepts):**

```ts
// resolver.ts
import { defineResolver } from '@kubb/core'
export const resolver = defineResolver<MyPlugin>(() => ({
  name: 'default', pluginName: 'my-plugin',
  resolveName(node) { return this.default(node.name, 'type') },
}))

// generator.tsx
import { defineGenerator } from '@kubb/core'
import { jsxRenderer } from '@kubb/renderer-jsx'
export const generator = defineGenerator<MyPlugin>({
  name: 'my-gen', renderer: jsxRenderer,
  schema(node, options) { return <File ...>...</File> },
})

// presets.ts
import { definePresets } from '@kubb/core'
export const presets = definePresets({
  default: { name: 'default', resolver, generators: [generator] },
})

// plugin.ts
import { createPlugin, getPreset, mergeGenerators } from '@kubb/core'
export const myPlugin = createPlugin<MyPlugin>((options) => {
  const preset = getPreset({ preset: 'default', presets })
  const merged = mergeGenerators(preset.generators)
  return {
    name: 'my-plugin',
    get resolver() { return preset.resolver },
    async schema(node, opts) { return merged.schema?.call(this, node, opts) },
  }
})
```

**After (1 concept):**

```ts
// plugin.ts — that's it, one file
import { createPlugin } from '@kubb/core'
import { jsxRenderer, File } from '@kubb/renderer-jsx'

export const myPlugin = createPlugin((options = {}) => ({
  name: 'my-plugin',
  renderer: jsxRenderer,
  options: { output: { path: 'gen', ...options.output } },

  schema(node, options) {
    const name = this.resolver.default(node.name, 'type')
    const file = this.resolver.resolveFile({ name, extname: '.ts' }, { root: this.root, output: options.output })
    return (
      <File baseName={file.baseName} path={file.path}>
        <File.Source name={name} isExportable>
          {`export type ${name} = { id: string }`}
        </File.Source>
      </File>
    )
  },
}))
```

### For Advanced Plugin Authors (Existing Kubb Plugins)

The existing API (`defineGenerator`, `defineResolver`, `definePresets`, `mergeGenerators`) remains available. Existing plugins don't need to change. The `generators` array on the plugin object is the bridge:

```ts
// Existing generators continue to work
import { typeGenerator } from './generators/typeGenerator.tsx'
import { enumGenerator } from './generators/enumGenerator.tsx'

export const pluginTs = createPlugin((options) => ({
  name: 'plugin-ts',
  // Advanced: use the generators array
  generators: [typeGenerator, enumGenerator],
  // Resolver and transformer from presets (unchanged)
  get resolver() { return preset.resolver },
  get transformer() { return preset.transformer },
}))
```

### For Custom Adapter Authors

Adapters remain a separate concern — they're project-level, not plugin-level:

```ts
import { createAdapter } from '@kubb/core'
import { createInput, createSchema, createOperation } from '@kubb/ast'

export const adapterAsyncApi = createAdapter((options = {}) => ({
  name: 'asyncapi',
  options,

  async parse(source) {
    const doc = await loadAsyncApiSpec(source)
    return createInput({
      schemas: parseSchemas(doc),
      operations: parseChannels(doc),
      meta: { title: doc.info.title, version: doc.info.version },
    })
  },

  getImports(node, resolve) {
    return collectImports({ node, resolve })
  },
}))

// kubb.config.ts
export default defineConfig({
  adapter: adapterAsyncApi({ validate: true }),
  input: { path: './asyncapi.yaml' },
  plugins: [pluginTs()],  // Plugins that only use InputNode work with any adapter
                          // Plugins using adapter-specific APIs (e.g., this.adapter.document) require a compatible adapter
})
```

### For Custom Renderer Authors

Renderers remain a separate concern — declared on the plugin or in `kubb.config.ts`:

```ts
import { createRenderer } from '@kubb/core'

export const templateRenderer = createRenderer(() => {
  const files = []
  return {
    async render(element) {
      // element is whatever the generator returns
      const { template, data, file } = element
      const content = renderTemplate(template, data)
      files.push({ ...file, sources: [{ value: content }] })
    },
    get files() { return files },
    unmount() { files.length = 0 },
  }
})

// Plugin uses the custom renderer
export const pluginCustom = createPlugin((options) => ({
  name: 'plugin-custom',
  renderer: templateRenderer,
  schema(node, options) {
    return {
      template: '{{#each properties}}  {{name}}: {{type}};\n{{/each}}',
      data: { properties: node.properties },
      file: this.resolver.resolveFile({ name: node.name, extname: '.ts' }, { root: this.root, output: options.output }),
    }
  },
}))
```

---

## Architectural Layers

```
┌──────────────────────────────────────────────────────────────────┐
│                        kubb.config.ts                            │
│  adapter: adapterOas()                                           │
│  input:   { path: './openapi.yaml' }                            │
│  plugins: [ pluginTs(), pluginZod(), pluginClient() ]           │
│  renderer: jsxRenderer  (optional project-wide default)          │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Adapter Layer                                 │
│  adapterOas / adapterAsyncApi / adapterDrizzle / custom          │
│  Input Source → parse() → InputNode (AST)                        │
└──────────────┬───────────────────────────────────────────────────┘
               │  InputNode { schemas, operations, meta }
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Plugin Layer (THE CENTER)                     │
│                                                                  │
│  For each plugin:                                                │
│    1. buildStart()                                               │
│    2. transformer → transform AST nodes                          │
│    3. resolver.resolveOptions() → include/exclude/override       │
│    4. schema(node, opts) → JSX | FileNode[] | void               │
│       operation(node, opts) → JSX | FileNode[] | void            │
│       operations(nodes, opts) → JSX | FileNode[] | void          │
│    5. Barrel file generation                                     │
│    6. buildEnd()                                                 │
│                                                                  │
│  Plugin internals (auto-managed or user-configured):             │
│    ├── resolve: { name(), path(), file(), options() }            │
│    ├── transformer: { schema(), operation(), property() }        │
│    ├── renderer: jsxRenderer | templateRenderer | custom         │
│    └── generators: [...] (optional, for multi-generator plugins) │
└──────────────┬───────────────────────────────────────────────────┘
               │  FileNode[]
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Output Layer                                  │
│  FileProcessor → Parser → Formatter → Linter → Storage           │
└──────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Plugin Accepts Inline Hooks

Modify `createPlugin` so that when `schema()`, `operation()`, or `operations()` are defined directly on the plugin (without a separate `generators` array), they work as inline generators. This is purely additive — no breaking changes.

**What changes in core:**
- `build.ts` checks for `plugin.renderer` when calling `applyHookResult`.
- If the plugin has no `generators` array, its `schema()`/`operation()`/`operations()` hooks are used directly.
- The default resolver is auto-injected when no `resolver` or `resolve` is set.

### Phase 2: `resolve` Shorthand

Add an optional `resolve` object to the plugin that inlines resolver overrides:

```ts
createPlugin((options) => ({
  name: 'my-plugin',
  resolve: {
    name(name, type) { return customNaming(name, type) },
  },
  // Auto-injected: this.resolver with default + overrides
}))
```

**What changes in core:**
- `createPlugin` detects `resolve` and calls `defineResolver` internally.
- Falls back to the default resolver when `resolve` is omitted.

### Phase 3: `renderer` on Plugin

Add `renderer` field to the plugin object. Generators inherit it unless they declare their own:

```ts
createPlugin((options) => ({
  name: 'my-plugin',
  renderer: jsxRenderer,  // All generators inherit this
  generators: [
    { name: 'types', schema(node) { return <File ...>...</File> } },
    { name: 'raw', renderer: null, schema(node) { return [createFile(...)] } },  // Override: no renderer
  ],
}))
```

**What changes in core:**
- `mergeGenerators` and `applyHookResult` check `generator.renderer ?? plugin.renderer`.
- Falls back to `config.renderer` if neither is set.

### Phase 4: Project-Wide Renderer in Config

Add optional `renderer` field to `defineConfig`:

```ts
defineConfig({
  renderer: jsxRenderer,  // All plugins use this unless they override
  plugins: [pluginTs(), pluginZod()],
})
```

**What changes in core:**
- The renderer resolution chain becomes: generator.renderer → plugin.renderer → config.renderer → undefined (raw FileNode[] mode).

---

## Backward Compatibility

**Nothing breaks.** Every change is additive:

| What exists today | What's added | Migration |
|---|---|---|
| `createPlugin` with `schema()` delegating to `mergeGenerators` | `schema()` can be defined inline (no generators needed) | Optional — existing plugins work unchanged |
| `defineResolver` for custom naming | `resolve: { ... }` shorthand on plugin | Optional — `defineResolver` still works |
| `renderer` on each generator | `renderer` on plugin, with generator override | Optional — per-generator renderers still work |
| No project-wide renderer | `renderer` in `defineConfig` | Optional — defaults to no renderer (raw mode) |

---

## Open Questions

1. **Should `resolve` support the full `Resolver` interface or just common overrides (`name`, `path`, `file`)?** The full interface includes `resolveOptions`, `resolveBanner`, `resolveFooter` — most plugins never customize these.

2. **When `generators` and inline `schema()` both exist on a plugin, which wins?** Proposed: `generators` takes priority, inline hooks are ignored. A warning should be emitted during plugin initialization when both are present, to prevent accidental misconfiguration.

3. **Should the plugin declare its adapter compatibility?** For example, a plugin that uses `this.adapter.document` (OAS-specific) could declare `adapter: 'oas'` to fail fast if used with a different adapter.

4. **How do presets fit in the plugin-first model?** Presets could become named configurations that the plugin user selects, rather than a separate abstraction the plugin author defines:

```ts
pluginTs({
  compatibilityPreset: 'kubbV4',  // Changes resolver + generators internally
})
```

This is already how it works today — the question is whether `definePresets` should still be a public API or become an internal implementation detail.

5. **Should `createPlugin` accept both the factory pattern `(options) => plugin` and the direct pattern `plugin`?** For plugins with no options, the factory is unnecessary boilerplate:

```ts
// Current: factory pattern (needed for options)
const myPlugin = createPlugin((options) => ({ name: 'my-plugin', ... }))

// Proposed: direct pattern (for plugins with no options)
const myPlugin = createPlugin({ name: 'my-plugin', ... })
```
