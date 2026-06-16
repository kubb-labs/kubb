import type { VisitorDepth } from './constants.ts'
import type { Node } from './nodes/index.ts'
import type { Visitor, VisitorContext } from './visitor.ts'
import { transform } from './visitor.ts'

/**
 * Visitor callback names a macro can implement, one per traversable node kind.
 * Mirrors the keys of {@link Visitor}.
 */
const macroKeys = ['input', 'output', 'operation', 'schema', 'property', 'parameter', 'response'] as const

type MacroKey = (typeof macroKeys)[number]

/**
 * Sort weight for an `enforce` hint. `pre` sorts before unmarked items and `post` after, so a plain
 * list keeps its authored order.
 */
function enforceWeight(enforce?: 'pre' | 'post'): number {
  if (enforce === 'pre') return 0
  if (enforce === 'post') return 2
  return 1
}

/**
 * A named, composable transform over the Kubb AST. It carries the same per-kind callbacks as a
 * {@link Visitor} (`schema`, `operation`, …), plus a `name`, an optional `enforce` order, and an
 * optional `when` gate. Macros run on the shared AST, so the same macro works across every adapter
 * and output target. Exports follow the `macro<Name>` convention, mirroring plugins (`pluginTs`).
 */
export type Macro = Visitor & {
  /**
   * Macro identifier, surfaced in diagnostics. Follows the `macro<Name>` convention.
   */
  name: string
  /**
   * Ordering hint. `pre` macros run before unmarked macros, `post` macros run after.
   * Ordering within a bucket follows list order.
   */
  enforce?: 'pre' | 'post'
  /**
   * Gate checked against the current node before any callback runs. When it returns `false`
   * the macro is skipped for that node.
   */
  when?: (node: Node) => boolean
}

/**
 * Types a macro for inference and a single construction site, mirroring `definePlugin`.
 * Adds no runtime behavior.
 *
 * @example
 * ```ts
 * const macroUntagged = defineMacro({
 *   name: 'untagged',
 *   operation(node) {
 *     return node.tags?.length ? undefined : { ...node, tags: ['untagged'] }
 *   },
 * })
 * ```
 */
export function defineMacro(macro: Macro): Macro {
  return macro
}

type MacroCallback = (node: Node, context: VisitorContext) => Node | null | undefined

/**
 * Runs every macro's callback for one node kind in order, chaining the result so each macro sees
 * the previous macro's output. Returns `undefined` when nothing changed, so `transform` keeps the
 * original reference (structural sharing).
 */
function chain({ macros, key, node, context }: { macros: ReadonlyArray<Macro>; key: MacroKey; node: Node; context: VisitorContext }): Node | undefined {
  let current = node

  for (const macro of macros) {
    const callback = macro[key] as MacroCallback | undefined
    if (!callback) continue
    if (macro.when && !macro.when(current)) continue

    const next = callback(current, context)
    if (next != null) current = next
  }

  return current === node ? undefined : current
}

/**
 * Folds an ordered list of macros into a single {@link Visitor} that `transform` (and the per-plugin
 * transform layer in `@kubb/core`) can run. Macros are stable-sorted by `enforce`, then applied
 * sequentially per node so later macros see earlier output. This differs from a plain visitor, which
 * has no names, ordering, or composition.
 *
 * @example
 * ```ts
 * const visitor = composeMacros([macroSimplifyUnion, macroDiscriminatorEnum])
 * const next = transform(root, visitor)
 * ```
 */
export function composeMacros(macros: ReadonlyArray<Macro>): Visitor {
  const ordered = [...macros].sort((a, b) => enforceWeight(a.enforce) - enforceWeight(b.enforce))

  const visitor: Visitor = {}
  for (const key of macroKeys) {
    if (!ordered.some((macro) => typeof macro[key] === 'function')) continue

    const callback = (node: Node, context: VisitorContext) => chain({ macros: ordered, key, node, context })
    ;(visitor as Record<MacroKey, MacroCallback>)[key] = callback
  }

  return visitor
}

/**
 * Runs a list of macros over a node tree and returns the rewritten tree. Keeps `transform`'s
 * structural sharing, so an empty or no-op macro list returns the same reference. Pass
 * `depth: 'shallow'` to rewrite the root node only.
 *
 * @example
 * ```ts
 * const next = applyMacros(root, [macroIntegerToString])
 * ```
 *
 * @example Apply to the root node only
 * ```ts
 * const named = applyMacros(node, [macroEnumName({ parentName, propName, enumSuffix })], { depth: 'shallow' })
 * ```
 */
export function applyMacros<TNode extends Node>(root: TNode, macros: ReadonlyArray<Macro>, options?: { depth?: VisitorDepth }): TNode {
  if (macros.length === 0) return root

  return transform(root, { ...composeMacros(macros), depth: options?.depth }) as TNode
}
