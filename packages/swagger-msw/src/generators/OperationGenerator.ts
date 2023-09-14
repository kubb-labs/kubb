import { getRelativePath } from '@kubb/core'
import { OperationGenerator as Generator } from '@kubb/swagger'
import { pluginName as swaggerFakerPluginName } from '@kubb/swagger-faker'

import { MSWBuilder } from '../builders/index.ts'
import { pluginName } from '../plugin.ts'

import type { File, Import, PathMode, PluginContext } from '@kubb/core'
import type { ContentType, FileResolver, HttpMethod, Oas, Operation, OperationSchemas, Resolver, SkipBy } from '@kubb/swagger'
import type { FileMeta } from '../types.ts'

type Options = {
  oas: Oas
  skipBy?: SkipBy[]
  contentType?: ContentType
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

  resolveFaker(operation: Operation): Resolver | null {
    const { resolvePath, resolveName } = this.options

    const name = resolveName({ name: operation.getOperationId(), pluginName: swaggerFakerPluginName })

    if (!name) {
      throw new Error('Name should be defined')
    }

    const fileName = `${name}.ts`
    const filePath = resolvePath({ fileName, options: { tag: operation.getTags()[0]?.name }, pluginName: swaggerFakerPluginName })

    if (!filePath) {
      throw new Error('Filepath should be defined')
    }

    return {
      name,
      fileName,
      filePath,
    }
  }

  async all(paths: Record<string, Record<HttpMethod, Operation>>): Promise<File<FileMeta> | null> {
    const { resolvePath, resolveName } = this.options

    const controllerFileName = `handlers.ts`
    const controllerFilePath = resolvePath({
      fileName: controllerFileName,
    })

    if (!controllerFilePath) {
      return null
    }
    // end controller setup

    const sources: string[] = []
    const imports: Import[] = []
    const handlers: string[] = []

    const addOperationToHandler = (operation: Operation) => {
      if (operation) {
        const name = resolveName({ name: `${operation.getOperationId()}` })

        const msw = this.resolve(operation)

        handlers.push(name)

        imports.push({
          name: [name],
          path: getRelativePath(controllerFilePath, msw.filePath),
        })
      }
    }

    Object.keys(paths).forEach((path) => {
      const operations = paths[path]

      if (operations.get) {
        addOperationToHandler(operations.get)
      }

      if (operations.post) {
        addOperationToHandler(operations.post)
      }
      if (operations.patch) {
        addOperationToHandler(operations.patch)
      }

      if (operations.put) {
        addOperationToHandler(operations.put)
      }

      if (operations.delete) {
        addOperationToHandler(operations.delete)
      }
    })

    sources.push(`export const handlers = ${JSON.stringify(handlers).replaceAll(`"`, '')} as const;`)

    return {
      path: controllerFilePath,
      fileName: controllerFileName,
      source: sources.join('\n'),
      imports: imports.filter(Boolean),
    }
  }

  async get(operation: Operation, schemas: OperationSchemas): Promise<File<FileMeta> | null> {
    const { resolvePath, mode, resolveName, oas } = this.options

    const msw = this.resolve(operation)
    const faker = this.resolveFaker(operation)

    const responseName = resolveName({ name: schemas.response.name, pluginName: swaggerFakerPluginName })

    const fileResolver: FileResolver = (name, ref) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const root = resolvePath({ fileName: msw.name, pluginName, options: { tag: operation.getTags()[0]?.name } })
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = resolvePath({
        fileName: `${name}.ts`,
        pluginName: ref.pluginName || pluginName,
        options: ref.pluginName ? { tag: operation.getTags()[0]?.name } : undefined,
      })

      return getRelativePath(root, resolvedTypeId)
    }

    const source = new MSWBuilder(oas)
      .add(schemas.pathParams)
      .add(schemas.queryParams)
      .add(schemas.headerParams)
      .add(schemas.response)
      .add(schemas.errors)
      .configure({ fileResolver: mode === 'file' ? undefined : fileResolver, withJSDocs: true, responseName, operation, resolveName })
      .print()

    return {
      path: msw.filePath,
      fileName: msw.fileName,
      source,
      imports: [
        {
          name: ['rest'],
          path: 'msw',
        },
        faker
          ? {
              name: [responseName],
              path: getRelativePath(msw.filePath, faker.filePath),
            }
          : undefined,
      ].filter(Boolean),
      meta: {
        pluginName,
        tag: operation.getTags()[0]?.name,
      },
    }
  }

  async post(operation: Operation, schemas: OperationSchemas): Promise<File<FileMeta> | null> {
    const { resolvePath, mode, resolveName, oas } = this.options

    const msw = this.resolve(operation)
    const faker = this.resolveFaker(operation)
    const responseName = resolveName({ name: schemas.response.name, pluginName: swaggerFakerPluginName })
    const requestName = schemas.request ? resolveName({ name: schemas.request.name, pluginName: swaggerFakerPluginName }) : undefined

    const fileResolver: FileResolver = (name, ref) => {
      // Used when a react-query type(request, response, params) has an import of a global type
      const root = resolvePath({ fileName: msw.name, pluginName, options: { tag: operation.getTags()[0]?.name } })
      // refs import, will always been created with the SwaggerTS plugin, our global type
      const resolvedTypeId = resolvePath({
        fileName: `${name}.ts`,
        pluginName: ref.pluginName || pluginName,
        options: ref.pluginName ? { tag: operation.getTags()[0]?.name } : undefined,
      })

      return getRelativePath(root, resolvedTypeId)
    }

    const source = new MSWBuilder(oas)
      .add(schemas.pathParams)
      .add(schemas.queryParams)
      .add(schemas.headerParams)
      .add(schemas.request)
      .add(schemas.response)
      .add(schemas.errors)
      .configure({
        fileResolver: mode === 'file' ? undefined : fileResolver,
        withJSDocs: true,
        responseName,
        resolveName,
        operation,
      })
      .print()

    return {
      path: msw.filePath,
      fileName: msw.fileName,
      source,
      imports: [
        {
          name: ['rest'],
          path: 'msw',
        },
        faker
          ? {
              name: [responseName, requestName].filter(Boolean),
              path: getRelativePath(msw.filePath, faker.filePath),
            }
          : undefined,
      ].filter(Boolean),
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
