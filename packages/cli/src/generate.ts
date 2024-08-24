import { createLogger } from '@kubb/core/logger'

import c from 'tinyrainbow'

import { type Config, safeBuild } from '@kubb/core'
import type { Args } from './commands/generate.ts'
import { executeHooks } from './utils/executeHooks.ts'
import { getErrorCauses } from './utils/getErrorCauses.ts'
import { getSummary } from './utils/getSummary.ts'
import { writeLog } from './utils/writeLog.ts'
import { LogMapper } from '@kubb/core/logger'

import { MultiBar, Presets } from 'cli-progress'

type GenerateProps = {
  input?: string
  config: Config
  args: Args
}

export function createMultiProgressBar() {
  return new MultiBar(
    {
      format: 'progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
      barsize: 40,
      fps: 5,
      stream: process.stderr,
      clearOnComplete: true,
    },
    Presets.shades_grey,
  )
}

export async function generate({ input, config, args }: GenerateProps): Promise<void> {
  const logLevel = LogMapper[args.logLevel as keyof typeof LogMapper] || 3
  const logger = createLogger({
    logLevel,
    name: config.name,
  })

  // const progress = createMultiProgressBar()
  // let progressFiles: any
  //
  // logger.on('progress', (count, size) => {
  //   if (count === 0) {
  //     progressFiles = progress.create(size, 0)
  //   }
  //   progressFiles.update(count)
  //   if (count === size) {
  //     progressFiles.stop()
  //   }
  // })

  logger.on('debug', async (messages: string[]) => {
    await writeLog(messages.join('\n'))
  })

  const { root = process.cwd(), ...userConfig } = config
  const inputPath = input ?? ('path' in userConfig.input ? userConfig.input.path : undefined)

  logger.emit('start', `🚀 Building ${logLevel !== LogMapper.silent ? c.dim(inputPath) : ''}`)

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
    logger.consola.error(`🚀 Build failed ${logLevel !== LogMapper.silent ? c.dim(inputPath) : ''}`)

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

  logger.consola?.success(`🚀 Build completed ${logLevel !== LogMapper.silent ? c.dim(inputPath) : ''}`)

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
