import path from 'node:path'
import { tokenize } from '@internals/utils'
import type { AsyncEventEmitter, KubbEvents } from '@kubb/core'
import { x } from 'tinyexec'

type PublishProps = {
  /** Shell command to execute, e.g. 'npm publish --access public' */
  command: string
  /** Absolute path to the output directory (where package.json lives) */
  outputPath: string
  /** Project root — used as the working directory when outputPath is relative */
  root: string
  events: AsyncEventEmitter<KubbEvents>
}

/**
 * Execute a publish command (e.g. `npm publish`) in the generated output directory.
 *
 * Emits `info` / `success` / `error` events on the provided event emitter so they
 * are forwarded to Studio in real time via the WebSocket data stream.
 */
export async function publish({ command, outputPath, root, events }: PublishProps): Promise<void> {
  const resolvedOutputPath = path.isAbsolute(outputPath) ? outputPath : path.resolve(root, outputPath)
  const [cmd, ...args] = tokenize(command)

  if (!cmd) {
    throw new Error(`[plugin-publish] Invalid publish command: "${command}"`)
  }

  const commandWithArgs = args.length ? `${cmd} ${args.join(' ')}` : cmd

  await events.emit('info', `[publish] Running "${commandWithArgs}" in "${resolvedOutputPath}"`)

  const startTime = Date.now()

  let exitCode: number | null = null

  try {
    const proc = x(cmd, args, {
      nodeOptions: { cwd: resolvedOutputPath },
    })

    // Stream output line-by-line (stdout + stderr interleaved) in real time
    for await (const line of proc) {
      if (line.trim()) {
        await events.emit('info', line.trim())
      }
    }

    const result = await proc
    exitCode = result.exitCode ?? null
  } catch (err: any) {
    // Unexpected process spawn/IO error (not a non-zero exit code)
    const message = err?.stderr?.trim() ?? err?.message ?? String(err)
    const error = new Error(`[publish] Failed to run "${commandWithArgs}": ${message}`)
    error.cause = err

    await events.emit('error', error)
    throw error
  }

  if (exitCode !== 0) {
    const error = new Error(`[publish] "${commandWithArgs}" exited with code ${exitCode}`)
    await events.emit('error', error)
    throw error
  }

  const duration = Date.now() - startTime
  await events.emit('success', `[publish] Published successfully in ${duration}ms`)
}
