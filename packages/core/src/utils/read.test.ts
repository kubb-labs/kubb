import path from 'node:path'

import { clean } from './clean.ts'
import { getPathMode, getRelativePath, read } from './read.ts'
import { write } from './write.ts'

describe('read', () => {
  const mocksPath = path.resolve(__dirname, '../../mocks')
  const filePath = path.resolve(mocksPath, './hellowWorld.js')
  const folderPath = path.resolve(mocksPath, './folder')

  afterEach(async () => {
    await clean(filePath)
    await clean(folderPath)
  })

  test('if getPathMode returns correct PathMode(file or directory)', async () => {
    expect(getPathMode(filePath)).toBe('file')
    expect(getPathMode(folderPath)).toBe('directory')
    expect(getPathMode(undefined)).toBe('directory')
    expect(getPathMode(null)).toBe('directory')
  })

  test('read filePath', async () => {
    const text = `export const hallo = 'world';`

    await write(text, filePath)

    const file = await read(filePath)

    expect(file).toBeDefined()
    expect(file).toBe(text)
  })

  test('getRelativePath returns correct path for Linux and macOS', async () => {
    const testFile = path.resolve(folderPath, 'test.js')
    await write('test', testFile)

    expect(getRelativePath(mocksPath, testFile)).toBe('./folder/test')

    expect(getRelativePath(folderPath, mocksPath)).toBe('./..')

    try {
      getRelativePath(null, null)
    } catch (e) {
      expect(e).toBeDefined()
    }

    await clean(testFile)
  })
  test('getRelativePath returns correct path for Windows', async () => {
    const testFile = path.resolve(folderPath, 'test.js')
    await write('test', testFile)

    expect(getRelativePath(mocksPath, testFile, 'windows')).toBe('./folder/test')
    expect(getRelativePath(folderPath, mocksPath, 'windows')).toBe('./..')

    try {
      getRelativePath(null, null)
    } catch (e) {
      expect(e).toBeDefined()
    }

    await clean(testFile)
  })
})
