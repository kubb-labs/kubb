# ADR-0001: Include filter schema scoping

| Status   | Authors        | Reviewers      | Issue | Decision date |
| -------- | -------------- | -------------- | ----- | ------------- |
| Accepted | @stijnvanhulle | @stijnvanhulle |       | 2026-04-01    |

## Context

OpenAPI specifications declare reusable schemas under `components/schemas`. Plugins such as `plugin-ts` walk both the top-level schema list and the operation list to decide what to generate. The `include` option controls which operations are generated, for example `include: [{ type: 'tag', pattern: 'items' }]` restricts output to operations tagged `items`.

Before this change, `include` filters applied only to operations. Every top-level schema was generated regardless of whether an included operation referenced it. A user who filtered by tag still received types for schemas used exclusively by excluded operations.

The root cause: operation-based filter types (`tag`, `operationId`, `path`, `method`, `contentType`) return `null` from `matchesSchemaPattern` when evaluated against schema nodes. This produces an empty `applicable` list, so all schemas pass through unchecked.

## Decision

When a plugin's `include` option contains at least one operation-scoped filter type and no `schemaName` filter, `runPluginAstHooks` pre-computes the set of top-level schema names transitively reachable from the included operations before visiting schemas. Any named top-level schema not in that set is skipped before `resolveOptions` runs.

The reachability computation lives in `collectUsedSchemaNames(operations, schemas)` exported from `@kubb/ast`. It follows parameters, request body content, and response schemas through the full `$ref` graph using the `collect()` helper from `visitor.ts`.

When `include` also contains a `schemaName` filter, the scoping logic is disabled and `schemaName` rules apply through the existing resolver, preserving backward compatibility for mixed-filter configurations.

## Rationale

Applying operation filters consistently to both operations and their referenced schemas matches what users expect when they write `include: [{ type: 'tag', pattern: 'items' }]`. Generating every component schema regardless of reachability undermines the intent of the `include` option.

Extracting the reachability logic into a named, exported function keeps `runPluginAstHooks` readable and lets plugin authors build on the same traversal without reimplementing `$ref` graph walking.

## Consequences

### Positive

- Operation-scoped `include` now filters both operations and the schemas they reference, matching user intent.
- `collectUsedSchemaNames` is exported from `@kubb/ast` as a `minor` release. Custom plugins can import it without reimplementing `$ref` traversal.
- Transitive `$ref` traversal ensures shared schemas pulled in by an included operation are still generated.

### Negative

- Top-level component schemas referenced only by excluded operations are now skipped. This changes generated output for users who relied on all schemas being generated alongside an operation-scoped `include`.
- Users who need all schemas alongside an operation-scoped `include` must add an explicit `schemaName` filter to restore that behavior.

## Considered options

**Option A: Pre-filter schemas in `runPluginAstHooks` (chosen)**

Centralizing the logic in core means every plugin benefits without changes. The trade-off is that core gains knowledge of schema reachability.

**Option B: Filter inside each plugin's `resolveOptions`**

Granular per-plugin control, but every plugin would need to duplicate the reachability logic or depend on a shared utility with no consistency guarantee.

**Option C: Do nothing**

Predictable behavior is preserved, but user intent is not honored when using operation-scoped filters.

## Related ADRs

None.
