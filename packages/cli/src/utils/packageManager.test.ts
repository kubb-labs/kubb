import fs from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hasPackageJson } from './packageManager.ts'

// Mock the fs module
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  },
}))

describe('packageManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('hasPackageJson', () => {
    it('should return true when package.json exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)

      expect(hasPackageJson('/test/dir')).toBe(true)
    })

    it('should return false when package.json does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)

      expect(hasPackageJson('/test/dir')).toBe(false)
    })
  })
})
