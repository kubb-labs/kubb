import { optionsCJS, optionsESM } from '@kubb/config-tsup'

import { defineConfig } from 'tsup'

// Filter out Kubbs's internal components from devtools for a cleaner view.
// See https://github.com/facebook/react/blob/edf6eac8a181860fd8a2d076a43806f1237495a1/packages/react-devtools-shared/src/types.js#L24
const devtoolsBanner = `
const customGlobal = global;
customGlobal.WebSocket ||= ws;
customGlobal.window ||= global;
customGlobal.self ||= global;
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
  }
];
`

export default defineConfig([
  {
    ...optionsCJS,
    entry: {
      index: 'src/index.ts',
      devtools: 'src/devtools.ts',
      'jsx-runtime': './src/jsx-runtime.ts',
    },
    noExternal: ['react', 'react-reconciler', 'react-devtools-core', 'auto-bind'],
    banner: {
      js: `
const ws = require('ws');
${devtoolsBanner}
    `,
    },
  },
  {
    ...optionsESM,
    entry: {
      index: 'src/index.ts',
      devtools: 'src/devtools.ts',
      'jsx-runtime': './src/jsx-runtime.ts',
    },
    noExternal: ['react', 'react-reconciler', 'react-devtools-core'],
    banner: {
      js: `
import ws from 'ws';
${devtoolsBanner}
    `,
    },
  },
])
