import { spawn } from 'node:child_process'
import process from 'node:process'
import { isCIEnvironment } from './isCIEnvironment.ts'

const COMMANDS: Partial<Record<NodeJS.Platform, [string, ...Array<string>]>> = {
  darwin: ['pbcopy'],
  win32: ['clip.exe'],
  linux: ['xclip', '-selection', 'clipboard'],
}

/**
 * Copies text to the system clipboard with the platform's own tool. Resolves `false` in CI, on a
 * platform without a known tool, or when the tool is missing or fails.
 */
export function copyToClipboard(text: string): Promise<boolean> {
  const command = COMMANDS[process.platform]
  if (!command || isCIEnvironment()) return Promise.resolve(false)

  const [name, ...args] = command
  return new Promise((resolve) => {
    const child = spawn(name, args, { stdio: ['pipe', 'ignore', 'ignore'], timeout: 2_000 })
    child.once('error', () => resolve(false))
    child.once('close', (code) => resolve(code === 0))
    // A missing tool closes stdin before the write lands; the `error` event above reports it.
    child.stdin.once('error', () => {})
    child.stdin.end(text)
  })
}
