import type { Config, KubbEvents } from '@kubb/core'
import type { AsyncEventEmitter } from '@kubb/core/utils'

import pc from 'picocolors'
import { parseArgsStringToArgv } from 'string-argv'
import { generateHookId } from './generateHookId.ts'

type ExecutingHooksProps = {
  hooks: NonNullable<Config['hooks']>
  events: AsyncEventEmitter<KubbEvents>
  config: Config
}

export async function executeHooks({ hooks, events, config }: ExecutingHooksProps): Promise<void> {
  const commands = Array.isArray(hooks.done) ? hooks.done : [hooks.done].filter(Boolean)

  for (const command of commands) {
    const [cmd, ...args] = [...parseArgsStringToArgv(command)]

    if (!cmd) {
      continue
    }

    await events.emit('hook:start', { id: generateHookId(cmd, config.name), command: cmd, args })

    await events.onOnce('hook:end', async () => {
      await events.emit('success', `${pc.dim(command)} successfully executed`)
    })
  }
}
