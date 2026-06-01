import process from 'node:process'
import { App } from './App.tsx'
import type { TuiAction } from './state.ts'

type ReactRoot = {
  render: (node: unknown) => void
  unmount: () => void
}

type CliRenderer = {
  start: () => void
  stop: () => void
  destroy: () => void
}

type OpenTuiCore = {
  createCliRenderer: (config?: { exitOnCtrlC?: boolean; targetFps?: number; useMouse?: boolean }) => Promise<CliRenderer>
}

type OpenTuiReact = {
  createRoot: (renderer: CliRenderer) => ReactRoot
}

export type Mount = {
  dispatch: (action: TuiAction) => void
  teardown: () => void
}

/**
 * Boots opentui, mounts the React tree, and returns a `dispatch` channel the
 * caller can use to push events into the reducer. Kept in its own module so
 * the static import graph of `tuiLogger` doesn't reach opentui — on Node, the
 * runtime check in the logger returns before this module is ever loaded.
 */
export async function mount(): Promise<Mount> {
  const [core, react] = (await Promise.all([import('@opentui/core'), import('@opentui/react')])) as unknown as [OpenTuiCore, OpenTuiReact]

  const renderer = await core.createCliRenderer({ exitOnCtrlC: false, useMouse: false, targetFps: 60 })
  const root = react.createRoot(renderer)

  const listeners = new Set<(action: TuiAction) => void>()

  function subscribe(listener: (action: TuiAction) => void): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  function dispatch(action: TuiAction): void {
    for (const listener of listeners) listener(action)
  }

  let torn = false
  function teardown(): void {
    if (torn) return
    torn = true
    try {
      root.unmount()
    } catch {
      // best-effort terminal restore
    }
    try {
      renderer.stop()
    } catch {
      // ignore
    }
    try {
      renderer.destroy()
    } catch {
      // ignore
    }
  }

  function quit(code = 0): void {
    teardown()
    process.exit(code)
  }

  root.render(<App subscribe={subscribe} onQuit={() => quit(0)} />)
  renderer.start()

  process.once('exit', teardown)
  process.once('SIGINT', () => quit(130))
  process.once('SIGTERM', () => quit(143))

  return { dispatch, teardown }
}
