import { type ChildProcessByStdio, spawn, type SpawnOptionsWithStdioTuple, type StdioNull, type StdioPipe } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { delimiter, dirname, join } from 'node:path'
import process from 'node:process'
import { createInterface } from 'node:readline'
import type { Readable } from 'node:stream'
import { toError } from '@internals/utils'
import type { Hookable } from '../Hookable.ts'
import type { KubbHooks } from '../types.ts'

/**
 * Outcome of one hook subprocess, also carried by the `kubb:hook:end` hook it emits.
 */
export type HookResult = { success: true; error: null } | { success: false; error: Error; stdout?: string; stderr?: string }

export type RunHookOptions = {
  hooks: Hookable<KubbHooks>
  /** Executable to run, resolved on `PATH` and in every `node_modules/.bin` above `cwd`. */
  command: string
  args?: ReadonlyArray<string>
  /** Label shown instead of the command line, for example a `postGenerate` step name. */
  name?: string
  /** Working directory for the command. Defaults to the current process directory. */
  cwd?: string
  signal?: AbortSignal
}

type SpawnOutcome = { code: number | null; stdout: string; stderr: string } | { error: Error }

type HookSpawnOptions = SpawnOptionsWithStdioTuple<StdioNull, StdioPipe, StdioPipe>

type HookChild = ChildProcessByStdio<null, Readable, Readable>

const KILL_GRACE_MS = 2_000

const CMD_META_CHARS = /[()%!^"<>&|]/g

function escapeCmdArgument(arg: string): string {
  const quoted = `"${arg.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\*)$/, '$1$1')}"`
  return quoted.replace(CMD_META_CHARS, '^$&')
}

/**
 * Joins `command` and `args` into one `cmd.exe /c` line, quoted the way cross-spawn does so `.cmd` shims, spaces and metacharacters survive.
 */
function toWindowsCommandLine(command: string, args: ReadonlyArray<string>): string {
  const executable = /\s/.test(command) ? escapeCmdArgument(command) : command.replace(CMD_META_CHARS, '^$&')
  return [executable, ...args.map(escapeCmdArgument)].join(' ')
}

/**
 * Every `node_modules/.bin` from `cwd` up to the filesystem root, so a project-local tool is found when kubb itself runs as a global binary.
 */
function binDirectories(cwd: string): Array<string> {
  const own = join(cwd, 'node_modules', '.bin')
  const parent = dirname(cwd)
  return parent === cwd ? [own] : [own, ...binDirectories(parent)]
}

function hookEnv(cwd: string): NodeJS.ProcessEnv {
  const PATH = [...binDirectories(cwd), process.env.PATH ?? process.env.Path].filter(Boolean).join(delimiter)
  return process.platform === 'win32' ? { ...process.env, PATH, Path: PATH } : { ...process.env, PATH }
}

function toResult(outcome: SpawnOutcome, commandWithArgs: string): HookResult {
  if ('error' in outcome) return { success: false, error: outcome.error }
  if (outcome.code === 0) return { success: true, error: null }
  return { success: false, error: new Error(`Hook execute failed: ${commandWithArgs}`), stdout: outcome.stdout, stderr: outcome.stderr }
}

function spawnHook(command: string, args: ReadonlyArray<string>, options: HookSpawnOptions): HookChild {
  if (process.platform !== 'win32') return spawn(command, [...args], options)
  const shell = process.env.ComSpec ?? 'cmd.exe'
  const line = `"${toWindowsCommandLine(command, args)}"`
  return spawn(shell, ['/d', '/s', '/c', line], { ...options, windowsVerbatimArguments: true, windowsHide: true })
}

/**
 * Spawns a command and returns its outcome, announcing it through `kubb:hook:start`,
 * `kubb:hook:line` (one per stdout or stderr line, only while a listener is attached) and
 * `kubb:hook:end`. A non-zero exit, a spawn failure, an abort or a throwing line listener returns
 * `success: false` instead of throwing. The failure travels on the result and `kubb:hook:end`
 * only, and the caller emits `kubb:success` or a diagnostic, so nothing is reported twice.
 */
export async function runHook({ hooks, command, args = [], name, cwd = process.cwd(), signal }: RunHookOptions): Promise<HookResult> {
  const id = randomUUID()
  const commandWithArgs = [command, ...args].join(' ')
  await hooks.callHook('kubb:hook:start', { id, command, name, args })

  const outcome = await new Promise<SpawnOutcome>((resolve) => {
    const child = spawnHook(command, args, {
      cwd,
      signal,
      env: hookEnv(cwd),
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: process.platform !== 'win32',
    })
    let stdout = ''
    let stderr = ''
    let spawnError: Error | null = null
    let killTimer: NodeJS.Timeout | undefined
    // Lines are only read when a logger listens, so a quiet host does not pay to iterate them.
    let lines: Promise<void> = Promise.resolve()
    let lineError: Error | null = null
    const streamLines = (input: Readable) => {
      createInterface({ input }).on('line', (line) => {
        lines = lines
          .then(() => hooks.callHook('kubb:hook:line', { id, line }))
          .catch((error) => {
            lineError ??= toError(error)
          })
      })
    }
    child.stdout.setEncoding('utf8').on('data', (chunk: string) => {
      stdout += chunk
    })
    child.stderr.setEncoding('utf8').on('data', (chunk: string) => {
      stderr += chunk
    })
    if (hooks.listenerCount('kubb:hook:line') > 0) {
      streamLines(child.stdout)
      streamLines(child.stderr)
    }
    const isRunning = () => child.pid !== undefined && child.exitCode === null && child.signalCode === null
    // An abort only asks the child to stop; one that swallows SIGTERM would otherwise hang the run.
    child.on('error', (error) => {
      spawnError ??= toError(error)
      if (!isRunning() || killTimer) return
      killTimer = setTimeout(() => {
        if (isRunning()) child.kill('SIGKILL')
      }, KILL_GRACE_MS).unref()
    })
    child.on('close', (code) => {
      clearTimeout(killTimer)
      lines.then(() => {
        const error = spawnError ?? lineError
        resolve(error ? { error } : { code, stdout, stderr })
      })
    })
  })

  const result = toResult(outcome, commandWithArgs)
  await hooks.callHook('kubb:hook:end', { id, command, name, args, ...result })

  return result
}
