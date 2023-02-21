import { capitalCase } from 'change-case'

import type { File, FileManager, PathMode } from '@kubb/core'
import { getRelativePath, Generator } from '@kubb/core'

import { ZodBuilder } from '../builders'

import type { FileResolver } from './ZodGenerator'
import type { Operation } from 'oas'
import type { MediaTypeObject, RequestBodyObject } from 'oas/dist/rmoas.types'
import type Oas from 'oas'
import type { OpenAPIV3 } from 'openapi-types'
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
  private getSchemas(operation: Operation) {
    // TODO create function to get schema out of paramaters
    const schemaOperationPathParameters = operation.getParameters().filter((v) => v.in === 'path' || v.in === 'query')
    const schemaOperationPathParametersSchema = schemaOperationPathParameters.reduce(
      (schema, pathParameters) => {
        return {
          ...schema,
          properties: {
            ...schema.properties,
            [pathParameters.name]: pathParameters.schema as OpenAPIV3.SchemaObject,
          },
        }
      },
      { type: 'object', properties: {} } as OpenAPIV3.SchemaObject
    )

    const data = {
      params: operation.hasParameters()
        ? {
            name: capitalCase(`${operation.getOperationId()} "Params"`, { delimiter: '' }),
            schema: schemaOperationPathParametersSchema,
          }
        : undefined,
      request: {
        name: capitalCase(`${operation.getOperationId()} "Request"`, { delimiter: '' }),
        description: (operation.schema.requestBody as RequestBodyObject)?.description,
        schema: (operation.getRequestBody('application/json') as MediaTypeObject)?.schema as OpenAPIV3.SchemaObject,
      },
      response: {
        name: capitalCase(`${operation.getOperationId()} "Response"`, { delimiter: '' }),
        description: operation.getResponseAsJSONSchema('200')?.at(0)?.description,
        schema: operation.getResponseAsJSONSchema('200')?.at(0)?.schema as OpenAPIV3.SchemaObject,
      },
    } as const
    return data
  }

  async getGet(path: string) {
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

    const typeSource = await new ZodBuilder(oas).add(schemas.params).add(schemas.response).configure({ fileResolver, nameResolver, withJSDocs: true }).print()

    if (typeFilePath) {
      return {
        path: typeFilePath,
        fileName: typeName,
        source: typeSource,
        imports: [
          {
            name: 'zod',
            path: 'zod',
          },
        ],
      }
    }

    return null
  }

  async getPost(path: string) {
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

    const typeSource = await new ZodBuilder(oas)
      .add(schemas.params)
      .add(schemas.request)
      .add(schemas.response)
      .configure({ fileResolver, nameResolver, withJSDocs: true })
      .print()

    if (typeFilePath) {
      return {
        path: typeFilePath,
        fileName: typeName,
        source: typeSource,
        imports: [
          {
            name: 'zod',
            path: 'zod',
          },
        ],
      }
    }

    return null
  }

  async getPut(path: string) {
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

    const typeSource = await new ZodBuilder(oas)
      .add(schemas.params)
      .add(schemas.request)
      .add(schemas.response)
      .configure({ fileResolver, nameResolver, withJSDocs: true })
      .print()

    if (typeFilePath) {
      return {
        path: typeFilePath,
        fileName: typeName,
        source: typeSource,
        imports: [
          {
            name: 'zod',
            path: 'zod',
          },
        ],
      }
    }

    return null
  }

  async getDelete(path: string) {
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

    const typeSource = await new ZodBuilder(oas)
      .add(schemas.params)
      .add(schemas.request)
      .add(schemas.response)
      .configure({ fileResolver, nameResolver, withJSDocs: true })
      .print()

    if (typeFilePath) {
      return {
        path: typeFilePath,
        fileName: typeName,
        source: typeSource,
        imports: [
          {
            name: 'zod',
            path: 'zod',
          },
        ],
      }
    }

    return null
  }

  async build() {
    const { oas, fileManager } = this.options
    const paths = oas.getPaths()
    const promises: Promise<File | null>[] = []
    const filePromises: Promise<File>[] = []

    Object.keys(paths).forEach((path) => {
      promises.push(this.getGet(path))
      promises.push(this.getPost(path))
      promises.push(this.getPut(path))
      promises.push(this.getDelete(path))
    })

    const files = await Promise.all(promises).then((files) => {
      return fileManager.combine(files)
    })

    files.forEach((file) => {
      filePromises.push(fileManager.addOrAppend(file))
    })
    return Promise.all(filePromises)
  }
}
