import { getRelativePath } from '@kubb/core/utils'
import { OperationGenerator as Generator, resolve } from '@kubb/swagger'
import { pluginKey as swaggerFakerPluginKey, resolve as resolveSwaggerFaker } from '@kubb/swagger-faker'

import { MSWBuilder } from '../builders/index.ts'

import type { KubbFile } from '@kubb/core'
import type { HttpMethod, Operation, OperationSchemas, Resolver } from '@kubb/swagger'
import type { FileMeta } from '../types.ts'

// eslint-disable-next-line @typescript-eslint/ban-types
type Options = {}

export class OperationGenerator extends Generator<Options> {
  resolve(operation: Operation): Resolver {
    const { pluginManager, plugin } = this.context

    return resolve({
      operation,
      resolveName: pluginManager.resolveName,
      resolvePath: pluginManager.resolvePath,
      pluginKey: plugin.key,
    })
  }

  resolveFaker(operation: Operation): Resolver | null {
    const { pluginManager } = this.context

    return resolveSwaggerFaker({
      operation,
      resolveName: pluginManager.resolveName,
      resolvePath: pluginManager.resolvePath,
    })
  }

  async all(paths: Record<string, Record<HttpMethod, Operation>>): Promise<KubbFile.File<FileMeta> | null> {
    const { pluginManager, plugin } = this.context

    const controllerFileName = `handlers.ts`
    const controllerFilePath = pluginManager.resolvePath({
      baseName: controllerFileName,
      pluginKey: plugin.key,
    })

    if (!controllerFilePath) {
      return null
    }
    // end controller setup

    const sources: string[] = []
    const imports: KubbFile.Import[] = []
    const handlers: string[] = []

    const addOperationToHandler = (operation: Operation) => {
      if (operation) {
        const name = pluginManager.resolveName({ name: `${operation.getOperationId()}`, pluginKey: plugin.key })

        const msw = this.resolve(operation)

        handlers.push(name)

        imports.push({
          name: [name],
          path: getRelativePath(controllerFilePath, msw.path),
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
      baseName: controllerFileName,
      source: sources.join('\n'),
      imports: imports.filter(Boolean),
    }
  }

  async get(operation: Operation, schemas: OperationSchemas, _options: Options): Promise<KubbFile.File<FileMeta> | null> {
    const { pluginManager, oas, plugin } = this.context

    const responseName = pluginManager.resolveName({ name: schemas.response.name, pluginKey: swaggerFakerPluginKey })

    const mswBuilder = new MSWBuilder({ responseName }, { oas, pluginManager, plugin, schemas, operation })

    const file = mswBuilder.render().file

    if (!file) {
      throw new Error('No <File/> being used or File is undefined(see resolvePath/resolveName)')
    }

    return {
      path: file.path,
      baseName: file.baseName,
      source: file.source,
      imports: file.imports,
      meta: {
        pluginKey: plugin.key,
        tag: operation.getTags()[0]?.name,
      },
    }
  }

  async post(operation: Operation, schemas: OperationSchemas, _options: Options): Promise<KubbFile.File<FileMeta> | null> {
    const { pluginManager, oas, plugin } = this.context

    const responseName = pluginManager.resolveName({ name: schemas.response.name, pluginKey: swaggerFakerPluginKey })

    const mswBuilder = new MSWBuilder(
      {
        responseName,
      },
      { oas, pluginManager, plugin, schemas, operation },
    )

    const file = mswBuilder.render().file

    if (!file) {
      throw new Error('No <File/> being used or File is undefined(see resolvePath/resolveName)')
    }

    return {
      path: file.path,
      baseName: file.baseName,
      source: file.source,
      imports: file.imports,
      meta: {
        pluginKey: plugin.key,
        tag: operation.getTags()[0]?.name,
      },
    }
  }

  async put(operation: Operation, schemas: OperationSchemas, options: Options): Promise<KubbFile.File<FileMeta> | null> {
    return this.post(operation, schemas, options)
  }
  async patch(operation: Operation, schemas: OperationSchemas, options: Options): Promise<KubbFile.File<FileMeta> | null> {
    return this.post(operation, schemas, options)
  }
  async delete(operation: Operation, schemas: OperationSchemas, options: Options): Promise<KubbFile.File<FileMeta> | null> {
    return this.post(operation, schemas, options)
  }
}
