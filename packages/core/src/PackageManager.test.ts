import path from 'node:path'

import { PackageManager } from './PackageManager.ts'

describe('getPackageJSON', () => {
  const packageManager = new PackageManager()

  test('if package.json data is returned', async () => {
    const packageJSON = await packageManager.getPackageJSON()

    expect(packageJSON).toBeDefined()
  })

  test('if version out of package.json data is returned', async () => {
    const version = await packageManager.getVersion('typescript')

    expect(version).toBe('^5.3.2')

    const versionRegex = await packageManager.getVersion('typescr')

    expect(versionRegex).toBe('^5.3.2')
  })

  test('if compared version is correct', async () => {
    const isValid = await packageManager.isValid('typescript', '^5.3.2')

    expect(isValid).toBeTruthy()
  })

  test('normalizeDirectory', () => {
    expect(packageManager.normalizeDirectory('/user/nzakas/foo')).toBe('/user/nzakas/foo/')
    expect(packageManager.normalizeDirectory('/user/nzakas/foo/')).toBe('/user/nzakas/foo/')
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
