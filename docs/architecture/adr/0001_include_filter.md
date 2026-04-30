# ADR-0001: Include filter schema scoping

| Status   | Authors         | Reviewers       | Issue | Decision date |
| -------- | --------------- | --------------- | ----- | ------------- |
| Decided  | @stijnvanhulle  | @stijnvanhulle  |       | 2026-04-01    |

## Context / Problem

OpenAPI specifications declare reusable schemas under `components/schemas`. Plugins such as `plugin-ts` walk both the top-level schema list and the operation list to decide what to generate. The `include` option controls which operations are included — for example, `include: [{ type: 'tag', pattern: 'items' }]` restricts generation to operations tagged `items`.

Before this decision, `include` filters applied only to operations. Every top-level schema was always generated, regardless of whether it was reachable from an included operation. This produced unexpected output: configuring an operation-scoped `include` still emitted types for schemas used exclusively by excluded operations.

**Root cause**: operation-based filter types (`tag`, `operationId`, `path`, `method`, `contentType`) return `null` from `matchesSchemaPattern` when evaluated against schema nodes, yielding an empty `applicable` list and letting all schemas pass through.

## Decision

When a plugin's `include` option contains at least one operation-scoped filter type and no `schemaName` filter, `runPluginAstHooks` pre-computes the set of top-level schema names transitively reachable from the included operations before visiting schemas. Any named top-level schema not in that set is skipped before `resolveOptions` runs.

The reachability computation is extracted as `collectUsedSchemaNames(operations, schemas)` in `@kubb/ast`, following parameters, request body content, and response schemas through the full `$ref` graph.

When `include` also contains a `schemaName` filter, the new scoping logic is disabled entirely and `schemaName` rules are applied directly by the existing resolver, preserving backward compatibility for mixed-filter configurations.

## Rationale

- **Least surprise**: operation-scoped `include` already implies the user does not want code from excluded operations; it is natural to extend that intent to schemas they reference.
- **Additive, not breaking**: the new behaviour only activates when there is no `schemaName` filter in `include`. Configs that already use `schemaName` are unaffected.
- **Transitive reachability**: following `$ref` edges transitively ensures that shared schemas pulled in by an included operation are still generated, even when they are not directly named in the operation's parameters or responses.
- **Reusable utility**: extracting `collectUsedSchemaNames` into `@kubb/ast` lets custom plugins and generators apply the same reachability logic without reimplementing `$ref` traversal.

## Consequences

- **Schemas no longer generated**: top-level component schemas referenced only by excluded operations are silently skipped. This is intentional and matches the user's `include` intent.
- **Migration**: users who relied on all schemas always being generated alongside an operation-scoped `include` must add an explicit `schemaName` filter to their `include` array if they still need those schemas.
- **New public API**: `collectUsedSchemaNames` is exported from `@kubb/ast` as a minor release. Custom plugins can import and use it.

## Considered Options

1. **Schema-level `include` filter extension** — extend `resolveOptions` to evaluate operation-scoped filter types as "pass through" for schemas (return the first non-null result). Rejected: this changes resolver semantics and still cannot perform transitive reachability without a separate graph walk.
2. **Warn instead of skip** — emit a warning when an excluded schema is encountered and still generate it. Rejected: does not fix the unexpected output and adds noise to the build log.
3. **Opt-in flag** — add an explicit option such as `scopeSchemasToInclude: true`. Rejected: the current behaviour (generating all schemas regardless of `include`) is a bug, not a feature, so an opt-out (or no flag at all) is more appropriate.

## Related ADRs (Optional)

_None._
