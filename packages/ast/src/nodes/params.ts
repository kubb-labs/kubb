import { nodeKinds } from '../constants.ts'
import { type BaseNode, nodeFactory } from './base.ts'

/** A parameter type: a type reference string, an inline object type, or `Target['key']`. */
export type TypeExpression = string | TypeLiteralNode | IndexedAccessTypeNode

/** An inline object type, printed as `{ key: Type; other?: Other }`. */
export type TypeLiteralNode = BaseNode & {
  kind: 'TypeLiteral'
  members: Array<{ name: string; type: TypeExpression; optional?: boolean }>
}

/** One field of a named type, printed as `target['key']`. */
export type IndexedAccessTypeNode = BaseNode & {
  kind: 'IndexedAccessType'
  target: string
  key: string
}

/** A destructuring binding, printed as `{ id, name }`, or `{ petId: id }` when `propertyName` is set. */
export type ObjectBindingPatternNode = BaseNode & {
  kind: 'ObjectBindingPattern'
  elements: Array<{ name: string; propertyName?: string }>
}

/** One function parameter. A destructured group pairs an {@link ObjectBindingPatternNode} name with a {@link TypeLiteralNode} type. */
export type FunctionParameterNode = BaseNode & {
  kind: 'FunctionParameter'
  name: string | ObjectBindingPatternNode
  type?: TypeExpression
  optional?: boolean
  /** Written verbatim after `=`, such as `'{}'`. */
  default?: string
  rest?: boolean
}

/** A parameter list. Holds no syntax: `Function` in `@kubb/renderer-jsx` prints it for JavaScript. */
export type FunctionParametersNode = BaseNode & {
  kind: 'FunctionParameters'
  params: ReadonlyArray<FunctionParameterNode>
}

/** Creates a {@link TypeLiteralNode}. */
export const createTypeLiteral = nodeFactory<TypeLiteralNode>(nodeKinds.typeLiteral)

/** Creates an {@link IndexedAccessTypeNode}, such as `DeletePetPathParams['petId']`. */
export const createIndexedAccessType = nodeFactory<IndexedAccessTypeNode>(nodeKinds.indexedAccessType)

/** Creates an {@link ObjectBindingPatternNode}. */
export const createObjectBindingPattern = nodeFactory<ObjectBindingPatternNode>(nodeKinds.objectBindingPattern)

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
      kind: nodeKinds.functionParameter,
      name: createObjectBindingPattern({ elements: input.properties.map((p) => ({ name: p.name })) }),
      type: createTypeLiteral({ members: input.properties.map((p) => ({ name: p.name, type: p.type, optional: p.optional ?? false })) }),
      optional: input.optional ?? false,
      ...(input.default !== undefined ? { default: input.default } : {}),
    }
  }
  return { kind: nodeKinds.functionParameter, optional: false, ...input }
}

/** Creates a {@link FunctionParametersNode}, empty by default. */
export function createFunctionParameters(props: Partial<Omit<FunctionParametersNode, 'kind'>> = {}): FunctionParametersNode {
  return { kind: nodeKinds.functionParameters, params: [], ...props }
}
