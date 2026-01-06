import { execaCommand } from 'execa'
import type { ExecaReturnValue } from 'execa'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { detectFormatter } from './detectFormatter.ts'

// Mock execa
vi.mock('execa', () => ({
  execaCommand: vi.fn(),
}))

describe('detectFormatter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should detect biome when available', async () => {
    vi.mocked(execaCommand).mockImplementation(async (command: string) => {
      if (command === 'biome --version') {
        return {} as ExecaReturnValue
      }
      throw new Error('Command not found')
    })

    const result = await detectFormatter()
    expect(result).toBe('biome')
  })

  it('should detect prettier when biome is not available', async () => {
    vi.mocked(execaCommand).mockImplementation(async (command: string) => {
      if (command === 'prettier --version') {
        return {} as ExecaReturnValue
      }
      throw new Error('Command not found')
    })

    const result = await detectFormatter()
    expect(result).toBe('prettier')
  })

  it('should return undefined when no formatter is available', async () => {
    vi.mocked(execaCommand).mockImplementation(async () => {
      throw new Error('Command not found')
    })

    const result = await detectFormatter()
    expect(result).toBeUndefined()
  })

  it('should prioritize biome over prettier', async () => {
    // All formatters are available
    vi.mocked(execaCommand).mockResolvedValue({} as ExecaReturnValue)

    const result = await detectFormatter()
    expect(result).toBe('biome')
    expect(execaCommand).toHaveBeenCalledWith('biome --version', { stdio: 'ignore' })
  })
})
