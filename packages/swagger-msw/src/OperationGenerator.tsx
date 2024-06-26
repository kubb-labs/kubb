import { OperationGenerator as Generator } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'
import { App, createRoot } from '@kubb/react'

import { Mock } from './components/Mock.tsx'
import { Operations } from './components/Operations.tsx'

import type { Operation } from '@kubb/oas'
import type { OperationMethodResult, OperationsByMethod } from '@kubb/plugin-oas'
import type { FileMeta, PluginMsw } from './types.ts'

export class OperationGenerator extends Generator<PluginMsw['resolvedOptions'], PluginMsw> {
  async all(operations: Operation[], operationsByMethod: OperationsByMethod): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin, mode } = this.context

    const root = createRoot({
      logger: pluginManager.logger,
    })

    const templates = {
      operations: Operations.templates,
      mock: Mock.templates,
      ...this.options.templates,
    }

    root.render(
      <App pluginManager={pluginManager} plugin={plugin} mode={mode}>
        <Oas oas={oas} operations={operations} generator={this}>
          {templates?.operations && <Operations.File templates={templates.operations} />}
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

    const templates = {
      handlers: Operations.templates,
      mock: Mock.templates,
      ...options.templates,
    }

    if (!templates?.mock) {
      return []
    }

    root.render(
      <App pluginManager={pluginManager} plugin={{ ...plugin, options }} mode={mode}>
        <Oas oas={oas} operations={[operation]} generator={this}>
          <Oas.Operation operation={operation}>
            <Mock.File templates={templates.mock} />
          </Oas.Operation>
        </Oas>
      </App>,
    )

    return root.files
  }
}
