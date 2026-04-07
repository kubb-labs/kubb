import { camelCase } from '@internals/utils'
import { createSource, createText } from '@kubb/ast'
import type { PluginOas } from '../types.ts'
import { getBanner } from '../utils/getBanner.ts'
import { getFooter } from '../utils/getFooter.ts'
import { createGenerator } from './createGenerator.ts'

export const jsonGenerator = createGenerator<PluginOas>({
  name: 'plugin-oas',
  async schema({ schema, generator }) {
    const { driver, plugin } = generator.context
    const file = driver.getFile({
      name: camelCase(schema.name),
      extname: '.json',
      mode: 'split',
      pluginName: plugin.name,
    })

    return [
      {
        ...file,
        sources: [
          createSource({
            name: camelCase(schema.name),
            isExportable: false,
            isIndexable: false,
            nodes: [createText(JSON.stringify(schema.value))],
          }),
        ],
        banner: getBanner({
          oas: generator.context.oas,
          output: plugin.options.output,
          config: driver.config,
        }),
        format: getFooter({ oas: generator.context.oas, output: plugin.options.output }),
      },
    ]
  },
})
