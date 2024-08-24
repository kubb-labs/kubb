import { createReactParser, OperationGenerator as Generator } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'
import { App, createRoot } from '@kubb/react'

import { Client, Operations } from './components/index.ts'

import type { Operation } from '@kubb/oas'
import type { OperationMethodResult, OperationsByMethod } from '@kubb/plugin-oas'
import type { FileMeta, PluginClient } from './types.ts'

export const clientParser = createReactParser<PluginClient>({
  name: 'plugin-client',
  Operations({ options }) {
    if (!options.templates.operations) {
      return null
    }

    return <Operations.File baseURL={options.baseURL} templates={options.templates.operations} />
  },
  Operation({ options }) {
    if (!options.templates.client) {
      return null
    }

    return <Client.File baseURL={options.baseURL} templates={options.templates.client} />
  },
})

/**
 * @deprecated replaced by clientParser
 */
export class OperationGenerator extends Generator<PluginClient['resolvedOptions'], PluginClient> {
  async all(operations: Operation[], _operationsByMethod: OperationsByMethod): OperationMethodResult<FileMeta> {
    const { pluginManager, oas, plugin, mode } = this.context

    const root = createRoot({
      logger: pluginManager.logger,
    })

    const templates = {
      operations: Operations.templates,
      client: Client.templates,
      ...this.options.templates,
    }

    root.render(
      <App pluginManager={pluginManager} plugin={plugin} mode={mode}>
        <Oas oas={oas} operations={operations} generator={this}>
          {templates.operations && <Operations.File baseURL={this.options.baseURL} templates={templates.operations} />}
        </Oas>
      </App>,
    )

    return root.files
  }

  async operation(operation: Operation, options: PluginClient['resolvedOptions']): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin, mode } = this.context

    const root = createRoot({
      logger: pluginManager.logger,
    })

    const templates = {
      operations: Operations.templates,
      client: Client.templates,
      ...options.templates,
    }

    if (!templates.client) {
      return []
    }

    root.render(
      <App pluginManager={pluginManager} plugin={{ ...plugin, options }} mode={mode}>
        <Oas oas={oas} operations={[operation]} generator={this}>
          <Oas.Operation operation={operation}>
            <Client.File baseURL={options.baseURL} templates={templates.client} />
          </Oas.Operation>
        </Oas>
      </App>,
    )

    return root.files
  }
}
