import { createRoot } from '@kubb/react'
import { OperationGenerator as Generator } from '@kubb/swagger'

import { Client, Operations } from './components/index.ts'

import type { AppContextProps } from '@kubb/react'
import type { HttpMethod, OperationMethodResult, OperationSchemas } from '@kubb/swagger'
import type { Operation } from '@kubb/swagger'
import type { FileMeta, PluginOptions } from './types.ts'

export class OperationGenerator extends Generator<PluginOptions['resolvedOptions'], PluginOptions> {
  async all(paths: Record<string, Record<HttpMethod, Operation>>): OperationMethodResult<FileMeta> {
    const { pluginManager, oas, plugin } = this.context

    const root = createRoot<AppContextProps>({ logger: pluginManager.logger })

    root.render(<Operations.File paths={paths} templates={this.options.templates.operations} />, { meta: { oas, pluginManager, plugin } })

    return root.files
  }

  async #generate(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin } = this.context

    const root = createRoot<AppContextProps<PluginOptions['appMeta']>>({ logger: pluginManager.logger })

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
