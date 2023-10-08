import { createFunctionParams } from '@kubb/core'

import type { OperationSchema } from '../types.ts'
import { isParameterObject } from './isParameterObject'

type FunctionParamsAst = Parameters<typeof createFunctionParams>[0][number]

export function getDataParams(
  operationSchema: OperationSchema | undefined,
  { typed = false, override }: { typed?: boolean; override?: (data: FunctionParamsAst) => FunctionParamsAst } = {},
): FunctionParamsAst[] {
  if (!operationSchema || !operationSchema.schema.properties || !operationSchema.name) {
    return []
  }
  return Object.entries(operationSchema.schema.properties).map(([name, schema]) => {
    const isParam = isParameterObject(schema)
    const data: FunctionParamsAst = { name, required: isParam ? schema.required : undefined, type: typed ? `${operationSchema.name}["${name}"]` : undefined }

    return override ? override(data) : data
  })
}

export function getParams(
  operationSchema: OperationSchema | undefined,
  { typed = false, override }: { typed?: boolean; override?: (data: FunctionParamsAst) => FunctionParamsAst } = {},
): string {
  const data = getDataParams(operationSchema, { typed, override })

  if (!data?.length) {
    return ''
  }

  return createFunctionParams(data)
}
