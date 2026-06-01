import process from 'node:process'
import React from 'react'
import { defineLogger, type LoggerOptions, logLevel as logLevelMap } from '@kubb/core'
import { App } from './App.tsx'
import { getTuiUnavailableReason } from './runtime.ts'
import type { TuiAction } from './state.ts'

/**
 * Output sink for a hook subprocess. Mirrors the contract that
 * `@kubb/cli`'s `HookSinkFactory` already uses with the clack logger so the
 * generation runner can route stdout/stderr without knowing which logger is
 * mounted.
 */
type HookSinkOptions = {
  stream?: boolean
  onLine?: (line: string) => void
  onStdout?: (text: string) => void
  onStderr?: (text: string) => void
}

type HookSinkFactory = (commandWithArgs: string, hookId: string) => HookSinkOptions | null

/**
 * Render handle returned by `@opentui/react.render`. We only need to call
 * `unmount` when the run finishes or the process exits.
 */
type RenderHandle = { unmount: () => void } | void

async function loadRenderer(): Promise<((node: React.ReactNode) => RenderHandle) | null> {
  try {
    const mod = (await import('@opentui/react')) as { render?: (node: React.ReactNode) => RenderHandle }
    return mod.render ?? null
  } catch {
    return null
  }
}

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
 */
export const tuiLogger = defineLogger<LoggerOptions, HookSinkFactory | null>({
  name: 'tui',
  async install(context, options) {
    const reason = getTuiUnavailableReason()
    if (reason) {
      await context.emit('kubb:warn', { message: reason })
      return null
    }

    const render = await loadRenderer()
    if (!render) {
      await context.emit('kubb:warn', { message: 'Could not load @opentui/react. Install @kubb/tui peer dependencies or omit --tui.' })
      return null
    }

    const logLevel = options?.logLevel ?? logLevelMap.info
    const listeners = new Set<(action: TuiAction) => void>()

    function dispatch(action: TuiAction): void {
      for (const listener of listeners) listener(action)
    }

    function subscribe(listener: (action: TuiAction) => void): () => void {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    }

    const handle = render(<App subscribe={subscribe} />)

    function unmount(): void {
      if (handle && typeof handle.unmount === 'function') {
        try {
          handle.unmount()
        } catch {
          // ignore — terminal restore is best-effort
        }
      }
    }

    process.once('exit', unmount)
    process.once('SIGINT', () => {
      unmount()
      process.exit(130)
    })
    process.once('SIGTERM', () => {
      unmount()
      process.exit(143)
    })

    context.on('kubb:lifecycle:start', ({ version }) => {
      dispatch({ type: 'lifecycle:start', version })
    })

    context.on('kubb:lifecycle:end', () => {
      dispatch({ type: 'lifecycle:end' })
      unmount()
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

    context.on('kubb:generation:summary', ({ status }) => {
      dispatch({ type: 'generation:end', status, at: Date.now() })
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
