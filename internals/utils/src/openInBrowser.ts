import { execFile } from 'node:child_process'
import process from 'node:process'
import { isCIEnvironment } from './isCIEnvironment.ts'

/**
 * Opens a URL or local file in the default browser, unless running in CI.
 */
export function openInBrowser(target: string): void {
  if (isCIEnvironment()) return

  if (process.platform === 'win32') {
    execFile('cmd', ['/c', 'start', '', target], () => {})
  } else {
    execFile(process.platform === 'darwin' ? 'open' : 'xdg-open', [target], () => {})
  }
}
