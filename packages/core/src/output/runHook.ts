import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import process from 'node:process'
import { createInterface } from 'node:readline'
import { toError } from '@internals/utils'
import type { Hookable } from '../Hookable.ts'
import type { KubbHooks } from '../types.ts'

/**
 * Outcome of one hook subprocess, also carried by the `kubb:hook:end` hook it emits.
 */
export type HookResult = {
  /** `true` when the command exited with code `0`. */
  success: boolean
  /** What went wrong, `null` when the command succeeded. */
  error: Error | null
  /** Captured stdout and stderr, only present on a non-zero exit. */
  stdout?: string
  stderr?: string
}

export type RunHookOptions = {
  hooks: Hookable<KubbHooks>
  /** Executable to run, resolved on `PATH`. */
  command: string
  args?: ReadonlyArray<string>
  /** Label shown instead of the command line, for example a `postGenerate` step name. */
  name?: string
  /** Working directory for the command. Defaults to the current process directory. */
  cwd?: string
  /** Correlates `kubb:hook:start`, `kubb:hook:line` and `kubb:hook:end`. A random UUID when omitted. */
  id?: string
  signal?: AbortSignal
}

type SpawnOutcome = { code: number | null; stdout: string; stderr: string } | { error: Error }

/**
 * Spawns a command and returns its outcome, announcing it through `kubb:hook:start`,
 * `kubb:hook:line` (one per stdout line, only while a listener is attached) and `kubb:hook:end`.
 * A non-zero exit, a spawn failure or a throwing line listener returns `success: false` instead
 * of throwing. The failure travels on the result and `kubb:hook:end` only, and the caller emits
 * `kubb:success` or a diagnostic, so nothing is reported twice.
 */
export async function runHook({ hooks, command, args = [], name, cwd, id = randomUUID(), signal }: RunHookOptions): Promise<HookResult> {
  const commandWithArgs = [command, ...args].join(' ')
  await hooks.callHook('kubb:hook:start', { id, command, name, args })

  const outcome = await new Promise<SpawnOutcome>((resolve) => {
    const child = spawn(command, [...args], { cwd, signal, stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32' })
    let stdout = ''
    let stderr = ''
    // Lines are only read when a logger listens, so a quiet host does not pay to iterate them.
    let lines: Promise<void> = Promise.resolve()
    let lineError: Error | null = null
    child.stdout.setEncoding('utf8').on('data', (chunk: string) => {
      stdout += chunk
    })
    child.stderr.setEncoding('utf8').on('data', (chunk: string) => {
      stderr += chunk
    })
    if (hooks.listenerCount('kubb:hook:line') > 0) {
      createInterface({ input: child.stdout }).on('line', (line) => {
        lines = lines
          .then(() => hooks.callHook('kubb:hook:line', { id, line }))
          .catch((error) => {
            lineError ??= toError(error)
          })
      })
    }
    child.on('error', (error) => resolve({ error }))
    child.on('close', (code) => {
      lines.then(() => resolve(lineError ? { error: lineError } : { code, stdout, stderr }))
    })
  })

  const result: HookResult =
    'error' in outcome
      ? { success: false, error: toError(outcome.error) }
      : outcome.code === 0
        ? { success: true, error: null }
        : { success: false, error: new Error(`Hook execute failed: ${commandWithArgs}`), stdout: outcome.stdout, stderr: outcome.stderr }

  await hooks.callHook('kubb:hook:end', { id, command, name, args, ...result })

  return result
}
