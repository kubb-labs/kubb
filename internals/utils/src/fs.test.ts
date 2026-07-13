import { mkdir, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it, test } from 'vitest'
import { camelCase, pascalCase } from './casing.ts'
import { clean, exists, isPathInside, read, toFilePath, toPosixPath, trimExtName, write } from './fs.ts'

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

  test('write does not rewrite when content is identical', async () => {
    const text = `export const hallo = 'world'`
    await write(rwFilePath, text)
    const result = await write(rwFilePath, text)

    expect(result).toBeNull()
  })

  it('write returns undefined for empty/whitespace data', async () => {
    expect(await write(rwFilePath, '   ')).toBeNull()
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

describe('toPosixPath', () => {
  it('returns POSIX paths unchanged', () => {
    expect(toPosixPath('/repo/src/gen/types/pet.ts')).toBe('/repo/src/gen/types/pet.ts')
  })

  it('converts backslash separators to forward slashes', () => {
    expect(toPosixPath('C:\\repo\\src\\gen\\types\\pet.ts')).toBe('C:/repo/src/gen/types/pet.ts')
  })

  it('handles mixed separators', () => {
    expect(toPosixPath('C:\\repo/src\\gen/types\\pet.ts')).toBe('C:/repo/src/gen/types/pet.ts')
  })

  it('returns the empty string unchanged', () => {
    expect(toPosixPath('')).toBe('')
  })
})

describe('trimExtName', () => {
  test('strips .ts extension', () => {
    expect(trimExtName('petStore.ts')).toBe('petStore')
  })

  test('strips extension from a full path', () => {
    expect(trimExtName('/src/models/pet.ts')).toBe('/src/models/pet')
  })

  test('does not strip the dot from a directory segment', () => {
    expect(trimExtName('/project.v2/gen/pet.ts')).toBe('/project.v2/gen/pet')
  })

  test('returns the input unchanged when there is no extension', () => {
    expect(trimExtName('noExtension')).toBe('noExtension')
  })

  test('strips .json extension', () => {
    expect(trimExtName('schema.json')).toBe('schema')
  })

  test('strips double extension (.d.ts)', () => {
    expect(trimExtName('types.d.ts')).toBe('types.d')
  })
})

describe('toFilePath', () => {
  test.each([
    // version numbers (dot before a digit) stay in one segment
    ['get_enterprise_configurations_id_v2025.0', 'getEnterpriseConfigurationsIdV20250'],
    ['some_operation_v3.14', 'someOperationV314'],
    ['version.1.2.3', 'version123'],
    // dots before a letter split into nested path segments
    ['pet.petId', 'pet/petId'],
    ['pet.Pet', 'pet/pet'],
    ['api.v2', 'api/v2'],
    // Security: leading dots must NOT produce a leading slash (path traversal guard)
    ['..Schema', 'schema'],
    ['...Schema', 'schema'],
    ['.Internal', 'internal'],
  ])('toFilePath(%s) -> %s (camelCase segments)', (input, expected) => {
    expect(toFilePath(input)).toBe(expected)
  })

  test('cases the last segment with the provided caser', () => {
    expect(toFilePath('pet.petId', pascalCase)).toBe('pet/PetId')
    expect(toFilePath('pet.Pet', pascalCase)).toBe('pet/Pet')
  })

  test('applies prefix and suffix to the last segment only', () => {
    expect(toFilePath('create tag.tag', (part) => camelCase(part, { prefix: 'create' }))).toBe('createTag/createTag')
    expect(toFilePath('tag.tag', (part) => camelCase(part, { suffix: 'schema' }))).toBe('tag/tagSchema')
  })
})
