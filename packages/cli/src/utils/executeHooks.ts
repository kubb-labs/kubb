import type { Logger } from '@kubb/core/logger'
import { execa } from 'execa'
import { parseArgsStringToArgv } from 'string-argv'
import c from 'tinyrainbow'

import { ConsolaWritable } from './Writables.ts'

import type { Config } from '@kubb/core'
import { LogMapper } from '@kubb/core/logger'
import PQueue from 'p-queue'

type ExecutingHooksProps = {
  hooks: NonNullable<Config['hooks']>
  logger: Logger
}

export async function executeHooks({ hooks, logger }: ExecutingHooksProps): Promise<void> {
  const commands = Array.isArray(hooks.done) ? hooks.done : [hooks.done].filter(Boolean)
  const queue = new PQueue({ concurrency: 1 })

  const promises = commands.map(async (command) => {
    const consolaWritable = new ConsolaWritable(logger.consola!, command)
    const [cmd, ..._args] = [...parseArgsStringToArgv(command)]

    if (!cmd) {
      return null
    }

    await queue.add(async () => {
      logger?.emit('start', `Executing hook ${logger.logLevel !== LogMapper.silent ? c.dim(command) : ''}`)

      await execa(cmd, _args, {
        detached: true,
        stdout: logger?.logLevel === LogMapper.silent ? undefined : ['pipe', consolaWritable],
        stripFinalNewline: true,
      })

      logger?.emit('success', `Executed hook ${logger.logLevel !== LogMapper.silent ? c.dim(command) : ''}`)
    })
  })

  await Promise.all(promises)

  logger?.emit('success', 'Executed hooks')
}
