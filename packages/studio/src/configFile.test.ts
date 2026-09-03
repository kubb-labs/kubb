import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { applyConfigEdits, isOptionValue, readConfig } from './configFile.ts'
import type { ConfigEdit, ConfigFileView, PluginView } from './protocol/index.ts'

const advanced = readFileSync(join(import.meta.dirname, '../mocks/advanced.config.txt'), 'utf8')
const arrayConfig = readFileSync(join(import.meta.dirname, '../mocks/array.config.txt'), 'utf8')

/**
 * `view` with one plugin's option replaced, or dropped when `option` is `undefined`. Diffing a
 * "before" view read this way against the "after" view proves an edit touched only that option,
 * everything else in the config had to already match for the two views to compare equal.
 */
function withOption({
  view,
  packageName,
  key,
  option,
}: {
  view: ConfigFileView
  packageName: string
  key: string
  option: PluginView['options'][string] | undefined
}): ConfigFileView {
  if (!view.managed) {
    return view
  }
  return {
    ...view,
    configs: view.configs.map((config) => ({
      ...config,
      plugins: config.plugins.map((plugin) => {
        if (plugin.packageName !== packageName) {
          return plugin
        }
        const options = { ...plugin.options }
        if (option === undefined) {
          delete options[key]
        } else {
          options[key] = option
        }
        return { ...plugin, options }
      }),
    })),
  }
}

describe('readConfig', () => {
  it('lists every plugin in the advanced example, marking function-valued options as not literal', () => {
    const view = readConfig(advanced)
    expect(view.managed && view.configs[0]!.plugins.map((plugin) => `${plugin.importName} <- ${plugin.packageName}`)).toStrictEqual([
      'pluginRedoc <- @kubb/plugin-redoc',
      'pluginTs <- @kubb/plugin-ts',
      'pluginZod <- @kubb/plugin-zod',
      'pluginReactQuery <- @kubb/plugin-react-query',
      'pluginAxios <- @kubb/plugin-axios',
      'pluginMcp <- @kubb/plugin-mcp',
      'pluginFaker <- @kubb/plugin-faker',
      'pluginCypress <- @kubb/plugin-cypress',
      'pluginMsw <- @kubb/plugin-msw',
    ])
    const byName = view.managed ? Object.fromEntries(view.configs[0]!.plugins.map((plugin) => [plugin.importName, plugin.options])) : {}
    expect({
      'axios.group': byName.pluginAxios?.group,
      'axios.baseURL': byName.pluginAxios?.baseURL,
      'faker.macros': byName.pluginFaker?.macros,
      'faker.resolver': byName.pluginFaker?.resolver,
      'faker.group': byName.pluginFaker?.group,
      'ts.override': byName.pluginTs?.override,
    }).toStrictEqual({
      'axios.baseURL': {
        literal: true,
        value: 'https://petstore3.swagger.io/api/v3',
      },
      'axios.group': {
        literal: false,
      },
      'faker.group': {
        literal: true,
        value: {
          type: 'tag',
        },
      },
      'faker.macros': {
        literal: false,
      },
      'faker.resolver': {
        literal: false,
      },
      'ts.override': {
        literal: true,
        value: [
          {
            options: {
              enum: {
                constCasing: 'camelCase',
                keyCasing: 'none',
                type: 'enum',
                typeSuffix: 'Key',
              },
            },
            pattern: 'findPetsByStatus',
            type: 'operationId',
          },
        ],
      },
    })
  })

  it('refuses a function returning an array', () => {
    expect(readConfig(`export default defineConfig(() => schemas.map((s) => ({ name: s })))`)).toStrictEqual({
      managed: false,
      reason: 'config is not an object literal',
    })
  })

  it('classifies a negative number and a template literal as literal without throwing', () => {
    const source = `import { pluginTs } from '@kubb/plugin-ts'\n\nexport default defineConfig({ plugins: [pluginTs({ n: -1, banner: \`static\` })] })\n`
    const view = readConfig(source)
    expect(view.managed && view.configs[0]!.plugins[0]!.options).toStrictEqual({
      banner: {
        literal: true,
        value: 'static',
      },
      n: {
        literal: true,
        value: -1,
      },
    })
  })

  describe('every defineConfig format', () => {
    const imports = `import { pluginTs } from '@kubb/plugin-ts'\nimport { pluginZod } from '@kubb/plugin-zod'`
    const config = `{ plugins: [pluginTs({ arrayType: 'generic' }), pluginZod()] }`

    const oneConfig = {
      managed: true,
      configs: [
        {
          name: undefined,
          plugins: [
            { importName: 'pluginTs', packageName: '@kubb/plugin-ts', options: { arrayType: { literal: true, value: 'generic' } } },
            { importName: 'pluginZod', packageName: '@kubb/plugin-zod', options: {} },
          ],
        },
      ],
    }
    const twoConfigs = { managed: true, configs: [oneConfig.configs[0]!, oneConfig.configs[0]!] }

    const formats: Array<[label: string, body: string, expected: typeof oneConfig]> = [
      ['a plain object', `defineConfig(${config})`, oneConfig],
      ['an arrow returning the config directly', `defineConfig(() => (${config}))`, oneConfig],
      ['an arrow returning from a block body', `defineConfig(() => { return ${config} })`, oneConfig],
      ['an async arrow returning the config directly', `defineConfig(async () => (${config}))`, oneConfig],
      ['an async arrow returning from a block body', `defineConfig(async () => { return ${config} })`, oneConfig],
      ['a function expression returning from a block body', `defineConfig(function () { return ${config} })`, oneConfig],
      ['an arrow that takes the CLI options', `defineConfig((cli) => (${config}))`, oneConfig],
      ['a config with a satisfies assertion', `defineConfig(${config} satisfies UserConfig)`, oneConfig],
      ['a config with an as const assertion', `defineConfig(${config} as const)`, oneConfig],
      ['an array of configs', `defineConfig([${config}, ${config}])`, twoConfigs],
      ['a function returning an array of configs', `defineConfig(() => [${config}, ${config}])`, twoConfigs],
    ]

    it.each(formats)('reads %s', (_label, body, expected) => {
      expect(readConfig(`${imports}\nexport default ${body}`)).toStrictEqual(expected)
    })
  })
})

