import { createHash } from 'node:crypto'
import { styleText } from 'node:util'
import type { AsyncEventEmitter } from '@internals/utils'
import { tokenize } from '@internals/utils'
import type { Config, KubbHooks } from '@kubb/core'

type ExecutingHooksProps = {
  configHooks: NonNullable<Config['hooks']>
  hooks: AsyncEventEmitter<KubbHooks>
}

export async function executeHooks({ configHooks, hooks }: ExecutingHooksProps): Promise<void> {
  const commands = Array.isArray(configHooks.done) ? configHooks.done : [configHooks.done].filter(Boolean)

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
          hooks.off('kubb:hook:end', handler)
        if (!success) {
          reject(error ?? new Error(`Hook failed: ${command}`))
          return
        }
        hooks
          .emit('kubb:success', `${styleText('dim', command)} successfully executed`)
          .then(resolve)
          .catch(reject)
      }
      hooks.on('kubb:hook:end', handler)
    })

    await hooks.emit('kubb:hook:start', { id: hookId, command: cmd, args })
    await hookEndPromise
  }
}
