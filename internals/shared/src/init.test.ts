import { describe, expect, it } from 'vitest'
import { availablePlugins } from './constants.ts'
import { generateConfigFile } from './init.ts'

describe('generateConfigFile', () => {
  it('generates a config with a single plugin', () => {
    const [pluginTs] = availablePlugins
    const result = generateConfigFile({ selectedPlugins: [pluginTs!], inputPath: './openapi.yaml', outputPath: './src/gen' })
    expect(result).toMatchInlineSnapshot(`
      "import { defineConfig } from 'kubb'
      import { pluginTs } from '@kubb/plugin-ts'

      export default defineConfig({
        root: '.',
        input: {
          path: './openapi.yaml',
        },
        output: {
          path: './src/gen',
          clean: true,
        },
        plugins: [
          pluginTs(),
        ],
      })
      "
    `)
  })

  it('generates imports for every selected plugin', () => {
    const selected = availablePlugins.filter((p) => ['plugin-ts', 'plugin-zod'].includes(p.value))
    const result = generateConfigFile({ selectedPlugins: selected, inputPath: './spec.json', outputPath: './out' })
    expect(result).toMatchInlineSnapshot(`
      "import { defineConfig } from 'kubb'
      import { pluginTs } from '@kubb/plugin-ts'
      import { pluginZod } from '@kubb/plugin-zod'

      export default defineConfig({
        root: '.',
        input: {
          path: './spec.json',
        },
        output: {
          path: './out',
          clean: true,
        },
        plugins: [
          pluginTs(),
          pluginZod(),
        ],
      })
      "
    `)
  })

  it('falls back to importName() call for an unknown plugin value', () => {
    const unknown = {
      value: 'plugin-unknown',
      label: 'Unknown',
      packageName: '@kubb/plugin-unknown',
      importName: 'pluginUnknown',
      category: 'types' as const,
    }
    const result = generateConfigFile({ selectedPlugins: [unknown], inputPath: './a.yaml', outputPath: './b' })
    expect(result).toMatchInlineSnapshot(`
      "import { defineConfig } from 'kubb'
      import { pluginUnknown } from '@kubb/plugin-unknown'

      export default defineConfig({
        root: '.',
        input: {
          path: './a.yaml',
        },
        output: {
          path: './b',
          clean: true,
        },
        plugins: [
          pluginUnknown(),
        ],
      })
      "
    `)
  })

  it('produces a valid ESM default export', () => {
    const [pluginTs] = availablePlugins
    const result = generateConfigFile({ selectedPlugins: [pluginTs!], inputPath: './api.yaml', outputPath: './gen' })
    expect(result).toMatchInlineSnapshot(`
      "import { defineConfig } from 'kubb'
      import { pluginTs } from '@kubb/plugin-ts'

      export default defineConfig({
        root: '.',
        input: {
          path: './api.yaml',
        },
        output: {
          path: './gen',
          clean: true,
        },
        plugins: [
          pluginTs(),
        ],
      })
      "
    `)
  })

  it('handles an empty plugin list', () => {
    const result = generateConfigFile({ selectedPlugins: [], inputPath: './api.yaml', outputPath: './gen' })
    expect(result).toMatchInlineSnapshot(`
      "import { defineConfig } from 'kubb'


      export default defineConfig({
        root: '.',
        input: {
          path: './api.yaml',
        },
        output: {
          path: './gen',
          clean: true,
        },
        plugins: [

        ],
      })
      "
    `)
  })
})
