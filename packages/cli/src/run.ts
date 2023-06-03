/* eslint-disable no-console */
import pc from 'picocolors'
import { execa } from 'execa'
import { parseArgsStringToArgv } from 'string-argv'
import PrettyError from 'pretty-error'

import { build } from '@kubb/core'
import type { Logger, CLIOptions, KubbConfig } from '@kubb/core'

import type { Ora } from 'ora'

type RunProps = {
  config: KubbConfig
  spinner: Ora
  options: CLIOptions
}

export async function run({ config, options, spinner }: RunProps) {
  const logger: Logger = {
    log(message, logLevel) {
      if (logLevel === 'error') {
        spinner.fail(message)
      }

      switch (logLevel) {
        case 'error':
          spinner.fail(message)
          break

        default:
          spinner.info(message)
          break
      }
    },
    spinner,
  }

  const onDone = async (hooks: KubbConfig['hooks']) => {
    if (!hooks?.done) {
      return
    }
    spinner.start('🪂 Running hooks')

    let commands: string[] = []
    if (typeof hooks?.done === 'string') {
      commands = [hooks.done]
    } else {
      commands = hooks.done
    }

    const promises = commands.map(async (command) => {
      const [cmd, ..._args] = [...parseArgsStringToArgv(command)]
      return execa(cmd, _args)
    })

    await Promise.all(promises)

    spinner.succeed('🪂 Hooks runned')
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
    const { root, ...userConfig } = config

    spinner.start(`🚀 Building(${options.input ?? userConfig.input.path})`)

    await build({
      config: {
        root: process.cwd(),
        ...userConfig,
        input: {
          ...userConfig.input,
          path: options.input ?? userConfig.input.path,
        },
        output: {
          write: true,
          ...userConfig.output,
        },
      },
      logger,
    })

    spinner.succeed(pc.blue('🌈 Generation complete'))

    await onDone(config.hooks)
  } catch (err: any) {
    const pe = new PrettyError()
    if (options.debug) {
      spinner.fail(pc.red(`Something went wrong\n\n`))
      const causedError = (err as Error)?.cause as Error

      console.log(pe.render(err))

      if (causedError) {
        console.log(pe.render(causedError))
      }
    } else {
      spinner.fail(pc.red(`Something went wrong\n\n${(err as Error)?.message}`))
    }
    throw err
  }

  return true
}
