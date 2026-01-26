import type { KubbEvents, Plugin, PluginFactoryOptions, PluginManager } from '@kubb/core'
import { BaseGenerator, type FileMetaBase } from '@kubb/core'
import transformers from '@kubb/core/transformers'
import type { AsyncEventEmitter } from '@kubb/core/utils'
import type { KubbFile } from '@kubb/fabric-core/types'
import type { contentType, HttpMethod, Oas, OasTypes, Operation, SchemaObject } from '@kubb/oas'
import type { Fabric } from '@kubb/react-fabric'
import pLimit from 'p-limit'
import type { Generator } from './generators/types.ts'
import type { Exclude, Include, OperationSchemas, Override } from './types.ts'
import { buildOperation, buildOperations } from './utils.tsx'

export type OperationMethodResult<TFileMeta extends FileMetaBase> = Promise<KubbFile.File<TFileMeta> | Array<KubbFile.File<TFileMeta>> | null>

type Context<TOptions, TPluginOptions extends PluginFactoryOptions> = {
  fabric: Fabric
  oas: Oas
  exclude: Array<Exclude> | undefined
  include: Array<Include> | undefined
  override: Array<Override<TOptions>> | undefined
  contentType: contentType | undefined
  pluginManager: PluginManager
  events?: AsyncEventEmitter<KubbEvents>
  /**
   * Current plugin
   */
  plugin: Plugin<TPluginOptions>
  mode: KubbFile.Mode
  UNSTABLE_NAMING?: true
}

export class OperationGenerator<
  TPluginOptions extends PluginFactoryOptions = PluginFactoryOptions,
  TFileMeta extends FileMetaBase = FileMetaBase,
