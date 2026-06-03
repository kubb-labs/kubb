import { relative } from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { formatMs, formatMsWithColor, isGitHubActions, toCause } from '@internals/utils'
import {
  type Config,
  defineLogger,
  type Diagnostic,
  diagnosticCode,
  Diagnostics,
  isProblemDiagnostic,
  isUpdateDiagnostic,
  type KubbHooks,
  type Logger,
  type LoggerOptions,
  logLevel as logLevelMap,
} from '@kubb/core'
import { consola } from 'consola'
import { diagnosticDetails, diagnosticHeadline, diagnosticSymbol } from './diagnostics.ts'
import { createHookTimer, formatCommandWithArgs, formatMessage, type HookSinkFactory } from './utils.ts'

/**
 * Options accepted by {@link createLogger}.
 */
export type CreateLoggerOptions = {
  /**
   * Force-enable or force-disable the GitHub Actions workflow command annotations
   * (`::group::`, `::warning::`, `::error::`, `::notice::`). When omitted, detected via
   * `isGitHubActions()` at install time.
   */
  gha?: boolean
}

type ProgressState = {
  totalPlugins: number
  completedPlugins: number
  failedPlugins: number
  totalFiles: number
  processedFiles: number
}

function progressLine(state: ProgressState): string | null {
  const parts: Array<string> = []

  if (state.totalPlugins > 0) {
    const ok = styleText('green', String(state.completedPlugins))
    parts.push(
      state.failedPlugins > 0
        ? `Plugins ${ok}/${state.totalPlugins} ${styleText('red', `(${state.failedPlugins} failed)`)}`
        : `Plugins ${ok}/${state.totalPlugins}`,
    )
  }

  if (state.totalFiles > 0) {
    parts.push(`Files ${styleText('green', String(state.processedFiles))}/${state.totalFiles}`)
  }

  return parts.length > 0 ? parts.join(styleText('dim', ' | ')) : null
}

/**
 * Builds a middleware-style logger that owns both the human-readable consola output and the
 * GitHub Actions workflow command annotations in one set of handlers. Pass `gha: true|false` to
 * override the `isGitHubActions()` runtime detection.
 *
 * @example
 * ```ts
 * import { createLogger } from '@kubb/middleware-logger'
 *
 * const logger = createLogger()
 * await logger.install(hooks, { logLevel: 3 })
 * ```
 */
