import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'
import { stripVTControlCharacters } from 'node:util'
import { tool } from 'tmcp/utils'

/** Packages that ship the `kubb` bin, in the order they are tried. */
const CLI_PACKAGES = ['@kubb/cli', 'kubb'] as const

/** An install can take minutes, but a hung child must not block the MCP server forever. */
const TIMEOUT_MS = 10 * 60 * 1000

export type CliResult = {
  exitCode: number
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
 * so a prompt the arguments did not skip ends the run instead of hanging it. Returns the exit code
 * and the combined stdout and stderr without ANSI styling.
 */
export function runCli({ bin, args, cwd = process.cwd() }: { bin: string; args: ReadonlyArray<string>; cwd?: string }): Promise<CliResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [bin, ...args], {
      cwd,
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: TIMEOUT_MS,
    })
    const chunks: Array<Buffer> = []
    child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk))
    child.stderr.on('data', (chunk: Buffer) => chunks.push(chunk))
    child.on('error', reject)
    child.on('close', (code, signal) => {
      const output = stripVTControlCharacters(Buffer.concat(chunks).toString('utf8')).trim()
      resolve({ exitCode: code ?? (signal ? 1 : 0), output: signal ? `${output}\n\nStopped by ${signal}` : output })
    })
  })
}

/**
 * Runs `kubb <args>` in the working directory and turns the outcome into a tool result. A non-zero
 * exit is an error unless `isSuccess` accepts it, as `kubb generate --check` does for exit code 1.
 */
export async function runKubb(args: ReadonlyArray<string>, { isSuccess = (code: number) => code === 0 }: { isSuccess?: (code: number) => boolean } = {}) {
  const bin = await resolveCliBin()
  if (!bin) {
    return tool.error('The Kubb CLI is not installed. Install it in the project with `npm install -D kubb`, then try again.')
  }
  try {
    const { exitCode, output } = await runCli({ bin, args })
    const text = `$ kubb ${args.join(' ')}\nExit code: ${exitCode}\n\n${output || '(no output)'}`
    return isSuccess(exitCode) ? tool.text(text) : tool.error(text)
  } catch (error) {
    return tool.error(`Could not run kubb ${args.join(' ')}: ${(error as Error).message}`)
  }
}
