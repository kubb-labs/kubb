import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { applyConfigEdits, readConfig } from './configFile.ts'
import type { ConfigEdit, ConfigFileView, PluginView } from './protocol.ts'

const advanced = readFileSync(join(import.meta.dirname, '../mocks/advanced.config.txt'), 'utf8')

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
        value: { type: 'tag' },
        locked: [['name']],
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
        value: { file: {} },
        locked: [['name'], ['file', 'baseName']],
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

  it('reads the adapter call and its literal options', () => {
    const view = readConfig(advanced)
    expect(view.managed && view.configs[0]!.adapter).toStrictEqual({
      importName: 'adapterOas',
      packageName: '@kubb/adapter-oas',
      options: {
        unknownType: { literal: true, value: 'unknown' },
        validate: { literal: true, value: true },
        discriminator: { literal: true, value: 'preserve' },
        integerType: { literal: true, value: 'number' },
        enums: { literal: true, value: 'root' },
      },
    })
    expect(view.managed && view.configs[0]!.parsers).toBeUndefined()
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
      ['a function expression returning from a block body', `defineConfig(function () { return ${config} })`, oneConfig],
      ['a config with a satisfies assertion', `defineConfig(${config} satisfies UserConfig)`, oneConfig],
      ['an array of configs', `defineConfig([${config}, ${config}])`, twoConfigs],
      ['a function returning an array of configs', `defineConfig(() => [${config}, ${config}])`, twoConfigs],
    ]

    it.each(formats)('reads %s', (_label, body, expected) => {
      expect(readConfig(`${imports}\nexport default ${body}`)).toStrictEqual(expected)
    })

    it.each([
      ['a file it cannot parse', `export default defineConfig({`, 'the config file could not be parsed'],
      ['an export that is not a defineConfig call', `export default config`, 'the exported config is not a defineConfig(...) call'],
      ['defineConfig without a config', `export default defineConfig()`, 'defineConfig(...) was called without a config'],
      ['a config passed as a variable', `export default defineConfig(config)`, 'config is not an object literal'],
      ['an array holding a variable', `export default defineConfig([${config}, shared])`, 'config is not an object literal'],
    ])('explains %s', (_label, body, reason) => {
      expect(readConfig(`${imports}\n${body}\n`)).toStrictEqual({ managed: false, reason })
    })
  })

  it('reads every literal shape as a value, and anything computed as code', () => {
    const view = readConfig(
      `import { pluginTs } from '@kubb/plugin-ts'\nexport default defineConfig({\n  plugins: [pluginTs({ a: \`x\`, b: -1, c: +2, d: null, e: [1, null], f: \`x${'$'}{y}\`, g: !1, h: [, 1] })],\n})\n`,
    )
    expect(view.managed && view.configs[0]!.plugins[0]!.options).toStrictEqual({
      a: { literal: true, value: 'x' },
      b: { literal: true, value: -1 },
      c: { literal: true, value: 2 },
      d: { literal: true, value: null },
      e: { literal: true, value: [1, null] },
      f: { literal: false },
      g: { literal: false },
      h: { literal: false },
    })
  })

  it('reports the literal members and the code paths of an object option that holds some code', () => {
    const view = readConfig(
      `import { pluginTs } from '@kubb/plugin-ts'\nexport default defineConfig({\n  plugins: [pluginTs({ output: { path: './gen', footer: 'x', ...shared, banner: () => '', nested: { a: 1, b: run() } }, group: { [key]: 1 } })],\n})\n`,
    )
    expect(view.managed && view.configs[0]!.plugins[0]!.options).toStrictEqual({
      output: { literal: false, value: { nested: { a: 1 } }, locked: [['path'], ['footer'], ['banner'], ['nested', 'b']] },
      group: { literal: false },
    })
  })
})

