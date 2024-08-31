import { onExit } from 'signal-exit'
import ws from 'ws'

// Filter out Kubbs's internal components from devtools for a cleaner view.
// See https://github.com/facebook/react/blob/edf6eac8a181860fd8a2d076a43806f1237495a1/packages/react-devtools-shared/src/types.js#L24

const customGlobal = global
// @ts-ignore
customGlobal.WebSocket ||= ws
// @ts-ignore
customGlobal.window ||= global
// @ts-ignore
customGlobal.self ||= global
// @ts-ignore
customGlobal.window.__REACT_DEVTOOLS_COMPONENT_FILTERS__ = [
  {
    // ComponentFilterDisplayName
    type: 2,
    value: 'KubbApp',
    isEnabled: true,
    isValid: true,
  },
  {
    // ComponentFilterDisplayName
    type: 2,
    value: 'KubbRoot',
    isEnabled: true,
    isValid: true,
  },
  {
    // ComponentFilterDisplayName
    type: 2,
    value: 'KubbErrorBoundary',
    isEnabled: true,
    isValid: true,
  },
  {
    // ComponentFilterDisplayName
    type: 2,
    value: 'kubb-text',
    isEnabled: true,
    isValid: true,
  },
  {
    // ComponentFilterDisplayName
    type: 2,
    value: 'kubb-import',
    isEnabled: true,
    isValid: true,
  },
  {
    // ComponentFilterDisplayName
    type: 2,
    value: 'kubb-export',
    isEnabled: true,
    isValid: true,
  },
]

function openDevtools() {
  let subprocess: { kill: () => void }
  import('execa').then(async (execa) => {
    console.log('Opening devtools')

    subprocess = execa.execa({ preferLocal: true })`npx react-devtools`
  })
  // @ts-ignore
  import('react-devtools-core').then((devtools) => {
    console.log('Connecting devtools')
    devtools.default.connectToDevTools()
  })

  onExit(
    () => {
      console.log('Disconnecting devtools')
      subprocess?.kill()
    },
    { alwaysLast: false },
  )
}

openDevtools()
