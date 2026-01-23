import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { PackageManager } from './PackageManager.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('getPackageJSON', () => {
  const packageManager = new PackageManager()

  test('if package.json data is returned', async () => {
    const packageJSON = await packageManager.getPackageJSON()

    expect(packageJSON).toBeDefined()
  })

  test('if version out of package.json data is returned', async () => {
    const version = await packageManager.getVersion('typescript')

    expect(version?.startsWith('catalog')).toBeTruthy()

    const versionRegex = await packageManager.getVersion('type')

    expect(versionRegex?.startsWith('catalog:')).toBeTruthy()
  })

  test('if compared version is correct', async () => {
    const isValid = await packageManager.isValid('typescript', 'catalog:')

    expect(isValid).toBeTruthy()
  })

  test('normalizeDirectory', () => {
    expect(packageManager.normalizeDirectory('/user/test/foo')).toBe('/user/test/foo/')
    expect(packageManager.normalizeDirectory('/user/test/foo/')).toBe('/user/test/foo/')
  })
  test('it should find mocks/noop.js file with default cwd and ESM', async () => {
    packageManager.workspace = __dirname

    const module = await packageManager.import(path.join(__dirname, '../mocks/noop.js'))

    const fn = module?.noop ? module.noop : module

    expect(fn?.()).toBe('js-noop')
  })

  test('it should find mocks/noop.js file with default cwd and CJS', async () => {
    packageManager.workspace = __dirname

    const module = await packageManager.import(path.join(__dirname, '../mocks/noop.cjs'))

    const fn = module?.noop ? module.noop : module

    expect(fn?.()).toBe('cjs-noop')
  })

  test('if overriding cache with static setVersion works', async () => {
    PackageManager.setVersion('typescript', '^4.1.1')
    expect(await packageManager.isValid('typescript', '>=5')).toBeFalsy()

    PackageManager.setVersion('typescript', '^5.1.1')
    expect(await packageManager.isValid('typescript', '>=5')).toBeTruthy()
  })
})