describe('applyConfigEdits', () => {
  describe('set', () => {
    it('changes only the targeted option, leaving the rest of the config the same', () => {
      const result = applyConfigEdits({ source: advanced, edits: [{ operation: 'set', plugin: '@kubb/plugin-ts', path: ['enum', 'type'], value: 'enum' }] })
      expect(readConfig(result.source)).toStrictEqual(
        withOption({ view: readConfig(advanced), packageName: '@kubb/plugin-ts', key: 'enum', option: { literal: true, value: { type: 'enum' } } }),
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
      const result = applyConfigEdits({ source, edits: [{ operation: 'set', plugin: '@kubb/plugin-ts', path: ['enum', 'type'], value: 'enum' }] })
      expect(result.source).toBe(source.replace("'asConst'", "'enum'"))
    })

    it('applies the good edits in a batch, reports the bad one, and touches nothing else', () => {
      const result = applyConfigEdits({
        source: advanced,
        edits: [
          { operation: 'set', plugin: '@kubb/plugin-ts', path: ['arrayType'], value: 'array' },
          { operation: 'set', plugin: '@kubb/plugin-axios', path: ['group'], value: { type: 'path' } },
          { operation: 'set', plugin: '@kubb/plugin-msw', path: ['handlers'], value: false },
        ],
      })
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

    describe('values arriving from outside', () => {
      const base = `import { pluginTs } from '@kubb/plugin-ts'\n\nexport default defineConfig({\n  plugins: [pluginTs({ arrayType: 'generic' })],\n})\n`

      const values: Array<[label: string, value: unknown, applied: boolean]> = [
        ['a string', 'x', true],
        ['nested literals', ['a', { b: [1, null] }], true],
        ['undefined', undefined, false],
        ['an array holding a function', [() => 1], false],
        ['a class instance', new Date(0), false],
      ]

      it.each(values)('writes %s into the file only when it is a literal', (_label, value, applied) => {
        const result = applyConfigEdits({ source: base, edits: [{ operation: 'set', plugin: '@kubb/plugin-ts', path: ['arrayType'], value }] })
        expect({ changed: result.changed, applied: result.outcomes[0]?.applied, reason: result.outcomes[0]?.reason }).toStrictEqual({
          changed: applied,
          applied,
          reason: applied ? undefined : 'the value is not a literal that can be written to a config file',
        })
      })

      it('escapes a string that would otherwise break out of the literal', () => {
        const value = "generic',\n      dangerous: true,\n      x: '"
        const result = applyConfigEdits({ source: base, edits: [{ operation: 'set', plugin: '@kubb/plugin-ts', path: ['arrayType'], value }] })
        // The injected text must be inert: the plugin still has exactly the one option.
        const view = readConfig(result.source)
        expect(view.managed && Object.keys(view.configs[0]!.plugins[0]!.options)).toStrictEqual(['arrayType'])
      })
    })
  })

  describe('kind', () => {
    const source = [
      `import { adapterOas } from '@kubb/adapter-oas'`,
      `import { parserTs } from '@kubb/parser-ts'`,
      `import { defineConfig } from 'kubb/config'`,
      ``,
      `export default defineConfig({`,
      `  adapter: adapterOas({ server: { url: 'https://api.example.com', index: 0 } }),`,
      `  parsers: [parserTs()],`,
      `  plugins: [],`,
      `})`,
      ``,
    ].join('\n')

    it('sets a nested adapter option without touching its siblings', () => {
      const result = applyConfigEdits({
        source,
        edits: [{ operation: 'set', kind: 'adapter', plugin: '@kubb/adapter-oas', path: ['server', 'index'], value: 1 }],
      })
      expect(result.source).toBe(source.replace('index: 0', 'index: 1'))
    })

    it('sets and removes a parser option', () => {
      const set = applyConfigEdits({ source, edits: [{ operation: 'set', kind: 'parser', plugin: '@kubb/parser-ts', path: ['extension'], value: '.js' }] })
      expect(set.source).toBe(source.replace('parserTs()', `parserTs({ extension: '.js' })`))
      const view = readConfig(set.source)
      expect(view.managed && view.configs[0]!.parsers).toStrictEqual([
        { importName: 'parserTs', packageName: '@kubb/parser-ts', options: { extension: { literal: true, value: '.js' } } },
      ])

      const removed = applyConfigEdits({ source: set.source, edits: [{ operation: 'remove', kind: 'parser', plugin: '@kubb/parser-ts', path: ['extension'] }] })
      expect(removed.source).toBe(source.replace('parserTs()', 'parserTs({})'))
    })

    it('edits the factory the package is known by when it ships several, under any local name', () => {
      const edits: Array<ConfigEdit> = [{ operation: 'set', kind: 'parser', plugin: '@kubb/parser-ts', path: ['extension'], value: '.js' }]
      const two = source.replace('parsers: [parserTs()]', 'parsers: [parserTsx(), parserTs()]').replace(`import { parserTs }`, `import { parserTs, parserTsx }`)
      expect(applyConfigEdits({ source: two, edits }).source).toBe(two.replace('parserTs()', `parserTs({ extension: '.js' })`))

      const aliased = source
        .replace('parsers: [parserTs()]', 'parsers: [parserTsx(), ts()]')
        .replace(`import { parserTs }`, `import { parserTs as ts, parserTsx }`)
      expect(applyConfigEdits({ source: aliased, edits }).source).toBe(aliased.replace('ts()', `ts({ extension: '.js' })`))
    })

    it('refuses a factory the config does not register under that kind', () => {
      const { outcomes } = applyConfigEdits({
        source,
        edits: [
          { operation: 'set', kind: 'adapter', plugin: '@kubb/adapter-other', path: ['validate'], value: true },
          { operation: 'set', kind: 'parser', plugin: '@kubb/parser-md', path: ['extension'], value: '.md' },
          { operation: 'set', plugin: '@kubb/adapter-oas', path: ['validate'], value: true },
        ],
      })
      expect(outcomes.map((outcome) => outcome.reason)).toStrictEqual([
        `@kubb/adapter-other is not the config's adapter`,
        '@kubb/parser-md is not in the parsers array',
        '@kubb/adapter-oas is not in the plugins array',
      ])
    })
  })

  describe('remove', () => {
    it('drops a literal option so the plugin falls back to its default', () => {
      const result = applyConfigEdits({ source: advanced, edits: [{ operation: 'remove', plugin: '@kubb/plugin-zod', path: ['inferred'] }] })
      expect(readConfig(result.source)).toStrictEqual(
        withOption({ view: readConfig(advanced), packageName: '@kubb/plugin-zod', key: 'inferred', option: undefined }),
      )
    })
  })

  describe('add-plugin', () => {
    it('adds the call on its own line and the import, leaving everything else untouched', () => {
      const result = applyConfigEdits({
        source: advanced,
        edits: [{ operation: 'add-plugin', plugin: '@kubb/plugin-swr', options: { group: { type: 'tag' } } }],
      })
      const importLines = result.source.split('\n').filter((line) => line.startsWith('import'))
      expect(importLines.filter((line) => !line.includes('pluginSwr'))).toEqual(advanced.split('\n').filter((line) => line.startsWith('import')))
      expect(importLines).toContain(`import { pluginSwr } from '@kubb/plugin-swr'`)
      expect(result.source.replace(`import { pluginSwr } from '@kubb/plugin-swr'\n`, '')).toBe(
        advanced.replace(
          `      group: { type: 'tag' },\n    }),\n  ],\n})`,
          `      group: { type: 'tag' },\n    }),\n    pluginSwr({ group: { type: 'tag' } }),\n  ],\n})`,
        ),
      )
    })

    it('leaves every plugin in a multi-line array free to be disabled afterwards', () => {
      const added = applyConfigEdits({ source: advanced, edits: [{ operation: 'add-plugin', plugin: '@kubb/plugin-swr' }] }).source
      const result = applyConfigEdits({
        source: added,
        edits: [
          { operation: 'disable-plugin', plugin: '@kubb/plugin-ts' },
          { operation: 'disable-plugin', plugin: '@kubb/plugin-swr' },
        ],
      })
      expect(result.outcomes.map((outcome) => outcome.applied)).toStrictEqual([true, true])
    })

    it.each([
      ['an empty array', `plugins: []`, `plugins: [pluginZod()]`],
      ['an empty array holding a comment', `plugins: [/* keep this note */]`, `plugins: [pluginZod(), /* keep this note */]`],
      ['an empty multi-line array holding a comment', `plugins: [\n    // keep this note\n  ]`, `plugins: [pluginZod(),\n    // keep this note\n  ]`],
      ['an inline array', `plugins: [pluginTs()]`, `plugins: [pluginTs(), pluginZod()]`],
      ['a multi-line array without a trailing comma', `plugins: [\n    pluginTs()\n  ]`, `plugins: [\n    pluginTs(),\n    pluginZod()\n  ]`],
    ])('follows the layout of %s', (_label, before, after) => {
      const source = (plugins: string) => `import { pluginTs } from '@kubb/plugin-ts'\n\nexport default defineConfig({\n  ${plugins},\n})\n`
      const result = applyConfigEdits({ source: source(before), edits: [{ operation: 'add-plugin', plugin: '@kubb/plugin-zod' }] })
      expect(result.source).toBe(source(after).replace(`'@kubb/plugin-ts'\n`, `'@kubb/plugin-ts'\nimport { pluginZod } from '@kubb/plugin-zod'\n`))
    })

    it('treats adding an existing plugin as a no-op', () => {
      const result = applyConfigEdits({ source: advanced, edits: [{ operation: 'add-plugin', plugin: '@kubb/plugin-ts' }] })
      expect({ changed: result.changed, applied: result.outcomes[0]?.applied }).toStrictEqual({ changed: false, applied: true })
    })

    it('refuses a plugin name that is not a package specifier instead of printing it into the file', () => {
      const edit: ConfigEdit = {
        operation: 'add-plugin',
        plugin: `evil'\nawait import('node:child_process').then((m) => m.execSync('touch pwned'))\nimport { x } from 'y`,
      }
      const source = `import { defineConfig } from 'kubb/config'\n\nexport default defineConfig({\n  input: './api.yaml',\n  plugins: [],\n})\n`
      const result = applyConfigEdits({ source, edits: [edit] })
      expect(result.changed).toBe(false)
      expect(result.source).not.toContain('evil')
    })

    describe('a third-party plugin', () => {
      const source = `import { defineConfig } from 'kubb/config'\n\nexport default defineConfig({\n  plugins: [],\n})\n`
      const manifest = { kind: 'plugin', name: 'plugin-x', export: 'pluginX', displayName: 'X', description: 'X.' } as const
      const extensions = new Map([['@acme/kubb-plugin-x', { package: '@acme/kubb-plugin-x', version: '1.0.0', manifest }]])

      it('adds an installed extension with the import name its manifest names', () => {
        const result = applyConfigEdits({ source, edits: [{ operation: 'add-plugin', plugin: '@acme/kubb-plugin-x' }], extensions })
        expect(result.source).toContain(`import { pluginX } from '@acme/kubb-plugin-x'`)
        expect(result.source).toContain('plugins: [pluginX()]')
      })

      it('refuses a package that is not an installed extension', () => {
        const result = applyConfigEdits({ source, edits: [{ operation: 'add-plugin', plugin: '@acme/kubb-plugin-x' }] })
        expect(result.outcomes[0]).toMatchObject({
          applied: false,
          reason: '"@acme/kubb-plugin-x" is not a @kubb/plugin-* package or an installed Kubb plugin',
        })
      })
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
      const result = applyConfigEdits({
        source: arraySource,
        edits: [{ operation: 'set', config: 1, plugin: '@kubb/plugin-zod', path: ['inferred'], value: true }],
      })
      expect(readConfig(result.source)).toStrictEqual(
        withOption({ view: readConfig(arraySource), packageName: '@kubb/plugin-zod', key: 'inferred', option: { literal: true, value: true } }),
      )
    })
  })

  describe('set-input', () => {
    it('replaces the input the config holds', () => {
      const source = `export default defineConfig({\n  input: './sample.yaml',\n  plugins: [],\n})\n`
      const result = applyConfigEdits({ source, edits: [{ operation: 'set-input', input: 'https://example.com/openapi.yaml' }] })

      expect(result).toMatchObject({ outcomes: [{ applied: true }], changed: true })
      expect(result.source).toBe(`export default defineConfig({\n  input: 'https://example.com/openapi.yaml',\n  plugins: [],\n})\n`)
    })

    it('adds an input to a config without one', () => {
      const source = `export default defineConfig({ name: 'api', plugins: [] })\n`
      const result = applyConfigEdits({ source, edits: [{ operation: 'set-input', input: './openapi.yaml' }] })

      expect(result.source).toBe(`export default defineConfig({ name: 'api', plugins: [], input: './openapi.yaml' })\n`)
    })

    it('refuses an empty input', () => {
      const result = applyConfigEdits({ source: `export default defineConfig({ plugins: [] })\n`, edits: [{ operation: 'set-input', input: ' ' }] })

      expect(result.outcomes).toMatchObject([{ applied: false, reason: 'the edit names no input' }])
    })
  })

  describe('disable-plugin and enable-plugin', () => {
    const source = `import { pluginTs } from '@kubb/plugin-ts'\nimport { pluginZod } from '@kubb/plugin-zod'\n\nexport default defineConfig({\n  plugins: [\n    pluginTs({ arrayType: 'generic' }),\n    pluginZod({\n      // keep me\n      inferred: true,\n    }),\n  ],\n})\n`

    it('comments the plugin call out, keeping its options', () => {
      const result = applyConfigEdits({ source, edits: [{ operation: 'disable-plugin', plugin: '@kubb/plugin-zod' }] })
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

    it('puts each plugin of a one-line array on its own line to comment one out, and enabling it keeps them there', () => {
      const oneLine = `import { pluginTs } from '@kubb/plugin-ts'\nimport { pluginZod } from '@kubb/plugin-zod'\n\nexport default defineConfig({\n  plugins: [pluginTs(), pluginZod({ inferred: true })],\n})\n`
      const disabled = applyConfigEdits({ source: oneLine, edits: [{ operation: 'disable-plugin', plugin: '@kubb/plugin-zod' }] })

      expect(disabled.outcomes).toStrictEqual([{ edit: { operation: 'disable-plugin', plugin: '@kubb/plugin-zod' }, applied: true }])
      expect(disabled.source).toBe(
        `import { pluginTs } from '@kubb/plugin-ts'\nimport { pluginZod } from '@kubb/plugin-zod'\n\nexport default defineConfig({\n  plugins: [\n    pluginTs(),\n    // kubb:disabled @kubb/plugin-zod 1\n    // pluginZod({ inferred: true }),\n  ],\n})\n`,
      )

      const enabled = applyConfigEdits({ source: disabled.source, edits: [{ operation: 'enable-plugin', plugin: '@kubb/plugin-zod' }] }).source
      expect(enabled).toBe(
        `import { pluginTs } from '@kubb/plugin-ts'\nimport { pluginZod } from '@kubb/plugin-zod'\n\nexport default defineConfig({\n  plugins: [\n    pluginTs(),\n    pluginZod({ inferred: true }),\n  ],\n})\n`,
      )
    })

    it('enabling returns the source byte-for-byte', () => {
      const disabled = applyConfigEdits({ source, edits: [{ operation: 'disable-plugin', plugin: '@kubb/plugin-zod' }] }).source
      const enabled = applyConfigEdits({ source: disabled, edits: [{ operation: 'enable-plugin', plugin: '@kubb/plugin-zod' }] }).source
      expect(enabled).toBe(source)
    })
  })

  describe('edits Studio sends malformed', () => {
    const source = `import { pluginTs } from '@kubb/plugin-ts'\n\nexport default defineConfig({\n  plugins: [pluginTs({ arrayType: 'generic' })],\n})\n`
    const good: ConfigEdit = { operation: 'set', plugin: '@kubb/plugin-ts', path: ['arrayType'], value: 'array' }

    const malformed: Array<[label: string, edit: unknown, reason: string]> = [
      ['an unknown operation', { operation: 'bogus', plugin: '@kubb/plugin-ts', path: ['arrayType'] }, 'unknown operation "bogus"'],
      ['a set without a path', { operation: 'set', plugin: '@kubb/plugin-ts', value: 1 }, 'path must be a list of option names'],
      ['an empty path', { operation: 'set', plugin: '@kubb/plugin-ts', path: [], value: 1 }, 'no option path given'],
      ['a missing plugin', { operation: 'disable-plugin' }, 'the edit names no plugin'],
      ['an unknown kind', { operation: 'set', kind: 'macro', plugin: '@kubb/plugin-ts', path: ['arrayType'], value: 1 }, 'unknown kind "macro"'],
      [
        'a kind on a plugin-only operation',
        { operation: 'add-plugin', kind: 'adapter', plugin: '@kubb/plugin-ts' },
        'add-plugin edits the plugins array, so it takes no kind',
      ],
      [
        'a config ref that is not a name or index',
        { operation: 'disable-plugin', plugin: '@kubb/plugin-ts', config: { x: 1 } },
        'config must name an entry or give its index',
      ],
      [
        'a __proto__ key',
        { operation: 'set', plugin: '@kubb/plugin-ts', path: ['__proto__', 'polluted'], value: 'x' },
        '__proto__ cannot be used as an option name',
      ],
      ['an edit that is not an object', null, 'unknown operation undefined'],
    ]

    it.each(malformed)('refuses %s on its own and still applies the rest of the batch', (_label, edit, reason) => {
      const result = applyConfigEdits({ source, edits: [edit as ConfigEdit, good] })
      expect(result.outcomes.map(({ applied, reason }) => ({ applied, reason }))).toStrictEqual([
        { applied: false, reason },
        { applied: true, reason: undefined },
      ])
      expect(result.source).toContain(`pluginTs({ arrayType: 'array' })`)
    })

    it('refuses a value that carries a __proto__ key', () => {
      const value = JSON.parse('{ "__proto__": { "polluted": true } }') as unknown
      const result = applyConfigEdits({ source, edits: [{ operation: 'set', plugin: '@kubb/plugin-ts', path: ['arrayType'], value }] })
      expect(result.outcomes[0]).toMatchObject({ applied: false, reason: 'the value is not a literal that can be written to a config file' })
    })

    it('reads a __proto__ key already in the file as code, never as an object prototype', () => {
      const view = readConfig(source.replace(`arrayType: 'generic'`, `arrayType: 'generic', __proto__: { polluted: 'x' }, enum: { __proto__: {} }`))
      expect(view.managed && view.configs[0]!.plugins[0]!.options).toStrictEqual({
        arrayType: { literal: true, value: 'generic' },
        enum: { literal: false, value: {}, locked: [['__proto__']] },
      })
    })
  })

  describe('options written as methods, accessors, or spreads', () => {
    const source = [
      `import { pluginZod } from '@kubb/plugin-zod'`,
      ``,
      `export default defineConfig({`,
      `  plugins: [`,
      `    pluginZod({`,
      `      importPath: 'zod',`,
      `      ...shared,`,
      `      get inferred() {`,
      `        return true`,
      `      },`,
      `      resolver: {`,
      `        name(name) {`,
      `          return name`,
      `        },`,
      `      },`,
      `    }),`,
      `  ],`,
      `})`,
      ``,
    ].join('\n')

    it('lists methods, accessors, and options a later spread can override as customized in code', () => {
      const view = readConfig(source)
      expect(view.managed && view.configs[0]!.plugins[0]!.options).toStrictEqual({
        importPath: { literal: false },
        inferred: { literal: false },
        resolver: { literal: false, value: {}, locked: [['name']] },
      })
    })

    it('writes a path outside the locked members of an object that holds a method', () => {
      const result = applyConfigEdits({ source, edits: [{ operation: 'set', plugin: '@kubb/plugin-zod', path: ['resolver', 'suffix'], value: 'Schema' }] })
      const view = readConfig(result.source)
      expect(view.managed && view.configs[0]!.plugins[0]!.options.resolver).toStrictEqual({
        literal: false,
        value: { suffix: 'Schema' },
        locked: [['name']],
      })
    })

    it.each<[label: string, edit: ConfigEdit, reason: string]>([
      ['an accessor', { operation: 'set', plugin: '@kubb/plugin-zod', path: ['inferred'], value: false }, 'inferred is customized in code'],
      ['a method', { operation: 'set', plugin: '@kubb/plugin-zod', path: ['resolver', 'name'], value: 'x' }, 'resolver.name is customized in code'],
      ['removing a method', { operation: 'remove', plugin: '@kubb/plugin-zod', path: ['resolver', 'name'] }, 'resolver.name is customized in code'],
      [
        'a literal a spread after it can override',
        { operation: 'set', plugin: '@kubb/plugin-zod', path: ['importPath'], value: 'zod/mini' },
        'importPath can be overridden by a spread after it, so it is customized in code',
      ],
    ])('refuses to overwrite %s', (_label, edit, reason) => {
      const result = applyConfigEdits({ source, edits: [edit] })
      expect({ changed: result.changed, outcome: result.outcomes[0] }).toStrictEqual({ changed: false, outcome: { edit, applied: false, reason } })
    })

    it('adds a new option after the spread, where it takes effect', () => {
      const result = applyConfigEdits({ source, edits: [{ operation: 'set', plugin: '@kubb/plugin-zod', path: ['mini'], value: true }] })
      expect(result.source).toBe(source.replace(`      },\n    }),`, `      },\n      mini: true,\n    }),`))
    })
  })

  describe('text edits', () => {
    const source = [
      `import { pluginTs } from '@kubb/plugin-ts'`,
      `import { pluginZod } from '@kubb/plugin-zod'`,
      ``,
      `export default defineConfig(() => {`,
      `  return {`,
      `    plugins: [`,
      `      pluginTs({`,
      `        // keep the enum stable`,
      `        enum: { type: 'asConst' },`,
      `        arrayType: 'generic', // array syntax`,
      `        syntaxType: 'type',`,
      `      }),`,
      `      pluginZod(),`,
      `    ],`,
      `  }`,
      `})`,
      ``,
    ].join('\n')

    it('adds a nested option on its own line with the object indentation, and no semicolon', () => {
      const result = applyConfigEdits({ source, edits: [{ operation: 'set', plugin: '@kubb/plugin-ts', path: ['output', 'path'], value: 'types' }] })
      expect(result.source).toBe(source.replace(`        syntaxType: 'type',\n`, `        syntaxType: 'type',\n        output: { path: 'types' },\n`))
    })

    it('removes an option with its whole line, keeping the comments around it', () => {
      const result = applyConfigEdits({ source, edits: [{ operation: 'remove', plugin: '@kubb/plugin-ts', path: ['arrayType'] }] })
      expect(result.source).toBe(source.replace(`        arrayType: 'generic', // array syntax\n`, ''))
    })

    it.each([
      ['an option the file does not set', { operation: 'remove', plugin: '@kubb/plugin-ts', path: ['optionalType'] }],
      ['an option of a plugin called without options', { operation: 'remove', plugin: '@kubb/plugin-zod', path: ['inferred'] }],
    ] satisfies Array<[string, ConfigEdit]>)('applies removing %s without changing the file', (_, edit) => {
      const result = applyConfigEdits({ source, edits: [edit] })
      expect(result.source).toBe(source)
      expect(result.outcomes).toStrictEqual([{ edit, applied: true }])
    })

    it('gives a plugin called without options its first one', () => {
      const result = applyConfigEdits({ source, edits: [{ operation: 'set', plugin: '@kubb/plugin-zod', path: ['coercion', 'dates'], value: true }] })
      expect(result.source).toBe(source.replace(`pluginZod()`, `pluginZod({ coercion: { dates: true } })`))
    })

    it('writes strings with the quote style of the file', () => {
      const doubleQuoted = source.replaceAll(`'`, `"`)
      const result = applyConfigEdits({
        source: doubleQuoted,
        edits: [{ operation: 'set', plugin: '@kubb/plugin-ts', path: ['arrayType'], value: `it's "x"` }],
      })
      expect(result.source).toContain(`arrayType: "it's \\"x\\"", // array syntax`)
    })
  })

  describe('disabled plugins', () => {
    const source = [
      `import { pluginTs } from '@kubb/plugin-ts'`,
      `import { pluginZod } from '@kubb/plugin-zod'`,
      ``,
      `export default defineConfig([`,
      `  {`,
      `    name: 'a',`,
      `    plugins: [`,
      `      pluginZod({`,
      `        inferred: true,`,
      ``,
      `        importPath: 'zod',`,
      `      }),`,
      `      pluginTs(),`,
      `    ],`,
      `  },`,
      `  {`,
      `    name: 'b',`,
      `    plugins: [`,
      `      pluginZod(),`,
      `    ],`,
      `  },`,
      `])`,
      ``,
    ].join('\n')
    const disabled = applyConfigEdits({
      source,
      edits: [
        { operation: 'disable-plugin', config: 'a', plugin: '@kubb/plugin-zod' },
        { operation: 'disable-plugin', config: 'b', plugin: '@kubb/plugin-zod' },
      ],
    }).source

    it('keeps a disabled plugin in its place with the options it holds', () => {
      const view = readConfig(disabled)
      expect(view.managed && view.configs[0]!.plugins).toStrictEqual([
        {
          importName: 'pluginZod',
          packageName: '@kubb/plugin-zod',
          options: { inferred: { literal: true, value: true }, importPath: { literal: true, value: 'zod' } },
          disabled: true,
        },
        { importName: 'pluginTs', packageName: '@kubb/plugin-ts', options: {} },
      ])
    })

    it('enables the plugin only in the entry the edit names', () => {
      const result = applyConfigEdits({ source: disabled, edits: [{ operation: 'enable-plugin', config: 'b', plugin: '@kubb/plugin-zod' }] })
      const view = readConfig(result.source)
      expect(view.managed && view.configs.map((config) => config.plugins.find((plugin) => plugin.importName === 'pluginZod')?.disabled)).toStrictEqual([
        true,
        undefined,
      ])
    })

    it('asks to enable a disabled plugin before editing its options', () => {
      const result = applyConfigEdits({
        source: disabled,
        edits: [{ operation: 'set', config: 'a', plugin: '@kubb/plugin-zod', path: ['inferred'], value: false }],
      })
      expect(result.outcomes[0]?.reason).toBe('@kubb/plugin-zod is disabled, enable it first')
    })
  })

  describe('CommonJS configs', () => {
    const source = [
      `const { defineConfig } = require('kubb')`,
      ``,
      `const { pluginTs } = require('@kubb/plugin-ts')`,
      ``,
      `module.exports = defineConfig(() => {`,
      `  return {`,
      `    plugins: [`,
      `      pluginTs({ enum: { type: 'asConst' } }),`,
      `    ],`,
      `  }`,
      `})`,
      ``,
    ].join('\n')

    it('reads a module.exports config', () => {
      expect(readConfig(source)).toStrictEqual({
        managed: true,
        configs: [
          {
            name: undefined,
            plugins: [{ importName: 'pluginTs', packageName: '@kubb/plugin-ts', options: { enum: { literal: true, value: { type: 'asConst' } } } }],
          },
        ],
      })
    })

    it('adds a plugin with a require, not an import', () => {
      const result = applyConfigEdits({
        source,
        edits: [
          { operation: 'set', plugin: '@kubb/plugin-ts', path: ['enum', 'type'], value: 'literal' },
          { operation: 'add-plugin', plugin: '@kubb/plugin-zod' },
        ],
      })
      expect(result.source).toBe(
        source
          .replace(
            `const { pluginTs } = require('@kubb/plugin-ts')\n`,
            `const { pluginTs } = require('@kubb/plugin-ts')\nconst { pluginZod } = require('@kubb/plugin-zod')\n`,
          )
          .replace(`      pluginTs({ enum: { type: 'asConst' } }),\n`, `      pluginTs({ enum: { type: 'literal' } }),\n      pluginZod(),\n`),
      )
    })

    it('explains a file that exports nothing it can edit', () => {
      expect(readConfig(`const config = 1\n`)).toStrictEqual({ managed: false, reason: 'no `export default` or `module.exports` found' })
    })
  })
})
