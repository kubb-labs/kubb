import { x } from 'tinyexec'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { detectLinter } from './linters.ts'

// Mock tinyexec
vi.mock('tinyexec', () => ({
  x: vi.fn(),
}))

describe('detectLinter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should detect biome when available', async () => {
    vi.mocked(x).mockImplementation((command: string) => {
      if (command === 'biome') {
        return {} as ReturnType<typeof x>
      }
      throw new Error('Command not found')
    })

    const result = await detectLinter()
    expect(result).toBe('biome')
  })

  it('should detect oxlint when biome is not available', async () => {
    vi.mocked(x).mockImplementation((command: string) => {
      if (command === 'oxlint') {
        return {} as ReturnType<typeof x>
      }
      throw new Error('Command not found')
    })

    const result = await detectLinter()
    expect(result).toBe('oxlint')
  })

  it('should detect eslint when biome and oxlint are not available', async () => {
    vi.mocked(x).mockImplementation((command: string) => {
      if (command === 'eslint') {
        return {} as ReturnType<typeof x>
      }
      throw new Error('Command not found')
    })

    const result = await detectLinter()
    expect(result).toBe('eslint')
  })

  it('should return undefined when no linter is available', async () => {
    vi.mocked(x).mockImplementation(() => {
      throw new Error('Command not found')
    })

    const result = await detectLinter()
    expect(result).toBeUndefined()
  })

  it('should prioritize biome over other linters', async () => {
    // All linters are available
    vi.mocked(x).mockImplementation((_command: string) => {
      return {} as ReturnType<typeof x>
    })

    const result = await detectLinter()
    expect(result).toBe('biome')
    expect(x).toHaveBeenCalledWith('biome', ['--version'], { nodeOptions: { stdio: 'ignore' } })
  })
})
