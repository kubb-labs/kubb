import { defineNode } from '../node.ts'
import type { BaseNode } from './base.ts'

/**
 * A language-agnostic type expression used as a function parameter type annotation.
 *
 * - a plain `string` is a type reference rendered as-is, e.g. `'string'`, `'QueryParams'`, `'Partial<Config>'`
 * - a {@link TypeLiteralNode} is an inline anonymous type, e.g. `{ petId: string; name?: string }`
 * - an {@link IndexedAccessTypeNode} is a single field accessed from a named type, e.g. `PathParams['petId']`
 */
export type TypeExpression = string | TypeLiteralNode | IndexedAccessTypeNode

/**
 * AST node for an inline anonymous object type grouping named fields.
 * TypeScript renders as `{ key: Type; other?: OtherType }`.
 *
 * @example
 * ```ts
 * createTypeLiteral({ members: [{ name: 'petId', type: 'string', optional: false }] })
 * // { petId: string }
 * ```
 */
export type TypeLiteralNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'TypeLiteral'
  /**
   * Members of the object type, rendered in order.
   */
  members: Array<{
    /**
     * Member key.
     */
    name: string
    /**
     * Member type expression.
     */
    type: TypeExpression
    /**
     * Whether the member is optional, rendered with `?`.
     */
    optional?: boolean
  }>
}

/**
 * AST node for a single field accessed from a named group type.
 * TypeScript renders as `objectType['indexType']`.
 *
 * @example
 * ```ts
 * createIndexedAccessType({ objectType: 'GetPetPathParams', indexType: 'petId' })
 * // GetPetPathParams['petId']
 * ```
 */
export type IndexedAccessTypeNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'IndexedAccessType'
  /**
   * Name of the type being indexed, e.g. `'GetPetPathParams'`.
   */
  objectType: string
  /**
   * Field key to access, e.g. `'petId'`.
   */
  indexType: string
}

/**
 * AST node for an object destructuring binding, used as the name of a grouped function parameter.
 * TypeScript renders as `{ id, name }` or `{ id: renamed }` when `propertyName` differs.
 *
 * @example
 * ```ts
 * createObjectBindingPattern({ elements: [{ name: 'id' }, { name: 'name' }] })
 * // { id, name }
 * ```
 */
export type ObjectBindingPatternNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'ObjectBindingPattern'
  /**
   * Bound elements, rendered in order.
   */
  elements: Array<{
    /**
     * Local binding name.
     */
    name: string
    /**
     * Source key when it differs from the binding name, rendered as `propertyName: name`.
     */
    propertyName?: string
  }>
}

/**
 * AST node for one function parameter.
 *
 * A simple parameter has a `string` name. A destructured group has an
 * {@link ObjectBindingPatternNode} name paired with a {@link TypeLiteralNode} type.
 *
 * @example Required parameter
 * `name: Type`
 *
 * @example Optional parameter
 * `name?: Type`
 *
 * @example Parameter with default value
 * `name: Type = defaultValue`
 *
 * @example Rest parameter
 * `...name: Type[]`
 *
 * @example Destructured group
 * `{ id, name? }: { id: string; name?: string } = {}`
 */
export type FunctionParameterNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'FunctionParameter'
  /**
   * Parameter name, or an {@link ObjectBindingPatternNode} for a destructured group.
   */
  name: string | ObjectBindingPatternNode
  /**
   * Type annotation as a {@link TypeExpression}. Omit for untyped output.
   */
  type?: TypeExpression
  /**
   * Whether the parameter is optional, rendered with `?`.
   */
  optional?: boolean
  /**
   * Default value, written verbatim after `=`. Commonly `'{}'` for a destructured group.
   */
  default?: string
  /**
   * When `true` the parameter is emitted as a rest parameter, e.g. `...name: Type[]`.
   */
  rest?: boolean
}

/**
 * AST node for a complete function parameter list.
 *
 * Printers are responsible for sorting (`required` → `optional` → `defaulted`).
 * Nodes are plain immutable data.
 *
 * Renders differently depending on the output mode:
 * - `declaration` → `(id: string, config: Config = {})` function declaration parameters
 * - `call`        → `(id, { method, url })` function call arguments
 */
export type FunctionParametersNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'FunctionParameters'
  /**
   * Ordered parameter nodes.
   */
  params: ReadonlyArray<FunctionParameterNode>
}

/**
 * Union of all function-parameter AST node variants used by the function-parameter printer.
 */
export type FunctionParamNode = FunctionParameterNode | FunctionParametersNode | TypeLiteralNode | IndexedAccessTypeNode | ObjectBindingPatternNode

