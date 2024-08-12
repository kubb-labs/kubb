import { OperationGenerator as Generator } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'
import { App, createRoot } from '@kubb/react'

import type { Operation } from '@kubb/oas'
import type { OperationMethodResult, OperationsByMethod } from '@kubb/plugin-oas'
import type { FileMeta, PluginMsw } from './types.ts'
import { operationsParser } from './parsers/operationsParser.tsx'
import { mockParser } from './parsers/mockParser.tsx'

export class OperationGenerator extends Generator<PluginMsw['resolvedOptions'], PluginMsw> {
  async all(operations: Operation[], operationsByMethod: OperationsByMethod): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin, mode } = this.context

    const root = createRoot({
      logger: pluginManager.logger,
    })

    root.render(
      <App pluginManager={pluginManager} plugin={plugin} mode={mode}>
        <Oas oas={oas} operations={operations} operationsByMethod={operationsByMethod} generator={this}>
          {this.options.parsers.map((parser) => {
            if (typeof parser === 'string' && parser === 'mock') {
              return null
            }
            if (typeof parser === 'string' && parser === 'operations') {
              return <operationsParser.templates.Operations key="operations" />
            }

            return <parser.templates.Operations key={parser.name} />
          })}
        </Oas>
      </App>,
    )

    return root.files
  }

  async operation(operation: Operation, options: PluginMsw['resolvedOptions']): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin, mode } = this.context

    const root = createRoot({
      logger: pluginManager.logger,
    })

    root.render(
      <App pluginManager={pluginManager} plugin={{ ...plugin, options }} mode={mode}>
        <Oas oas={oas} operations={[operation]} generator={this}>
          <Oas.Operation operation={operation}>
            {options.parsers.map((parser) => {
              if (typeof parser === 'string' && parser === 'mock') {
                return <mockParser.templates.Operation key="mock" />
              }
              if (typeof parser === 'string' && parser === 'operations') {
                return null
              }

              return <parser.templates.Operation key={parser.name} />
            })}
          </Oas.Operation>
        </Oas>
      </App>,
    )

    return root.files
  }
}
