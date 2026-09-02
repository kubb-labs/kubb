import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { applyConfigEdits, isOptionValue, readConfig } from './configFile.ts'
import type { ConfigEdit } from './protocol/index.ts'

const advanced = readFileSync(join(import.meta.dirname, '../mocks/advanced.config.txt'), 'utf8')
const arrayConfig = readFileSync(join(import.meta.dirname, '../mocks/array.config.txt'), 'utf8')

/**
 * The single span that differs between two texts, for asserting one edit touched one place.
 */
function changedSpan(before: string, after: string): string {
  let start = 0
  while (start < before.length && start < after.length && before[start] === after[start]) {
    start++
  }
  let end = 0
  while (end < before.length - start && end < after.length - start && before[before.length - 1 - end] === after[after.length - 1 - end]) {
    end++
  }
  return `${JSON.stringify(before.slice(start, before.length - end))} -> ${JSON.stringify(after.slice(start, after.length - end))}`
}

/**
 * Every line that differs, by index. Only valid when the edit did not add or remove lines, which
 * is what a batch of value replacements should do, so the caller asserts the line count first.
 */
function changedLines(before: string, after: string): Array<string> {
  const beforeLines = before.split('\n')
  const afterLines = after.split('\n')
  return beforeLines.flatMap((line, index) => (line === afterLines[index] ? [] : [`${line.trim()} -> ${afterLines[index]?.trim()}`]))
}

function apply(source: string, ...edits: Array<ConfigEdit>) {
  return applyConfigEdits(source, edits)
}

describe('readConfig', () => {
  it('lists every plugin in the advanced example with its package', () => {
    const view = readConfig(advanced)
    expect(view.managed && view.configs[0]!.plugins.map((plugin) => `${plugin.importName} <- ${plugin.packageName}`)).toMatchInlineSnapshot(`
      [
        "pluginRedoc <- @kubb/plugin-redoc",
        "pluginTs <- @kubb/plugin-ts",
        "pluginZod <- @kubb/plugin-zod",
        "pluginReactQuery <- @kubb/plugin-react-query",
        "pluginAxios <- @kubb/plugin-axios",
        "pluginMcp <- @kubb/plugin-mcp",
        "pluginFaker <- @kubb/plugin-faker",
        "pluginCypress <- @kubb/plugin-cypress",
        "pluginMsw <- @kubb/plugin-msw",
      ]
    `)
  })

  it('marks function-valued options as not literal', () => {
    const view = readConfig(advanced)
    const byName = view.managed ? Object.fromEntries(view.configs[0]!.plugins.map((plugin) => [plugin.importName, plugin.options])) : {}
    expect({
      'axios.group': byName.pluginAxios?.group,
      'axios.baseURL': byName.pluginAxios?.baseURL,
      'faker.macros': byName.pluginFaker?.macros,
      'faker.resolver': byName.pluginFaker?.resolver,
      'faker.group': byName.pluginFaker?.group,
      'ts.override': byName.pluginTs?.override,
    }).toMatchInlineSnapshot(`
      {
        "axios.baseURL": {
          "literal": true,
          "value": "https://petstore3.swagger.io/api/v3",
        },
        "axios.group": {
          "literal": false,
        },
        "faker.group": {
          "literal": true,
          "value": {
            "type": "tag",
          },
        },
        "faker.macros": {
          "literal": false,
        },
        "faker.resolver": {
          "literal": false,
        },
        "ts.override": {
          "literal": true,
          "value": [
            {
              "options": {
                "enum": {
                  "constCasing": "camelCase",
                  "keyCasing": "none",
                  "type": "enum",
                  "typeSuffix": "Key",
                },
              },
              "pattern": "findPetsByStatus",
              "type": "operationId",
            },
          ],
        },
      }
    `)
  })

  it('refuses a function returning an array', () => {
    expect(readConfig(`export default defineConfig(() => schemas.map((s) => ({ name: s })))`)).toMatchInlineSnapshot(`
      {
        "managed": false,
        "reason": "config is not an object literal",
      }
    `)
  })

  it('reads through a (cli) => ({...}) wrapper', () => {
    const source = `import { pluginTs } from '@kubb/plugin-ts'\nexport default defineConfig((cli) => ({ plugins: [pluginTs({ arrayType: 'generic' })] }))`
    expect(readConfig(source)).toMatchInlineSnapshot(`
      {
        "configs": [
          {
            "name": undefined,
            "plugins": [
              {
                "importName": "pluginTs",
                "options": {
                  "arrayType": {
                    "literal": true,
                    "value": "generic",
                  },
                },
                "packageName": "@kubb/plugin-ts",
              },
            ],
          },
        ],
        "managed": true,
      }
    `)
  })
})

