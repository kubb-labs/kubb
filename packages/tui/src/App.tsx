import { useEffect, useReducer, useState } from 'react'
import { createInitialState, reducer, type TuiAction, type TuiState } from './state.ts'
import { attrs } from './format.ts'
import { HeaderBar } from './components/HeaderBar.tsx'
import { PluginsPane } from './components/PluginsPane.tsx'
import { FilesPane } from './components/FilesPane.tsx'
import { LogPane } from './components/LogPane.tsx'

type Props = {
  /**
   * Subscribe to dispatched actions. The logger calls this to wire its event
   * forwarder up to the React tree. Returns an unsubscribe function.
   */
  subscribe: (dispatch: (action: TuiAction) => void) => () => void
  /**
   * Initial state seed (lets the logger preload the Kubb version before mount).
   */
  initial?: Partial<TuiState>
}

const HEADER_TICK_MS = 250

export function App({ subscribe, initial }: Props) {
  const [state, dispatch] = useReducer(reducer, { ...createInitialState(), ...initial })
  const [tick, setTick] = useState(0)

  useEffect(() => subscribe(dispatch), [subscribe])

  useEffect(() => {
    if (state.status !== 'running') return
    const id = setInterval(() => setTick((t) => t + 1), HEADER_TICK_MS)
    return () => clearInterval(id)
  }, [state.status])

  return (
    <box flexDirection="column" flexGrow={1}>
      <HeaderBar state={state} tick={tick} />
      <PluginsPane plugins={state.plugins} />
      <FilesPane files={state.files} />
      <LogPane logs={state.logs} />
      <box paddingLeft={1} paddingRight={1}>
        <text>
          <span fg="#888" attributes={attrs.dim}>↑/↓ scroll · q quit</span>
        </text>
      </box>
    </box>
  )
}
