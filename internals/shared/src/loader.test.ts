import { mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { createModuleLoader } from './loader.ts'

const testDir = path.join(os.tmpdir(), 'kubb-test-loader')
const tsConfigPath = path.join(testDir, 'kubb.config.ts')
const namedExportPath = path.join(testDir, 'named.ts')

beforeAll(async () => {
  await mkdir(testDir, { recursive: true })
  await writeFile(tsConfigPath, "export default { name: 'loaded' }\n")
  await writeFile(namedExportPath, "export const value = 42\nexport default 'fallback'\n")
})

afterAll(async () => {
  await rm(testDir, { recursive: true, force: true })
})

describe('createModuleLoader', () => {
  test('returns the default export when default is set', async () => {
    const loader = createModuleLoader()

    expect(await loader.load(tsConfigPath, { default: true })).toStrictEqual({ name: 'loaded' })
  })

  test('returns the namespace when default is not set', async () => {
    const loader = createModuleLoader()

    expect(await loader.load(namedExportPath)).toMatchObject({ value: 42, default: 'fallback' })
  })
})
