import { camelCase, isValidVarName } from '@internals/utils'

import { narrowSchema } from './guards.ts'
import type { ParameterNode, SchemaNode } from './nodes/index.ts'
import type { SchemaType } from './nodes/schema.ts'

const plainStringTypes = new Set<SchemaType>(['string', 'uuid', 'email', 'url', 'datetime'] as const)

/**
 * Returns `true` when a schema is emitted as a plain TypeScript `string`.
 *
 * - `string`, `uuid`, `email`, `url`, `datetime` are always plain strings.
 * - `date` and `time` are plain strings when their `representation` is `'string'` rather than `'date'`.
 *
 * @example
 * ```ts
 * isPlainStringType(createSchema({ type: 'uuid' })) // true
 * isPlainStringType(createSchema({ type: 'date', representation: 'date' })) // false
 * ```
 */
export function isPlainStringType(node: SchemaNode): boolean {
  if (plainStringTypes.has(node.type)) {
    return true
  }

  const temporal = narrowSchema(node, 'date') ?? narrowSchema(node, 'time')
  if (temporal) {
    return temporal.representation !== 'date'
  }

  return false
}

/**
 * Applies casing rules to parameter names and returns a new parameter array.
 *
 * The input array is not mutated.
 * If `casing` is not set, the original array is returned unchanged.
 *
 * Use this before passing parameters to schema builders so that property keys
 * in generated output match the desired casing while preserving
 * `OperationNode.parameters` for other consumers.
 *
 * @example
 * ```ts
 * const params = [createParameter({ name: 'pet_id', in: 'query', schema: createSchema({ type: 'string' }) })]
 * const cased = applyParamsCasing(params, 'camelcase')
 * // cased[0].name === 'petId'
 * ```
 */
export function applyParamsCasing(params: Array<ParameterNode>, casing: 'camelcase' | undefined): Array<ParameterNode> {
  if (!casing) {
    return params
  }

  return params.map((param) => {
    const transformed = casing === 'camelcase' || !isValidVarName(param.name) ? camelCase(param.name) : param.name

    return { ...param, name: transformed }
  })
}
