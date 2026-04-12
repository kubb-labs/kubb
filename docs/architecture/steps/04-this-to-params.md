# Step 4: `this` Context → Event Parameters

## Goal

Replace `this`-based context in generator methods with **parameter-based context**. Generator `schema()`, `operation()`, and `operations()` methods receive context as a second argument instead of relying on `this` binding.

This is the most impactful change — it eliminates `.call(this, ...)` bugs, enables arrow function extraction, removes the global `Kubb.PluginContext` namespace hack, and gives each event phase-specific typed context.

## Depends On

- Step 1 (`definePlugin` with `KubbEvents` + `events.emit` dispatch)
- Step 2 (generator registration)
- Step 3 (resolver as setup call)

## Scope

- `packages/core/src/defineGenerator.ts` — update `Generator` type: `schema(node, ctx)` instead of `schema(this, node, options)`
- `packages/core/src/types.ts` — `GeneratorContext` type (parameter-based)
- `packages/core/src/build.ts` — pass context as argument instead of `.call(this, ...)`
- `packages/core/src/PluginDriver.ts` — build the context object for generators

## What Changes

### Generator signature changes

```ts
// Before (this-based)
export type Generator<TOptions> = {
  name: string
  schema?(this: GeneratorContext<TOptions>, node: SchemaNode, options: ResolvedOptions): PossiblePromise<Result>
  operation?(this: GeneratorContext<TOptions>, node: OperationNode, options: ResolvedOptions): PossiblePromise<Result>
  operations?(this: GeneratorContext<TOptions>, nodes: OperationNode[], options: ResolvedOptions): PossiblePromise<Result>
}

// After (parameter-based)
export type Generator<TOptions> = {
  name: string
  schema?(node: SchemaNode, ctx: GeneratorContext<TOptions>): PossiblePromise<Result>
  operation?(node: OperationNode, ctx: GeneratorContext<TOptions>): PossiblePromise<Result>
  operations?(nodes: OperationNode[], ctx: GeneratorContext<TOptions>): PossiblePromise<Result>
}
```

### Context passed as argument

```ts
// Before (in build.ts / PluginDriver)
const result = await gen.schema.call(thisContext, node, options)

// After — context emitted via events.emit, generators receive it as parameter
const ctx: GeneratorContext = {
  resolver: driver.getResolver(plugin.name),
  adapter,
  inputNode,
  options: plugin.options,
  root: config.root,
  logger,
  emitFile: (...files) => driver.fileManager.upsertFile(...files),
  getPlugin: (name) => driver.getPlugin(name),
}
// Dispatched via the event emitter — generators registered in kubb:setup respond
await events.emit('kubb:generate:schema', node, ctx)
```

### What this eliminates

**1. No more `.call(this, ...)`:**

```ts
// Before — error-prone, TypeScript can't catch forgotten .call()
const result = await gen.schema.call(this, node, options)

// After — just a function call
const result = await gen.schema(node, ctx)
```

**2. Arrow functions work:**

```ts
// Before — arrow functions lose `this`
const handleSchema = (node, options) => {
  this.resolver.default(node.name, 'type')  // ❌ undefined
}

// After — ctx is just a parameter
const handleSchema = (node, ctx) => {
  ctx.resolver.name(node.name, 'type')  // ✅ works
}
```

**3. Function composition works:**

```ts
// After — natural composition
const withLogging = (handler) => (node, ctx) => {
  ctx.logger.info(`Processing ${node.name}`)
  return handler(node, ctx)
}

const myGenerator = defineGenerator({
  name: 'logged-types',
  schema: withLogging((node, ctx) => {
    // ...
  }),
})
```

**4. Phase-specific context types:**

```ts
// Before — monolithic PluginContext with optional fields
type PluginContext = { adapter?: Adapter; inputNode?: InputNode; ... }

// After — GeneratorContext always has adapter and inputNode
type GeneratorContext = {
  resolver: Resolver        // always present (set in setup or default)
  adapter: Adapter          // always present (after adapter runs)
  inputNode: InputNode      // always present (after adapter runs)
  options: ResolvedOptions  // always present
  root: string
  logger: Logger
  emitFile(...files: FileNode[]): Promise<void>
  getPlugin(name: string): Plugin | undefined
}
```

## Backward Compatibility

For generators used with legacy `createPlugin` plugins:
- The framework detects `this`-style generators (those not created for the new API) and still uses `.call()` for them
- New generators created for `definePlugin` use parameter-based context
- A codemod or manual migration is needed when converting a generator to the new style

## What Does NOT Change

- `createPlugin` plugins — unchanged, still use `this`-based generators
- Build output — identical files generated
- `defineGenerator` — function name unchanged, but type signature updated

## Acceptance Criteria

- [ ] Generator `schema(node, ctx)` / `operation(node, ctx)` / `operations(nodes, ctx)` work with parameter context
- [ ] No `.call(this, ...)` needed for new-style generators
- [ ] `ctx.resolver`, `ctx.adapter`, `ctx.options`, `ctx.logger` all properly typed and available
- [ ] Arrow function generators work correctly
- [ ] Legacy `this`-based generators still work with `createPlugin`
- [ ] Existing tests pass (legacy generators unchanged)

## Test Plan

1. Add unit test: generator with `schema(node, ctx)` receives correct context
2. Add unit test: arrow function generator works (no `this` binding issues)
3. Add unit test: `ctx.resolver.name()` returns correct values
4. Add unit test: `ctx.emitFile()` writes files to fileManager
5. Add test: legacy `this`-based generator still works with `createPlugin`
6. All existing tests remain green

## Size Estimate

~200-250 lines changed in core. This is the biggest single change but scoped to core only — no plugin changes in this step.
