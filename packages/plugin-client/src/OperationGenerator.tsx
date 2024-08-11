import { OperationGenerator as Generator } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'
import { App, createRoot } from '@kubb/react'

import type { Operation } from '@kubb/oas'
import type { OperationMethodResult, OperationsByMethod } from '@kubb/plugin-oas'
import type { FileMeta, PluginClient } from './types.ts'

export class OperationGenerator extends Generator<PluginClient['resolvedOptions'], PluginClient> {
  async all(operations: Operation[], _operationsByMethod: OperationsByMethod): OperationMethodResult<FileMeta> {
    const { pluginManager, oas, plugin, mode } = this.context

    const root = createRoot({
      logger: pluginManager.logger,
    })

    root.render(
      <App pluginManager={pluginManager} plugin={plugin} mode={mode}>
        <Oas oas={oas} operations={operations} generator={this}>
          {this.options.parsers.map((parser) => {
            const Component = parser.templates.Operations

            return <Component key={parser.name} operations={operations} options={this.options} />
          })}
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

    root.render(
      <App pluginManager={pluginManager} plugin={{ ...plugin, options }} mode={mode}>
        <Oas oas={oas} operations={[operation]} generator={this}>
          <Oas.Operation operation={operation}>
            {options.parsers.map((parser) => {
              const Component = parser.templates.Operation

              return <Component key={parser.name} operation={operation} options={this.options} />
            })}
          </Oas.Operation>
        </Oas>
      </App>,
    )

    return root.files
  }
}
