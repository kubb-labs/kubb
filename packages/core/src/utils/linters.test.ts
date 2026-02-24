import { execaCommand } from 'execa'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { detectLinter } from './linters.ts'

// Mock execa
vi.mock('execa', () => ({
  execaCommand: vi.fn(),
}))

describe('detectLinter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should detect biome when available', async () => {
    vi.mocked(execaCommand).mockImplementation((command: string) => {
      if (command === 'biome --version') {
        return {} as ReturnType<typeof execaCommand>
      }
      throw new Error('Command not found')
    })

    const result = await detectLinter()
    expect(result).toBe('biome')
  })

  it('should detect oxlint when biome is not available', async () => {
    vi.mocked(execaCommand).mockImplementation((command: string) => {
      if (command === 'oxlint --version') {
        return {} as ReturnType<typeof execaCommand>
      }
      throw new Error('Command not found')
    })

    const result = await detectLinter()
    expect(result).toBe('oxlint')
  })

  it('should detect eslint when biome and oxlint are not available', async () => {
    vi.mocked(execaCommand).mockImplementation((command: string) => {
      if (command === 'eslint --version') {
        return {} as ReturnType<typeof execaCommand>
      }
      throw new Error('Command not found')
    })

    const result = await detectLinter()
    expect(result).toBe('eslint')
  })

  it('should return undefined when no linter is available', async () => {
    vi.mocked(execaCommand).mockImplementation(() => {
      throw new Error('Command not found')
    })

    const result = await detectLinter()
    expect(result).toBeUndefined()
  })

  it('should prioritize biome over other linters', async () => {
    // All linters are available
    vi.mocked(execaCommand).mockImplementation((_command: string) => {
      return {} as ReturnType<typeof execaCommand>
    })

    const result = await detectLinter()
    expect(result).toBe('biome')
    expect(execaCommand).toHaveBeenCalledWith('biome --version', { stdio: 'ignore' })
  })
})
