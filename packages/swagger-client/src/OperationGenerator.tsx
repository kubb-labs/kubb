import { createRoot } from '@kubb/react'
import { OperationGenerator as Generator } from '@kubb/swagger'
import { Oas } from '@kubb/swagger/components'

import { Client, Operations } from './components/index.ts'

import type { AppContextProps } from '@kubb/react'
import type { OperationMethodResult, OperationSchemas, Paths } from '@kubb/swagger'
import type { Operation } from '@kubb/swagger/oas'
import type { FileMeta, PluginOptions } from './types.ts'

export class OperationGenerator extends Generator<PluginOptions['resolvedOptions'], PluginOptions> {
  async all(paths: Paths): OperationMethodResult<FileMeta> {
    const { pluginManager, oas, plugin } = this.context

    const root = createRoot<AppContextProps<PluginOptions['appMeta']>>({ logger: pluginManager.logger })

    const templates = {
      operations: Operations.templates,
      client: Client.templates,
      ...this.options.templates,
    }

    if (!templates.operations) {
      return []
    }

    root.render(
      <Oas oas={oas}>
        <Operations.File name="operations" paths={paths} templates={templates.operations} />
      </Oas>,
      { meta: { pluginManager, plugin } },
    )

    return root.files
  }

  async #generate(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin } = this.context

    const root = createRoot<AppContextProps<PluginOptions['appMeta']>>({ logger: pluginManager.logger })

    const templates = {
      operations: Operations.templates,
      client: Client.templates,
      ...options.templates,
    }

    if (!templates.client) {
      return []
    }

    root.render(
      <Oas oas={oas}>
        <Oas.Operation schemas={schemas} operation={operation}>
          <Client.File templates={templates.client} />
        </Oas.Operation>
      </Oas>,
      { meta: { pluginManager, plugin: { ...plugin, options } } },
    )

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
