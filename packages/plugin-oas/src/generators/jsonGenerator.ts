import { camelCase } from '@kubb/core/transformers'
import { createGenerator } from '../generator.tsx'
import type { PluginOas } from '../types.ts'

export const jsonGenerator = createGenerator<PluginOas>({
  name: 'plugin-oas',
  async schema({ schema, name, instance }) {
    const { pluginManager, plugin } = instance.context
    const file = pluginManager.getFile({
      name: camelCase(name),
      extName: '.json',
      mode: 'split',
      pluginKey: plugin.key,
    })

    return [
      {
        ...file,
        sources: [
          {
            name: camelCase(name),
            isExportable: false,
            isIndexable: false,
            value: JSON.stringify(schema),
          },
        ],
      },
    ]
  },
})
