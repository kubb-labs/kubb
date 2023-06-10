import { getRelativePath } from '@kubb/core'
import { OperationGenerator as Generator } from '@kubb/swagger'

import { TypeBuilder } from '../builders/index.ts'
import { pluginName } from '../plugin.ts'

import type { File, PathMode, PluginContext } from '@kubb/core'
import type { FileResolver, Oas, Operation, OperationSchemas, Resolver } from '@kubb/swagger'

type Options = {
  oas: Oas
  resolvePath: PluginContext['resolvePath']
  resolveName: PluginContext['resolveName']
  mode: PathMode
  enumType: 'enum' | 'asConst' | 'asPascalConst'
}

export class OperationGenerator extends Generator<Options> {
  resolve(operation: Operation): Resolver {
    const { resolvePath, resolveName } = this.options

    const name = resolveName({ name: operation.getOperationId(), pluginName })
    const fileName = `${name}.ts`
    const filePath = resolvePath({ fileName, pluginName, options: { tag: operation.getTags()[0]?.name } })

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
    const { resolvePath, mode, resolveName, oas, enumType } = this.options

    const type = this.resolve(operation)

    const fileResolver: FileResolver = (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const root = resolvePath({ fileName: type.fileName, pluginName, options: { tag: operation.getTags()[0]?.name } })
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = resolvePath({
        fileName: `${name}.ts`,
        pluginName,
      })

      return getRelativePath(root, resolvedTypeId)
    }

    const source = new TypeBuilder(oas)
      .add(schemas.pathParams)
      .add(schemas.queryParams)
      .add(schemas.response)
      .add(schemas.errors)
      .configure({ fileResolver: mode === 'file' ? undefined : fileResolver, withJSDocs: true, resolveName, enumType })
      .print()

    return {
      path: type.filePath,
      fileName: type.fileName,
      source,
    }
  }

  async post(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { resolvePath, mode, resolveName, oas, enumType } = this.options

    const type = this.resolve(operation)

    const fileResolver: FileResolver = (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const root = resolvePath({ fileName: type.fileName, pluginName, options: { tag: operation.getTags()[0]?.name } })
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = resolvePath({
        fileName: `${name}.ts`,
        pluginName,
      })

      return getRelativePath(root, resolvedTypeId)
    }

    const source = new TypeBuilder(oas)
      .add(schemas.pathParams)
      .add(schemas.queryParams)
      .add(schemas.request)
      .add(schemas.response)
      .add(schemas.errors)
      .configure({ fileResolver: mode === 'file' ? undefined : fileResolver, withJSDocs: true, resolveName, enumType })
      .print()

    return {
      path: type.filePath,
      fileName: type.fileName,
      source,
    }
  }

  async put(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { resolvePath, mode, resolveName, oas, enumType } = this.options

    const type = this.resolve(operation)

    const fileResolver: FileResolver = (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const root = resolvePath({ fileName: type.fileName, pluginName, options: { tag: operation.getTags()[0]?.name } })
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = resolvePath({
        fileName: `${name}.ts`,
        pluginName,
      })

      return getRelativePath(root, resolvedTypeId)
    }

    const source = new TypeBuilder(oas)
      .add(schemas.pathParams)
      .add(schemas.queryParams)
      .add(schemas.request)
      .add(schemas.response)
      .add(schemas.errors)
      .configure({ fileResolver: mode === 'file' ? undefined : fileResolver, withJSDocs: true, resolveName, enumType })
      .print()

    return {
      path: type.filePath,
      fileName: type.fileName,
      source,
    }
  }

  async delete(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { resolvePath, mode, resolveName, oas, enumType } = this.options

    const type = this.resolve(operation)

    const fileResolver: FileResolver = (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const root = resolvePath({ fileName: type.fileName, pluginName, options: { tag: operation.getTags()[0]?.name } })
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = resolvePath({
        fileName: `${name}.ts`,
        pluginName,
      })

      return getRelativePath(root, resolvedTypeId)
    }

    const source = new TypeBuilder(oas)
      .add(schemas.pathParams)
      .add(schemas.request)
      .add(schemas.queryParams)
      .add(schemas.response)
      .add(schemas.errors)
      .configure({ fileResolver: mode === 'file' ? undefined : fileResolver, withJSDocs: true, resolveName, enumType })
      .print()

    return {
      path: type.filePath,
      fileName: type.fileName,
      source,
    }
  }
}
