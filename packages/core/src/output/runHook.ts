import { randomUUID } from 'node:crypto'
import process from 'node:process'
import { createInterface } from 'node:readline'
import { toError } from '@internals/utils'
import { type Result, x } from 'tinyexec'
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

const KILL_GRACE_MS = 2_000

async function settle(proc: Result, hooks: Hookable<KubbHooks>, id: string, commandWithArgs: string): Promise<HookResult> {
  let childError: Error | null = null
  let lineError: Error | null = null
  let lines: Promise<void> = Promise.resolve()
  let killTimer: NodeJS.Timeout | undefined
  proc.process?.once('error', (error) => {
    childError = error
    // An abort only asks the child to stop; one that swallows SIGTERM would otherwise hang the run.
    killTimer = setTimeout(() => proc.kill('SIGKILL'), KILL_GRACE_MS).unref()
  })
  // Lines are only read when a logger listens, so a quiet host does not pay to iterate them.
  if (hooks.listenerCount('kubb:hook:line') > 0) {
    for (const input of [proc.process?.stdout, proc.process?.stderr]) {
      if (!input) continue
      createInterface({ input }).on('line', (line) => {
        lines = lines
          .then(() => hooks.callHook('kubb:hook:line', { id, line }))
          .catch((error) => {
            lineError ??= toError(error)
          })
      })
    }
  }
  const output = await Promise.resolve(proc).catch(() => null)
  clearTimeout(killTimer)
  await lines

  const error = childError ?? lineError
  if (error) return { success: false, error }
  if (output?.exitCode === 0) return { success: true, error: null }
  return { success: false, error: new Error(`Hook execute failed: ${commandWithArgs}`), stdout: output?.stdout, stderr: output?.stderr }
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
  await hooks.callHook('kubb:hook:start', { id, command, name, args })

  const proc = x(command, [...args], {
    signal,
    throwOnError: false,
    nodeOptions: { cwd, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32' },
  })
  const result = await settle(proc, hooks, id, [command, ...args].join(' '))
  await hooks.callHook('kubb:hook:end', { id, command, name, args, ...result })

  return result
}
