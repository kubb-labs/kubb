import path from 'node:path'
import process from 'node:process'
import { type Config, safeBuild, setup } from '@kubb/core'
import { createLogger, LogMapper } from '@kubb/core/logger'
import boxen from 'boxen'
import { execa } from 'execa'
import pc from 'picocolors'
import type { Args } from '../commands/generate.ts'
import { executeHooks } from '../utils/executeHooks.ts'
import { getSummary } from '../utils/getSummary.ts'
import { ProgressManager } from '../utils/progressManager.ts'

type GenerateProps = {
  input?: string
  config: Config
  args: Args
}

export async function generate({ input, config, args }: GenerateProps): Promise<void> {
  const hrStart = process.hrtime()
  const logLevel = LogMapper[args.logLevel as keyof typeof LogMapper] || 3

  const logger = createLogger({
    logLevel,
    name: config.name,
  })

  const { root = process.cwd(), ...userConfig } = config
  const inputPath = input ?? ('path' in userConfig.input ? userConfig.input.path : undefined)

  // Initialize progress manager
  const progressManager = new ProgressManager(logLevel)

  // Track schema loading
  progressManager.startSchemaLoading()

  // Set up plugin tracking
  if (logger.logLevel !== LogMapper.debug) {
    logger.on('plugin_start', ({ pluginName }) => {
      progressManager.startPlugin(pluginName)
    })

    logger.on('plugin_end', ({ pluginName, duration }) => {
      progressManager.completePlugin(pluginName, duration)
    })

    logger.on('progress_start', ({ id, size }) => {
      if (id === 'files') {
        progressManager.startFileGeneration(size)
      }
    })

    logger.on('progressed', ({ id }) => {
      if (id === 'files') {
        progressManager.updateFileGeneration()
      }
    })

    logger.on('progress_stop', ({ id }) => {
      if (id === 'files') {
        progressManager.completeFileGeneration()
      }
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

  const { fabric, pluginManager } = await setup({
    config: definedConfig,
    logger,
  })

  // Initialize plugin names for progress tracking
  const pluginNames = pluginManager.plugins.map(p => p.name)
  progressManager.initPlugins(pluginNames)
  
  progressManager.completeSchemaLoading()

  logger.emit('start', `Building ${logger.logLevel !== LogMapper.silent ? pc.dim(inputPath!) : ''}`)

  const { files, failedPlugins, pluginTimings, error } = await safeBuild(
    {
      config: definedConfig,
      logger,
    },
    { pluginManager, fabric, logger },
  )

  // Finish progress tracking
  progressManager.finish()

  if (logger.logLevel >= LogMapper.debug) {
    console.log('⏳ Writing logs')

    await logger.writeLogs()

    console.log('✅ Written logs')
  }

  const summary = getSummary({
    failedPlugins,
    filesCreated: files.length,
    config: definedConfig,
    status: failedPlugins.size > 0 || error ? 'failed' : 'success',
    hrStart,
    pluginTimings: logger.logLevel >= LogMapper.verbose ? pluginTimings : undefined,
  })

  // Handle build failures (either from failed plugins or general errors)
  const hasFailures = failedPlugins.size > 0 || error

  if (hasFailures) {
    console.log(`✗  Build failed ${logger.logLevel !== LogMapper.silent ? pc.dim(inputPath!) : ''}`)

    // Collect all errors from failed plugins and general error
    const allErrors: Error[] = [
      error,
      ...Array.from(failedPlugins)
        .filter((it) => it.error)
        .map((it) => it.error),
    ].filter(Boolean)

    allErrors.forEach((err) => {
      // Display error causes in debug mode
      if (logger.logLevel >= LogMapper.debug && err.cause) {
        console.error(err.cause)
      }

      console.error(err)
    })

    const box = boxen(summary.join(''), {
      title: config.name || '',
      padding: 1,
      borderColor: 'red',
      borderStyle: 'round',
    })
    console.log(box)

    process.exit(1)
  }

  // formatting
  if (config.output.format === 'prettier') {
    logger?.emit('start', `Formatting with ${config.output.format}`)
    logger?.emit('debug', {
      date: new Date(),
      logs: [`Running prettier on ${path.resolve(definedConfig.root, definedConfig.output.path)}`],
    })

    try {
      await execa('prettier', ['--ignore-unknown', '--write', path.resolve(definedConfig.root, definedConfig.output.path)])
      logger?.emit('debug', {
        date: new Date(),
        logs: ['Prettier formatting completed successfully'],
      })
    } catch (e) {
      console.warn('⚠️  Prettier not found')
      console.error(e)
      logger?.emit('debug', {
        date: new Date(),
        logs: [`Prettier formatting failed: ${(e as Error).message}`],
      })
    }

    logger?.emit('success', `Formatted with ${config.output.format}`)
  }

  if (config.output.format === 'biome') {
    logger?.emit('start', `Formatting with ${config.output.format}`)
    logger?.emit('debug', {
      date: new Date(),
      logs: [`Running biome format on ${path.resolve(definedConfig.root, definedConfig.output.path)}`],
    })

    try {
      await execa('biome', ['format', '--write', path.resolve(definedConfig.root, definedConfig.output.path)])
      logger?.emit('debug', {
        date: new Date(),
        logs: ['Biome formatting completed successfully'],
      })
    } catch (e) {
      console.warn('⚠️  Biome not found')
      console.error(e)
      logger?.emit('debug', {
        date: new Date(),
        logs: [`Biome formatting failed: ${(e as Error).message}`],
      })
    }

    logger?.emit('success', `Formatted with ${config.output.format}`)
  }

  // linting
  if (config.output.lint === 'eslint') {
    logger?.emit('start', `Linting with ${config.output.lint}`)
    logger?.emit('debug', {
      date: new Date(),
      logs: [`Running eslint on ${path.resolve(definedConfig.root, definedConfig.output.path)}`],
    })

    try {
      await execa('eslint', [path.resolve(definedConfig.root, definedConfig.output.path), '--fix'])
      logger?.emit('debug', {
        date: new Date(),
        logs: ['ESLint linting completed successfully'],
      })
    } catch (e) {
      console.warn('⚠️  Eslint not found')
      console.error(e)
      logger?.emit('debug', {
        date: new Date(),
        logs: [`ESLint linting failed: ${(e as Error).message}`],
      })
    }

    logger?.emit('success', `Linted with ${config.output.lint}`)
  }

  if (config.output.lint === 'biome') {
    logger?.emit('start', `Linting with ${config.output.lint}`)
    logger?.emit('debug', {
      date: new Date(),
      logs: [`Running biome lint on ${path.resolve(definedConfig.root, definedConfig.output.path)}`],
    })

    try {
      await execa('biome', ['lint', '--fix', path.resolve(definedConfig.root, definedConfig.output.path)])
      logger?.emit('debug', {
        date: new Date(),
        logs: ['Biome linting completed successfully'],
      })
    } catch (e) {
      console.warn('⚠️  Biome not found')
      console.error(e)
      logger?.emit('debug', {
        date: new Date(),
        logs: [`✗ Biome linting failed: ${(e as Error).message}`],
      })
    }

    logger?.emit('success', `Linted with ${config.output.lint}`)
  }

  if (config.output.lint === 'oxlint') {
    logger?.emit('start', `Linting with ${config.output.lint}`)
    logger?.emit('debug', {
      date: new Date(),
      logs: [`Running oxlint on ${path.resolve(definedConfig.root, definedConfig.output.path)}`],
    })

    try {
      await execa('oxlint', ['--fix', path.resolve(definedConfig.root, definedConfig.output.path)])
      logger?.emit('debug', {
        date: new Date(),
        logs: ['Oxlint linting completed successfully'],
      })
    } catch (e) {
      console.warn('⚠️  Oxlint not found')
      console.error(e)
      logger?.emit('debug', {
        date: new Date(),
        logs: [`✗ Oxlint linting failed: ${(e as Error).message}`],
      })
    }

    logger?.emit('success', `Linted with ${config.output.lint}`)
  }

  if (config.hooks) {
    await executeHooks({ hooks: config.hooks, logger })
  }

  console.log(`⚡ Build completed ${logger.logLevel !== LogMapper.silent ? pc.dim(inputPath!) : ''}`)
  
  const box = boxen(summary.join(''), {
    title: config.name || '',
    padding: 1,
    borderColor: 'green',
    borderStyle: 'round',
  })
  console.log(box)
}
