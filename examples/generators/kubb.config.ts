import { defineConfig } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginOas } from '@kubb/plugin-oas'
import { example1 } from './src/generators/example1'
import { example2 } from './src/generators/example2'
import { example3 } from './src/generators/example3'

const input = { path: './petStore.yaml' } as const

export default defineConfig([
  {
    root: '.',
    input,
    output: {
      path: './src/gen',
      clean: true,
    },
    parsers: [parserTs],
    plugins: [
      pluginOas({
        output: { path: './example1.ts' },
        validate: false,
        generators: [example1],
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen2' },
    parsers: [parserTs],
    plugins: [
      pluginOas({
        output: { path: './example2.ts' },
        validate: false,
        generators: [example2],
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen3' },
    hooks: {
      done: ['npm run typecheck', 'biome format --write ./', 'biome lint --fix --unsafe ./src'],
    },
    parsers: [parserTs],
    plugins: [
      pluginOas({
        output: { path: './example3.tsx' },
        validate: false,
        generators: [example3],
      }),
    ],
  },
])
