import path from 'node:path'

import { isInputPath, PromiseManager, Warning } from '@kubb/core'

import { cac } from 'cac'
import c from 'tinyrainbow'

import { version } from '../package.json'
import { getConfig } from './utils/getConfig.ts'
import { getCosmiConfig } from './utils/getCosmiConfig.ts'
import { renderErrors } from './utils/renderErrors.ts'
import { spinner } from './utils/spinner.ts'
import { startWatcher } from './utils/watcher.ts'
import { generate } from './generate.ts'
import { init } from './init.ts'

import type { CLIOptions } from '@kubb/core'

const moduleName = 'kubb'

function programCatcher(e: unknown, CLIOptions: CLIOptions): void {
  const error = e as Error
  const message = renderErrors(error, { logLevel: CLIOptions.logLevel })

  if (error instanceof Warning) {
    spinner.warn(c.yellow(error.message))
    process.exit(0)
  }

  spinner.fail(message)
  process.exit(1)
}

async function generateAction(input: string, CLIOptions: CLIOptions) {
  spinner.start('🔍 Loading config')
  const result = await getCosmiConfig(moduleName, CLIOptions.config)
  spinner.succeed(`🔍 Config loaded(${c.dim(path.relative(process.cwd(), result.filepath))})`)

  const config = await getConfig(result, CLIOptions)

  if (CLIOptions.watch) {
    if (Array.isArray(config)) {
      throw new Error('Cannot use watcher with multiple Configs(array)')
    }

    if (isInputPath(config)) {
      return startWatcher([input || config.input.path], async (paths) => {
        await generate({ config, CLIOptions })
        spinner.spinner = 'simpleDotsScrolling'
        spinner.start(c.yellow(c.bold(`Watching for changes in ${paths.join(' and ')}`)))
      })
    }
  }

  if (Array.isArray(config)) {
    const promiseManager = new PromiseManager()
    const promises = config.map((item) => () => generate({ input, config: item, CLIOptions }))

    await promiseManager.run('seq', promises)

    return
  }

  await generate({ input, config, CLIOptions })
}

export async function run(argv?: string[]): Promise<void> {
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

export default run
