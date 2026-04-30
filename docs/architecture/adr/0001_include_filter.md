# ADR-0001: Include filter schema scoping

| Status   | Authors        | Reviewers      | Issue | Decision date |
| -------- | -------------- | -------------- | ----- | ------------- |
| Accepted | @stijnvanhulle | @stijnvanhulle |       | 2026-04-01    |

## Context

OpenAPI specifications declare reusable schemas under `components/schemas`. Plugins such as `plugin-ts` walk both the top-level schema list and the operation list to decide what to generate. The `include` option controls which operations are included — for example, `include: [{ type: 'tag', pattern: 'items' }]` restricts generation to operations tagged `items`.

Before this decision, `include` filters applied only to operations. Every top-level schema was generated regardless of whether it was reachable from an included operation. This produced unexpected output: an operation-scoped `include` still emitted types for schemas used exclusively by excluded operations.

Operation-based filter types (`tag`, `operationId`, `path`, `method`, `contentType`) return `null` from `matchesSchemaPattern` when evaluated against schema nodes, yielding an empty `applicable` list and letting all schemas pass through.

## Decision

When a plugin's `include` option contains at least one operation-scoped filter type and no `schemaName` filter, `runPluginAstHooks` pre-computes the set of top-level schema names transitively reachable from the included operations before visiting schemas. Any named top-level schema not in that set is skipped before `resolveOptions` runs.

The reachability computation is extracted as `collectUsedSchemaNames(operations, schemas)` in `@kubb/ast`. It follows parameters, request body content, and response schemas through the full `$ref` graph.

When `include` also contains a `schemaName` filter, the new scoping logic is disabled and `schemaName` rules are applied directly by the existing resolver, preserving backward compatibility for mixed-filter configurations.

## Consequences

**Positive:**

- Operation-scoped `include` now filters both operations and the schemas they reference, matching user intent.
- `collectUsedSchemaNames` is exported from `@kubb/ast` (`minor` release). Custom plugins can import and reuse it without reimplementing `$ref` traversal.
- Transitive `$ref` traversal ensures shared schemas pulled in by an included operation are still generated.

**Negative:**

- Top-level component schemas referenced only by excluded operations are now silently skipped. This is intentional but constitutes a breaking change in generated output for some users.
- Users who relied on all schemas always being generated alongside an operation-scoped `include` must add an explicit `schemaName` filter to their `include` array to restore that behavior.
