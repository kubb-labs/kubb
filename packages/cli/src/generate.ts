import { LogLevel, LogMapper, createLogger, randomCliColour } from '@kubb/core/logger'

import c from 'tinyrainbow'

import { spinner } from './utils/spinner.ts'

import { type Config, Warning, safeBuild } from '@kubb/core'
import { createConsola } from 'consola'
import type { Args } from './commands/generate.ts'
import { executeHooks } from './utils/executeHooks.ts'
import { getErrorCauses } from './utils/getErrorCauses.ts'
import { getSummary } from './utils/getSummary.ts'

type GenerateProps = {
  input?: string
  config: Config
  args: Args
}

export async function generate({ input, config, args }: GenerateProps): Promise<void> {
  const logLevel = (args.logLevel as LogLevel) || LogLevel.silent
  const logger = createLogger({
    logLevel,
    name: config.name,
    spinner,
    consola: createConsola({
      level: LogMapper[logLevel] || 3,
    }),
  })

  logger.consola?.wrapConsole()

  if (logger.name) {
    spinner.prefixText = randomCliColour(logger.name)
  }

  const hrstart = process.hrtime()

  if (args.logLevel === LogLevel.debug) {
    const { performance, PerformanceObserver } = await import('node:perf_hooks')

    const performanceOpserver = new PerformanceObserver((items) => {
      const message = `${items.getEntries()[0]?.duration.toFixed(0)}ms`

      spinner.suffixText = c.yellow(message)

      performance.clearMarks()
    })

    performanceOpserver.observe({ type: 'measure' })
  }

  const { root: _root, ...userConfig } = config
  const inputPath = input ?? ('path' in userConfig.input ? userConfig.input.path : undefined)

  spinner.start(`🚀 Building ${logLevel !== 'silent' ? c.dim(inputPath) : ''}`)

  const definedConfig: Config = {
    root: process.cwd(),
    ...userConfig,
    input: inputPath
      ? {
          ...userConfig.input,
          path: inputPath,
        }
      : userConfig.input,
    output: {
      write: true,
      ...userConfig.output,
    },
  }
  const { pluginManager, error } = await safeBuild({
    config: definedConfig,
    logger,
  })

  const summary = getSummary({
    pluginManager,
    config: definedConfig,
    status: error ? 'failed' : 'success',
    hrstart,
    logger,
  })

  if (error) {
    spinner.suffixText = ''
    spinner.fail(`🚀 Build failed ${logLevel !== 'silent' ? c.dim(inputPath) : ''}`)

    console.log(summary.join(''))

    if (error instanceof Warning) {
      spinner.warn(c.yellow(error.message))
      process.exit(0)
    }

    const errors = getErrorCauses([error])
    if (logger.consola && errors.length && logLevel === LogLevel.debug) {
      errors.forEach((err) => {
        logger.consola!.error(err)
      })
    }

    logger.consola?.error(error)

    process.exit(0)
  }

  await executeHooks({ hooks: config.hooks, logLevel })

  spinner.suffixText = ''
  spinner.succeed(`🚀 Build completed ${logLevel !== 'silent' ? c.dim(inputPath) : ''}`)

  console.log(summary.join(''))
}
