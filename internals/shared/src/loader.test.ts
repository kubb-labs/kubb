import { mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import { loadModule } from './loader.ts'

// Counts the loads that reach jiti. The loader creates jiti once per process, so the instance is what gets watched.
const jitiLoad = vi.hoisted(() => vi.fn())

// Lets a test run the loader as if under Bun.
const runtime = vi.hoisted(() => ({ isBun: false, name: 'node', version: '' }))

vi.mock('@internals/utils', async (importOriginal) => ({ ...(await importOriginal<typeof import('@internals/utils')>()), runtime }))

vi.mock('jiti', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jiti')>()
  return {
    ...actual,
    createJiti: (...args: Parameters<typeof actual.createJiti>) => {
      const jiti = actual.createJiti(...args)
      const { import: importModule, evalModule } = jiti
      return Object.assign(jiti, {
        import: (...importArgs: Parameters<typeof importModule>) => {
          jitiLoad()
          return importModule(...importArgs)
        },
        evalModule: (...evalArgs: Parameters<typeof evalModule>) => {
          jitiLoad()
          return evalModule(...evalArgs)
        },
      })
    },
  }
})

const testDir = path.join(os.tmpdir(), 'kubb-test-loader')
const typelessDir = path.join(testDir, 'typeless')
const commonjsDir = path.join(testDir, 'commonjs')
const counter = globalThis as { kubbLoaderTestRuns?: number }

async function write(name: string, source: string): Promise<string> {
  const filePath = path.join(testDir, name)
  await writeFile(filePath, source)
  return filePath
}

beforeAll(async () => {
  await mkdir(typelessDir, { recursive: true })
  await mkdir(commonjsDir, { recursive: true })
  // A `.js` config in an ESM package is the case Node's own `import()` would cache.
  await writeFile(path.join(testDir, 'package.json'), '{ "type": "module" }\n')
  await writeFile(path.join(typelessDir, 'package.json'), '{}\n')
  await writeFile(path.join(commonjsDir, 'package.json'), '{ "type": "commonjs" }\n')
  await write('commonjs/helper.ts', `export const name: string = 'helper'\n`)
  await write('helper.ts', `export const name: string = 'helper'\n`)
})

beforeEach(() => {
  jitiLoad.mockClear()
  counter.kubbLoaderTestRuns = 0
})

afterAll(async () => {
  await rm(testDir, { recursive: true, force: true })
})

describe('loadModule', () => {
  test('returns the default export when default is set, and the namespace otherwise', async () => {
    const tsConfigPath = await write('kubb.config.ts', "export default { name: 'loaded' }\n")
    const namedExportPath = await write('named.ts', "export const value = 42\nexport default 'fallback'\n")

    expect(await loadModule(tsConfigPath, { default: true })).toStrictEqual({ name: 'loaded' })
    expect(await loadModule(namedExportPath)).toMatchObject({ value: 42, default: 'fallback' })
  })

  test.each(['js', 'mjs', 'cjs', 'ts', 'mts', 'cts'])('picks up an edit to a .%s config on the next load', async (extension) => {
    const filePath = path.join(testDir, `reload.config.${extension}`)
    const source = (name: string) => (extension === 'cjs' ? `module.exports = { name: '${name}' }\n` : `export default { name: '${name}' }\n`)

    await writeFile(filePath, source('before'))
    expect(await loadModule(filePath, { default: true })).toStrictEqual({ name: 'before' })

    await writeFile(filePath, source('after'))
    expect(await loadModule(filePath, { default: true })).toStrictEqual({ name: 'after' })
  })

  test('picks up an edit to a TypeScript file the config imports', async () => {
    const helperPath = path.join(testDir, 'reload.helper.ts')
    const filePath = path.join(testDir, 'imports.config.js')

    await writeFile(helperPath, `export const name = 'before'\n`)
    await writeFile(filePath, `import { name } from './reload.helper.ts'\n\nexport default { name }\n`)
    expect(await loadModule(filePath, { default: true })).toStrictEqual({ name: 'before' })

    await writeFile(helperPath, `export const name = 'after'\n`)
    expect(await loadModule(filePath, { default: true })).toStrictEqual({ name: 'after' })
  })
})

describe('loadModule native import', () => {
  test.each(['ts', 'mts', 'js', 'mjs'])('loads a .%s config the first time without jiti', async (extension) => {
    const filePath = await write(`native.config.${extension}`, `import { name } from './helper.ts'\n\nexport default { name }\n`)

    expect(await loadModule(filePath, { default: true })).toStrictEqual({ name: 'helper' })
    expect(jitiLoad).not.toHaveBeenCalled()
  })

  test.each(['native.config.cjs', 'native.config.cts', 'typeless/native.config.ts', 'typeless/native.config.js', 'commonjs/native.config.ts'])(
    'loads the CommonJS config %s the first time without jiti',
    async (file) => {
      const filePath = await write(file, `const path = require('node:path')\n\nmodule.exports = { name: path.basename(__dirname + '/helper') }\n`)

      expect(await loadModule(filePath, { default: true })).toStrictEqual({ name: 'helper' })
      expect(jitiLoad).not.toHaveBeenCalled()
    },
  )

  test('loads a config that exports a function or an array', async () => {
    const functionPath = await write('function.config.ts', `export default (cli: { watch: boolean }) => ({ watch: cli.watch })\n`)
    const arrayPath = await write('array.config.ts', `export default [{ name: 'a' }, { name: 'b' }]\n`)

    const fn = await loadModule<(cli: { watch: boolean }) => unknown>(functionPath, { default: true })
    expect(fn({ watch: true })).toStrictEqual({ watch: true })
    expect(await loadModule(arrayPath, { default: true })).toStrictEqual([{ name: 'a' }, { name: 'b' }])
    expect(jitiLoad).not.toHaveBeenCalled()
  })

  test('uses jiti for the second load of the same file', async () => {
    const filePath = await write('second.config.ts', `export default { name: 'second' }\n`)

    await loadModule(filePath, { default: true })
    expect(jitiLoad).not.toHaveBeenCalled()

    expect(await loadModule(filePath, { default: true })).toStrictEqual({ name: 'second' })
    expect(jitiLoad).toHaveBeenCalledTimes(1)
  })

  test('evaluates a config that throws once, and surfaces its error', async () => {
    const filePath = await write('throws.config.ts', `globalThis.kubbLoaderTestRuns += 1\nthrow new Error('boom from config')\n`)

    await expect(loadModule(filePath, { default: true })).rejects.toThrow('boom from config')
    expect(counter.kubbLoaderTestRuns).toBe(1)
    expect(jitiLoad).not.toHaveBeenCalled()
  })
})

