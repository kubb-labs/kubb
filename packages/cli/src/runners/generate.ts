import path from 'node:path'
import process from 'node:process'
import { type Config, safeBuild, setup } from '@kubb/core'
import { createLogger, LogMapper } from '@kubb/core/logger'
import { Presets, SingleBar } from 'cli-progress'
import { execa } from 'execa'
import pc from 'picocolors'
import type { Args } from '../commands/generate.ts'
import { executeHooks } from '../utils/executeHooks.ts'
import { getErrorCauses } from '../utils/getErrorCauses.ts'
import { getSummary } from '../utils/getSummary.ts'

type GenerateProps = {
  input?: string
  config: Config
  args: Args
  progressCache: Map<string, SingleBar>
}

export async function generate({ input, config, progressCache, args }: GenerateProps): Promise<void> {
  const hrStart = process.hrtime()
  const logLevel = LogMapper[args.logLevel as keyof typeof LogMapper] || 3

  const logger = createLogger({
    logLevel,
    name: config.name,
  })

  const { root = process.cwd(), ...userConfig } = config
  const inputPath = input ?? ('path' in userConfig.input ? userConfig.input.path : undefined)

  if (logger.logLevel !== LogMapper.debug) {
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
      barrelType: 'named',
      extension: {
        '.ts': '.ts',
      },
      format: 'prettier',
      ...userConfig.output,
    },
  }

  const { app, pluginManager } = await setup({
    config: definedConfig,
    logger,
  })

  logger.emit('start', `Building ${logger.logLevel !== LogMapper.silent ? pc.dim(inputPath!) : ''}`)

  const { files, error } = await safeBuild(
    {
      config: definedConfig,
      logger,
    },
    { pluginManager, app },
  )

  if (logger.logLevel === LogMapper.debug) {
    logger.consola?.start('Writing logs')

    const logFiles = await logger.writeLogs()

    logger.consola?.success(`Written logs: \n${logFiles.join('\n')}`)
  }

  const summary = getSummary({
    filesCreated: files.length,
    pluginManager,
    config: definedConfig,
    status: error ? 'failed' : 'success',
    hrStart,
  })

  if (error && logger.consola) {
    logger.consola?.resumeLogs()
    logger.consola.error(`Build failed ${logger.logLevel !== LogMapper.silent ? pc.dim(inputPath!) : ''}`)

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

    process.exit(1)
  }

  // formatting
  if (config.output.format === 'prettier') {
    logger?.emit('start', `Formatting with ${config.output.format}`)

    try {
      await execa('prettier', ['--ignore-unknown', '--write', path.resolve(definedConfig.root, definedConfig.output.path)])
    } catch (e) {
      logger.consola?.warn('Prettier not found')
      logger.consola?.error(e)
    }

    logger?.emit('success', `Formatted with ${config.output.format}`)
  }

  if (config.output.format === 'biome') {
    logger?.emit('start', `Formatting with ${config.output.format}`)

    try {
      await execa('biome', ['format', '--write', path.resolve(definedConfig.root, definedConfig.output.path)])
    } catch (e) {
      logger.consola?.warn('Biome not found')
      logger.consola?.error(e)
    }

    logger?.emit('success', `Formatted with ${config.output.format}`)
  }

  // linting
  if (config.output.lint === 'eslint') {
    logger?.emit('start', `Linting with ${config.output.format}`)

    try {
      await execa('eslint', [path.resolve(definedConfig.root, definedConfig.output.path), '--fix'])
    } catch (e) {
      logger.consola?.warn('Eslint not found')
      logger.consola?.error(e)
    }

    logger?.emit('success', `Linted with ${config.output.format}`)
  }

  if (config.output.lint === 'biome') {
    logger?.emit('start', `Linting with ${config.output.format}`)

    try {
      await execa('biome', ['lint', '--fix', path.resolve(definedConfig.root, definedConfig.output.path)])
    } catch (e) {
      logger.consola?.warn('Biome not found')
      logger.consola?.error(e)
    }

    logger?.emit('success', `Linted with ${config.output.format}`)
  }

  if (config.output.lint === 'oxlint') {
    logger?.emit('start', `Linting with ${config.output.format}`)

    try {
      await execa('oxlint', ['--fix', path.resolve(definedConfig.root, definedConfig.output.path)])
    } catch (e) {
      logger.consola?.warn('Oxlint not found')
      logger.consola?.error(e)
    }

    logger?.emit('success', `Linted with ${config.output.format}`)
  }

  if (config.hooks) {
    await executeHooks({ hooks: config.hooks, logger })
  }

  logger.consola?.log(`⚡Build completed ${logger.logLevel !== LogMapper.silent ? pc.dim(inputPath!) : ''}`)

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
