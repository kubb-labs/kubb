import type { Logger } from '@kubb/core/logger'
import { execa } from 'execa'
import { parseArgsStringToArgv } from 'string-argv'
import pc from 'picocolors'

import { ConsolaWritable } from './Writables.ts'

import type { Config } from '@kubb/core'
import { LogMapper } from '@kubb/core/logger'

type ExecutingHooksProps = {
  hooks: NonNullable<Config['hooks']>
  logger: Logger
}

export async function executeHooks({ hooks, logger }: ExecutingHooksProps): Promise<void> {
  const commands = Array.isArray(hooks.done) ? hooks.done : [hooks.done].filter(Boolean)

  for (const command of commands) {
    const consolaWritable = new ConsolaWritable(logger.consola!, command)
    const [cmd, ..._args] = [...parseArgsStringToArgv(command)]

    if (!cmd) {
      continue
    }

    logger?.emit('start', `Executing hook ${logger.logLevel !== LogMapper.silent ? pc.dim(command) : ''}`)

    await execa(cmd, _args, {
      detached: true,
      stdout: logger?.logLevel === LogMapper.silent ? undefined : ['pipe', consolaWritable],
      stripFinalNewline: true,
    })

    logger?.emit('success', `Executed hook ${logger.logLevel !== LogMapper.silent ? pc.dim(command) : ''}`)
  }

  logger?.emit('success', 'Executed hooks')
}
