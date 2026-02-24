import { createHash } from 'node:crypto'
import path from 'node:path'
import { type Config, type KubbEvents, safeBuild, setup } from '@kubb/core'
import type { AsyncEventEmitter } from '@kubb/core/utils'
import { detectFormatter, detectLinter, formatters, linters } from '@kubb/core/utils'
import { styleText } from 'node:util'
import { executeHooks } from './executeHooks.ts'

type GenerateProps = {
  config: Config
  events: AsyncEventEmitter<KubbEvents>
}

/**
 * Run a full Kubb code-generation cycle for the given config.
 *
 * Emits lifecycle events on the provided `events` emitter so callers (e.g. the WebSocket stream)
 * can forward progress to connected clients.
 * After a successful build, auto-formatting and linting are applied when configured,
 * followed by any user-defined `hooks.done` commands.
 *
 */
export async function generate({ config, events }: GenerateProps): Promise<void> {
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
      // Use absolute path for output directory
      const outputPath = path.isAbsolute(config.output.path) ? config.output.path : path.resolve(process.cwd(), config.root, config.output.path)

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
        await events.emit('info', `Auto-detected linter: ${styleText('dim', linter)}`)
      }
    }

    // Only proceed with linting if we have a valid linter
    if (linter && linter !== 'auto' && linter in linters) {
      const linterConfig = linters[linter as keyof typeof linters]
      // Use absolute path for output directory
      const outputPath = path.isAbsolute(config.output.path) ? config.output.path : path.resolve(process.cwd(), config.root, config.output.path)

      try {
        const hookId = createHash('sha256').update([config.name, linter].filter(Boolean).join('-')).digest('hex')
        await events.emit('hook:start', {
          id: hookId,
          command: linterConfig.command,
          args: linterConfig.args(outputPath),
        })

        await events.onOnce('hook:end', async ({ success, error }) => {
          if (!success) throw error
        })
      } catch (caughtError) {
        const error = new Error(linterConfig.errorMessage)
        error.cause = caughtError
        await events.emit('error', error)
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
