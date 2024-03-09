import { createRoot } from '@kubb/react'
import { OperationGenerator as Generator } from '@kubb/swagger'
import { Oas } from '@kubb/swagger/components'

import { Definitions } from './components/Definitions.tsx'

import type { AppContextProps } from '@kubb/react'
import type { OperationMethodResult, Paths } from '@kubb/swagger'
import type { FileMeta, PluginOptions } from './types.ts'

export class OperationGenerator extends Generator<PluginOptions['resolvedOptions'], PluginOptions> {
  async all(paths: Paths): OperationMethodResult<FileMeta> {
    const { oas, pluginManager, plugin } = this.context

    const root = createRoot<AppContextProps<PluginOptions['appMeta']>>({ logger: pluginManager.logger })

    root.render(
      <Oas oas={oas}>
        <Definitions.File name={this.options.name} baseURL={this.options.baseURL} paths={paths} />
      </Oas>,
      {
        meta: { pluginManager, plugin },
      },
    )

    return root.files
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
