import { describe, expect, it } from 'vitest'
import { availablePlugins } from './constants.ts'
import { generateConfigFile, mergePluginsIntoConfig, resolveInstallVersions, resolvePlugins } from './init.ts'

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

describe('resolveInstallVersions', () => {
  it('pins kubb to the CLI version and plugins to the beta tag for a beta CLI version', () => {
    const result = resolveInstallVersions({ packages: ['kubb', '@kubb/plugin-ts'], version: '5.0.0-beta.94' })
    expect(result).toStrictEqual(['kubb@5.0.0-beta.94', '@kubb/plugin-ts@beta'])
  })

  it('pins plugins to another prerelease tag when the version carries one', () => {
    const result = resolveInstallVersions({ packages: ['kubb', '@kubb/plugin-zod'], version: '5.0.0-alpha.1' })
    expect(result).toStrictEqual(['kubb@5.0.0-alpha.1', '@kubb/plugin-zod@alpha'])
  })

  it('pins plugins to latest for a stable CLI version', () => {
    const result = resolveInstallVersions({ packages: ['kubb', '@kubb/plugin-zod'], version: '5.0.0' })
    expect(result).toStrictEqual(['kubb@5.0.0', '@kubb/plugin-zod@latest'])
  })
})

describe('mergePluginsIntoConfig', () => {
  const existing = [
    `import { defineConfig } from 'kubb/config'`,
    `import { pluginTs } from '@kubb/plugin-ts'`,
    ``,
    `// Our spec lives outside the repo.`,
    `const input = process.env.SPEC ?? './openapi.yaml'`,
    ``,
    `export default defineConfig({`,
    `  input,`,
    `  output: { path: './src/gen', clean: true },`,
    `  plugins: [`,
    `    pluginTs({ enum: { type: 'asConst' } }),`,
    `  ],`,
    `})`,
    ``,
  ].join('\n')

  it('adds the new plugin and keeps the hand-written parts', () => {
    const result = mergePluginsIntoConfig({ source: existing, selectedPlugins: resolvePlugins('plugin-zod') })
    expect(result.source).toMatchInlineSnapshot(`
      "import { defineConfig } from 'kubb/config'
      import { pluginTs } from '@kubb/plugin-ts'
      import { pluginZod } from '@kubb/plugin-zod'

      // Our spec lives outside the repo.
      const input = process.env.SPEC ?? './openapi.yaml'

      export default defineConfig({
        input,
        output: { path: './src/gen', clean: true },
        plugins: [
          pluginTs({ enum: { type: 'asConst' } }),
          pluginZod(),
        ],
      })
      "
    `)
  })

  it('skips a plugin the file already has, without touching the file', () => {
    const result = mergePluginsIntoConfig({ source: existing, selectedPlugins: resolvePlugins('plugin-ts') })
    expect({ changed: result.changed, added: result.added, skipped: result.skipped }).toMatchInlineSnapshot(`
      {
        "added": [],
        "changed": false,
        "skipped": [
          {
            "plugin": "@kubb/plugin-ts",
            "reason": "@kubb/plugin-ts is already in the plugins array",
          },
        ],
      }
    `)
  })

  it('adds only the missing ones out of a mixed selection', () => {
    const result = mergePluginsIntoConfig({ source: existing, selectedPlugins: resolvePlugins('plugin-ts,plugin-zod,plugin-msw') })
    expect({ added: result.added, skipped: result.skipped }).toMatchInlineSnapshot(`
      {
        "added": [
          "@kubb/plugin-zod",
          "@kubb/plugin-msw",
        ],
        "skipped": [
          {
            "plugin": "@kubb/plugin-ts",
            "reason": "@kubb/plugin-ts is already in the plugins array",
          },
        ],
      }
    `)
  })

  it('reports an unsupported config shape instead of rewriting it', () => {
    const arrayConfig = `export default defineConfig([{ name: 'a', plugins: [] }])\n`
    const result = mergePluginsIntoConfig({ source: arrayConfig, selectedPlugins: resolvePlugins('plugin-zod') })
    expect({ changed: result.changed, source: result.source, skipped: result.skipped }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "skipped": [
          {
            "plugin": "@kubb/plugin-zod",
            "reason": "config is not a single object literal, array configs are not supported",
          },
        ],
        "source": "export default defineConfig([{ name: 'a', plugins: [] }])
      ",
      }
    `)
  })
})
