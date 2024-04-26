import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerClient } from '@kubb/swagger-client'

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
      createSwagger({ output: false, validate: true }),
      createSwaggerClient({
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
