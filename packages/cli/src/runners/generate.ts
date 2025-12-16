import path from 'node:path'
import process from 'node:process'
import { type Config, type KubbEvents, LogLevel, safeBuild, setup } from '@kubb/core'
import type { AsyncEventEmitter } from '@kubb/core/utils'
import pc from 'picocolors'
import { executeHooks } from '../utils/executeHooks.ts'
import { getSummary } from '../utils/getSummary.ts'

type GenerateProps = {
  input?: string
  config: Config
  events: AsyncEventEmitter<KubbEvents>
  logLevel: number
}

export async function generate({ input, config, events, logLevel }: GenerateProps): Promise<void> {
  const { root = process.cwd(), ...userConfig } = config
  const inputPath = input ?? ('path' in userConfig.input ? userConfig.input.path : undefined)
  const hrStart = process.hrtime()

  await events.emit('generation:start', config.name)

  await events.emit('info', config.name ? `Loading generation ${pc.bold(config.name)}` : 'Loading generation', inputPath)

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
    events,
  })

  const { files, failedPlugins, pluginTimings, error } = await safeBuild(
    {
      config: definedConfig,
      events,
    },
    { pluginManager, fabric, events },
  )

  const summary = getSummary({
    failedPlugins,
    filesCreated: files.length,
    config: definedConfig,
    status: failedPlugins.size > 0 || error ? 'failed' : 'success',
    hrStart,
    pluginTimings: logLevel >= LogLevel.verbose ? pluginTimings : undefined,
  })

  // Handle build failures (either from failed plugins or general errors)

  const hasFailures = failedPlugins.size > 0 || error
  if (hasFailures) {
    // Collect all errors from failed plugins and general error
    const allErrors: Error[] = [
      error,
      ...Array.from(failedPlugins)
        .filter((it) => it.error)
        .map((it) => it.error),
    ].filter(Boolean)

    allErrors.forEach((err) => {
      events.emit('error', err)
    })

    await events.emit('generation:end', { summary, title: config.name || '', success: false })

    process.exit(1)
  }

  await events.emit('success', 'Generation successfully', inputPath)
  await events.emit('generation:end', { summary, title: config.name || '', success: true })

  // formatting
  if (config.output.format) {
    await events.emit('format:start')

    await events.emit(
      'info',
      [
        `Formatting with ${pc.dim(config.output.format as string)}`,
        logLevel >= LogLevel.info ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}` : undefined,
      ]
        .filter(Boolean)
        .join(' '),
    )

    if (config.output.format === 'prettier') {
      try {
        await events.emit(
          'hook:execute',
          {
            command: 'prettier',
            args: ['--ignore-unknown', '--write', path.resolve(definedConfig.root, definedConfig.output.path)],
          },
          async () => {
            await events.emit(
              'success',
              [
                `Formatting with ${pc.dim(config.output.format as string)}`,
                logLevel >= LogLevel.info ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}` : undefined,
                'successfully',
              ]
                .filter(Boolean)
                .join(' '),
            )
          },
        )
      } catch (e) {
        await events.emit('error', e as Error)
      }

      await events.emit('success', `Formatted with ${config.output.format}`)
    }

    if (config.output.format === 'biome') {
      try {
        await events.emit(
          'hook:execute',
          {
            command: 'biome',
            args: ['format', '--write', path.resolve(definedConfig.root, definedConfig.output.path)],
          },
          async () => {
            await events.emit(
              'success',
              [
                `Formatting with ${pc.dim(config.output.format as string)}`,
                logLevel >= LogLevel.info ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}` : undefined,
                'successfully',
              ]
                .filter(Boolean)
                .join(' '),
            )
          },
        )
      } catch (e) {
        const error = new Error('Biome not found')
        error.cause = e
        await events.emit('error', error)
      }
    }

    await events.emit('format:end')
  }

  // linting
  if (config.output.lint) {
    await events.emit('lint:start')

    await events.emit(
      'info',
      [
        `Linting with ${pc.dim(config.output.lint as string)}`,
        logLevel >= LogLevel.info ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}` : undefined,
      ]
        .filter(Boolean)
        .join(' '),
    )

    if (config.output.lint === 'eslint') {
      try {
        await events.emit(
          'hook:execute',
          {
            command: 'eslint',
            args: [path.resolve(definedConfig.root, definedConfig.output.path), '--fix'],
          },
          async () => {
            await events.emit(
              'success',
              [
                `Linted with ${pc.dim(config.output.lint as string)}`,
                logLevel >= LogLevel.info ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}` : undefined,
                'successfully',
              ]
                .filter(Boolean)
                .join(' '),
            )
          },
        )
      } catch (e) {
        const error = new Error('Eslint not found')
        error.cause = e
        await events.emit('error', error)
      }
    }

    if (config.output.lint === 'biome') {
      try {
        await events.emit(
          'hook:execute',
          {
            command: 'biome',
            args: ['lint', '--fix', path.resolve(definedConfig.root, definedConfig.output.path)],
          },
          async () => {
            await events.emit(
              'success',
              [
                `Linted with ${pc.dim(config.output.lint as string)}`,
                logLevel >= LogLevel.info ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}` : undefined,
                'successfully',
              ]
                .filter(Boolean)
                .join(' '),
            )
          },
        )
      } catch (e) {
        const error = new Error('Biome not found')
        error.cause = e
        await events.emit('error', error)
      }
    }

    if (config.output.lint === 'oxlint') {
      try {
        await events.emit(
          'hook:execute',
          {
            command: 'oxlint',
            args: ['--fix', path.resolve(definedConfig.root, definedConfig.output.path)],
          },
          async () => {
            await events.emit(
              'success',
              [
                `Linted with ${pc.dim(config.output.lint as string)}`,
                logLevel >= LogLevel.info ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}` : undefined,
                'successfully',
              ]
                .filter(Boolean)
                .join(' '),
            )
          },
        )
      } catch (e) {
        const error = new Error('Oxlint not found')
        error.cause = e
        await events.emit('error', error)
      }
    }

    await events.emit('lint:end')
  }

  if (config.hooks) {
    await events.emit('hooks:start')
    await executeHooks({ hooks: config.hooks, logLevel, events })

    await events.emit('hooks:end')
  }
}
