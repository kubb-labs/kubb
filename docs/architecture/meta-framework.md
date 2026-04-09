# Meta-Framework for Code Generation — Design Document

## Status

Draft — proposal for discussion

## Motivation

Kubb has evolved from an OpenAPI-specific code generator into a powerful plugin-based toolkit with a spec-agnostic AST (`@kubb/ast`), a formal adapter layer (`@kubb/adapter-oas`), and a renderer abstraction (`@kubb/renderer-jsx`). However, for non-Kubb developers who want to build their own code generation pipelines, the current architecture surfaces too many separate concepts:

- **`createPlugin`** — defines the plugin (lifecycle hooks, options, naming).
- **`defineResolver`** — defines naming conventions and file path resolution.
- **`defineGenerator`** — defines the schema/operation/operations handlers.
- **`definePresets`** — bundles resolvers + generators together.
- **`createRenderer`** — defines how generator output (JSX, templates, etc.) becomes files.
- **`mergeGenerators`** — combines multiple generators into one.

A newcomer who wants to "generate some TypeScript from an OpenAPI spec" must understand all six concepts and wire them together manually. This document explores ways to simplify the experience while preserving the flexibility that advanced plugin authors need.

### Goals

1. Make it possible to define a working plugin in a single file (`plugin.ts`) without importing from five different modules.
2. Clarify how the **adapter → AST → plugin → renderer** pipeline works, so that custom adapters (AsyncAPI, Drizzle, GraphQL, gRPC, JSON Schema, etc.) and custom renderers (Handlebars, EJS, string templates, etc.) are first-class.
3. Position Kubb as a **meta-framework for code generation** — analogous to how Next.js is a meta-framework for React, or Nuxt is a meta-framework for Vue.

---

## Current Architecture

```
kubb.config.ts
  ├── adapter: adapterOas({ ... })       ← converts spec → InputNode (AST)
  ├── input: { path: './openapi.yaml' }
  └── plugins: [
        pluginTs({ ... }),                ← plugin = resolver + generators + presets
        pluginZod({ ... }),
      ]

Each plugin internally:
  ├── createPlugin()        → lifecycle hooks (buildStart, schema, operation, ...)
  ├── defineResolver()      → naming + path resolution
  ├── defineGenerator()     → schema/operation handlers (returns JSX, FileNode[], or void)
  ├── definePresets()       → bundles resolver + generators
  ├── mergeGenerators()     → combines multiple generators
  └── renderer (jsxRenderer from @kubb/renderer-jsx)
```

### Pain points for newcomers

| Pain point | Why it matters |
|---|---|
| **Six separate `define*` / `create*` functions** | A newcomer must learn the difference between `createPlugin`, `defineResolver`, `defineGenerator`, `definePresets`, `mergeGenerators`, and `createRenderer` before writing a single line of generation logic. |
| **Generator ↔ Plugin split** | Generators are defined separately from the plugin, then wired through presets and `mergeGenerators`. The indirection makes it hard to understand the data flow. |
| **Resolver is required but rarely customized** | Most plugins use the default name casing and path resolution. Yet every plugin must set up a resolver and thread it through presets. |
| **Renderer is implicit** | The renderer (`jsxRenderer`) is passed to each generator individually. There's no way to set a project-wide default renderer in `kubb.config.ts`. |
| **Preset concept is overloaded** | Presets bundle resolver + generators + printer, but also serve as compatibility layers (`default` vs `kubbV4`). This dual purpose confuses newcomers. |

---

## Proposed Solutions

### Solution 1: `definePlugin` — Unified Plugin Definition

Combine `createPlugin`, `defineResolver`, `defineGenerator`, and `definePresets` into a single `definePlugin` function that accepts everything in one object.