describe('applyConfigEdits: set', () => {
  it('changes only the targeted value and leaves every other byte alone', () => {
    const result = apply(advanced, { operation: 'set', plugin: '@kubb/plugin-ts', path: ['enum', 'type'], value: 'enum' })
    expect(changedSpan(advanced, result.source)).toMatchInlineSnapshot(`""asConst" -> "enum""`)
  })

  it('adds a missing key to an existing options object', () => {
    const result = apply(advanced, { operation: 'set', plugin: '@kubb/plugin-zod', path: ['typedSchema'], value: true })
    expect(changedSpan(advanced, result.source)).toMatchInlineSnapshot(
      `""      exclude: [\\n        {\\n          type: 'tag',\\n          pattern: 'store',\\n        },\\n      ],\\n      group: { type: 'tag' },\\n      inferred" -> "\\n      exclude: [\\n        {\\n          type: 'tag',\\n          pattern: 'store',\\n        },\\n      ],\\n\\n      group: { type: 'tag' },\\n      inferred: true,\\n      typedSchema""`,
    )
  })

  it('creates the options object for a plugin called bare', () => {
    const result = apply(advanced, { operation: 'set', plugin: '@kubb/plugin-redoc', path: ['output', 'path'], value: './docs' })
    expect(changedSpan(advanced, result.source)).toMatchInlineSnapshot(`""" -> "{\\n      output: {\\n        path: './docs',\\n      },\\n    }""`)
  })

  it('refuses to overwrite an option customized in code', () => {
    const result = apply(advanced, { operation: 'set', plugin: '@kubb/plugin-axios', path: ['group', 'name'], value: 'x' })
    expect({ changed: result.changed, outcomes: result.outcomes.map((outcome) => outcome.reason) }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "outcomes": [
          "group.name is customized in code",
        ],
      }
    `)
  })

  it('refuses a plugin that is not in the file', () => {
    const result = apply(advanced, { operation: 'set', plugin: '@kubb/plugin-swr', path: ['hooks'], value: true })
    expect({ changed: result.changed, outcomes: result.outcomes.map((outcome) => outcome.reason) }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "outcomes": [
          "@kubb/plugin-swr is not in the plugins array",
        ],
      }
    `)
  })

  it('applies the good edits in a batch and reports the bad ones', () => {
    const result = apply(
      advanced,
      { operation: 'set', plugin: '@kubb/plugin-ts', path: ['arrayType'], value: 'array' },
      { operation: 'set', plugin: '@kubb/plugin-axios', path: ['group'], value: { type: 'path' } },
      { operation: 'set', plugin: '@kubb/plugin-msw', path: ['handlers'], value: false },
    )
    expect({
      applied: result.outcomes.filter((outcome) => outcome.applied).length,
      reasons: result.outcomes.filter((outcome) => !outcome.applied).map((outcome) => outcome.reason),
      changedLines: changedLines(advanced, result.source),
    }).toMatchInlineSnapshot(`
      {
        "applied": 2,
        "changedLines": [
          "arrayType: 'generic', -> arrayType: 'array',",
          "handlers: true, -> handlers: false,",
        ],
        "reasons": [
          "group is customized in code",
        ],
      }
    `)
  })

  it('refuses a __proto__ path segment instead of throwing and taking the rest of the batch down', () => {
    const result = apply(
      advanced,
      { operation: 'set', plugin: '@kubb/plugin-ts', path: ['__proto__', 'polluted'], value: 'yes' },
      { operation: 'set', plugin: '@kubb/plugin-ts', path: ['arrayType'], value: 'array' },
    )
    expect({
      applied: result.outcomes.filter((outcome) => outcome.applied).length,
      reasons: result.outcomes.map((outcome) => outcome.reason),
    }).toMatchInlineSnapshot(`
      {
        "applied": 1,
        "reasons": [
          "__proto__.polluted is not a valid option path",
          undefined,
        ],
      }
    `)
  })
})

