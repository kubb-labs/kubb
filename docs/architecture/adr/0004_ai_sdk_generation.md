# ADR-0004: AI-powered extensions across the generation pipeline

| Status   | Authors        | Reviewers      | Issue | Decision date |
| -------- | -------------- | -------------- | ----- | ------------- |
| Proposed | @stijnvanhulle | @stijnvanhulle |       | 2026-05-07    |

## Context

Kubb generates SDK code from OpenAPI specifications through a fixed pipeline:

```
spec → [Adapter] → AST → [Generator] → element → [Renderer] → FileNode[] → [Parser] → string → disk
```

An adapter converts the spec into a normalized AST. A plugin walks that AST, a generator returns elements for each operation or schema node, a renderer converts those elements into `FileNode` objects, and a parser serializes each file to a string on disk.

Today this covers TypeScript targets well: TypeScript types, Zod schemas, React Query hooks, Axios and fetch clients, MSW handlers, and MCP tool definitions.

Extending this to new targets requires a dedicated plugin per target. A Python SDK plugin needs its own template system and naming conventions. A Valibot plugin needs its own schema-mapping logic. Each plugin also needs to track API and library changes over time. This does not scale across many languages and libraries.

One approach is to feed a normalized, dereferenced representation of each API operation to an LLM alongside a "skills file" that describes the naming conventions, error handling, and file structure expected for that target. The LLM translates the operation into idiomatic code. It does not decide what the API does; the spec fixes that.

Kubb's AST is already that normalized representation. The `InputNode`, `OperationNode`, and `SchemaNode` types produced by `@kubb/adapter-oas` are fully resolved and free of `$ref` indirection. No new data layer is needed.

Each step in the pipeline has a well-defined input and output. AI can implement any of those steps. The right entry point depends on the target:

- **Non-TypeScript targets** (Python, Go, Ruby): the renderer is the right place. AI decides file organization and generates content as a raw string.
- **TypeScript-output targets** (Valibot, Effect Schema, ArkType): the parser is the right place. The generator decides file organization deterministically; AI fills in the content for each file.
- **Non-standard spec formats**: the adapter is the right place. AI converts an unfamiliar format into kubb's normalized AST.

## Decision

Three AI-powered factory functions are added to `@kubb/core`, one per pipeline step.

### `createAiRenderer`

`createAiRenderer` returns a renderer factory that follows the same contract as `jsxRenderer` from `@kubb/renderer-jsx`. The renderer accepts an `AiPrompt` (a system message and a user message) and calls an AI provider to get back generated file content.

The renderer does not know what language it is generating or what conventions apply. It calls the provider, converts the response into `FileNode` objects where each source value is a complete raw string, and exposes them through the standard renderer interface.

Language-specific concerns, the skills content and the serialization of an `OperationNode` into a user message, are the generator's responsibility. The generator's `operation` hook assembles the system message from a skills file and the user message from a serialized view of the operation, then returns the assembled prompt for the renderer to process.

Use this path for targets where the output is not TypeScript: Python, Go, Ruby, Java, and similar languages.

### `createAiParser`

`createAiParser` returns a `Parser` that registers against specific file extensions, exactly like `parserTs` from `@kubb/parser-ts`. When the pipeline reaches the parse step, it calls Claude with the operation metadata stored in `FileNode.meta` and the skills file for that extension, and returns the generated string.

The generator creates `FileNode` objects with operation context in `file.meta` and leaves the source content empty. `createAiParser` fills that content at parse time. File organization, names, and structure remain under the generator's control.

Use this path for TypeScript-output targets like Valibot, Effect Schema, and ArkType, where `parserTs` handles other `.ts` files and `createAiParser` handles the AI-generated ones. The two parsers coexist because `createAiParser` only activates for `FileNode` objects that carry AI metadata.

### `createAiAdapter`

`createAiAdapter` returns an adapter that accepts a raw spec string and calls Claude with a skills file describing the source format. Claude returns the normalized AST as structured JSON. The rest of the pipeline is unchanged.

Use this path when the input is a format kubb has no native adapter for: RAML, custom API description formats, legacy WSDLs, or proprietary schemas.

### Shared utilities