```ts
// plugin-hello.ts — a complete plugin in one file
import { definePlugin } from '@kubb/core'
import { jsxRenderer } from '@kubb/renderer-jsx'
import { File } from '@kubb/renderer-jsx'

export const pluginHello = definePlugin({
  name: 'plugin-hello',

  // Options with defaults (replaces createPlugin options)
  defaults: {
    output: { path: 'hello', barrelType: 'named' },
    greeting: 'Hello',
  },

  // Renderer for this plugin (replaces per-generator renderer)
  renderer: jsxRenderer,

  // Naming conventions (replaces defineResolver)
  resolve: {
    name(name, type) {
      return type === 'type' ? `${name}Type` : name
    },
    // path, file, options, banner, footer are optional — defaults are used when omitted
  },

  // Generation logic (replaces defineGenerator + mergeGenerators)
  schema(node, options) {
    const name = this.resolver.default(node.name, 'type')
    const file = this.resolver.resolveFile(
      { name, extname: '.ts' },
      { root: this.root, output: options.output },
    )

    return (
      <File baseName={file.baseName} path={file.path}>
        <File.Source name={name} isExportable isIndexable>
          {`export type ${name} = { greeting: '${options.greeting}' }`}
        </File.Source>
      </File>
    )
  },

  operation(node, options) {
    // Generate per-operation files
  },

  operations(nodes, options) {
    // Generate aggregated operations file
  },

  // Lifecycle hooks (same as current createPlugin)
  buildStart() {
    // Initialize resources
  },

  buildEnd() {
    // Cleanup
  },
})
```

**How it works internally:**

`definePlugin` desugars into the current primitives:

```ts
export function definePlugin(config) {
  const resolver = defineResolver(() => ({
    name: config.resolve?.name ? 'custom' : 'default',
    pluginName: config.name,
    ...config.resolve,
  }))

  const generator = defineGenerator({
    name: config.name,
    renderer: config.renderer,
    schema: config.schema,
    operation: config.operation,
    operations: config.operations,
  })

  return createPlugin((userOptions) => {
    const options = { ...config.defaults, ...userOptions }
    return {
      name: config.name,
      resolver,
      options,
      schema: generator.schema,
      operation: generator.operation,
      operations: generator.operations,
      buildStart: config.buildStart,
      buildEnd: config.buildEnd,
    }
  })
}
```

**Trade-offs:**

| ✅ Pros | ❌ Cons |
|---|---|
| Single file, single function — dramatically lower barrier to entry | Advanced users lose granular control over presets and generator merging |
| `this` context is the same — full access to `adapter`, `driver`, `resolver` | Multiple generators per plugin would need an escape hatch (e.g. `generators: [...]`) |
| Renderer is declared once at the plugin level | Custom resolvers would need the full `defineResolver` for complex cases |
| No preset wiring needed for simple plugins | Backward compatibility: existing plugins can't adopt this without a rewrite |

---

### Solution 2: Generator-First Plugins with `createCodegenPlugin`

Instead of unifying everything, make the **generator** the primary concept and auto-generate the plugin boilerplate. This is closer to how Next.js pages work — you write the page (generator), and the framework handles routing (plugin wiring).

```ts
// generators/typescript.tsx — just the generation logic
import { createCodegenPlugin } from '@kubb/core'
import { jsxRenderer } from '@kubb/renderer-jsx'
import { File } from '@kubb/renderer-jsx'

export default createCodegenPlugin({
  name: 'plugin-ts',
  renderer: jsxRenderer,

  // Each method is a standalone generator
  schema(node, options) {
    return (
      <File baseName={`${node.name}.ts`} path={this.resolvePath(node)}>
        <File.Source name={node.name} isExportable>
          {`export type ${node.name} = { /* ... */ }`}
        </File.Source>
      </File>
    )
  },
})
```

**How it works:** `createCodegenPlugin` is a thin wrapper that:
1. Creates a default resolver (using standard naming conventions).
2. Wraps the `schema`/`operation`/`operations` functions into a generator.
3. Creates a plugin with the generator pre-wired.
4. Returns a plugin factory that can be used in `kubb.config.ts`.

**The escape hatch for advanced use:**

```ts
export default createCodegenPlugin({
  name: 'plugin-ts-advanced',
  renderer: jsxRenderer,

  // Override specific resolver methods
  resolve: {
    name: (name, type) => customNaming(name, type),
    path: (params, context) => customPath(params, context),
  },

  // Multiple generator functions via the generators array
  generators: [
    { name: 'types', schema: (node) => <TypeFile node={node} /> },
    { name: 'enums', schema: (node) => node.type === 'enum' ? <EnumFile node={node} /> : null },
  ],

  // Presets for compatibility
  presets: {
    default: { /* ... */ },
    legacy: { /* ... */ },
  },
})
```

