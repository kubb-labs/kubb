import { createFunctionParams } from '@kubb/core'

import { isParameterObject } from './isParameterObject.ts'

import type { OperationSchema } from '../types.ts'

type FunctionParamsAST = Parameters<typeof createFunctionParams>[0][number]

export function getASTParams(
  operationSchema: OperationSchema | undefined,
  { typed = false, override }: { typed?: boolean; override?: (data: FunctionParamsAST) => FunctionParamsAST } = {},
): FunctionParamsAST[] {
  if (!operationSchema || !operationSchema.schema.properties || !operationSchema.name) {
    return []
  }
  return Object.entries(operationSchema.schema.properties).map(([name, schema]) => {
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
  { typed = false, override }: { typed?: boolean; override?: (data: FunctionParamsAST) => FunctionParamsAST } = {},
): GetParamsResult {
  const ast = getASTParams(operationSchema, { typed, override })
  const text = ast.length ? createFunctionParams(ast) : ''

  return {
    ast,
    toString: () => text,
  }
}
