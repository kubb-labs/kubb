import transformers from '@kubb/core/transformers'
import { FunctionParams } from '@kubb/core/utils'

import { isParameterObject } from './isParameterObject.ts'

import type { FunctionParamsAST } from '@kubb/core/utils'
import type { OasTypes } from '../oas/index.ts'
import type { OperationSchema } from '../types.ts'

type Options = {
  typed?: boolean
  object?: { suffix?: string } | true
  /**
   * @deprecated use object instead
   */
  asObject?: boolean
  override?: (data: FunctionParamsAST) => FunctionParamsAST
}

export function getASTParams(
  operationSchema: OperationSchema | undefined,
  { typed = false, override, object = undefined, asObject = false }: Options = {},
): FunctionParamsAST[] {
  if (!operationSchema || !operationSchema.schema.properties || !operationSchema.name) {
    return []
  }

  if (asObject || !!object) {
    const nameText = getASTParams(operationSchema)
      .map((item) => item.name ? transformers.camelCase(item.name) : item.name)
      .join(', ')

    return [
      {
        name: `{ ${[nameText, typeof object === 'object' ? object?.suffix : undefined].join(',')} }`,
        type: typed ? operationSchema?.name : undefined,
        enabled: !!operationSchema?.name,
        required: true,
      },
    ]
  }

  return Object.entries(operationSchema.schema.properties).map(([name, schema]: [string, OasTypes.SchemaObject]) => {
    const isParam = isParameterObject(schema)
    const data: FunctionParamsAST = { name, required: isParam ? schema.required : undefined, type: typed ? `${operationSchema.name}["${name}"]` : undefined }

    return override ? override(data) : data
  })
}

type GetParamsResult = {
  ast: FunctionParamsAST[]
  toString: () => string
}
// TODO convert to class together with `createFunctionParams` and `getASTParams`
export function getParams(
  operationSchema: OperationSchema | undefined,
  options: Options = {},
): GetParamsResult {
  const ast = getASTParams(operationSchema, options)
  const functionParams = new FunctionParams()
  functionParams.add(ast)

  return {
    ast,
    toString: () => functionParams.toString(),
  }
}
