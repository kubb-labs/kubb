/* eslint-disable no-console */
import pc from 'picocolors'
import { execa } from 'execa'
import { parseArgsStringToArgv } from 'string-argv'

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
    spinner.start('🚀 Building')

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
    const { root, ...userConfig } = config

    await build({
      config: {
        root: process.cwd(),
        ...userConfig,
        output: {
          write: true,
          ...userConfig.output,
        },
      },
      logger,
    })

    spinner.succeed(pc.blue('🌈 Generation complete'))

    await onDone(config.hooks)
  } catch (err) {
    if (options.debug) {
      spinner.fail(`Something went wrong\n`)
      const causedError = (err as Error)?.cause
      console.log(causedError || err)
      console.log('\n')

      if (causedError) {
        console.log(err)
      }
    } else {
      spinner.fail(`Something went wrong\n${(err as Error)?.message}`)
    }
  }

  return true
}
