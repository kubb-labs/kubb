import { nodeKinds } from '../constants.ts'
import { optionality } from '../optionality.ts'
import type { BaseNode } from './base.ts'
import type { ExampleNode } from './content.ts'
import type { SchemaNode } from './schema.ts'

/**
 * Where a parameter is sent. `querystring` carries the whole query string as one value, serialized per `contentType`.
 */
export type ParameterLocation = 'path' | 'query' | 'header' | 'cookie' | 'querystring'

/**
 * Parameter serialization style, controlling how a parameter value is rendered into the request.
 */
export type ParameterStyle = 'matrix' | 'label' | 'form' | 'simple' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject' | 'cookie'

/**
 * AST node representing one operation parameter.
 *
 * @example
 * ```ts
 * const param: ParameterNode = {
 *   kind: 'Parameter',
 *   name: 'petId',
 *   in: 'path',
 *   schema: createSchema({ type: 'string' }),
 *   required: true,
 * }
 * ```
 */
export type ParameterNode = BaseNode & {
  kind: 'Parameter'
  /**
   * Parameter name.
   */
  name: string
  /**
   * Parameter location (`path`, `query`, `header`, `cookie`, or `querystring`).
   */
  in: ParameterLocation
  /**
   * Parameter schema.
   */
  schema: SchemaNode
  /**
   * Whether the parameter is required.
   */
  required: boolean
  /**
   * Serialization style. Absent when the source omits it, leaving consumers to apply the
   * per-location default.
   */
  style?: ParameterStyle
  /**
   * Whether array and object values expand into separate values. Absent when the source omits it,
   * leaving consumers to apply the default for the style.
   */
  explode?: boolean
  /**
   * Whether reserved characters (RFC 3986 `:/?#[]@!$&'()*+,;=`) are sent as-is instead of
   * percent-encoded. Absent when the source omits it.
   */
  allowReserved?: boolean
  /**
   * Media type of a parameter described with `content` instead of `schema`, for example
   * `application/json` when the value is sent as a JSON-encoded string. Absent for `schema` parameters.
   */
  contentType?: string
  examples?: Array<ExampleNode>
  deprecated?: boolean
  allowEmptyValue?: boolean
}

type UserParameterNode = Pick<ParameterNode, 'name' | 'in' | 'schema'> & Partial<Omit<ParameterNode, 'kind' | 'name' | 'in' | 'schema'>>

/**
 * Creates a `ParameterNode`. `required` defaults to `false`, and the schema's
 * `optional`/`nullish` flags are derived from it.
 *
 * @example
 * ```ts
 * const param = createParameter({
 *   name: 'petId',
 *   in: 'path',
 *   required: true,
 *   schema: createSchema({ type: 'string' }),
 * })
 * ```
 */
export function createParameter(input: UserParameterNode): ParameterNode {
  const required = input.required ?? false

  return { ...input, required, schema: optionality(input.schema, required), kind: nodeKinds.parameter }
}
