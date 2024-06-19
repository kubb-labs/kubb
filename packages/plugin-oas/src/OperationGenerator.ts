import { type FileMetaBase, Generator } from '@kubb/core'
import transformers from '@kubb/core/transformers'

import type { PluginFactoryOptions, PluginManager } from '@kubb/core'
import type * as KubbFile from '@kubb/fs/types'

import type { Plugin } from '@kubb/core'
import type { HttpMethod, Oas, OasTypes, Operation, contentType } from '@kubb/oas'
import type { Exclude, Include, OperationSchemas, OperationsByMethod, Override } from './types.ts'

export type GetOperationGeneratorOptions<T extends OperationGenerator<any, any, any>> = T extends OperationGenerator<infer Options, any, any> ? Options : never

export type OperationMethodResult<TFileMeta extends FileMetaBase> = Promise<KubbFile.File<TFileMeta> | Array<KubbFile.File<TFileMeta>> | null>

type Context<TOptions, TPluginOptions extends PluginFactoryOptions> = {
  oas: Oas
  exclude: Array<Exclude> | undefined
  include: Array<Include> | undefined
  override: Array<Override<TOptions>> | undefined
  contentType: contentType | undefined
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
  TFileMeta extends FileMetaBase = FileMetaBase,
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
  /**
   *
   * @deprecated
   */
  #isExcluded(operation: Operation, method: HttpMethod): boolean {
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
  /**
   *
   * @deprecated
   */
  #isIncluded(operation: Operation, method: HttpMethod): boolean {
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

  getSchemas(
    operation: Operation,
    { forStatusCode, resolveName = (name) => name }: { forStatusCode?: string | number; resolveName?: (name: string) => string } = {},
  ): OperationSchemas {
    const pathParamsSchema = this.context.oas.getParametersSchema(operation, 'path')
    const queryParamsSchema = this.context.oas.getParametersSchema(operation, 'query')
    const headerParamsSchema = this.context.oas.getParametersSchema(operation, 'header')
    const requestSchema = this.context.oas.getRequestSchema(operation)
    const responseStatusCode =
      forStatusCode || (operation.schema.responses && Object.keys(operation.schema.responses).find((key) => key.startsWith('2'))) || 200
    const responseSchema = this.context.oas.getResponseSchema(operation, responseStatusCode)
    const statusCodes = operation.getResponseStatusCodes().map((statusCode) => {
      let name = statusCode
      if (name === 'default') {
        name = 'error'
      }

      const schema = this.context.oas.getResponseSchema(operation, statusCode)

      return {
        name: resolveName(transformers.pascalCase(`${operation.getOperationId()} ${name}`)),
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
            name: resolveName(transformers.pascalCase(`${operation.getOperationId()} PathParams`)),
            operation,
            operationName: transformers.pascalCase(`${operation.getOperationId()}`),
            schema: pathParamsSchema,
            keys: pathParamsSchema.properties ? Object.keys(pathParamsSchema.properties) : undefined,
          }
        : undefined,
      queryParams: queryParamsSchema
        ? {
            name: resolveName(transformers.pascalCase(`${operation.getOperationId()} QueryParams`)),
            operation,
            operationName: transformers.pascalCase(`${operation.getOperationId()}`),
            schema: queryParamsSchema,
            keys: queryParamsSchema.properties ? Object.keys(queryParamsSchema.properties) : [],
          }
        : undefined,
      headerParams: headerParamsSchema
        ? {
            name: resolveName(transformers.pascalCase(`${operation.getOperationId()} HeaderParams`)),
            operation,
            operationName: transformers.pascalCase(`${operation.getOperationId()}`),
            schema: headerParamsSchema,
            keys: headerParamsSchema.properties ? Object.keys(headerParamsSchema.properties) : undefined,
          }
        : undefined,
      request: requestSchema
        ? {
            name: resolveName(transformers.pascalCase(`${operation.getOperationId()} ${operation.method === 'get' ? 'queryRequest' : 'mutationRequest'}`)),
            description: (operation.schema.requestBody as OasTypes.RequestBodyObject)?.description,
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
        name: resolveName(transformers.pascalCase(`${operation.getOperationId()} ${operation.method === 'get' ? 'queryResponse' : 'mutationResponse'}`)),
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
          const isExcluded = this.#isExcluded(operation, method)
          const isIncluded = this.context.include ? this.#isIncluded(operation, method) : true

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
  async operation(operation: Operation, options: TOptions): OperationMethodResult<TFileMeta> {
    return null
  }

  /**
   * GET
   */
  async get(operation: Operation, options: TOptions): OperationMethodResult<TFileMeta> {
    return null
  }

  /**
   * POST
   */
  async post(operation: Operation, options: TOptions): OperationMethodResult<TFileMeta> {
    return null
  }
  /**
   * PATCH
   */
  async patch(operation: Operation, options: TOptions): OperationMethodResult<TFileMeta> {
    return null
  }

  /**
   * PUT
   */
  async put(operation: Operation, options: TOptions): OperationMethodResult<TFileMeta> {
    return null
  }

  /**
   * DELETE
   */
  async delete(operation: Operation, options: TOptions): OperationMethodResult<TFileMeta> {
    return null
  }

  /**
   * Combination of GET, POST, PATCH, PUT, DELETE
   */
  async all(operations: Operation[], paths: OperationsByMethod): OperationMethodResult<TFileMeta> {
    return null
  }
}
