/** A parameter type: a type reference string, an inline object type, or `Target['key']`. */
export type TypeExpression = string | TypeLiteralNode | IndexedAccessTypeNode

/** An inline object type, printed as `{ key: Type; other?: Other }`. */
export type TypeLiteralNode = {
  kind: 'TypeLiteral'
  members: Array<{ name: string; type: TypeExpression; optional?: boolean }>
}

/** One field of a named type, printed as `target['key']`. */
export type IndexedAccessTypeNode = {
  kind: 'IndexedAccessType'
  target: string
  key: string
}

/** A destructuring binding, printed as `{ id, name }`, or `{ petId: id }` when `propertyName` is set. */
export type ObjectBindingPatternNode = {
  kind: 'ObjectBindingPattern'
  elements: Array<{ name: string; propertyName?: string }>
}

/** One function parameter. A destructured group pairs an {@link ObjectBindingPatternNode} name with a {@link TypeLiteralNode} type. */
export type FunctionParameterNode = {
  kind: 'FunctionParameter'
  name: string | ObjectBindingPatternNode
  type?: TypeExpression
  optional?: boolean
  /** Written verbatim after `=`, such as `'{}'`. */
  default?: string
  rest?: boolean
}

/** A parameter list. `ast.params.print` sorts it required, optional, defaulted, then rest. */
export type FunctionParametersNode = {
  kind: 'FunctionParameters'
  params: ReadonlyArray<FunctionParameterNode>
}

/** Narrows a {@link TypeExpression} to a {@link TypeLiteralNode}. */
export function isTypeLiteral(type: TypeExpression): type is TypeLiteralNode {
  return typeof type !== 'string' && type.kind === 'TypeLiteral'
}

/** Narrows a {@link TypeExpression} to an {@link IndexedAccessTypeNode}. */
export function isIndexedAccessType(type: TypeExpression): type is IndexedAccessTypeNode {
  return typeof type !== 'string' && type.kind === 'IndexedAccessType'
}

/** Creates a {@link TypeLiteralNode}. */
export function createTypeLiteral(props: Omit<TypeLiteralNode, 'kind'>): TypeLiteralNode {
  return { kind: 'TypeLiteral', ...props }
}

/** Creates an {@link IndexedAccessTypeNode}, such as `DeletePetPathParams['petId']`. */
export function createIndexedAccessType(props: Omit<IndexedAccessTypeNode, 'kind'>): IndexedAccessTypeNode {
  return { kind: 'IndexedAccessType', ...props }
}

/** Creates an {@link ObjectBindingPatternNode}. */
export function createObjectBindingPattern(props: Omit<ObjectBindingPatternNode, 'kind'>): ObjectBindingPatternNode {
  return { kind: 'ObjectBindingPattern', ...props }
}

type FunctionParameterProperty = {
  name: string
  type: TypeExpression
  optional?: boolean
}

type FunctionParameterInput =
  | { name: string | ObjectBindingPatternNode; type?: TypeExpression; optional?: boolean; default?: string; rest?: boolean }
  | { properties: Array<FunctionParameterProperty>; optional?: boolean; default?: string }

/**
 * Creates a {@link FunctionParameterNode}. `properties` builds a destructured group.
 *
 * @example
 * ```ts
 * createFunctionParameter({ name: 'params', type: 'QueryParams', optional: true }) // params?: QueryParams
 * createFunctionParameter({ properties: [{ name: 'id', type: 'string' }], default: '{}' }) // { id }: { id: string } = {}
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

/** Creates a {@link FunctionParametersNode}, empty by default. */
export function createFunctionParameters(props: Partial<Omit<FunctionParametersNode, 'kind'>> = {}): FunctionParametersNode {
  return { kind: 'FunctionParameters', params: [], ...props }
}
