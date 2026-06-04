import { hash } from 'node:crypto'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { detectFormatter, detectLinter, formatters, linters } from '@internals/utils'
import { type AsyncEventEmitter, type Config, createKubb, Diagnostics, type KubbHooks } from '@kubb/core'
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
  const hrStart = process.hrtime()

  await hooks.emit('kubb:generation:start', { config })

  await hooks.emit('kubb:info', { message: config.name ? `Setup generation ${config.name}` : 'Setup generation' })

  const kubb = createKubb(config, { hooks })
  await kubb.setup()

  await hooks.emit('kubb:info', { message: config.name ? `Build generation ${config.name}` : 'Build generation' })

  const { files, diagnostics } = await kubb.safeBuild()

  await hooks.emit('kubb:info', { message: 'Load summary' })

  // Core only collects diagnostics now, so render each problem once here. Without this, warnings
  // and info reported through `ctx.warn`/`ctx.info` would never reach the client.
  for (const diagnostic of diagnostics) {
    if (!Diagnostics.isProblem(diagnostic)) continue
    if (diagnostic.severity === 'error') {
      await hooks.emit('kubb:error', { error: diagnostic.cause ?? new Diagnostics.Error(diagnostic) })
    } else if (diagnostic.severity === 'warning') {
      await hooks.emit('kubb:warn', { message: diagnostic.message })
    } else {
      await hooks.emit('kubb:info', { message: diagnostic.message })
    }
  }

  if (Diagnostics.hasError(diagnostics)) {
    await hooks.emit('kubb:generation:end', { config, storage: kubb.storage, diagnostics, filesCreated: files.length, status: 'failed', hrStart })

    throw new Error('Generation failed')
  }

  await hooks.emit('kubb:success', { message: 'Generation successfully' })
  await hooks.emit('kubb:generation:end', { config, storage: kubb.storage, diagnostics, filesCreated: files.length, status: 'success', hrStart })

  // formatting
  if (config.output.format) {
    await hooks.emit('kubb:format:start')

    let formatter = config.output.format
    if (formatter === 'auto') {
      const detectedFormatter = await detectFormatter()
      if (!detectedFormatter) {
        await hooks.emit('kubb:warn', { message: 'No formatter found (oxfmt, biome, or prettier). Skipping formatting.' })
      } else {
        formatter = detectedFormatter
        await hooks.emit('kubb:info', { message: `Auto-detected formatter: ${formatter}` })
      }
    }

    if (formatter && formatter !== 'auto' && formatter in formatters) {
      const formatterConfig = formatters[formatter as keyof typeof formatters]
      // Use absolute path for output directory
      const outputPath = path.isAbsolute(config.output.path) ? config.output.path : path.resolve(process.cwd(), config.root, config.output.path)

      try {
        const hookId = hash('sha256', [config.name, formatter].filter(Boolean).join('-'), 'hex')
        await hooks.emit('kubb:hook:start', {
          id: hookId,
          command: formatterConfig.command,
          args: formatterConfig.args(outputPath),
        })

        await hooks.onOnce('kubb:hook:end', async (ctx) => {
          if (!ctx.success) throw ctx.error

          await hooks.emit('kubb:success', { message: `Formatting with ${formatter} successfully` })
        })
      } catch (caughtError) {
        const error = new Error(formatterConfig.errorMessage)
        error.cause = caughtError
        await hooks.emit('kubb:error', { error })
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
        await hooks.emit('kubb:warn', { message: 'No linter found (oxlint, biome, or eslint). Skipping linting.' })
      } else {
        linter = detectedLinter
        await hooks.emit('kubb:info', { message: `Auto-detected linter: ${styleText('dim', linter)}` })
      }
    }

    // Only proceed with linting if we have a valid linter
    if (linter && linter !== 'auto' && linter in linters) {
      const linterConfig = linters[linter as keyof typeof linters]
      // Use absolute path for output directory
      const outputPath = path.isAbsolute(config.output.path) ? config.output.path : path.resolve(process.cwd(), config.root, config.output.path)

      try {
        const hookId = hash('sha256', [config.name, linter].filter(Boolean).join('-'), 'hex')
        await hooks.emit('kubb:hook:start', {
          id: hookId,
          command: linterConfig.command,
          args: linterConfig.args(outputPath),
        })

        await hooks.onOnce('kubb:hook:end', async (ctx) => {
          if (!ctx.success) throw ctx.error
        })
      } catch (caughtError) {
        const error = new Error(linterConfig.errorMessage)
        error.cause = caughtError
        await hooks.emit('kubb:error', { error })
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
