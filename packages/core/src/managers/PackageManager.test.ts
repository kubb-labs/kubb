import { PackageManager } from './PackageManager.ts'

describe('getPackageJSON', () => {
  const manager = new PackageManager()
  test('if package.json data is returned', async () => {
    const packageJSON = await manager.getPackageJSON()

    expect(packageJSON).toBeDefined()
  })

  test('if version out of package.json data is returned', async () => {
    const version = await manager.getVersion('typescript')

    expect(version).toBe('~5.2.2')
  })

  test('if compared version is correct', async () => {
    const isValid = await manager.isValid('typescript', '>=5')

    expect(isValid).toBeTruthy()
  })
})
