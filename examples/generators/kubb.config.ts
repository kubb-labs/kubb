// import '@kubb/react/devtools' // enable/disable devtools

import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { example1 } from './src/generators/example1'
import { example2 } from './src/generators/example2'
import { example3 } from './src/generators/example3'

export default defineConfig(() => {
  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    hooks: {
      done: ['npm run typecheck', 'biome format --write ./', 'biome lint --apply-unsafe ./src'],
    },
    output: {
      path: './src/gen',
      clean: true,
    },
    plugins: [
      pluginOas({
        output: {
          path: './example1.ts',
        },
        validate: false,
        generators: [example1],
      }),
      pluginOas({
        output: {
          path: './example2.ts',
        },
        validate: false,
        generators: [example2],
      }),
      pluginOas({
        output: {
          path: './example3.tsx',
        },
        validate: false,
        generators: [example3],
      }),
    ],
  }
})
