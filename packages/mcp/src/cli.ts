import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'
import { stripVTControlCharacters } from 'node:util'
import { getErrorMessage } from '@internals/utils'
import { tool } from 'tmcp/utils'
import { MAX_OUTPUT_CHARS, truncateOutput } from './utils.ts'

const CLI_PACKAGES = ['@kubb/cli', 'kubb'] as const

// An install can take minutes, but a hung child must not block the MCP server forever.
export const TIMEOUT_MS = 10 * 60 * 1000
// A child that handles SIGTERM and keeps running gets SIGKILL after this, as `runHook` in @kubb/core does.
export const KILL_GRACE_MS = 2_000

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
 * The `kubb` bin script, resolved from the project in the working directory first so the tools run the project's
 * own Kubb version, then from this package. Returns `undefined` when neither has the CLI installed.
 */
export async function resolveCliBin(): Promise<string | undefined> {
  const requires = [createRequire(path.join(process.cwd(), 'package.json')), createRequire(import.meta.url)]
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
 * Runs the `kubb` bin in the working directory with Node.js and an argument array, never through a
 * shell. stdin is closed, so the CLI cannot wait for an answer. After `TIMEOUT_MS` the run gets
 * SIGTERM, then SIGKILL when it is still running `KILL_GRACE_MS` later. Returns the exit code or
 * signal and the combined stdout and stderr without ANSI styling.
 */
export function runCli({ bin, args }: { bin: string; args: ReadonlyArray<string> }): Promise<CliResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [bin, ...args], {
      cwd: process.cwd(),
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let killTimer: NodeJS.Timeout | undefined
    const timeoutTimer = setTimeout(() => {
      child.kill('SIGTERM')
      killTimer = setTimeout(() => child.kill('SIGKILL'), KILL_GRACE_MS)
    }, TIMEOUT_MS)
    const chunks: Array<Buffer> = []
    child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk))
    child.stderr.on('data', (chunk: Buffer) => chunks.push(chunk))
    child.on('error', reject)
    child.on('close', (exitCode, signal) => {
      clearTimeout(timeoutTimer)
      clearTimeout(killTimer)
      resolve({ exitCode, signal, output: stripVTControlCharacters(Buffer.concat(chunks).toString('utf8')).trim() })
    })
  })
}

/**
 * Runs `kubb <args>` in the working directory and turns the outcome into a tool result. A non-zero
 * exit is an error unless `isSuccess` accepts it, as `kubb generate --diff` does for exit code 1.
 * A run that a signal ended, such as the timeout, is always an error. `formatOutput` rewrites the
 * output of a successful run, and the text is cut at `MAX_OUTPUT_CHARS` with a notice that carries the text `truncationHint` returns.
 */
export async function runKubb({
  args,
  isSuccess = (code) => code === 0,
  formatOutput = (output) => output,
  truncationHint,
}: {
  args: ReadonlyArray<string>
  isSuccess?: (code: number) => boolean
  formatOutput?: (output: string) => string
  truncationHint?: (output: string) => string | undefined
}) {
  const bin = await resolveCliBin()
  if (!bin) {
    return tool.error('The Kubb CLI is not installed. Install it in the project with `npm install -D kubb`, then try again.')
  }
  try {
    const { exitCode, signal, output } = await runCli({ bin, args })
    const succeeded = !signal && exitCode !== null && isSuccess(exitCode)
    const status = signal ? `Stopped by ${signal}` : `Exit code: ${exitCode}`
    const body = (succeeded ? formatOutput(output) : output) || '(no output)'
    const full = `$ kubb ${args.join(' ')}\n${status}\n\n${body}`
    const text = truncateOutput(full, { hint: full.length > MAX_OUTPUT_CHARS ? truncationHint?.(output) : undefined })
    return succeeded ? tool.text(text) : tool.error(text)
  } catch (error) {
    return tool.error(`Could not run kubb ${args.join(' ')}: ${getErrorMessage(error)}`)
  }
}
