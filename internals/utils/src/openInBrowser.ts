import path from 'node:path'
import process from 'node:process'
import { x } from 'tinyexec'
import { isCIEnvironment } from './isCIEnvironment.ts'

const ignore = () => {}

/**
 * Opens an `http:` or `https:` URL, or an absolute local file path, in the default browser, unless
 * running in CI. Any other target is ignored, so a URL from a server cannot open another scheme or
 * reach a shell.
 */
export function openInBrowser(target: string): void {
  if (isCIEnvironment()) return
  if (!/^https?:\/\//i.test(target) && !path.isAbsolute(target)) return

  if (process.platform === 'win32') {
    // `cmd /c start` would read `&` in a query string as a command separator; rundll32 takes the target as one argument.
    x('rundll32', ['url.dll,FileProtocolHandler', target]).then(ignore, ignore)
    return
  }
  x(process.platform === 'darwin' ? 'open' : 'xdg-open', [target]).then(ignore, ignore)
}
