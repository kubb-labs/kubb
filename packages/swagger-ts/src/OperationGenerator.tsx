import { createRoot } from '@kubb/react'
import { OperationGenerator as Generator } from '@kubb/swagger'

import { Mutation } from './components/Mutation.tsx'
import { Oas } from './components/Oas.tsx'
import { Query } from './components/Query.tsx'

import type { AppContextProps } from '@kubb/react'
import type { Operation, OperationMethodResult, OperationSchemas } from '@kubb/swagger'
import type { FileMeta, PluginOptions } from './types.ts'

export class OperationGenerator extends Generator<PluginOptions['resolvedOptions'], PluginOptions> {
  async all(): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin } = this.context

    if (!plugin.options.oasType) {
      return null
    }

    const root = createRoot<AppContextProps>({ logger: pluginManager.logger })
    root.render(
      <Oas.File name="oas" typeName="Oas" />,
      { meta: { oas, pluginManager, plugin } },
    )

    return root.files
  }

  async get(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin, mode = 'directory' } = this.context

    const root = createRoot<AppContextProps<PluginOptions['appMeta']>>({ logger: pluginManager.logger })
    root.render(
      <Query.File mode={mode} />,
      { meta: { oas, pluginManager, plugin: { ...plugin, options }, schemas, operation } },
    )

    return root.files
  }

  async post(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin, mode = 'directory' } = this.context

    const root = createRoot<AppContextProps<PluginOptions['appMeta']>>({ logger: pluginManager.logger })
    root.render(
      <Mutation.File mode={mode} />,
      { meta: { oas, pluginManager, plugin: { ...plugin, options }, schemas, operation } },
    )

    return root.files
  }

  async put(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    return this.post(operation, schemas, options)
  }
  async patch(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    return this.post(operation, schemas, options)
  }
  async delete(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    return this.post(operation, schemas, options)
  }
}
