import fs from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { detectPackageManager, hasPackageJson } from './packageManager.ts'

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

  describe('detectPackageManager', () => {
    it('should default to npm when no lock files or package.json found', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)

      const pm = detectPackageManager('/tmp/non-existent-dir')

      expect(pm.name).toBe('npm')
      expect(pm.lockFile).toBe('package-lock.json')
      expect(pm.installCommand).toEqual(['install', '--save-dev'])
    })

    it.each([
      ['pnpm', 'pnpm-lock.yaml', ['add', '-D']],
      ['yarn', 'yarn.lock', ['add', '-D']],
      ['bun', 'bun.lockb', ['add', '-d']],
      ['npm', 'package-lock.json', ['install', '--save-dev']],
    ])('should detect %s from %s', (name, lockFile, installCommand) => {
      vi.mocked(fs.existsSync).mockImplementation((filePath) => {
        return filePath.toString().endsWith(lockFile)
      })

      const pm = detectPackageManager('/test/dir')

      expect(pm.name).toBe(name)
      expect(pm.lockFile).toBe(lockFile)
      expect(pm.installCommand).toEqual(installCommand)
    })

    it('should detect package manager from package.json packageManager field', () => {
      vi.mocked(fs.existsSync).mockImplementation((filePath) => {
        return filePath.toString().endsWith('package.json')
      })

      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify({
          name: 'test-project',
          packageManager: 'pnpm@9.0.0',
        }),
      )

      const pm = detectPackageManager('/test/dir')

      expect(pm.name).toBe('pnpm')
    })

    it('should prioritize package.json packageManager field over lock files', () => {
      vi.mocked(fs.existsSync).mockImplementation((filePath) => {
        const pathStr = filePath.toString()
        return pathStr.endsWith('package.json') || pathStr.endsWith('yarn.lock')
      })

      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify({
          packageManager: 'pnpm@9.0.0',
        }),
      )

      const pm = detectPackageManager('/test/dir')

      expect(pm.name).toBe('pnpm')
    })

    it('should fallback to lock file detection when package.json is invalid', () => {
      vi.mocked(fs.existsSync).mockImplementation((filePath) => {
        const pathStr = filePath.toString()
        return pathStr.endsWith('package.json') || pathStr.endsWith('pnpm-lock.yaml')
      })

      vi.mocked(fs.readFileSync).mockReturnValue('{ invalid json')

      const pm = detectPackageManager('/test/dir')

      expect(pm.name).toBe('pnpm')
    })
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
