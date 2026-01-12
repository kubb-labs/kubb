import { camelCase, isValidVarName } from '@kubb/core/transformers'
import type { FunctionParamsAST } from '@kubb/core/utils'
import type { OasTypes } from '@kubb/oas'
import type { Params } from '@kubb/react-fabric/types'
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

  const requiredFields = Array.isArray(operationSchema.schema.required) ? operationSchema.schema.required : []

  return Object.entries(operationSchema.schema.properties).map(([name]: [string, OasTypes.SchemaObject]) => {
    const data: FunctionParamsAST = {
      name,
      enabled: !!name,
      required: requiredFields.includes(name),
      type: typed ? `${operationSchema.name}["${name}"]` : undefined,
    }

    return override ? override(data) : data
  })
}

export function getPathParams(
  operationSchema: OperationSchema | undefined,
  options: {
    typed?: boolean
    casing?: 'camelcase'
    override?: (data: FunctionParamsAST) => FunctionParamsAST
  } = {},
) {
  return getASTParams(operationSchema, options).reduce((acc, curr) => {
    if (curr.name && curr.enabled) {
      let name = isValidVarName(curr.name) ? curr.name : camelCase(curr.name)

      if (options.casing === 'camelcase') {
        name = camelCase(name)
      }

      acc[name] = {
        default: curr.default,
        type: curr.type,
        optional: !curr.required,
      }
    }

    return acc
  }, {} as Params)
}
