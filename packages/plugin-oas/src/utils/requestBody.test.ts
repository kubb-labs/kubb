import type { OasTypes } from '@kubb/oas'
import { describe, expect, test } from 'vitest'
import type { OperationSchema } from '../types.ts'
import { isRequestBodyRequired, withRequiredRequestBodySchema } from './requestBody.ts'

function createOperationSchema({
  requestBody,
  required = [],
}: {
  requestBody?: OasTypes.RequestBodyObject | { $ref: string }
  required?: string[]
}): OperationSchema {
  return {
    name: 'CreateOrderMutationRequest',
    operationName: 'CreateOrder',
    operation: {
      schema: {
        requestBody,
      },
    } as any,
    schema: {
      type: 'object',
      properties: {
        foo: {
          type: 'string',
        },
      },
      required,
    },
  } as unknown as OperationSchema
}

describe('requestBody utils', () => {
  test('isRequestBodyRequired returns false when operation schema is missing', () => {
    expect(isRequestBodyRequired(undefined)).toBe(false)
  })

  test('isRequestBodyRequired returns false for $ref requestBody', () => {
    const operationSchema = createOperationSchema({
      requestBody: {
        $ref: '#/components/requestBodies/CreateOrder',
      },
    })

    expect(isRequestBodyRequired(operationSchema)).toBe(false)
  })

  test('isRequestBodyRequired returns true when requestBody.required is true', () => {
    const operationSchema = createOperationSchema({
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        },
        required: true,
      },
    })

    expect(isRequestBodyRequired(operationSchema)).toBe(true)
  })

  test('withRequiredRequestBodySchema adds sentinel required marker when requestBody is required', () => {
    const operationSchema = createOperationSchema({
      requestBody: {
        content: {
          'application/json': {
            schema: {
              oneOf: [{ type: 'object' }, { type: 'object' }],
            },
          },
        },
        required: true,
      },
      required: [],
    })

    const result = withRequiredRequestBodySchema(operationSchema)
    expect(result).toMatchObject({
      schema: {
        required: ['__kubb_required_request_body__'],
      },
    })
  })

  test('withRequiredRequestBodySchema keeps schema unchanged when required keys already exist', () => {
    const operationSchema = createOperationSchema({
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        },
        required: true,
      },
      required: ['foo'],
    })

    const result = withRequiredRequestBodySchema(operationSchema)
    expect(result).toBe(operationSchema)
  })

  test('withRequiredRequestBodySchema keeps schema unchanged when requestBody is optional', () => {
    const operationSchema = createOperationSchema({
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        },
        required: false,
      },
    })

    const result = withRequiredRequestBodySchema(operationSchema)
    expect(result).toBe(operationSchema)
  })
})
