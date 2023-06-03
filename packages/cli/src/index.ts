#!/usr/bin/env node
/* eslint-disable no-console */

import { Command, Option } from 'commander'
import pc from 'picocolors'
import ora from 'ora'

import type { CLIOptions } from '@kubb/core'

import { run } from './run.ts'
import { startWatcher, getConfig, getCosmiConfig } from './utils/index.ts'

import { version } from '../package.json'

const moduleName = 'kubb'

const spinner = ora({
  color: 'blue',
  text: pc.blue('🏎️ Kubb generation started'),
  spinner: 'clock',
}).start()

const program = new Command(moduleName)
  .description('Kubb')
  .action(async (options: CLIOptions) => {
    try {
      // CONFIG

      spinner.start('💾 Loading config')
      const result = await getCosmiConfig(moduleName, options.config)
      spinner.succeed('💾 Config loaded')

      // END CONFIG

      if (options.watch) {
        const config = await getConfig(result, options)

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
      spinner.fail(pc.red((e as Error).message))
    }
  })
  .addOption(new Option('-c, --config <path>', 'Path to the Kubb config'))
  .addOption(new Option('-d, --debug', 'Debug mode').default(false))
  .addOption(new Option('-w, --watch', 'Watch mode based on the input file'))

program.name(moduleName).description('Generate').version(version, '-v').parse()