describe('applyConfigEdits: remove', () => {
  it('drops a literal option so the plugin falls back to its default', () => {
    const result = apply(advanced, { operation: 'remove', plugin: '@kubb/plugin-zod', path: ['inferred'] })
    expect(changedSpan(advanced, result.source)).toMatchInlineSnapshot(
      `""      exclude: [\\n        {\\n          type: 'tag',\\n          pattern: 'store',\\n        },\\n      ],\\n      group: { type: 'tag' },\\n      inferred: true" -> "\\n      exclude: [\\n        {\\n          type: 'tag',\\n          pattern: 'store',\\n        },\\n      ],\\n\\n      group: { type: 'tag' }""`,
    )
  })

  it('refuses to remove an option customized in code', () => {
    const result = apply(advanced, { operation: 'remove', plugin: '@kubb/plugin-faker', path: ['macros'] })
    expect({ changed: result.changed, reason: result.outcomes[0]?.reason }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "reason": "macros is customized in code",
      }
    `)
  })

  it('reports an option that was never set', () => {
    const result = apply(advanced, { operation: 'remove', plugin: '@kubb/plugin-zod', path: ['unset'] })
    expect({ changed: result.changed, reason: result.outcomes[0]?.reason }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "reason": "unset is not set",
      }
    `)
  })
})