describe('applyConfigEdits', () => {
  describe('set', () => {
    it('changes only the targeted option, leaving the rest of the config the same', () => {
      const result = applyConfigEdits(advanced, [{ operation: 'set', plugin: '@kubb/plugin-ts', path: ['enum', 'type'], value: 'enum' }])
      expect(readConfig(result.source)).toStrictEqual(
        withOption({ view: readConfig(advanced), packageName: '@kubb/plugin-ts', key: 'enum', option: { literal: true, value: { type: 'enum' } } }),
      )
    })

    it('adds a missing key to an existing options object', () => {
      const result = applyConfigEdits(advanced, [{ operation: 'set', plugin: '@kubb/plugin-zod', path: ['typedSchema'], value: true }])
      expect(readConfig(result.source)).toStrictEqual(
        withOption({ view: readConfig(advanced), packageName: '@kubb/plugin-zod', key: 'typedSchema', option: { literal: true, value: true } }),
      )
    })

    it('creates the options object for a plugin called bare', () => {
      const result = applyConfigEdits(advanced, [{ operation: 'set', plugin: '@kubb/plugin-redoc', path: ['output', 'path'], value: './docs' }])
      expect(readConfig(result.source)).toStrictEqual(
        withOption({ view: readConfig(advanced), packageName: '@kubb/plugin-redoc', key: 'output', option: { literal: true, value: { path: './docs' } } }),
      )
    })

    it('resolves a plugin imported under an alias', () => {
      const source = `import { pluginTs as tsPlugin } from '@kubb/plugin-ts'\n\nexport default defineConfig({ plugins: [tsPlugin({ arrayType: 'generic' })] })\n`
      const view = readConfig(source)
      expect(view.managed && view.configs[0]!.plugins).toStrictEqual([
        { importName: 'tsPlugin', options: { arrayType: { literal: true, value: 'generic' } }, packageName: '@kubb/plugin-ts' },
      ])

      const result = applyConfigEdits(source, [{ operation: 'set', plugin: '@kubb/plugin-ts', path: ['arrayType'], value: 'array' }])
      expect(readConfig(result.source)).toStrictEqual(
        withOption({ view: readConfig(source), packageName: '@kubb/plugin-ts', key: 'arrayType', option: { literal: true, value: 'array' } }),
      )
    })

    it('preserves comments and code around the config', () => {
      const source = [
        `import { defineConfig } from 'kubb/config'`,
        `import { pluginTs } from '@kubb/plugin-ts'`,
        ``,
        `// Only generate the public surface in CI.`,
        `const isCI = process.env.CI === 'true'`,
        ``,
        `export function helper() {`,
        `  return isCI`,
        `}`,
        ``,
        `export default defineConfig({`,
        `  input: './api.yaml',`,
        `  plugins: [`,
        `    // keep the enum shape stable for consumers`,
        `    pluginTs({ enum: { type: 'asConst' } }),`,
        `  ],`,
        `})`,
        ``,
      ].join('\n')
      const result = applyConfigEdits(source, [{ operation: 'set', plugin: '@kubb/plugin-ts', path: ['enum', 'type'], value: 'enum' }])
      expect(result.source).toMatchInlineSnapshot(`
        "import { defineConfig } from 'kubb/config'
        import { pluginTs } from '@kubb/plugin-ts'

        // Only generate the public surface in CI.
        const isCI = process.env.CI === 'true'

        export function helper() {
          return isCI
        }

        export default defineConfig({
          input: './api.yaml',
          plugins: [
            // keep the enum shape stable for consumers
            pluginTs({ enum: { type: 'enum' } }),
          ],
        })
        "
      `)
    })

    const setRefusals: Array<[label: string, edit: ConfigEdit, reason: string]> = [
      [
        'an option customized in code',
        { operation: 'set', plugin: '@kubb/plugin-axios', path: ['group', 'name'], value: 'x' },
        'group.name is customized in code',
      ],
      [
        'a plugin that is not in the file',
        { operation: 'set', plugin: '@kubb/plugin-swr', path: ['hooks'], value: true },
        '@kubb/plugin-swr is not in the plugins array',
      ],
    ]

    it.each(setRefusals)('refuses %s', (_label, edit, reason) => {
      const result = applyConfigEdits(advanced, [edit])
      expect({ changed: result.changed, outcomes: result.outcomes.map((outcome) => outcome.reason) }).toStrictEqual({ changed: false, outcomes: [reason] })
    })

    it('applies the good edits in a batch, reports the bad one, and touches nothing else', () => {
      const result = applyConfigEdits(advanced, [
        { operation: 'set', plugin: '@kubb/plugin-ts', path: ['arrayType'], value: 'array' },
        { operation: 'set', plugin: '@kubb/plugin-axios', path: ['group'], value: { type: 'path' } },
        { operation: 'set', plugin: '@kubb/plugin-msw', path: ['handlers'], value: false },
      ])
      expect({
        applied: result.outcomes.filter((outcome) => outcome.applied).length,
        reasons: result.outcomes.filter((outcome) => !outcome.applied).map((outcome) => outcome.reason),
      }).toStrictEqual({ applied: 2, reasons: ['group is customized in code'] })

      const expected = withOption({
        view: withOption({ view: readConfig(advanced), packageName: '@kubb/plugin-ts', key: 'arrayType', option: { literal: true, value: 'array' } }),
        packageName: '@kubb/plugin-msw',
        key: 'handlers',
        option: { literal: true, value: false },
      })
      expect(readConfig(result.source)).toStrictEqual(expected)
    })

    it('refuses a __proto__ path segment instead of throwing and taking the rest of the batch down', () => {
      const result = applyConfigEdits(advanced, [
        { operation: 'set', plugin: '@kubb/plugin-ts', path: ['__proto__', 'polluted'], value: 'yes' },
        { operation: 'set', plugin: '@kubb/plugin-ts', path: ['arrayType'], value: 'array' },
      ])
      expect({
        applied: result.outcomes.filter((outcome) => outcome.applied).length,
        reasons: result.outcomes.map((outcome) => outcome.reason),
      }).toStrictEqual({
        applied: 1,
        reasons: ['__proto__.polluted is not a valid option path', undefined],
      })
    })

    describe('values arriving from outside', () => {
      const base = `import { pluginTs } from '@kubb/plugin-ts'\n\nexport default defineConfig({\n  plugins: [pluginTs({ arrayType: 'generic' })],\n})\n`

      const unwritableValues: Array<[label: string, path: Array<string>, value: unknown]> = [
        ['a value that is not a literal', ['arrayType'], () => 'array'],
        ['a __proto__ key', ['group'], JSON.parse('{"__proto__": {"polluted": true}}')],
      ]

      it.each(unwritableValues)('refuses %s instead of writing it into the file', (_label, path, value) => {
        const result = applyConfigEdits(base, [{ operation: 'set', plugin: '@kubb/plugin-ts', path, value }])
        expect({ changed: result.changed, reason: result.outcomes[0]?.reason }).toStrictEqual({
          changed: false,
          reason: 'the value is not a literal that can be written to a config file',
        })
      })

      it('escapes a string that would otherwise break out of the literal', () => {
        const value = "generic',\n      dangerous: true,\n      x: '"
        const result = applyConfigEdits(base, [{ operation: 'set', plugin: '@kubb/plugin-ts', path: ['arrayType'], value }])
        expect(result.source).toMatchInlineSnapshot(`
          "import { pluginTs } from '@kubb/plugin-ts'

          export default defineConfig({
            plugins: [pluginTs({ arrayType: 'generic\\',\\n      dangerous: true,\\n      x: \\'' })],
          })
          "
        `)
        // The injected text must be inert: the plugin still has exactly the one option.
        const view = readConfig(result.source)
        expect(view.managed && Object.keys(view.configs[0]!.plugins[0]!.options)).toStrictEqual(['arrayType'])
      })

      it('keeps a value with real newlines and quotes readable', () => {
        const result = applyConfigEdits(base, [{ operation: 'set', plugin: '@kubb/plugin-ts', path: ['banner'], value: "line one\nit's \\ two" }])
        expect(result.source).toMatchInlineSnapshot(`
          "import { pluginTs } from '@kubb/plugin-ts'

          export default defineConfig({
            plugins: [pluginTs({
              arrayType: 'generic',
              banner: 'line one\\nit\\'s \\\\ two',
            })],
          })
          "
        `)
      })
    })
  })

  describe('remove', () => {
    it('drops a literal option so the plugin falls back to its default', () => {
      const result = applyConfigEdits(advanced, [{ operation: 'remove', plugin: '@kubb/plugin-zod', path: ['inferred'] }])
      expect(readConfig(result.source)).toStrictEqual(
        withOption({ view: readConfig(advanced), packageName: '@kubb/plugin-zod', key: 'inferred', option: undefined }),
      )
    })

    const removeRefusals: Array<[label: string, edit: ConfigEdit, reason: string]> = [
      ['an option customized in code', { operation: 'remove', plugin: '@kubb/plugin-faker', path: ['macros'] }, 'macros is customized in code'],
      ['an option that was never set', { operation: 'remove', plugin: '@kubb/plugin-zod', path: ['unset'] }, 'unset is not set'],
    ]

    it.each(removeRefusals)('reports %s', (_label, edit, reason) => {
      const result = applyConfigEdits(advanced, [edit])
      expect({ changed: result.changed, reason: result.outcomes[0]?.reason }).toStrictEqual({ changed: false, reason })
    })
  })

  describe('add-plugin', () => {
    it('adds the call and the import, leaving every other import untouched', () => {
      // A known magicast/recast limitation: any array whose element count changes is reprinted in
      // full, unlike ts-morph's surgical `addElement`. The array collapses onto fewer lines; every
      // plugin call keeps its own options untouched.
      const result = applyConfigEdits(advanced, [{ operation: 'add-plugin', plugin: '@kubb/plugin-swr', options: { group: { type: 'tag' } } }])
      const importLines = result.source.split('\n').filter((line) => line.startsWith('import'))
      expect(importLines.filter((line) => !line.includes('pluginSwr'))).toEqual(advanced.split('\n').filter((line) => line.startsWith('import')))
      expect(importLines).toContain(`import { pluginSwr } from '@kubb/plugin-swr'`)
      expect(result.source).toContain('pluginSwr({')
      expect(result.source).toContain('pluginRedoc(), pluginTs({')
    })

    it('leaves the result parseable, with the new plugin readable', () => {
      const result = applyConfigEdits(advanced, [{ operation: 'add-plugin', plugin: '@kubb/plugin-swr' }])
      const view = readConfig(result.source)
      expect(view.managed && view.configs[0]!.plugins.at(-1)).toStrictEqual({
        importName: 'pluginSwr',
        options: {},
        packageName: '@kubb/plugin-swr',
      })
    })

    const addPluginRefusals: Array<[label: string, source: string, reason: string]> = [
      ['a plugin that is already there', advanced, '@kubb/plugin-ts is already in the plugins array'],
      [
        'an import name taken by another package',
        `import { pluginTs } from './my-own-plugin-ts.ts'\n\nexport default defineConfig({ plugins: [pluginTs()] })\n`,
        'pluginTs is already imported from ./my-own-plugin-ts.ts',
      ],
    ]

    it.each(addPluginRefusals)('refuses %s', (_label, source, reason) => {
      const result = applyConfigEdits(source, [{ operation: 'add-plugin', plugin: '@kubb/plugin-ts' }])
      expect({ changed: result.changed, reason: result.outcomes[0]?.reason }).toStrictEqual({ changed: false, reason })
    })

    it('fills an empty plugins array', () => {
      const source = `import { defineConfig } from 'kubb/config'\n\nexport default defineConfig({\n  input: './api.yaml',\n  plugins: [],\n})\n`
      const result = applyConfigEdits(source, [{ operation: 'add-plugin', plugin: '@kubb/plugin-ts' }])
      expect(result.source).toMatchInlineSnapshot(`
        "import { defineConfig } from 'kubb/config'
        import { pluginTs } from '@kubb/plugin-ts'

        export default defineConfig({
          input: './api.yaml',
          plugins: [pluginTs()],
        })
        "
      `)
    })

    it('refuses a plugin name that is not a package specifier, instead of printing it into the file', () => {
      const source = `import { defineConfig } from 'kubb/config'\n\nexport default defineConfig({\n  input: './api.yaml',\n  plugins: [],\n})\n`
      const result = applyConfigEdits(source, [
        {
          operation: 'add-plugin',
          plugin: `evil'\nawait import('node:child_process').then((m) => m.execSync('touch pwned'))\nimport { x } from 'y`,
          importName: 'evilPlugin',
        },
      ])
      expect(result.changed).toBe(false)
      expect(result.outcomes[0]?.applied).toBe(false)
      expect(result.source).not.toContain('child_process')
    })

    it('refuses an import name that is not a valid identifier', () => {
      const source = `import { defineConfig } from 'kubb/config'\n\nexport default defineConfig({\n  input: './api.yaml',\n  plugins: [],\n})\n`
      const result = applyConfigEdits(source, [{ operation: 'add-plugin', plugin: '@kubb/plugin-ts', importName: `x } from 'evil'; //` }])
      expect(result.changed).toBe(false)
      expect(result.source).not.toContain('evil')
    })

    it('inserts the new import after a multi-line import instead of inside it', () => {
      const source = `import { defineConfig } from 'kubb/config'\nimport {\n  pluginTs,\n} from '@kubb/plugin-ts'\n\nexport default defineConfig({\n  input: './api.yaml',\n  plugins: [pluginTs()],\n})\n`
      const result = applyConfigEdits(source, [{ operation: 'add-plugin', plugin: '@kubb/plugin-zod' }])
      expect(result.source).toMatchInlineSnapshot(`
        "import { defineConfig } from 'kubb/config'
        import {
          pluginTs,
        } from '@kubb/plugin-ts'
        import { pluginZod } from '@kubb/plugin-zod'

        export default defineConfig({
          input: './api.yaml',
          plugins: [pluginTs(), pluginZod()],
        })
        "
      `)
    })

    it('adds several plugins in one pass', () => {
      const source = `import { defineConfig } from 'kubb/config'\n\nexport default defineConfig({\n  input: './api.yaml',\n  plugins: [],\n})\n`
      const result = applyConfigEdits(source, [
        { operation: 'add-plugin', plugin: '@kubb/plugin-ts' },
        { operation: 'add-plugin', plugin: '@kubb/plugin-zod', options: { inferred: true } },
      ])
      expect(result.source).toMatchInlineSnapshot(`
        "import { defineConfig } from 'kubb/config'
        import { pluginTs } from '@kubb/plugin-ts'
        import { pluginZod } from '@kubb/plugin-zod'

        export default defineConfig({
          input: './api.yaml',
          plugins: [pluginTs(), pluginZod({
            inferred: true,
          })],
        })
        "
      `)
    })

    // A string that happens to hold an import line used to convince the old whole-file cleanup pass
    // that this config was written with semicolons.
    it('ignores an import line that is really just string content', () => {
      const source = [
        `import { pluginTs } from '@kubb/plugin-ts'`,
        ``,
        "const banner = `import type { Foo } from './foo';`",
        ``,
        `export default defineConfig({ plugins: [pluginTs({ banner })] })`,
        ``,
      ].join('\n')
      const result = applyConfigEdits(source, [{ operation: 'add-plugin', plugin: '@kubb/plugin-zod' }])
      expect(result.source.split('\n').filter((line) => line.startsWith('import'))).toStrictEqual([
        "import { pluginTs } from '@kubb/plugin-ts'",
        "import { pluginZod } from '@kubb/plugin-zod'",
      ])
    })

    it('follows a config that does write semicolons', () => {
      const source = [`import { pluginTs } from '@kubb/plugin-ts';`, ``, `export default defineConfig({ plugins: [pluginTs()] });`, ``].join('\n')
      const result = applyConfigEdits(source, [{ operation: 'add-plugin', plugin: '@kubb/plugin-zod' }])
      expect(result.source.split('\n').filter((line) => line.startsWith('import'))).toStrictEqual([
        "import { pluginTs } from '@kubb/plugin-ts';",
        "import { pluginZod } from '@kubb/plugin-zod';",
      ])
    })
  })

  describe('array configs', () => {
    const arraySource = [
      `import { pluginTs } from '@kubb/plugin-ts'`,
      `import { pluginZod } from '@kubb/plugin-zod'`,
      ``,
      `export default defineConfig([`,
      `  { name: 'public', plugins: [pluginTs({ arrayType: 'generic' })] },`,
      `  { name: 'internal', plugins: [pluginZod()] },`,
      `])`,
      ``,
    ].join('\n')

    it('reads one entry per element, in source order', () => {
      const view = readConfig(arraySource)
      expect(view.managed && view.configs.map((config) => [config.name, config.plugins.map((plugin) => plugin.importName)])).toStrictEqual([
        ['public', ['pluginTs']],
        ['internal', ['pluginZod']],
      ])
    })

    it('targets an entry by index', () => {
      const result = applyConfigEdits(arraySource, [{ operation: 'set', config: 1, plugin: '@kubb/plugin-zod', path: ['inferred'], value: true }])
      expect(readConfig(result.source)).toStrictEqual(
        withOption({ view: readConfig(arraySource), packageName: '@kubb/plugin-zod', key: 'inferred', option: { literal: true, value: true } }),
      )
    })

    const targeting: Array<[label: string, config: ConfigEdit['config']]> = [
      ['an entry by name', 'public'],
      ['no entry, defaulting to the first', undefined],
    ]

    it.each(targeting)('targets %s', (_label, config) => {
      const result = applyConfigEdits(arraySource, [{ operation: 'set', config, plugin: '@kubb/plugin-ts', path: ['arrayType'], value: 'array' }])
      expect(readConfig(result.source)).toStrictEqual(
        withOption({ view: readConfig(arraySource), packageName: '@kubb/plugin-ts', key: 'arrayType', option: { literal: true, value: 'array' } }),
      )
    })

    it('refuses an edit naming a config entry that does not exist', () => {
      const result = applyConfigEdits(arraySource, [{ operation: 'set', config: 'missing', plugin: '@kubb/plugin-ts', path: ['arrayType'], value: 'array' }])
      expect({ changed: result.changed, reason: result.outcomes[0]?.reason }).toStrictEqual({
        changed: false,
        reason: 'no config entry found for "missing"',
      })
    })

    it('adds a plugin to one entry without touching the other', () => {
      const result = applyConfigEdits(arraySource, [{ operation: 'add-plugin', config: 'internal', plugin: '@kubb/plugin-msw' }])
      expect(result.source).toContain(`{ name: 'public', plugins: [pluginTs({ arrayType: 'generic' })] }`)
      expect(result.source).toContain('pluginMsw()')
    })

    it('disables a plugin in one entry of the real fixture, leaving the other entry alone', () => {
      const result = applyConfigEdits(arrayConfig, [{ operation: 'disable-plugin', config: 'internal', plugin: '@kubb/plugin-zod' }])
      expect(result.source).toContain('// kubb:disabled @kubb/plugin-zod')
      const view = readConfig(result.source)
      expect(view.managed && view.configs[0]!.plugins.every((plugin) => !plugin.disabled)).toBe(true)
    })
  })

  describe('disable-plugin and enable-plugin', () => {
    const source = `import { pluginTs } from '@kubb/plugin-ts'\nimport { pluginZod } from '@kubb/plugin-zod'\n\nexport default defineConfig({\n  plugins: [\n    pluginTs({ arrayType: 'generic' }),\n    pluginZod({\n      // keep me\n      inferred: true,\n    }),\n  ],\n})\n`

    it('comments the plugin call out, keeping its options', () => {
      const result = applyConfigEdits(source, [{ operation: 'disable-plugin', plugin: '@kubb/plugin-zod' }])
      expect(result.source).toMatchInlineSnapshot(`
        "import { pluginTs } from '@kubb/plugin-ts'
        import { pluginZod } from '@kubb/plugin-zod'

        export default defineConfig({
          plugins: [
            pluginTs({ arrayType: 'generic' }),
            // kubb:disabled @kubb/plugin-zod 4
            // pluginZod({
            //   // keep me
            //   inferred: true,
            // }),
          ],
        })
        "
      `)
    })

    it('reports the plugin as disabled with no options', () => {
      const disabled = applyConfigEdits(source, [{ operation: 'disable-plugin', plugin: '@kubb/plugin-zod' }]).source
      const view = readConfig(disabled)
      expect(view.managed && view.configs[0]!.plugins.find((plugin) => plugin.packageName === '@kubb/plugin-zod')).toStrictEqual({
        disabled: true,
        importName: 'pluginZod',
        options: {},
        packageName: '@kubb/plugin-zod',
      })
    })

    it('leaves a set on a sibling plugin untouched while one is disabled', () => {
      const disabled = applyConfigEdits(source, [{ operation: 'disable-plugin', plugin: '@kubb/plugin-zod' }]).source
      const result = applyConfigEdits(disabled, [{ operation: 'set', plugin: '@kubb/plugin-ts', path: ['arrayType'], value: 'array' }])
      expect(result.source).toContain('// kubb:disabled @kubb/plugin-zod')
      expect(result.source).toContain('//   inferred: true,')
      expect(readConfig(result.source)).toStrictEqual(
        withOption({ view: readConfig(disabled), packageName: '@kubb/plugin-ts', key: 'arrayType', option: { literal: true, value: 'array' } }),
      )
    })

    it('enabling returns the source byte-for-byte', () => {
      const disabled = applyConfigEdits(source, [{ operation: 'disable-plugin', plugin: '@kubb/plugin-zod' }]).source
      const enabled = applyConfigEdits(disabled, [{ operation: 'enable-plugin', plugin: '@kubb/plugin-zod' }]).source
      expect(enabled).toBe(source)
    })

    it('enabling one plugin leaves a second disabled block, and any comment after it, untouched', () => {
      const bothDisabled = [
        { operation: 'disable-plugin', plugin: '@kubb/plugin-ts' },
        { operation: 'disable-plugin', plugin: '@kubb/plugin-zod' },
      ].reduce((current, edit) => applyConfigEdits(current, [edit as ConfigEdit]).source, `${source.replace('  ],\n', '    // keep me too\n  ],\n')}`)

      const result = applyConfigEdits(bothDisabled, [{ operation: 'enable-plugin', plugin: '@kubb/plugin-ts' }])

      expect(result.source).toContain("pluginTs({ arrayType: 'generic' }),")
      expect(result.source).toContain('// kubb:disabled @kubb/plugin-zod')
      expect(result.source).toContain('// keep me too')
    })

    const toggleRefusals: Array<[label: string, source: string, edit: ConfigEdit, reason: string]> = [
      [
        'a plugin that shares its line with other code',
        `import { pluginTs } from '@kubb/plugin-ts'\n\nexport default defineConfig({ plugins: [pluginTs({ arrayType: 'generic' })] })\n`,
        { operation: 'disable-plugin', plugin: '@kubb/plugin-ts' },
        '@kubb/plugin-ts shares a line with other code, so it cannot be commented out safely',
      ],
      [
        'a plugin that is not in the file, when disabling',
        source,
        { operation: 'disable-plugin', plugin: '@kubb/plugin-msw' },
        '@kubb/plugin-msw is not in the plugins array',
      ],
      ['a plugin that is not disabled, when enabling', source, { operation: 'enable-plugin', plugin: '@kubb/plugin-zod' }, '@kubb/plugin-zod is not disabled'],
    ]

    it.each(toggleRefusals)('refuses %s', (_label, refusalSource, edit, reason) => {
      const result = applyConfigEdits(refusalSource, [edit])
      expect({ changed: result.changed, reason: result.outcomes[0]?.reason }).toStrictEqual({ changed: false, reason })
    })
  })
})

describe('isOptionValue', () => {
  it('accepts literals and nested structures built from them', () => {
    expect(['x', 1, 0, true, false, null, [], {}, ['a', { b: [1] }], { a: { b: null } }].every(isOptionValue)).toBe(true)
  })

  it('refuses anything that cannot be printed as a literal', () => {
    const refused: Array<unknown> = [undefined, () => 1, Symbol('x'), Number.NaN, Number.POSITIVE_INFINITY, [() => 1], { a: undefined }]
    expect(refused.some(isOptionValue)).toBe(false)
  })

  it('refuses an object that would rewrite the prototype', () => {
    expect(isOptionValue(JSON.parse('{"__proto__": {"polluted": true}}'))).toBe(false)
  })
})
