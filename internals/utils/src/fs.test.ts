import { mkdir, rm, symlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it, test } from 'vitest'
import { isPathInside, listFiles, read, toPosixPath, write, writeRaw } from './fs.ts'

const rwTestDir = path.join(os.tmpdir(), 'kubb-test-read-write')
const rwFilePath = path.join(rwTestDir, 'helloWorld.js')

describe('read / write', () => {
  beforeAll(async () => {
    await mkdir(rwTestDir, { recursive: true })
  })

  afterAll(async () => {
    await rm(rwTestDir, { recursive: true, force: true })
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
  it('returns false when the path escapes the parent', () => {
    expect(isPathInside('../other', '.')).toBe(false)
    expect(isPathInside('/repo/gen-extra', '/repo/gen')).toBe(false)
  })

  it('resolves relative and dot inputs before comparing', () => {
    expect(isPathInside('./src/gen', '.')).toBe(true)
    expect(isPathInside('.', './src/gen')).toBe(false)
  })
})