describe('loadModule under Bun', () => {
  beforeEach(() => {
    Object.assign(runtime, { isBun: true, name: 'bun' })
    return () => Object.assign(runtime, { isBun: false, name: 'node' })
  })

  test('imports a config without jiti, and surfaces its error as it is', async () => {
    const filePath = await write('bun.config.ts', `import { name } from './helper.ts'\n\nexport default { name }\n`)
    const throwsPath = await write('bun-throws.config.ts', `globalThis.kubbLoaderTestRuns += 1\nthrow new Error('boom under bun')\n`)

    expect(await loadModule(filePath, { default: true })).toStrictEqual({ name: 'helper' })
    await expect(loadModule(throwsPath, { default: true })).rejects.toThrow('boom under bun')
    expect(counter.kubbLoaderTestRuns).toBe(1)
    expect(jitiLoad).not.toHaveBeenCalled()
  })

  test('uses jiti for a .tsx config, so JSX uses the @kubb/renderer-jsx runtime', async () => {
    const filePath = await write('bun.config.tsx', `export default { name: 'helper' }\n`)

    expect(await loadModule(filePath, { default: true })).toStrictEqual({ name: 'helper' })
    expect(jitiLoad).toHaveBeenCalledTimes(1)
  })
})

describe('loadModule jiti fallback', () => {
  // Each config counts its evaluations, so a fallback that ran the file twice would show.
  const cases = [
    { name: 'a .tsx config', file: 'jsx.config.tsx', source: `export default { name: 'helper' }\n` },
    { name: 'an extensionless import of a .ts file', file: 'extensionless.config.ts', source: `import { name } from './helper'\n\nexport default { name }\n` },
    {
      name: 'an enum',
      file: 'enum.config.ts',
      source: `enum Name {\n  helper = 'helper',\n}\n\nexport default { name: Name.helper }\n`,
    },
    {
      name: 'a type imported without the type keyword',
      file: 'type.config.ts',
      source: `import { Name, name } from './types.ts'\n\nexport default { name: name satisfies Name }\n`,
    },
    {
      name: 'a CommonJS global in the config',
      file: 'dirname.config.ts',
      source: `import path from 'node:path'\n\nexport default { name: path.basename(path.join(__dirname, 'helper')) }\n`,
    },
    {
      name: 'a CommonJS global in a file the config imports',
      file: 'dirname-import.config.ts',
      source: `import { name } from './dirname.helper.ts'\n\nexport default { name }\n`,
    },
    { name: 'a .cts config with an export statement', file: 'export.config.cts', source: `export default { name: 'helper' }\n` },
    { name: 'an ES module .ts config in a package without a type', file: 'typeless/kubb.config.ts', source: `export default { name: 'helper' }\n` },
    { name: 'an ES module .ts config in a CommonJS package', file: 'commonjs/kubb.config.ts', source: `export default { name: 'helper' }\n` },
    // CommonJS resolves while it runs, so Node only finds out after the config started.
    {
      name: 'a CommonJS config that requires a .ts file without its extension',
      file: 'extensionless.config.cts',
      source: `const { name } = require('./helper')\n\nmodule.exports = { name }\n`,
      runs: 2,
    },
    {
      name: 'a CommonJS config that requires an ES module .ts file',
      file: 'commonjs/require.config.ts',
      source: `const { name } = require('./helper.ts')\n\nmodule.exports = { name }\n`,
      runs: 2,
    },
    {
      name: 'a dynamic import of a .ts file without its extension',
      file: 'dynamic.config.ts',
      source: `const { name } = await import('./helper')\n\nexport default { name }\n`,
      runs: 2,
    },
  ]

  beforeAll(async () => {
    await write('types.ts', `export type Name = string\nexport const name = 'helper'\n`)
    await write('dirname.helper.ts', `import path from 'node:path'\n\nexport const name = path.basename(path.join(__dirname, 'helper'))\n`)
  })

  test.each(cases)('falls back for $name', async ({ file, source, runs = 1 }) => {
    const filePath = await write(file, `globalThis.kubbLoaderTestRuns += 1\n${source}`)

    expect(await loadModule(filePath, { default: true })).toStrictEqual({ name: 'helper' })
    expect(jitiLoad).toHaveBeenCalledTimes(1)
    expect(counter.kubbLoaderTestRuns).toBe(runs)
  })

  test('reports the jiti error when neither loader resolves an import', async () => {
    const filePath = await write('alias.config.ts', `import { name } from '@/missing-alias'\n\nexport default { name }\n`)

    await expect(loadModule(filePath, { default: true })).rejects.toThrow(/Cannot find module '@\/missing-alias'/)
    expect(jitiLoad).toHaveBeenCalledTimes(1)
  })
})
