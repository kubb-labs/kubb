# ADR-0001: Include filter schema scoping

| Status   | Authors        | Reviewers      | Issue | Decision date |
| -------- | -------------- | -------------- | ----- | ------------- |
| Accepted | @stijnvanhulle | @stijnvanhulle |       | 2026-04-01    |

## Context

OpenAPI specs declare reusable schemas under `components/schemas`. Plugins like `plugin-ts` walk both the schema list and the operation list to decide what to generate. The `include` option scopes the operations that get generated. For example, `include: [{ type: 'tag', pattern: 'items' }]` keeps only the operations tagged `items`.

Before this change, `include` only filtered operations. Every top-level schema was still generated, even when no included operation referenced it. A user who filtered by tag ended up with types for schemas that belonged exclusively to excluded operations.

The reason is in `matchesSchemaPattern`. Operation-based filter types (`tag`, `operationId`, `path`, `method`, `contentType`) return `null` for schema nodes. The `applicable` list is empty, so every schema slips through.

## Decision

When a plugin's `include` option contains at least one operation-scoped filter type and no `schemaName` filter, `runPluginAstHooks` pre-computes the set of top-level schema names reachable from the included operations before visiting schemas. Any named top-level schema outside that set is skipped before `resolveOptions` runs.

The reachability logic lives in `collectUsedSchemaNames(operations, schemas)`, exported from `@kubb/ast`. It walks parameters, request body content, and response schemas across the full `$ref` graph using the `collect()` helper from `visitor.ts`.

When `include` also contains a `schemaName` filter, the new scoping is skipped and `schemaName` rules continue to apply through the existing resolver. Mixed-filter configs keep their previous behavior.

## Rationale

Applying operation filters to both operations and the schemas they reference matches what users expect from `include: [{ type: 'tag', pattern: 'items' }]`. Emitting every component schema, regardless of reachability, works against the intent of the option.

Pulling the traversal into a named, exported function keeps `runPluginAstHooks` readable. Plugin authors can reuse it instead of reimplementing `$ref` walking themselves.

## Consequences

### Positive

- Operation-scoped `include` now filters both operations and their referenced schemas, which matches user intent.
- `collectUsedSchemaNames` ships from `@kubb/ast` in a `minor` release. Custom plugins can import it instead of writing their own `$ref` traversal.
- Shared schemas pulled in by an included operation are still generated, because the traversal follows `$ref` chains end to end.

### Negative

- Top-level component schemas that only excluded operations reference are no longer generated. Users who relied on getting every schema alongside an operation-scoped `include` will see different output.
- To restore the old behavior, add an explicit `schemaName` filter to `include`.

## Considered options

**Option A: Pre-filter schemas in `runPluginAstHooks` (chosen)**

Putting the logic in core means every plugin benefits without code changes. The trade-off is that core now knows about schema reachability.

**Option B: Filter inside each plugin's `resolveOptions`**

Per-plugin control, but every plugin would have to duplicate the reachability logic or rely on a shared utility with no consistency guarantee.

**Option C: Do nothing**

Behavior stays predictable, but user intent is ignored when the filter is operation-scoped.

## Related ADRs

None.
