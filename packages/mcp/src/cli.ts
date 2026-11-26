import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'
import { stripVTControlCharacters } from 'node:util'
import { getErrorMessage } from '@internals/utils'
import { tool } from 'tmcp/utils'
import { checkConfigPath, truncateOutput } from './utils.ts'

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
  /**
   * stdout and stderr together, in the order they arrived.
   */
  output: string
  stdout: string
  stderr: string
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
 * signal, and stdout and stderr without ANSI styling, together and apart.
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
    const stdout: Array<Buffer> = []
    const stderr: Array<Buffer> = []
    child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk) && stdout.push(chunk))
    child.stderr.on('data', (chunk: Buffer) => chunks.push(chunk) && stderr.push(chunk))
    const text = (parts: Array<Buffer>) => stripVTControlCharacters(Buffer.concat(parts).toString('utf8')).trim()
    child.on('error', reject)
    child.on('close', (exitCode, signal) => {
      clearTimeout(timeoutTimer)
      clearTimeout(killTimer)
      resolve({ exitCode, signal, output: text(chunks), stdout: text(stdout), stderr: text(stderr) })
    })
  })
}

/**
 * Runs `kubb <args>` in the working directory and turns the outcome into a tool result. A `configPath`
 * the AI client supplied is checked and passed as `--config`, and a refused path is an error. A non-zero
 * exit is an error unless `isSuccess` accepts it, as `kubb generate --diff` does for exit code 1.
 * A run that a signal ended, such as the timeout, is always an error. `formatOutput` builds the text of a
 * successful run, and the text is cut at `MAX_OUTPUT_CHARS` with a notice that carries the text `truncationHint` returns.
 */
export async function runKubb({
  args,
  configPath,
  isSuccess = (code) => code === 0,
  formatOutput = ({ output }) => output,
  truncationHint,
}: {
  args: ReadonlyArray<string>
  configPath?: string
  isSuccess?: (code: number) => boolean
  formatOutput?: (result: CliResult) => string
  truncationHint?: (result: CliResult) => string | undefined
}) {
  const checked = configPath ? await checkConfigPath(configPath) : undefined
  if (checked && 'error' in checked) return tool.error(checked.error)
  const fullArgs = checked ? [...args, '--config', checked.file] : args
  const bin = await resolveCliBin()
  if (!bin) {
    return tool.error('The Kubb CLI is not installed. Install it in the project with `npm install -D kubb`, then try again.')
  }
  try {
    const result = await runCli({ bin, args: fullArgs })
    const { exitCode, signal } = result
    const succeeded = !signal && exitCode !== null && isSuccess(exitCode)
    const status = signal ? `Stopped by ${signal}` : `Exit code: ${exitCode}`
    const body = (succeeded ? formatOutput(result) : result.output) || '(no output)'
    const text = truncateOutput(`$ kubb ${fullArgs.join(' ')}\n${status}\n\n${body}`, () => truncationHint?.(result))
    return succeeded ? tool.text(text) : tool.error(text)
  } catch (error) {
    return tool.error(`Could not run kubb ${fullArgs.join(' ')}: ${getErrorMessage(error)}`)
  }
}