**Trade-offs:**

| ✅ Pros | ❌ Cons |
|---|---|
| Generator-first mental model — "write what you generate" | Two APIs: `createCodegenPlugin` (simple) and `createPlugin` (advanced) |
| Still composes into the existing plugin system | Name overlap with `createPlugin` could confuse users |
| Escape hatches for resolver, presets, multiple generators | The auto-generated resolver may not cover all naming edge cases |
| Existing plugins continue to work unchanged | |

---

### Solution 3: Meta-Framework with Adapter + Plugin + Renderer Pipeline

Position Kubb as a meta-framework with three explicit extension points: **Adapters**, **Plugins**, and **Renderers**. Each is a first-class concept with its own `create*` function and clear responsibilities.

```
┌─────────────────────────────────────────────────────────────┐
│                      kubb.config.ts                         │
│                                                             │
│  adapter:  adapterOas({ ... })          ← reads input       │
│            adapterAsyncApi({ ... })     ← or another format  │
│            adapterDrizzle({ ... })      ← or database schemas│
│                                                             │
│  plugins:  [                            ← transforms AST     │
│              pluginTs({ ... }),                              │
│              pluginZod({ ... }),                             │
│              pluginCustom({ ... }),                          │
│            ]                                                │
│                                                             │
│  renderer: jsxRenderer                  ← converts to files  │
│            templateRenderer             ← or use templates   │
│            stringRenderer               ← or raw strings     │
└─────────────────────────────────────────────────────────────┘

Pipeline:

  Input Source ──► Adapter.parse() ──► InputNode (AST)
                                           │
                                           ▼
                                    Plugin.schema()
                                    Plugin.operation()      ──► Renderer Output
                                    Plugin.operations()
                                           │
                                           ▼
                                    Renderer.render()  ──► FileNode[]
                                           │
                                           ▼
                                    FileProcessor ──► Formatted Files ──► Storage
```

#### 3a. Project-Wide Default Renderer

Move the renderer declaration from individual generators to the config level:

```ts
// kubb.config.ts
import { defineConfig } from '@kubb/core'
import { adapterOas } from '@kubb/adapter-oas'
import { jsxRenderer } from '@kubb/renderer-jsx'

export default defineConfig({
  adapter: adapterOas({ dateType: 'date' }),
  renderer: jsxRenderer,  // ← NEW: project-wide default
  input: { path: './openapi.yaml' },
  plugins: [
    pluginTs(),    // Uses jsxRenderer by default
    pluginZod(),   // Uses jsxRenderer by default
  ],
})
```

Plugins and generators can still override the renderer:

```ts
const myGenerator = defineGenerator({
  name: 'custom',
  renderer: templateRenderer,  // Override project default
  schema(node) { return myTemplate(node) },
})
```

#### 3b. Custom Adapter Support

The adapter interface is already defined. Document and promote it as a first-class extension point:

```ts
// adapter-asyncapi.ts
import { createAdapter } from '@kubb/core'
import { createInput, createSchema, createOperation } from '@kubb/ast'

export const adapterAsyncApi = createAdapter({
  name: 'asyncapi',
  defaults: { validate: true },

  async parse(source) {
    const doc = await loadAsyncApiSpec(source)

    // Convert AsyncAPI channels → OperationNode[]
    const operations = Object.entries(doc.channels).map(([path, channel]) =>
      createOperation({
        operationId: channel.operationId,
        method: channel.subscribe ? 'subscribe' : 'publish',
        path,
        tags: channel.tags ?? [],
        parameters: [],
        responses: [],
        requestBody: channel.message
          ? { schema: convertAsyncApiSchema(channel.message.payload), required: true }
          : undefined,
      })
    )

    // Convert AsyncAPI schemas → SchemaNode[]
    const schemas = Object.entries(doc.components?.schemas ?? {}).map(
      ([name, schema]) => convertAsyncApiSchema(schema, name)
    )

    return createInput({
      schemas,
      operations,
      meta: {
        title: doc.info.title,
        version: doc.info.version,
      },
    })
  },
})
```

#### 3c. Custom Renderer Support

