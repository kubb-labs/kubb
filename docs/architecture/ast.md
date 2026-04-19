# @kubb/ast — Architecture Decision Record

## Status

Accepted — implemented in v4.33.3

## Context

Kubb generates client code (TypeScript types, Zod schemas, React Query hooks, MSW handlers, etc.) from OpenAPI specifications. Each plugin independently parsed the raw OAS document through the old OAS layer and transformed it into a plugin-specific keyword representation defined in `plugin-oas`'s `SchemaMapper.ts`.

This keyword system works, but it creates several problems as the codebase grows:

- **Tight coupling to OAS.** Every plugin imports from `@kubb/plugin-oas` and depends on its internal `Schema[]` / `SchemaKeywordMapper` types. Adding support for a non-OAS input format (GraphQL, gRPC, JSON Schema) would require changes across every plugin.
- **No shared traversal contract.** Each plugin walks schemas with its own loops and conditionals. There is no common visitor or tree-walking abstraction, so cross-cutting concerns (deprecation warnings, documentation injection, validation) must be duplicated.
- **Hard to test in isolation.** Creating a representative test fixture requires a real OAS document and a live `SchemaGenerator` instance. There is no way to construct a schema tree directly in a test without going through the full parsing pipeline.
- **No structured representation of operations.** Parameters, request bodies, and responses are scattered across separate data structures rather than being part of a unified tree that a generator can traverse once.

## Decision

We introduce `@kubb/ast` — a published, spec-agnostic AST layer that sits between the OAS parser and the code generators.

### Node tree

```
RootNode
├── schemas: SchemaNode[]           ← named, reusable schemas
└── operations: OperationNode[]
    ├── parameters: ParameterNode[] → SchemaNode
    ├── requestBody?: SchemaNode
    └── responses: ResponseNode[]  → SchemaNode?

SchemaNode (discriminated union on `type`)
  Structural:  object | array | tuple | union | intersection | enum
  Scalar:      string | number | integer | bigint | boolean
               null | any | unknown | void
  Special:     ref | date | datetime | time | uuid | email | url | blob
```

Each node carries `kind: NodeKind` as a discriminant. The top-level `Node` type is a proper TypeScript discriminated union, which means `switch (node.kind)` narrows automatically without casts.

### API surface

| Import path       | Contents                                                                      |
| ----------------- | ----------------------------------------------------------------------------- |
| `@kubb/ast`       | Runtime: factory functions, guards, visitor functions, ref helpers, constants |
| `@kubb/ast/types` | Types only: all node interfaces and type aliases                              |

**Factory** — creates nodes with correct defaults, types every return to the specific variant:

```ts
createRoot({ schemas: [...], operations: [...] })
createOperation({ operationId, method, path, ... })
createSchema({ type: 'object', properties: [...] })   // returns ObjectSchemaNode
createSchema({ type: 'union', members: [...] })       // returns UnionSchemaNode
```

**Visitor** — depth-first traversal with three modes:

```ts
walk(root, visitor); // async, side effects only
transform(root, visitor); // sync, returns new tree (immutable)
collect<T>(root, visitor); // sync, returns T[]
```

**Guards** — type-narrowing predicates:

```ts
isSchemaNode(node); // node is SchemaNode
narrowSchema(node, "object"); // ObjectSchemaNode | undefined
```

**Refs** — fast named-schema lookup:

```ts
const map = buildRefMap(root);
const pet = resolveRef(map, "Pet");
```

## Consequences

### Positive

- **Plugins become simpler.** A plugin generator receives a `RootNode` and traverses it with `transform` or `collect`. It no longer needs to understand OAS internals or call `getSchemas()` / `getOperations()` directly.
- **Testability improves dramatically.** Any plugin test can construct a representative AST with factory functions in a few lines, without needing an OAS file or a running `SchemaGenerator`.
- **Cross-cutting concerns become first-class.** Features like deprecation propagation, description normalization, or nullable flattening can be implemented as a single `transform` pass applied before plugins run, instead of being scattered across each generator.
- **Non-OAS input formats become possible.** A future GraphQL or JSON Schema adapter only needs to produce a `RootNode`. Every existing plugin and tool built on `@kubb/ast` works without modification.
- **AST viewer.** `internals/ast-viewer` already consumes `@kubb/ast` to render an interactive tree visualization. This tooling becomes a natural debugging surface for plugin authors.

### Negative / trade-offs

- **Migration work.** Existing plugins use `SchemaKeywordMapper` / `Schema[]` internally. Migrating them to consume a `RootNode` from `@kubb/ast` is incremental but non-trivial. The keyword system and the AST layer coexist during the transition.
- **Abstraction cost.** The AST introduces one additional representation layer between OAS and code output. Teams unfamiliar with the AST model need to learn the node hierarchy.
- **`SchemaNode` is a large union.** With ~20 variants, exhaustive switch statements are verbose. `narrowSchema` and `SchemaNodeByType` mitigate this.

## Migration path

The migration from `SchemaKeywordMapper` to `@kubb/ast` is intended to be incremental:

1. **Phase 1 (current)** — `@kubb/ast` is published and available. `plugin-oas` continues to own the OAS → keyword transformation. New utilities and tooling (ast-viewer, MCP tools) start consuming `@kubb/ast` directly.
2. **Phase 2** — `plugin-oas`'s `SchemaGenerator` gains an `toAst(): RootNode` method that converts the parsed keyword tree into a `RootNode`. Plugins can opt in by calling `toAst()` instead of walking `Schema[]` directly.
3. **Phase 3** — Plugin generators are rewritten to receive a `RootNode` as input. The `SchemaKeywordMapper` layer is deprecated and eventually removed.
4. **Phase 4** — A non-OAS adapter (e.g. JSON Schema, GraphQL) can produce a `RootNode` directly, enabling Kubb to generate client code from non-OpenAPI sources without touching any plugin.

## Alternatives considered

### Keep the keyword system and extend it

The existing `SchemaKeywordMapper` in `plugin-oas` could be extracted and shared. We rejected this because the keyword system is inherently OAS-shaped (it carries OAS-specific metadata like `$ref` paths, file import flags, and `asConst` hints) and cannot cleanly represent non-OAS schemas.

### Use Babel/ESTree/TypeScript AST directly

General-purpose ASTs are designed for language syntax, not API semantics. They carry no concept of an `OperationNode`, `ParameterNode`, or `ResponseNode`. Using them would require an additional semantic layer anyway — which is exactly what `@kubb/ast` provides.

### Generate code via templates (Handlebars, EJS, etc.)

Template-based generation makes type-safe transformation and programmatic manipulation difficult. Kubb's React-Fabric component model already provides a better rendering abstraction. The AST layer complements it by providing a structured, typed input to those components.