export function createLogger(options?: CreateLoggerOptions): Logger<LoggerOptions, HookSinkFactory> {
  const gha = options?.gha ?? isGitHubActions()

  return defineLogger<LoggerOptions, HookSinkFactory>({
    name: 'middleware-logger',
    install(context, installOptions) {
      const logLevel = installOptions?.logLevel ?? logLevelMap.info
      const hookTimer = createHookTimer()
      const state: ProgressState = {
        totalPlugins: 0,
        completedPlugins: 0,
        failedPlugins: 0,
        totalFiles: 0,
        processedFiles: 0,
      }
      const ghaState = {
        currentConfigs: [] as Array<Config>,
        openGroupDepth: 0,
      }

      function openGroup(name: string): void {
        if (!gha) return
        process.stdout.write(`::group::${name}\n`)
        ghaState.openGroupDepth++
      }

      function closeGroup(): void {
        if (!gha || ghaState.openGroupDepth === 0) return
        process.stdout.write('::endgroup::\n')
        ghaState.openGroupDepth--
      }

      function closeAllGroups(): void {
        while (gha && ghaState.openGroupDepth > 0) closeGroup()
      }

      function reset(): void {
        state.totalPlugins = 0
        state.completedPlugins = 0
        state.failedPlugins = 0
        state.totalFiles = 0
        state.processedFiles = 0
        hookTimer.clear()
      }

      function fmt(message: string): string {
        return formatMessage(message, logLevel)
      }

      function onStep<E extends keyof KubbHooks>(event: E, message: string, groupName?: string, position?: 'open' | 'close'): void {
        context.on(event, () => {
          if (logLevel <= logLevelMap.silent) return
          if (gha && groupName && position === 'open' && ghaState.currentConfigs.length === 1) openGroup(groupName)
          consola.log(fmt(message))
          if (gha && groupName && position === 'close' && ghaState.currentConfigs.length === 1) closeGroup()
        })
      }

      context.on('kubb:info', ({ message, info = '' }) => {
        if (logLevel <= logLevelMap.silent) return
        const detail = info ? styleText('dim', info) : undefined
        consola.info(fmt([message, detail].filter(Boolean).join(' ')))
      })

      context.on('kubb:success', ({ message, info = '' }) => {
        if (logLevel <= logLevelMap.silent) return
        const detail = logLevel >= logLevelMap.info && info ? styleText('dim', info) : undefined
        consola.success(fmt([message, detail].filter(Boolean).join(' ')))
      })

      context.on('kubb:warn', ({ message, info = '' }) => {
        if (logLevel < logLevelMap.warn) return
        const detail = logLevel >= logLevelMap.info && info ? styleText('dim', info) : undefined
        consola.warn(fmt([message, detail].filter(Boolean).join(' ')))
        if (gha) process.stdout.write(`::warning::${message}\n`)
      })

      context.on('kubb:error', ({ error }) => {
        closeAllGroups()
        consola.error(fmt(error.message))
        if (gha) process.stderr.write(`::error::${error.message || String(error)}\n`)

        if (logLevel < logLevelMap.verbose || !error.stack) return

        const frames = error.stack.split('\n').slice(1, 4)
        for (const frame of frames) {
          consola.log(fmt(styleText('dim', frame.trim())))
        }

        const caused = toCause(error)
        if (!caused?.stack) return

        consola.log(styleText('dim', `└─ caused by ${caused.message}`))
        const causedFrames = caused.stack.split('\n').slice(1, 4)
        for (const frame of causedFrames) {
          consola.log(fmt(`    ${styleText('dim', frame.trim())}`))
        }
      })

      context.on('kubb:diagnostic', ({ diagnostic }) => {
        if (logLevel <= logLevelMap.silent && diagnostic.severity !== 'error') return

        if (isUpdateDiagnostic(diagnostic)) {
          consola.box({
            title: 'Update available for Kubb',
            message: `v${diagnostic.currentVersion} → v${diagnostic.latestVersion}\nRun \`npm install -g @kubb/cli\` to update`,
            style: { borderColor: 'yellow' },
          })
          return
        }

        consola.log(fmt([diagnosticSymbol(diagnostic.severity), diagnosticHeadline(diagnostic), ...diagnosticDetails(diagnostic)].join('\n')))

        if (!gha) return

        if (!isProblemDiagnostic(diagnostic)) {
          const message = (diagnostic as Diagnostic).message
          process.stdout.write(`::notice::${message}\n`)
          return
        }

        const parts = [`${diagnostic.code} ${diagnostic.message}`]
        if (diagnostic.location && 'pointer' in diagnostic.location) parts.push(`(at ${diagnostic.location.pointer})`)
        if (diagnostic.plugin) parts.push(`[plugin: ${diagnostic.plugin}]`)
        if (diagnostic.help) parts.push(`help: ${diagnostic.help}`)
        if (diagnostic.code !== diagnosticCode.unknown) parts.push(`docs: ${Diagnostics.docsUrl(diagnostic.code)}`)

        const line = parts.join(' ')
        if (diagnostic.severity === 'error') {
          closeAllGroups()
          process.stderr.write(`::error::${line}\n`)
          return
        }
        if (diagnostic.severity === 'warning') {
          process.stdout.write(`::warning::${line}\n`)
          return
        }
        process.stdout.write(`::notice::${line}\n`)
      })

      context.on('kubb:lifecycle:start', ({ version }) => {
        consola.log(styleText('yellow', `Kubb CLI v${version}`))
        reset()
      })

      context.on('kubb:lifecycle:end', () => {
        closeAllGroups()
        reset()
      })

      context.on('kubb:config:start', () => {
        if (logLevel <= logLevelMap.silent) return
        openGroup('Configuration')
        consola.start(fmt('Configuration started'))
      })

      context.on('kubb:config:end', ({ configs }) => {
        ghaState.currentConfigs = configs
        if (logLevel <= logLevelMap.silent) return
        consola.success(fmt('Configuration completed'))
        closeGroup()
      })

      context.on('kubb:generation:start', ({ config }) => {
        reset()
        state.totalPlugins = config.plugins?.length ?? 0
        if (ghaState.currentConfigs.length > 1) openGroup(config.name ? `Generation for ${config.name}` : 'Generation')

        if (logLevel <= logLevelMap.silent) return
        const suffix = config.name ? `for ${styleText('dim', config.name)}` : undefined
        consola.start(fmt(['Generation started', suffix].filter(Boolean).join(' ')))
      })

      context.on('kubb:generation:end', ({ config }) => {
        const text = config.name ? `Generation completed for ${styleText('dim', config.name)}` : 'Generation completed'
        consola.success(fmt(text))
        if (ghaState.currentConfigs.length > 1) closeGroup()
      })

      context.on('kubb:plugin:start', ({ plugin }) => {
        if (logLevel <= logLevelMap.silent) return
        if (ghaState.currentConfigs.length === 1) openGroup(`Plugin: ${plugin.name}`)
        consola.log(fmt(`Generating ${styleText('bold', plugin.name)}`))
      })

      context.on('kubb:plugin:end', ({ plugin, duration, success }) => {
        if (success) state.completedPlugins++
        else state.failedPlugins++

        if (logLevel <= logLevelMap.silent) {
          if (ghaState.currentConfigs.length === 1) closeGroup()
          return
        }

        const durationStr = formatMsWithColor(duration)
        const line = success
          ? `${styleText('bold', plugin.name)} completed in ${durationStr}`
          : `${styleText('bold', plugin.name)} failed in ${styleText('red', formatMs(duration))}`
        consola.log(fmt(line))

        const progress = progressLine(state)
        if (progress) consola.log(fmt(progress))

        if (ghaState.currentConfigs.length === 1) closeGroup()
      })

      context.on('kubb:files:processing:start', ({ files }) => {
        state.totalFiles = files.length
        state.processedFiles = 0
        if (logLevel <= logLevelMap.silent) return
        if (ghaState.currentConfigs.length === 1) openGroup('File Generation')
        consola.start(fmt(`Writing ${files.length} files`))
      })

      context.on('kubb:files:processing:update', ({ files }) => {
        state.processedFiles += files.length
        if (logLevel < logLevelMap.verbose) return
        for (const { file, config } of files) {
          consola.log(fmt(`Writing ${relative(config.root, file.path)}`))
        }
      })

      context.on('kubb:files:processing:end', () => {
        if (logLevel <= logLevelMap.silent) return
        consola.success(fmt('Files written successfully'))

        const progress = progressLine(state)
        if (progress) consola.log(fmt(progress))

        if (ghaState.currentConfigs.length === 1) closeGroup()
      })

      onStep('kubb:format:start', 'Format started', 'Formatting', 'open')
      onStep('kubb:format:end', 'Format completed', 'Formatting', 'close')
      onStep('kubb:lint:start', 'Lint started', 'Linting', 'open')
      onStep('kubb:lint:end', 'Lint completed', 'Linting', 'close')
      onStep('kubb:hooks:start', 'Hooks started', 'Hooks', 'open')
      onStep('kubb:hooks:end', 'Hooks completed', 'Hooks', 'close')

      context.on('kubb:hook:start', ({ id, command, args }) => {
        if (logLevel <= logLevelMap.silent) return
        if (id) hookTimer.start(id)
        const commandWithArgs = formatCommandWithArgs(command, args)
        if (ghaState.currentConfigs.length === 1) openGroup(`Hook ${commandWithArgs}`)
        consola.start(fmt(`Hook ${styleText('dim', commandWithArgs)}`))
      })

      context.on('kubb:hook:end', ({ id, command, args, success, error }) => {
        if (logLevel <= logLevelMap.silent) return

        const ms = id ? hookTimer.end(id) : undefined
        const durationStr = ms !== undefined ? ` in ${formatMsWithColor(ms)}` : ''
        const commandWithArgs = formatCommandWithArgs(command, args)

        if (success) {
          consola.success(fmt(`Hook ${styleText('dim', commandWithArgs)} completed${durationStr}`))
        } else {
          const reason = error?.message ? ` (${error.message})` : ''
          consola.fail(fmt(`Hook ${styleText('dim', commandWithArgs)} failed${durationStr}${reason}`))
        }

        if (ghaState.currentConfigs.length === 1) closeGroup()
      })

      return (_commandWithArgs, _hookId) => ({
        onStdout: logLevel > logLevelMap.silent ? (s: string) => consola.log(s) : undefined,
        onStderr: logLevel > logLevelMap.silent ? (s: string) => consola.log(s) : undefined,
      })
    },
  })
}
