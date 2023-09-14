import { getRelativePath } from '@kubb/core'
import { OperationGenerator as Generator } from '@kubb/swagger'

import { ZodBuilder } from '../builders/index.ts'
import { pluginName } from '../plugin.ts'

import type { File, PathMode, PluginContext } from '@kubb/core'
import type { ContentType, FileResolver, Oas, Operation, OperationSchemas, Resolver, SkipBy } from '@kubb/swagger'
import type { FileMeta } from '../types.ts'

type Options = {
  oas: Oas
  contentType?: ContentType
  skipBy?: SkipBy[]
  resolvePath: PluginContext['resolvePath']
  resolveName: PluginContext['resolveName']
  mode: PathMode
}

export class OperationGenerator extends Generator<Options> {
  resolve(operation: Operation): Resolver {
    const { resolvePath, resolveName } = this.options

    const name = resolveName({ name: operation.getOperationId(), pluginName })

    if (!name) {
      throw new Error('Name should be defined')
    }

    const fileName = `${name}.ts`
    const filePath = resolvePath({ fileName, pluginName, options: { tag: operation.getTags()[0]?.name } })

    if (!filePath) {
      throw new Error('Filepath should be defined')
    }

    return {
      name,
      fileName,
      filePath,
    }
  }

  async all(): Promise<File | null> {
    return null
  }

  async get(operation: Operation, schemas: OperationSchemas): Promise<File<FileMeta> | null> {
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
      fileName: zod.fileName,
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

  async post(operation: Operation, schemas: OperationSchemas): Promise<File<FileMeta> | null> {
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
      fileName: zod.fileName,
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

  async put(operation: Operation, schemas: OperationSchemas): Promise<File<FileMeta> | null> {
    return this.post(operation, schemas)
  }
  async patch(operation: Operation, schemas: OperationSchemas): Promise<File<FileMeta> | null> {
    return this.post(operation, schemas)
  }
  async delete(operation: Operation, schemas: OperationSchemas): Promise<File<FileMeta> | null> {
    return this.post(operation, schemas)
  }
}
