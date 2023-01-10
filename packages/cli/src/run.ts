/* eslint-disable no-console */
import pc from 'picocolors'
import { execa } from 'execa'
import { parseArgsStringToArgv } from 'string-argv'

import { build } from '@kubb/core'
import type { Logger, CLIOptions, KubbUserConfig } from '@kubb/core'

import type { Ora } from 'ora'

type RunProps = {
  config: KubbUserConfig
  spinner: Ora
  options: CLIOptions
}

export async function run({ config, options, spinner }: RunProps) {
  const logger: Logger = {
    log(message, logLevel) {
      if (logLevel === 'error') {
        spinner.fail(message)
      }
      spinner[logLevel](message)
    },
    spinner,
  }

  const onDone = async (config: KubbUserConfig) => {
    if (!config.hooks?.done) {
      return
    }
    spinner.start('Running hooks')

    let commands: string[] = []
    if (typeof config.hooks?.done === 'string') {
      commands = [config.hooks.done]
    } else {
      commands = config.hooks.done
    }

    const promises = commands.map(async (command) => {
      const [cmd, ..._args] = [...parseArgsStringToArgv(command)]
      return execa(cmd, _args)
    })

    await Promise.all(promises)

    spinner.succeed('Running hooks completed')
  }

  try {
    spinner.start('Building')

    await build({
      config: {
        root: process.cwd(),
        ...config,
      },
      mode: options.mode || 'development',
      logger,
    })

    spinner.succeed(pc.blue('Kubb generation done'))

    await onDone(config)
  } catch (err) {
    spinner.fail(`Something went wrong\n${err?.message}`)
    if (options.debug) {
      console.error(err)
    }
  }

  return true
}
