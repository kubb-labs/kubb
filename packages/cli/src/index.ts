import pathParser from 'node:path'

import { createLogger, LogLevel, SummaryError, Warning } from '@kubb/core'

import { cac } from 'cac'
import pc from 'picocolors'

import { version } from '../package.json'
import generate from './generate.ts'
import init from './init.ts'
import { getConfig, getCosmiConfig, renderErrors, spinner, startWatcher } from './utils/index.ts'

import type { CLIOptions } from '@kubb/core'

const moduleName = 'kubb'
const logger = createLogger(spinner)

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

  if (CLIOptions.logLevel === LogLevel.silent) {
    spinner.fail(message)
    process.exit(1)
  }

  spinner.fail([message, ...(summaryError?.summary || [])].join('\n'))
  process.exit(1)
}

async function generateAction(input: string, CLIOptions: CLIOptions) {
  spinner.start('💾 Loading config')
  const result = await getCosmiConfig(moduleName, CLIOptions.config)
  spinner.succeed(`💾 Config loaded(${pc.dim(pathParser.relative(process.cwd(), result.filepath))})`)

  if (CLIOptions.watch) {
    const config = await getConfig(result, CLIOptions)

    return startWatcher([input || config.input.path], async (paths) => {
      await generate({ config, CLIOptions, logger })
      spinner.spinner = 'simpleDotsScrolling'
      spinner.start(pc.yellow(pc.bold(`Watching for changes in ${paths.join(' and ')}`)))
    })
  }

  const config = await getConfig(result, CLIOptions)

  await generate({ input, config, CLIOptions, logger })
}

export default async function runCLI(argv?: string[]): Promise<void> {
  const program = cac(moduleName)

  program.command('[input]', 'Path of the input file(overrides the one in `kubb.config.js`)').action(generateAction)

  program
    .command('generate [input]', 'Path of the input file(overrides the one in `kubb.config.js`)')
    .option('-c, --config <path>', 'Path to the Kubb config')
    .option('-l, --log-level <type>', 'Info, silent or debug')
    .option('-w, --watch', 'Watch mode based on the input file')
    .action(generateAction)

  program.command('init', 'Init Kubb').action(async () => {
    return init({ logLevel: 'info' })
  })

  program.help()
  program.version(version)
  program.parse(argv, { run: false })

  try {
    await program.runMatchedCommand()

    process.exit(0)
  } catch (e) {
    programCatcher(e, program.options)
  }
}
