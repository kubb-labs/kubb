import { Generator } from '@kubb/core'
import transformers from '@kubb/core/transformers'

import { findSchemaDefinition, matchesMimeType } from 'oas/utils'

import { isReference } from './utils/isReference.ts'

import type { KubbFile, PluginFactoryOptions, PluginManager } from '@kubb/core'
import type { Plugin } from '@kubb/core'
import type { HttpMethods as HttpMethod, MediaTypeObject, RequestBodyObject } from 'oas/types'
import type { Oas, OasTypes, OpenAPIV3, OpenAPIV3_1, Operation } from './oas/index.ts'
import type { ContentType, Exclude, Include, OperationSchemas, OperationsByMethod, Override } from './types.ts'

export type GetOperationGeneratorOptions<T extends OperationGenerator<any, any, any>> = T extends OperationGenerator<infer Options, any, any> ? Options : never

export type OperationMethodResult<TFileMeta extends KubbFile.FileMetaBase> = Promise<KubbFile.File<TFileMeta> | Array<KubbFile.File<TFileMeta>> | null>

type Context<TOptions, TPluginOptions extends PluginFactoryOptions> = {
  oas: Oas
  exclude: Array<Exclude> | undefined
  include: Array<Include> | undefined
  override: Array<Override<TOptions>> | undefined
  contentType: ContentType | undefined
  pluginManager: PluginManager
  /**
   * Current plugin
   */
  plugin: Plugin<TPluginOptions>
  mode: KubbFile.Mode
}

export abstract class OperationGenerator<
  TOptions = unknown,
  TPluginOptions extends PluginFactoryOptions = PluginFactoryOptions,
  TFileMeta extends KubbFile.FileMetaBase = KubbFile.FileMetaBase,
