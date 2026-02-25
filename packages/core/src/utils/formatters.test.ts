import { x } from 'tinyexec'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { detectFormatter } from './formatters.ts'

// Mock tinyexec
vi.mock('tinyexec', () => ({
  x: vi.fn(),
}))

describe('detectFormatter', () => {
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

    const result = await detectFormatter()
    expect(result).toBe('biome')
  })

  it('should detect prettier when biome is not available', async () => {
    vi.mocked(x).mockImplementation((command: string) => {
      if (command === 'prettier') {
        return {} as ReturnType<typeof x>
      }
      throw new Error('Command not found')
    })

    const result = await detectFormatter()
    expect(result).toBe('prettier')
  })

  it('should return undefined when no formatter is available', async () => {
    vi.mocked(x).mockImplementation(() => {
      throw new Error('Command not found')
    })

    const result = await detectFormatter()
    expect(result).toBeUndefined()
  })

  it('should prioritize biome over prettier', async () => {
    // All formatters are available
    vi.mocked(x).mockImplementation((_command: string) => {
      return {} as ReturnType<typeof x>
    })
    const result = await detectFormatter()
    expect(result).toBe('biome')
    expect(x).toHaveBeenCalledWith('biome', ['--version'], { nodeOptions: { stdio: 'ignore' } })
  })
})
