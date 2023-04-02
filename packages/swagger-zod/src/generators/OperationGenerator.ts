import type { File, FileManager, PathMode, PluginContext } from '@kubb/core'
import { getRelativePath } from '@kubb/core'
import { OperationGenerator as Generator } from '@kubb/swagger'
import type { FileResolver, Oas, Operation, OperationSchemas } from '@kubb/swagger'

import { ZodBuilder } from '../builders'
import { pluginName } from '../plugin'

import type { Api } from '../types'

type Options = {
  oas: Oas
  resolvePath: Api['resolvePath']
  resolveName: PluginContext['resolveName']
  mode: PathMode
  fileManager: FileManager
  directory: string
}

export class OperationGenerator extends Generator<Options> {
  async all(): Promise<File | null> {
    return null
  }

  async get(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { resolvePath, directory, mode, resolveName, oas } = this.options

    const typeName = `${resolveName({ name: operation.getOperationId(), pluginName })}.ts`
    const typeFilePath = await resolvePath(typeName, directory)

    const fileResolver: FileResolver = async (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const filePath = await resolvePath(mode === 'file' ? '' : typeName, directory)
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = await resolvePath(`${name}.ts`, directory)

      return getRelativePath(filePath, resolvedTypeId)
    }

    const typeSource = await new ZodBuilder(oas)
      .add(schemas.pathParams)
      .add(schemas.queryParams)
      .add(schemas.response)
      .configure({ fileResolver, resolveName, withJSDocs: true })
      .print()

    if (typeFilePath) {
      return {
        path: typeFilePath,
        fileName: typeName,
        source: typeSource,
        imports: [
          {
            name: 'z',
            path: 'zod',
          },
        ],
      }
    }

    return null
  }

  async post(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { resolvePath, directory, mode, resolveName, oas } = this.options

    const typeName = `${resolveName({ name: operation.getOperationId(), pluginName })}.ts`
    const typeFilePath = await resolvePath(typeName, directory)

    const fileResolver: FileResolver = async (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const filePath = await resolvePath(mode === 'file' ? '' : typeName, directory)
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = await resolvePath(`${name}.ts`, directory)

      return getRelativePath(filePath, resolvedTypeId)
    }

    const typeSource = await new ZodBuilder(oas)
      .add(schemas.pathParams)
      .add(schemas.queryParams)
      .add(schemas.request)
      .add(schemas.response)
      .configure({ fileResolver, resolveName, withJSDocs: true })
      .print()

    if (typeFilePath) {
      return {
        path: typeFilePath,
        fileName: typeName,
        source: typeSource,
        imports: [
          {
            name: 'z',
            path: 'zod',
          },
        ],
      }
    }

    return null
  }

  async put(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { resolvePath, directory, mode, resolveName, oas } = this.options

    const typeName = `${resolveName({ name: operation.getOperationId(), pluginName })}.ts`
    const typeFilePath = await resolvePath(typeName, directory)

    const fileResolver: FileResolver = async (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const filePath = await resolvePath(mode === 'file' ? '' : typeName, directory)
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = await resolvePath(`${name}.ts`, directory)

      return getRelativePath(filePath, resolvedTypeId)
    }

    const typeSource = await new ZodBuilder(oas)
      .add(schemas.pathParams)
      .add(schemas.queryParams)
      .add(schemas.request)
      .add(schemas.response)
      .configure({ fileResolver, resolveName, withJSDocs: true })
      .print()

    if (typeFilePath) {
      return {
        path: typeFilePath,
        fileName: typeName,
        source: typeSource,
        imports: [
          {
            name: 'z',
            path: 'zod',
          },
        ],
      }
    }

    return null
  }

  async delete(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { resolvePath, directory, mode, resolveName, oas } = this.options

    const typeName = `${resolveName({ name: operation.getOperationId(), pluginName })}.ts`
    const typeFilePath = await resolvePath(typeName, directory)

    const fileResolver: FileResolver = async (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const filePath = await resolvePath(mode === 'file' ? '' : typeName, directory)
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = await resolvePath(`${name}.ts`, directory)

      return getRelativePath(filePath, resolvedTypeId)
    }

    const typeSource = await new ZodBuilder(oas)
      .add(schemas.pathParams)
      .add(schemas.request)
      .add(schemas.response)
      .configure({ fileResolver, resolveName, withJSDocs: true })
      .print()

    if (typeFilePath) {
      return {
        path: typeFilePath,
        fileName: typeName,
        source: typeSource,
        imports: [
          {
            name: 'z',
            path: 'zod',
          },
        ],
      }
    }

    return null
  }
}