`serializeOperation` is exported from `@kubb/core` as a utility used by both `createAiRenderer` and `createAiParser`. It produces a minimal JSON representation of one operation and only the schemas it directly references. Generators and parsers can use it as-is or build on top of it.

`createAnthropicProvider` ships with `@kubb/core` as a concrete `AiProvider` implementation. The Anthropic SDK is an optional peer dependency and is not installed unless the user adds it. If `createAnthropicProvider` is called without the SDK present, it throws an error with the install command.

All three factory functions cache responses by a hash of the prompt under `.kubb/ai-cache/` at the project root. The cache is invalidated whenever the operation schema or skills content changes.

## Rationale

Placing each AI factory at a different pipeline step matches the existing separation of concerns. The adapter converts input formats. The renderer produces files. The parser serializes content. AI can implement any of those steps without changing the steps around it.

`createAiRenderer` keeps `defineGenerator` unchanged. It is another renderer option alongside `jsxRenderer` and the direct `FileNode[]` return path.

`createAiParser` is the right path for TypeScript-output targets because `parserTs` expects TypeScript AST nodes, not raw strings. An AI-generated Valibot schema is a complete TypeScript string; passing it through `parserTs` would fail. A dedicated `createAiParser` registered for those files sidesteps the conflict cleanly.

`createAiAdapter` is the right path for non-standard inputs because it keeps all downstream steps unchanged. Once the adapter produces `InputNode[]`, the pipeline runs identically regardless of how those nodes were produced.

`serializeOperation` is a shared utility so the renderer and parser paths produce consistent LLM inputs from the same source data.

## Consequences

### Positive

- Adding a new target language or schema library does not require a new plugin.
- `defineGenerator` and `defineParser` are unchanged; existing plugins and parsers work without modification.
- Skills files are plain markdown and live alongside the project source.
- The cache skips the LLM for operations that have not changed since the last run.
- `AiProvider` is vendor-agnostic; other providers can implement it without changes to `@kubb/core`.
- Projects that do not use AI generation are not affected.

### Negative

- Code quality depends on the skills file. A vague or incomplete skills file produces inconsistent output.
- Generation requires a valid API key and network access.
- Generated code may contain bugs that a deterministic template would not, and those bugs may not appear until the SDK is used.
- `createAiParser` and `parserTs` both handle `.ts` files. The distinction relies on `FileNode.meta` being populated correctly by the generator; a misconfigured generator produces empty files.
- Changing a skills file invalidates the entire cache for that generator and triggers a full re-generation on the next run.

## Considered options

**Option A: `createAiRenderer`, `createAiParser`, and `createAiAdapter` as separate factory functions (chosen)**

Each factory targets one pipeline step and follows the existing interface for that step. The renderer path suits non-TypeScript targets; the parser path suits TypeScript-output libraries; the adapter path suits non-standard input formats. All three share the same `AiProvider` interface and caching strategy.

**Option B: Single `createAiRenderer` for all targets**

Using only the renderer for both Python and Valibot generation was considered. Rejected because `parserTs` expects TypeScript AST nodes, not raw strings. AI-generated TypeScript passed through `parserTs` would fail. A separate parser entry point is needed for TypeScript-output targets.

**Option C: Language config embedded in `createAiRenderer`**

Skills and language selection passed directly to the renderer. Rejected because the renderer would then hold language-specific knowledge, which is the parser's job. It would also make the renderer harder to test in isolation.

**Option D: `defineAiGenerator` as a new generator factory**

A new factory parallel to `defineGenerator` would hardwire AI behavior into the generator signature. Rejected because the generator's job, walking the AST and returning an element, is unchanged. The AI capability belongs in the renderer or parser, not the generator.

**Option E: Raw OpenAPI YAML passed to the LLM**

Passing the raw spec rather than the normalized AST was considered. Rejected because YAML contains unresolved `$ref` chains and requires the LLM to understand OpenAPI before it can produce any output. The normalized AST gives the LLM a smaller, unambiguous input.

**Option F: Batch mode, one LLM call per generation run**

Sending all operations in one request reduces API calls and latency. Deferred. Per-operation generation gives finer cache granularity, avoids context-window limits on large specs, and makes error isolation simpler. Batch support can be added later using the existing `operations` generator hook.

## Related ADRs

ADR-0003: Kubb Agent architecture and security model.