describe('applyConfigEdits: add-plugin', () => {
  it('adds the call and the import, leaving every import line but the new one untouched', () => {
    const result = apply(advanced, { operation: 'add-plugin', plugin: '@kubb/plugin-swr', options: { group: { type: 'tag' } } })
    const importLines = result.source.split('\n').filter((line) => line.startsWith('import'))
    expect(importLines.filter((line) => !line.includes('pluginSwr'))).toEqual(advanced.split('\n').filter((line) => line.startsWith('import')))
    expect(importLines).toContain(`import { pluginSwr } from '@kubb/plugin-swr'`)
    expect(result.source).toContain('pluginSwr({')
  })

  it('reflows the whole plugins array, since one more element changes its structure', () => {
    // A known magicast/recast limitation: any array whose element count changes is reprinted in
    // full, unlike ts-morph's surgical `addElement`. The array collapses onto fewer lines; every
    // plugin call keeps its own options untouched.
    const result = apply(advanced, { operation: 'add-plugin', plugin: '@kubb/plugin-swr', options: { group: { type: 'tag' } } })
    expect(result.source).toContain('pluginRedoc(), pluginTs({')
  })

  it('leaves the result parseable, with the new plugin readable', () => {
    const result = apply(advanced, { operation: 'add-plugin', plugin: '@kubb/plugin-swr' })
    const view = readConfig(result.source)
    expect(view.managed && view.configs[0]!.plugins.at(-1)).toMatchInlineSnapshot(`
      {
        "importName": "pluginSwr",
        "options": {},
        "packageName": "@kubb/plugin-swr",
      }
    `)
  })

  it('refuses a plugin that is already there', () => {
    const result = apply(advanced, { operation: 'add-plugin', plugin: '@kubb/plugin-ts' })
    expect({ changed: result.changed, reason: result.outcomes[0]?.reason }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "reason": "@kubb/plugin-ts is already in the plugins array",
      }
    `)
  })

  it('refuses when the import name is taken by another package', () => {
    const source = `import { pluginTs } from './my-own-plugin-ts.ts'\n\nexport default defineConfig({ plugins: [pluginTs()] })\n`
    const result = apply(source, { operation: 'add-plugin', plugin: '@kubb/plugin-ts' })
    expect({ changed: result.changed, reason: result.outcomes[0]?.reason }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "reason": "pluginTs is already imported from ./my-own-plugin-ts.ts",
      }
    `)
  })

  it('fills an empty plugins array', () => {
    const source = `import { defineConfig } from 'kubb/config'\n\nexport default defineConfig({\n  input: './api.yaml',\n  plugins: [],\n})\n`
    const result = apply(source, { operation: 'add-plugin', plugin: '@kubb/plugin-ts' })
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
    const result = apply(source, {
      operation: 'add-plugin',
      plugin: `evil'\nawait import('node:child_process').then((m) => m.execSync('touch pwned'))\nimport { x } from 'y`,
      importName: 'evilPlugin',
    })
    expect(result.changed).toBe(false)
    expect(result.outcomes[0]?.applied).toBe(false)
    expect(result.source).not.toContain('child_process')
  })

  it('refuses an import name that is not a valid identifier', () => {
    const source = `import { defineConfig } from 'kubb/config'\n\nexport default defineConfig({\n  input: './api.yaml',\n  plugins: [],\n})\n`
    const result = apply(source, { operation: 'add-plugin', plugin: '@kubb/plugin-ts', importName: `x } from 'evil'; //` })
    expect(result.changed).toBe(false)
    expect(result.source).not.toContain('evil')
  })

  it('inserts the new import after a multi-line import instead of inside it', () => {
    const source = `import { defineConfig } from 'kubb/config'\nimport {\n  pluginTs,\n} from '@kubb/plugin-ts'\n\nexport default defineConfig({\n  input: './api.yaml',\n  plugins: [pluginTs()],\n})\n`
    const result = apply(source, { operation: 'add-plugin', plugin: '@kubb/plugin-zod' })
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
    const result = apply(
      source,
      { operation: 'add-plugin', plugin: '@kubb/plugin-ts' },
      { operation: 'add-plugin', plugin: '@kubb/plugin-zod', options: { inferred: true } },
    )
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
})

describe('reading a config that does not look like the examples', () => {
  it('finds a plugin imported under an alias', () => {
    const source = `import { pluginTs as tsPlugin } from '@kubb/plugin-ts'\n\nexport default defineConfig({ plugins: [tsPlugin({ arrayType: 'generic' })] })\n`
    const view = readConfig(source)
    expect(view.managed && view.configs[0]!.plugins).toMatchInlineSnapshot(`
      [
        {
          "importName": "tsPlugin",
          "options": {
            "arrayType": {
              "literal": true,
              "value": "generic",
            },
          },
          "packageName": "@kubb/plugin-ts",
        },
      ]
    `)
  })

  it('edits a plugin imported under an alias', () => {
    const source = `import { pluginTs as tsPlugin } from '@kubb/plugin-ts'\n\nexport default defineConfig({ plugins: [tsPlugin({ arrayType: 'generic' })] })\n`
    const result = applyConfigEdits(source, [{ operation: 'set', plugin: '@kubb/plugin-ts', path: ['arrayType'], value: 'array' }])
    expect(changedSpan(source, result.source)).toMatchInlineSnapshot(`""generic" -> "array""`)
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
    expect(result.source.split('\n').filter((line) => line.startsWith('import'))).toMatchInlineSnapshot(`
      [
        "import { pluginTs } from '@kubb/plugin-ts'",
        "import { pluginZod } from '@kubb/plugin-zod'",
      ]
    `)
  })

  it('follows a config that does write semicolons', () => {
    const source = [`import { pluginTs } from '@kubb/plugin-ts';`, ``, `export default defineConfig({ plugins: [pluginTs()] });`, ``].join('\n')
    const result = applyConfigEdits(source, [{ operation: 'add-plugin', plugin: '@kubb/plugin-zod' }])
    expect(result.source.split('\n').filter((line) => line.startsWith('import'))).toMatchInlineSnapshot(`
      [
        "import { pluginTs } from '@kubb/plugin-ts';",
        "import { pluginZod } from '@kubb/plugin-zod';",
      ]
    `)
  })

  it('puts a new import after the existing ones when a statement comes first', () => {
    const source = [
      `const strict = process.env.STRICT === 'true'`,
      `import { pluginTs } from '@kubb/plugin-ts'`,
      ``,
      `export default defineConfig({ plugins: [pluginTs()] })`,
      ``,
    ].join('\n')
    const result = applyConfigEdits(source, [{ operation: 'add-plugin', plugin: '@kubb/plugin-zod' }])
    expect(result.source).toMatchInlineSnapshot(`
      "const strict = process.env.STRICT === 'true'
      import { pluginTs } from '@kubb/plugin-ts'
      import { pluginZod } from '@kubb/plugin-zod'

      export default defineConfig({ plugins: [pluginTs(), pluginZod()] })
      "
    `)
  })
})

describe('applyConfigEdits: array configs', () => {
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
    expect(view.managed && view.configs.map((config) => [config.name, config.plugins.map((plugin) => plugin.importName)])).toMatchInlineSnapshot(`
      [
        [
          "public",
          [
            "pluginTs",
          ],
        ],
        [
          "internal",
          [
            "pluginZod",
          ],
        ],
      ]
    `)
  })

  it('targets an entry by index', () => {
    const result = applyConfigEdits(arraySource, [{ operation: 'set', config: 1, plugin: '@kubb/plugin-zod', path: ['inferred'], value: true }])
    expect(changedSpan(arraySource, result.source)).toMatchInlineSnapshot(`""" -> "{\\n    inferred: true,\\n  }""`)
  })

  it('targets an entry by name', () => {
    const result = applyConfigEdits(arraySource, [{ operation: 'set', config: 'public', plugin: '@kubb/plugin-ts', path: ['arrayType'], value: 'array' }])
    expect(changedSpan(arraySource, result.source)).toMatchInlineSnapshot(`""generic" -> "array""`)
  })

  it('defaults to the first entry when an edit names none', () => {
    const result = applyConfigEdits(arraySource, [{ operation: 'set', plugin: '@kubb/plugin-ts', path: ['arrayType'], value: 'array' }])
    expect(changedSpan(arraySource, result.source)).toMatchInlineSnapshot(`""generic" -> "array""`)
  })

  it('refuses an edit naming a config entry that does not exist', () => {
    const result = applyConfigEdits(arraySource, [{ operation: 'set', config: 'missing', plugin: '@kubb/plugin-ts', path: ['arrayType'], value: 'array' }])
    expect({ changed: result.changed, reason: result.outcomes[0]?.reason }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "reason": "no config entry found for "missing"",
      }
    `)
  })

  it('adds a plugin to one entry without touching the other', () => {
    const result = applyConfigEdits(arraySource, [{ operation: 'add-plugin', config: 'internal', plugin: '@kubb/plugin-msw' }])
    expect(result.source).toContain(`{ name: 'public', plugins: [pluginTs({ arrayType: 'generic' })] }`)
    expect(result.source).toContain('pluginMsw()')
  })

  it('reads every entry of a realistic multi-output array config', () => {
    const view = readConfig(arrayConfig)
    expect(view.managed && view.configs.map((config) => [config.name, config.plugins.map((plugin) => plugin.importName)])).toMatchInlineSnapshot(`
      [
        [
          "public",
          [
            "pluginTs",
          ],
        ],
        [
          "internal",
          [
            "pluginTs",
            "pluginZod",
          ],
        ],
      ]
    `)
  })

  it('disables a plugin in one entry of the real fixture, leaving the other entry alone', () => {
    const result = applyConfigEdits(arrayConfig, [{ operation: 'disable-plugin', config: 'internal', plugin: '@kubb/plugin-zod' }])
    expect(result.source).toContain('// kubb:disabled @kubb/plugin-zod')
    const view = readConfig(result.source)
    expect(view.managed && view.configs[0]!.plugins.every((plugin) => !plugin.disabled)).toBe(true)
  })
})

describe('applyConfigEdits: disable-plugin and enable-plugin', () => {
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
    expect(view.managed && view.configs[0]!.plugins.find((plugin) => plugin.packageName === '@kubb/plugin-zod')).toMatchInlineSnapshot(`
      {
        "disabled": true,
        "importName": "pluginZod",
        "options": {},
        "packageName": "@kubb/plugin-zod",
      }
    `)
  })

  it('leaves a set on a sibling plugin untouched while one is disabled', () => {
    const disabled = applyConfigEdits(source, [{ operation: 'disable-plugin', plugin: '@kubb/plugin-zod' }]).source
    const result = applyConfigEdits(disabled, [{ operation: 'set', plugin: '@kubb/plugin-ts', path: ['arrayType'], value: 'array' }])
    expect(result.source).toContain('// kubb:disabled @kubb/plugin-zod')
    expect(result.source).toContain('//   inferred: true,')
    expect(changedSpan(disabled, result.source)).toMatchInlineSnapshot(`""generic" -> "array""`)
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

  it('refuses to disable a plugin that shares its line with other code', () => {
    const inline = `import { pluginTs } from '@kubb/plugin-ts'\n\nexport default defineConfig({ plugins: [pluginTs({ arrayType: 'generic' })] })\n`
    const result = applyConfigEdits(inline, [{ operation: 'disable-plugin', plugin: '@kubb/plugin-ts' }])
    expect({ changed: result.changed, reason: result.outcomes[0]?.reason }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "reason": "@kubb/plugin-ts shares a line with other code, so it cannot be commented out safely",
      }
    `)
  })

  it('refuses to disable a plugin that is not in the file', () => {
    const result = applyConfigEdits(source, [{ operation: 'disable-plugin', plugin: '@kubb/plugin-msw' }])
    expect({ changed: result.changed, reason: result.outcomes[0]?.reason }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "reason": "@kubb/plugin-msw is not in the plugins array",
      }
    `)
  })

  it('refuses to enable a plugin that is not disabled', () => {
    const result = applyConfigEdits(source, [{ operation: 'enable-plugin', plugin: '@kubb/plugin-zod' }])
    expect({ changed: result.changed, reason: result.outcomes[0]?.reason }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "reason": "@kubb/plugin-zod is not disabled",
      }
    `)
  })
})

