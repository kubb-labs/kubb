import { defineNode } from '../defineNode.ts'
import type { BaseNode, NodeKind } from './base.ts'

/**
 * AST node for a bare identifier reference, the root of most value expressions.
 * Serialized verbatim as its `name`, e.g. `z` or `faker`.
 */
export type IdentifierNode = BaseNode & {
  kind: 'Identifier'
  /**
   * Symbol name written as-is.
   */
  name: string
}

/**
 * AST node for a primitive literal value. Strings are single-quoted on serialization,
 * `null` becomes `null`, and numbers and booleans are written bare.
 */
export type LiteralNode = BaseNode & {
  kind: 'Literal'
  /**
   * The literal value. A string is quoted, everything else is written as-is.
   */
  value: string | number | boolean | null
}

/**
 * AST node for a member access, serialized as `object.property`.
 * A dotted path such as `z.iso.date` is nested `Member` nodes.
 */
export type MemberNode = BaseNode & {
  kind: 'Member'
  /**
   * Expression the property is read from.
   */
  object: ExpressionNode
  /**
   * Property name accessed after the dot.
   */
  property: string
}

/**
 * AST node for a call expression, serialized as `callee(args)`.
 * A method chain like `z.string().min(1)` is a `Call` whose `callee` is a {@link MemberNode}.
 *
 * @example Method chain
 * ```ts
 * createCall({ callee: createMember({ object: createIdentifier({ name: 'z' }), property: 'string' }), args: [] })
 * // z.string()
 * ```
 */
export type CallNode = BaseNode & {
  kind: 'Call'
  /**
   * Expression being called.
   */
  callee: ExpressionNode
  /**
   * Positional arguments, joined with `, `.
   */
  args: Array<ExpressionNode>
  /**
   * Explicit type arguments rendered as `<A, B>` before the argument list.
   */
  typeArgs?: Array<string>
}

/**
 * A plain `key: value` member of an {@link ObjectExpressionNode}.
 */
export type ObjectPropertyEntry = {
  /**
   * Discriminator selecting the plain-property rendering.
   */
  type: 'prop'
  /**
   * Property key, quoted only when it is not a valid identifier.
   */
  key: string
  /**
   * Property value expression.
   */
  value: ExpressionNode
}

/**
 * A getter member of an {@link ObjectExpressionNode}, used to defer evaluation of a
 * recursive value. Non-memoized renders as `get key() { return value }`. Memoized caches
 * the value on first access through `Object.defineProperty`.
 */
export type ObjectGetterEntry = {
  /**
   * Discriminator selecting the getter rendering.
   */
  type: 'getter'
  /**
   * Getter key, quoted only when it is not a valid identifier.
   */
  key: string
  /**
   * Value expression returned by the getter.
   */
  value: ExpressionNode
  /**
   * Cache the value on first access through `Object.defineProperty` instead of recomputing it.
   */
  memoize?: boolean
}

/**
 * A spread member of an {@link ObjectExpressionNode}, serialized as `...expression`.
 */
export type ObjectSpreadEntry = {
  /**
   * Discriminator selecting the spread rendering.
   */
  type: 'spread'
  /**
   * Expression spread into the object.
   */
  expression: ExpressionNode
}

/**
 * One member of an {@link ObjectExpressionNode}: a plain property, a getter, or a spread.
 */
export type ObjectExpressionProperty = ObjectPropertyEntry | ObjectGetterEntry | ObjectSpreadEntry

/**
 * AST node for an object literal, serialized with the shared `buildObject` formatter so the
 * output matches the existing string printers.
 */
export type ObjectExpressionNode = BaseNode & {
  kind: 'ObjectExpression'
  /**
   * Object members, rendered in order.
   */
  properties: Array<ObjectExpressionProperty>
}

/**
 * AST node for an array literal, serialized with the shared `buildList` formatter (single line
 * unless an element spans multiple lines).
 */
export type ArrayExpressionNode = BaseNode & {
  kind: 'ArrayExpression'
  /**
   * Array elements, rendered in order.
   */
  elements: Array<ExpressionNode>
}

/**
 * AST node for an arrow function expression, serialized as `(params) => body`.
 * Used for deferred values such as `z.lazy(() => Pet)`.
 */
export type ArrowExpressionNode = BaseNode & {
  kind: 'Arrow'
  /**
   * Pre-rendered parameter strings, joined with `, `.
   */
  params: Array<string>
  /**
   * Expression returned by the arrow.
   */
  body: ExpressionNode
  /**
   * Render the body as a single-line expression rather than a block. Defaults to single line.
   */
  singleLine?: boolean | null
}

/**
 * AST node for a spread element, serialized as `...expression`.
 */
export type SpreadNode = BaseNode & {
  kind: 'Spread'
  /**
   * Expression being spread.
   */
  expression: ExpressionNode
}

/**
 * AST node for a TypeScript `as` assertion, serialized as `expression as type`.
 *
 * @example
 * ```ts
 * createAs({ expression: createIdentifier({ name: 'undefined' }), type: 'any' })
 * // undefined as any
 * ```
 */
