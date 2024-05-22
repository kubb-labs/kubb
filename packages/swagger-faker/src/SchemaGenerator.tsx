import type { SchemaObject } from '@kubb/oas'
import { SchemaGenerator as Generator } from '@kubb/plugin-oas'
import type { SchemaMethodResult } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'
import { App, createRoot } from '@kubb/react'
import { Schema } from './components/Schema.tsx'
import type { FileMeta, PluginFaker } from './types.ts'

export class SchemaGenerator extends Generator<PluginFaker['resolvedOptions'], PluginFaker> {
  async schema(name: string, schema: SchemaObject, options: PluginFaker['resolvedOptions']): SchemaMethodResult<FileMeta> {
    const { oas, pluginManager, plugin, mode, output } = this.context

    const root = createRoot({
      logger: pluginManager.logger,
    })

    const tree = this.parse({ schema, name })

    root.render(
      <App pluginManager={pluginManager} plugin={{ ...plugin, options }} mode={mode}>
        <Oas oas={oas}>
          <Oas.Schema name={name} value={schema} tree={tree}>
            <Schema.File />
          </Oas.Schema>
        </Oas>
      </App>,
    )

    return root.files
  }
}
