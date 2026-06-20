import { defineNode } from '../defineNode.ts'
import type { BaseNode, NodeKind } from './base.ts'

/**
 * Keyword type names with a direct TypeScript equivalent. `integer` prints as `number`,
 * matching the existing keyword node table.
 */
export type TypeKeywordName = 'any' | 'unknown' | 'void' | 'number' | 'integer' | 'bigint' | 'object' | 'string' | 'boolean' | 'undefined' | 'null' | 'never'

/**
 * AST node for a TypeScript keyword type such as `string`, `number`, or `null`.
 */
export type TypeKeywordNode = BaseNode & {
  kind: 'TypeKeyword'
  /**
   * Keyword to render.
   */
  keyword: TypeKeywordName
}

/**
 * AST node for a named type reference, optionally generic, e.g. `Pet` or `Array<string>`.
 */
export type TypeReferenceNode = BaseNode & {
  kind: 'TypeReference'
  /**
   * Referenced type name.
   */
  name: string
  /**
   * Type arguments rendered inside `<…>`.
   */
  typeArgs?: Array<TypeIRNode>
}

/**
 * AST node for a literal type, e.g. `'active'`, `42`, or `true`. `format` selects how the value
 * is rendered, mirroring the existing `constToTypeNode` helper.
 */
export type TypeLiteralTypeNode = BaseNode & {
  kind: 'TypeLiteralType'
  /**
   * Literal value.
   */
  value: string | number | boolean
  /**
   * How to render the value: as a string, number, or boolean literal.
   */
  format: 'string' | 'number' | 'boolean'
}

/**
 * AST node for an array type. `arrayType` selects `T[]` (`'array'`) or `Array<T>` (`'generic'`).
 * Multiple `elements` form a union member type, parenthesized for the `T[]` form.
 */
export type TypeArrayNode = BaseNode & {
  kind: 'TypeArray'
  /**
   * Element type(s). More than one becomes a union inside the array.
   */
  elements: Array<TypeIRNode>
  /**
   * Bracket syntax (`T[]`) or generic syntax (`Array<T>`). Defaults to bracket syntax.
   */
  arrayType?: 'array' | 'generic'
}

/**
 * AST node for a union type, e.g. `string | number`. `withParentheses` wraps the result for use
 * inside another type.
 */
export type TypeUnionNode = BaseNode & {
  kind: 'TypeUnion'
  /**
   * Union members.
   */
  members: Array<TypeIRNode>
  /**
   * Wrap the union in parentheses.
   */
  withParentheses?: boolean
}

/**
 * AST node for an intersection type, e.g. `A & B`. `withParentheses` wraps the result for use
 * inside another type.
 */
export type TypeIntersectionNode = BaseNode & {
  kind: 'TypeIntersection'
  /**
   * Intersection members.
   */
  members: Array<TypeIRNode>
  /**
   * Wrap the intersection in parentheses.
   */
  withParentheses?: boolean
}

/**
 * AST node for a tuple type, e.g. `[string, number?]`. `min`/`max` mark trailing elements
 * optional and slice the fixed part; `rest` adds a variadic tail.
 */
export type TypeTupleNode = BaseNode & {
  kind: 'TypeTuple'
  /**
   * Fixed tuple element types, in order.
   */
  items: Array<TypeIRNode>
  /**
   * Index from which trailing elements are marked optional.
   */
  min?: number
  /**
   * Upper bound on the fixed element count. Pads with `rest` when items fall short.
   */
  max?: number
  /**
   * Variadic tail element type.
   */
  rest?: TypeIRNode
}

/**
 * A member of a {@link TypeObjectNode}, rendered as a property signature.
 */
export type TypeMember = {
  /**
   * Member name.
   */
  name: string
  /**
   * Member type.
   */
  type: TypeIRNode
  /**
   * Mark the member optional with `?`.
   */
  optional?: boolean
  /**
   * Prefix the member with `readonly`.
   */
  readOnly?: boolean
  /**
   * JSDoc comment lines attached to the member.
   */
  jsDoc?: Array<string | undefined>
}

/**
 * An index signature of a {@link TypeObjectNode}, e.g. `[key: string]: unknown`.
 */
export type TypeIndexSignature = {
  /**
   * Value type of the signature.
   */
  type: TypeIRNode
  /**
   * Key parameter name. Defaults to `key`.
   */
  keyName?: string
  /**
   * Key type. Defaults to `string`.
   */
  keyType?: TypeIRNode
}

/**
 * AST node for an object type literal with named members and optional index signatures.
 */
export type TypeObjectNode = BaseNode & {
  kind: 'TypeObject'
  /**
   * Named members, rendered in order.
   */
  members: Array<TypeMember>
  /**
   * Index signatures appended after the members.
   */
  indexSignatures?: Array<TypeIndexSignature>
}

/**
 * AST node for a template literal type built from an OpenAPI/Express path, e.g. `` `/pets/${string}` ``.
 */
export type TypeUrlTemplateNode = BaseNode & {
  kind: 'TypeUrlTemplate'
  /**
   * Path template, e.g. `/pets/{petId}` or `/pets/:petId`.
   */
  path: string
}

/**
 * AST node for an `Omit<T, Keys>` type, optionally wrapping `T` in `NonNullable<T>`.
 */
