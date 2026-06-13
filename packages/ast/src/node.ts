import type { BaseNode, NodeKind } from './nodes/base.ts'
import type { SchemaNode } from './nodes/index.ts'

/**
 * Visitor callback names, one per traversable node kind. Kept in sync with the
 * keys of `Visitor` in `visitor.ts`.
 */
type VisitorKey = 'input' | 'output' | 'operation' | 'schema' | 'property' | 'parameter' | 'response'

/**
 * Distributive `Omit` that preserves each member of a union.
 *
 * @example
 * ```ts
 * type A = { kind: 'a'; keep: string; drop: number }
 * type B = { kind: 'b'; keep: boolean; drop: number }
 * type Result = DistributiveOmit<A | B, 'drop'>
 * // -> { kind: 'a'; keep: string } | { kind: 'b'; keep: boolean }
 * ```
 */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

/**
 * Returns a type guard that matches nodes whose `kind` equals `kind`.
 */
export function isKind<T extends BaseNode>(kind: NodeKind) {
  return (node: unknown): node is T => (node as BaseNode).kind === kind
}

/**
 * Updates a schema's `optional` and `nullish` flags from a parent's `required`
 * value and the schema's own `nullable`. Mirrors how OpenAPI parameters and
 * object properties combine "required" and "nullable" into a single AST.
 *
 * - Non-required + non-nullable → `optional: true`.
 * - Non-required + nullable → `nullish: true`.
 * - Required → both flags cleared.
 */
export function syncOptionality(schema: SchemaNode, required: boolean): SchemaNode {
  const nullable = schema.nullable ?? false

  return {
    ...schema,
    optional: !required && !nullable ? true : undefined,
    nullish: !required && nullable ? true : undefined,
  }
}

/**
 * The single definition derived from one {@link defineNode} call: the node's
 * `create` builder, its `is` guard, and the traversal metadata the registry
 * collects into the visitor tables.
 */
export type NodeDef<TNode extends BaseNode = BaseNode, TInput = never> = {
  /**
   * Node discriminator this definition owns.
   */
  kind: NodeKind
  /**
   * Builds a node from its input, applying `defaults` and the optional `build` hook.
   */
  create: (input: TInput) => TNode
  /**
   * Type guard matching this node kind.
   */
  is: (node: unknown) => node is TNode
  /**
   * Child node fields in traversal order. Feeds `VISITOR_KEYS`.
   */
  children?: ReadonlyArray<string>
  /**
   * Visitor callback name. Feeds `VISITOR_KEY_BY_KIND`.
   */
  visitorKey?: VisitorKey
  /**
   * When `true`, `create` is rerun after children are rebuilt so computed fields
   * stay in sync. Feeds `nodeRebuilders`.
   */
  rebuild?: boolean
}

type DefineNodeConfig<TNode extends BaseNode, TInput, TBuilt extends object> = {
  kind: TNode['kind']
  defaults?: Partial<TNode>
  build?: (input: TInput) => TBuilt
  children?: ReadonlyArray<string>
  visitorKey?: VisitorKey
  rebuild?: boolean
}

/**
 * Defines a node once and derives its `create` builder, `is` guard, and traversal
 * metadata. `create` merges `defaults`, the `build` hook (or the raw input), and the
 * `kind`, so node construction lives in one place without scattered `as` casts.
 *
 * Set `rebuild: true` when the `build` hook computes fields from children (so the
 * node must be rebuilt after a transform rewrites them); the registry reuses `create`,
 * no separate function needed.
 *
 * @example Simple node
 * ```ts
 * const importDef = defineNode<ImportNode>({ kind: 'Import' })
 * const createImport = importDef.create
 * ```
 *
 * @example Node with a build hook that is rerun on transform
 * ```ts
 * const propertyDef = defineNode<PropertyNode, UserPropertyNode>({
 *   kind: 'Property',
 *   build: (props) => ({ ...props, required: props.required ?? false }),
 *   children: ['schema'],
 *   visitorKey: 'property',
 *   rebuild: true,
 * })
 * ```
 */
export function defineNode<TNode extends BaseNode, TInput = Omit<TNode, 'kind'>, TBuilt extends object = Omit<TNode, 'kind'>>(
  config: DefineNodeConfig<TNode, TInput, TBuilt>,
): NodeDef<TNode, TInput> {
  const { kind, defaults, build, children, visitorKey, rebuild } = config

  function create(input: TInput): TNode {
    const base = build ? build(input) : input
    return { ...defaults, ...(base as object), kind } as TNode
  }

  return { kind, create, is: isKind<TNode>(kind), children, visitorKey, rebuild }
}
