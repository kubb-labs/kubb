import process from 'node:process'
import { x } from 'tinyexec'
import { isCIEnvironment } from './isCIEnvironment.ts'

const COMMANDS: Partial<Record<NodeJS.Platform, [string, ...Array<string>]>> = {
  darwin: ['pbcopy'],
  win32: ['clip.exe'],
  linux: ['xclip', '-selection', 'clipboard'],
}

/** Wayland sessions have no X selection for xclip to serve, so they use `wl-copy`. */
function commandFor(platform: NodeJS.Platform): [string, ...Array<string>] | undefined {
  return platform === 'linux' && process.env.WAYLAND_DISPLAY ? ['wl-copy'] : COMMANDS[platform]
}

/**
 * Copies text to the system clipboard with the platform's own tool. Resolves `false` in CI, on a
 * platform without a known tool, or when the tool is missing or fails.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  const command = commandFor(process.platform)
  if (!command || isCIEnvironment()) return false

  const [name, ...args] = command
  // stdout and stderr are ignored: xclip and wl-copy stay alive to serve the selection and would hold open pipes until the timeout.
  const run = x(name, args, { timeout: 2_000, nodeOptions: { stdio: ['pipe', 'ignore', 'ignore'] } })
  // A missing tool closes stdin before the write lands; the rejection below reports it.
  run.process?.stdin?.once('error', () => {})
  run.process?.stdin?.end(text)

  return run.then(
    ({ exitCode }) => exitCode === 0,
    () => false,
  )
}
