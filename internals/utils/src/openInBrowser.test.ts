import { x } from 'tinyexec'
import { describe, expect, it, vi } from 'vitest'
import { isCIEnvironment } from './isCIEnvironment.ts'
import { openInBrowser } from './openInBrowser.ts'

vi.mock('tinyexec', () => ({ x: vi.fn(() => Promise.resolve()) }))
vi.mock('./isCIEnvironment.ts', () => ({ isCIEnvironment: vi.fn() }))

describe('openInBrowser', () => {
  it('does not open a browser in CI', () => {
    vi.mocked(isCIEnvironment).mockReturnValue(true)

    openInBrowser('https://kubb.dev')

    expect(x).not.toHaveBeenCalled()
  })

  it('opens the URL with the platform browser command', () => {
    vi.mocked(isCIEnvironment).mockReturnValue(false)

    openInBrowser('https://kubb.dev')

    expect(x).toHaveBeenCalledWith(
      process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open',
      process.platform === 'win32' ? ['/c', 'start', '', 'https://kubb.dev'] : ['https://kubb.dev'],
    )
  })
})
