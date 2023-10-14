import { getRelativePath } from '@kubb/core'
import { OperationGenerator as Generator, resolve } from '@kubb/swagger'
import { resolve as resolveSwaggerFaker, pluginName as swaggerFakerPluginName } from '@kubb/swagger-faker'

import { MSWBuilder } from '../builders/index.ts'
import { pluginName } from '../plugin.ts'

import type { File, Import, PluginContext, PluginManager } from '@kubb/core'
import type { ContentType, HttpMethod, Oas, Operation, OperationSchemas, Resolver, SkipBy } from '@kubb/swagger'
import type { FileMeta } from '../types.ts'

type Options = {
  pluginManager: PluginManager
  oas: Oas
  skipBy?: SkipBy[]
  contentType?: ContentType
  resolvePath: PluginContext['resolvePath']
  resolveName: PluginContext['resolveName']
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

  resolveFaker(operation: Operation): Resolver | null {
    const { resolvePath, resolveName } = this.options

    return resolveSwaggerFaker({
      operation,
      resolveName,
      resolvePath,
    })
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

      if (operations?.get) {
        addOperationToHandler(operations.get)
      }

      if (operations?.post) {
        addOperationToHandler(operations.post)
      }
      if (operations?.patch) {
        addOperationToHandler(operations.patch)
      }

      if (operations?.put) {
        addOperationToHandler(operations.put)
      }

      if (operations?.delete) {
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
    const { pluginManager, resolveName, oas } = this.options

    const responseName = resolveName({ name: schemas.response.name, pluginName: swaggerFakerPluginName })

    const mswBuilder = new MSWBuilder(oas).configure({ pluginManager, schemas, responseName, operation })

    const file = mswBuilder.render().file

    if (!file) {
      throw new Error('No <File/> being used or File is undefined(see resolvePath/resolveName)')
    }

    return {
      path: file.path,
      fileName: file.fileName,
      source: file.source,
      imports: file.imports,
      meta: {
        pluginName,
        tag: operation.getTags()[0]?.name,
      },
    }
  }

  async post(operation: Operation, schemas: OperationSchemas): Promise<File<FileMeta> | null> {
    const { pluginManager, resolveName, oas } = this.options

    const responseName = resolveName({ name: schemas.response.name, pluginName: swaggerFakerPluginName })

    const mswBuilder = new MSWBuilder(oas).configure({
      pluginManager,
      schemas,
      responseName,
      operation,
    })

    const file = mswBuilder.render().file

    if (!file) {
      throw new Error('No <File/> being used or File is undefined(see resolvePath/resolveName)')
    }

    return {
      path: file.path,
      fileName: file.fileName,
      source: file.source,
      imports: file.imports,
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
