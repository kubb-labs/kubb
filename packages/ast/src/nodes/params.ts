/**
 * A type expression used as a function parameter type annotation.
 *
 * - a plain `string` is a type reference rendered as-is, e.g. `'string'`, `'QueryParams'`, `'Partial<Config>'`
 * - a {@link TypeLiteralNode} is an inline anonymous type, e.g. `{ petId: string; name?: string }`
 * - an {@link IndexedAccessTypeNode} is a single field accessed from a named type, e.g. `PathParams['petId']`
 */
export type TypeExpression = string | TypeLiteralNode | IndexedAccessTypeNode

/**
 * An inline anonymous object type grouping named fields.
 * Renders as `{ key: Type; other?: OtherType }`.
 */
export type TypeLiteralNode = {
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
 * A single field accessed from a named group type. Renders as `target['key']`.
 */
export type IndexedAccessTypeNode = {
  kind: 'IndexedAccessType'
  /**
   * Name of the type being indexed, e.g. `'GetPetPathParams'`.
   */
  target: string
  /**
   * Field key to access, e.g. `'petId'`.
   */
  key: string
}

/**
 * An object destructuring binding, used as the name of a grouped function parameter.
 * Renders as `{ id, name }` or `{ id: renamed }` when `propertyName` differs.
 */
export type ObjectBindingPatternNode = {
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
 * One function parameter.
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
export type FunctionParameterNode = {
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
 * A complete function parameter list.
 *
 * Printers are responsible for sorting (`required` → `optional` → `defaulted`).
 */
export type FunctionParametersNode = {
  kind: 'FunctionParameters'
  /**
   * Ordered parameter nodes.
   */
  params: ReadonlyArray<FunctionParameterNode>
}

/**
 * Narrows a {@link TypeExpression} to a {@link TypeLiteralNode}.
 */
export function isTypeLiteral(type: TypeExpression): type is TypeLiteralNode {
  return typeof type !== 'string' && type.kind === 'TypeLiteral'
}

/**
 * Narrows a {@link TypeExpression} to an {@link IndexedAccessTypeNode}.
 */
export function isIndexedAccessType(type: TypeExpression): type is IndexedAccessTypeNode {
  return typeof type !== 'string' && type.kind === 'IndexedAccessType'
}

/**
 * Creates a {@link TypeLiteralNode} representing an inline anonymous object type.
 *
 * @example
 * ```ts
 * createTypeLiteral({ members: [{ name: 'petId', type: 'string', optional: false }] })
 * // { petId: string }
 * ```
 */
export function createTypeLiteral(props: Omit<TypeLiteralNode, 'kind'>): TypeLiteralNode {
  return { kind: 'TypeLiteral', ...props }
}

/**
 * Creates an {@link IndexedAccessTypeNode} representing a single field accessed from a named type.
 *
 * @example
 * ```ts
 * createIndexedAccessType({ target: 'DeletePetPathParams', key: 'petId' })
 * // DeletePetPathParams['petId']
 * ```
 */
export function createIndexedAccessType(props: Omit<IndexedAccessTypeNode, 'kind'>): IndexedAccessTypeNode {
  return { kind: 'IndexedAccessType', ...props }
}

/**
 * Creates an {@link ObjectBindingPatternNode} for a destructured parameter binding.
 *
 * @example
 * ```ts
 * createObjectBindingPattern({ elements: [{ name: 'id' }, { name: 'name' }] })
 * // { id, name }
 * ```
 */
export function createObjectBindingPattern(props: Omit<ObjectBindingPatternNode, 'kind'>): ObjectBindingPatternNode {
  return { kind: 'ObjectBindingPattern', ...props }
}

/**
 * Plain property descriptor for a destructured group built by {@link createFunctionParameter}.
 */
type FunctionParameterProperty = {
  name: string
  type: TypeExpression
  optional?: boolean
}

type FunctionParameterInput =
  | { name: string | ObjectBindingPatternNode; type?: TypeExpression; optional?: boolean; default?: string; rest?: boolean }
  | { properties: Array<FunctionParameterProperty>; optional?: boolean; default?: string }

/**
 * Creates a {@link FunctionParameterNode}. `optional` defaults to `false`.
 * Passing `properties` builds a destructured group: an {@link ObjectBindingPatternNode} name
 * paired with a {@link TypeLiteralNode} type.
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
export function createFunctionParameter(input: FunctionParameterInput): FunctionParameterNode {
  if ('properties' in input) {
    return {
      kind: 'FunctionParameter',
      name: createObjectBindingPattern({ elements: input.properties.map((p) => ({ name: p.name })) }),
      type: createTypeLiteral({ members: input.properties.map((p) => ({ name: p.name, type: p.type, optional: p.optional ?? false })) }),
      optional: input.optional ?? false,
      ...(input.default !== undefined ? { default: input.default } : {}),
    }
  }
  return { kind: 'FunctionParameter', optional: false, ...input }
}

/**
 * Creates a {@link FunctionParametersNode} from an ordered list of parameters.
 *
 * @example
 * ```ts
 * const empty = createFunctionParameters()
 * // { params: [] }
 * ```
 */
export function createFunctionParameters(props: Partial<Omit<FunctionParametersNode, 'kind'>> = {}): FunctionParametersNode {
  return { kind: 'FunctionParameters', params: [], ...props }
}
