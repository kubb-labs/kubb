import { URLPath } from '@kubb/core/utils'
import { createRoot } from '@kubb/react'
import { File } from '@kubb/react'
import { OperationGenerator as Generator } from '@kubb/swagger'
import { useResolve } from '@kubb/swagger/hooks'

import { OperationsFunction } from './components/OperationsFunction.tsx'
import { ClientBuilder } from './ClientBuilder.tsx'

import type { AppContextProps } from '@kubb/react'
import type { HttpMethod, Operation, OperationMethodResult, OperationSchemas } from '@kubb/swagger'
import type { FileMeta, Options as PluginOptions } from './types.ts'

type Options = {
  clientPath?: PluginOptions['client']
  pathParamsType: PluginOptions['pathParamsType']
  clientImportPath?: PluginOptions['clientImportPath']
  dataReturnType: NonNullable<PluginOptions['dataReturnType']>
}

export class OperationGenerator extends Generator<Options> {
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

    root.render(<Component />, { meta: { pluginManager } })

    return root.files
  }

  async #generate(operation: Operation, schemas: OperationSchemas, options: Options): OperationMethodResult<FileMeta> {
    const { pluginManager, oas, plugin } = this.context

    const clientBuilder = new ClientBuilder(
      options,
      { oas, pluginManager, plugin, operation, schemas },
    )
    const { files } = clientBuilder.render()

    return files
  }

  async get(operation: Operation, schemas: OperationSchemas, options: Options): OperationMethodResult<FileMeta> {
    return this.#generate(operation, schemas, options)
  }

  async post(operation: Operation, schemas: OperationSchemas, options: Options): OperationMethodResult<FileMeta> {
    return this.#generate(operation, schemas, options)
  }

  async put(operation: Operation, schemas: OperationSchemas, options: Options): OperationMethodResult<FileMeta> {
    return this.#generate(operation, schemas, options)
  }
  async patch(operation: Operation, schemas: OperationSchemas, options: Options): OperationMethodResult<FileMeta> {
    return this.#generate(operation, schemas, options)
  }
  async delete(operation: Operation, schemas: OperationSchemas, options: Options): OperationMethodResult<FileMeta> {
    return this.#generate(operation, schemas, options)
  }
}
