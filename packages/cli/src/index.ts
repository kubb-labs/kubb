#!/usr/bin/env node
import pathParser from 'node:path'

import { Command, Option } from 'commander'
import ora from 'ora'
import pc from 'picocolors'

import { version } from '../package.json'
import { init } from './init.ts'
import { run } from './run.ts'
import { getConfig, getCosmiConfig, startWatcher } from './utils/index.ts'

import type { CLIOptions } from '@kubb/core'

const moduleName = 'kubb'

const spinner = ora({
  spinner: 'clock',
}).start()

const program = new Command(moduleName)
  .description('Kubb')
  .action(async (options: CLIOptions) => {
    try {
      if (options.init) {
        spinner.start('📦 Initializing Kubb')
        await init({ spinner, logLevel: options.logLevel })
        spinner.succeed(`📦 initialized Kubb`)
        return
      }

      // CONFIG
      spinner.start('💾 Loading config')
      const result = await getCosmiConfig(moduleName, options.config)
      spinner.succeed(`💾 Config loaded(${pc.dim(pathParser.relative(process.cwd(), result.filepath))})`)

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
      process.exit(1)
    }
  })
  .addOption(new Option('-c, --config <path>', 'Path to the Kubb config'))
  .addOption(new Option('-i, --input <path>', 'Path of the input file(overrides the one in `kubb.config.js`)'))
  .addOption(new Option('-l, --logLevel <type>', 'Type of the logging(overrides the one in `kubb.config.js`)').choices(['error', 'info', 'silent']))
  .addOption(new Option('--init', 'Init Kubb'))
  .addOption(new Option('-d, --debug', 'Debug mode').default(false))
  .addOption(new Option('-w, --watch', 'Watch mode based on the input file'))

program.name(moduleName).description('Generate').version(version, '-v').parse()
