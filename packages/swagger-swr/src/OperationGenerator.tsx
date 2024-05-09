import { App, createRoot } from '@kubb/react'
import { OperationGenerator as Generator } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'

import { Mutation } from './components/Mutation.tsx'
import { Query } from './components/Query.tsx'

import type { KubbFile } from '@kubb/core'
import type { Operation } from '@kubb/oas'
import type { OperationMethodResult } from '@kubb/plugin-oas'
import type { FileMeta, PluginSwr } from './types.ts'

export class OperationGenerator extends Generator<PluginSwr['resolvedOptions'], PluginSwr, FileMeta> {
  async all(): Promise<KubbFile.File | null> {
    return null
  }

  async operation(): Promise<KubbFile.File | null> {
    return null
  }

  async get(operation: Operation, options: PluginSwr['resolvedOptions']): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin, mode } = this.context

    const root = createRoot({
      logger: pluginManager.logger,
    })

    if (!options.templates?.query || !options.templates?.queryOptions) {
      return []
    }

    root.render(
      <App pluginManager={pluginManager} plugin={{ ...plugin, options }} mode={mode}>
        <Oas oas={oas} operations={[operation]} generator={this}>
          <Oas.Operation operation={operation}>
            <Query.File
              templates={{
                query: options.templates.query,
                queryOptions: options.templates.queryOptions,
              }}
            />
          </Oas.Operation>
        </Oas>
      </App>,
    )

    return root.files
  }

  async post(operation: Operation, options: PluginSwr['resolvedOptions']): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin, mode } = this.context

    const root = createRoot({
      logger: pluginManager.logger,
    })

    if (!options.templates?.mutation) {
      return []
    }

    root.render(
      <App pluginManager={pluginManager} plugin={{ ...plugin, options }} mode={mode}>
        <Oas oas={oas} operations={[operation]} generator={this}>
          <Oas.Operation operation={operation}>
            <Mutation.File templates={options.templates.mutation} />
          </Oas.Operation>
        </Oas>
      </App>,
    )

    return root.files
  }

  async put(operation: Operation, options: PluginSwr['resolvedOptions']): OperationMethodResult<FileMeta> {
    return this.post(operation, options)
  }
  async patch(operation: Operation, options: PluginSwr['resolvedOptions']): OperationMethodResult<FileMeta> {
    return this.post(operation, options)
  }
  async delete(operation: Operation, options: PluginSwr['resolvedOptions']): OperationMethodResult<FileMeta> {
    return this.post(operation, options)
  }
}
