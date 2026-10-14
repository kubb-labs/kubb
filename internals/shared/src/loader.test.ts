import { mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { loadModule } from './loader.ts'

const testDir = path.join(os.tmpdir(), 'kubb-test-loader')
const tsConfigPath = path.join(testDir, 'kubb.config.ts')
const namedExportPath = path.join(testDir, 'named.ts')

beforeAll(async () => {
  await mkdir(testDir, { recursive: true })
  // A `.js` config in an ESM package is the case Node's own `import()` would cache.
  await writeFile(path.join(testDir, 'package.json'), '{ "type": "module" }\n')
  await writeFile(tsConfigPath, "export default { name: 'loaded' }\n")
  await writeFile(namedExportPath, "export const value = 42\nexport default 'fallback'\n")
})

afterAll(async () => {
  await rm(testDir, { recursive: true, force: true })
})

describe('loadModule', () => {
  test('returns the default export when default is set, and the namespace otherwise', async () => {
    expect(await loadModule(tsConfigPath, { default: true })).toStrictEqual({ name: 'loaded' })
    expect(await loadModule(namedExportPath)).toMatchObject({ value: 42, default: 'fallback' })
  })

  test.each(['js', 'mjs', 'cjs', 'ts'])('picks up an edit to a .%s config on the next load', async (extension) => {
    const filePath = path.join(testDir, `reload.config.${extension}`)
    const source = (name: string) => (extension === 'cjs' ? `module.exports = { name: '${name}' }\n` : `export default { name: '${name}' }\n`)

    await writeFile(filePath, source('before'))
    expect(await loadModule(filePath, { default: true })).toStrictEqual({ name: 'before' })

    await writeFile(filePath, source('after'))
    expect(await loadModule(filePath, { default: true })).toStrictEqual({ name: 'after' })
  })

  test('picks up an edit to a TypeScript file the config imports', async () => {
    const helperPath = path.join(testDir, 'helper.ts')
    const filePath = path.join(testDir, 'imports.config.js')

    await writeFile(helperPath, `export const name = 'before'\n`)
    await writeFile(filePath, `import { name } from './helper.ts'\n\nexport default { name }\n`)
    expect(await loadModule(filePath, { default: true })).toStrictEqual({ name: 'before' })

    await writeFile(helperPath, `export const name = 'after'\n`)
    expect(await loadModule(filePath, { default: true })).toStrictEqual({ name: 'after' })
  })
})
