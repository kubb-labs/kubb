import { getRelativePath } from '@kubb/core/utils'
import { OperationGenerator as Generator, resolve } from '@kubb/swagger'

import { FakerBuilder } from '../builders/index.ts'

import type { KubbFile } from '@kubb/core'
import type { FileResolver, Operation, OperationMethodResult, OperationSchemas, Resolver } from '@kubb/swagger'
import type { FileMeta, PluginOptions } from '../types.ts'

export class OperationGenerator extends Generator<PluginOptions['resolvedOptions'], PluginOptions> {
  resolve(operation: Operation): Resolver {
    const { pluginManager, plugin } = this.context

    return resolve({
      operation,
      resolveName: pluginManager.resolveName,
      resolvePath: pluginManager.resolvePath,
      pluginKey: plugin.key,
    })
  }

  async all(): Promise<KubbFile.File | null> {
    return null
  }

  async get(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    const { mode, pluginManager, plugin, oas } = this.context

    const faker = this.resolve(operation)

    const fileResolver: FileResolver = (name, ref) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const root = pluginManager.resolvePath({ baseName: faker.name, pluginKey: plugin.key, options: { tag: operation.getTags()[0]?.name } })
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = pluginManager.resolvePath({
        baseName: `${name}.ts`,
        pluginKey: ref.pluginKey || plugin.key,
        options: ref.pluginKey ? { tag: operation.getTags()[0]?.name } : undefined,
      })

      return getRelativePath(root, resolvedTypeId)
    }

    const source = new FakerBuilder({
      fileResolver: mode === 'file' ? undefined : fileResolver,
      ...options,
    }, { oas, pluginManager })
      .add(schemas.pathParams)
      .add(schemas.queryParams)
      .add(schemas.headerParams)
      .add(schemas.response)
      .add(schemas.errors)
      .configure()
      .print()

    return {
      path: faker.path,
      baseName: faker.baseName,
      source,
      imports: [
        {
          name: ['faker'],
          path: '@faker-js/faker',
        },
      ],
      meta: {
        pluginKey: plugin.key,
        tag: operation.getTags()[0]?.name,
      },
    }
  }

  async post(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    const { mode, pluginManager, plugin, oas } = this.context

    const faker = this.resolve(operation)

    const fileResolver: FileResolver = (name, ref) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const root = pluginManager.resolvePath({ baseName: faker.name, pluginKey: plugin.key, options: { tag: operation.getTags()[0]?.name } })
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = pluginManager.resolvePath({
        baseName: `${name}.ts`,
        pluginKey: ref.pluginKey || plugin.key,
        options: ref.pluginKey ? { tag: operation.getTags()[0]?.name } : undefined,
      })

      return getRelativePath(root, resolvedTypeId)
    }

    const source = new FakerBuilder({
      fileResolver: mode === 'file' ? undefined : fileResolver,
      ...options,
    }, { oas, pluginManager })
      .add(schemas.pathParams)
      .add(schemas.queryParams)
      .add(schemas.headerParams)
      .add(schemas.request)
      .add(schemas.response)
      .add(schemas.errors)
      .configure()
      .print()

    return {
      path: faker.path,
      baseName: faker.baseName,
      source,
      imports: [
        {
          name: ['faker'],
          path: '@faker-js/faker',
        },
      ],
      meta: {
        pluginKey: plugin.key,
        tag: operation.getTags()[0]?.name,
      },
    }
  }

  async put(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    return this.post(operation, schemas, options)
  }
  async patch(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    return this.post(operation, schemas, options)
  }
  async delete(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    return this.post(operation, schemas, options)
  }
}
