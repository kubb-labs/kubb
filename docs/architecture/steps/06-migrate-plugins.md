# Step 6: Migrate Built-in Plugins to `definePlugin`

## Goal

Rewrite all of Kubb's built-in plugins to use the new `definePlugin` API with `KubbEvents`. This is the main migration step — each plugin moves from `createPlugin` + external preset/generator wiring to `definePlugin` + `addGenerator()`/`setResolver()` in `kubb:setup`. Hooks are registered on the `AsyncEventEmitter` and dispatched via `events.emit`.

## Depends On

- Step 1 (`definePlugin` with `KubbEvents`)
- Step 2 (generator registration via `addGenerator()`)
- Step 3 (resolver as setup call)
- Step 4 (`this` → parameter context)
- Step 5 (`dependencies` replaces `pre`/`post`)

## Scope

Each plugin migration is a separate sub-PR. The order below minimizes risk — start with simple plugins, end with complex ones.

---

### 6a: `plugin-ts` (TypeScript types)

**Current structure:**
```
plugin-ts/src/
├── plugin.ts          — createPlugin with resolver getter + mergedGenerator forwarding
├── resolvers/         — resolverTs.ts (defineResolver)
├── generators/        — typeGenerator.tsx (defineGenerator)
├── presets.ts         — definePresets with default + kubbV4
├── types.ts           — PluginTs type
└── components/        — JSX components (Type.tsx, etc.)
```

**After migration:**
```
plugin-ts/src/
├── plugin.ts          — definePlugin with kubb:setup event
├── generators/        — typeGenerator.tsx (defineGenerator — same object, new signature)
├── types.ts           — simplified options type
└── components/        — JSX components (unchanged)
```

**Key changes in plugin.ts:**
```ts
// Before
export const pluginTs = createPlugin<PluginTs>((options) => {
  const preset = getPreset({ preset: options.preset, presets, fallback: 'default' })
  const merged = mergeGenerators(preset.generators)
  return {
    name: 'plugin-ts',
    get resolver() { return preset.resolver },
    async schema(node, opts) { return merged.schema?.call(this, node, opts) },
    async operation(node, opts) { return merged.operation?.call(this, node, opts) },
  }
})

// After
export const pluginTs = definePlugin((options = {}) => ({
  name: 'plugin-ts',
  hooks: {
    'kubb:setup'({ addGenerator, setResolver, setRenderer }) {
      setRenderer(jsxRenderer)
      setResolver({
        name(name, type) {
          return type === 'type' ? pascalCase(name) : camelCase(name)
        },
      })
      addGenerator(typeGenerator)
    },
  },
}))
```

**What's removed:** `resolvers/` dir, `presets.ts`, `mergeGenerators` call, `.call(this, ...)` forwarding

---

### 6b: `plugin-zod` (Zod schemas)

Similar to plugin-ts. Single generator (`zodGenerator`), single resolver.

**Key change:** The printer-based generator stays as a `defineGenerator` object — only the wiring changes (registered via `addGenerator()` instead of preset merging).

---

### 6c: `plugin-faker` (Faker data)

Simple plugin — single generator, single resolver. Straightforward migration.

---

### 6d: `plugin-msw` (MSW handlers)

Simple plugin — single generator. Depends on `plugin-ts` for types.

```ts
dependencies: ['plugin-ts'],
```

---

### 6e: `plugin-client` (API clients)

Most complex migration due to dynamic generator selection:

```ts
// Current: clientType option selects different generators
const generatorMap = {
  function: clientGenerator,
  class: classClientGenerator,
  'static-class': staticClassClientGenerator,
}

// After: conditional addGenerator in setup
'kubb:setup'({ addGenerator, setResolver, setRenderer }) {
  setRenderer(jsxRenderer)
  setResolver(resolverClient)
  
  switch (options.clientType) {
    case 'class':
      addGenerator(classClientGenerator)
      break
    case 'static-class':
      addGenerator(staticClassClientGenerator)
      break
    default:
      addGenerator(clientGenerator)
  }
}
```

---

### 6f: `plugin-react-query` / `plugin-solid-query` / `plugin-svelte-query` / `plugin-vue-query`

Multiple generators per plugin (query, mutation, infinite, suspense). Each generator is already a separate `defineGenerator` — they just move to `addGenerator()` registration.

```ts
'kubb:setup'({ addGenerator }) {
  addGenerator(queryGenerator)
  addGenerator(mutationGenerator)
  if (options.infinite) addGenerator(infiniteGenerator)
  if (options.suspense) addGenerator(suspenseGenerator)
}
```

---

### 6g: `plugin-cypress` / `plugin-redoc` / `plugin-mcp`

Small plugins, straightforward migration.

---

## Migration Pattern (per plugin)

1. Create new `plugin.ts` with `definePlugin`
2. Update generator signatures: `schema(this, node, opts)` → `schema(node, ctx)`
3. Remove `presets.ts` and `resolvers/` directory (logic moves inline to setup event)
4. Update imports
5. Update tests
6. Verify generated output matches exactly (snapshot tests)

## Acceptance Criteria (per sub-PR)

- [ ] Plugin uses `definePlugin` with `kubb:setup` event
- [ ] Generators registered via `addGenerator()`
- [ ] Resolver set via `setResolver()`
- [ ] No `.call(this, ...)` in plugin code
- [ ] Generated output matches before/after (snapshot comparison)
- [ ] All plugin tests pass
- [ ] Integration tests pass

## Size Estimate

Each plugin migration: ~50-200 lines changed (mostly deletions of preset/resolver boilerplate). Total across all plugins: ~1000-1500 lines changed.
