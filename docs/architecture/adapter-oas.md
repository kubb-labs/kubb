# @kubb/adapter-oas — Architecture Decision Record

## Status

Accepted — implemented in v4.x

## Context

Before this change, the OpenAPI specification was parsed and processed entirely inside `@kubb/plugin-oas`. Every plugin that needed schema or operation data imported directly from `@kubb/plugin-oas` and depended on its internal `SchemaGenerator`, `OperationGenerator`, and `SchemaKeywordMapper` types.

This worked, but created a structural problem: **the boundary between "reading the spec" and "generating code from the spec" did not exist as an explicit contract in the architecture**.
The two concerns were fused inside `plugin-oas`, which caused several issues that grew worse as the plugin ecosystem expanded.

### Problems with the old design

**Options duplication across plugins.**
Options that logically belong to the OpenAPI spec interpretation — `dateType`, `integerType`, `unknownType`, `discriminator`, `collisionDetection` — were repeated in the options of every plugin (`plugin-ts`, `plugin-zod`, `plugin-faker`, `plugin-react-query`, …). When a user changed how `format: date-time` should be represented, they had to update every plugin individually. There was no single place to say "for this spec, treat dates as `Date` objects".

**Validation happened inside a plugin.**
Spec validation was triggered inside `plugin-oas` during plugin setup. This meant validation was only performed when `plugin-oas` was included in the plugin list, and its timing and error reporting were tied to the plugin lifecycle rather than to the input ingestion step where it logically belongs.

**No formal input contract.**
`plugin-oas` accepted a file path or a raw document via the global Kubb config `input` field, but this was an implicit convention — not a typed, versioned interface. Adding a second spec, supporting an in-memory document, or loading a spec over HTTP required hacking the config shape.

**Spec parsing was OAS-shaped forever.**
Because the spec parsing code lived inside a plugin, supporting a non-OAS format (AsyncAPI, Drizzle schema, JSON Schema) would have required either adding another plugin with a completely parallel implementation, or invasive changes to `plugin-oas` itself. Neither option scales.

**Hard to test the parsing layer in isolation.**
Testing how the OAS document is converted into an AST required spinning up a full plugin context. The parsing concerns had no standalone entry point.

## Decision

We introduce `@kubb/adapter-oas` — a first-class adapter that is responsible for one thing: **converting an OpenAPI / Swagger source document into a `@kubb/ast` `RootNode`**.

The adapter is not a plugin. It does not generate files. It does not know about TypeScript, Zod, or React Query. It reads the spec, applies configuration (validation, date types, discriminator strategy, etc.), and produces a universal `RootNode` that every plugin consumes.

### The adapter contract

The core `Adapter<T>` type in `@kubb/core` defines the interface every adapter must satisfy:

```ts
type Adapter<TOptions> = {
  name: string;
  options: TOptions;
  parse: (source: AdapterSource) => Promise<RootNode>;
};
```

`AdapterSource` is a discriminated union that covers the three ways a user can supply an input:

| Variant                              | When to use                             |
| ------------------------------------ | --------------------------------------- |
| `{ type: 'path'; path: string }`     | Local file or URL                       |
| `{ type: 'data'; data: object }`     | Pre-parsed JS object                    |
| `{ type: 'paths'; paths: string[] }` | Multiple spec files merged at load time |

`RootNode` is defined by `@kubb/ast` and is the universal intermediate representation consumed by all plugins.

### Where adapters fit

```
kubb.config.ts
  adapter: adapterOas({ dateType: 'date', discriminator: 'strict' })  ← NEW
  input:   { path: './openapi.yaml' }
  plugins: [pluginTs(), pluginZod(), pluginReactQuery()]
       │
       │  (startup)
       ▼
@kubb/adapter-oas
  1. Load spec from AdapterSource
  2. Validate (if validate: true)
  3. Resolve $refs, apply discriminator strategy
  4. Convert OAS schemas + operations → RootNode   (via createOasParser)
       │
       ▼
@kubb/ast  RootNode
  schemas:    SchemaNode[]
  operations: OperationNode[]
       │
       │  (parallel, one task per plugin)
       ├─► pluginTs     → *.ts type files
       ├─► pluginZod    → *.zod.ts files
       ├─► pluginFaker  → *.mock.ts files
       └─► pluginReactQuery → *Hooks.ts files
```

### User-facing configuration

```ts
import { defineConfig } from "@kubb/core";
import { adapterOas } from "@kubb/adapter-oas";

export default defineConfig({
  adapter: adapterOas({
    validate: true,
    dateType: "date", // ← was repeated in every plugin before
    integerType: "number", // ← same
    discriminator: "strict", // ← same
    collisionDetection: false, // ← same
    contentType: "application/json",
    serverIndex: 0,
  }),
  input: { path: "./openapi.yaml" },
  plugins: [
    pluginTs(), // ← no longer need dateType, integerType, etc.
    pluginZod(),
  ],
});
```

