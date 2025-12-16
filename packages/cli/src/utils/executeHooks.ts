import type { Config, KubbEvents } from '@kubb/core'
import type { AsyncEventEmitter } from '@kubb/core/utils'

import pc from 'picocolors'
import { parseArgsStringToArgv } from 'string-argv'

type ExecutingHooksProps = {
  hooks: NonNullable<Config['hooks']>
  events: AsyncEventEmitter<KubbEvents>
}

export async function executeHooks({ hooks, events }: ExecutingHooksProps): Promise<void> {
  const commands = Array.isArray(hooks.done) ? hooks.done : [hooks.done].filter(Boolean)

  for (const command of commands) {
    const [cmd, ...args] = [...parseArgsStringToArgv(command)]

    if (!cmd) {
      continue
    }

    await events.emit('hook:start', command)

    await events.emit('hook:execute', { command: cmd, args }, async () => {
      await events.emit('success', `${pc.dim(command)} successfully executed`)

      await events.emit('hook:end', command)
    })
  }
}
