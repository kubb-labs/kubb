import pathParser from 'node:path'

import { Command, CommanderError, Option } from 'commander'
import ora from 'ora'
import pc from 'picocolors'

import { version } from '../package.json'
import { init } from './init.ts'
import { run } from './run.ts'
import { getConfig, getCosmiConfig, renderErrors, startWatcher } from './utils/index.ts'

import { SummaryError } from '@kubb/core'
import type { CLIOptions } from '@kubb/core'
import { Warning } from '@kubb/core'

const moduleName = 'kubb'

export const spinner = ora({
  spinner: 'clock',
})

export const program = new Command(moduleName)
  .name(moduleName)
  .description('Kubb')
  .version(version, '-v')
  .exitOverride((err) => {
    if (err instanceof CommanderError) {
      process.exit(1)
    }
  })
  .configureOutput({
    outputError: (message, write) => {
      const options: CLIOptions = program.opts()

      write(
        renderErrors(new Error(message, { cause: undefined }), { debug: options.debug, prefixText: pc.red('Something went wrong with processing the CLI\n') }) +
          '\n'
      )
    },
  })
  .addOption(new Option('-c, --config <path>', 'Path to the Kubb config'))
  .addOption(new Option('-i, --input <path>', 'Path of the input file(overrides the one in `kubb.config.js`)'))
  .addOption(new Option('-l, --logLevel <type>', 'Type of the logging(overrides the one in `kubb.config.js`)').choices(['error', 'info', 'silent']))
  .addOption(new Option('--init', 'Init Kubb'))
  .addOption(new Option('-d, --debug', 'Debug mode').default(false))
  .addOption(new Option('-w, --watch', 'Watch mode based on the input file'))
  .action(async (options: CLIOptions) => {
    try {
      spinner.start()

      if (options.init) {
        return init({ logLevel: options.logLevel })
      }

      // CONFIG
      // TODO use options.config to show path instead of relying on the `result`
      spinner.start('💾 Loading config')
      const result = await getCosmiConfig(moduleName, options.config)
      spinner.succeed(`💾 Config loaded(${pc.dim(pathParser.relative(process.cwd(), result.filepath))})`)
      // END CONFIG

      if (options.watch) {
        const config = await getConfig(result, options)

        return startWatcher([config.input.path], async (paths) => {
          await run({ config, options })
          spinner.spinner = 'simpleDotsScrolling'
          spinner.start(pc.yellow(pc.bold(`Watching for changes in ${paths.join(' and ')}`)))
        })
      }

      const config = await getConfig(result, options)

      await run({ config, options })
    } catch (e: any) {
      const originalError = e as Error
      let error = originalError

      // summaryError check
      const summaryError = error instanceof SummaryError ? error : undefined

      if (summaryError) {
        // use the real error from summaryError and use the case of SummaryError to display a summary of plugins that failed
        error = summaryError.cause as Error
      }

      const message = renderErrors(error, { debug: options.debug, prefixText: pc.red(originalError?.message) })

      if (error instanceof Warning) {
        spinner.warn(pc.yellow(error.message))
        process.exit(0)
      }

      if (options.logLevel === 'silent') {
        spinner.fail(message)
        process.exit(1)
      }

      spinner.fail([message, ...(summaryError?.summary || [])].join('\n'))
      process.exit(1)
    }
  })
