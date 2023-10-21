import { getRelativePath } from '@kubb/core'
import { OperationGenerator as Generator, resolve } from '@kubb/swagger'

import { TypeBuilder } from '../builders/index.ts'

import type { KubbFile } from '@kubb/core'
import type { FileResolver, Operation, OperationSchemas, Resolver } from '@kubb/swagger'
import type { FileMeta, Options as PluginOptions } from '../types.ts'

type Options = {
  mode: KubbFile.Mode
  enumType: NonNullable<PluginOptions['enumType']>
  dateType: NonNullable<PluginOptions['dateType']>
  optionalType: NonNullable<PluginOptions['optionalType']>
}

export class OperationGenerator extends Generator<Options> {
  resolve(operation: Operation): Resolver {
    const { pluginManager, plugin } = this.context

    return resolve({
      operation,
      resolveName: pluginManager.resolveName,
      resolvePath: pluginManager.resolvePath,
      pluginKey: plugin?.key,
    })
  }

  async all(): Promise<KubbFile.File | null> {
    return null
  }

  async get(operation: Operation, schemas: OperationSchemas, options: Options): Promise<KubbFile.File<FileMeta> | null> {
    const { mode, enumType, dateType, optionalType } = options
    const { pluginManager, plugin } = this.context

    const type = this.resolve(operation)

    const fileResolver: FileResolver = (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const root = pluginManager.resolvePath({ baseName: type.baseName, pluginKey: plugin?.key, options: { tag: operation.getTags()[0]?.name } })
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = pluginManager.resolvePath({
        baseName: `${name}.ts`,
        pluginKey: plugin?.key,
      })

      return getRelativePath(root, resolvedTypeId)
    }

    const source = new TypeBuilder({
      fileResolver: mode === 'file' ? undefined : fileResolver,
      withJSDocs: true,
      resolveName: (params) => pluginManager.resolveName({ ...params, pluginKey: plugin?.key }),
      enumType,
      optionalType,
      dateType,
    })
      .add(schemas.pathParams)
      .add(schemas.queryParams)
      .add(schemas.headerParams)
      .add(schemas.response)
      .add(schemas.errors)
      .configure()
      .print()

    return {
      path: type.path,
      baseName: type.baseName,
      source,
      meta: {
        pluginName: plugin?.name,
        tag: operation.getTags()[0]?.name,
      },
    }
  }

  async post(operation: Operation, schemas: OperationSchemas, options: Options): Promise<KubbFile.File<FileMeta> | null> {
    const { mode, enumType, dateType, optionalType } = options
    const { pluginManager, plugin } = this.context

    const type = this.resolve(operation)

    const fileResolver: FileResolver = (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const root = pluginManager.resolvePath({ baseName: type.baseName, pluginKey: plugin?.key, options: { tag: operation.getTags()[0]?.name } })
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = pluginManager.resolvePath({
        baseName: `${name}.ts`,
        pluginKey: plugin?.key,
      })

      return getRelativePath(root, resolvedTypeId)
    }

    const source = new TypeBuilder({
      fileResolver: mode === 'file' ? undefined : fileResolver,
      withJSDocs: true,
      resolveName: (params) => pluginManager.resolveName({ ...params, pluginKey: plugin?.key }),
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
      .configure()
      .print()

    return {
      path: type.path,
      baseName: type.baseName,
      source,
      meta: {
        pluginName: plugin?.name,
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