Options that describe **how to interpret the spec** are now on the adapter. Options that describe **how to generate code** remain on the individual plugins.

### `createAdapter` factory

New adapters are created with the `createAdapter` factory from `@kubb/core`:

```ts
import { createAdapter } from "@kubb/core";

export const adapterOas = createAdapter<OasAdapter>((options) => ({
  name: "oas",
  options: {
    /* resolved options with defaults */
  },
  async parse(source) {
    const oas = await loadOas(source);
    const parser = createOasParser(oas, options);
    return parser.buildAst(options);
  },
}));
```

This pattern makes it straightforward to add adapters for other spec formats — each one is a self-contained module with a typed options interface and a single `parse` method.

## Consequences

### Positive

- **Single source of truth for spec-level options.** `dateType`, `integerType`, `discriminator`, `collisionDetection`, and `contentType` are configured once on the adapter and are no longer duplicated across every plugin.

- **Validation happens at the right time.** Spec validation is part of the adapter's `parse` step — it runs before any plugin is invoked, with clear error reporting that is not entangled with code generation.

- **Plugins are simpler.** A plugin generator receives a `RootNode` from `@kubb/ast`. It does not need to import `SchemaGenerator`, call `getSchemas()`, or understand OAS internals. The plugin's job is purely to transform the AST into code.

- **Non-OAS formats become first-class.** Adding an AsyncAPI, Drizzle, or JSON Schema adapter only requires writing a module that satisfies the `Adapter` interface and produces a `RootNode`. Every existing plugin and tool that consumes `@kubb/ast` works without modification.

- **Testability.** The `parse` method can be called directly in a unit test with an inline `AdapterSource`. The OAS parsing logic is no longer locked behind a full plugin setup.

- **Explicit config.** `adapter: adapterOas(...)` in `kubb.config.ts` is a visible, self-documenting declaration of what input format the project uses. Before, this was implicit — you just happened to include `plugin-oas` in the plugins array.

- **Omitting the adapter still works.** When `adapter` is omitted from the config, Kubb uses the built-in OAS adapter with default options. Existing configs continue to work without changes.

### Negative / trade-offs

- **Two layers during migration.** `plugin-oas` continues to exist while plugins migrate to consume `RootNode` instead of `Schema[]`. The adapter and the plugin coexist temporarily, which means some OAS processing happens twice during the transition.

- **Learning curve.** Users who are familiar with putting `dateType` on `plugin-ts()` need to learn to move it to the adapter. A deprecation warning in `plugin-ts` and a migration guide entry are required to make this smooth.

- **Adapter is a new concept.** Plugin authors who want to ship a custom input format now need to understand both `createAdapter` and `@kubb/ast`. This is offset by the fact that the interface is small (one `parse` method) and the result type is the same `RootNode` all plugins already consume.

## Alternatives considered

### Keep spec-level options on individual plugins

We considered leaving `dateType`, `discriminator`, etc. on each plugin and documenting "make sure they match". We rejected this because it creates a class of bugs that is silent and hard to diagnose — a user sets `dateType: 'date'` on `pluginTs` but forgets `pluginZod`, and the generated types and schemas silently disagree.

### Add a `sharedOptions` field to `defineConfig`

We considered a `sharedOptions` key in `kubb.config.ts` that plugins would merge with their own options. This would solve the duplication problem but would not solve the "no formal input contract" or "spec parsing is OAS-only" problems. The adapter approach achieves all goals with a single abstraction.

### Move spec parsing into `@kubb/core` directly

We considered building OAS parsing into the Kubb core runtime, making it a built-in step that every project gets automatically. We rejected this because it would make `@kubb/core` depend on `oas`, hardcode OAS as the only supported format, and eliminate the extensibility that the adapter pattern provides.

## Migration path

The migration from `plugin-oas` carrying spec-level options to `adapter-oas` owning them is incremental:

1. **Phase 1 (current)** — `@kubb/adapter-oas` is published. Users can opt in by adding `adapter: adapterOas({ ... })` to their config. `plugin-oas` continues to work unchanged.
2. **Phase 2** — Spec-level options on individual plugins (`dateType`, `integerType`, etc.) emit a deprecation warning directing users to the adapter.
3. **Phase 3** — Plugin generators are rewritten to receive a `RootNode` from the adapter instead of calling `SchemaGenerator` / `OperationGenerator` directly.
4. **Phase 4** — `plugin-oas` is reduced to a thin compatibility shim or removed. The adapter is the single entry point for all OpenAPI processing.
