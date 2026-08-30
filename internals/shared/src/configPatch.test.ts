import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { insertPlugin, patchOption, readConfig } from './configPatch.ts'

const advanced = readFileSync(join(import.meta.dirname, '../mocks/advanced.config.txt'), 'utf8')

/** Every span that differs between two versions of a file, as `before -> after`. */
function diffSpans(before: string, after: string): Array<string> {
  let start = 0
  while (start < before.length && start < after.length && before[start] === after[start]) {
    start++
  }
  let end = 0
  while (end < before.length - start && end < after.length - start && before[before.length - 1 - end] === after[after.length - 1 - end]) {
    end++
  }
  if (start === before.length && before.length === after.length) {
    return []
  }
  return [`${before.slice(start, before.length - end)} -> ${after.slice(start, after.length - end)}`]
}

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
    const axios = view.managed && view.plugins.find((plugin) => plugin.importName === 'pluginAxios')
    const faker = view.managed && view.plugins.find((plugin) => plugin.importName === 'pluginFaker')
    expect({ axios: axios && axios.options, faker: faker && faker.options }).toMatchInlineSnapshot(`
      {
        "axios": {
          "baseURL": {
            "literal": true,
          },
          "exclude": {
            "literal": true,
          },
          "group": {
            "literal": false,
          },
          "output": {
            "literal": true,
          },
          "override": {
            "literal": true,
          },
          "validator": {
            "literal": true,
          },
        },
        "faker": {
          "exclude": {
            "literal": true,
          },
          "group": {
            "literal": true,
          },
          "macros": {
            "literal": false,
          },
          "output": {
            "literal": true,
          },
          "resolver": {
            "literal": false,
          },
        },
      }
    `)
  })

  it('refuses an array config', () => {
    expect(readConfig(`export default defineConfig([{ name: 'a' }])`)).toMatchInlineSnapshot(`
      {
        "managed": false,
        "reason": "config is not a single object literal (array configs are not supported)",
      }
    `)
  })

  it('refuses a function returning an array', () => {
    expect(readConfig(`export default defineConfig(() => schemas.map((s) => ({ name: s })))`)).toMatchInlineSnapshot(`
      {
        "managed": false,
        "reason": "config is not a single object literal (array configs are not supported)",
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

describe('patchOption', () => {
  it('changes only the targeted value and leaves the rest byte for byte', () => {
    const result = patchOption(advanced, { importName: 'pluginTs', path: ['enum', 'type'], value: 'enum' })
    expect(result.patched && diffSpans(advanced, result.source)).toMatchInlineSnapshot(`
      [
        "asConst -> enum",
      ]
    `)
  })

  it('adds a missing key to an existing multi-line options object', () => {
    const result = patchOption(advanced, { importName: 'pluginZod', path: ['typedSchema'], value: true })
    expect(result.patched && diffSpans(advanced, result.source)).toMatchInlineSnapshot(`
      [
        " ->   typedSchema: true,
          ",
      ]
    `)
  })

  it('adds an options object to a plugin called without one', () => {
    const result = patchOption(advanced, { importName: 'pluginRedoc', path: ['output'], value: { path: './docs' } })
    expect(result.patched && diffSpans(advanced, result.source)).toMatchInlineSnapshot(`
      [
        " -> { output: { path: './docs' } }",
      ]
    `)
  })

  it('refuses to overwrite an option customized in code', () => {
    expect(patchOption(advanced, { importName: 'pluginAxios', path: ['group'], value: { type: 'path' } })).toMatchInlineSnapshot(`
      {
        "patched": false,
        "reason": "group is customized in code",
      }
    `)
  })

  it('refuses a plugin that is not in the file', () => {
    expect(patchOption(advanced, { importName: 'pluginSolidQuery', path: ['hooks'], value: true })).toMatchInlineSnapshot(`
      {
        "patched": false,
        "reason": "no pluginSolidQuery(...) call in the plugins array",
      }
    `)
  })
})

describe('insertPlugin', () => {
  it('appends a plugin and its import without rewriting anything else', () => {
    const result = insertPlugin(advanced, { importName: 'pluginSwr', packageName: '@kubb/plugin-swr', options: { group: { type: 'tag' } } })
    const lines = result.patched ? result.source.split('\n') : []
    // Every line that is not the insert is byte-identical, in the same order, as the original.
    expect(lines.filter((line) => !line.includes('pluginSwr'))).toEqual(advanced.split('\n'))
    expect(lines.filter((line) => line.includes('pluginSwr'))).toMatchInlineSnapshot(`
      [
        "import { pluginSwr } from '@kubb/plugin-swr'",
        "    pluginSwr({ group: { type: 'tag' } }),",
      ]
    `)
  })

  it('leaves the patched file parseable and re-readable', () => {
    const result = insertPlugin(advanced, { importName: 'pluginSwr', packageName: '@kubb/plugin-swr' })
    const view = result.patched ? readConfig(result.source) : undefined
    expect(view?.managed && view.plugins.map((plugin) => plugin.importName)).toMatchInlineSnapshot(`
      [
        "pluginRedoc",
        "pluginTs",
        "pluginZod",
        "pluginReactQuery",
        "pluginAxios",
        "pluginMcp",
        "pluginFaker",
        "pluginCypress",
        "pluginMsw",
        "pluginSwr",
      ]
    `)
  })

  it('refuses a plugin that is already there', () => {
    expect(insertPlugin(advanced, { importName: 'pluginTs', packageName: '@kubb/plugin-ts' })).toMatchInlineSnapshot(`
      {
        "patched": false,
        "reason": "pluginTs(...) is already in the plugins array",
      }
    `)
  })

  it('fills an empty plugins array', () => {
    const source = `import { defineConfig } from 'kubb/config'\n\nexport default defineConfig({\n  input: './api.yaml',\n  plugins: [],\n})\n`
    const result = insertPlugin(source, { importName: 'pluginTs', packageName: '@kubb/plugin-ts' })
    expect(result.patched && result.source).toMatchInlineSnapshot(`
      "import { defineConfig } from 'kubb/config'
      import { pluginTs } from '@kubb/plugin-ts'

      export default defineConfig({
        input: './api.yaml',
        plugins: [
          pluginTs(),
        ],
      })
      "
    `)
  })
})
