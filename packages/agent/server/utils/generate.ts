import { createHash } from 'node:crypto'
import path from 'node:path'
import { type Config, type KubbEvents, safeBuild, setup } from '@kubb/core'
import type { AsyncEventEmitter } from '@kubb/core/utils'
import { detectFormatter } from './detectFormatter.ts'
import { detectLinter } from './detectLinter.ts'
import { executeHooks } from './executeHooks.ts'
import { formatters } from './formatters.ts'

type GenerateProps = {
  root: string
  config: Config
  events: AsyncEventEmitter<KubbEvents>
}

export async function generate({ root, config: userConfig, events }: GenerateProps): Promise<void> {
  const config: Config = {
    ...userConfig,
    root,
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

  await events.emit('info', config.name ? `Setup generation ${config.name}` : 'Setup generation')

  const { sources, fabric, pluginManager } = await setup({
    config,
    events,
  })

  await events.emit('info', config.name ? `Build generation ${config.name}` : 'Build generation')

  const { files, failedPlugins, error } = await safeBuild(
    {
      config,
      events,
    },
    { pluginManager, fabric, events, sources },
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

    await events.emit('generation:end', config, files, sources)

    throw new Error('Generation failed')
  }

  await events.emit('success', 'Generation successfully')
  await events.emit('generation:end', config, files, sources)

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
        await events.emit('info', `Auto-detected formatter: ${formatter}`)
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

          await events.emit('success', `Formatting with ${formatter} successfully`)
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
        await events.emit('info', `Auto-detected linter: ${linter}`)
      }
    }

    // Only proceed with linting if we have a valid linter
    if (linter && linter !== 'auto') {
      await events.emit('info', `Linting with ${linter}`)

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

            await events.emit('success', 'Linted with eslint successfully')
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

            await events.emit('success', 'Linted with biome successfully')
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

            await events.emit('success', 'Linted with oxlint successfully')
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
}
