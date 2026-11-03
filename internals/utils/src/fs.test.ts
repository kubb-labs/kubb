import { mkdir, rm, symlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it, test } from 'vitest'
import { exists, isPathInside, listFiles, read, toPosixPath, write, writeRaw } from './fs.ts'

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

    expect(await read(rwFilePath)).toBe(`${text}\n`)
  })

  test('write ends the file with a single newline, like prettier and oxfmt do', async () => {
    await write(rwFilePath, `export const hallo = 'world'\n\n`)

    expect(await read(rwFilePath)).toBe(`export const hallo = 'world'\n`)
  })

  test('write does not rewrite a file a formatter already ended with a newline', async () => {
    const text = `export const hallo = 'world'`
    await writeFile(rwFilePath, `${text}\n`, { encoding: 'utf-8' })

    expect(await write(rwFilePath, text)).toBeNull()
    expect(await read(rwFilePath)).toBe(`${text}\n`)
  })

  test('write does not rewrite a file left without a trailing newline', async () => {
    const text = `export const hallo = 'world'`
    await writeFile(rwFilePath, text, { encoding: 'utf-8' })

    expect(await write(rwFilePath, text)).toBeNull()
  })

  test('write rewrites when the content changed, not just its trailing whitespace', async () => {
    await writeFile(rwFilePath, `export const hallo = 'world'\n`, { encoding: 'utf-8' })

    expect(await write(rwFilePath, `export const hallo = 'moon'`)).toBe(`export const hallo = 'moon'\n`)
  })

  test('write creates a missing directory, and recreates one that disappeared', async () => {
    const nested = path.join(rwTestDir, 'nested', 'deep', 'file.ts')
    await write(nested, 'const a = 1')
    await rm(path.join(rwTestDir, 'nested'), { recursive: true, force: true })

    await write(nested, 'const a = 1')

    expect(await read(nested)).toBe('const a = 1\n')
  })

  it('write returns undefined for empty/whitespace data', async () => {
    expect(await write(rwFilePath, '   ')).toBeNull()
  })

  it('write performs sanity check when enabled', async () => {
    const text = `export const hallo = 'world with sanity'`

    expect(await write(rwFilePath, text, { sanity: true })).toBe(`${text}\n`)
  })
})

describe('listFiles', () => {
  const directory = path.join(os.tmpdir(), 'kubb-test-list-files')
  afterAll(async () => {
    await rm(directory, { recursive: true, force: true })
  })

  test('returns relative file paths and excludes directories, hidden files, and symlinks', async () => {
    await writeRaw(path.join(directory, 'nested', 'output.ts'), '')
    await writeRaw(path.join(directory, '.hidden'), 'hidden')
    await mkdir(path.join(directory, 'empty'))
    await symlink(path.join(directory, 'nested', 'output.ts'), path.join(directory, 'link.ts'))
    const files = await Array.fromAsync(listFiles(directory))
    expect(files.toSorted()).toStrictEqual(['nested/output.ts'])
  })
})

describe('toPosixPath', () => {
  it('converts backslash separators to forward slashes', () => {
    expect(toPosixPath('C:\\repo\\src\\gen\\types\\pet.ts')).toBe('C:/repo/src/gen/types/pet.ts')
  })
})

describe('isPathInside', () => {
  it('returns true for a nested path', () => {
    expect(isPathInside('/repo/src/gen', '/repo')).toBe(true)
  })

  it('returns true when both paths are the same', () => {
    expect(isPathInside('/repo', '/repo')).toBe(true)
  })

  it('returns false when the parent is nested inside the path', () => {
    expect(isPathInside('/repo', '/repo/src/gen')).toBe(false)
  })

  it('returns false for a sibling path', () => {
    expect(isPathInside('/repo/other', '/repo/gen')).toBe(false)
  })

  it('returns false when the path escapes the parent', () => {
    expect(isPathInside('../other', '.')).toBe(false)
  })

  it('resolves relative and dot inputs before comparing', () => {
    expect(isPathInside('./src/gen', '.')).toBe(true)
    expect(isPathInside('.', './src/gen')).toBe(false)
  })
})
