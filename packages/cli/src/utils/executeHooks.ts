import * as clack from '@clack/prompts'
import type { Config } from '@kubb/core'
import type { Logger } from '@kubb/core/logger'
import { LogMapper } from '@kubb/core/logger'
import { execa } from 'execa'
import pc from 'picocolors'
import { parseArgsStringToArgv } from 'string-argv'
import { ClackWritable } from './Writables.ts'

type ExecutingHooksProps = {
  hooks: NonNullable<Config['hooks']>
  logger: Logger
}

export async function executeHooks({ hooks, logger }: ExecutingHooksProps): Promise<void> {
  const commands = Array.isArray(hooks.done) ? hooks.done : [hooks.done].filter(Boolean)

  for (const command of commands) {
    const [cmd, ..._args] = [...parseArgsStringToArgv(command)]

    if (!cmd) {
      continue
    }

    const hooksLogger = clack.taskLog({
      title: ['Executing hook', logger.logLevel !== LogMapper.silent ? pc.dim(command) : undefined].filter(Boolean).join(' '),
    })

    const writable = new ClackWritable(hooksLogger)

    const result = await execa(cmd, _args, {
      detached: true,
      stdout: logger?.logLevel === LogMapper.silent ? undefined : ['pipe', writable],
      stripFinalNewline: true,
    })

    hooksLogger.success(['Executing hook', logger.logLevel !== LogMapper.silent ? pc.dim(command) : undefined, 'successfully'].filter(Boolean).join(' '))
    hooksLogger.message(result.stdout)
  }
}
