import { URLPath } from '@kubb/core/utils'
import { createRoot } from '@kubb/react'
import { File } from '@kubb/react'
import { OperationGenerator as Generator } from '@kubb/swagger'
import { useResolve } from '@kubb/swagger/hooks'

import { ClientFile } from './components/ClientFile.tsx'
import { OperationsFunction } from './components/OperationsFunction.tsx'

import type { AppContextProps } from '@kubb/react'
import type { HttpMethod, Operation, OperationMethodResult, OperationSchemas } from '@kubb/swagger'
import type { AppMeta, FileMeta, PluginOptions } from './types.ts'

export class OperationGenerator extends Generator<PluginOptions['resolvedOptions'], PluginOptions> {
  async all(paths: Record<string, Record<HttpMethod, Operation>>): OperationMethodResult<FileMeta> {
    const { pluginManager, oas, plugin } = this.context

    const operations: Record<string, { path: string; method: HttpMethod }> = {}

    Object.keys(paths).forEach((path) => {
      const methods = paths[path] || []
      Object.keys(methods).forEach((method) => {
        const operation = oas.operation(path, method as HttpMethod)
        if (operation) {
          operations[operation.getOperationId()] = {
            path: new URLPath(path).URL,
            method: method as HttpMethod,
          }
        }
      })
    })

    const root = createRoot<AppContextProps>()

    const Component = () => {
      const file = useResolve({ name: 'operations', pluginKey: plugin.key, type: 'file' })

      return (
        <File<FileMeta>
          baseName={file.baseName}
          path={file.path}
          meta={{
            pluginKey: plugin.key,
          }}
        >
          <File.Source>
            <OperationsFunction operations={operations} />
          </File.Source>
        </File>
      )
    }

    root.render(<Component />, { meta: { pluginManager, plugin } })

    return root.files
  }

  async #generate(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    const { pluginManager, plugin } = this.context

    const root = createRoot<AppContextProps<AppMeta>>()

    root.render(<ClientFile />, { meta: { pluginManager, plugin: { ...plugin, options }, schemas, operation } })

    return root.files
  }

  async get(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    return this.#generate(operation, schemas, options)
  }

  async post(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    return this.#generate(operation, schemas, options)
  }

  async put(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    return this.#generate(operation, schemas, options)
  }
  async patch(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    return this.#generate(operation, schemas, options)
  }
  async delete(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    return this.#generate(operation, schemas, options)
  }
}
