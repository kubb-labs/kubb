import { OperationGenerator as Generator } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'
import { App, createRoot } from '@kubb/react'

import type { Operation } from '@kubb/oas'
import type { OperationMethodResult } from '@kubb/plugin-oas'
import type { FileMeta, PluginReactQuery } from './types.ts'

import { queryParser } from './parsers/queryParser.tsx'
// import { mutationParser } from './parsers/mutationParser.tsx'

export class OperationGenerator extends Generator<PluginReactQuery['resolvedOptions'], PluginReactQuery, FileMeta> {
  async operation(operation: Operation, options: PluginReactQuery['resolvedOptions']): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin, mode } = this.context

    const root = createRoot({
      logger: pluginManager.logger,
    })

    root.render(
      <App pluginManager={pluginManager} plugin={{ ...plugin, options }} mode={mode}>
        <Oas oas={oas} operations={[operation]} generator={this}>
          <Oas.Operation operation={operation}>
            {options.parsers.map((parser) => {
              if (typeof parser === 'string' && parser === 'query') {
                return <queryParser.templates.Operation key="query" operation={operation} options={options} />
              }
              if (typeof parser === 'string' && parser === 'mutation') {
                return null
                // return <mutationParser.templates.Operation key="mutation" operation={operation} options={options} />
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
