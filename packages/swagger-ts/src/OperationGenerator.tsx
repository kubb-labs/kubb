import { App, createRoot } from '@kubb/react'
import { OperationGenerator as Generator } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'

import { OasType } from './components/OasType.tsx'
import { OperationSchema } from './components/OperationSchema.tsx'

import type { Operation } from '@kubb/oas'
import type { OperationMethodResult } from '@kubb/plugin-oas'
import type { FileMeta, PluginTs } from './types.ts'

export class OperationGenerator extends Generator<PluginTs['resolvedOptions'], PluginTs> {
  async all(operations: Operation[]): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin, mode } = this.context

    const root = createRoot({
      logger: pluginManager.logger,
    })

    root.render(
      <App pluginManager={pluginManager} plugin={plugin} mode={mode}>
        <Oas oas={oas} operations={operations} generator={this}>
          {plugin.options.oasType && <OasType.File name="oas" typeName="Oas" />}
        </Oas>
      </App>,
    )

    return root.files
  }

  async operation(operation: Operation, options: PluginTs['resolvedOptions']): OperationMethodResult<FileMeta> {
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

  async get(): OperationMethodResult<FileMeta> {
    return null
  }

  async post(): OperationMethodResult<FileMeta> {
    return null
  }

  async put(): OperationMethodResult<FileMeta> {
    return null
  }
  async patch(): OperationMethodResult<FileMeta> {
    return null
  }
  async delete(): OperationMethodResult<FileMeta> {
    return null
  }
}
