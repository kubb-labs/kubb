import { getRelativePath } from '@kubb/core/utils'
import { OperationGenerator as Generator, resolve } from '@kubb/swagger'

import { ZodBuilder } from '../builders/index.ts'

import type { KubbFile } from '@kubb/core'
import type { FileResolver, Operation, OperationSchemas, Resolver } from '@kubb/swagger'
import type { FileMeta, PluginOptions } from '../types.ts'

// eslint-disable-next-line @typescript-eslint/ban-types
type Options = {}

export class OperationGenerator extends Generator<Options, PluginOptions> {
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

  async get(operation: Operation, schemas: OperationSchemas, _options: Options): Promise<KubbFile.File<FileMeta> | null> {
    const { pluginManager, mode, plugin, oas } = this.context

    const zod = this.resolve(operation)

    const fileResolver: FileResolver = (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const root = pluginManager.resolvePath({ baseName: zod.name, pluginKey: plugin.key, options: { tag: operation.getTags()[0]?.name } })
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = pluginManager.resolvePath({
        baseName: `${name}.ts`,
        pluginKey: plugin.key,
      })

      return getRelativePath(root, resolvedTypeId)
    }

    const source = new ZodBuilder({ fileResolver: mode === 'file' ? undefined : fileResolver, withJSDocs: true, resolveName: pluginManager.resolveName, oas })
      .add(schemas.pathParams)
      .add(schemas.queryParams)
      .add(schemas.headerParams)
      .add(schemas.response)
      .add(schemas.errors)
      .configure()
      .print()

    return {
      path: zod.path,
      baseName: zod.baseName,
      source,
      imports: [
        {
          name: ['z'],
          path: 'zod',
        },
      ],
      meta: {
        pluginKey: plugin.key,
        tag: operation.getTags()[0]?.name,
      },
    }
  }

  async post(operation: Operation, schemas: OperationSchemas, _options: Options): Promise<KubbFile.File<FileMeta> | null> {
    const { pluginManager, mode, plugin, oas } = this.context

    const zod = this.resolve(operation)

    const fileResolver: FileResolver = (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const root = pluginManager.resolvePath({ baseName: zod.name, pluginKey: plugin.key, options: { tag: operation.getTags()[0]?.name } })
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = pluginManager.resolvePath({
        baseName: `${name}.ts`,
        pluginKey: plugin.key,
      })

      return getRelativePath(root, resolvedTypeId)
    }

    const source = new ZodBuilder({ fileResolver: mode === 'file' ? undefined : fileResolver, withJSDocs: true, resolveName: pluginManager.resolveName, oas })
      .add(schemas.pathParams)
      .add(schemas.queryParams)
      .add(schemas.headerParams)
      .add(schemas.request)
      .add(schemas.response)
      .add(schemas.errors)
      .configure()
      .print()

    return {
      path: zod.path,
      baseName: zod.baseName,
      source,
      imports: [
        {
          name: ['z'],
          path: 'zod',
        },
      ],
      meta: {
        pluginKey: plugin.key,
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
