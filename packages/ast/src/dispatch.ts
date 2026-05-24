/**
 * One entry in an ordered dispatch table: a predicate paired with a converter.
 *
 * @typeParam TContext - Per-input context handed to every rule. A spec adapter typically
 *   pre-computes this once per node (the source spec node plus derived fields like a
 *   normalized type or resolved options) so individual rules stay cheap predicates.
 * @typeParam TNode - The node a rule produces, e.g. a Kubb AST `SchemaNode`.
 */
export type DispatchRule<TContext, TNode> = {
  /** Identifies the rule when reading the table or debugging which branch ran. */
  name: string
  /** Returns `true` when this rule is responsible for the given context. */
  match: (context: TContext) => boolean
  /**
   * Produces a node for the context, or `null` to fall through to the next rule.
   *
   * Returning `null` lets a broad `match` defer: e.g. "has a `format`" matches many schemas,
   * but only some formats are convertible — the rest fall through to plain `type` handling.
   */
  convert: (context: TContext) => TNode | null
}

/**
 * Walks an ordered list of {@link DispatchRule}s and returns the first node produced.
 *
 * This is the shared backbone for spec adapters (OpenAPI today, AsyncAPI and others later).
 * The contract an adapter follows is intentionally minimal:
 *
 *     context → [rule.match → rule.convert] → node
 *
 * An adapter derives a context from a source spec node, then declares an ordered table of
 * rules mapping spec shapes onto Kubb AST nodes. To add support for a new spec, write a new
 * context type and a new rules table — the traversal here is reused unchanged.
 *
 * Order is significant: earlier rules win, so list higher-precedence or more specific shapes
 * first (e.g. composition keywords before plain `type`). A rule whose `match` returns `true`
 * may still `convert` to `null` to defer to later rules. When no rule produces a node this
 * returns `null`, leaving the caller to apply its own fallback.
 *
 * @example
 * ```ts
 * const node = dispatch(schemaRules, schemaContext) ?? createSchema({ type: fallbackType })
 * ```
 */
export function dispatch<TContext, TNode>(rules: ReadonlyArray<DispatchRule<TContext, TNode>>, context: TContext): TNode | null {
  for (const rule of rules) {
    if (!rule.match(context)) continue
    const node = rule.convert(context)
    if (node !== null && node !== undefined) return node
  }

  return null
}