export type AsNode = BaseNode & {
  kind: 'As'
  /**
   * Expression being asserted.
   */
  expression: ExpressionNode
  /**
   * Target type written verbatim after `as`.
   */
  type: string
}

/**
 * AST node wrapping an already-rendered expression string. The transitional escape hatch that
 * lets existing string overrides flow through the expression IR during migration.
 */
export type RawExpressionNode = BaseNode & {
  kind: 'RawExpression'
  /**
   * Raw expression source, emitted verbatim.
   */
  value: string
}

/**
 * Union of every expression AST node. These build the value side of a declaration, e.g. the
 * `z.object({ … })` in `const petSchema = z.object({ … })`, replacing hand-built strings.
 */
export type ExpressionNode =
  | IdentifierNode
  | LiteralNode
  | MemberNode
  | CallNode
  | ObjectExpressionNode
  | ArrayExpressionNode
  | ArrowExpressionNode
  | SpreadNode
  | AsNode
  | RawExpressionNode

/**
 * Definition for the {@link IdentifierNode}.
 */
export const identifierDef = defineNode<IdentifierNode, Pick<IdentifierNode, 'name'>>({ kind: 'Identifier' })

/**
 * Definition for the {@link LiteralNode}.
 */
export const literalDef = defineNode<LiteralNode, Pick<LiteralNode, 'value'>>({ kind: 'Literal' })

/**
 * Definition for the {@link MemberNode}.
 */
export const memberDef = defineNode<MemberNode, Omit<MemberNode, 'kind'>>({ kind: 'Member' })

/**
 * Definition for the {@link CallNode}.
 */
export const callDef = defineNode<CallNode, Omit<CallNode, 'kind'>>({ kind: 'Call' })

/**
 * Definition for the {@link ObjectExpressionNode}.
 */
export const objectExpressionDef = defineNode<ObjectExpressionNode, Pick<ObjectExpressionNode, 'properties'>>({ kind: 'ObjectExpression' })

/**
 * Definition for the {@link ArrayExpressionNode}.
 */
export const arrayExpressionDef = defineNode<ArrayExpressionNode, Pick<ArrayExpressionNode, 'elements'>>({ kind: 'ArrayExpression' })

/**
 * Definition for the {@link ArrowExpressionNode}.
 */
export const arrowExpressionDef = defineNode<ArrowExpressionNode, Omit<ArrowExpressionNode, 'kind'>>({ kind: 'Arrow' })

/**
 * Definition for the {@link SpreadNode}.
 */
export const spreadDef = defineNode<SpreadNode, Pick<SpreadNode, 'expression'>>({ kind: 'Spread' })

/**
 * Definition for the {@link AsNode}.
 */
export const asDef = defineNode<AsNode, Omit<AsNode, 'kind'>>({ kind: 'As' })

/**
 * Definition for the {@link RawExpressionNode}.
 */
export const rawExpressionDef = defineNode<RawExpressionNode, string>({ kind: 'RawExpression', build: (value) => ({ value }) })

/**
 * Creates an {@link IdentifierNode}.
 *
 * @example
 * ```ts
 * createIdentifier({ name: 'z' })
 * // z
 * ```
 */
export const createIdentifier = identifierDef.create

/**
 * Creates a {@link LiteralNode}.
 *
 * @example
 * ```ts
 * createLiteral({ value: 'active' })
 * // 'active'
 * ```
 */
export const createLiteral = literalDef.create

/**
 * Creates a {@link MemberNode} representing an `object.property` access.
 */
export const createMember = memberDef.create

/**
 * Creates a {@link CallNode} representing a `callee(args)` call.
 */
export const createCall = callDef.create

/**
 * Creates an {@link ObjectExpressionNode} representing an object literal.
 */
export const createObject = objectExpressionDef.create

/**
 * Creates an {@link ArrayExpressionNode} representing an array literal.
 */
export const createArray = arrayExpressionDef.create

/**
 * Creates an {@link ArrowExpressionNode} representing a `(params) => body` arrow.
 */
export const createArrow = arrowExpressionDef.create

/**
 * Creates a {@link SpreadNode} representing a `...expression` spread.
 */
export const createSpread = spreadDef.create

/**
 * Creates an {@link AsNode} representing an `expression as type` assertion.
 */
export const createAs = asDef.create

/**
 * Creates a {@link RawExpressionNode} from an already-rendered expression string.
 *
 * @example
 * ```ts
 * createRaw('z.string().optional()')
 * // { kind: 'RawExpression', value: 'z.string().optional()' }
 * ```
 */
export const createRaw = rawExpressionDef.create

const expressionKinds: ReadonlySet<NodeKind> = new Set<NodeKind>([
  'Identifier',
  'Literal',
  'Member',
  'Call',
  'ObjectExpression',
  'ArrayExpression',
  'Arrow',
  'Spread',
  'As',
  'RawExpression',
])

/**
 * Type guard matching any {@link ExpressionNode}. Used by the parsers to route expression nodes
 * to the expression serializer.
 */
export function isExpressionNode(node: unknown): node is ExpressionNode {
  const kind = (node as BaseNode | undefined)?.kind
  return kind !== undefined && expressionKinds.has(kind)
}
