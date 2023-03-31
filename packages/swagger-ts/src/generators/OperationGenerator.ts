import type { File, FileManager, PathMode } from '@kubb/core'
import { getRelativePath } from '@kubb/core'
import { OperationGenerator as Generator } from '@kubb/swagger'
import type { FileResolver, Oas, Operation, OperationSchemas } from '@kubb/swagger'

import { TypeBuilder } from '../builders'

import type { Api } from '../types'

type Options = {
  oas: Oas
  resolveId: Api['resolveId']
  mode: PathMode
  fileManager: FileManager
  nameResolver: (name: string) => string
  directory: string
}

export class OperationGenerator extends Generator<Options> {
  async all(): Promise<File | null> {
    return null
  }

  async get(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { resolveId, directory, mode, nameResolver, oas } = this.options

    const typeName = `${nameResolver(operation.getOperationId())}.ts`
    const typeFilePath = await resolveId(typeName, directory)

    const fileResolver: FileResolver = async (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const filePath = await resolveId(mode === 'file' ? '' : typeName, directory)
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = await resolveId(`${name}.ts`, directory)

      return getRelativePath(filePath, resolvedTypeId)
    }

    const typeSource = await new TypeBuilder(oas)
      .add(schemas.pathParams)
      .add(schemas.queryParams)
      .add(schemas.response)
      .configure({ fileResolver, withJSDocs: true })
      .print()

    if (typeFilePath) {
      return {
        path: typeFilePath,
        fileName: typeName,
        source: typeSource,
      }
    }

    return null
  }

  async post(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { resolveId, directory, mode, nameResolver, oas } = this.options

    const typeName = `${nameResolver(operation.getOperationId())}.ts`
    const typeFilePath = await resolveId(typeName, directory)

    const fileResolver: FileResolver = async (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const filePath = await resolveId(mode === 'file' ? '' : typeName, directory)
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = await resolveId(`${name}.ts`, directory)

      return getRelativePath(filePath, resolvedTypeId)
    }

    const typeSource = await new TypeBuilder(oas)
      .add(schemas.pathParams)
      .add(schemas.queryParams)
      .add(schemas.request)
      .add(schemas.response)
      .configure({ fileResolver, withJSDocs: true })
      .print()

    if (typeFilePath) {
      return {
        path: typeFilePath,
        fileName: typeName,
        source: typeSource,
      }
    }

    return null
  }

  async put(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { resolveId, directory, mode, nameResolver, oas } = this.options

    const typeName = `${nameResolver(operation.getOperationId())}.ts`
    const typeFilePath = await resolveId(typeName, directory)

    const fileResolver: FileResolver = async (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const filePath = await resolveId(mode === 'file' ? '' : typeName, directory)
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = await resolveId(`${name}.ts`, directory)

      return getRelativePath(filePath, resolvedTypeId)
    }

    const typeSource = await new TypeBuilder(oas)
      .add(schemas.pathParams)
      .add(schemas.queryParams)
      .add(schemas.request)
      .add(schemas.response)
      .configure({ fileResolver, withJSDocs: true })
      .print()

    if (typeFilePath) {
      return {
        path: typeFilePath,
        fileName: typeName,
        source: typeSource,
      }
    }

    return null
  }

  async delete(operation: Operation, schemas: OperationSchemas): Promise<File | null> {
    const { resolveId, directory, mode, nameResolver, oas } = this.options

    const typeName = `${nameResolver(operation.getOperationId())}.ts`
    const typeFilePath = await resolveId(typeName, directory)

    const fileResolver: FileResolver = async (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const filePath = await resolveId(mode === 'file' ? '' : typeName, directory)
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = await resolveId(`${name}.ts`, directory)

      return getRelativePath(filePath, resolvedTypeId)
    }

    const typeSource = await new TypeBuilder(oas)
      .add(schemas.pathParams)
      .add(schemas.request)
      .add(schemas.response)
      .configure({ fileResolver, withJSDocs: true })
      .print()

    if (typeFilePath) {
      return {
        path: typeFilePath,
        fileName: typeName,
        source: typeSource,
      }
    }

    return null
  }
}
