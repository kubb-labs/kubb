import type { File, FileManager, PathMode } from '@kubb/core'
import { getRelativePath } from '@kubb/core'
import { OperationGenerator as Generator } from '@kubb/swagger'

import { TypeBuilder } from '../builders'

import type { FileResolver } from './TypeGenerator'
import type Oas from 'oas'
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
  async getGet(path: string): Promise<File | null> {
    const { resolveId, directory, mode, nameResolver, oas } = this.options

    const operation = oas.operation(path, 'get')

    if (!operation.schema.operationId) return null

    const schemas = this.getSchemas(operation)
    const typeName = `${nameResolver(operation.getOperationId())}.ts`
    const typeFilePath = await resolveId(typeName, directory)

    const fileResolver: FileResolver = async (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const filePath = await resolveId(mode === 'file' ? '' : typeName, directory)
      // refs import, will always been created with the swaggerTypescript plugin, our global type
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

  async getPost(path: string): Promise<File | null> {
    const { resolveId, directory, mode, nameResolver, oas } = this.options

    const operation = oas.operation(path, 'post')

    if (!operation.schema.operationId) return null

    const schemas = this.getSchemas(operation)
    const typeName = `${nameResolver(operation.getOperationId())}.ts`
    const typeFilePath = await resolveId(typeName, directory)

    const fileResolver: FileResolver = async (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const filePath = await resolveId(mode === 'file' ? '' : typeName, directory)
      // refs import, will always been created with the swaggerTypescript plugin, our global type
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

  async getPut(path: string): Promise<File | null> {
    const { resolveId, directory, mode, nameResolver, oas } = this.options

    const operation = oas.operation(path, 'put')

    if (!operation.schema.operationId) return null

    const schemas = this.getSchemas(operation)
    const typeName = `${nameResolver(operation.getOperationId())}.ts`
    const typeFilePath = await resolveId(typeName, directory)

    const fileResolver: FileResolver = async (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const filePath = await resolveId(mode === 'file' ? '' : typeName, directory)
      // refs import, will always been created with the swaggerTypescript plugin, our global type
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

  async getDelete(path: string): Promise<File | null> {
    const { resolveId, directory, mode, nameResolver, oas } = this.options

    const operation = oas.operation(path, 'delete')

    if (!operation.schema.operationId) return null

    const schemas = this.getSchemas(operation)
    const typeName = `${nameResolver(operation.getOperationId())}.ts`
    const typeFilePath = await resolveId(typeName, directory)

    const fileResolver: FileResolver = async (name) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const filePath = await resolveId(mode === 'file' ? '' : typeName, directory)
      // refs import, will always been created with the swaggerTypescript plugin, our global type
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

  async build() {
    return this.buildOperations({
      fileManager: this.options.fileManager,
      oas: this.options.oas,
    })
  }
}
