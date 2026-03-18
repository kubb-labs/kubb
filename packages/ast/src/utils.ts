import { camelCase, isValidVarName } from '@internals/utils'

import { narrowSchema } from './guards.ts'
import type { ParameterNode, SchemaNode } from './nodes/index.ts'
import type { SchemaType } from './nodes/schema.ts'

const plainStringTypes = new Set<SchemaType>(['string', 'uuid', 'email', 'url', 'datetime'])

/**
 * Returns `true` when a schema node will be represented as a plain string in generated code.
 *
 * - `string`, `uuid`, `email`, `url`, `datetime` are always plain strings.
 * - `date` and `time` are plain strings when their `representation` is `'string'` rather than `'date'`.
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
 * Transforms the `name` field of each parameter node according to the given casing strategy.
 *
 * The original `params` array is never mutated — a new array of cloned nodes is returned.
 * When no `casing` is provided the original array is returned as-is.
 *
 * Use this before passing parameters to schema builders so that property keys
 * in the generated output match the desired casing while the original
 * `OperationNode.parameters` array remains untouched for other consumers.
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
