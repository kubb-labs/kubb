import { createRoot } from '@kubb/react'
import { OperationGenerator as Generator } from '@kubb/swagger'
import { Oas } from '@kubb/swagger/components'

import { Client, Operations } from './components/index.ts'

import type { AppContextProps } from '@kubb/react'
import type { OperationMethodResult, OperationsByMethod } from '@kubb/swagger'
import type { Operation } from '@kubb/swagger/oas'
import type { FileMeta, PluginOptions } from './types.ts'

export class OperationGenerator extends Generator<PluginOptions['resolvedOptions'], PluginOptions> {
  async all(operations: Operation[], _operationsByMethod: OperationsByMethod): OperationMethodResult<FileMeta> {
    const { pluginManager, oas, plugin } = this.context

    const root = createRoot<AppContextProps<PluginOptions['appMeta']>>({
      logger: pluginManager.logger,
    })

    const templates = {
      operations: Operations.templates,
      client: Client.templates,
      ...this.options.templates,
    }

    root.render(
      <Oas oas={oas} operations={operations} getOperationSchemas={(...props) => this.getSchemas(...props)}>
        {templates.operations && <Operations.File templates={templates.operations} />}
      </Oas>,
      { meta: { pluginManager, plugin } },
    )

    return root.files
  }

  async operation(operation: Operation, options: PluginOptions['resolvedOptions']): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin } = this.context

    const root = createRoot<AppContextProps<PluginOptions['appMeta']>>({
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
      <Oas oas={oas} operations={[operation]} getOperationSchemas={(...props) => this.getSchemas(...props)}>
        <Oas.Operation operation={operation}>
          <Client.File templates={templates.client} />
        </Oas.Operation>
      </Oas>,
      { meta: { pluginManager, plugin: { ...plugin, options } } },
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
