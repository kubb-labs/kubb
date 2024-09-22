import { LogLevel } from '@kubb/core/logger'
import { execa } from 'execa'
import { parseArgsStringToArgv } from 'string-argv'
import c from 'tinyrainbow'

import { OraWritable } from './OraWritable.ts'
import { spinner } from './spinner.ts'

import type { Writable } from 'node:stream'
import type { Config } from '@kubb/core'

type ExecutingHooksProps = {
  hooks: Config['hooks']
  logLevel: LogLevel
}

export async function executeHooks({ hooks, logLevel }: ExecutingHooksProps): Promise<void> {
  if (!hooks?.done) {
    return
  }

  const commands = Array.isArray(hooks.done) ? hooks.done : [hooks.done]

  if (logLevel === LogLevel.silent) {
    spinner.start('Executing hooks')
  }

  const executers = commands
    .map(async (command) => {
      const oraWritable = new OraWritable(spinner, command)
      const abortController = new AbortController()
      const [cmd, ..._args] = [...parseArgsStringToArgv(command)]

      if (!cmd) {
        return null
      }

      spinner.start(`Executing hook ${logLevel !== 'silent' ? c.dim(command) : ''}`)

      const subProcess = await execa(cmd, _args, {
        detached: true,
        cancelSignal: abortController.signal,
        stdout: ['pipe', oraWritable],
      })
      spinner.suffixText = ''

      if (logLevel === LogLevel.silent) {
        spinner.succeed(`Executing hook ${logLevel !== 'silent' ? c.dim(command) : ''}`)

        if (subProcess) {
          console.log(subProcess.stdout)
        }
      }

      oraWritable.destroy()
      return { subProcess, abort: abortController.abort.bind(abortController) }
    })
    .filter(Boolean)

  await Promise.all(executers)

  if (logLevel === LogLevel.silent) {
    spinner.succeed('Executing hooks')
  }
}
