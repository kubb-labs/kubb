import { optionsCJS, optionsESM } from '@kubb/config-tsup'

import { defineConfig } from 'tsup'

// Filter out Kubbs's internal components from devtools for a cleaner view.
// Also, ince `react-devtools-shared` package isn't published on npm, we can't
// use its types, that's why there are hard-coded values in `type` fields below.
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
    value: 'Context.Provider',
    isEnabled: true,
    isValid: true,
  },
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
    value: 'kubb-file',
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
    value: 'kubb-export',
    isEnabled: true,
    isValid: true,
  },
];
`

export default defineConfig([
  {
    ...optionsCJS,
    entry: {
      index: 'src/index.ts',
      'jsx-runtime': './src/jsx-runtime.ts',
    },
    banner: {
      js: `
${devtoolsBanner}
const ws = require('ws');
    `,
    },
  },
  //   {
  //     entry: {
  //       runner: './src/runner.tsx',
  //     },
  //     format: ['cjs'],
  //     target: ['es2020', 'node16'],
  //     noExternal: [/auto-bind/, /react-devtools-core/],
  //     banner: {
  //       js: `
  // const ws = require('ws');
  //
  // const customGlobal = global;
  // customGlobal.WebSocket ||= ws;
  // customGlobal.window ||= global;
  // customGlobal.self ||= global;
  // self ||= global;
  //
  // const devtools = require('react-devtools-core');
  // if (process.env['DEVTOOLS'] === 'true') {
  //   devtools.connectToDevTools();
  // }
  //     `,
  //     },
  //   },
  {
    ...optionsESM,
    entry: {
      index: 'src/index.ts',
      'jsx-runtime': './src/jsx-runtime.ts',
    },
    banner: {
      js: `
${devtoolsBanner}
import ws from 'ws';
    `,
    },
  },
])
