import { createHash } from 'node:crypto'
import path from 'node:path'
import process from 'node:process'
import { type Config, type KubbEvents, LogLevel, safeBuild, setup } from '@kubb/core'
import type { AsyncEventEmitter } from '@kubb/core/utils'
import pc from 'picocolors'
import { detectFormatter } from '../utils/detectFormatter.ts'
import { detectLinter } from '../utils/detectLinter.ts'
import { executeHooks } from '../utils/executeHooks.ts'
import { formatters } from '../utils/formatters.ts'

type GenerateProps = {
  input?: string
  config: Config
  events: AsyncEventEmitter<KubbEvents>
  logLevel: number
}

export async function generate({ input, config: userConfig, events, logLevel }: GenerateProps): Promise<void> {
  const inputPath = input ?? ('path' in userConfig.input ? userConfig.input.path : undefined)
  const hrStart = process.hrtime()

  const config: Config = {
    ...userConfig,
    root: userConfig.root || process.cwd(),
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

  await events.emit('generation:start', config)

  await events.emit('info', config.name ? `Setup generation ${pc.bold(config.name)}` : 'Setup generation', inputPath)

  const { fabric, pluginManager } = await setup({
    config,
    events,
  })

  await events.emit('info', config.name ? `Build generation ${pc.bold(config.name)}` : 'Build generation', inputPath)

  const { files, failedPlugins, pluginTimings, error } = await safeBuild(
    {
      config,
      events,
    },
    { pluginManager, fabric, events },
  )

  await events.emit('info', 'Load summary')

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

    await events.emit('generation:end', config)

    await events.emit('generation:summary', config, {
      failedPlugins,
      filesCreated: files.length,
      status: failedPlugins.size > 0 || error ? 'failed' : 'success',
      hrStart,
      pluginTimings: logLevel >= LogLevel.verbose ? pluginTimings : undefined,
    })

    process.exit(1)
  }

  await events.emit('success', 'Generation successfully', inputPath)
  await events.emit('generation:end', config)

  // formatting
  if (config.output.format) {
    await events.emit('format:start')

    let formatter = config.output.format
    if (formatter === 'auto') {
      const detectedFormatter = await detectFormatter()
      if (!detectedFormatter) {
        await events.emit('warn', 'No formatter found (biome, prettier, or oxfmt). Skipping formatting.')
      } else {
        formatter = detectedFormatter
        await events.emit('info', `Auto-detected formatter: ${pc.dim(formatter)}`)
      }
    }

    if (formatter && formatter !== 'auto' && formatter in formatters) {
      const formatterConfig = formatters[formatter as keyof typeof formatters]
      const outputPath = path.resolve(config.root, config.output.path)

      try {
        const hookId = createHash('sha256').update([config.name, formatter].filter(Boolean).join('-')).digest('hex')
        await events.emit('hook:start', {
          id: hookId,
          command: formatterConfig.command,
          args: formatterConfig.args(outputPath),
        })

        await events.onOnce('hook:end', async ({ success, error }) => {
          if (!success) throw error

          await events.emit(
            'success',
            [`Formatting with ${pc.dim(formatter)}`, logLevel >= LogLevel.info ? `on ${pc.dim(outputPath)}` : undefined, 'successfully']
              .filter(Boolean)
              .join(' '),
          )
        })
      } catch (caughtError) {
        const error = new Error(formatterConfig.errorMessage)
        error.cause = caughtError
        await events.emit('error', error)
      }
    }

    await events.emit('format:end')
  }

  // linting
  if (config.output.lint) {
    await events.emit('lint:start')

    // Detect linter if set to 'auto'
    let linter = config.output.lint
    if (linter === 'auto') {
      const detectedLinter = await detectLinter()
      if (!detectedLinter) {
        await events.emit('warn', 'No linter found (biome, oxlint, or eslint). Skipping linting.')
      } else {
        linter = detectedLinter
        await events.emit('info', `Auto-detected linter: ${pc.dim(linter)}`)
      }
    }

    // Only proceed with linting if we have a valid linter
    if (linter && linter !== 'auto') {
      await events.emit(
        'info',
        [`Linting with ${pc.dim(linter as string)}`, logLevel >= LogLevel.info ? `on ${pc.dim(path.resolve(config.root, config.output.path))}` : undefined]
          .filter(Boolean)
          .join(' '),
      )

      if (linter === 'eslint') {
        try {
          const hookId = createHash('sha256').update([config.name, linter].filter(Boolean).join('-')).digest('hex')
          await events.emit('hook:start', {
            id: hookId,
            command: 'eslint',
            args: [path.resolve(config.root, config.output.path), '--fix'],
          })

          await events.onOnce('hook:end', async ({ success, error }) => {
            if (!success) {
              throw error
            }

            await events.emit(
              'success',
              [
                `Linted with ${pc.dim(linter as string)}`,
                logLevel >= LogLevel.info ? `on ${pc.dim(path.resolve(config.root, config.output.path))}` : undefined,
                'successfully',
              ]
                .filter(Boolean)
                .join(' '),
            )
          })
        } catch (caughtError) {
          const error = new Error('Eslint not found')
          error.cause = caughtError
          await events.emit('error', error)
        }
      }

      if (linter === 'biome') {
        try {
          const hookId = createHash('sha256').update([config.name, linter].filter(Boolean).join('-')).digest('hex')
          await events.emit('hook:start', {
            id: hookId,
            command: 'biome',
            args: ['lint', '--fix', path.resolve(config.root, config.output.path)],
          })

          await events.onOnce('hook:end', async ({ success, error }) => {
            if (!success) {
              throw error
            }

            await events.emit(
              'success',
              [
                `Linted with ${pc.dim(linter as string)}`,
                logLevel >= LogLevel.info ? `on ${pc.dim(path.resolve(config.root, config.output.path))}` : undefined,
                'successfully',
              ]
                .filter(Boolean)
                .join(' '),
            )
          })
        } catch (caughtError) {
          const error = new Error('Biome not found')
          error.cause = caughtError
          await events.emit('error', error)
        }
      }

      if (linter === 'oxlint') {
        try {
          const hookId = createHash('sha256').update([config.name, linter].filter(Boolean).join('-')).digest('hex')
          await events.emit('hook:start', {
            id: hookId,
            command: 'oxlint',
            args: ['--fix', path.resolve(config.root, config.output.path)],
          })

          await events.onOnce('hook:end', async ({ success, error }) => {
            if (!success) {
              throw error
            }

            await events.emit(
              'success',
              [
                `Linted with ${pc.dim(linter as string)}`,
                logLevel >= LogLevel.info ? `on ${pc.dim(path.resolve(config.root, config.output.path))}` : undefined,
                'successfully',
              ]
                .filter(Boolean)
                .join(' '),
            )
          })
        } catch (caughtError) {
          const error = new Error('Oxlint not found')
          error.cause = caughtError

          await events.emit('error', error)
        }
      }
    }

    await events.emit('lint:end')
  }

  if (config.hooks) {
    await events.emit('hooks:start')
    await executeHooks({ hooks: config.hooks, events })

    await events.emit('hooks:end')
  }

  await events.emit('generation:summary', config, {
    failedPlugins,
    filesCreated: files.length,
    status: failedPlugins.size > 0 || error ? 'failed' : 'success',
    hrStart,
    pluginTimings,
  })
}
