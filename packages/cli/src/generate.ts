import { LogMapper, createLogger } from '@kubb/core/logger'

import c from 'tinyrainbow'

import { type Config, safeBuild } from '@kubb/core'
import type { Args } from './commands/generate.ts'
import { executeHooks } from './utils/executeHooks.ts'
import { getErrorCauses } from './utils/getErrorCauses.ts'
import { getSummary } from './utils/getSummary.ts'
import { writeLog } from './utils/writeLog.ts'

import { relative } from 'node:path'
import { Presets, SingleBar } from 'cli-progress'

type GenerateProps = {
  input?: string
  config: Config
  args: Args
}

export async function generate({ input, config, args }: GenerateProps): Promise<void> {
  const logLevel = LogMapper[args.logLevel as keyof typeof LogMapper] || 3
  const logger = createLogger({
    logLevel,
    name: config.name,
  })

  const progressBars: Record<string, SingleBar> = {}

  logger.on('progress_start', ({ id, size }) => {
    logger.consola?.pauseLogs()
    if (!progressBars[id]) {
      progressBars[id] = new SingleBar(
        {
          format: logLevel === LogMapper.info ? '{percentage}% {bar} {value}/{total} {id} | {data}' : '{percentage}% {bar} ETA: {eta}s',
          barsize: 25,
          clearOnComplete: true,
        },
        Presets.shades_grey,
      )
      progressBars[id].start(size, 1, { id, data: '' })
    }
  })

  logger.on('progress_stop', ({ id }) => {
    const progressBar = progressBars[id]
    progressBar?.stop()
    logger.consola?.resumeLogs()
  })

  logger.on('progress', ({ id, count, data = '' }) => {
    const progressBar = progressBars[id]
    const payload = { id, data }

    if (count) {
      progressBar?.update(count, payload)
    } else {
      progressBar?.increment(1, payload)
    }
  })

  logger.on('debug', async ({ logs, override, fileName }) => {
    await writeLog({ data: logs.join('\n'), fileName, override })
  })

  const { root = process.cwd(), ...userConfig } = config
  const inputPath = input ?? ('path' in userConfig.input ? userConfig.input.path : undefined)

  logger.emit('start', `Building ${logLevel !== LogMapper.silent ? c.dim(inputPath) : ''}`)

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
      ...userConfig.output,
    },
  }
  const hrStart = process.hrtime()
  const { pluginManager, error } = await safeBuild({
    config: definedConfig,
    logger,
  })

  const summary = getSummary({
    pluginManager,
    config: definedConfig,
    status: error ? 'failed' : 'success',
    hrStart,
    logger,
  })

  if (error && logger.consola) {
    logger.consola.error(`Build failed ${logLevel !== LogMapper.silent ? c.dim(inputPath) : ''}`)

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
    if (logger.consola && errors.length && logLevel === LogMapper.debug) {
      errors.forEach((err) => {
        logger.consola?.error(err)
      })
    }

    logger.consola?.error(error)

    process.exit(0)
  }

  if (config.hooks) {
    await executeHooks({ hooks: config.hooks, logger })
  }

  logger.consola?.log(`⚡Build completed ${logLevel !== LogMapper.silent ? c.dim(inputPath) : ''}`)

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
