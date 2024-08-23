import { OperationGenerator as Generator } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'
import { App, createRoot } from '@kubb/react'

import { OperationSchema } from './components/OperationSchema.tsx'

import type { Operation } from '@kubb/oas'
import type { OperationMethodResult } from '@kubb/plugin-oas'
import type { FileMeta, PluginFaker } from './types.ts'

export class OperationGenerator extends Generator<PluginFaker['resolvedOptions'], PluginFaker> {
  async operation(operation: Operation, options: PluginFaker['resolvedOptions']): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin, mode } = this.context

    const root = createRoot({
      logger: pluginManager.logger,
    })
    root.render(
      <App pluginManager={pluginManager} plugin={{ ...plugin, options }} mode={mode}>
        <Oas oas={oas} operations={[operation]} generator={this}>
          <Oas.Operation operation={operation}>
            <OperationSchema.File />
          </Oas.Operation>
        </Oas>
      </App>,
    )

    return root.files
  }
}
