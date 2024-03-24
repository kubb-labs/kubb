import { createRoot } from '@kubb/react'
import { OperationGenerator as Generator } from '@kubb/swagger'
import { Oas } from '@kubb/swagger/components'

import { Schema } from './components/Schema.tsx'

import type { KubbFile } from '@kubb/core'
import type { AppContextProps } from '@kubb/react'
import type { OperationMethodResult } from '@kubb/swagger'
import type { Operation } from '@kubb/swagger/oas'
import type { FileMeta, PluginOptions } from './types.ts'

export class OperationGenerator extends Generator<PluginOptions['resolvedOptions'], PluginOptions> {
  async all(): Promise<KubbFile.File | null> {
    return null
  }

  async operation(
    operation: Operation,
    options: PluginOptions['resolvedOptions'],
  ): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin, mode } = this.context

    const root = createRoot<AppContextProps<PluginOptions['appMeta']>>({ logger: pluginManager.logger })
    root.render(
      <Oas oas={oas} operations={[operation]} getSchemas={(...props) => this.getSchemas(...props)}>
        <Oas.Operation operation={operation}>
          <Schema.File mode={mode} />
        </Oas.Operation>
      </Oas>,
      { meta: { pluginManager, plugin: { ...plugin, options } } },
    )

    return root.files
  }

  async get(
    operation: Operation,
    options: PluginOptions['resolvedOptions'],
  ): OperationMethodResult<FileMeta> {
    return this.operation(operation, options)
  }
  async post(
    operation: Operation,
    options: PluginOptions['resolvedOptions'],
  ): OperationMethodResult<FileMeta> {
    return this.operation(operation, options)
  }

  async put(
    operation: Operation,
    options: PluginOptions['resolvedOptions'],
  ): OperationMethodResult<FileMeta> {
    return this.operation(operation, options)
  }
  async patch(
    operation: Operation,
    options: PluginOptions['resolvedOptions'],
  ): OperationMethodResult<FileMeta> {
    return this.operation(operation, options)
  }
  async delete(
    operation: Operation,
    options: PluginOptions['resolvedOptions'],
  ): OperationMethodResult<FileMeta> {
    return this.operation(operation, options)
  }
}
