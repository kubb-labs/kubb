import process from 'node:process'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { openInBrowser } from './openInBrowser.ts'

const { x } = vi.hoisted(() => ({ x: vi.fn(() => Promise.resolve()) }))
vi.mock('tinyexec', () => ({ x }))
vi.mock('./isCIEnvironment.ts', () => ({ isCIEnvironment: () => false }))

const platform = Object.getOwnPropertyDescriptor(process, 'platform')!
const setPlatform = (value: NodeJS.Platform) => Object.defineProperty(process, 'platform', { value })

afterEach(() => {
  Object.defineProperty(process, 'platform', platform)
  x.mockClear()
})

describe('openInBrowser', () => {
  it('passes a URL with & to rundll32 as one argument on Windows, without cmd', () => {
    setPlatform('win32')
    openInBrowser('https://studio.kubb.dev/device?code=AB&x=1')

    expect(x).toHaveBeenCalledWith('rundll32', ['url.dll,FileProtocolHandler', 'https://studio.kubb.dev/device?code=AB&x=1'])
  })

  it('opens an absolute report path', () => {
    setPlatform('linux')
    openInBrowser('/tmp/kubb/report.html')

    expect(x).toHaveBeenCalledWith('xdg-open', ['/tmp/kubb/report.html'])
  })

  it.each(['file:///etc/passwd', 'javascript:alert(1)', 'ms-settings:', 'relative/report.html'])('ignores %s', (target) => {
    setPlatform('darwin')
    openInBrowser(target)

    expect(x).not.toHaveBeenCalled()
  })
})
