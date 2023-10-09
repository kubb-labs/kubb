import path from 'node:path'

import { importModule, normalizeDirectory } from './importModule.ts'

describe('importModule', () => {
  test('normalizeDirectory', () => {
    expect(normalizeDirectory('/user/nzakas/foo')).toBe('/user/nzakas/foo/')
    expect(normalizeDirectory('/user/nzakas/foo/')).toBe('/user/nzakas/foo/')
  })
  test('it should find mocks/noop.js file with default cwd and ESM', async () => {
    const module = await importModule(path.join(__dirname, './mocks/noop.js'), __dirname)

    const fn = module?.noop ? module.noop : module

    expect(fn?.()).toBe('js-noop')
  })

  test('it should find mocks/noop.js file with default cwd and CJS', async () => {
    const module = await importModule(path.join(__dirname, './mocks/noop.cjs'), __dirname)

    const fn = module?.noop ? module.noop : module

    expect(fn?.()).toBe('cjs-noop')
  })
})
