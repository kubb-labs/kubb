import { BaseGenerator, type FileMetaBase } from '@kubb/core'
import transformers from '@kubb/core/transformers'

import type { PluginFactoryOptions, PluginManager } from '@kubb/core'
import type * as KubbFile from '@kubb/fs/types'

import type { Plugin } from '@kubb/core'
import type { HttpMethod, Oas, OasTypes, Operation, contentType } from '@kubb/oas'
import type { Generator } from './generator.tsx'
import type { Exclude, Include, OperationSchemas, OperationsByMethod, Override } from './types.ts'

/**
 * @deprecated
 */
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

export class OperationGenerator<
  TOptions = unknown,
  TPluginOptions extends PluginFactoryOptions = PluginFactoryOptions,
  TFileMeta extends FileMetaBase = FileMetaBase,
> extends BaseGenerator<TOptions, Context<TOptions, TPluginOptions>> {
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
    {
      forStatusCode,
      resolveName = (name) => name,
    }: {
      forStatusCode?: string | number
      resolveName?: (name: string) => string
    } = {},
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

  #methods = ['get', 'post', 'patch', 'put', 'delete']

  async build(...generators: Array<Generator<Extract<TOptions, PluginFactoryOptions>>>): Promise<Array<KubbFile.File<TFileMeta>>> {
    const { oas } = this.context

    const paths = oas.getPaths()
    this.operationsByMethod = Object.entries(paths).reduce((acc, [path, method]) => {
      const methods = Object.keys(method) as HttpMethod[]

      methods.forEach((method) => {
        const operation = oas.operation(path, method)
        if (operation && [this.#methods].some((methods) => method === operation.method)) {
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

        const methodToCall = this[method as keyof typeof this] as any

        if (typeof methodToCall === 'function') {
          const promiseMethod = methodToCall?.call(this, operation, {
            ...this.options,
            ...options,
          })

          if (promiseMethod) {
            acc.push(promiseMethod)
          }
        }

        const promiseOperation = this.operation.call(this, operation, {
          ...this.options,
          ...options,
        })

        if (promiseOperation) {
          acc.push(promiseOperation)
        }

        generators?.forEach((generator) => {
          const promise = generator.operation?.({
            instance: this,
            operation,
            options: {
              ...this.options,
              ...options,
            },
          } as any) as Promise<Array<KubbFile.File<TFileMeta>>>

          if (promise) {
            acc.push(promise)
          }
        })
      })

      return acc
    }, [] as OperationMethodResult<TFileMeta>[])

    const operations = Object.values(this.operationsByMethod).map((item) => Object.values(item).map((item) => item.operation))

    promises.push(this.all(operations.flat().filter(Boolean), this.operationsByMethod))

    generators?.forEach((generator) => {
      const promise = generator.operations?.({
        instance: this,
        operations: operations.flat().filter(Boolean),
        operationsByMethod: this.operationsByMethod,
        options: this.options,
      } as any) as Promise<Array<KubbFile.File<TFileMeta>>>

      if (promise) {
        promises.push(promise)
      }
    })

    const files = await Promise.all(promises)

    // using .flat because operationGenerator[method] can return a array of files or just one file
    return files.flat().filter(Boolean)
  }

  /**
   * Operation
   */
  async operation(operation: Operation, options: TOptions): OperationMethodResult<TFileMeta> {
    return []
  }

  /**
   * GET
   */
  async get(operation: Operation, options: TOptions): OperationMethodResult<TFileMeta> {
    return []
  }

  /**
   * POST
   */
  async post(operation: Operation, options: TOptions): OperationMethodResult<TFileMeta> {
    return []
  }
  /**
   * PATCH
   */
  async patch(operation: Operation, options: TOptions): OperationMethodResult<TFileMeta> {
    return []
  }

  /**
   * PUT
   */
  async put(operation: Operation, options: TOptions): OperationMethodResult<TFileMeta> {
    return []
  }

  /**
   * DELETE
   */
  async delete(operation: Operation, options: TOptions): OperationMethodResult<TFileMeta> {
    return []
  }

  /**
   * Combination of GET, POST, PATCH, PUT, DELETE
   */
  async all(operations: Operation[], paths: OperationsByMethod): OperationMethodResult<TFileMeta> {
    return []
  }
}
