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
import { ProgressManager } from '../utils/progressManager.ts'

type GenerateProps = {
  input?: string
  config: Config
  args: Args
  progressCache: Map<string, SingleBar>
  progressManager?: ProgressManager
}

/**
 * Get emoji for plugin based on its name
 */
function getPluginEmoji(pluginName: string): string {
  if (pluginName.includes('ts') || pluginName.includes('typescript')) return '🔷'
  if (pluginName.includes('swagger') || pluginName.includes('oas')) return '📋'
  if (pluginName.includes('client')) return '📦'
  if (pluginName.includes('react-query')) return '🖼️'
  if (pluginName.includes('vue-query')) return '🖼️'
  if (pluginName.includes('solid-query')) return '🖼️'
  if (pluginName.includes('svelte-query')) return '🖼️'
  if (pluginName.includes('swr')) return '🖼️'
  if (pluginName.includes('zod')) return '🧩'
  if (pluginName.includes('faker')) return '🎲'
  if (pluginName.includes('msw')) return '🔧'
  return '🔧'
}

/**
 * Get emoji for progress based on id and message
 */
function getProgressEmoji(id: string, message: string): string {
  if (id === 'files' || message.toLowerCase().includes('file')) return '🖼️'
  if (id === 'plugins' || message.toLowerCase().includes('plugin')) return '🔧'
  if (message.toLowerCase().includes('schema')) return '📋'
  if (message.toLowerCase().includes('type')) return '🧩'
  if (message.toLowerCase().includes('client')) return '📦'
  return '⏳'
}

export async function generate({ input, config, progressCache, args, progressManager: existingProgressManager }: GenerateProps): Promise<void> {
  const hrStart = process.hrtime()
  const logLevel = LogMapper[args.logLevel as keyof typeof LogMapper] || 3

  const logger = createLogger({
    logLevel,
    name: config.name,
  })

  const { root = process.cwd(), ...userConfig } = config
  const inputPath = input ?? ('path' in userConfig.input ? userConfig.input.path : undefined)

  // Create progress manager (reuse if provided, otherwise create new)
  const progressManager = existingProgressManager || new ProgressManager(logger.logLevel === LogMapper.debug)

  if (logger.logLevel !== LogMapper.debug) {
    // Handle plugin-level progress
    logger.on('plugin_start', ({ pluginName }) => {
      // Each plugin gets its own progress tracker
      const emoji = getPluginEmoji(pluginName)
      progressManager.start(`plugin:${pluginName}`, {
        total: 1,
        message: `${pluginName}...`,
        emoji,
      })
    })

    logger.on('plugin_end', ({ pluginName, duration }) => {
      progressManager.stop(`plugin:${pluginName}`, {
        success: true,
        finalMessage: `${pluginName} (${duration}ms)`,
      })
    })

    logger.on('progress_start', ({ id, size, message = '' }) => {
      // Use Clack progress manager instead of cli-progress
      const emoji = getProgressEmoji(id, message)
      progressManager.start(id, { total: size, message, emoji })
      
      // Keep legacy behavior for backward compatibility
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
      // Stop Clack progress
      progressManager.stop(id)
      
      // Keep legacy behavior
      progressCache.get(id)?.stop()
      logger.consola?.resumeLogs()
    })

    logger.on('progressed', ({ id, message = '' }) => {
      // Update Clack progress
      progressManager.update(id, message)
      
      // Keep legacy behavior
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

  const { fabric, pluginManager } = await setup({
    config: definedConfig,
    logger,
  })

  logger.emit('start', `Building ${logger.logLevel !== LogMapper.silent ? pc.dim(inputPath!) : ''}`)

  const { files, failedPlugins, pluginTimings, error } = await safeBuild(
    {
      config: definedConfig,
      logger,
    },
    { pluginManager, fabric },
  )

  if (logger.logLevel >= LogMapper.debug) {
    logger.consola?.start('Writing logs')

    const logFiles = await logger.writeLogs()

    logger.consola?.success(`Written logs: \n${logFiles.join('\n')}`)
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

  if (hasFailures && logger.consola) {
    logger.consola?.resumeLogs()
    logger.consola?.error(`Build failed ${logger.logLevel !== LogMapper.silent ? pc.dim(inputPath!) : ''}`)

    logger.consola?.box({
      title: `${config.name || ''}`,
      message: summary.join(''),
      style: {
        padding: 2,
        borderColor: 'red',
        borderStyle: 'rounded',
      },
    })

    // Collect all errors from failed plugins and general error
    const allErrors: Error[] = []

    if (failedPlugins.size > 0) {
      allErrors.push(
        ...Array.from(failedPlugins)
          .filter((it) => it.error)
          .map((it) => it.error),
      )
    }

    if (error) {
      allErrors.push(error)
    }

    // Display error causes in debug mode
    if (logger.logLevel >= LogMapper.debug) {
      const errorCauses = getErrorCauses(allErrors)
      errorCauses.forEach((err) => {
        logger.consola?.error(err)
      })
    }

    // Display individual errors
    allErrors.forEach((err) => {
      logger.consola?.error(err)
    })

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
      logger.consola?.warn('Prettier not found')
      logger.consola?.error(e)
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
      logger.consola?.warn('Biome not found')
      logger.consola?.error(e)
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
      logger.consola?.warn('Eslint not found')
      logger.consola?.error(e)
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
      logger.consola?.warn('Biome not found')
      logger.consola?.error(e)
      logger?.emit('debug', {
        date: new Date(),
        logs: [`Biome linting failed: ${(e as Error).message}`],
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
      logger.consola?.warn('Oxlint not found')
      logger.consola?.error(e)
      logger?.emit('debug', {
        date: new Date(),
        logs: [`Oxlint linting failed: ${(e as Error).message}`],
      })
    }

    logger?.emit('success', `Linted with ${config.output.lint}`)
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
