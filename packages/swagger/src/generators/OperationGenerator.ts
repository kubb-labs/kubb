/* eslint-disable @typescript-eslint/unbound-method */
import { combineFiles, Generator } from '@kubb/core'

import { pascalCase, pascalCaseTransformMerge } from 'change-case'

import { isReference } from '../utils/isReference.ts'

import type { File } from '@kubb/core'
import type { Operation } from 'oas'
import type { HttpMethods as HttpMethod, MediaTypeObject, RequestBodyObject } from 'oas/dist/rmoas.types.ts'
import type { OpenAPIV3 } from 'openapi-types'
import type { Oas, OperationSchemas, Resolver } from '../types.ts'

export abstract class OperationGenerator<TOptions extends { oas: Oas } = { oas: Oas }> extends Generator<TOptions> {
  private getParametersSchema(operation: Operation, inKey: 'path' | 'query') {
    const { oas } = this.options

    const params = operation.getParameters().filter((v) => v.in === inKey)
    const refParams = operation.getParameters().filter((v) => isReference(v))
    const parameterSchemas = oas.getDefinition().components?.parameters || {}

    Object.keys(parameterSchemas).forEach((name) => {
      const exists = refParams.some(
        (param) => (param as unknown as OpenAPIV3.ReferenceObject).$ref && (param as unknown as OpenAPIV3.ReferenceObject).$ref.replace(/.+\//, '') === name
      )
      const schema = parameterSchemas[name] as OpenAPIV3.ParameterObject

      if (exists && schema.in === inKey) {
        params.push(schema)
      }
    })

    if (!params.length) {
      return null
    }

    return params.reduce(
      (schema, pathParameters) => {
        return {
          ...schema,
          required: [...schema.required!, pathParameters.required ? pathParameters.name : undefined].filter(Boolean) ,
          properties: {
            ...schema.properties,
            [pathParameters.name]: pathParameters.schema as OpenAPIV3.SchemaObject,
          },
        }
      },
      { type: 'object', required: [], properties: {} } as OpenAPIV3.SchemaObject
    )
  }

  public getSchemas(operation: Operation): OperationSchemas {
    const pathParamsSchema = this.getParametersSchema(operation, 'path')
    const queryParamsSchema = this.getParametersSchema(operation, 'query')
    const requestBodyTypes = operation.getRequestBodyMediaTypes()
    const requestSchema = operation.hasRequestBody()
      ? ((operation.getRequestBody() as MediaTypeObject)?.schema as OpenAPIV3.SchemaObject) ||
        ((operation.getRequestBody(requestBodyTypes.at(0)) as MediaTypeObject)?.schema as OpenAPIV3.SchemaObject)
      : undefined
    const responseSchema = operation.getResponseAsJSONSchema('200')?.at(0)?.schema as OpenAPIV3.SchemaObject

    return {
      pathParams: pathParamsSchema
        ? {
            name: pascalCase(`${operation.getOperationId()} PathParams`, { delimiter: '', transform: pascalCaseTransformMerge }),
            operationName: pascalCase(`${operation.getOperationId()}`, { delimiter: '', transform: pascalCaseTransformMerge }),
            schema: pathParamsSchema,
          }
        : undefined,
      queryParams: queryParamsSchema
        ? {
            name: pascalCase(`${operation.getOperationId()} QueryParams`, { delimiter: '', transform: pascalCaseTransformMerge }),
            operationName: pascalCase(`${operation.getOperationId()}`, { delimiter: '', transform: pascalCaseTransformMerge }),
            schema: queryParamsSchema,
          }
        : undefined,
      request: requestSchema
        ? {
            name: pascalCase(`${operation.getOperationId()} ${operation.method === 'get' ? 'queryRequest' : 'mutationRequest'}`, {
              delimiter: '',
              transform: pascalCaseTransformMerge,
            }),
            description: (operation.schema.requestBody as RequestBodyObject)?.description,
            operationName: pascalCase(`${operation.getOperationId()}`, { delimiter: '', transform: pascalCaseTransformMerge }),
            schema: requestSchema,
          }
        : undefined,
      response: {
        name: pascalCase(`${operation.getOperationId()} ${operation.method === 'get' ? 'queryResponse' : 'mutationResponse'}`, {
          delimiter: '',
          transform: pascalCaseTransformMerge,
        }),
        description: operation.getResponseAsJSONSchema('200')?.at(0)?.description,
        operationName: pascalCase(`${operation.getOperationId()}`, { delimiter: '', transform: pascalCaseTransformMerge }),
        schema: responseSchema,
        statusCode: 200,
      },
      errors: operation
        .getResponseStatusCodes()
        .filter((statusCode) => statusCode !== '200')
        .map((statusCode) => {
          let name = statusCode
          if (name === 'default') {
            name = 'error'
          }

          return {
            name: pascalCase(`${operation.getOperationId()} ${name}`, { delimiter: '', transform: pascalCaseTransformMerge }),
            description:
              operation.getResponseAsJSONSchema(statusCode)?.at(0)?.description ||
              (operation.getResponseByStatusCode(statusCode) as OpenAPIV3.ResponseObject)?.description,
            schema: operation.getResponseAsJSONSchema(statusCode)?.at(0)?.schema as OpenAPIV3.SchemaObject,
            operationName: pascalCase(`${operation.getOperationId()}`, { delimiter: '', transform: pascalCaseTransformMerge }),
            statusCode: name === 'error' ? undefined : Number(statusCode),
          }
        }),
    }
  }

  private get methods() {
    return {
      get: this.get,
      post: this.post,
      put: this.put,
      delete: this.delete,
      head: () => {
        return null
      },
      options: () => {
        return null
      },
      patch: () => {
        return null
      },
      trace: () => {
        return null
      },
    } as const
  }

  async build(): Promise<File[]> {
    const { oas } = this.options
    const paths = oas.getPaths()

    const promises = Object.keys(paths).reduce((acc, path) => {
      const methods = Object.keys(paths[path]) as HttpMethod[]

      methods.forEach((method) => {
        const operation = oas.operation(path, method)
        if (operation && this.methods[method]) {
          const promise = this.methods[method].call(this, operation, this.getSchemas(operation))
          if (promise) {
            acc.push(promise)
          }
        }
      })

      return acc
    }, [] as Promise<File | null>[])

    promises.push(this.all(paths))

    const files = await Promise.all(promises)

    return combineFiles(files)
  }

  /**
   * GET
   */
  abstract get(operation: Operation, schemas: OperationSchemas): Promise<File | null>

  /**
   * POST
   */
  abstract post(operation: Operation, schemas: OperationSchemas): Promise<File | null>

  /**
   * PUT
   */
  abstract put(operation: Operation, schemas: OperationSchemas): Promise<File | null>

  /**
   * DELETE
   */
  abstract delete(operation: Operation, schemas: OperationSchemas): Promise<File | null>

  /**
   * Combination of GET, POST, PUT, DELETE
   */
  abstract all(paths: Record<string, Record<HttpMethod, Operation>>): Promise<File | null>

  /**
   * Call resolveType and get back the name, filePath and fileName
   */
  abstract resolve(operation: Operation): Resolver
}
