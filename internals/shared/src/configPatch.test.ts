import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { applyConfigEdits, type ConfigEdit, isOptionValue, printValue, readConfig, toImportName } from './configPatch.ts'

const advanced = readFileSync(join(import.meta.dirname, '../mocks/advanced.config.txt'), 'utf8')

/** The single span that differs between two texts, for asserting one edit touched one place. */
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

describe('toImportName', () => {
  it('resolves known plugins and derives unknown ones', () => {
    expect(['@kubb/plugin-ts', '@kubb/plugin-react-query', '@kubb/plugin-solid-query', 'kubb-plugin-custom'].map(toImportName)).toMatchInlineSnapshot(`
      [
        "pluginTs",
        "pluginReactQuery",
        "pluginSolidQuery",
        "kubbPluginCustom",
      ]
    `)
  })
})

describe('printValue', () => {
  it('prints config literals in the repo style', () => {
    expect([printValue('a-b'), printValue(true), printValue(3), printValue(null), printValue(['x']), printValue({ type: 'tag', 'odd key': 1 })])
      .toMatchInlineSnapshot(`
        [
          "'a-b'",
          "true",
          "3",
          "null",
          "['x']",
          "{ type: 'tag', 'odd key': 1 }",
        ]
      `)
  })

  it('escapes quotes and backslashes in strings', () => {
    expect(printValue("it's \\ here")).toMatchInlineSnapshot(`"'it\\'s \\\\ here'"`)
  })
})

describe('readConfig', () => {
  it('lists every plugin in the advanced example with its package', () => {
    const view = readConfig(advanced)
    expect(view.managed && view.plugins.map((plugin) => `${plugin.importName} <- ${plugin.packageName}`)).toMatchInlineSnapshot(`
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
    const byName = view.managed ? Object.fromEntries(view.plugins.map((plugin) => [plugin.importName, plugin.options])) : {}
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
        },
        "axios.group": {
          "literal": false,
        },
        "faker.group": {
          "literal": true,
        },
        "faker.macros": {
          "literal": false,
        },
        "faker.resolver": {
          "literal": false,
        },
        "ts.override": {
          "literal": true,
        },
      }
    `)
  })

  it('refuses an array config', () => {
    expect(readConfig(`export default defineConfig([{ name: 'a' }])`)).toMatchInlineSnapshot(`
      {
        "managed": false,
        "reason": "config is not a single object literal, array configs are not supported",
      }
    `)
  })

  it('refuses a function returning an array', () => {
    expect(readConfig(`export default defineConfig(() => schemas.map((s) => ({ name: s })))`)).toMatchInlineSnapshot(`
      {
        "managed": false,
        "reason": "config is not a single object literal, array configs are not supported",
      }
    `)
  })

  it('reads through a (cli) => ({...}) wrapper', () => {
    const source = `import { pluginTs } from '@kubb/plugin-ts'\nexport default defineConfig((cli) => ({ plugins: [pluginTs({ arrayType: 'generic' })] }))`
    expect(readConfig(source)).toMatchInlineSnapshot(`
      {
        "managed": true,
        "plugins": [
          {
            "importName": "pluginTs",
            "options": {
              "arrayType": {
                "literal": true,
              },
            },
            "packageName": "@kubb/plugin-ts",
          },
        ],
      }
    `)
  })
})

