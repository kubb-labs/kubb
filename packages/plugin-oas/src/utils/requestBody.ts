import type { OasTypes } from '@kubb/oas'
import type { OperationSchema } from '../types.ts'

function getRequestBody(operationSchema: OperationSchema | undefined): OasTypes.RequestBodyObject | undefined {
  const requestBody = operationSchema?.operation?.schema?.requestBody

  if (!requestBody || '$ref' in requestBody) {
    return undefined
  }

  return requestBody
}

export function isRequestBodyRequired(operationSchema: OperationSchema | undefined): boolean {
  const requestBody = getRequestBody(operationSchema)

  return !!requestBody && requestBody.required === true
}

export function withRequiredRequestBodySchema(operationSchema: OperationSchema | undefined): OperationSchema | undefined {
  if (!operationSchema || !isRequestBodyRequired(operationSchema)) {
    return operationSchema
  }

  if (Array.isArray(operationSchema.schema.required) && operationSchema.schema.required.length > 0) {
    return operationSchema
  }

  return {
    ...operationSchema,
    schema: {
      ...operationSchema.schema,
      required: ['__kubb_required_request_body__'],
    },
  }
}
