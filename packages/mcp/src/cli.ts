import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'
import { stripVTControlCharacters } from 'node:util'
import { getErrorMessage } from '@internals/utils'
import { tool } from 'tmcp/utils'

const CLI_PACKAGES = ['@kubb/cli', 'kubb'] as const

// An install can take minutes, but a hung child must not block the MCP server forever.
const TIMEOUT_MS = 10 * 60 * 1000

export type CliResult = {
  /**
   * The exit code, or `null` when a signal ended the run.
   */
  exitCode: number | null
  /**
   * The signal that ended the run, such as `SIGTERM` after the timeout.
   */
  signal: NodeJS.Signals | null
  output: string
}

/**
 * The `kubb` bin script, resolved from the project in `cwd` first so the tools run the project's
 * own Kubb version, then from this package. Returns `undefined` when neither has the CLI installed.
 */
export async function resolveCliBin(cwd: string = process.cwd()): Promise<string | undefined> {
  const requires = [createRequire(path.join(cwd, 'package.json')), createRequire(import.meta.url)]
  for (const require of requires) {
    for (const name of CLI_PACKAGES) {
      try {
        const manifestPath = require.resolve(`${name}/package.json`)
        const { bin } = JSON.parse(await readFile(manifestPath, 'utf8')) as { bin?: string | Record<string, string> }
        const script = typeof bin === 'string' ? bin : bin?.kubb
        if (script) return path.resolve(path.dirname(manifestPath), script)
      } catch {
        // Not installed from this location; try the next one.
      }
    }
  }
  return undefined
}

/**
 * Runs the `kubb` bin with Node.js and an argument array, never through a shell. stdin is closed,
 * so the CLI cannot wait for an answer. Returns the exit code or signal and the combined stdout and
 * stderr without ANSI styling.
 */
export function runCli({
  bin,
  args,
  cwd = process.cwd(),
  timeout = TIMEOUT_MS,
}: {
  bin: string
  args: ReadonlyArray<string>
  cwd?: string
  timeout?: number
}): Promise<CliResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [bin, ...args], {
      cwd,
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout,
    })
    const chunks: Array<Buffer> = []
    child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk))
    child.stderr.on('data', (chunk: Buffer) => chunks.push(chunk))
    child.on('error', reject)
    child.on('close', (exitCode, signal) => {
      resolve({ exitCode, signal, output: stripVTControlCharacters(Buffer.concat(chunks).toString('utf8')).trim() })
    })
  })
}

/**
 * Runs `kubb <args>` in the working directory and turns the outcome into a tool result. A non-zero
 * exit is an error unless `isSuccess` accepts it, as `kubb generate --diff` does for exit code 1.
 * A run that a signal ended, such as the timeout, is always an error.
 */
export async function runKubb({
  args,
  isSuccess = (code) => code === 0,
  timeout,
}: {
  args: ReadonlyArray<string>
  isSuccess?: (code: number) => boolean
  timeout?: number
}) {
  const bin = await resolveCliBin()
  if (!bin) {
    return tool.error('The Kubb CLI is not installed. Install it in the project with `npm install -D kubb`, then try again.')
  }
  try {
    const { exitCode, signal, output } = await runCli({ bin, args, timeout })
    const status = signal ? `Stopped by ${signal}` : `Exit code: ${exitCode}`
    const text = `$ kubb ${args.join(' ')}\n${status}\n\n${output || '(no output)'}`
    return !signal && exitCode !== null && isSuccess(exitCode) ? tool.text(text) : tool.error(text)
  } catch (error) {
    return tool.error(`Could not run kubb ${args.join(' ')}: ${getErrorMessage(error)}`)
  }
}
