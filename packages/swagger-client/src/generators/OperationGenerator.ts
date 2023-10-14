import { URLPath } from '@kubb/core'
import { OperationGenerator as Generator, resolve } from '@kubb/swagger'

import { ClientBuilder } from '../builders/ClientBuilder.tsx'
import { pluginName } from '../plugin.ts'

import type { KubbFile, PluginContext, PluginManager } from '@kubb/core'
import type { ContentType, HttpMethod, Oas, Operation, OperationSchemas, ResolvePathOptions, Resolver, SkipBy } from '@kubb/swagger'
import type { FileMeta, Options as PluginOptions } from '../types.ts'

type Options = {
  pluginManager: PluginManager
  clientPath?: KubbFile.OptionalPath
  dataReturnType: PluginOptions['dataReturnType']
  oas: Oas
  contentType?: ContentType
  skipBy: SkipBy[]
  resolvePath: PluginContext<ResolvePathOptions>['resolvePath']
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

  async all(paths: Record<string, Record<HttpMethod, Operation>>): Promise<KubbFile.File<FileMeta> | null> {
    const { resolvePath, resolveName, oas } = this.options

    const controllerName = resolveName({ name: 'operations' })

    if (!controllerName) {
      throw new Error('controllerName should be defined')
    }

    const controllerId = `${controllerName}.ts` as const
    const controllerFilePath = resolvePath({
      baseName: controllerId,
    })

    if (!controllerFilePath) {
      return null
    }
    // end controller setup

    const sources: string[] = []

    const groupedByOperationId: Record<string, { path: string; method: HttpMethod }> = {}

    Object.keys(paths).forEach((path) => {
      const methods = paths[path] || []
      Object.keys(methods).forEach((method) => {
        const operation = oas.operation(path, method as HttpMethod)
        if (operation) {
          groupedByOperationId[operation.getOperationId()] = {
            path: new URLPath(path).URL,
            method: method as HttpMethod,
          }
        }
      })
    })

    sources.push(`export const operations = ${JSON.stringify(groupedByOperationId)} as const;`)

    return {
      path: controllerFilePath,
      baseName: controllerId,
      source: sources.join('\n'),
      imports: [],
    }
  }

  async get(operation: Operation, schemas: OperationSchemas): Promise<KubbFile.File<FileMeta> | null> {
    const { pluginManager, oas, clientPath, dataReturnType } = this.options

    const clientBuilder = new ClientBuilder(oas).configure({
      pluginManager,
      operation,
      schemas,
      dataReturnType,
      clientPath,
    })
    const file = clientBuilder.render().file

    if (!file) {
      throw new Error('No <File/> being used or File is undefined(see resolvePath/resolveName)')
    }

    return {
      path: file.path,
      baseName: file.baseName,
      source: file.source,
      imports: file.imports,
      meta: {
        pluginName,
        tag: operation.getTags()[0]?.name,
      },
    }
  }

  async post(operation: Operation, schemas: OperationSchemas): Promise<KubbFile.File<FileMeta> | null> {
    const { pluginManager, oas, clientPath, dataReturnType } = this.options

    const clientBuilder = new ClientBuilder(oas).configure({
      pluginManager,
      operation,
      schemas,
      dataReturnType,
      clientPath,
    })
    const file = clientBuilder.render().file

    if (!file) {
      throw new Error('No <File/> being used or File is undefined(see resolvePath/resolveName)')
    }

    return {
      path: file.path,
      baseName: file.baseName,
      source: file.source,
      imports: file.imports,
      meta: {
        pluginName,
        tag: operation.getTags()[0]?.name,
      },
    }
  }

  async put(operation: Operation, schemas: OperationSchemas): Promise<KubbFile.File<FileMeta> | null> {
    return this.post(operation, schemas)
  }
  async patch(operation: Operation, schemas: OperationSchemas): Promise<KubbFile.File<FileMeta> | null> {
    return this.post(operation, schemas)
  }
  async delete(operation: Operation, schemas: OperationSchemas): Promise<KubbFile.File<FileMeta> | null> {
    return this.post(operation, schemas)
  }
}
