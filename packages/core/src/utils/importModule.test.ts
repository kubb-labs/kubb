import { importModule, normalizeDirectory } from './importModule.ts'

describe('importModule', () => {
  test('normalizeDirectory', () => {
    expect(normalizeDirectory('/user/nzakas/foo')).toBe('/user/nzakas/foo/')
    expect(normalizeDirectory('/user/nzakas/foo/')).toBe('/user/nzakas/foo/')
  })
  test('it should find mocks/noop.js file with default cwd', async () => {
    const module = await importModule('./mocks/noop.js', __dirname)

    expect(module.noop()).toBe('js-noop')
  })
})
