import type { Logger } from '@kubb/core/logger'
import { execa } from 'execa'
import { parseArgsStringToArgv } from 'string-argv'
import c from 'tinyrainbow'

import { ConsolaWritable } from './Writables.ts'

import type { Config } from '@kubb/core'
import { LogMapper } from '@kubb/core/logger'

type ExecutingHooksProps = {
  hooks: NonNullable<Config['hooks']>
  logger: Logger
}

export async function executeHooks({ hooks, logger }: ExecutingHooksProps): Promise<void> {
  const commands = Array.isArray(hooks.done) ? hooks.done : [hooks.done].filter(Boolean)

  const executors = commands
    .map(async (command) => {
      const consolaWritable = new ConsolaWritable(logger.consola!, command)
      const abortController = new AbortController()
      const [cmd, ..._args] = [...parseArgsStringToArgv(command)]

      if (!cmd) {
        return null
      }

      logger.emit('start', `Executing hook ${logger.logLevel !== LogMapper.silent ? c.dim(command) : ''}`)

      const subProcess = await execa(cmd, _args, {
        detached: true,
        cancelSignal: abortController.signal,
        stdout: logger.logLevel === LogMapper.silent ? undefined : ['pipe', consolaWritable],
      })

      logger.emit('success', `Executing hook ${logger.logLevel !== LogMapper.silent ? c.dim(command) : ''}`)

      if (subProcess) {
        logger.emit('info', `Executing hooks\n ${subProcess.stdout}`)
      }

      consolaWritable.destroy()
      return { subProcess, abort: abortController.abort.bind(abortController) }
    })
    .filter(Boolean)

  await Promise.all(executors)

  logger.emit('success', 'Executing hooks')
}
