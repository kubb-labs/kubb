import transformers from '@kubb/core/transformers'
import { FunctionParams } from '@kubb/core/utils'

import { isParameterObject } from './isParameterObject.ts'

import type { FunctionParamsAST } from '@kubb/core/utils'
import type { OasTypes } from '../oas/index.ts'
import type { OperationSchema } from '../types.ts'

export function getASTParams(
  operationSchema: OperationSchema | undefined,
  { type, typed = false, override, asObject = false }: {
    type?: string
    typed?: boolean
    asObject?: boolean
    override?: (data: FunctionParamsAST) => FunctionParamsAST
  } = {},
): FunctionParamsAST[] {
  if (!operationSchema || !operationSchema.schema.properties || !operationSchema.name) {
    return []
  }

  if (asObject) {
    const nameText = getASTParams(operationSchema)
      .map((item) => item.name ? transformers.camelCase(item.name) : item.name)
      .join(', ')

    return [
      {
        name: `{ ${nameText} }`,
        type: type || operationSchema?.name,
        enabled: !!operationSchema?.name,
        required: true,
      },
    ]
  }

  return Object.entries(operationSchema.schema.properties).map(([name, schema]: [string, OasTypes.SchemaObject]) => {
    const isParam = isParameterObject(schema)
    const data: FunctionParamsAST = {
      name,
      required: isParam ? schema.required : undefined,
      type: typed ? `${type || operationSchema.name}["${name}"]` : undefined,
    }

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
  { typed = false, override, asObject = false }: { typed?: boolean; asObject?: boolean; override?: (data: FunctionParamsAST) => FunctionParamsAST } = {},
): GetParamsResult {
  const ast = getASTParams(operationSchema, { typed, override, asObject })
  const functionParams = new FunctionParams()
  functionParams.add(ast)

  return {
    ast,
    toString: () => functionParams.toString(),
  }
}
