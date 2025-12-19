import os from 'node:os'
import path from 'node:path'
import fs from 'fs-extra'

import { exists, existsSync } from './exists.ts'

const testDir = path.join(os.tmpdir(), 'kubb-test-exists')
const testFile = path.join(testDir, 'test.txt')

describe('exists', () => {
  beforeAll(async () => {
    await fs.ensureDir(testDir)
    await fs.writeFile(testFile, 'test content')
  })

  afterAll(async () => {
    await fs.remove(testDir)
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