describe('applyConfigEdits: set', () => {
  it('changes only the targeted value and leaves every other byte alone', () => {
    const result = apply(advanced, { op: 'set', plugin: '@kubb/plugin-ts', path: ['enum', 'type'], value: 'enum' })
    expect(changedSpan(advanced, result.source)).toMatchInlineSnapshot(`""asConst" -> "enum""`)
  })

  it('adds a missing key to an existing options object', () => {
    const result = apply(advanced, { op: 'set', plugin: '@kubb/plugin-zod', path: ['typedSchema'], value: true })
    expect(changedSpan(advanced, result.source)).toMatchInlineSnapshot(`""" -> "  typedSchema: true,\\n    ""`)
  })

  it('creates the options object for a plugin called bare', () => {
    const result = apply(advanced, { op: 'set', plugin: '@kubb/plugin-redoc', path: ['output', 'path'], value: './docs' })
    expect(changedSpan(advanced, result.source)).toMatchInlineSnapshot(`""" -> "{\\n      output: {\\n        path: './docs',\\n      },\\n    }""`)
  })

  it('refuses to overwrite an option customized in code', () => {
    const result = apply(advanced, { op: 'set', plugin: '@kubb/plugin-axios', path: ['group', 'name'], value: 'x' })
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
    const result = apply(advanced, { op: 'set', plugin: '@kubb/plugin-swr', path: ['hooks'], value: true })
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
      { op: 'set', plugin: '@kubb/plugin-ts', path: ['arrayType'], value: 'array' },
      { op: 'set', plugin: '@kubb/plugin-axios', path: ['group'], value: { type: 'path' } },
      { op: 'set', plugin: '@kubb/plugin-msw', path: ['handlers'], value: false },
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
})

describe('applyConfigEdits: remove', () => {
  it('drops a literal option so the plugin falls back to its default', () => {
    const result = apply(advanced, { op: 'remove', plugin: '@kubb/plugin-zod', path: ['inferred'] })
    expect(changedSpan(advanced, result.source)).toMatchInlineSnapshot(`""  inferred: true,\\n    " -> """`)
  })

  it('refuses to remove an option customized in code', () => {
    const result = apply(advanced, { op: 'remove', plugin: '@kubb/plugin-faker', path: ['macros'] })
    expect({ changed: result.changed, reason: result.outcomes[0]?.reason }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "reason": "macros is customized in code",
      }
    `)
  })

  it('reports an option that was never set', () => {
    const result = apply(advanced, { op: 'remove', plugin: '@kubb/plugin-zod', path: ['unset'] })
    expect({ changed: result.changed, reason: result.outcomes[0]?.reason }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "reason": "unset is not set",
      }
    `)
  })
})

describe('applyConfigEdits: add-plugin', () => {
  it('adds the call and the import without rewriting any other line', () => {
    const result = apply(advanced, { op: 'add-plugin', plugin: '@kubb/plugin-swr', options: { group: { type: 'tag' } } })
    const lines = result.source.split('\n')
    expect(lines.filter((line) => !line.includes('pluginSwr'))).toEqual(advanced.split('\n'))
    expect(lines.filter((line) => line.includes('pluginSwr'))).toMatchInlineSnapshot(`
      [
        "import { pluginSwr } from '@kubb/plugin-swr'",
        "    pluginSwr({ group: { type: 'tag' } }),",
      ]
    `)
  })

  it('leaves the result parseable, with the new plugin readable', () => {
    const result = apply(advanced, { op: 'add-plugin', plugin: '@kubb/plugin-swr' })
    const view = readConfig(result.source)
    expect(view.managed && view.plugins.at(-1)).toMatchInlineSnapshot(`
      {
        "importName": "pluginSwr",
        "options": {},
        "packageName": "@kubb/plugin-swr",
      }
    `)
  })

  it('refuses a plugin that is already there', () => {
    const result = apply(advanced, { op: 'add-plugin', plugin: '@kubb/plugin-ts' })
    expect({ changed: result.changed, reason: result.outcomes[0]?.reason }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "reason": "@kubb/plugin-ts is already in the plugins array",
      }
    `)
  })

  it('refuses when the import name is taken by another package', () => {
    const source = `import { pluginTs } from './my-own-plugin-ts.ts'\n\nexport default defineConfig({ plugins: [pluginTs()] })\n`
    const result = apply(source, { op: 'add-plugin', plugin: '@kubb/plugin-ts' })
    expect({ changed: result.changed, reason: result.outcomes[0]?.reason }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "reason": "pluginTs is already imported from ./my-own-plugin-ts.ts",
      }
    `)
  })

  it('fills an empty plugins array', () => {
    const source = `import { defineConfig } from 'kubb/config'\n\nexport default defineConfig({\n  input: './api.yaml',\n  plugins: [],\n})\n`
    const result = apply(source, { op: 'add-plugin', plugin: '@kubb/plugin-ts' })
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

  it('adds several plugins in one pass', () => {
    const source = `import { defineConfig } from 'kubb/config'\n\nexport default defineConfig({\n  input: './api.yaml',\n  plugins: [],\n})\n`
    const result = apply(source, { op: 'add-plugin', plugin: '@kubb/plugin-ts' }, { op: 'add-plugin', plugin: '@kubb/plugin-zod', options: { inferred: true } })
    expect(result.source).toMatchInlineSnapshot(`
      "import { defineConfig } from 'kubb/config'
      import { pluginTs } from '@kubb/plugin-ts'
      import { pluginZod } from '@kubb/plugin-zod'

      export default defineConfig({
        input: './api.yaml',
        plugins: [pluginTs(), pluginZod({ inferred: true })],
      })
      "
    `)
  })
})

describe('applyConfigEdits: unmanaged files', () => {
  it('applies nothing to an array config and says why', () => {
    const source = `export default defineConfig([{ name: 'a', plugins: [] }])\n`
    const result = apply(source, { op: 'add-plugin', plugin: '@kubb/plugin-ts' })
    expect({ changed: result.changed, source: result.source, reason: result.outcomes[0]?.reason }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "reason": "config is not a single object literal, array configs are not supported",
        "source": "export default defineConfig([{ name: 'a', plugins: [] }])
      ",
      }
    `)
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
    const result = apply(source, { op: 'set', plugin: '@kubb/plugin-ts', path: ['enum', 'type'], value: 'enum' })
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
    const result = applyConfigEdits(base, [{ op: 'set', plugin: '@kubb/plugin-ts', path: ['arrayType'], value: () => 'array' }])
    expect({ changed: result.changed, reason: result.outcomes[0]?.reason }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "reason": "the value is not a literal that can be written to a config file",
      }
    `)
  })

  it('refuses a __proto__ key instead of writing it into the file', () => {
    const value = JSON.parse('{"__proto__": {"polluted": true}}') as unknown
    const result = applyConfigEdits(base, [{ op: 'set', plugin: '@kubb/plugin-ts', path: ['group'], value }])
    expect({ changed: result.changed, reason: result.outcomes[0]?.reason }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "reason": "the value is not a literal that can be written to a config file",
      }
    `)
  })

  it('escapes a string that would otherwise break out of the literal', () => {
    const value = "generic',\n      dangerous: true,\n      x: '"
    const result = applyConfigEdits(base, [{ op: 'set', plugin: '@kubb/plugin-ts', path: ['arrayType'], value }])
    expect(result.source).toMatchInlineSnapshot(`
      "import { pluginTs } from '@kubb/plugin-ts'

      export default defineConfig({
        plugins: [pluginTs({ arrayType: 'generic\\',\\n      dangerous: true,\\n      x: \\'' })],
      })
      "
    `)
    // The injected text must be inert: the plugin still has exactly the one option.
    const view = readConfig(result.source)
    expect(view.managed && Object.keys(view.plugins[0]!.options)).toMatchInlineSnapshot(`
      [
        "arrayType",
      ]
    `)
  })

  it('keeps a value with real newlines and quotes readable', () => {
    const result = applyConfigEdits(base, [{ op: 'set', plugin: '@kubb/plugin-ts', path: ['banner'], value: "line one\nit's \\ two" }])
    expect(result.source).toMatchInlineSnapshot(`
      "import { pluginTs } from '@kubb/plugin-ts'

      export default defineConfig({
        plugins: [pluginTs({ arrayType: 'generic',
          banner: 'line one\\nit\\'s \\\\ two',
        })],
      })
      "
    `)
  })
})
