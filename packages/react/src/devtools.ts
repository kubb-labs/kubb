import { onExit } from 'signal-exit'
import ws from 'ws'

declare global {
  var WebSocket: typeof WebSocket
  var self: any
  var window: any
  var isDevtoolsEnabled: any
}

// Filter out Kubbs's internal components from devtools for a cleaner view.
// See https://github.com/facebook/react/blob/edf6eac8a181860fd8a2d076a43806f1237495a1/packages/react-devtools-shared/src/types.js#L24

const customGlobal: any = globalThis
customGlobal.WebSocket ||= ws
customGlobal.window ||= customGlobal
customGlobal.self ||= customGlobal
customGlobal.isDevtoolsEnabled = true
customGlobal.window.__REACT_DEVTOOLS_COMPONENT_FILTERS__ = [
  {
    // ComponentFilterDisplayName
    type: 2,
    value: 'Context.Provider',
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
    value: 'kubb-file',
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
  {
    // ComponentFilterDisplayName
    type: 2,
    value: 'kubb-source',
    isEnabled: true,
    isValid: true,
  },
]

function openDevtools() {
  let subprocess: { kill: () => void }
  import('execa')
    .then(async (execa) => {
      console.log('Opening devtools')

      subprocess = execa.execa({ preferLocal: true })`npx react-devtools`
    })
    .then(() => {
      // @ts-expect-error
      return import('react-devtools-core')
    })
    .then((devtools) => {
      console.log('Connecting devtools')
      devtools.default.connectToDevTools()
    })
    .catch(() => {
      console.log('Error connecting devtools')
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
