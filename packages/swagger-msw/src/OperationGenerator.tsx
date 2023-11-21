import { createRoot } from '@kubb/react'
import { OperationGenerator as Generator } from '@kubb/swagger'

import { Handlers } from './components/Handlers.tsx'
import { Mock } from './components/Mock.tsx'

import type { AppContextProps } from '@kubb/react'
import type { HttpMethod, Operation, OperationMethodResult, OperationSchemas } from '@kubb/swagger'
import type { FileMeta, PluginOptions } from './types.ts'

export class OperationGenerator extends Generator<PluginOptions['resolvedOptions'], PluginOptions> {
  async all(paths: Record<string, Record<HttpMethod, Operation>>): OperationMethodResult<FileMeta> {
    const { pluginManager, plugin } = this.context

    const root = createRoot<AppContextProps>({ logger: pluginManager.logger })

    root.render(<Handlers.File paths={paths} templates={this.options.templates.handlers} />, { meta: { pluginManager, plugin } })

    return root.files
  }

  async #generate(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    const { pluginManager, plugin } = this.context

    const root = createRoot<AppContextProps<PluginOptions['appMeta']>>({ logger: pluginManager.logger })

    root.render(<Mock.File templates={options.templates.mock} />, { meta: { pluginManager, plugin: { ...plugin, options }, schemas, operation } })

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
