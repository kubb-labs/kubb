import { pascalCase } from 'change-case'

import type { FileManager, File } from '@kubb/core'
import { combineFiles, Generator } from '@kubb/core'

import { isReference } from '../utils/isReference'

import type { Operation } from 'oas'
import type { HttpMethods as HttpMethod, MediaTypeObject, RequestBodyObject } from 'oas/dist/rmoas.types'
import type { OpenAPIV3 } from 'openapi-types'
import type Oas from 'oas'

type OperationSchema = {
  name: string
  description?: string
  schema: OpenAPIV3.SchemaObject
}
export type OperationSchemas = {
  pathParams?: OperationSchema
  queryParams?: OperationSchema
  request: OperationSchema
  response: OperationSchema
}

type Get = (operation: Operation, schemas: OperationSchemas) => Promise<File | null>

export abstract class OperationGenerator<
  TOptions extends { oas: Oas; fileManager: FileManager } = { oas: Oas; fileManager: FileManager }
> extends Generator<TOptions> {
  private getParametersSchema(operation: Operation, inKey: 'path' | 'query') {
    const { oas } = this.options

    const params = operation.getParameters().filter((v) => v.in === inKey)
    const refParams = operation.getParameters().filter((v) => isReference(v))
    const parameterSchemas = oas.getDefinition().components?.parameters || {}

    Object.keys(parameterSchemas).forEach((name) => {
      const exists = refParams.find(
        (param) => (param as unknown as OpenAPIV3.ReferenceObject).$ref && (param as unknown as OpenAPIV3.ReferenceObject).$ref.replace(/.+\//, '') === name
      )

      if (exists) {
        params.push(parameterSchemas[name] as OpenAPIV3.ParameterObject)
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

  private get methods(): Record<HttpMethod, Get> {
    return {
      get: this.get,
      post: this.post,
      put: this.put,
      delete: this.delete,
      head: () => {
        throw new Error('not implemented')
      },
      options: () => {
        throw new Error('not implemented')
      },
      patch: () => {
        throw new Error('not implemented')
      },
      trace: () => {
        throw new Error('not implemented')
      },
    }
  }

  async build() {
    const { oas, fileManager } = this.options
    const paths = oas.getPaths()
    const methods = Object.keys(this.methods).filter(Boolean) as HttpMethod[]

    const promises = Object.keys(paths).reduce((acc, path) => {
      methods.forEach((method) => {
        const operation = this.getOperation(path, method)
        if (operation && this.methods[method]) {
          acc.push(this.methods[method].call(this, operation, this.getSchemas(operation)))
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

  abstract get(operation: Operation, schemas: OperationSchemas): Promise<File | null>

  abstract post(operation: Operation, schemas: OperationSchemas): Promise<File | null>

  abstract put(operation: Operation, schemas: OperationSchemas): Promise<File | null>

  abstract delete(operation: Operation, schemas: OperationSchemas): Promise<File | null>

  abstract all(paths: Record<string, Record<HttpMethod, Operation>>): Promise<File | null>
}