> extends BaseGenerator<TPluginOptions['resolvedOptions'], Context<TPluginOptions['resolvedOptions'], TPluginOptions>> {
  getOptions(operation: Operation, method: HttpMethod): Partial<TPluginOptions['resolvedOptions']> {
    const { override = [] } = this.context
    const operationId = operation.getOperationId({ friendlyCase: true })
    const contentType = operation.getContentType()

    return (
      override.find(({ pattern, type }) => {
        switch (type) {
          case 'tag':
            return operation.getTags().some((tag) => tag.name.match(pattern))
          case 'operationId':
            return !!operationId.match(pattern)
          case 'path':
            return !!operation.path.match(pattern)
          case 'method':
            return !!method.match(pattern)
          case 'contentType':
            return !!contentType.match(pattern)
          default:
            return false
        }
      })?.options || {}
    )
  }

  #isExcluded(operation: Operation, method: HttpMethod): boolean {
    const { exclude = [] } = this.context
    const operationId = operation.getOperationId({ friendlyCase: true })
    const contentType = operation.getContentType()

    return exclude.some(({ pattern, type }) => {
      switch (type) {
        case 'tag':
          return operation.getTags().some((tag) => tag.name.match(pattern))
        case 'operationId':
          return !!operationId.match(pattern)
        case 'path':
          return !!operation.path.match(pattern)
        case 'method':
          return !!method.match(pattern)
        case 'contentType':
          return !!contentType.match(pattern)
        default:
          return false
      }
    })
  }

  #isIncluded(operation: Operation, method: HttpMethod): boolean {
    const { include = [] } = this.context
    const operationId = operation.getOperationId({ friendlyCase: true })
    const contentType = operation.getContentType()

    return include.some(({ pattern, type }) => {
      switch (type) {
        case 'tag':
          return operation.getTags().some((tag) => tag.name.match(pattern))
        case 'operationId':
          return !!operationId.match(pattern)
        case 'path':
          return !!operation.path.match(pattern)
        case 'method':
          return !!method.match(pattern)
        case 'contentType':
          return !!contentType.match(pattern)
        default:
          return false
      }
    })
  }

  getSchemas(
    operation: Operation,
    {
      resolveName = (name) => name,
    }: {
      resolveName?: (name: string) => string
    } = {},
  ): OperationSchemas {
    const operationId = operation.getOperationId({ friendlyCase: true })
    const operationName = transformers.pascalCase(operationId)

    const resolveKeys = (schema?: SchemaObject) => (schema?.properties ? Object.keys(schema.properties) : undefined)

    const pathParamsSchema = this.context.oas.getParametersSchema(operation, 'path')
    const queryParamsSchema = this.context.oas.getParametersSchema(operation, 'query')
    const headerParamsSchema = this.context.oas.getParametersSchema(operation, 'header')
    const requestSchema = this.context.oas.getRequestSchema(operation)
    const statusCodes = operation.getResponseStatusCodes().map((statusCode) => {
      const name = statusCode === 'default' ? 'error' : statusCode
      const schema = this.context.oas.getResponseSchema(operation, statusCode)
      const keys = resolveKeys(schema)

      return {
        name: this.context.UNSTABLE_NAMING
          ? resolveName(transformers.pascalCase(`${operationId} status ${name}`))
          : resolveName(transformers.pascalCase(`${operationId} ${name}`)),
        description: (operation.getResponseByStatusCode(statusCode) as OasTypes.ResponseObject)?.description,
        schema,
        operation,
        operationName,
        statusCode: name === 'error' ? undefined : Number(statusCode),
        keys,
        keysToOmit: keys?.filter((key) => (schema?.properties?.[key] as OasTypes.SchemaObject)?.writeOnly),
      }
    })

    const successful = statusCodes.filter((item) => item.statusCode?.toString().startsWith('2'))
    const errors = statusCodes.filter((item) => item.statusCode?.toString().startsWith('4') || item.statusCode?.toString().startsWith('5'))

    return {
      pathParams: pathParamsSchema
        ? {
            name: resolveName(transformers.pascalCase(`${operationId} PathParams`)),
            operation,
            operationName,
            schema: pathParamsSchema,
            keys: resolveKeys(pathParamsSchema),
          }
        : undefined,
      queryParams: queryParamsSchema
        ? {
            name: resolveName(transformers.pascalCase(`${operationId} QueryParams`)),
            operation,
            operationName,
            schema: queryParamsSchema,
            keys: resolveKeys(queryParamsSchema) || [],
          }
        : undefined,
      headerParams: headerParamsSchema
        ? {
            name: resolveName(transformers.pascalCase(`${operationId} HeaderParams`)),
            operation,
            operationName,
            schema: headerParamsSchema,
            keys: resolveKeys(headerParamsSchema),
          }
        : undefined,
      request: requestSchema
        ? {
            name: this.context.UNSTABLE_NAMING
              ? resolveName(transformers.pascalCase(`${operationId} RequestData`))
              : resolveName(transformers.pascalCase(`${operationId} ${operation.method === 'get' ? 'queryRequest' : 'mutationRequest'}`)),
            description: (operation.schema.requestBody as OasTypes.RequestBodyObject)?.description,
            operation,
            operationName,
            schema: requestSchema,
            keys: resolveKeys(requestSchema),
            keysToOmit: resolveKeys(requestSchema)?.filter((key) => (requestSchema.properties?.[key] as OasTypes.SchemaObject)?.readOnly),
          }
        : undefined,
      response: {
        name: this.context.UNSTABLE_NAMING
          ? resolveName(transformers.pascalCase(`${operationId} ResponseData`))
          : resolveName(transformers.pascalCase(`${operationId} ${operation.method === 'get' ? 'queryResponse' : 'mutationResponse'}`)),
        operation,
        operationName,
        schema: {
          oneOf: successful.map((item) => ({ ...item.schema, $ref: item.name })) || undefined,
        } as SchemaObject,
      },
      responses: successful,
      errors,
      statusCodes,
    }
  }

  async getOperations(): Promise<Array<{ path: string; method: HttpMethod; operation: Operation }>> {
    const { oas } = this.context

    const paths = oas.getPaths()

    return Object.entries(paths).flatMap(([path, methods]) =>
      Object.entries(methods)
        .map((values) => {
          const [method, operation] = values as [HttpMethod, Operation]
          if (this.#isExcluded(operation, method)) {
            return null
          }

          if (this.context.include && !this.#isIncluded(operation, method)) {
            return null
          }

          return operation ? { path, method: method as HttpMethod, operation } : null
        })
        .filter(Boolean),
    )
  }

  async build(...generators: Array<Generator<TPluginOptions>>): Promise<Array<KubbFile.File<TFileMeta>>> {
    const operations = await this.getOperations()

    // Increased parallelism for better performance
    // - generatorLimit increased from 1 to 3 to allow parallel generator processing
    // - operationLimit increased from 10 to 30 to process more operations concurrently
    const generatorLimit = pLimit(3)
    const operationLimit = pLimit(30)

    this.context.events?.emit('debug', {
      date: new Date(),
      logs: [`Building ${operations.length} operations`, `  • Generators: ${generators.length}`],
    })

    const writeTasks = generators.map((generator) =>
      generatorLimit(async () => {
        const operationTasks = operations.map(({ operation, method }) =>
          operationLimit(async () => {
            const options = this.getOptions(operation, method)

            if (generator.type === 'react') {
              await buildOperation(operation, {
                config: this.context.pluginManager.config,
                fabric: this.context.fabric,
                Component: generator.Operation,
                generator: this,
                plugin: {
                  ...this.context.plugin,
                  options: {
                    ...this.options,
                    ...options,
                  },
                },
              })

              return []
            }

            const result = await generator.operation?.({
              generator: this,
              config: this.context.pluginManager.config,
              operation,
              plugin: {
                ...this.context.plugin,
                options: {
                  ...this.options,
                  ...options,
                },
              },
            })

            return result ?? []
          }),
        )

        const operationResults = await Promise.all(operationTasks)
        const opResultsFlat = operationResults.flat()

        if (generator.type === 'react') {
          await buildOperations(
            operations.map((op) => op.operation),
            {
              fabric: this.context.fabric,
              config: this.context.pluginManager.config,
              Component: generator.Operations,
              generator: this,
              plugin: this.context.plugin,
            },
          )

          return []
        }

        const operationsResult = await generator.operations?.({
          generator: this,
          config: this.context.pluginManager.config,
          operations: operations.map((op) => op.operation),
          plugin: this.context.plugin,
        })

        return [...opResultsFlat, ...(operationsResult ?? [])] as unknown as KubbFile.File<TFileMeta>
      }),
    )

    const nestedResults = await Promise.all(writeTasks)

    return nestedResults.flat()
  }
}
