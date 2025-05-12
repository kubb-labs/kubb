import { camelCase } from '@kubb/core/transformers'
import { createGenerator } from '../generator.tsx'
import type { PluginOas } from '../types.ts'
import { getBanner } from '../utils/getBanner.ts'
import { getFooter } from '../utils/getFooter.ts'

export const jsonGenerator = createGenerator<PluginOas>({
  name: 'plugin-oas',
  async schema({ schema, instance }) {
    const { pluginManager, plugin } = instance.context
    const file = pluginManager.getFile({
      name: camelCase(schema.name),
      extname: '.json',
      mode: 'split',
      pluginKey: plugin.key,
    })

    return [
      {
        ...file,
        sources: [
          {
            name: camelCase(schema.name),
            isExportable: false,
            isIndexable: false,
            value: JSON.stringify(schema.value),
          },
        ],
        banner: getBanner({
          oas: instance.context.oas,
          output: plugin.options.output,
          config: pluginManager.config,
        }),
        format: getFooter({ oas: instance.context.oas, output: plugin.options.output }),
      },
    ]
  },
})
