import { createHash } from 'node:crypto'
import { styleText } from 'node:util'
import type { Config, KubbEvents } from '@kubb/core'
import type { AsyncEventEmitter } from '@kubb/core/utils'
import { tokenize } from '@kubb/core/utils'

type ExecutingHooksProps = {
  hooks: NonNullable<Config['hooks']>
  events: AsyncEventEmitter<KubbEvents>
}

export async function executeHooks({ hooks, events }: ExecutingHooksProps): Promise<void> {
  const commands = Array.isArray(hooks.done) ? hooks.done : [hooks.done].filter(Boolean)

  for (const command of commands) {
    const [cmd, ...args] = tokenize(command)

    if (!cmd) {
      continue
    }

    const hookId = createHash('sha256').update(command).digest('hex')

    // Wire up the hook:end listener BEFORE emitting hook:start to avoid the race condition
    // where hook:end fires synchronously inside emit('hook:start') before the listener is registered.
    const hookEndPromise = new Promise<void>((resolve, reject) => {
      const handler = ({ id, success, error }: { id?: string; command: string; args?: readonly string[]; success: boolean; error: Error | null }) => {
        if (id !== hookId) return
        events.off('hook:end', handler)
        if (!success) {
          reject(error ?? new Error(`Hook failed: ${command}`))
          return
        }
        events
          .emit('success', `${styleText('dim', command)} successfully executed`)
          .then(resolve)
          .catch(reject)
      }
      events.on('hook:end', handler)
    })

    await events.emit('hook:start', { id: hookId, command: cmd, args })
    await hookEndPromise
  }
}
