import { createHash } from 'node:crypto'
import type { Config, KubbEvents } from '@kubb/core'
import type { AsyncEventEmitter } from '@kubb/core/utils'
import { parseArgsStringToArgv } from 'string-argv'

type ExecutingHooksProps = {
  hooks: NonNullable<Config['hooks']>
  events: AsyncEventEmitter<KubbEvents>
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
    const [cmd, ...args] = [...parseArgsStringToArgv(command)]

    if (!cmd) {
      continue
    }

    const hookId = createHash('sha256').update(command).digest('hex')
    await events.emit('hook:start', { id: hookId, command: cmd, args })

    await events.onOnce('hook:end', async ({ success, error }) => {
      if (!success) {
        throw error
      }

      await events.emit('success', `${command} successfully executed`)
    })
  }
}
