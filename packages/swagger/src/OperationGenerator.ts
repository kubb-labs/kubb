/* eslint-disable @typescript-eslint/unbound-method */
import { Generator } from '@kubb/core'
import transformers from '@kubb/core/transformers'

import { findSchemaDefinition } from 'oas/utils'

import { isReference } from './utils/isReference.ts'

import type { KubbFile, PluginFactoryOptions, PluginManager } from '@kubb/core'
import type { KubbPlugin } from '@kubb/core'
import type { HttpMethods as HttpMethod, MediaTypeObject, RequestBodyObject } from 'oas/types'
import type { Oas, OasTypes, OpenAPIV3, Operation } from './oas/index.ts'
import type { ContentType, Exclude, Include, OperationSchemas, Override, Paths } from './types.ts'

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
  plugin: KubbPlugin<TPluginOptions>
  mode?: KubbFile.Mode
}

export abstract class OperationGenerator<
  TOptions = unknown,
  TPluginOptions extends PluginFactoryOptions = PluginFactoryOptions,
  TFileMeta extends KubbFile.FileMetaBase = KubbFile.FileMetaBase,
> extends Generator<TOptions, Context<TOptions, TPluginOptions>> {
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
    const contentType = this.context.contentType || operation.getContentType()
    const params = operation
      .getParameters()
      .map((item) => {
        const param = item as unknown as OpenAPIV3.ReferenceObject & OasTypes.ParameterObject
        if (isReference(param)) {
          return findSchemaDefinition(param.$ref, operation.api) as OasTypes.ParameterObject
        }

        return param
      })
      .filter((v) => v.in === inKey)

    if (!params.length) {
      return null
    }

    return params.reduce(
      (schema, pathParameters) => {
        const property = pathParameters.content?.[contentType]?.schema ?? (pathParameters.schema as OasTypes.SchemaObject)
        return {
          ...schema,
          description: pathParameters.description,
          pathParameters: pathParameters.deprecated,

          example: pathParameters.example,
          required: [...(schema.required || [] as any), pathParameters.required ? pathParameters.name : undefined]
            .filter(
              Boolean,
            ),
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

  #getResponseSchema(operation: Operation, statusCode?: string | number): OasTypes.SchemaObject {
    const contentType = this.context.contentType || operation.getContentType()
    const responseStatusCode = statusCode || (operation.schema.responses && Object.keys(operation.schema.responses).find((key) => key.startsWith('2'))) || 200
    const schema = operation.schema.responses?.[responseStatusCode] as OpenAPIV3.ReferenceObject

    if (isReference(schema)) {
      const responseSchema = findSchemaDefinition(schema?.$ref, operation.api) as OasTypes.ResponseObject
      const contentTypeSchema = responseSchema.content?.[contentType]?.schema as OasTypes.SchemaObject

      if (isReference(contentTypeSchema)) {
        return {
          ...findSchemaDefinition(contentTypeSchema?.$ref, operation.api),
          $ref: contentTypeSchema.$ref,
        } as OasTypes.SchemaObject
      }

      return contentTypeSchema
    }
    const responseJSONSchema = operation.getResponseAsJSONSchema(responseStatusCode)?.at(0)?.schema as OasTypes.SchemaObject

    if (isReference(responseJSONSchema)) {
      return {
        ...findSchemaDefinition(responseJSONSchema?.$ref, operation.api),
        $ref: responseJSONSchema.$ref,
      } as OasTypes.SchemaObject
    }

    return responseJSONSchema
  }

  #getRequestSchema(operation: Operation): OasTypes.SchemaObject | null {
    if (!operation.hasRequestBody()) {
      return null
    }

    const contentType = this.context.contentType || operation.getContentType()
    const requestBody = operation.getRequestBody() as MediaTypeObject
    const requestBodyContentType = operation.getRequestBody(contentType) as MediaTypeObject
    const schema = (requestBody?.schema || requestBodyContentType?.schema) as OasTypes.SchemaObject

    if (!schema) {
      return null
    }

    if (isReference(schema)) {
      return {
        ...findSchemaDefinition(schema?.$ref, operation.api),
        $ref: schema.$ref,
      } as OasTypes.SchemaObject
    }

    return schema
  }

  getSchemas(operation: Operation): OperationSchemas {
    const pathParamsSchema = this.#getParametersSchema(operation, 'path')
    const queryParamsSchema = this.#getParametersSchema(operation, 'query')
    const headerParamsSchema = this.#getParametersSchema(operation, 'header')
    const requestSchema = this.#getRequestSchema(operation)
    const responseSchema = this.#getResponseSchema(operation)

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
              const item = requestSchema.properties![key] as OasTypes.SchemaObject
              return item?.readOnly
            })
            : undefined,
        }
        : undefined,
      response: {
        name: transformers.pascalCase(`${operation.getOperationId()} ${operation.method === 'get' ? 'queryResponse' : 'mutationResponse'}`),
        description: operation.getResponseAsJSONSchema('200')?.at(0)?.description,
        operation,
        operationName: transformers.pascalCase(`${operation.getOperationId()}`),
        schema: responseSchema,
        statusCode: 200,
        keys: responseSchema?.properties ? Object.keys(responseSchema.properties) : undefined,
        keysToOmit: responseSchema?.properties
          ? Object.keys(responseSchema.properties).filter((key) => {
            const item = responseSchema.properties![key] as OasTypes.SchemaObject
            return item?.writeOnly
          })
          : undefined,
      },
      errors: operation
        .getResponseStatusCodes()
        .filter((statusCode) => statusCode !== '200')
        .map((statusCode) => {
          let name = statusCode
          if (name === 'default') {
            name = 'error'
          }

          const schema = this.#getResponseSchema(operation, statusCode)

          return {
            name: transformers.pascalCase(`${operation.getOperationId()} ${name}`),
            description: operation.getResponseAsJSONSchema(statusCode)?.at(0)?.description
              || (operation.getResponseByStatusCode(statusCode) as OasTypes.ResponseObject)?.description,
            schema,
            operation,
            operationName: transformers.pascalCase(`${operation.getOperationId()}`),
            statusCode: name === 'error' ? undefined : Number(statusCode),
            keys: schema?.properties ? Object.keys(schema.properties) : undefined,
          }
        }),
    }
  }

  get #methods() {
    return {
      get: this.get,
      post: this.post,
      patch: this.patch,
      put: this.put,
      delete: this.delete,
      head: () => {
        return null
      },
      options: () => {
        return null
      },
      trace: () => {
        return null
      },
    } as const
  }

  async build(): Promise<Array<KubbFile.File<TFileMeta>>> {
    const { oas } = this.context

    const paths = oas.getPaths()
    const filterdPaths = Object.keys(paths).reduce(
      (acc, path) => {
        const methods = Object.keys(paths[path]!) as HttpMethod[]

        methods.forEach((method) => {
          const operation = oas.operation(path, method)
          if (operation && this.#methods[method]) {
            const isExcluded = this.isExcluded(operation, method)
            const isIncluded = this.context.include ? this.isIncluded(operation, method) : true

            if (isIncluded && !isExcluded) {
              if (!acc[path]) {
                acc[path] = {} as Paths['get']
              }
              acc[path] = {
                ...acc[path],
                [method]: {
                  operation,
                  schemas: this.getSchemas(operation),
                },
              } as Paths['get']
            }
          }
        })

        return acc
      },
      {} as Paths,
    )

    const promises = Object.keys(filterdPaths).reduce(
      (acc, path) => {
        const methods = Object.keys(filterdPaths[path]!) as HttpMethod[]

        methods.forEach((method) => {
          const { operation, schemas } = filterdPaths[path]![method]
          const options = this.#getOptions(operation, method)

          const promise = this.#methods[method].call(this, operation, schemas, { ...this.options, ...options })
          if (promise) {
            acc.push(promise)
          }
        })

        return acc
      },
      [] as OperationMethodResult<TFileMeta>[],
    )

    promises.push(this.all(filterdPaths))

    const files = await Promise.all(promises)

    // using .flat because operationGenerator[method] can return a array of files or just one file
    return files.flat().filter(Boolean)
  }

  /**
   * GET
   */
  abstract get(operation: Operation, schemas: OperationSchemas, options: TOptions): OperationMethodResult<TFileMeta>

  /**
   * POST
   */
  abstract post(operation: Operation, schemas: OperationSchemas, options: TOptions): OperationMethodResult<TFileMeta>
  /**
   * PATCH
   */
  abstract patch(operation: Operation, schemas: OperationSchemas, options: TOptions): OperationMethodResult<TFileMeta>

  /**
   * PUT
   */
  abstract put(operation: Operation, schemas: OperationSchemas, options: TOptions): OperationMethodResult<TFileMeta>

  /**
   * DELETE
   */
  abstract delete(operation: Operation, schemas: OperationSchemas, options: TOptions): OperationMethodResult<TFileMeta>

  /**
   * Combination of GET, POST, PATCH, PUT, DELETE
   */
  abstract all(paths: Paths): OperationMethodResult<TFileMeta>
}
