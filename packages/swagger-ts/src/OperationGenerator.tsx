import { createRoot } from '@kubb/react'
import { OperationGenerator as Generator } from '@kubb/swagger'
import { Oas } from '@kubb/swagger/components'

import { Mutation } from './components/Mutation.tsx'
import { OasType } from './components/OasType.tsx'
import { Query } from './components/Query.tsx'

import type { AppContextProps } from '@kubb/react'
import type { OperationMethodResult, OperationSchemas } from '@kubb/swagger'
import type { Operation } from '@kubb/swagger/oas'
import type { FileMeta, PluginOptions } from './types.ts'

export class OperationGenerator extends Generator<PluginOptions['resolvedOptions'], PluginOptions> {
  async all(): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin } = this.context

    if (!plugin.options.oasType) {
      return null
    }

    const root = createRoot<AppContextProps<PluginOptions['appMeta']>>({ logger: pluginManager.logger })

    root.render(
      <Oas oas={oas}>
        <OasType.File name="oas" typeName="Oas" />
      </Oas>,
      { meta: { pluginManager, plugin } },
    )

    return root.files
  }

  async get(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin, mode = 'directory' } = this.context

    const root = createRoot<AppContextProps<PluginOptions['appMeta']>>({ logger: pluginManager.logger })
    root.render(
      <Oas oas={oas}>
        <Oas.Operation schemas={schemas} operation={operation}>
          <Query.File mode={mode} />
        </Oas.Operation>
      </Oas>,
      { meta: { pluginManager, plugin: { ...plugin, options } } },
    )

    return root.files
  }

  async post(operation: Operation, schemas: OperationSchemas, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin, mode = 'directory' } = this.context

    const root = createRoot<AppContextProps<PluginOptions['appMeta']>>({ logger: pluginManager.logger })
    root.render(
      <Oas oas={oas}>
        <Oas.Operation schemas={schemas} operation={operation}>
          <Mutation.File mode={mode} />
        </Oas.Operation>
      </Oas>,
      { meta: { pluginManager, plugin: { ...plugin, options } } },
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
