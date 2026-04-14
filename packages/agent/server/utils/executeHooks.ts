import { createHash } from 'node:crypto'
import { tokenize } from '@internals/utils'
import type { AsyncEventEmitter, Config, KubbHooks } from '@kubb/core'

type ExecutingHooksProps = {
  hooks: NonNullable<Config['hooks']>
  hooks: AsyncEventEmitter<KubbHooks>
}

/**
 * Execute the `hooks.done` commands defined in the Kubb config sequentially.
 * Each command is emitted as a `hook:start` event; the plugin layer is responsible
 * for actually spawning the process and emitting `hook:end`.
 *
 */
export async function executeHooks({ hooks, events }: ExecutingHooksProps): Promise<void> {
  const commands = Array.isArray(hooks.done) ? hooks.done : [hooks.done].filter(Boolean)

  for (const command of commands) {
    const [cmd, ...args] = tokenize(command)

    if (!cmd) {
      continue
    }

    const hookId = createHash('sha256').update(command).digest('hex')
    await events.emit('kubb:hook:start', { id: hookId, command: cmd, args })

    await events.onOnce('kubb:hook:end', async ({ success, error }) => {
      if (!success) {
        throw error
      }

      await events.emit('kubb:success', `${command} successfully executed`)
    })
  }
}
