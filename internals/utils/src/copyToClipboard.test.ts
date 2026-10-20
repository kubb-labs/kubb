import { PassThrough } from 'node:stream'
import { x } from 'tinyexec'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyToClipboard } from './copyToClipboard.ts'
import { isCIEnvironment } from './isCIEnvironment.ts'

vi.mock('tinyexec', () => ({ x: vi.fn() }))
vi.mock('./isCIEnvironment.ts', () => ({ isCIEnvironment: vi.fn() }))

function mockChild(outcome: { code?: number; error?: Error }) {
  const stdin = new PassThrough()
  const received: Array<string> = []
  stdin.on('data', (chunk: Buffer) => received.push(chunk.toString()))
  const finished = new Promise<{ exitCode: number | undefined }>((resolve, reject) =>
    stdin.on('finish', () => (outcome.error ? reject(outcome.error) : resolve({ exitCode: outcome.code }))),
  )
  vi.mocked(x).mockReturnValue(Object.assign(finished, { process: { stdin } }) as unknown as ReturnType<typeof x>)
  return received
}

afterEach(() => {
  vi.resetAllMocks()
})

describe.skipIf(!['darwin', 'win32', 'linux'].includes(process.platform))('copyToClipboard', () => {
  it('pipes the text to the platform tool with an argument array and resolves true', async () => {
    vi.mocked(isCIEnvironment).mockReturnValue(false)
    const received = mockChild({ code: 0 })

    await expect(copyToClipboard('KUBB-7Q4M')).resolves.toBe(true)
    expect(received.join('')).toBe('KUBB-7Q4M')
    expect(vi.mocked(x).mock.calls[0]?.[1]).toBeInstanceOf(Array)
  })

  it('resolves false when the tool is missing', async () => {
    vi.mocked(isCIEnvironment).mockReturnValue(false)
    mockChild({ error: Object.assign(new Error('spawn xclip ENOENT'), { code: 'ENOENT' }) })

    await expect(copyToClipboard('KUBB-7Q4M')).resolves.toBe(false)
  })

  it('resolves false when the tool fails', async () => {
    vi.mocked(isCIEnvironment).mockReturnValue(false)
    mockChild({ code: 1 })

    await expect(copyToClipboard('KUBB-7Q4M')).resolves.toBe(false)
  })

  it('does not copy in CI', async () => {
    vi.mocked(isCIEnvironment).mockReturnValue(true)

    await expect(copyToClipboard('KUBB-7Q4M')).resolves.toBe(false)
    expect(x).not.toHaveBeenCalled()
  })
})
