import { createHash } from 'node:crypto'
import type { Config, KubbEvents } from '@kubb/core'
import type { AsyncEventEmitter } from '@kubb/core/utils'

import pc from 'picocolors'
import { parseArgsStringToArgv } from 'string-argv'

type ExecutingHooksProps = {
  hooks: NonNullable<Config['hooks']>
  events: AsyncEventEmitter<KubbEvents>
  config: Config
}

function generateHookId(command: string, configName?: string): string {
  const input = [command, configName].filter(Boolean).join('::')
  return createHash('sha256').update(input).digest('hex')
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
