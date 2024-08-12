import { OperationGenerator as Generator } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'
import { App, createRoot } from '@kubb/react'

import { Definitions } from './components/Definitions.tsx'

import type { Operation } from '@kubb/oas'
import type { OperationMethodResult, OperationsByMethod } from '@kubb/plugin-oas'
import type { FileMeta, PluginZodios } from './types.ts'
import { definitionsParser } from './parsers/definitionsParser.tsx'

export class OperationGenerator extends Generator<PluginZodios['resolvedOptions'], PluginZodios> {
  async all(operations: Operation[], operationsByMethod: OperationsByMethod): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin, mode } = this.context

    const root = createRoot({
      logger: pluginManager.logger,
    })

    root.render(
      <App pluginManager={pluginManager} plugin={plugin} mode={mode}>
        <Oas oas={oas} operations={operations} generator={this}>
          {this.options.parsers.map((parser) => {
            if (typeof parser === 'string' && parser === 'definitions') {
              return (
                <definitionsParser.templates.Operations
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
}
