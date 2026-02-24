import { execaCommand } from 'execa'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { detectFormatter } from './formatters.ts'

// Mock execa
vi.mock('execa', () => ({
  execaCommand: vi.fn(),
}))

describe('detectFormatter', () => {
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

    const result = await detectFormatter()
    expect(result).toBe('biome')
  })

  it('should detect prettier when biome is not available', async () => {
    vi.mocked(execaCommand).mockImplementation((command: string) => {
      if (command === 'prettier --version') {
        return {} as ReturnType<typeof execaCommand>
      }
      throw new Error('Command not found')
    })

    const result = await detectFormatter()
    expect(result).toBe('prettier')
  })

  it('should return undefined when no formatter is available', async () => {
    vi.mocked(execaCommand).mockImplementation(() => {
      throw new Error('Command not found')
    })

    const result = await detectFormatter()
    expect(result).toBeUndefined()
  })

  it('should prioritize biome over prettier', async () => {
    // All formatters are available
    vi.mocked(execaCommand).mockImplementation((_command: string) => {
      return {} as ReturnType<typeof execaCommand>
    })
    const result = await detectFormatter()
    expect(result).toBe('biome')
    expect(execaCommand).toHaveBeenCalledWith('biome --version', { stdio: 'ignore' })
  })
})
