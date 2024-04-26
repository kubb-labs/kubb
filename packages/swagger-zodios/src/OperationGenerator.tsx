import { App, createRoot } from '@kubb/react'
import { OperationGenerator as Generator } from '@kubb/swagger'
import { Oas } from '@kubb/swagger/components'

import { Definitions } from './components/Definitions.tsx'

import type { Operation } from '@kubb/oas'
import type { OperationMethodResult, OperationsByMethod } from '@kubb/swagger'
import type { FileMeta, PluginOptions } from './types.ts'

export class OperationGenerator extends Generator<PluginOptions['resolvedOptions'], PluginOptions> {
  async all(operations: Operation[], operationsByMethod: OperationsByMethod): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin, mode } = this.context

    const root = createRoot({
      logger: pluginManager.logger,
    })

    root.render(
      <App pluginManager={pluginManager} plugin={plugin} mode={mode}>
        <Oas oas={oas} operations={operations} getOperationSchemas={(...props) => this.getSchemas(...props)}>
          <Definitions.File name={this.options.name} baseURL={this.options.baseURL} operationsByMethod={operationsByMethod} />
        </Oas>
      </App>,
    )

    return root.files
  }

  async operation(): OperationMethodResult<FileMeta> {
    return null
  }

  async get(): OperationMethodResult<FileMeta> {
    return null
  }

  async post(): OperationMethodResult<FileMeta> {
    return null
  }
  async patch(): OperationMethodResult<FileMeta> {
    return null
  }

  async put(): OperationMethodResult<FileMeta> {
    return null
  }

  async delete(): OperationMethodResult<FileMeta> {
    return null
  }
}
