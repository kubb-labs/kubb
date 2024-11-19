import { isParameterObject } from '@kubb/oas'

import { camelCase, isValidVarName } from '@kubb/core/transformers'
import type { FunctionParamsAST } from '@kubb/core/utils'
import type { OasTypes } from '@kubb/oas'
import type { Params } from '@kubb/react/types'
import type { OperationSchema } from '../types.ts'
/**
 *
 * @deprecated
 * TODO move to operationManager hook
 */
export function getASTParams(
  operationSchema: OperationSchema | undefined,
  {
    typed = false,
    override,
  }: {
    typed?: boolean
    override?: (data: FunctionParamsAST) => FunctionParamsAST
  } = {},
): FunctionParamsAST[] {
  if (!operationSchema || !operationSchema.schema.properties || !operationSchema.name) {
    return []
  }

  return Object.entries(operationSchema.schema.properties).map(([name, schema]: [string, OasTypes.SchemaObject]) => {
    const isParam = isParameterObject(schema)
    const data: FunctionParamsAST = {
      name,
      enabled: !!name,
      required: isParam ? schema.required : true,
      type: typed ? `${operationSchema.name}["${name}"]` : undefined,
    }

    return override ? override(data) : data
  })
}

export function getPathParams(
  operationSchema: OperationSchema | undefined,
  options: {
    typed?: boolean
    override?: (data: FunctionParamsAST) => FunctionParamsAST
  } = {},
) {
  return getASTParams(operationSchema, options).reduce((acc, curr) => {
    if (curr.name && curr.enabled) {
      const name = isValidVarName(curr.name) ? curr.name : camelCase(curr.name)
      acc[name] = {
        default: curr.default,
        type: curr.type,
        optional: !curr.required,
      }
    }

    return acc
  }, {} as Params)
}
