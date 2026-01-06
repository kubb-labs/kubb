import { beforeEach, describe, expect, it, vi } from 'vitest'
import { detectLinter } from './detectLinter.ts'

// Mock execa
vi.mock('execa', () => ({
  execaCommand: vi.fn(),
}))

describe('detectLinter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should detect biome when available', async () => {
    const { execaCommand } = await import('execa')
    vi.mocked(execaCommand).mockImplementation(async (command: string) => {
      if (command === 'biome --version') {
        return {} as any
      }
      throw new Error('Command not found')
    })

    const result = await detectLinter()
    expect(result).toBe('biome')
  })

  it('should detect oxlint when biome is not available', async () => {
    const { execaCommand } = await import('execa')
    vi.mocked(execaCommand).mockImplementation(async (command: string) => {
      if (command === 'oxlint --version') {
        return {} as any
      }
      throw new Error('Command not found')
    })

    const result = await detectLinter()
    expect(result).toBe('oxlint')
  })

  it('should detect eslint when biome and oxlint are not available', async () => {
    const { execaCommand } = await import('execa')
    vi.mocked(execaCommand).mockImplementation(async (command: string) => {
      if (command === 'eslint --version') {
        return {} as any
      }
      throw new Error('Command not found')
    })

    const result = await detectLinter()
    expect(result).toBe('eslint')
  })

  it('should return undefined when no linter is available', async () => {
    const { execaCommand } = await import('execa')
    vi.mocked(execaCommand).mockImplementation(async () => {
      throw new Error('Command not found')
    })

    const result = await detectLinter()
    expect(result).toBeUndefined()
  })

  it('should prioritize biome over other linters', async () => {
    const { execaCommand } = await import('execa')
    // All linters are available
    vi.mocked(execaCommand).mockResolvedValue({} as any)

    const result = await detectLinter()
    expect(result).toBe('biome')
    expect(execaCommand).toHaveBeenCalledWith('biome --version', { stdio: 'ignore' })
  })
})
