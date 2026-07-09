import type { BaseNode, NodeKind } from './nodes/base.ts'

/**
 * Visitor callback names, one per traversable node kind, in traversal order.
 * Kept in sync with the keys of `Visitor` in `visitor.ts`.
 */
export const visitorKeys = ['input', 'output', 'operation', 'schema', 'property', 'parameter', 'response'] as const

/**
 * One of the {@link visitorKeys} callback names.
 */
export type VisitorKey = (typeof visitorKeys)[number]

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
 * Builds a type guard that matches nodes of the given `kind`.
 */
function isKind<T extends BaseNode>(kind: NodeKind) {
  return (node: unknown): node is T => (node as BaseNode | undefined)?.kind === kind
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
}

type DefineNodeConfig<TNode extends BaseNode, TInput, TBuilt extends object> = {
  kind: TNode['kind']
  defaults?: Partial<TNode>
  build?: (input: TInput) => TBuilt
  children?: ReadonlyArray<string>
  visitorKey?: VisitorKey
}

/**
 * Defines a node once and derives its `create` builder, `is` guard, and traversal
 * metadata. `create` merges `defaults`, the `build` hook (or the raw input), and the
 * `kind`, so node construction lives in one place without scattered `as` casts.
 *
 * @example Simple node
 * ```ts
 * const importDef = defineNode<ImportNode>({ kind: 'Import' })
 * const createImport = importDef.create
 * ```
 *
 * @example Node with a build hook
 * ```ts
 * const propertyDef = defineNode<PropertyNode, UserPropertyNode>({
 *   kind: 'Property',
 *   build: (props) => ({ ...props, required: props.required ?? false }),
 *   children: ['schema'],
 *   visitorKey: 'property',
 * })
 * ```
 */
export function defineNode<TNode extends BaseNode, TInput = Omit<TNode, 'kind'>, TBuilt extends object = Omit<TNode, 'kind'>>(
  config: DefineNodeConfig<TNode, TInput, TBuilt>,
): NodeDef<TNode, TInput> {
  const { kind, defaults, build, children, visitorKey } = config

  function create(input: TInput): TNode {
    const base = build ? build(input) : input
    // `kind` is written first so the discriminant lands at a fixed in-object offset for every node
    // of this kind. Hot dispatch paths (`transform`, `walk`, the parser printers) read `node.kind`
    // constantly; a trailing-only `kind` floats its offset with each node's field count and turns
    // those reads megamorphic. The post-spread reassignment keeps `kind` authoritative when an input
    // carries a (wrong) `kind`: it overwrites the offset-0 slot in place without reshaping the node.
    const built = { kind, ...defaults, ...(base as object) }
    const node = built as TNode
    node.kind = kind
    return node
  }

  return { kind, create, is: isKind<TNode>(kind), children, visitorKey }
}
