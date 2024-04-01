import { camelCase } from '@kubb/core/transformers'

import { isParameterObject } from './isParameterObject.ts'

import type { FunctionParamsAST } from '@kubb/core/utils'
import type { OasTypes } from '../oas/index.ts'
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
      type: typed ? `${operationSchema.name}["${camelCase(name)}"]` : undefined,
    }

    return override ? override(data) : data
  })
}
