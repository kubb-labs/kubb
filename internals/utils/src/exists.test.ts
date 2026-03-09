import { mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it, test } from 'vitest'
import { exists, existsSync } from './exists.ts'

const testDir = path.join(os.tmpdir(), 'kubb-test-exists')
const testFile = path.join(testDir, 'test.txt')

describe('exists', () => {
  beforeAll(async () => {
    await mkdir(testDir, { recursive: true })
    await writeFile(testFile, 'test content')
  })

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  it('should return true for existing file', async () => {
    const result = await exists(testFile)
    expect(result).toBe(true)
  })

  it('should return false for non-existing file', async () => {
    const result = await exists(path.join(testDir, 'nonexistent.txt'))
    expect(result).toBe(false)
  })

  it('should return true for existing directory', async () => {
    const result = await exists(testDir)
    expect(result).toBe(true)
  })

  test('existsSync should return true for existing file', () => {
    const result = existsSync(testFile)
    expect(result).toBe(true)
  })

  test('existsSync should return false for non-existing file', () => {
    const result = existsSync(path.join(testDir, 'nonexistent.txt'))
    expect(result).toBe(false)
  })
})