Formalize the renderer as a pluggable extension point beyond JSX:

```ts
// renderer-handlebars.ts
import { createRenderer } from '@kubb/core'
import Handlebars from 'handlebars'

export const handlebarsRenderer = createRenderer(() => {
  const files = []

  return {
    async render(element) {
      // element is a { template, data, file } object from the generator
      const compiled = Handlebars.compile(element.template)
      const content = compiled(element.data)

      files.push({
        ...element.file,
        sources: [{ value: content }],
      })
    },
    get files() { return files },
    unmount() { files.length = 0 },
  }
})

// Usage in a generator:
const myGenerator = defineGenerator({
  name: 'handlebars-types',
  renderer: handlebarsRenderer,
  schema(node, options) {
    return {
      template: '{{#each properties}}  {{name}}: {{type}};\n{{/each}}',
      data: { properties: node.properties },
      file: {
        baseName: `${node.name}.ts`,
        path: this.resolver.resolvePath({ baseName: `${node.name}.ts` }, { root: this.root, output: options.output }),
      },
    }
  },
})
```

**Trade-offs:**

| ✅ Pros | ❌ Cons |
|---|---|
| Clear separation: adapter reads, plugin transforms, renderer writes | More concepts to learn (but each is simpler) |
| Project-wide renderer reduces per-generator boilerplate | Breaking change for `kubb.config.ts` if renderer becomes required |
| Custom adapters for any input format are first-class | Custom renderers need to satisfy the `Renderer` interface |
| Existing adapters, plugins, and renderers continue to work | |

---

### Solution 4: Convention-Based Plugin Directory

Inspired by Next.js file-based routing, use a **convention-based directory structure** where the framework discovers plugins, generators, and renderers by file location:

```
kubb-project/
├── kubb.config.ts
├── openapi.yaml
└── kubb/
    ├── adapters/
    │   └── oas.ts              ← auto-discovered adapter
    ├── plugins/
    │   ├── typescript/
    │   │   ├── plugin.ts       ← plugin definition
    │   │   ├── schema.tsx      ← schema generator (JSX)
    │   │   ├── operation.tsx   ← operation generator (JSX)
    │   │   └── operations.tsx  ← operations generator (JSX)
    │   └── zod/
    │       ├── plugin.ts
    │       └── schema.tsx
    └── renderers/
        └── jsx.ts              ← renderer configuration
```

**How it works:**

```ts
// kubb/plugins/typescript/schema.tsx — just the generation function
import { File } from '@kubb/renderer-jsx'

// Default export = the schema handler
export default function TypeSchema({ node, options, resolver }) {
  const name = resolver.default(node.name, 'type')
  return (
    <File baseName={`${name}.ts`} path={resolver.resolvePath({ baseName: `${name}.ts` })}>
      <File.Source name={name} isExportable isIndexable>
        {`export type ${name} = { /* generated */ }`}
      </File.Source>
    </File>
  )
}

// Named export for configuration
export const config = {
  renderer: 'jsx',  // References kubb/renderers/jsx.ts
}
```

```ts
// kubb/plugins/typescript/plugin.ts — minimal config
export default {
  name: 'plugin-ts',
  output: { path: 'types', barrelType: 'named' },
  // Generators are auto-discovered from sibling schema.tsx, operation.tsx, operations.tsx
}
```

**Trade-offs:**

| ✅ Pros | ❌ Cons |
|---|---|
| Near-zero boilerplate — just write the generation functions | Magic file conventions can be confusing |
| Familiar to Next.js / Nuxt developers | Harder to type-check without explicit wiring |
| Auto-discovery eliminates manual plugin registration | Not suitable for published npm packages (those need explicit exports) |
| Great for project-local customizations | Requires a file-system scanner in the build pipeline |

---

## Comparison Matrix

| Feature | Solution 1: `definePlugin` | Solution 2: Generator-First | Solution 3: Meta-Framework | Solution 4: Convention-Based |
|---|---|---|---|---|
| **Simplicity for newcomers** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Flexibility for power users** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Backward compatibility** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **Custom adapter support** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Custom renderer support** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Publishable as npm packages** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Migration effort** | Medium | Low | Medium | High |

---

## Recommendation

