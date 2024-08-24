import type { SchemaObject } from '@kubb/oas'
import { createReactParser, SchemaGenerator as Generator } from '@kubb/plugin-oas'
import type { SchemaMethodResult } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'
import { App, createRoot } from '@kubb/react'
import { Schema } from './components/Schema.tsx'
import type { FileMeta, PluginZod } from './types.ts'
import { Operations } from './components/Operations.tsx'
import { OperationSchema } from './components/OperationSchema.tsx'

export const zodParser = createReactParser<PluginZod>({
  name: 'plugin-zod',
  Operations({ options }) {
    if (!options.templates.operations) {
      return null
    }

    return <Operations.File templates={options.templates.operations} />
  },
  Operation({ options }) {
    return <OperationSchema.File />
  },
  Schema() {
    return <Schema.File />
  },
})

/**
 * @deprecated replaced by zodParser
 */
export class SchemaGenerator extends Generator<PluginZod['resolvedOptions'], PluginZod> {
  async schema(name: string, schema: SchemaObject, options: PluginZod['resolvedOptions']): SchemaMethodResult<FileMeta> {
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
