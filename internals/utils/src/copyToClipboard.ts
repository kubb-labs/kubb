import process from 'node:process'
import { x } from 'tinyexec'
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
export async function copyToClipboard(text: string): Promise<boolean> {
  const command = COMMANDS[process.platform]
  if (!command || isCIEnvironment()) return false

  const [name, ...args] = command
  const run = x(name, args, { timeout: 2_000 })
  // A missing tool closes stdin before the write lands; the rejection below reports it.
  run.process?.stdin?.once('error', () => {})
  run.process?.stdin?.end(text)

  return run.then(
    ({ exitCode }) => exitCode === 0,
    () => false,
  )
}