> extends Generator<TOptions, Context<TOptions, TPluginOptions>> {
  #operationsByMethod: OperationsByMethod = {}
  get operationsByMethod(): OperationsByMethod {
    return this.#operationsByMethod
  }

  set operationsByMethod(paths: OperationsByMethod) {
    this.#operationsByMethod = paths
  }

  #getOptions(operation: Operation, method: HttpMethod): Partial<TOptions> {
    const { override = [] } = this.context

    return (
      override.find(({ pattern, type }) => {
        if (type === 'tag') {
          return !!operation.getTags()[0]?.name.match(pattern)
        }

        if (type === 'operationId') {
          return !!operation.getOperationId().match(pattern)
        }

        if (type === 'path') {
          return !!operation.path.match(pattern)
        }

        if (type === 'method') {
          return !!method.match(pattern)
        }

        return false
      })?.options || {}
    )
  }

  isExcluded(operation: Operation, method: HttpMethod): boolean {
    const { exclude = [] } = this.context
    let matched = false

    exclude.forEach(({ pattern, type }) => {
      if (type === 'tag' && !matched) {
        matched = !!operation.getTags()[0]?.name.match(pattern)
      }

      if (type === 'operationId' && !matched) {
        matched = !!operation.getOperationId().match(pattern)
      }

      if (type === 'path' && !matched) {
        matched = !!operation.path.match(pattern)
      }

      if (type === 'method' && !matched) {
        matched = !!method.match(pattern)
      }
    })

    return matched
  }
  isIncluded(operation: Operation, method: HttpMethod): boolean {
    const { include = [] } = this.context
    let matched = false

    include.forEach(({ pattern, type }) => {
      if (type === 'tag' && !matched) {
        matched = !!operation.getTags()[0]?.name.match(pattern)
      }

      if (type === 'operationId' && !matched) {
        matched = !!operation.getOperationId().match(pattern)
      }

      if (type === 'path' && !matched) {
        matched = !!operation.path.match(pattern)
      }

      if (type === 'method' && !matched) {
        matched = !!method.match(pattern)
      }
    })

    return matched
  }

  #getParametersSchema(operation: Operation, inKey: 'path' | 'query' | 'header'): OasTypes.SchemaObject | null {
    const mediaType = this.context.contentType || operation.getContentType()
    const params = operation
      .getParameters()
      .map((schema) => {
        return this.#dereference(schema, { withRef: true })
      })
      .filter((v) => v.in === inKey)

    if (!params.length) {
      return null
    }

    return params.reduce(
      (schema, pathParameters) => {
        const property = pathParameters.content?.[mediaType]?.schema ?? (pathParameters.schema as OasTypes.SchemaObject)
        const required = [...(schema.required || ([] as any)), pathParameters.required ? pathParameters.name : undefined].filter(Boolean)

        return {
          ...schema,
          description: schema.description,
          deprecated: schema.deprecated,
          example: schema.example,
          required,
          properties: {
            ...schema.properties,
            [pathParameters.name]: {
              description: pathParameters.description,
              ...property,
            },
          },
        }
      },
      { type: 'object', required: [], properties: {} } as OasTypes.SchemaObject,
    )
  }

  /**
   * Oas does not have a getResponseBody(mediaType/contentType)
   * TODO open PR in Oas
   */
  #getResponseBodyFactory(
    responseBody: boolean | OasTypes.ResponseObject,
  ): (mediaType?: string) => OasTypes.MediaTypeObject | false | [string, OasTypes.MediaTypeObject, ...string[]] {
    function hasResponseBody(res = responseBody): res is OasTypes.ResponseObject {
      return !!res
    }

    return (mediaType) => {
      if (!hasResponseBody(responseBody)) {
        return false
      }

      if (isReference(responseBody)) {
        // If the request body is still a `$ref` pointer we should return false because this library
        // assumes that you've run dereferencing beforehand.
        return false
      }

      if (!responseBody.content) {
        return false
      }

      if (mediaType) {
        if (!(mediaType in responseBody.content)) {
          return false
        }

        return responseBody.content[mediaType]!
      }

      // Since no media type was supplied we need to find either the first JSON-like media type that
      // we've got, or the first available of anything else if no JSON-like media types are present.
      let availableMediaType: string | undefined = undefined
      const mediaTypes = Object.keys(responseBody.content)
      mediaTypes.forEach((mt: string) => {
        if (!availableMediaType && matchesMimeType.json(mt)) {
          availableMediaType = mt
        }
      })

      if (!availableMediaType) {
        mediaTypes.forEach((mt: string) => {
          if (!availableMediaType) {
            availableMediaType = mt
          }
        })
      }

      if (availableMediaType) {
        return [availableMediaType, responseBody.content[availableMediaType]!, ...(responseBody.description ? [responseBody.description] : [])]
      }

      return false
    }
  }

  #dereference(schema?: unknown, { withRef = false }: { withRef?: boolean } = {}) {
    if (isReference(schema)) {
      if (withRef) {
        return {
          ...findSchemaDefinition(schema?.$ref, this.context.oas.api),
          $ref: schema.$ref,
        }
      }
      return findSchemaDefinition(schema?.$ref, this.context.oas.api)
    }

    return schema
  }

  #getResponseSchema(operation: Operation, statusCode: string | number): OasTypes.SchemaObject {
    if (operation.schema.responses) {
      Object.keys(operation.schema.responses).forEach((key) => {
        operation.schema.responses![key] = this.#dereference(operation.schema.responses![key])
      })
    }

    const getResponseBody = this.#getResponseBodyFactory(operation.getResponseByStatusCode(statusCode))

    const mediaType = this.context.contentType
    const responseBody = getResponseBody(mediaType)

    if (responseBody === false) {
      // return empty object because response will always be defined(request does not need a body)
      return {}
    }

    const schema = Array.isArray(responseBody) ? responseBody[1].schema : responseBody.schema

    if (!schema) {
      // return empty object because response will always be defined(request does not need a body)

      return {}
    }

    return this.#dereference(schema, { withRef: true })
  }

  #getRequestSchema(operation: Operation): OasTypes.SchemaObject | undefined {
    const mediaType = this.context.contentType

    if (operation.schema.requestBody) {
      operation.schema.requestBody = this.#dereference(operation.schema.requestBody)
    }

    const requestBody = operation.getRequestBody(mediaType)

    if (requestBody === false) {
      return undefined
    }

    const schema = Array.isArray(requestBody) ? requestBody[1].schema : requestBody.schema

    if (!schema) {
      return undefined
    }

    return this.#dereference(schema, { withRef: true })
  }

  getSchemas(operation: Operation, forStatusCode?: string | number): OperationSchemas {
    const pathParamsSchema = this.#getParametersSchema(operation, 'path')
    const queryParamsSchema = this.#getParametersSchema(operation, 'query')
    const headerParamsSchema = this.#getParametersSchema(operation, 'header')
    const requestSchema = this.#getRequestSchema(operation)
    const responseStatusCode =
      forStatusCode || (operation.schema.responses && Object.keys(operation.schema.responses).find((key) => key.startsWith('2'))) || 200
    const responseSchema = this.#getResponseSchema(operation, responseStatusCode)
    const statusCodes = operation.getResponseStatusCodes().map((statusCode) => {
      let name = statusCode
      if (name === 'default') {
        name = 'error'
      }

      const schema = this.#getResponseSchema(operation, statusCode)

      return {
        name: transformers.pascalCase(`${operation.getOperationId()} ${name}`),
        description: (operation.getResponseByStatusCode(statusCode) as OasTypes.ResponseObject)?.description,
        schema,
        operation,
        operationName: transformers.pascalCase(`${operation.getOperationId()}`),
        statusCode: name === 'error' ? undefined : Number(statusCode),
        keys: schema?.properties ? Object.keys(schema.properties) : undefined,
      }
    })

    return {
      pathParams: pathParamsSchema
        ? {
            name: transformers.pascalCase(`${operation.getOperationId()} PathParams`),
            operation,
            operationName: transformers.pascalCase(`${operation.getOperationId()}`),
            schema: pathParamsSchema,
            keys: pathParamsSchema.properties ? Object.keys(pathParamsSchema.properties) : undefined,
          }
        : undefined,
      queryParams: queryParamsSchema
        ? {
            name: transformers.pascalCase(`${operation.getOperationId()} QueryParams`),
            operation,
            operationName: transformers.pascalCase(`${operation.getOperationId()}`),
            schema: queryParamsSchema,
            keys: queryParamsSchema.properties ? Object.keys(queryParamsSchema.properties) : [],
          }
        : undefined,
      headerParams: headerParamsSchema
        ? {
            name: transformers.pascalCase(`${operation.getOperationId()} HeaderParams`),
            operation,
            operationName: transformers.pascalCase(`${operation.getOperationId()}`),
            schema: headerParamsSchema,
            keys: headerParamsSchema.properties ? Object.keys(headerParamsSchema.properties) : undefined,
          }
        : undefined,
      request: requestSchema
        ? {
            name: transformers.pascalCase(`${operation.getOperationId()} ${operation.method === 'get' ? 'queryRequest' : 'mutationRequest'}`),
            description: (operation.schema.requestBody as RequestBodyObject)?.description,
            operation,
            operationName: transformers.pascalCase(`${operation.getOperationId()}`),
            schema: requestSchema,
            keys: requestSchema.properties ? Object.keys(requestSchema.properties) : undefined,
            keysToOmit: requestSchema.properties
              ? Object.keys(requestSchema.properties).filter((key) => {
                  const item = requestSchema.properties?.[key] as OasTypes.SchemaObject

                  return item?.readOnly
                })
              : undefined,
          }
        : undefined,
      response: {
        name: transformers.pascalCase(`${operation.getOperationId()} ${operation.method === 'get' ? 'queryResponse' : 'mutationResponse'}`),
        description: operation.getResponseAsJSONSchema(responseStatusCode)?.at(0)?.description,
        operation,
        operationName: transformers.pascalCase(`${operation.getOperationId()}`),
        schema: responseSchema,
        statusCode: Number(responseStatusCode),
        keys: responseSchema?.properties ? Object.keys(responseSchema.properties) : undefined,
        keysToOmit: responseSchema?.properties
          ? Object.keys(responseSchema.properties).filter((key) => {
              const item = responseSchema.properties?.[key] as OasTypes.SchemaObject
              return item?.writeOnly
            })
          : undefined,
      },
      errors: statusCodes.filter((item) => item.statusCode?.toString().startsWith('4') || item.statusCode?.toString().startsWith('5')),
      statusCodes,
    }
  }

  get #methods() {
    return {
      get: this.get,
      post: this.post,
      patch: this.patch,
      put: this.put,
      delete: this.delete,
      head: undefined,
      options: undefined,
      trace: undefined,
    } as const
  }

  async build(): Promise<Array<KubbFile.File<TFileMeta>>> {
    const { oas } = this.context

    const paths = oas.getPaths()
    this.operationsByMethod = Object.entries(paths).reduce((acc, [path, method]) => {
      const methods = Object.keys(method) as HttpMethod[]

      methods.forEach((method) => {
        const operation = oas.operation(path, method)
        if (operation && this.#methods[method]) {
          const isExcluded = this.isExcluded(operation, method)
          const isIncluded = this.context.include ? this.isIncluded(operation, method) : true

          if (isIncluded && !isExcluded) {
            if (!acc[path]) {
              acc[path] = {} as OperationsByMethod['get']
            }
            acc[path] = {
              ...acc[path],
              [method]: {
                operation,
                schemas: this.getSchemas(operation),
              },
            } as OperationsByMethod['get']
          }
        }
      })

      return acc
    }, {} as OperationsByMethod)

    const promises = Object.keys(this.operationsByMethod).reduce((acc, path) => {
      const methods = this.operationsByMethod[path] ? (Object.keys(this.operationsByMethod[path]!) as HttpMethod[]) : []

      methods.forEach((method) => {
        const { operation } = this.operationsByMethod[path]?.[method]!
        const options = this.#getOptions(operation, method)
        const promiseMethod = this.#methods[method]?.call(this, operation, {
          ...this.options,
          ...options,
        })
        const promiseOperation = this.operation.call(this, operation, {
          ...this.options,
          ...options,
        })

        if (promiseMethod) {
          acc.push(promiseMethod)
        }
        if (promiseOperation) {
          acc.push(promiseOperation)
        }
      })

      return acc
    }, [] as OperationMethodResult<TFileMeta>[])

    const operations = Object.values(this.operationsByMethod).map((item) => Object.values(item).map((item) => item.operation))

    promises.push(this.all(operations.flat().filter(Boolean), this.operationsByMethod))

    const files = await Promise.all(promises)

    // using .flat because operationGenerator[method] can return a array of files or just one file
    return files.flat().filter(Boolean)
  }

  /**
   * Operation
   */
  abstract operation(operation: Operation, options: TOptions): OperationMethodResult<TFileMeta>

  /**
   * GET
   */
  abstract get(operation: Operation, options: TOptions): OperationMethodResult<TFileMeta>

  /**
   * POST
   */
  abstract post(operation: Operation, options: TOptions): OperationMethodResult<TFileMeta>
  /**
   * PATCH
   */
  abstract patch(operation: Operation, options: TOptions): OperationMethodResult<TFileMeta>

  /**
   * PUT
   */
  abstract put(operation: Operation, options: TOptions): OperationMethodResult<TFileMeta>

  /**
   * DELETE
   */
  abstract delete(operation: Operation, options: TOptions): OperationMethodResult<TFileMeta>

  /**
   * Combination of GET, POST, PATCH, PUT, DELETE
   */
  abstract all(operations: Operation[], paths: OperationsByMethod): OperationMethodResult<TFileMeta>
}
