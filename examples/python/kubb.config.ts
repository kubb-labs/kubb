import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginClient } from '@kubb/swagger-client'

import * as client from './templates/client/index'

export default defineConfig(async () => {
  return {
    root: '.',
    input: {
      // path: './test.json',
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
      clean: true,
    },
    plugins: [
      pluginOas({ output: false, validate: true }),
      pluginClient({
        output: {
          path: './',
          exportType: false,
        },
        group: { type: 'tag', output: './{{tag}}Service' },
        templates: {
          client: client.templates,
          operations: false,
        },
      }),
    ],
  }
})
