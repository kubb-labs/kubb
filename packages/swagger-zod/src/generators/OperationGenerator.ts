import type { File, FileManager, PathMode, PluginContext } from '@kubb/core'
import { getRelativePath } from '@kubb/core'
import { OperationGenerator as Generator } from '@kubb/swagger'
import type { FileResolver, Oas, Operation, OperationSchemas, Resolver } from '@kubb/swagger'

import { ZodBuilder } from '../builders'
import { pluginName } from '../plugin'

type Options = {
  oas: Oas
  resolvePath: PluginContext['resolvePath']
  resolveName: PluginContext['resolveName']
  mode: PathMode
  fileManager: FileManager
}

export class OperationGenerator extends Generator<Options> {
  async resolve(operation: Operation): Promise<Resolver> {
    const { resolvePath, resolveName } = this.options

    const name = resolveName({ name: operation.getOperationId(), pluginName })
    const fileName = `${name}.ts`
    const filePath = await resolvePath({ fileName, pluginName, options: { tag: operation.getTags()[0]?.name } })

    if (!filePath || !name) {
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

  async get(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { resolvePath, mode, resolveName, oas } = this.options

    const zod = await this.resolve(operation)

    const fileResolver: FileResolver = async (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const filePath = await resolvePath({ fileName: zod.name, pluginName, options: { tag: operation.getTags()[0]?.name } })
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = await resolvePath({
        fileName: `${name}.ts`,
        pluginName,
      })

      return getRelativePath(filePath, resolvedTypeId)
    }

    const source = await new ZodBuilder(oas)
      .add(schemas.pathParams)
      .add(schemas.queryParams)
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
          name: 'z',
          path: 'zod',
        },
      ],
    }
  }

  async post(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { resolvePath, mode, resolveName, oas } = this.options

    const zod = await this.resolve(operation)

    const fileResolver: FileResolver = async (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const filePath = await resolvePath({ fileName: zod.name, pluginName, options: { tag: operation.getTags()[0]?.name } })
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = await resolvePath({
        fileName: `${name}.ts`,
        pluginName,
      })

      return getRelativePath(filePath, resolvedTypeId)
    }

    const source = await new ZodBuilder(oas)
      .add(schemas.pathParams)
      .add(schemas.queryParams)
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
          name: 'z',
          path: 'zod',
        },
      ],
    }
  }

  async put(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { resolvePath, mode, resolveName, oas } = this.options

    const zod = await this.resolve(operation)

    const fileResolver: FileResolver = async (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const filePath = await resolvePath({ fileName: zod.name, pluginName, options: { tag: operation.getTags()[0]?.name } })
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = await resolvePath({
        fileName: `${name}.ts`,
        pluginName,
      })

      return getRelativePath(filePath, resolvedTypeId)
    }

    const source = await new ZodBuilder(oas)
      .add(schemas.pathParams)
      .add(schemas.queryParams)
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
          name: 'z',
          path: 'zod',
        },
      ],
    }
  }

  async delete(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { resolvePath, mode, resolveName, oas } = this.options

    const zod = await this.resolve(operation)

    const fileResolver: FileResolver = async (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const filePath = await resolvePath({ fileName: zod.name, pluginName, options: { tag: operation.getTags()[0]?.name } })
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = await resolvePath({
        fileName: `${name}.ts`,
        pluginName,
      })

      return getRelativePath(filePath, resolvedTypeId)
    }

    const source = await new ZodBuilder(oas)
      .add(schemas.pathParams)
      .add(schemas.request)
      .add(schemas.queryParams)
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
          name: 'z',
          path: 'zod',
        },
      ],
    }
  }
}