export type TypeOmitNode = BaseNode & {
  kind: 'TypeOmit'
  /**
   * Source type the keys are removed from.
   */
  type: TypeIRNode
  /**
   * Key or keys to omit.
   */
  keys: Array<string> | string
  /**
   * Wrap the source type in `NonNullable<T>` before omitting.
   */
  nonNullable?: boolean
}

/**
 * Union of every type-expression AST node. These describe TypeScript types structurally so the
 * parser can serialize them, replacing the hand-built `ts.Node` shapes.
 */
export type TypeIRNode =
  | TypeKeywordNode
  | TypeReferenceNode
  | TypeLiteralTypeNode
  | TypeArrayNode
  | TypeUnionNode
  | TypeIntersectionNode
  | TypeTupleNode
  | TypeObjectNode
  | TypeUrlTemplateNode
  | TypeOmitNode

/**
 * Definition for the {@link TypeKeywordNode}.
 */
export const typeKeywordDef = defineNode<TypeKeywordNode, Pick<TypeKeywordNode, 'keyword'>>({ kind: 'TypeKeyword' })

/**
 * Definition for the {@link TypeReferenceNode}.
 */
export const typeReferenceDef = defineNode<TypeReferenceNode, Omit<TypeReferenceNode, 'kind'>>({ kind: 'TypeReference' })

/**
 * Definition for the {@link TypeLiteralTypeNode}.
 */
export const typeLiteralTypeDef = defineNode<TypeLiteralTypeNode, Omit<TypeLiteralTypeNode, 'kind'>>({ kind: 'TypeLiteralType' })

/**
 * Definition for the {@link TypeArrayNode}.
 */
export const typeArrayDef = defineNode<TypeArrayNode, Omit<TypeArrayNode, 'kind'>>({ kind: 'TypeArray' })

/**
 * Definition for the {@link TypeUnionNode}.
 */
export const typeUnionDef = defineNode<TypeUnionNode, Omit<TypeUnionNode, 'kind'>>({ kind: 'TypeUnion' })

/**
 * Definition for the {@link TypeIntersectionNode}.
 */
export const typeIntersectionDef = defineNode<TypeIntersectionNode, Omit<TypeIntersectionNode, 'kind'>>({ kind: 'TypeIntersection' })

/**
 * Definition for the {@link TypeTupleNode}.
 */
export const typeTupleDef = defineNode<TypeTupleNode, Omit<TypeTupleNode, 'kind'>>({ kind: 'TypeTuple' })

/**
 * Definition for the {@link TypeObjectNode}.
 */
export const typeObjectDef = defineNode<TypeObjectNode, Omit<TypeObjectNode, 'kind'>>({ kind: 'TypeObject' })

/**
 * Definition for the {@link TypeUrlTemplateNode}.
 */
export const typeUrlTemplateDef = defineNode<TypeUrlTemplateNode, Pick<TypeUrlTemplateNode, 'path'>>({ kind: 'TypeUrlTemplate' })

/**
 * Definition for the {@link TypeOmitNode}.
 */
export const typeOmitDef = defineNode<TypeOmitNode, Omit<TypeOmitNode, 'kind'>>({ kind: 'TypeOmit' })

/**
 * Creates a {@link TypeKeywordNode}.
 *
 * @example
 * ```ts
 * createTypeKeyword({ keyword: 'string' })
 * // string
 * ```
 */
export const createTypeKeyword = typeKeywordDef.create

/**
 * Creates a {@link TypeReferenceNode}.
 *
 * @example
 * ```ts
 * createTypeReference({ name: 'Array', typeArgs: [createTypeKeyword({ keyword: 'string' })] })
 * // Array<string>
 * ```
 */
export const createTypeReference = typeReferenceDef.create

/**
 * Creates a {@link TypeLiteralTypeNode}.
 */
export const createTypeLiteralType = typeLiteralTypeDef.create

/**
 * Creates a {@link TypeArrayNode}.
 */
export const createTypeArray = typeArrayDef.create

/**
 * Creates a {@link TypeUnionNode}.
 */
export const createTypeUnion = typeUnionDef.create

/**
 * Creates a {@link TypeIntersectionNode}.
 */
export const createTypeIntersection = typeIntersectionDef.create

/**
 * Creates a {@link TypeTupleNode}.
 */
export const createTypeTuple = typeTupleDef.create

/**
 * Creates a {@link TypeObjectNode}.
 */
export const createTypeObject = typeObjectDef.create

/**
 * Creates a {@link TypeUrlTemplateNode}.
 */
export const createTypeUrlTemplate = typeUrlTemplateDef.create

/**
 * Creates a {@link TypeOmitNode}.
 */
export const createTypeOmit = typeOmitDef.create

const typeKinds: ReadonlySet<NodeKind> = new Set<NodeKind>([
  'TypeKeyword',
  'TypeReference',
  'TypeLiteralType',
  'TypeArray',
  'TypeUnion',
  'TypeIntersection',
  'TypeTuple',
  'TypeObject',
  'TypeUrlTemplate',
  'TypeOmit',
])

/**
 * Type guard matching any {@link TypeIRNode}.
 */
export function isTypeIRNode(node: unknown): node is TypeIRNode {
  const kind = (node as BaseNode | undefined)?.kind
  return kind !== undefined && typeKinds.has(kind)
}
