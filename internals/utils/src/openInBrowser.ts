import process from 'node:process'
import { x } from 'tinyexec'
import { isCIEnvironment } from './isCIEnvironment.ts'

const ignore = () => {}

/**
 * Opens a URL or local file in the default browser, unless running in CI.
 */
export function openInBrowser(target: string): void {
  if (isCIEnvironment()) return

  if (process.platform === 'win32') {
    x('cmd', ['/c', 'start', '', target]).then(ignore, ignore)
    return
  }
  x(process.platform === 'darwin' ? 'open' : 'xdg-open', [target]).then(ignore, ignore)
}
