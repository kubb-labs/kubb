import { useEffect, useReducer, useState } from 'react'
import { useKeyboard } from '@opentui/react'
import { createInitialState, reducer, type TuiAction, type TuiState } from './state.ts'
import { HeaderBar } from './components/HeaderBar.tsx'
import { TaskList } from './components/TaskList.tsx'
import { TaskDetail } from './components/TaskDetail.tsx'
import { FilesPane } from './components/FilesPane.tsx'
import { LogPane } from './components/LogPane.tsx'
import { StatusBar } from './components/StatusBar.tsx'
import { HelpOverlay } from './components/HelpOverlay.tsx'

type Props = {
  /**
   * Subscribe to dispatched actions. The logger calls this to wire its event
   * forwarder up to the React tree. Returns an unsubscribe function.
   */
  subscribe: (dispatch: (action: TuiAction) => void) => () => void
  /**
   * Called when the user explicitly requests a quit (`q` / Ctrl+C). The
   * caller is responsible for unmounting and exiting.
   */
  onQuit?: () => void
  /**
   * Initial state seed (lets the logger preload the Kubb version before mount).
   */
  initial?: Partial<TuiState>
}

const HEADER_TICK_MS = 100
const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export function App({ subscribe, onQuit, initial }: Props) {
  const [state, dispatch] = useReducer(reducer, { ...createInitialState(), ...initial })
  const [tick, setTick] = useState(0)

  useEffect(() => subscribe(dispatch), [subscribe])

  useEffect(() => {
    if (state.status !== 'running') return
    const id = setInterval(() => setTick((t) => t + 1), HEADER_TICK_MS)
    return () => clearInterval(id)
  }, [state.status])

  useKeyboard((event) => {
    if (event.eventType === 'release') return

    if (event.name === 'q' || (event.ctrl && event.name === 'c')) {
      onQuit?.()
      return
    }

    if (event.name === '?') {
      dispatch({ type: 'ui:set-mode', mode: state.ui.mode === 'help' ? 'normal' : 'help' })
      return
    }

    if (event.name === 'escape') {
      if (state.ui.mode !== 'normal') {
        dispatch({ type: 'ui:set-mode', mode: 'normal' })
      }
      return
    }

    if (state.ui.mode === 'help') return

    if (event.name === 'return') {
      dispatch({ type: 'ui:set-mode', mode: state.ui.mode === 'detail' ? 'normal' : 'detail' })
      return
    }

    if (event.name === 'c') {
      dispatch({ type: 'ui:clear-logs' })
      return
    }

    if (event.name === 'up' || event.name === 'k') {
      dispatch({ type: 'ui:select', delta: -1 })
      return
    }

    if (event.name === 'down' || event.name === 'j') {
      dispatch({ type: 'ui:select', delta: 1 })
      return
    }
  })

  const spinnerFrame = SPINNER_FRAMES[tick % SPINNER_FRAMES.length] ?? '⠋'

  if (state.ui.mode === 'help') {
    return (
      <box flexDirection="column" flexGrow={1}>
        <HeaderBar state={state} tick={tick} />
        <HelpOverlay />
        <StatusBar state={state} />
      </box>
    )
  }

  if (state.ui.mode === 'detail') {
    return (
      <box flexDirection="column" flexGrow={1}>
        <HeaderBar state={state} tick={tick} />
        <TaskDetail plugins={state.plugins} hooks={state.hooks} logs={state.logs} selectedIndex={state.selectedTaskIndex} />
        <StatusBar state={state} />
      </box>
    )
  }

  return (
    <box flexDirection="column" flexGrow={1}>
      <HeaderBar state={state} tick={tick} />
      <box flexDirection="row" flexGrow={1}>
        <TaskList plugins={state.plugins} hooks={state.hooks} selectedIndex={state.selectedTaskIndex} spinnerFrame={spinnerFrame} />
        <TaskDetail plugins={state.plugins} hooks={state.hooks} logs={state.logs} selectedIndex={state.selectedTaskIndex} />
      </box>
      <FilesPane files={state.files} />
      <LogPane logs={state.logs} />
      <StatusBar state={state} />
    </box>
  )
}
