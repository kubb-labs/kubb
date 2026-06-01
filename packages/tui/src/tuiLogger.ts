import process from 'node:process'
import { defineLogger, type LoggerOptions, logLevel as logLevelMap } from '@kubb/core'
import { getTuiUnavailableReason } from './runtime.ts'
import type { Mount } from './mount.tsx'

function formatElapsedMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`
  return `${Math.round(ms)}ms`
}

/**
 * Output sink for a hook subprocess. Mirrors the contract `@kubb/cli`'s
 * `HookSinkFactory` already uses with the clack logger so the generation
 * runner can route stdout/stderr without knowing which logger is mounted.
 */
type HookSinkOptions = {
  stream?: boolean
  onLine?: (line: string) => void
  onStdout?: (text: string) => void
  onStderr?: (text: string) => void
}

type HookSinkFactory = (commandWithArgs: string, hookId: string) => HookSinkOptions | null

/**
 * Pulls the plugin list from `config` without depending on `@kubb/core`'s
 * full `Config` type at this seam — keeps the logger module decoupled from
 * core's internal shape.
 */
function getPluginNames(config: unknown): Array<string> {
  if (!config || typeof config !== 'object') return []
  const plugins = (config as { plugins?: ReadonlyArray<{ name: string }> }).plugins
  return plugins ? plugins.map((p) => p.name) : []
}

/**
 * Terminal UI logger backed by opentui + React. Activates only when the
 * runtime is Bun and stdout is a TTY; otherwise `install` returns `null` and
 * the caller is expected to fall back to another logger (clack/plain).
 *
 * This module deliberately avoids any static import of opentui or the React
 * tree. On Node, opentui's `.scm` tree-sitter assets can't be loaded by the
 * ESM loader, so we keep the JSX and renderer behind a dynamic import that
 * runs only after the Bun guard.
 */
export const tuiLogger = defineLogger<LoggerOptions, HookSinkFactory | null>({
  name: 'tui',
  async install(context, options) {
    const reason = getTuiUnavailableReason()
    if (reason) {
      console.error(`[kubb] ${reason}`)
      return null
    }

    let mountFn: typeof import('./mount.tsx').mount
    try {
      ;({ mount: mountFn } = await import('./mount.tsx'))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[kubb] Failed to load the TUI renderer: ${message}`)
      return null
    }

    let mounted: Mount
    try {
      mounted = await mountFn()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[kubb] opentui failed to start: ${message}`)
      return null
    }

    const { dispatch } = mounted
    const logLevel = options?.logLevel ?? logLevelMap.info

    context.on('kubb:lifecycle:start', ({ version }) => {
      dispatch({ type: 'lifecycle:start', version })
    })

    // Deliberately no teardown on lifecycle:end — the TUI stays mounted after
    // generation so the user can scroll through results. They quit explicitly
    // with `q` or Ctrl+C, which mount.tsx handles via the onQuit callback.
    context.on('kubb:lifecycle:end', () => {
      dispatch({ type: 'lifecycle:end' })
    })

    context.on('kubb:version:new', ({ currentVersion, latestVersion }) => {
      dispatch({ type: 'version:new', currentVersion, latestVersion })
    })

    context.on('kubb:generation:start', ({ config }) => {
      dispatch({
        type: 'generation:start',
        configName: (config as { name?: string }).name,
        pluginNames: getPluginNames(config),
        at: Date.now(),
      })
    })

    context.on('kubb:generation:summary', ({ status, filesCreated, failedPlugins, config, hrStart }) => {
      dispatch({ type: 'generation:end', status, at: Date.now() })
      const elapsedMs = process.hrtime(hrStart as [number, number])
      const elapsed = elapsedMs[0] * 1000 + elapsedMs[1] / 1e6
      const totalPlugins = config.plugins?.length ?? 0
      const succeeded = totalPlugins - failedPlugins.size
      const message =
        status === 'success'
          ? `Generated ${filesCreated} files across ${succeeded}/${totalPlugins} plugins in ${formatElapsedMs(elapsed)}`
          : `Generation failed (${succeeded}/${totalPlugins} plugins ok, ${failedPlugins.size} failed) in ${formatElapsedMs(elapsed)}`
      dispatch({ type: 'log', entry: { level: status === 'success' ? 'success' : 'error', message, at: Date.now() } })
      dispatch({ type: 'log', entry: { level: 'info', message: 'Press q to quit.', at: Date.now() } })
    })

    context.on('kubb:plugin:start', ({ plugin }) => {
      dispatch({ type: 'plugin:start', name: plugin.name })
    })

    context.on('kubb:plugin:end', ({ plugin, duration, success }) => {
      dispatch({ type: 'plugin:end', name: plugin.name, success, duration })
    })

    context.on('kubb:files:processing:start', ({ files }) => {
      dispatch({ type: 'files:start', total: files.length })
    })

    context.on('kubb:files:processing:update', ({ files }) => {
      const last = files[files.length - 1]
      if (!last) return
      dispatch({ type: 'files:update', processed: last.processed, current: last.file.path })
    })

    context.on('kubb:files:processing:end', () => {
      dispatch({ type: 'files:end' })
    })

    context.on('kubb:hook:start', ({ id, command, args }) => {
      if (!id) return
      const commandWithArgs = args?.length ? `${command} ${args.join(' ')}` : command
      dispatch({ type: 'hook:start', id, command: commandWithArgs, at: Date.now() })
    })

    context.on('kubb:hook:end', ({ id, success }) => {
      if (!id) return
      dispatch({ type: 'hook:end', id, success, at: Date.now() })
    })

    context.on('kubb:info', ({ message, info }) => {
      dispatch({ type: 'log', entry: { level: 'info', message, info, at: Date.now() } })
    })

    context.on('kubb:success', ({ message, info }) => {
      dispatch({ type: 'log', entry: { level: 'success', message, info, at: Date.now() } })
    })

    context.on('kubb:warn', ({ message, info }) => {
      if (logLevel < logLevelMap.warn) return
      dispatch({ type: 'log', entry: { level: 'warn', message, info, at: Date.now() } })
    })

    context.on('kubb:error', ({ error }) => {
      dispatch({ type: 'log', entry: { level: 'error', message: error.message, at: Date.now() } })
    })

    if (logLevel >= logLevelMap.debug) {
      context.on('kubb:debug', ({ logs }) => {
        for (const line of logs) {
          dispatch({ type: 'log', entry: { level: 'debug', message: line, at: Date.now() } })
        }
      })
    }

    const sink: HookSinkFactory = (_commandWithArgs, hookId) => ({
      stream: true,
      onLine: (line: string) => dispatch({ type: 'hook:line', id: hookId, line }),
      onStdout: (text: string) => dispatch({ type: 'hook:line', id: hookId, line: text }),
      onStderr: (text: string) => dispatch({ type: 'hook:line', id: hookId, line: text }),
    })

    return sink
  },
})
