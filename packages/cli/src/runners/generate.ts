import path from 'node:path'
import process from 'node:process'
import * as clack from '@clack/prompts'
import { type Config, safeBuild, setup } from '@kubb/core'
import { type Logger, LogMapper } from '@kubb/core/logger'

import { execa } from 'execa'
import pc from 'picocolors'
import { executeHooks } from '../utils/executeHooks.ts'
import { getSummary } from '../utils/getSummary.ts'
import { ClackWritable } from '../utils/Writables.ts'

type GenerateProps = {
  input?: string
  config: Config
  logger: Logger
}

export async function generate({ input, config, logger }: GenerateProps): Promise<void> {
  const { root = process.cwd(), ...userConfig } = config
  const inputPath = input ?? ('path' in userConfig.input ? userConfig.input.path : undefined)
  const hrStart = process.hrtime()

  logger.emit(
    'start',
    [
      config.name ? `Generation started ${pc.dim(config.name)}` : 'Generation started',
      logger.logLevel > LogMapper.silent ? `for ${pc.dim(inputPath)}` : undefined,
    ]
      .filter(Boolean)
      .join(' '),
  )

  if (logger.logLevel !== LogMapper.debug) {
    logger.on('plugin:start', () => {
      // start of plugin
    })

    logger.on('plugin:end', () => {
      // end of plugin
    })

    logger.on('progress:start', ({ id, size: _size }) => {
      if (id === 'files') {
        //start file generation
      }
    })

    logger.on('progressed', ({ id }) => {
      if (id === 'files') {
        // file generation progressed
      }
    })

    logger.on('progress:stop', ({ id }) => {
      if (id === 'files') {
        //progres stop
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

  const { files, failedPlugins, pluginTimings, error } = await safeBuild(
    {
      config: definedConfig,
      logger,
    },
    { pluginManager, fabric, logger },
  )

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

    clack.box(summary.join(''), config.name || '', {
      width: 'auto',
      formatBorder: pc.red,
      rounded: true,
      withGuide: false,
      contentAlign: 'left',
      titleAlign: 'center',
    })

    process.exit(1)
  }

  logger.emit('stop', `Build completed ${logger.logLevel !== LogMapper.silent ? pc.dim(inputPath!) : ''}`)

  // formatting
  if (config.output.format) {
    logger.emit('start', 'Formatting started')

    const formatLogger = clack.taskLog({
      title: [
        `Formatting with ${pc.dim(config.output.format)}`,
        logger.logLevel > LogMapper.silent ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}` : undefined,
      ]
        .filter(Boolean)
        .join(' '),
    })
    const formatWritable = new ClackWritable(formatLogger)

    if (config.output.format === 'prettier') {
      try {
        const result = await execa('prettier', ['--ignore-unknown', '--write', path.resolve(definedConfig.root, definedConfig.output.path)], {
          detached: true,
          stdout: logger?.logLevel === LogMapper.silent ? undefined : ['pipe', formatWritable],
          stripFinalNewline: true,
        })

        formatLogger.success(
          [
            `Formatting with ${pc.dim(config.output.format)}`,
            logger.logLevel > LogMapper.silent ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}` : undefined,
            'successfully',
          ]
            .filter(Boolean)
            .join(' '),
        )
        formatLogger.message(result.stdout)
      } catch (e) {
        logger.emit('error', 'Biome not found', e as Error)
      }

      logger?.emit('success', `Formatted with ${config.output.format}`)
    }

    if (config.output.format === 'biome') {
      try {
        const result = await execa('biome', ['format', '--write', path.resolve(definedConfig.root, definedConfig.output.path)], {
          detached: true,
          stdout: logger?.logLevel === LogMapper.silent ? undefined : ['pipe', formatWritable],
          stripFinalNewline: true,
        })

        formatLogger.success(
          [
            `Formatting with ${pc.dim(config.output.format)}`,
            logger.logLevel > LogMapper.silent ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}` : undefined,
            'successfully',
          ]
            .filter(Boolean)
            .join(' '),
        )
        formatLogger.message(result.stdout)
      } catch (e) {
        logger.emit('error', 'Biome not found', e as Error)
      }
    }

    logger.emit('stop', 'Formatting completed')
  }

  // linting
  if (config.output.lint) {
    logger.emit('start', 'Linting started')

    const lintLogger = clack.taskLog({
      title: [
        `Linting with ${pc.dim(config.output.lint)}`,
        logger.logLevel > LogMapper.silent ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}` : undefined,
      ]
        .filter(Boolean)
        .join(' '),
    })
    const lintWritable = new ClackWritable(lintLogger)

    if (config.output.lint === 'eslint') {
      try {
        const result = await execa('eslint', [path.resolve(definedConfig.root, definedConfig.output.path), '--fix'], {
          detached: true,
          stdout: logger?.logLevel === LogMapper.silent ? undefined : ['pipe', lintWritable],
          stripFinalNewline: true,
        })

        lintLogger.success(
          [
            `Linted with ${pc.dim(config.output.lint)}`,
            logger.logLevel > LogMapper.silent ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}` : undefined,
            'successfully',
          ]
            .filter(Boolean)
            .join(' '),
        )
        lintLogger.message(result.stdout)
      } catch (e) {
        logger.emit('error', 'Eslint not found', e as Error)
      }
    }

    if (config.output.lint === 'biome') {
      try {
        const result = await execa('biome', ['lint', '--fix', path.resolve(definedConfig.root, definedConfig.output.path)], {
          detached: true,
          stdout: logger?.logLevel === LogMapper.silent ? undefined : ['pipe', lintWritable],
          stripFinalNewline: true,
        })

        lintLogger.success(
          [
            `Linted with ${pc.dim(config.output.lint)}`,
            logger.logLevel > LogMapper.silent ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}` : undefined,
            'successfully',
          ]
            .filter(Boolean)
            .join(' '),
        )
        lintLogger.message(result.stdout)
      } catch (e) {
        logger.emit('error', 'Biome not found', e as Error)
      }
    }

    if (config.output.lint === 'oxlint') {
      try {
        const result = await execa('oxlint', ['--fix', path.resolve(definedConfig.root, definedConfig.output.path)], {
          detached: true,
          stdout: logger?.logLevel === LogMapper.silent ? undefined : ['pipe', lintWritable],
          stripFinalNewline: true,
        })

        lintLogger.success(
          [
            `Linted with ${pc.dim(config.output.lint)}`,
            logger.logLevel > LogMapper.silent ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}` : undefined,
            'successfully',
          ]
            .filter(Boolean)
            .join(' '),
        )
        lintLogger.message(result.stdout)
      } catch (e) {
        logger.emit('error', 'Oxlint not found', e as Error)
      }
    }

    logger?.emit('stop', 'Linting completed')
  }

  if (config.hooks) {
    logger.emit('start', 'Hooks started')
    await executeHooks({ hooks: config.hooks, logger })

    logger?.emit('stop', 'Hooks completed')
  }

  clack.box(summary.join(''), config.name || '', {
    width: 'auto',
    formatBorder: pc.green,
    rounded: true,
    withGuide: false,
    contentAlign: 'left',
    titleAlign: 'center',
  })
}