**Combine Solutions 1 + 3** — implement `definePlugin` as the simple entry point (Solution 1) within the meta-framework architecture (Solution 3).

This gives Kubb two tiers:

### Tier 1: Quick Start (new `definePlugin`)

For developers who want to generate code from an API spec in minutes:

```ts
// kubb.config.ts
import { defineConfig } from '@kubb/core'
import { adapterOas } from '@kubb/adapter-oas'
import { pluginHello } from './plugin-hello'

export default defineConfig({
  adapter: adapterOas(),
  input: { path: './openapi.yaml' },
  plugins: [pluginHello()],
})
```

```ts
// plugin-hello.ts
import { definePlugin } from '@kubb/core'
import { jsxRenderer, File } from '@kubb/renderer-jsx'

export const pluginHello = definePlugin({
  name: 'plugin-hello',
  renderer: jsxRenderer,
  defaults: { output: { path: 'hello' } },

  schema(node, options) {
    return (
      <File baseName={`${node.name}.ts`} path={this.resolvePath(node)}>
        <File.Source name={node.name} isExportable>
          {`export const ${node.name} = '${node.name}'`}
        </File.Source>
      </File>
    )
  },
})
```

### Tier 2: Full Control (existing primitives)

For plugin authors who need presets, multiple generators, custom resolvers, and compatibility layers:

```ts
// Existing API continues to work unchanged
import { createPlugin, defineResolver, defineGenerator, definePresets, mergeGenerators } from '@kubb/core'
```

### Tier 3: Meta-Framework Extensions

For teams building adapters for new input formats or custom renderers:

```ts
// Custom adapter
import { createAdapter } from '@kubb/core'
export const adapterGraphQL = createAdapter({ /* ... */ })

// Custom renderer
import { createRenderer } from '@kubb/core'
export const ejsRenderer = createRenderer(() => { /* ... */ })

// Project-wide renderer in config
export default defineConfig({
  adapter: adapterGraphQL(),
  renderer: ejsRenderer,       // ← all plugins use this by default
  plugins: [pluginTs()],
})
```

---

## Implementation Plan

### Phase 1: `definePlugin` Helper

1. Add `definePlugin` to `@kubb/core` as a convenience wrapper around `createPlugin` + `defineResolver` + `defineGenerator`.
2. Write documentation and examples showing the single-file plugin pattern.
3. Existing plugins are **not** migrated — they continue using `createPlugin` internally.

### Phase 2: Project-Wide Renderer

1. Add optional `renderer` field to `defineConfig`.
2. When set, generators without an explicit `renderer` inherit the project-wide default.
3. `@kubb/renderer-jsx` remains the recommended default; document how to create custom renderers.

### Phase 3: Adapter Documentation & Ecosystem

1. Publish adapter authoring guide with step-by-step instructions.
2. Create `adapter-asyncapi` and/or `adapter-jsonschema` as reference implementations.
3. Document the `InputNode` contract that adapters must produce.

### Phase 4: Templates & Alternative Renderers

1. Create `@kubb/renderer-template` as a string-template-based alternative to JSX.
2. Document the `Renderer` interface for third-party renderer authors.
3. Provide migration guide for JSX → template renderers (and vice versa).

---

## Open Questions

1. **Should `definePlugin` support multiple generators?** The simple case is one `schema` + one `operation` handler. But some plugins (e.g., `plugin-client`) need separate generators for classes, functions, and operations files. Should `definePlugin` accept a `generators` array as an escape hatch?

2. **How should the project-wide renderer interact with per-generator overrides?** Priority: generator-level > plugin-level > config-level? Or should mixing renderers within a plugin be disallowed?

3. **Should adapters support streaming / incremental parsing?** For very large specs (10,000+ operations), parsing the entire spec into an `InputNode` before plugin execution begins may be slow. Could adapters emit schema/operation nodes incrementally?

4. **Should `definePlugin` infer the resolver from the generation functions?** For example, if `schema` always calls `this.resolver.default(node.name, 'type')`, could the resolver be auto-generated from usage patterns?

5. **How do we handle adapter-specific metadata?** The current `InputNode.meta` is loosely typed. Should each adapter define a typed `meta` extension, and should plugins be able to declare which adapter metadata they require?
