# ADR-0004: AI-powered SDK generation via `createAiRenderer`

| Status   | Authors        | Reviewers      | Issue | Decision date |
| -------- | -------------- | -------------- | ----- | ------------- |
| Proposed | @stijnvanhulle | @stijnvanhulle |       | 2026-05-07    |

## Context

Kubb generates SDK code deterministically from OpenAPI specifications through a plugin and renderer pipeline. A plugin walks the normalized AST produced by an adapter, a generator returns elements for each operation or schema node, a renderer converts those elements into `FileNode` objects, and a parser serializes each file to a string on disk. The current set of renderers and plugins covers TypeScript-centric targets well: TypeScript types, Zod schemas, React Query hooks, fetch and Axios clients, MSW handlers, and MCP tool definitions.

This coverage does not extend naturally to other languages. Generating a Python, Go, Ruby, or Java SDK today requires a dedicated, maintained plugin per language, each with its own template system, naming logic, and serialization strategy. Building and keeping those plugins current across a growing API surface is expensive.

WorkOS published a pattern that sidesteps this problem: rather than writing a deterministic template per language, they feed a clean, normalized representation of each API operation to an LLM — specifically Claude — alongside a "skills file" written in natural language that encodes the naming conventions, error handling strategy, serialization patterns, and file structure expected for that language. The LLM's task is narrowly constrained: translate a well-typed data structure into idiomatic code following the supplied conventions. It does not invent API behavior; the spec fixes what the API does.

Kubb's AST already functions as this normalized representation. The `InputNode`, `OperationNode`, and `SchemaNode` types produced by `@kubb/adapter-oas` are fully resolved, dereferenced, and free of OpenAPI-specific indirection. No new intermediate representation layer is needed. What is missing is a renderer that calls an LLM instead of the React reconciler.

There is also a separation-of-concerns question. Kubb already holds language-specific knowledge in parsers: `@kubb/parser-ts` and `@kubb/parser-tsx` know how to serialize TypeScript AST nodes to strings for their respective file extensions. Skills files for AI generation occupy the same layer — language-specific conventions that belong with the language, not embedded in a shared execution engine.

## Decision

A generic `createAiRenderer` function is added to `@kubb/core`. It returns a renderer factory — the same contract as `jsxRenderer` from `@kubb/renderer-jsx` — that accepts an assembled prompt (a system message and a user message) and calls an AI provider to obtain generated file content.

The renderer itself is entirely language-agnostic. It does not know what language it is generating, what conventions apply, or how the operation was serialized. Its only job is to call the provider, parse the response into `FileNode` objects, and expose them through the standard renderer interface.

Language-specific concerns — the skills content and the serialization of an `OperationNode` into a user message — are the responsibility of the generator that uses the renderer. A generator's `operation` hook receives the full `GeneratorContext` including the adapter's `InputNode`. From there it assembles the system message from a skills file and the user message from a serialized view of the operation, then returns the assembled prompt as the element for the renderer to process.

A `serializeOperation` utility is exported from `@kubb/core` to produce a clean, minimal JSON representation of one operation and only the schemas it directly references. This is the standard building block for the user message; generators may augment or replace it as needed.

A concrete `AiProvider` implementation backed by the Anthropic API ships with `@kubb/core` as `createAnthropicProvider`. The Anthropic SDK is declared as an optional peer dependency: it is not installed unless the user explicitly adds it. If the function is called without the SDK present, a clear error is raised pointing to the install command.

To avoid redundant API calls across unchanged operations, the renderer caches responses by a content hash derived from the prompt. The cache is stored under `.kubb/ai-cache/` at the project root and is automatically invalidated whenever the operation schema or skills content changes.

## Rationale

Placing the AI integration in a renderer rather than a new generator factory preserves the existing `defineGenerator` API without modification. Plugin authors continue to use the same primitives they know; the AI capability is an additional renderer option alongside `jsxRenderer` and the direct `FileNode[]` return path. This also means the AI renderer composes naturally with any generator, whether it comes from a first-party plugin or a user-defined one.

