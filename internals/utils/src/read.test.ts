import { mkdir, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { clean } from './clean.ts'
import { getRelativePath } from './fs.ts'
import { read, readSync } from './read.ts'
import { write } from './write.ts'

const testDir = path.join(os.tmpdir(), 'kubb-test-read')
const filePath = path.join(testDir, 'helloWorld.js')
const folderPath = path.join(testDir, 'folder')

describe('read', () => {
  beforeAll(async () => {
    await mkdir(testDir, { recursive: true })
  })

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  test('read filePath', async () => {
    const text = `export const hallo = 'world'`

    await write(filePath, text)

    const file = await read(filePath)

    expect(file).toBeDefined()
    expect(file).toBe(text)
  })

  test('readSync reads file synchronously', async () => {
    const text = `export const hallo = 'world sync'`

    await write(filePath, text)

    const file = readSync(filePath)

    expect(file).toBeDefined()
    expect(file).toBe(text)
  })

  test('getRelativePath returns correct path for Linux and macOS', async () => {
    const testFile = path.join(folderPath, 'test.js')
    await write(testFile, 'test')

    expect(getRelativePath(testDir, testFile)).toBe('./folder/test.js')
    expect(getRelativePath(folderPath, testDir)).toBe('./..')

    try {
      getRelativePath(null, null)
    } catch (error) {
      expect(error).toBeDefined()
    }

    await clean(testFile)
  })

  test('getRelativePath returns correct path for Windows-style paths', () => {
    const winMocks = 'C:\\Users\\user\\project\\mocks'
    const winFolder = 'C:\\Users\\user\\project\\mocks\\folder'
    const winFile = 'C:\\Users\\user\\project\\mocks\\folder\\test.js'

    expect(getRelativePath(winMocks, winFile)).toBe('./folder/test.js')
    expect(getRelativePath(winFolder, winMocks)).toBe('./..')
    expect(getRelativePath(winMocks, winFolder)).toBe('./folder')

    // Mixed separators
    expect(getRelativePath('C:/Users/user/project/mocks', 'C:\\Users\\user\\project\\mocks\\folder\\test.js')).toBe('./folder/test.js')
  })
})
