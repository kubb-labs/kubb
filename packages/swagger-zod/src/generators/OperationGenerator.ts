import { getRelativePath } from '@kubb/core'
import { OperationGenerator as Generator, resolve } from '@kubb/swagger'

import { ZodBuilder } from '../builders/index.ts'
import { pluginName } from '../plugin.ts'

import type { KubbFile, PluginContext } from '@kubb/core'
import type { ContentType, FileResolver, Oas, Operation, OperationSchemas, Resolver, SkipBy } from '@kubb/swagger'
import type { FileMeta } from '../types.ts'

type Options = {
  oas: Oas
  contentType?: ContentType
  skipBy?: SkipBy[]
  resolvePath: PluginContext['resolvePath']
  resolveName: PluginContext['resolveName']
  mode: KubbFile.Mode
}

export class OperationGenerator extends Generator<Options> {
  resolve(operation: Operation): Resolver {
    const { resolvePath, resolveName } = this.options

    return resolve({
      operation,
      resolveName,
      resolvePath,
      pluginName,
    })
  }

  async all(): Promise<KubbFile.File | null> {
    return null
  }

  async get(operation: Operation, schemas: OperationSchemas): Promise<KubbFile.File<FileMeta> | null> {
    const { resolvePath, mode, resolveName, oas } = this.options

    const zod = this.resolve(operation)

    const fileResolver: FileResolver = (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const root = resolvePath({ fileName: zod.name, pluginName, options: { tag: operation.getTags()[0]?.name } })
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = resolvePath({
        fileName: `${name}.ts`,
        pluginName,
      })

      return getRelativePath(root, resolvedTypeId)
    }

    const source = new ZodBuilder(oas)
      .add(schemas.pathParams)
      .add(schemas.queryParams)
      .add(schemas.headerParams)
      .add(schemas.response)
      .add(schemas.errors)
      .configure({ fileResolver: mode === 'file' ? undefined : fileResolver, withJSDocs: true, resolveName })
      .print()

    return {
      path: zod.filePath,
      baseName: zod.fileName,
      source,
      imports: [
        {
          name: ['z'],
          path: 'zod',
        },
      ],
      meta: {
        pluginName,
        tag: operation.getTags()[0]?.name,
      },
    }
  }

  async post(operation: Operation, schemas: OperationSchemas): Promise<KubbFile.File<FileMeta> | null> {
    const { resolvePath, mode, resolveName, oas } = this.options

    const zod = this.resolve(operation)

    const fileResolver: FileResolver = (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const root = resolvePath({ fileName: zod.name, pluginName, options: { tag: operation.getTags()[0]?.name } })
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = resolvePath({
        fileName: `${name}.ts`,
        pluginName,
      })

      return getRelativePath(root, resolvedTypeId)
    }

    const source = new ZodBuilder(oas)
      .add(schemas.pathParams)
      .add(schemas.queryParams)
      .add(schemas.headerParams)
      .add(schemas.request)
      .add(schemas.response)
      .add(schemas.errors)
      .configure({ fileResolver: mode === 'file' ? undefined : fileResolver, withJSDocs: true, resolveName })
      .print()

    return {
      path: zod.filePath,
      baseName: zod.fileName,
      source,
      imports: [
        {
          name: ['z'],
          path: 'zod',
        },
      ],
      meta: {
        pluginName,
        tag: operation.getTags()[0]?.name,
      },
    }
  }

  async put(operation: Operation, schemas: OperationSchemas): Promise<KubbFile.File<FileMeta> | null> {
    return this.post(operation, schemas)
  }
  async patch(operation: Operation, schemas: OperationSchemas): Promise<KubbFile.File<FileMeta> | null> {
    return this.post(operation, schemas)
  }
  async delete(operation: Operation, schemas: OperationSchemas): Promise<KubbFile.File<FileMeta> | null> {
    return this.post(operation, schemas)
  }
}