/**
 * Handler map keys, one per `FunctionParamNode` kind.
 */
export type FunctionNodeType = 'functionParameter' | 'functionParameters' | 'typeLiteral' | 'indexedAccessType' | 'objectBindingPattern'

/**
 * Definition for the {@link TypeLiteralNode}.
 */
export const typeLiteralDef = defineNode<TypeLiteralNode, Pick<TypeLiteralNode, 'members'>>({ kind: 'TypeLiteral' })

/**
 * Creates a {@link TypeLiteralNode} representing an inline anonymous object type.
 *
 * @example
 * ```ts
 * createTypeLiteral({ members: [{ name: 'petId', type: 'string', optional: false }] })
 * // { petId: string }
 * ```
 */
export const createTypeLiteral = typeLiteralDef.create

/**
 * Definition for the {@link IndexedAccessTypeNode}.
 */
export const indexedAccessTypeDef = defineNode<IndexedAccessTypeNode, Omit<IndexedAccessTypeNode, 'kind'>>({ kind: 'IndexedAccessType' })

/**
 * Creates an {@link IndexedAccessTypeNode} representing a single field accessed from a named type.
 *
 * @example
 * ```ts
 * createIndexedAccessType({ objectType: 'DeletePetPathParams', indexType: 'petId' })
 * // DeletePetPathParams['petId']
 * ```
 */
export const createIndexedAccessType = indexedAccessTypeDef.create

/**
 * Definition for the {@link ObjectBindingPatternNode}.
 */
export const objectBindingPatternDef = defineNode<ObjectBindingPatternNode, Pick<ObjectBindingPatternNode, 'elements'>>({ kind: 'ObjectBindingPattern' })

/**
 * Creates an {@link ObjectBindingPatternNode} for a destructured parameter binding.
 *
 * @example
 * ```ts
 * createObjectBindingPattern({ elements: [{ name: 'id' }, { name: 'name' }] })
 * // { id, name }
 * ```
 */
export const createObjectBindingPattern = objectBindingPatternDef.create

/**
 * Plain property descriptor for a destructured group built by {@link createFunctionParameter}.
 */
type FunctionParameterProperty = {
  name: string
  type: TypeExpression
  optional?: boolean
}

type FunctionParameterInput =
  | { name: string; type?: TypeExpression; optional?: boolean; default?: string; rest?: boolean }
  | { properties: Array<FunctionParameterProperty>; optional?: boolean; default?: string }

/**
 * Definition for the {@link FunctionParameterNode}. `optional` defaults to `false`.
 * Passing `properties` builds a destructured group: an {@link ObjectBindingPatternNode} name
 * paired with a {@link TypeLiteralNode} type.
 */
export const functionParameterDef = defineNode<FunctionParameterNode, FunctionParameterInput>({
  kind: 'FunctionParameter',
  build: (input) => {
    if ('properties' in input) {
      return {
        name: createObjectBindingPattern({ elements: input.properties.map((p) => ({ name: p.name })) }),
        type: createTypeLiteral({ members: input.properties.map((p) => ({ name: p.name, type: p.type, optional: p.optional ?? false })) }),
        optional: input.optional ?? false,
        ...(input.default !== undefined ? { default: input.default } : {}),
      }
    }
    return { optional: false, ...input }
  },
})

/**
 * Creates a `FunctionParameterNode`. `optional` defaults to `false`.
 *
 * @example Optional param
 * ```ts
 * createFunctionParameter({ name: 'params', type: 'QueryParams', optional: true })
 * // → params?: QueryParams
 * ```
 *
 * @example Destructured group
 * ```ts
 * createFunctionParameter({ properties: [{ name: 'id', type: 'string' }, { name: 'name', type: 'string', optional: true }], default: '{}' })
 * // → { id, name }: { id: string; name?: string } = {}
 * ```
 */
export const createFunctionParameter = functionParameterDef.create

/**
 * Definition for the {@link FunctionParametersNode}.
 */
export const functionParametersDef = defineNode<FunctionParametersNode, Partial<Omit<FunctionParametersNode, 'kind'>>>({
  kind: 'FunctionParameters',
  defaults: { params: [] },
})

/**
 * Creates a `FunctionParametersNode` from an ordered list of parameters.
 *
 * @example
 * ```ts
 * const empty = createFunctionParameters()
 * // { kind: 'FunctionParameters', params: [] }
 * ```
 */
export function createFunctionParameters(props: Partial<Omit<FunctionParametersNode, 'kind'>> = {}): FunctionParametersNode {
  return functionParametersDef.create(props)
}
