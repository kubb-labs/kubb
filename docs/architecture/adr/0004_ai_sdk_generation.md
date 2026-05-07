# ADR-0004: AI-powered SDK generation via `createAiRenderer`

| Status   | Authors        | Reviewers      | Issue | Decision date |
| -------- | -------------- | -------------- | ----- | ------------- |
| Proposed | @stijnvanhulle | @stijnvanhulle |       | 2026-05-07    |

## Context

Kubb generates SDK code from OpenAPI specifications through a plugin and renderer pipeline. An adapter converts the spec into a normalized AST. A plugin walks that AST, a generator returns elements for each operation or schema node, a renderer converts those elements into `FileNode` objects, and a parser serializes each file to a string on disk.

Today this covers TypeScript targets well: TypeScript types, Zod schemas, React Query hooks, Axios and fetch clients, MSW handlers, and MCP tool definitions.

Adding a new target language requires a dedicated plugin with its own template system, naming conventions, and serialization logic. That plugin also needs to track API changes over time. Maintaining one plugin per language does not scale.

One approach to this problem is to feed a normalized, dereferenced representation of each API operation to an LLM, alongside a "skills file" that describes the naming conventions, error handling, and file structure expected for that language. The LLM translates the operation into idiomatic code. It does not decide what the API does; the spec fixes that.

Kubb's AST is already that normalized representation. The `InputNode`, `OperationNode`, and `SchemaNode` types produced by `@kubb/adapter-oas` are fully resolved and free of `$ref` indirection. No new data layer is needed.

Kubb already separates language-specific knowledge into parsers. `@kubb/parser-ts` and `@kubb/parser-tsx` know how to serialize TypeScript AST nodes for their respective file extensions, but nothing about the AST structure they receive. Skills files for AI generation belong at the same layer: with the language, not inside a shared execution engine.

## Decision

`createAiRenderer` is added to `@kubb/core`. It returns a renderer factory that follows the same contract as `jsxRenderer` from `@kubb/renderer-jsx`. The renderer accepts a prompt (a system message and a user message) and calls an AI provider to get back generated file content.

The renderer does not know what language it is generating or what conventions apply. It calls the provider, converts the response into `FileNode` objects, and exposes them through the standard renderer interface.

Language-specific concerns, the skills content and the serialization of an `OperationNode` into a user message, are the generator's responsibility. The generator's `operation` hook receives the full `GeneratorContext`, including the adapter's `InputNode`. It assembles the system message from a skills file and the user message from a serialized view of the operation, then returns the assembled prompt for the renderer to process.

`serializeOperation` is exported from `@kubb/core` as a shared utility. It produces a minimal JSON representation of one operation and only the schemas it directly references. Generators can use it as-is or build on top of it.

`createAnthropicProvider` ships with `@kubb/core` as a concrete `AiProvider` implementation. The Anthropic SDK is an optional peer dependency and is not installed unless the user adds it. If `createAnthropicProvider` is called without the SDK present, it throws an error with the install command.

The renderer caches responses by a hash of the prompt. The cache lives under `.kubb/ai-cache/` at the project root and is invalidated whenever the operation schema or skills content changes.

## Rationale

Putting AI generation in a renderer keeps `defineGenerator` unchanged. The new capability is another renderer option alongside `jsxRenderer` and the direct `FileNode[]` return path. Any existing generator can use it.

A language-agnostic renderer mirrors how parsers work. `@kubb/parser-ts` knows TypeScript serialization but nothing about what AST it receives. The AI renderer knows how to call a provider but nothing about the target language. The skills content travels with the generator, which is where it belongs.

`serializeOperation` is a separate utility so multiple generators can share the same normalized operation view without duplicating logic.

The Anthropic SDK is a peer dependency so projects that only generate TypeScript do not install it. The dynamic import inside `createAnthropicProvider` surfaces a clear error at call time, not at module load.

## Consequences

### Positive

- Adding a new target language does not require a new plugin.
- `defineGenerator` is unchanged; existing plugins work without modification.
- Skills files are plain markdown and live alongside the project source.
- The cache skips the LLM for operations that have not changed since the last run.
- `AiProvider` is vendor-agnostic; other providers can implement it without changes to `@kubb/core`.
- Projects that do not use AI generation are not affected.

### Negative

- Code quality depends on the skills file. A vague or incomplete skills file produces inconsistent output.
- Generation requires a valid API key and network access.
- Generated code may contain bugs that a deterministic template would not, and those bugs may not appear until the SDK is used.
- Prompt assembly is the generator author's responsibility. Two generators targeting the same language may produce different styles if they maintain separate skills files.
- Changing a skills file invalidates the entire cache for that generator and triggers a full re-generation on the next run.

## Considered options

**Option A: `createAiRenderer` in `@kubb/core` with a language-agnostic interface (chosen)**

The renderer handles provider calls and file collection. Language skills and serialization live in the generator. The `AiProvider` interface is vendor-agnostic. The Anthropic SDK is an optional peer dependency.

**Option B: Language config embedded in `createAiRenderer`**

Skills and language selection would be passed to the renderer directly. Rejected because the renderer would then hold language-specific knowledge, which is the parser's job. It would also make the renderer harder to test in isolation.

**Option C: `defineAiGenerator` as a new generator factory**

A new factory parallel to `defineGenerator` would hardwire AI behavior into the generator signature. Rejected because the generator's job, walking the AST and returning an element, is unchanged. Adding AI via a renderer avoids changing the generator API and does not require plugin authors to migrate.

**Option D: Raw OpenAPI YAML passed to the LLM**

Passing the raw spec rather than the normalized AST was considered. Rejected because YAML contains unresolved `$ref` chains and requires the LLM to understand OpenAPI before it can produce any output. The normalized AST gives the LLM a smaller, unambiguous input.

**Option E: Batch mode, one LLM call per generation run**

Sending all operations in one request reduces API calls and latency. Deferred. Per-operation generation gives finer cache granularity, avoids context-window limits on large specs, and makes error isolation simpler. Batch support can be added later using the existing `operations` generator hook.

## Related ADRs

ADR-0003: Kubb Agent architecture and security model.
