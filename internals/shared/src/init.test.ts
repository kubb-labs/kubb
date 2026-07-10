import { describe, expect, it } from 'vitest'
import { availablePlugins } from './constants.ts'
import { generateConfigFile, resolvePlugins, withDistTag } from './init.ts'

describe('resolvePlugins', () => {
  it('returns an empty list when no flag is given', () => {
    const result = resolvePlugins(undefined)
    expect(result.map((plugin) => plugin.value)).toMatchInlineSnapshot(`
      []
    `)
  })

  it('returns matched plugins for a comma-separated list', () => {
    const result = resolvePlugins('plugin-ts,plugin-zod')
    expect(result.map((plugin) => plugin.value)).toMatchInlineSnapshot(`
      [
        "plugin-ts",
        "plugin-zod",
      ]
    `)
  })

  it('returns an empty list for unrecognized plugins', () => {
    const result = resolvePlugins('plugin-does-not-exist')
    expect(result.map((plugin) => plugin.value)).toMatchInlineSnapshot(`
      []
    `)
  })
})

describe('generateConfigFile', () => {
  it('generates a config with a single plugin', () => {
    const [pluginTs] = availablePlugins
    const result = generateConfigFile({ selectedPlugins: [pluginTs!], inputPath: './openapi.yaml', outputPath: './src/gen' })
    expect(result).toMatchInlineSnapshot(`
      "import { defineConfig } from 'kubb/config'
      import { pluginTs } from '@kubb/plugin-ts'

      export default defineConfig({
        input: './openapi.yaml',
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
      "import { defineConfig } from 'kubb/config'
      import { pluginTs } from '@kubb/plugin-ts'
      import { pluginZod } from '@kubb/plugin-zod'

      export default defineConfig({
        input: './spec.json',
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
      "import { defineConfig } from 'kubb/config'
      import { pluginUnknown } from '@kubb/plugin-unknown'

      export default defineConfig({
        input: './a.yaml',
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
      "import { defineConfig } from 'kubb/config'
      import { pluginTs } from '@kubb/plugin-ts'

      export default defineConfig({
        input: './api.yaml',
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
      "import { defineConfig } from 'kubb/config'


      export default defineConfig({
        input: './api.yaml',
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

describe('withDistTag', () => {
  it('pins packages to the beta tag for a beta CLI version', () => {
    const result = withDistTag({ packages: ['kubb', '@kubb/plugin-ts'], version: '5.0.0-beta.94' })
    expect(result).toStrictEqual(['kubb@beta', '@kubb/plugin-ts@beta'])
  })

  it('pins packages to another prerelease tag when the version carries one', () => {
    const result = withDistTag({ packages: ['kubb'], version: '5.0.0-alpha.1' })
    expect(result).toStrictEqual(['kubb@alpha'])
  })

  it('pins packages to latest for a stable CLI version', () => {
    const result = withDistTag({ packages: ['kubb', '@kubb/plugin-zod'], version: '5.0.0' })
    expect(result).toStrictEqual(['kubb@latest', '@kubb/plugin-zod@latest'])
  })
})
