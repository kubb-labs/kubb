import pathParser from 'node:path'

import ora from 'ora'
import type { CAC } from 'cac'
import cac from 'cac'
import pc from 'picocolors'

import { version } from '../package.json'
import { init } from './init.ts'
import { run } from './run.ts'
import { getConfig, getCosmiConfig, renderErrors, startWatcher } from './utils/index.ts'

import { LogLevel, SummaryError, canLogHierarchy } from '@kubb/core'
import type { CLIOptions } from '@kubb/core'
import { Warning } from '@kubb/core'
import { prettyError } from './utils/renderErrors'

const moduleName = 'kubb'

export const spinner = ora({
  spinner: 'clock',
})

function programCatcher(e: unknown, CLIOptions: CLIOptions): void {
  const originalError = e as Error
  let error = originalError

  // summaryError check
  const summaryError = error instanceof SummaryError ? error : undefined

  if (summaryError) {
    // use the real error from summaryError and use the case of SummaryError to display a summary of plugins that failed
    error = summaryError.cause as Error
  }

  const message = renderErrors(error, { logLevel: CLIOptions.logLevel, prefixText: pc.red(originalError?.message) })

  if (error instanceof Warning) {
    spinner.warn(pc.yellow(error.message))
    process.exit(0)
  }

  if (canLogHierarchy(CLIOptions.logLevel, LogLevel.silent)) {
    spinner.fail(message)
    process.exit(1)
  }

  spinner.fail([message, ...(summaryError?.summary || [])].join('\n'))
  process.exit(1)
}

export async function createProgram(argv?: string[]): Promise<CAC> {
  const program = cac(moduleName)

  const programAction = async (input: string, options: CLIOptions) => {
    try {
      // CONFIG
      spinner.start('💾 Loading config')
      const result = await getCosmiConfig(moduleName, options.config)
      spinner.succeed(`💾 Config loaded(${pc.dim(pathParser.relative(process.cwd(), result.filepath))})`)
      // END CONFIG

      if (options.watch) {
        const config = await getConfig(result, options)

        return startWatcher([input || config.input.path], async (paths) => {
          await run({ config, CLIOptions: options })
          spinner.spinner = 'simpleDotsScrolling'
          spinner.start(pc.yellow(pc.bold(`Watching for changes in ${paths.join(' and ')}`)))
        })
      }

      const config = await getConfig(result, options)

      await run({ input, config, CLIOptions: options })
    } catch (e) {
      programCatcher(e, options)
    }
  }

  program.command('[input]', 'Path of the input file(overrides the one in `kubb.config.js`)').action(programAction)

  program
    .command('generate [input]', 'Path of the input file(overrides the one in `kubb.config.js`)')
    .option('-c, --config <path>', 'Path to the Kubb config')
    .option('-l, --log-level <type>', 'Type of the logging(overrides the one in `kubb.config.js`)')
    .option('-d, --debug', 'Debug mode', { default: false })
    .option('-w, --watch', 'Watch mode based on the input file')
    .action(programAction)

  program.command('init', 'Init Kubb').action(async () => {
    return init({ logLevel: 'info' })
  })

  program.help()
  program.version(version)

  program.on('command:*', () => {
    console.log(prettyError.render(`Invalid command: ${program.args.join(' ')}`))

    process.exit(1)
  })

  try {
    program.parse(argv, { run: false })

    await program.runMatchedCommand()

    process.exit(0)
  } catch (e) {
    const error = e as Error

    console.log(
      renderErrors(new Error(error.message, { cause: undefined }), {
        logLevel: 'info',
        prefixText: pc.red('Something went wrong with processing the CLI\n'),
      })
    )

    process.exit(1)
  }

  return program
}