Keeping the renderer language-agnostic mirrors the role of the existing parsers. Just as `@kubb/parser-ts` knows TypeScript serialization rules but not the shape of the AST it receives, the AI renderer knows how to call a provider and collect files but not what language or conventions apply. The skills content travels with the generator, which is also where the OpenAPI-to-prompt serialization happens. This is the correct boundary.

Exporting `serializeOperation` as a shared utility rather than embedding serialization inside the renderer lets multiple generators and plugins reuse the same normalized view of an operation without duplicating the logic. It is also independently testable and can be improved without touching the renderer.

The optional peer dependency approach for the Anthropic SDK keeps `@kubb/core` lightweight. Users who generate only TypeScript output today do not download or bundle an SDK they do not need. The dynamic import path inside `createAnthropicProvider` surfaces a helpful error at call time rather than at module load time, which matches the pattern used elsewhere in the kubb ecosystem for optional integrations.

## Consequences

### Positive

- Any target language is achievable without a new dedicated plugin, lowering the bar for community-contributed language support.
- The `defineGenerator` API is unchanged; existing plugins require no migration.
- Language-specific skills files are plain markdown, versionable alongside the project, and improvable incrementally without touching framework code.
- Response caching makes repeated generation runs fast and deterministic for unchanged operations, even when the API key is required.
- The `AiProvider` interface is vendor-agnostic; alternative providers (OpenAI, Gemini, local models) can be added without changes to the renderer or core.
- AI generation is fully opt-in and adds no runtime cost for projects that do not use it.

### Negative

- The quality of generated code depends on the quality of the skills file. A poorly written skills file produces inconsistent or incorrect output.
- AI generation requires network access and a valid API key at code generation time.
- Generated output may contain subtle bugs that a deterministic template would not produce, and those bugs may not surface until the generated SDK is exercised at runtime.
- Prompt assembly — constructing the system and user messages — is left to the generator author. There is no enforced structure beyond the prompt type, so two generators targeting the same language may produce different styles of output.
- Caching is keyed on prompt content. A change to the skills file invalidates all cached entries for that generator, which may result in a full re-generation on the next run.

## Considered options

**Option A: `createAiRenderer` in `@kubb/core` with language-agnostic interface (chosen)**

The renderer handles only provider calls and file collection. Language skills and serialization live in the generator. The `AiProvider` interface is vendor-agnostic. The Anthropic SDK is an optional peer dependency.

**Option B: Language config embedded in `createAiRenderer`**

Skills and language selection would be passed directly to the renderer, giving it knowledge of which language it is generating. Rejected because it merges two distinct concerns — execution and language conventions — into the renderer, violating the same boundary that separates parsers from generators. It would also make the renderer harder to test and reuse across languages.

**Option C: `defineAiGenerator` as a new generator factory**

A new factory function parallel to `defineGenerator` would hardwire AI behavior into the generator signature. Rejected in favor of the renderer approach: the AI capability is better modeled as a renderer strategy than as a generator type, since the generator's job (walking the AST and producing an element) is unchanged. Changing the factory would also require plugin authors to adopt a new API.

**Option D: Raw OpenAPI YAML passed to the LLM**

Passing the raw specification document rather than kubb's normalized AST was considered. Rejected because YAML is verbose, contains unresolved references, and requires the LLM to understand OpenAPI semantics before it can produce any output. The normalized AST removes that burden and produces a smaller, more precise prompt.

**Option E: Batch mode — one LLM call per generation run**

Sending all operations in a single request reduces API call count and overall latency for small APIs. Deferred rather than rejected. Per-operation generation gives finer caching granularity, avoids context-window limits on large specifications, and simplifies error isolation. Batch support can be layered on later using the existing `operations` generator hook, which receives all operation nodes at once.

## Related ADRs

ADR-0003: Kubb Agent architecture and security model.
