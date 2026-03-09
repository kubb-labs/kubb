import type { OasTypes } from '@kubb/oas'
import type { OperationSchema } from '../types.ts'

/**
 * Sentinel value injected into `schema.required` to signal that the request body is required.
 * Downstream generators check for this marker to emit the correct required constraint.
 */
export const KUBB_REQUIRED_REQUEST_BODY_MARKER = '__kubb_required_request_body__'

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
      required: [KUBB_REQUIRED_REQUEST_BODY_MARKER],
    },
  }
}
