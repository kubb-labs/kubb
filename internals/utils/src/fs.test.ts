import { mkdir, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it, test } from 'vitest'
import { clean, exists, existsSync, getRelativePath, read, readSync, write } from './fs.ts'

const existsTestDir = path.join(os.tmpdir(), 'kubb-test-exists')
const existsTestFile = path.join(existsTestDir, 'test.txt')

describe('exists', () => {
  beforeAll(async () => {
    await mkdir(existsTestDir, { recursive: true })
    await write(existsTestFile, 'test content')
  })

  afterAll(async () => {
    await rm(existsTestDir, { recursive: true, force: true })
  })

  it('should return true for existing file', async () => {
    expect(await exists(existsTestFile)).toBe(true)
  })

  it('should return false for non-existing file', async () => {
    expect(await exists(path.join(existsTestDir, 'nonexistent.txt'))).toBe(false)
  })

  it('should return true for existing directory', async () => {
    expect(await exists(existsTestDir)).toBe(true)
  })

  test('existsSync returns true for existing file', () => {
    expect(existsSync(existsTestFile)).toBe(true)
  })

  test('existsSync returns false for non-existing file', () => {
    expect(existsSync(path.join(existsTestDir, 'nonexistent.txt'))).toBe(false)
  })
})

const rwTestDir = path.join(os.tmpdir(), 'kubb-test-read-write')
const rwFilePath = path.join(rwTestDir, 'helloWorld.js')

describe('read / write', () => {
  beforeAll(async () => {
    await mkdir(rwTestDir, { recursive: true })
  })

  afterAll(async () => {
    await rm(rwTestDir, { recursive: true, force: true })
  })

  test('write creates a file and read returns its content', async () => {
    const text = `export const hallo = 'world'`
    await write(rwFilePath, text)
    expect(await read(rwFilePath)).toBe(text)
  })

  test('readSync reads file synchronously', async () => {
    const text = `export const hallo = 'world sync'`
    await write(rwFilePath, text)
    expect(readSync(rwFilePath)).toBe(text)
  })

  test('write does not rewrite when content is identical', async () => {
    const text = `export const hallo = 'world'`
    await write(rwFilePath, text)
    const result = await write(rwFilePath, text)
    expect(result).toBeUndefined()
  })

  it('write returns undefined for empty/whitespace data', async () => {
    expect(await write(rwFilePath, '   ')).toBeUndefined()
  })

  it('write performs sanity check when enabled', async () => {
    const text = `export const hallo = 'world with sanity'`
    expect(await write(rwFilePath, text, { sanity: true })).toBe(text)
  })

  it('write trims data before saving', async () => {
    const text = `  export const hallo = 'world'  `
    await write(rwFilePath, text)
    expect(await read(rwFilePath)).toBe(text.trim())
  })
})

describe('clean', () => {
  const cleanDir = path.join(os.tmpdir(), 'kubb-test-clean')

  it('removes directory recursively', async () => {
    await mkdir(cleanDir, { recursive: true })
    await write(path.join(cleanDir, 'file.ts'), 'export {}')
    await clean(cleanDir)
    expect(await exists(cleanDir)).toBe(false)
  })

  it('does not throw when path does not exist', async () => {
    await expect(clean(path.join(os.tmpdir(), 'kubb-does-not-exist'))).resolves.not.toThrow()
  })
})

describe('getRelativePath', () => {
  const relTestDir = path.join(os.tmpdir(), 'kubb-test-rel')
  const folderPath = path.join(relTestDir, 'folder')

  beforeAll(async () => {
    await mkdir(relTestDir, { recursive: true })
  })

  afterAll(async () => {
    await rm(relTestDir, { recursive: true, force: true })
  })

  test('returns correct relative path (POSIX)', async () => {
    const testFile = path.join(folderPath, 'test.js')
    await write(testFile, 'test')
    expect(getRelativePath(relTestDir, testFile)).toBe('./folder/test.js')
    expect(getRelativePath(folderPath, relTestDir)).toBe('./..')
    await clean(testFile)
  })

  test('returns correct relative path for Windows-style paths', () => {
    const winMocks = 'C:\\Users\\user\\project\\mocks'
    const winFolder = 'C:\\Users\\user\\project\\mocks\\folder'
    const winFile = 'C:\\Users\\user\\project\\mocks\\folder\\test.js'
    expect(getRelativePath(winMocks, winFile)).toBe('./folder/test.js')
    expect(getRelativePath(winFolder, winMocks)).toBe('./..')
    expect(getRelativePath(winMocks, winFolder)).toBe('./folder')
    expect(getRelativePath('C:/Users/user/project/mocks', 'C:\\Users\\user\\project\\mocks\\folder\\test.js')).toBe('./folder/test.js')
  })

  test('throws when arguments are missing', () => {
    expect(() => getRelativePath(null, null)).toThrow()
  })
})