describe('readConfig: values magicast cannot proxy', () => {
  it('classifies a negative number and a template literal as literal without throwing', () => {
    const source = `import { pluginTs } from '@kubb/plugin-ts'\n\nexport default defineConfig({ plugins: [pluginTs({ n: -1, banner: \`static\` })] })\n`
    const view = readConfig(source)
    expect(view.managed && view.configs[0]!.plugins[0]!.options).toMatchInlineSnapshot(`
      {
        "banner": {
          "literal": true,
          "value": "static",
        },
        "n": {
          "literal": true,
          "value": -1,
        },
      }
    `)
  })
})

describe('applyConfigEdits: unmanaged files', () => {
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
    const result = apply(source, { operation: 'set', plugin: '@kubb/plugin-ts', path: ['enum', 'type'], value: 'enum' })
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

describe('applyConfigEdits: values arriving from outside', () => {
  const base = `import { pluginTs } from '@kubb/plugin-ts'\n\nexport default defineConfig({\n  plugins: [pluginTs({ arrayType: 'generic' })],\n})\n`

  it('refuses a value that is not a literal', () => {
    const result = applyConfigEdits(base, [{ operation: 'set', plugin: '@kubb/plugin-ts', path: ['arrayType'], value: () => 'array' }])
    expect({ changed: result.changed, reason: result.outcomes[0]?.reason }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "reason": "the value is not a literal that can be written to a config file",
      }
    `)
  })

  it('refuses a __proto__ key instead of writing it into the file', () => {
    const value = JSON.parse('{"__proto__": {"polluted": true}}') as unknown
    const result = applyConfigEdits(base, [{ operation: 'set', plugin: '@kubb/plugin-ts', path: ['group'], value }])
    expect({ changed: result.changed, reason: result.outcomes[0]?.reason }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "reason": "the value is not a literal that can be written to a config file",
      }
    `)
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
    expect(view.managed && Object.keys(view.configs[0]!.plugins[0]!.options)).toMatchInlineSnapshot(`
      [
        "arrayType",
      ]
    `)
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
