import { createRoot } from '@kubb/react'
import { OperationGenerator as Generator } from '@kubb/swagger'

import { Handlers } from './components/Handlers.tsx'
import { Mock } from './components/Mock.tsx'

import type { AppContextProps } from '@kubb/react'
import type { OperationMethodResult, OperationSchemas, Paths } from '@kubb/swagger'
import type { Operation } from '@kubb/swagger/oas'
import type { FileMeta, PluginOptions } from './types.ts'

export class OperationGenerator extends Generator<PluginOptions['resolvedOptions'], PluginOptions> {
  async all(paths: Paths): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin } = this.context

    const root = createRoot<AppContextProps>({ logger: pluginManager.logger })

    const templates = {
      handlers: Handlers.templates,
      mock: Mock.templates,
      ...this.options.templates,
    }

    if (!templates?.handlers) {
      return []
    }

    root.render(<Handlers.File name="handlers" paths={paths} templates={templates.handlers} />, { meta: { oas, pluginManager, plugin } })

    return root.files
  }

  async #generate(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin } = this.context

    const root = createRoot<AppContextProps<PluginOptions['appMeta']>>({ logger: pluginManager.logger })

    const templates = {
      handlers: Handlers.templates,
      mock: Mock.templates,
      ...options.templates,
    }

    if (!templates?.mock) {
      return []
    }

    root.render(<Mock.File templates={templates.mock} />, { meta: { oas, pluginManager, plugin: { ...plugin, options }, schemas, operation } })

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
