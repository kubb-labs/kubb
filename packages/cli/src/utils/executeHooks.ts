import { createHash } from 'node:crypto'
import { styleText } from 'node:util'
import type { AsyncEventEmitter } from '@internals/utils'
import { tokenize } from '@internals/utils'
import type { Config, KubbHooks } from '@kubb/core'

type ExecutingHooksProps = {
  hooks: NonNullable<Config['hooks']>
  hooks: AsyncEventEmitter<KubbHooks>
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
    // where hook:end fires synchronously inside emit('kubb:hook:start') before the listener is registered.
    const hookEndPromise = new Promise<void>((resolve, reject) => {
      const handler = ({ id, success, error }: { id?: string; command: string; args?: readonly string[]; success: boolean; error: Error | null }) => {
        if (id !== hookId) return
        events.off('kubb:hook:end', handler)
        if (!success) {
          reject(error ?? new Error(`Hook failed: ${command}`))
          return
        }
        events
          .emit('kubb:success', `${styleText('dim', command)} successfully executed`)
          .then(resolve)
          .catch(reject)
      }
      events.on('kubb:hook:end', handler)
    })

    await events.emit('kubb:hook:start', { id: hookId, command: cmd, args })
    await hookEndPromise
  }
}
