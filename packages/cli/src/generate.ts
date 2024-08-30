import { LogMapper } from '@kubb/core/logger'

import c from 'tinyrainbow'

import { type Config, safeBuild } from '@kubb/core'
import type { Args } from './commands/generate.ts'
import { executeHooks } from './utils/executeHooks.ts'
import { getErrorCauses } from './utils/getErrorCauses.ts'
import { getSummary } from './utils/getSummary.ts'

import { Presets, SingleBar } from 'cli-progress'
import { logger } from './utils/logger.ts'

type GenerateProps = {
  input?: string
  config: Config
  args: Args
}

export async function generate({ input, config, args }: GenerateProps): Promise<void> {
  const { root = process.cwd(), ...userConfig } = config
  const inputPath = input ?? ('path' in userConfig.input ? userConfig.input.path : undefined)

  logger.logLevel = LogMapper[args.logLevel as keyof typeof LogMapper] || 3
  logger.name = config.name

  if (logger.logLevel !== LogMapper.debug) {
    const progressCache = new Map<string, SingleBar>()

    logger.on('progress_start', ({ id, size, message = '' }) => {
      logger.consola?.pauseLogs()
      const payload = { id, message }
      const progressBar = new SingleBar(
        {
          format: '{percentage}% {bar} {value}/{total} | {message}',
          barsize: 30,
          clearOnComplete: true,
          emptyOnZero: true,
        },
        Presets.shades_grey,
      )

      if (!progressCache.has(id)) {
        progressCache.set(id, progressBar)
        progressBar.start(size, 1, payload)
      }
    })

    logger.on('progress_stop', ({ id }) => {
      progressCache.get(id)?.stop()
      logger.consola?.resumeLogs()
    })

    logger.on('progressed', ({ id, message = '' }) => {
      const payload = { id, message }

      progressCache.get(id)?.increment(1, payload)
    })
  }

  logger.emit('start', `Building ${logger.logLevel !== LogMapper.silent ? c.dim(inputPath) : ''}`)

  const definedConfig: Config = {
    root,
    ...userConfig,
    input: inputPath
      ? {
          ...userConfig.input,
          path: inputPath,
        }
      : userConfig.input,
    output: {
      write: true,
      exportType: 'barrelNamed',
      ...userConfig.output,
    },
  }
  const hrStart = process.hrtime()
  const { pluginManager, files, error } = await safeBuild({
    config: definedConfig,
    logger,
  })

  logger.consola?.start('Writing logs')
  const logFiles = await logger.writeLogs()
  logger.consola?.success(`Written logs: \n${logFiles.join('\n')}`)

  const summary = getSummary({
    filesCreated: files.length,
    pluginManager,
    config: definedConfig,
    status: error ? 'failed' : 'success',
    hrStart,
  })

  if (error && logger.consola) {
    logger.consola?.resumeLogs()
    logger.consola.error(`Build failed ${logger.logLevel !== LogMapper.silent ? c.dim(inputPath) : ''}`)

    logger.consola.box({
      title: `${config.name || ''}`,
      message: summary.join(''),
      style: {
        padding: 2,
        borderColor: 'red',
        borderStyle: 'rounded',
      },
    })

    const errors = getErrorCauses([error])
    if (logger.consola && errors.length && logger.logLevel === LogMapper.debug) {
      errors.forEach((err) => {
        logger.consola?.error(err)
      })
    }

    logger.consola?.error(error)

    process.exit(0)
  }

  if (config.hooks) {
    await executeHooks({ hooks: config.hooks })
  }

  logger.consola?.log(`⚡Build completed ${logger.logLevel !== LogMapper.silent ? c.dim(inputPath) : ''}`)

  logger.consola?.box({
    title: `${config.name || ''}`,
    message: summary.join(''),
    style: {
      padding: 2,
      borderColor: 'green',
      borderStyle: 'rounded',
    },
  })
}
