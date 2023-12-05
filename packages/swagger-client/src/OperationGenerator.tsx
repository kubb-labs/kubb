import { createRoot } from '@kubb/react'
import { OperationGenerator as Generator } from '@kubb/swagger'

import { Client, Operations } from './components/index.ts'

import type { AppContextProps } from '@kubb/react'
import type { OperationMethodResult, OperationSchemas, Paths } from '@kubb/swagger'
import type { Operation } from '@kubb/swagger/oas'
import type { FileMeta, PluginOptions } from './types.ts'

export class OperationGenerator extends Generator<PluginOptions['resolvedOptions'], PluginOptions> {
  async all(paths: Paths): OperationMethodResult<FileMeta> {
    const { pluginManager, oas, plugin } = this.context

    const root = createRoot<AppContextProps>({ logger: pluginManager.logger })

    if (!this.options.templates.operations) {
      return []
    }

    root.render(<Operations.File name="operations" paths={paths} templates={this.options.templates.operations} />, { meta: { oas, pluginManager, plugin } })

    return root.files
  }

  async #generate(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin } = this.context

    const root = createRoot<AppContextProps<PluginOptions['appMeta']>>({ logger: pluginManager.logger })

    if (!options.templates.client) {
      return []
    }

    root.render(<Client.File templates={options.templates.client} />, { meta: { oas, pluginManager, plugin: { ...plugin, options }, schemas, operation } })

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
