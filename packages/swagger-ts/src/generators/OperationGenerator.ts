import { getRelativePath } from '@kubb/core'
import { OperationGenerator as Generator, resolve } from '@kubb/swagger'

import { TypeBuilder } from '../builders/index.ts'
import { pluginName } from '../plugin.ts'

import type { KubbFile } from '@kubb/core'
import type { FileResolver, Operation, OperationSchema, OperationSchemas, Resolver } from '@kubb/swagger'
import type { FileMeta, Options as PluginOptions } from '../types.ts'

type Options = {
  mode: KubbFile.Mode
  enumType: NonNullable<PluginOptions['enumType']>
  dateType: NonNullable<PluginOptions['dateType']>
  optionalType: NonNullable<PluginOptions['optionalType']>
}

export class OperationGenerator extends Generator<Options> {
  resolve(operation: Operation): Resolver {
    const { pluginManager } = this.context

    return resolve({
      operation,
      resolveName: pluginManager.resolveName,
      resolvePath: pluginManager.resolvePath,
      pluginName,
    })
  }

  async all(): Promise<KubbFile.File | null> {
    return null
  }

  #getCombinedSchema(name: string, schemas: OperationSchemas): OperationSchema {
    const properties: OperationSchema['schema']['properties'] = {
      'response': {
        '$ref': `#/components/schemas/${schemas.response.name}`,
      },
    }

    if (schemas.request) {
      properties['request'] = {
        '$ref': `#/components/schemas/${schemas.request.name}`,
      }
    }

    if (schemas.pathParams) {
      properties['pathParams'] = {
        '$ref': `#/components/schemas/${schemas.pathParams.name}`,
      }
    }

    if (schemas.queryParams) {
      properties['queryParams'] = {
        '$ref': `#/components/schemas/${schemas.queryParams.name}`,
      }
    }

    if (schemas.headerParams) {
      properties['headerParams'] = {
        '$ref': `#/components/schemas/${schemas.headerParams.name}`,
      }
    }

    if (schemas.errors) {
      properties['errors'] = {
        'anyOf': schemas.errors.map(error => {
          return {
            '$ref': `#/components/schemas/${error.name}`,
          }
        }),
      }
    }

    return {
      'name': `${name}`,
      'operationName': `${name}`,
      'schema': {
        'type': 'object',
        'required': [
          'request',
          'response',
          'pathParams',
          'queryParams',
          'headerParams',
          'errors',
        ],
        'properties': properties,
      },
    }
  }

  async get(operation: Operation, schemas: OperationSchemas, options: Options): Promise<KubbFile.File<FileMeta> | null> {
    const { mode, enumType, dateType, optionalType } = options
    const { pluginManager } = this.context

    const type = this.resolve(operation)

    const fileResolver: FileResolver = (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const root = pluginManager.resolvePath({ baseName: type.baseName, pluginName, options: { tag: operation.getTags()[0]?.name } })
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = pluginManager.resolvePath({
        baseName: `${name}.ts`,
        pluginName,
      })

      return getRelativePath(root, resolvedTypeId)
    }

    const source = new TypeBuilder({
      fileResolver: mode === 'file' ? undefined : fileResolver,
      withJSDocs: true,
      resolveName: pluginManager.resolveName,
      enumType,
      optionalType,
      dateType,
    })
      .add(schemas.pathParams)
      .add(schemas.queryParams)
      .add(schemas.headerParams)
      .add(schemas.response)
      .add(schemas.errors)
      .add(this.#getCombinedSchema(type.name, schemas))
      .configure()
      .print()

    return {
      path: type.path,
      baseName: type.baseName,
      source,
      meta: {
        pluginName,
        tag: operation.getTags()[0]?.name,
      },
    }
  }

  async post(operation: Operation, schemas: OperationSchemas, options: Options): Promise<KubbFile.File<FileMeta> | null> {
    const { mode, enumType, dateType, optionalType } = options
    const { pluginManager } = this.context

    const type = this.resolve(operation)

    const fileResolver: FileResolver = (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const root = pluginManager.resolvePath({ baseName: type.baseName, pluginName, options: { tag: operation.getTags()[0]?.name } })
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = pluginManager.resolvePath({
        baseName: `${name}.ts`,
        pluginName,
      })

      return getRelativePath(root, resolvedTypeId)
    }

    const source = new TypeBuilder({
      fileResolver: mode === 'file' ? undefined : fileResolver,
      withJSDocs: true,
      resolveName: pluginManager.resolveName,
      enumType,
      optionalType,
      dateType,
    })
      .add(schemas.pathParams)
      .add(schemas.queryParams)
      .add(schemas.headerParams)
      .add(schemas.request)
      .add(schemas.response)
      .add(schemas.errors)
      .add(this.#getCombinedSchema(type.name, schemas))
      .configure()
      .print()

    return {
      path: type.path,
      baseName: type.baseName,
      source,
      meta: {
        pluginName,
        tag: operation.getTags()[0]?.name,
      },
    }
  }

  async put(operation: Operation, schemas: OperationSchemas, options: Options): Promise<KubbFile.File<FileMeta> | null> {
    return this.post(operation, schemas, options)
  }
  async patch(operation: Operation, schemas: OperationSchemas, options: Options): Promise<KubbFile.File<FileMeta> | null> {
    return this.post(operation, schemas, options)
  }
  async delete(operation: Operation, schemas: OperationSchemas, options: Options): Promise<KubbFile.File<FileMeta> | null> {
    return this.post(operation, schemas, options)
  }
}
