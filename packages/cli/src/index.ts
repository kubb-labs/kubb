#!/usr/bin/env node
/* eslint-disable no-console */

import { Command, Option } from 'commander'
import pc from 'picocolors'
import ora from 'ora'

import type { CLIOptions } from '@kubb/core'

import { run } from './run'
import { startWatcher } from './utils/watcher'
import { getConfig, getCosmiConfig } from './utils'

import { version } from '../package.json'

const moduleName = 'kubb'

const spinner = ora({
  color: 'blue',
  text: pc.blue('Kubb generation started'),
  spinner: 'clock',
}).start()

const program = new Command(moduleName)
  .description('Kubb')
  .action(async (options: CLIOptions) => {
    try {
      spinner.succeed(pc.blue('Kubb generation started'))
      // CONFIG

      spinner.start('Loading config')
      const result = await getCosmiConfig(moduleName, options.config)
      spinner.succeed('Config loaded')

      // END CONFIG

      if (options.watch) {
        const config = await getConfig(result, options)

        if (typeof config.input === 'string') {
          spinner.warn(pc.red('Input as a string cannot be used together with watch '))
          return
        }

        startWatcher(
          async (paths) => {
            await run({ config, spinner, options })
            spinner.spinner = 'simpleDotsScrolling'
            spinner.start(pc.yellow(pc.bold(`Watching for changes in ${paths.join(' and ')}`)))
          },
          {
            spinner,
            path: [config.input.path],
          }
        )
      } else {
        const config = await getConfig(result, options)

        await run({ config, spinner, options })
      }
    } catch (e) {
      spinner.fail(pc.red(e.message))
    }
  })
  .addOption(new Option('-m, --mode <mode>', 'Mode of Kubb, development or production').default('development'))
  .addOption(new Option('-c, --config <path>', 'Path to @kubb config'))
  .addOption(new Option('-d, --debug', 'Debug mode').default(false))
  .addOption(new Option('-w, --watch', 'Watch mode based on the input file'))

program.name(moduleName).description('Generate').version(version, '-v').parse()
