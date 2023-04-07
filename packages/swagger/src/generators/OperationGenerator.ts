import { pascalCase, camelCaseTransformMerge } from 'change-case'

import type { FileManager, File } from '@kubb/core'
import { combineFiles, Generator } from '@kubb/core'

import { isReference } from '../utils/isReference'

import type { Operation } from 'oas'
import type { HttpMethods as HttpMethod, MediaTypeObject, RequestBodyObject } from 'oas/dist/rmoas.types'
import type { OpenAPIV3 } from 'openapi-types'
import type Oas from 'oas'
import type { OperationSchemas, Resolver } from '../types'

export abstract class OperationGenerator<
  TOptions extends { oas: Oas; fileManager: FileManager } = { oas: Oas; fileManager: FileManager }
> extends Generator<TOptions> {
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
          required: [...schema.required!, pathParameters.required ? pathParameters.name : undefined].filter(Boolean) as string[],
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
    const pathParams = this.getParametersSchema(operation, 'path')
    const queryParams = this.getParametersSchema(operation, 'query')

    return {
      pathParams: pathParams
        ? {
            name: pascalCase(`${operation.getOperationId()} "PathParams"`, { delimiter: '' }),
            schema: pathParams,
          }
        : undefined,
      queryParams: queryParams
        ? {
            name: pascalCase(`${operation.getOperationId()} "QueryParams"`, { delimiter: '' }),
            schema: queryParams,
          }
        : undefined,
      request: {
        name: pascalCase(`${operation.getOperationId()} "Request"`, { delimiter: '' }),
        description: (operation.schema.requestBody as RequestBodyObject)?.description,
        schema: (operation.getRequestBody('application/json') as MediaTypeObject)?.schema as OpenAPIV3.SchemaObject,
      },
      response: {
        name: pascalCase(`${operation.getOperationId()} "Response"`, { delimiter: '' }),
        description: operation.getResponseAsJSONSchema('200')?.at(0)?.description,
        schema: operation.getResponseAsJSONSchema('200')?.at(0)?.schema as OpenAPIV3.SchemaObject,
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
            name: pascalCase(`${operation.getOperationId()} ${name}`, { delimiter: '', transform: camelCaseTransformMerge }),
            description:
              operation.getResponseAsJSONSchema(statusCode)?.at(0)?.description ||
              (operation.getResponseByStatusCode(statusCode) as OpenAPIV3.ResponseObject)?.description,
            schema: operation.getResponseAsJSONSchema(statusCode)?.at(0)?.schema as OpenAPIV3.SchemaObject,
          }
        }),
    }
  }

  public getOperation(path: string, method: HttpMethod): Operation | null {
    const { oas } = this.options

    const operation = oas.operation(path, method)

    if (!operation.schema.operationId) {
      return null
    }

    return operation
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

  async build() {
    const { oas, fileManager } = this.options
    const paths = oas.getPaths()
    const methods = Object.keys(this.methods).filter(Boolean) as HttpMethod[]

    const promises = Object.keys(paths).reduce((acc, path) => {
      methods.forEach((method) => {
        const operation = this.getOperation(path, method)
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

    const filePromises = combineFiles(files).reduce((acc, file) => {
      acc.push(fileManager.addOrAppend(file))
      return acc
    }, [] as Promise<File>[])

    return Promise.all(filePromises)
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
  abstract resolve(operation: Operation): Promise<Resolver>
}
