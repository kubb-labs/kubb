import { relative } from 'node:path'
import { styleText } from 'node:util'
import { formatMs, formatMsWithColor, toCause } from '@internals/utils'
import { defineLogger, isUpdateDiagnostic, type KubbHooks, type LoggerOptions, logLevel as logLevelMap } from '@kubb/core'
import { consola } from 'consola'
import { formatDiagnostic } from './diagnostics.ts'
import { createHookTimer, formatCommandWithArgs, formatMessage, type HookSinkFactory } from './utils.ts'

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
 * Unified CLI logger built on consola. One set of `KubbHooks` handlers covers TTY, plain CI, and
 * GitHub Actions output. The optional GitHub Actions decorator from `./githubAnnotations.ts` runs
 * alongside this logger when the environment matches and emits the workflow command annotations.
 */
export const logger = defineLogger<LoggerOptions, HookSinkFactory>({
  name: 'cli',
  install(context, options) {
    const logLevel = options?.logLevel ?? logLevelMap.info
    const hookTimer = createHookTimer()
    const state: ProgressState = {
      totalPlugins: 0,
      completedPlugins: 0,
      failedPlugins: 0,
      totalFiles: 0,
      processedFiles: 0,
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

    function onStep<E extends keyof KubbHooks>(event: E, message: string): void {
      context.on(event, () => {
        if (logLevel <= logLevelMap.silent) return
        consola.log(fmt(message))
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
    })

    context.on('kubb:error', ({ error }) => {
      consola.error(fmt(error.message))

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

      consola.log(fmt(formatDiagnostic(diagnostic).join('\n')))
    })

    context.on('kubb:lifecycle:start', ({ version }) => {
      consola.log(styleText('yellow', `Kubb CLI v${version}`))
      reset()
    })

    context.on('kubb:lifecycle:end', () => {
      reset()
    })

    context.on('kubb:config:start', () => {
      if (logLevel <= logLevelMap.silent) return
      consola.start(fmt('Configuration started'))
    })

    context.on('kubb:config:end', () => {
      if (logLevel <= logLevelMap.silent) return
      consola.success(fmt('Configuration completed'))
    })

    context.on('kubb:generation:start', ({ config }) => {
      reset()
      state.totalPlugins = config.plugins?.length ?? 0

      if (logLevel <= logLevelMap.silent) return
      const suffix = config.name ? `for ${styleText('dim', config.name)}` : undefined
      consola.start(fmt(['Generation started', suffix].filter(Boolean).join(' ')))
    })

    context.on('kubb:generation:end', ({ config }) => {
      const text = config.name ? `Generation completed for ${styleText('dim', config.name)}` : 'Generation completed'
      consola.success(fmt(text))
    })

    context.on('kubb:plugin:start', ({ plugin }) => {
      if (logLevel <= logLevelMap.silent) return
      consola.log(fmt(`Generating ${styleText('bold', plugin.name)}`))
    })

    context.on('kubb:plugin:end', ({ plugin, duration, success }) => {
      if (success) state.completedPlugins++
      else state.failedPlugins++

      if (logLevel <= logLevelMap.silent) return

      const durationStr = formatMsWithColor(duration)
      const line = success
        ? `${styleText('bold', plugin.name)} completed in ${durationStr}`
        : `${styleText('bold', plugin.name)} failed in ${styleText('red', formatMs(duration))}`
      consola.log(fmt(line))

      const progress = progressLine(state)
      if (progress) consola.log(fmt(progress))
    })

    context.on('kubb:files:processing:start', ({ files }) => {
      state.totalFiles = files.length
      state.processedFiles = 0
      if (logLevel <= logLevelMap.silent) return
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
    })

    onStep('kubb:format:start', 'Format started')
    onStep('kubb:format:end', 'Format completed')
    onStep('kubb:lint:start', 'Lint started')
    onStep('kubb:lint:end', 'Lint completed')
    onStep('kubb:hooks:start', 'Hooks started')
    onStep('kubb:hooks:end', 'Hooks completed')

    context.on('kubb:hook:start', ({ id, command, args }) => {
      if (logLevel <= logLevelMap.silent) return
      if (id) hookTimer.start(id)
      const commandWithArgs = formatCommandWithArgs(command, args)
      consola.start(fmt(`Hook ${styleText('dim', commandWithArgs)}`))
    })

    context.on('kubb:hook:end', ({ id, command, args, success, error }) => {
      if (logLevel <= logLevelMap.silent) return

      const ms = id ? hookTimer.end(id) : undefined
      const durationStr = ms !== undefined ? ` in ${formatMsWithColor(ms)}` : ''
      const commandWithArgs = formatCommandWithArgs(command, args)

      if (success) {
        consola.success(fmt(`Hook ${styleText('dim', commandWithArgs)} completed${durationStr}`))
        return
      }

      const reason = error?.message ? ` (${error.message})` : ''
      consola.fail(fmt(`Hook ${styleText('dim', commandWithArgs)} failed${durationStr}${reason}`))
    })

    return (_commandWithArgs: string, _hookId: string) => ({
      onStdout: logLevel > logLevelMap.silent ? (s: string) => consola.log(s) : undefined,
      onStderr: logLevel > logLevelMap.silent ? (s: string) => consola.log(s) : undefined,
    })
  },
})
