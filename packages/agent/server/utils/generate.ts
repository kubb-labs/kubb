import { createHash } from 'node:crypto'
import path from 'node:path'
import { styleText } from 'node:util'
import { detectFormatter, detectLinter, formatters, linters } from '@internals/utils'
import { type AsyncEventEmitter, type Config, createKubb, type KubbHooks } from '@kubb/core'
import { executeHooks } from './executeHooks.ts'

type GenerateProps = {
  config: Config
  hooks: AsyncEventEmitter<KubbHooks>
}

/**
 * Run a full Kubb code-generation cycle for the given config.
 *
 * Emits lifecycle events on the provided `hooks` emitter so callers (e.g. the WebSocket stream)
 * can forward progress to connected clients.
 * After a successful build, auto-formatting and linting are applied when configured,
 * followed by any user-defined `hooks.done` commands.
 *
 */
export async function generate({ config, hooks }: GenerateProps): Promise<void> {
  await hooks.emit('kubb:generation:start', config)

  await hooks.emit('kubb:info', config.name ? `Setup generation ${config.name}` : 'Setup generation')

  const kubb = createKubb(config, { hooks })
  await kubb.setup()

  await hooks.emit('kubb:info', config.name ? `Build generation ${config.name}` : 'Build generation')

  const { files, failedPlugins, error } = await kubb.safeBuild()

  await hooks.emit('kubb:info', 'Load summary')

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
      hooks.emit('kubb:error', err)
    })

    await hooks.emit('kubb:generation:end', config, files, kubb.sources)

    throw new Error('Generation failed')
  }

  await hooks.emit('kubb:success', 'Generation successfully')
  await hooks.emit('kubb:generation:end', config, files, kubb.sources)

  // formatting
  if (config.output.format) {
    await hooks.emit('kubb:format:start')

    let formatter = config.output.format
    if (formatter === 'auto') {
      const detectedFormatter = await detectFormatter()
      if (!detectedFormatter) {
        await hooks.emit('kubb:warn', 'No formatter found (oxfmt, biome, or prettier). Skipping formatting.')
      } else {
        formatter = detectedFormatter
        await hooks.emit('kubb:info', `Auto-detected formatter: ${formatter}`)
      }
    }

    if (formatter && formatter !== 'auto' && formatter in formatters) {
      const formatterConfig = formatters[formatter as keyof typeof formatters]
      // Use absolute path for output directory
      const outputPath = path.isAbsolute(config.output.path) ? config.output.path : path.resolve(process.cwd(), config.root, config.output.path)

      try {
        const hookId = createHash('sha256').update([config.name, formatter].filter(Boolean).join('-')).digest('hex')
        await hooks.emit('kubb:hook:start', {
          id: hookId,
          command: formatterConfig.command,
          args: formatterConfig.args(outputPath),
        })

        await hooks.onOnce('kubb:hook:end', async ({ success, error }) => {
          if (!success) throw error

          await hooks.emit('kubb:success', `Formatting with ${formatter} successfully`)
        })
      } catch (caughtError) {
        const error = new Error(formatterConfig.errorMessage)
        error.cause = caughtError
        await hooks.emit('kubb:error', error)
      }
    }

    await hooks.emit('kubb:format:end')
  }

  // linting
  if (config.output.lint) {
    await hooks.emit('kubb:lint:start')

    // Detect linter if set to 'auto'
    let linter = config.output.lint
    if (linter === 'auto') {
      const detectedLinter = await detectLinter()
      if (!detectedLinter) {
        await hooks.emit('kubb:warn', 'No linter found (oxlint, biome, or eslint). Skipping linting.')
      } else {
        linter = detectedLinter
        await hooks.emit('kubb:info', `Auto-detected linter: ${styleText('dim', linter)}`)
      }
    }

    // Only proceed with linting if we have a valid linter
    if (linter && linter !== 'auto' && linter in linters) {
      const linterConfig = linters[linter as keyof typeof linters]
      // Use absolute path for output directory
      const outputPath = path.isAbsolute(config.output.path) ? config.output.path : path.resolve(process.cwd(), config.root, config.output.path)

      try {
        const hookId = createHash('sha256').update([config.name, linter].filter(Boolean).join('-')).digest('hex')
        await hooks.emit('kubb:hook:start', {
          id: hookId,
          command: linterConfig.command,
          args: linterConfig.args(outputPath),
        })

        await hooks.onOnce('kubb:hook:end', async ({ success, error }) => {
          if (!success) throw error
        })
      } catch (caughtError) {
        const error = new Error(linterConfig.errorMessage)
        error.cause = caughtError
        await hooks.emit('kubb:error', error)
      }
    }

    await hooks.emit('kubb:lint:end')
  }

  if (config.hooks) {
    await hooks.emit('kubb:hooks:start')
    await executeHooks({ configHooks: config.hooks, hooks })

    await hooks.emit('kubb:hooks:end')
  }
}
