import { OperationGenerator as Generator } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'
import { App, createRoot } from '@kubb/react'

import type { Operation } from '@kubb/oas'
import type { OperationMethodResult, OperationsByMethod } from '@kubb/plugin-oas'
import type { FileMeta, PluginClient } from './types.ts'
import { clientParser } from './parsers/clientParser.tsx'
import { operationsParser } from './parsers/operationsParser.tsx'

export class OperationGenerator extends Generator<PluginClient['resolvedOptions'], PluginClient> {
  async all(operations: Operation[], operationsByMethod: OperationsByMethod): OperationMethodResult<FileMeta> {
    const { pluginManager, oas, plugin, mode } = this.context

    const root = createRoot({
      logger: pluginManager.logger,
    })

    root.render(
      <App pluginManager={pluginManager} plugin={plugin} mode={mode}>
        <Oas oas={oas} operations={operations} generator={this}>
          {this.options.parsers.map((parser) => {
            if (typeof parser === 'string' && parser === 'client') {
              return null
            }
            if (typeof parser === 'string' && parser === 'operations') {
              return (
                <operationsParser.templates.Operations
                  key="operations"
                  operationsByMethod={operationsByMethod}
                  operations={operations}
                  options={this.options}
                />
              )
            }

            return <parser.templates.Operations key={parser.name} operationsByMethod={operationsByMethod} operations={operations} options={this.options} />
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
              if (typeof parser === 'string' && parser === 'client') {
                return <clientParser.templates.Operation key="client" operation={operation} options={options} />
              }
              if (typeof parser === 'string' && parser === 'operations') {
                return null
              }

              return <parser.templates.Operation key={parser.name} operation={operation} options={options} />
            })}
          </Oas.Operation>
        </Oas>
      </App>,
    )

    return root.files
  }
}
